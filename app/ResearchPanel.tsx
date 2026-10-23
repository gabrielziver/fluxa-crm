'use client';
/* oxlint-disable typescript/no-explicit-any */
import { useState } from 'react';
import { ArrowUpRight, Check, Search, UploadCloud } from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  website: string;
  email: string;
  phone: string;
  osmUrl: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  hasWebsite?: boolean;
};
type SearchResult = {
  candidates: Candidate[];
  found: number;
  alreadyInCrm: number;
  requested: number;
  city: string;
  state: string;
  location: string;
  provider: string;
  attribution: string;
};
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
export default function ResearchPanel({
  onImported,
}: {
  onImported: (data: unknown, location: string) => void;
}) {
  const [city, setCity] = useState('Curitiba'),
    [state, setState] = useState('PR'),
    [category, setCategory] = useState('todas'),
    [limit, setLimit] = useState(50),
    [result, setResult] = useState<SearchResult | null>(null),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [pasted, setPasted] = useState('');
  const categoryLabel: Record<string,string> = { todas:'empresas locais', restaurante:'restaurantes', barbearia:'barbearias', beleza:'salões de beleza', clinica:'clínicas', academia:'academias' };
  const mapsQuery = `${categoryLabel[category] || 'empresas locais'} em ${city.trim() || state} ${city.trim() ? state : ''}`;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;
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
  const search = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    setResult(null);
    try {
      const found = await request({
        action: 'search',
        city: city.trim(),
        state,
        category,
        limit,
      });
      setResult(found);
      setSelected(
        new Set(found.candidates.map((candidate: Candidate) => candidate.id)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na pesquisa.');
    } finally {
      setBusy(false);
    }
  };
  const importSelected = async () => {
    if (!result) return;
    setBusy(true);
    setError('');
    try {
      const candidates = result.candidates.filter((candidate) =>
        selected.has(candidate.id),
      );
      const imported = await request({
        action: 'import',
        city: result.city,
        state: result.state,
        candidates,
      });
      setMessage(
        `${imported.imported} empresa(s) adicionada(s) à fila ${result.location}.`,
      );
      onImported(imported.data, result.location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar.');
    } finally {
      setBusy(false);
    }
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
  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="research">
      <div className="research-intro">
        <span>PESQUISA QUALIFICADA · ZERO CUSTO</span>
        <h2>Encontrar empresas qualificadas</h2>
        <p>
          Escolha a região e o nicho. O Fluxa pesquisa gratuitamente em dados
          abertos do mapa e permite complementar a lista pelo Google Maps sem
          chave paga. Revise os resultados antes de importá-los.
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
          onClick={search}
        >
          <Search size={16} />
          {busy ? 'Pesquisando…' : 'Pesquisar gratuitamente'}
        </button>
      </div>
      <p className="research-note">
        A busca automática usa OpenStreetMap e servidores públicos Overpass.
        Não exige cartão. O Fluxa não dispara mensagens: ele qualifica o
        contato e abre o WhatsApp para uma abordagem revisada.
      </p>
      {error && <div className="research-error">{error}</div>}
      {message && <div className="research-message">{message}</div>}
      <section className="manual-research">
        <div>
          <span>GOOGLE MAPS ASSISTIDO · SEM API</span>
          <h3>Complementar a pesquisa no Google Maps</h3>
          <p>
            Abra o mapa com a cidade e o nicho preenchidos, escolha empresas e
            cole os dados abaixo. Você pode usar uma linha com barras ou colar
            um bloco por empresa, separando as empresas por uma linha vazia. O
            CRM organiza por região e elimina nomes repetidos.
          </p>
        </div>
        <a href={mapsUrl} target="_blank" rel="noreferrer">
          <ArrowUpRight size={16} /> Abrir busca no Google Maps
        </a>
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
      </section>
      {result && (
        <>
          <div className="research-results-head">
            <div>
              <h3>{result.location}</h3>
              <p>
                {result.candidates.length} nova(s) empresa(s) encontrada(s) para
                uma meta de {result.requested}. {result.found} registro(s)
                relevantes no mapa antes de retirar duplicatas. Fonte:{' '}
                {result.provider}.
              </p>
            </div>
            <button
              className="primary"
              disabled={busy || !selected.size}
              onClick={importSelected}
            >
              <UploadCloud size={16} /> Importar {selected.size} para prospecção
            </button>
          </div>
          {result.candidates.length ? (
            <div className="research-list">
              {result.candidates.map((candidate) => (
                <article key={candidate.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.has(candidate.id)}
                      onChange={() => toggle(candidate.id)}
                    />
                    <span>
                      <strong>{candidate.name}</strong>
                      <small>
                        {candidate.address || result.location} ·{' '}
                        {candidate.category.replaceAll('_', ' ')}
                      </small>
                      <small className="candidate-signals">
                        {(candidate.hasWebsite ?? Boolean(candidate.website)) ? 'Com site' : 'Sem site'} · {candidate.rating ? `★ ${candidate.rating.toFixed(1)}` : 'Sem nota'} · {candidate.reviewCount || 0} avaliações
                      </small>
                      <small>
                        {candidate.website ||
                          candidate.email ||
                          candidate.phone ||
                          'Sem contato cadastrado — verificar manualmente'}
                      </small>
                    </span>
                  </label>
                  <a
                    href={candidate.osmUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Ver ${candidate.name} no mapa`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Check size={20} />
              <strong>Nenhuma empresa nova nesta busca.</strong>
              <p>
                Tente outra categoria ou cidade. A cobertura do mapa pode ser
                limitada.
              </p>
            </div>
          )}
          <p className="research-credit">{result.attribution}</p>
        </>
      )}
    </div>
  );
}
