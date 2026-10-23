const announce = () => window.postMessage({ type: 'FLUXA_COMPANION_READY' }, window.location.origin);

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.type === 'FLUXA_COMPANION_PING') announce();
  if (event.data?.type === 'FLUXA_PHONE_REQUEST') {
    const { requestId, payload } = event.data;
    chrome.runtime.sendMessage({ type: 'FLUXA_PHONE_LOOKUP', requestId, payload }, (response) => {
      window.postMessage({
        type: response?.ok ? 'FLUXA_PHONE_RESULT' : 'FLUXA_PHONE_ERROR',
        requestId,
        phone: response?.phone || '',
        error: response?.error || 'Não foi possível localizar o telefone.',
      }, window.location.origin);
    });
    return;
  }
  if (event.data?.type !== 'FLUXA_SEARCH_REQUEST') return;

  const { requestId, payload } = event.data;
  chrome.runtime.sendMessage({ type: 'FLUXA_SEARCH', requestId, payload }, (response) => {
    if (chrome.runtime.lastError) {
      window.postMessage({
        type: 'FLUXA_SEARCH_ERROR',
        requestId,
        error: 'O complemento perdeu a conexão. Recarregue o Fluxa e tente novamente.',
      }, window.location.origin);
      return;
    }
    window.postMessage({
      type: response?.ok ? 'FLUXA_SEARCH_RESULT' : 'FLUXA_SEARCH_ERROR',
      requestId,
      rows: response?.rows || [],
      error: response?.error || '',
    }, window.location.origin);
  });
});

announce();
