const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function numberFrom(text) {
  return Number(String(text || '').replace(/[^\d]/g, '')) || 0;
}

function scrapeArticle(article) {
  const placeLink = article.querySelector('a[href*="/maps/place/"]');
  const mapUrl = placeLink?.href || '';
  const name = placeLink?.getAttribute('aria-label') || '';
  if (!name || !mapUrl) return null;

  const text = article.innerText.split('\n').map((item) => item.trim()).filter(Boolean);
  const ratingLabel = article.querySelector('[role="img"][aria-label*="estrela"], [aria-label*=" estrelas"]')?.getAttribute('aria-label') || '';
  const rating = Number((ratingLabel.match(/[1-5][,.]\d/)?.[0] || '').replace(',', '.')) || 0;
  const reviewText = text.find((item) => /^\(?[\d.]+\)?$/.test(item) && numberFrom(item) > 5) || ratingLabel;
  const reviewCount = numberFrom(reviewText.replace(/[1-5][,.]\d/, ''));
  const address = text.find((item) => /^(?:R\.|Rua|Av\.|Avenida|Alameda|Travessa|Estrada|Rodovia|Praça)\s/i.test(item)) || '';
  const category = text.find((item) => /^(?:Barbearia|Restaurante|Café|Academia|Clínica|Consultório|Salão|Centro de estética|Loja|Empresa)$/i.test(item)) || 'negócio local';
  const image = article.querySelector('img[src^="http"]')?.src || '';
  const phone = text.find((item) => /(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/.test(item)) || '';

  return { name, mapUrl, address, category, image, phone, rating, reviewCount };
}

async function collect(limit) {
  const feed = document.querySelector('[role="feed"]');
  if (!feed) throw new Error('A lista de resultados do Google Maps não apareceu. Tente outra cidade ou nicho.');

  let unchanged = 0;
  let previous = 0;
  for (let round = 0; round < 35; round += 1) {
    const count = feed.querySelectorAll('[role="article"]').length;
    if (count >= limit) break;
    unchanged = count === previous ? unchanged + 1 : 0;
    if (unchanged >= 4 || feed.innerText.includes('Você chegou ao final da lista')) break;
    previous = count;
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
    await pause(900 + Math.floor(Math.random() * 500));
  }

  const unique = new Map();
  for (const article of feed.querySelectorAll('[role="article"]')) {
    const row = scrapeArticle(article);
    if (row && !unique.has(row.mapUrl)) unique.set(row.mapUrl, row);
    if (unique.size >= limit) break;
  }
  const rows = [...unique.values()];
  if (!rows.length) throw new Error('Nenhuma empresa foi encontrada nessa pesquisa.');
  return rows;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FLUXA_SCRAPE_MAPS') return false;
  collect(Math.min(60, Math.max(1, Number(message.limit || 30))))
    .then((rows) => sendResponse({ ok: true, rows }))
    .catch((error) => sendResponse({ ok: false, error: error.message || 'Falha ao ler o Google Maps.' }));
  return true;
});
