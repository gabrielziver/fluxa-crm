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

const askMapTab = (tabId, limit) => new Promise((resolve, reject) => {
  chrome.tabs.sendMessage(tabId, { type: 'FLUXA_SCRAPE_MAPS', limit }, (response) => {
    if (chrome.runtime.lastError) reject(new Error('Não consegui ler os resultados carregados no Google Maps.'));
    else if (!response?.ok) reject(new Error(response?.error || 'A pesquisa não retornou empresas.'));
    else resolve(response.rows || []);
  });
});

async function research(query, limit) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  const tab = await chrome.tabs.create({ url, active: false });
  try {
    await waitForTab(tab.id);
    return await askMapTab(tab.id, limit);
  } finally {
    if (tab.id) await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FLUXA_SEARCH') return false;
  const query = String(message.payload?.query || '').trim().slice(0, 160);
  const limit = Math.min(60, Math.max(1, Number(message.payload?.limit || 30)));
  if (!query) {
    sendResponse({ ok: false, error: 'Informe cidade e nicho para pesquisar.' });
    return false;
  }
  research(query, limit)
    .then((rows) => sendResponse({ ok: true, rows }))
    .catch((error) => sendResponse({ ok: false, error: error.message || 'Falha ao pesquisar.' }));
  return true;
});
