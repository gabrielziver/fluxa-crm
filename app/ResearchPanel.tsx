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
    [message, setMessage] = useState('');
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
        `${imported.imported} agência(s) adicionada(s) à fila ${result.location}.`,
      );
      onImported(imported.data, result.location);
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
        <span>PESQUISA GRATUITA · OPENSTREETMAP</span>
        <h2>Montar uma lista por cidade</h2>
        <p>
          Escolha a região, o tipo de agência e uma meta. A busca mostra apenas
          registros disponíveis no mapa — 50 é um limite desejado, não uma
          garantia. Revise os resultados antes de importá-los.
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
          Tipo de agência
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="todas">Comunicação, marketing e design</option>
            <option value="marketing">Marketing / publicidade</option>
            <option value="comunicacao">Comunicação / mídia</option>
            <option value="design">Design gráfico</option>
          </select>
        </label>
        <label>
          Meta de resultados
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
        <button
          className="primary"
          disabled={busy || !state || limit < 1 || limit > 100}
          onClick={search}
        >
          <Search size={16} />
          {busy ? 'Pesquisando…' : 'Pesquisar agências'}
        </button>
      </div>
      <p className="research-note">
        A fonte é comunitária e pode estar incompleta ou temporariamente
        indisponível. Sem Google Maps pago e sem disparo automático de
        mensagens.
      </p>
      {error && <div className="research-error">{error}</div>}
      {message && <div className="research-message">{message}</div>}
      {result && (
        <>
          <div className="research-results-head">
            <div>
              <h3>{result.location}</h3>
              <p>
                {result.candidates.length} nova(s) agência(s) encontrada(s) para
                uma meta de {result.requested}. {result.found} registro(s)
                relevantes no mapa antes de retirar duplicatas.
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
                    aria-label={`Ver ${candidate.name} no OpenStreetMap`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Check size={20} />
              <strong>Nenhuma agência nova nesta busca.</strong>
              <p>
                Tente outra categoria ou cidade. A cobertura do mapa pode ser
                limitada.
              </p>
            </div>
          )}
          <p className="research-credit">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              © OpenStreetMap contributors · ODbL
            </a>
          </p>
        </>
      )}
    </div>
  );
}
