const waitForTab = (tabId) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(listener);
    reject(new Error('O Google Maps demorou demais para carregar.'));
  }, 30000);
  const listener = (updatedId, info) => {
    if (updatedId === tabId && info.status === 'complete') {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      setTimeout(resolve, 1800);
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
  chrome.tabs.get(tabId, (tab) => {
    if (tab?.status === 'complete') {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      setTimeout(resolve, 1800);
    }
  });
});

const askTab = (tabId, message) => new Promise((resolve, reject) => {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) reject(new Error('Não consegui ler os resultados carregados no Google Maps.'));
    else if (!response?.ok) reject(new Error(response?.error || 'O Google Maps não retornou os dados esperados.'));
    else resolve(response);
  });
});

async function inspectPlace(row, fallbackCategory, requirePhone = false) {
  const tab = await chrome.tabs.create({ url: row.mapUrl, active: false });
  try {
    await waitForTab(tab.id);
    const response = await askTab(tab.id, { type: 'FLUXA_SCRAPE_PLACE', requirePhone });
    return {
      ...row,
      ...response.details,
      category: response.details?.category || row.category || fallbackCategory,
      contact: response.details?.website || '',
    };
  } finally {
    if (tab.id) await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

async function enrichWithoutWebsite(rows, target, fallbackCategory, seen) {
  const matches = [];
  const pending = rows.filter((row) => !seen.has(row.mapUrl));
  for (let index = 0; index < pending.length && matches.length < target; index += 2) {
    const batch = pending.slice(index, index + 2);
    batch.forEach((row) => seen.add(row.mapUrl));
    const inspected = await Promise.allSettled(batch.map((row) => inspectPlace(row, fallbackCategory)));
    for (const item of inspected) {
      if (item.status !== 'fulfilled') continue;
      const row = item.value;
      if (row.websiteVerified && !row.website) matches.push(row);
      if (matches.length >= target) break;
    }
  }
  return matches;
}

const MIXED_NICHES = [
  'academias',
  'barbearias',
  'salões de beleza',
  'clínicas odontológicas',
  'imobiliárias',
  'empresas de energia solar',
  'pet shops',
  'escritórios de contabilidade',
  'restaurantes',
];

async function candidatesFor(query, scanLimit) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  const tab = await chrome.tabs.create({ url, active: false });
  try {
    await waitForTab(tab.id);
    const response = await askTab(tab.id, { type: 'FLUXA_SCRAPE_MAPS', limit: scanLimit });
    return response.rows || [];
  } finally {
    if (tab.id) await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

async function research(payload) {
  const requested = Math.min(10, Math.max(1, Number(payload.limit || 10)));
  const category = String(payload.category || 'negócio local');
  const location = String(payload.location || '').trim();
  const queries = payload.categoryKey === 'todas' && location
    ? MIXED_NICHES.map((niche) => `${niche} em ${location}`)
    : [String(payload.query || '').trim()];
  const matches = [];
  const seen = new Set();
  let inspectedSearches = 0;

  for (const query of queries) {
    if (!query || matches.length >= requested) break;
    try {
      const remaining = requested - matches.length;
      const candidates = await candidatesFor(query, Math.min(45, Math.max(18, remaining * 4)));
      inspectedSearches += 1;
      const found = await enrichWithoutWebsite(candidates, remaining, category, seen);
      matches.push(...found);
    } catch {
      inspectedSearches += 1;
    }
  }

  if (!matches.length)
    throw new Error(`Pesquisei ${inspectedSearches || 1} grupo(s) no Google Maps, mas nenhum negócio sem site foi confirmado. Informe uma cidade e tente um nicho específico.`);
  return matches;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'FLUXA_PHONE_LOOKUP') {
    const mapUrl = String(message.payload?.mapUrl || '');
    if (!/^https:\/\/(?:www\.)?google\.com\/maps\//i.test(mapUrl)) {
      sendResponse({ ok: false, error: 'Link público do Google Maps não encontrado.' });
      return false;
    }
    inspectPlace({ mapUrl }, '', true)
      .then((row) => row.phone
        ? sendResponse({ ok: true, phone: row.phone })
        : sendResponse({ ok: false, error: 'O Google Maps não exibiu um telefone público para esta empresa.' }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Falha ao localizar o telefone.' }));
    return true;
  }
  if (message?.type !== 'FLUXA_SEARCH') return false;
  const query = String(message.payload?.query || '').trim().slice(0, 160);
  const limit = Math.min(10, Math.max(1, Number(message.payload?.limit || 10)));
  const category = String(message.payload?.category || 'negócio local').trim().slice(0, 80);
  if (!query) {
    sendResponse({ ok: false, error: 'Informe cidade e nicho para pesquisar.' });
    return false;
  }
  research({ ...message.payload, query, limit, category })
    .then((rows) => sendResponse({ ok: true, rows }))
    .catch((error) => sendResponse({ ok: false, error: error.message || 'Falha ao pesquisar.' }));
  return true;
});
