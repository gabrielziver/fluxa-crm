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
});

const askTab = (tabId, message) => new Promise((resolve, reject) => {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) reject(new Error('Não consegui ler os resultados carregados no Google Maps.'));
    else if (!response?.ok) reject(new Error(response?.error || 'O Google Maps não retornou os dados esperados.'));
    else resolve(response);
  });
});

async function inspectPlace(row, fallbackCategory) {
  const tab = await chrome.tabs.create({ url: row.mapUrl, active: false });
  try {
    await waitForTab(tab.id);
    const response = await askTab(tab.id, { type: 'FLUXA_SCRAPE_PLACE' });
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

async function enrichWithoutWebsite(rows, target, fallbackCategory) {
  const matches = [];
  for (let index = 0; index < rows.length && matches.length < target; index += 3) {
    const batch = rows.slice(index, index + 3);
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

async function research(query, limit, category) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  const tab = await chrome.tabs.create({ url, active: false });
  let candidates;
  try {
    await waitForTab(tab.id);
    const scanLimit = Math.min(90, Math.max(24, limit * 4));
    const response = await askTab(tab.id, { type: 'FLUXA_SCRAPE_MAPS', limit: scanLimit });
    candidates = response.rows || [];
  } finally {
    if (tab.id) await chrome.tabs.remove(tab.id).catch(() => {});
  }
  const rows = await enrichWithoutWebsite(candidates, limit, category);
  if (!rows.length)
    throw new Error('Verifiquei os resultados, mas não encontrei empresas sem site nesta busca. Tente outra região ou um nicho mais específico.');
  return rows;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FLUXA_SEARCH') return false;
  const query = String(message.payload?.query || '').trim().slice(0, 160);
  const limit = Math.min(60, Math.max(1, Number(message.payload?.limit || 30)));
  const category = String(message.payload?.category || 'negócio local').trim().slice(0, 80);
  if (!query) {
    sendResponse({ ok: false, error: 'Informe cidade e nicho para pesquisar.' });
    return false;
  }
  research(query, limit, category)
    .then((rows) => sendResponse({ ok: true, rows }))
    .catch((error) => sendResponse({ ok: false, error: error.message || 'Falha ao pesquisar.' }));
  return true;
});
