'use client';
/* oxlint-disable typescript/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { Download, Search, UploadCloud } from 'lucide-react';
const STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function instantDataRows(text: string) {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0];
  const mapIndex = Math.max(0, header.findIndex((value) => /href/i.test(value)));
  const nameIndex = header.findIndex((value) => /xxVWCe/i.test(value));
  const ratingIndex = header.findIndex((value) => /MW4etd/i.test(value));
  const reviewsIndex = header.findIndex((value) => /UY7F9/i.test(value));
  const categoryIndex = header.findIndex((value) => /^W4Efsd$/i.test(value));
  return table.slice(1).map((cells) => {
    const mapUrl = cells[mapIndex] || cells.find((value) => /google\.com\/maps\/place/i.test(value)) || '';
    const name = (nameIndex >= 0 ? cells[nameIndex] : cells[mapIndex + 1]) || '';
    const address = cells.find((value) => /^(?:R\.|Rua|Av\.|Avenida|Alameda|Travessa|Estrada|Rodovia|Praça)\s/i.test(value)) || '';
    const image = cells.find((value) => /^https?:\/\/(?:lh3\.googleusercontent|streetviewpixels-pa\.googleapis)\.com/i.test(value)) || '';
    const rating = Number(((ratingIndex >= 0 ? cells[ratingIndex] : '') || '').replace(',', '.')) || 0;
    const reviewCount = Number(((reviewsIndex >= 0 ? cells[reviewsIndex] : '') || '').replace(/\D/g, '')) || 0;
    return {
      name,
      mapUrl,
      address,
      image,
      rating,
      reviewCount,
      category: (categoryIndex >= 0 ? cells[categoryIndex] : '') || 'negócio local',
    };
  }).filter((row) => row.name && row.mapUrl.includes('google.com/maps/'));
}
export default function ResearchPanel({
  onImported,
}: {
  onImported: (data: unknown, location: string) => void;
}) {
  const [city, setCity] = useState('Curitiba'),
    [state, setState] = useState('PR'),
    [category, setCategory] = useState('todas'),
    [limit, setLimit] = useState(50),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [pasted, setPasted] = useState(''),
    [scraperFile, setScraperFile] = useState(''),
    [extensionReady, setExtensionReady] = useState(false);
  const activeRequest = useRef('');
  const categoryLabel: Record<string,string> = { todas:'empresas locais', restaurante:'restaurantes', barbearia:'barbearias', beleza:'salões de beleza', clinica:'clínicas', academia:'academias' };
  const mapsQuery = `${categoryLabel[category] || 'empresas locais'} em ${city.trim() || state} ${city.trim() ? state : ''}`;
  const request = async (body: Record<string, unknown>): Promise<any> => {
    const response = await fetch('/api/crm/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json: any = await response.json();
    if (!response.ok)
      throw new Error(json.error || 'Não foi possível pesquisar.');
    return json;
  };
  const importAutomaticRows = async (rows: unknown[]) => {
    const imported = await request({
      action: 'import_pasted',
      city: city.trim(),
      state,
      rows,
    });
    setMessage(`${imported.imported} empresa(s) encontradas e organizadas automaticamente na fila ${imported.location}.`);
    onImported(imported.data, imported.location);
  };
  useEffect(() => {
    const handleCompanion = (event: MessageEvent) => {
      if (event.source !== window || !event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'FLUXA_COMPANION_READY') setExtensionReady(true);
      if (event.data.type === 'FLUXA_SEARCH_RESULT' && event.data.requestId === activeRequest.current) {
        activeRequest.current = '';
        void importAutomaticRows(Array.isArray(event.data.rows) ? event.data.rows : [])
          .catch((reason) => setError(reason instanceof Error ? reason.message : 'Falha ao importar resultados.'))
          .finally(() => setBusy(false));
      }
      if (event.data.type === 'FLUXA_SEARCH_ERROR' && event.data.requestId === activeRequest.current) {
        activeRequest.current = '';
        setBusy(false);
        setError(event.data.error || 'O complemento não conseguiu concluir a pesquisa.');
      }
    };
    window.addEventListener('message', handleCompanion);
    window.postMessage({ type: 'FLUXA_COMPANION_PING' }, window.location.origin);
    return () => window.removeEventListener('message', handleCompanion);
  }, [city, state]);
  const automaticSearch = () => {
    setError('');
    setMessage('');
    if (!extensionReady) {
      setError('O complemento Fluxa Prospector ainda não está instalado ou ativado neste navegador. Baixe-o abaixo e faça a instalação única.');
      return;
    }
    const requestId = crypto.randomUUID();
    activeRequest.current = requestId;
    setBusy(true);
    window.postMessage({
      type: 'FLUXA_SEARCH_REQUEST',
      requestId,
      payload: { query: mapsQuery, limit: Math.min(60, Math.max(1, limit)) },
    }, window.location.origin);
  };
  const importPasted = async () => {
    setError('');
    const pipeRows = pasted
      .split(/\r?\n/)
      .filter((line) => line.includes('|'))
      .map((line) => {
        const [name, contact, email, phone] = line.split('|').map((part) => part.trim());
        return { name, contact, email, phone };
      });
    const copiedBlocks = pasted
      .split(/\r?\n\s*\r?\n/)
      .filter((block) => !block.includes('|'))
      .map((block) => {
        const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const contact = lines.find((line) => /^https?:\/\//i.test(line)) || '';
        const email = lines.find((line) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) || '';
        const phone = lines.find((line) => /(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/.test(line)) || '';
        const name = lines.find((line) => line !== contact && line !== email && line !== phone) || '';
        return { name, contact, email, phone };
      });
    const rows = [...pipeRows, ...copiedBlocks].filter((row) => row.name);
    if (!rows.length) {
      setError('Cole ao menos uma empresa, uma por linha.');
      return;
    }
    if (rows.length > 100) {
      setError('Importe no máximo 100 empresas por vez.');
      return;
    }
    setBusy(true);
    try {
      const imported = await request({
        action: 'import_pasted',
        city: city.trim(),
        state,
        rows,
      });
      setMessage(
        `${imported.imported} empresa(s) adicionada(s) à fila ${imported.location}.`,
      );
      onImported(imported.data, imported.location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar.');
    } finally {
      setBusy(false);
    }
  };
  const importScraperCsv = async (file: File) => {
    setBusy(true);
    setError('');
    setMessage('');
    setScraperFile(file.name);
    try {
      const rows = instantDataRows(await file.text());
      if (!rows.length)
        throw new Error('Não encontrei empresas nesse CSV. No Instant Data Scraper, clique em “Try another table” até aparecer a tabela com os nomes e links do Google Maps.');
      if (rows.length > 100)
        throw new Error('O arquivo tem mais de 100 empresas. Exporte ou divida em lotes de até 100.');
      const imported = await request({
        action: 'import_pasted',
        city: city.trim(),
        state,
        rows,
      });
      setMessage(`${imported.imported} empresa(s) do Instant Data Scraper adicionada(s) à fila ${imported.location}.`);
      onImported(imported.data, imported.location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar o CSV.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="research">
      <div className="research-intro">
        <span>PESQUISA QUALIFICADA · ZERO CUSTO</span>
        <h2>Encontrar empresas qualificadas</h2>
        <p>
          Escolha a região e o nicho. O Fluxa abre a busca pronta no Google
          Maps, recebe o CSV do Instant Data Scraper e transforma os resultados
          em leads qualificados sem API paga.
        </p>
      </div>
      <div className="research-form">
        <label>
          Cidade <small>(opcional para buscar no estado inteiro)</small>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Curitiba"
          />
        </label>
        <label>
          Estado
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </select>
        </label>
        <label>
          Nicho
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="todas">Todos os negócios locais</option>
            <option value="restaurante">Restaurantes e alimentação</option>
            <option value="barbearia">Barbearias</option>
            <option value="beleza">Salões e estética</option>
            <option value="clinica">Clínicas e consultórios</option>
            <option value="academia">Academias e fitness</option>
          </select>
        </label>
        <label>
          Meta de resultados
          <input
            type="number"
            min="1"
            max="60"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
        <button
          className="primary"
          disabled={busy || !state || limit < 1 || limit > 60}
          onClick={automaticSearch}
        >
          <Search size={16} />
          {busy ? 'Pesquisando e organizando…' : 'Pesquisar automaticamente'}
        </button>
      </div>
      <p className="research-note">
        {extensionReady
          ? 'Complemento Fluxa Prospector conectado. A pesquisa e a importação acontecem em um clique.'
          : 'Para a pesquisa realmente automática e sem API paga, instale uma única vez o complemento Fluxa Prospector no Brave.'}
      </p>
      {error && <div className="research-error">{error}</div>}
      {message && <div className="research-message">{message}</div>}
      <section className="manual-research">
        <div>
          <span>COMPLEMENTO LOCAL · SEM API PAGA</span>
          <h3>Ativar a pesquisa automática</h3>
          <p>
            O complemento abre o Google Maps em segundo plano, percorre os
            resultados públicos e devolve tudo organizado ao Fluxa. Ele limita
            cada pesquisa a 60 empresas, usa pausas entre as rolagens e não
            tenta contornar bloqueios ou verificações do Google.
          </p>
        </div>
        <a href="/fluxa-prospector-extension.zip" download>
          <Download size={16} /> Baixar complemento Fluxa Prospector
        </a>
        <small className={`companion-status ${extensionReady ? 'connected' : ''}`}>
          {extensionReady ? '● Complemento conectado' : '○ Complemento ainda não detectado'}
        </small>
        <label className="scraper-upload">
          <strong>Plano B: importar CSV do Instant Data Scraper</strong>
          <small>{scraperFile || 'Se preferir, o importador de CSV continua disponível'}</small>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importScraperCsv(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <details>
          <summary>Importação alternativa por texto</summary>
          <label>
            Uma empresa por linha:{' '}
            <code>
              Nome | https://site-ou-contato | email@empresa.com | telefone
            </code>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={
                'Empresa Exemplo | https://exemplo.com.br | contato@exemplo.com.br | (41) 99999-9999\nOutra Empresa | https://outra.com.br'
              }
            />
          </label>
          <button
            className="outline"
            disabled={busy || !pasted.trim()}
            onClick={importPasted}
          >
            <UploadCloud size={16} /> Importar lista colada
          </button>
        </details>
      </section>
    </div>
  );
}
