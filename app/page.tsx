'use client';
/* oxlint-disable typescript/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Copy,
  DollarSign,
  ExternalLink,
  HandCoins,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import ResearchPanel from './ResearchPanel';
import PreviewStudio from './PreviewStudio';
import { initialMessage, positiveReplyMessage, secondMessage, whatsappLink } from '@/lib/outreach';

type Lead = Record<string, any>;
type Client = Record<string, any>;
type Data = {
  leads: Lead[];
  events: Lead[];
  notes: Lead[];
  clients: Client[];
  previews: Lead[];
  metrics: Record<string, number | null>;
  stages: string[];
};
type Tab = 'dashboard' | 'fila' | 'pesquisa' | 'previews' | 'followups' | 'clientes' | 'guia';
const CATEGORIES = ['Social Media', 'Landing Page', 'Tráfego Pago', 'Branding', 'Consultoria', 'Desenvolvimento', 'Outros'];
const emptyClient = () => ({ name: '', status: 'active', category: 'Social Media', receivable: '', expenses: '', totalRevenue: '', referenceMonth: new Date().toISOString().slice(0, 7), services: [{ description: '', value: '' }] });
const firstMessage = (lead: Lead) => initialMessage(lead.city, lead.clinic);
const followupText = (name: string) =>
  `Oi, pessoal da ${name}! Passando para retomar minha mensagem sobre apoio pontual em criativos, landing pages ou automações. Existe alguma demanda em que um parceiro de execução possa ajudar vocês esta semana?`;
const cleanStage = (stage: string) => stage.replace(/^\d+\s/, '');
const formatDate = (value?: string) =>
  value
    ? new Date(
        value.length === 10 ? `${value}T12:00:00` : value,
      ).toLocaleDateString('pt-BR')
    : '—';
const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value || 0,
  );
const safeSources = (value: string) => {
  try {
    return JSON.parse(value || '[]') as {
      type: string;
      url: string;
      use: string;
    }[];
  } catch {
    return [];
  }
};
const googleMapsSource = (lead: Lead) =>
  safeSources(lead.sources_json).find((source) =>
    source.url.includes('google.com/maps/'),
  )?.url || '';

export default function Page() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState<Tab>('dashboard'),
    [city, setCity] = useState('Curitiba · PR'),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('A abordar'),
    [toast, setToast] = useState(''),
    [showAdd, setShowAdd] = useState(false),
    [showClient, setShowClient] = useState(false),
    [editingClient, setEditingClient] = useState<string | null>(null),
    [clientDraft, setClientDraft] = useState<any>(emptyClient()),
    [draft, setDraft] = useState({
      name: '',
      city: 'Recife',
      state: 'PE',
      contact: '',
      email: '',
      focus: '',
      opportunity: '',
      opening: '',
    }),
    [note, setNote] = useState(''),
    [followDate, setFollowDate] = useState(''),
    [saleValue, setSaleValue] = useState(''),
    [contactDraft, setContactDraft] = useState({
      contact: '',
      email: '',
      phone: '',
    });
  useEffect(() => {
    const lead = data?.leads.find((item) => item.id === selectedId);
    if (lead)
      setContactDraft({
        contact: lead.whatsapp_url || '',
        email: lead.instagram || '',
        phone: lead.phone || '',
      });
  }, [data, selectedId]);
  const refresh = useCallback(async () => {
    try {
      setError('');
      const response = await fetch('/api/crm', { cache: 'no-store' });
      const json: any = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao carregar.');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.');
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };
  const post = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json: any = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao salvar.');
      setData(json);
      notify('Atualizado com sucesso.');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value: string, label = 'Copiado.') => {
    try {
      await navigator.clipboard.writeText(value);
      notify(label);
    } catch {
      setError('Não foi possível copiar. Selecione o texto manualmente.');
    }
  };
  const lookupWhatsapp = async (lead: Lead) => {
    const mapUrl = googleMapsSource(lead);
    if (!mapUrl) {
      setError('Esta empresa não tem uma ficha do Google Maps salva.');
      return;
    }
    const popup = window.open('', '_blank');
    if (popup) popup.document.body.textContent = 'Localizando o WhatsApp da empresa…';
    setBusy(true);
    try {
      const requestId = crypto.randomUUID();
      const phone = await new Promise<string>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          window.removeEventListener('message', handleResult);
          reject(new Error('O complemento não respondeu. Atualize o Fluxa Prospector e tente novamente.'));
        }, 40000);
        const handleResult = (event: MessageEvent) => {
          if (event.source !== window || event.data?.requestId !== requestId) return;
          if (!['FLUXA_PHONE_RESULT', 'FLUXA_PHONE_ERROR'].includes(event.data?.type)) return;
          window.clearTimeout(timeout);
          window.removeEventListener('message', handleResult);
          if (event.data.type === 'FLUXA_PHONE_RESULT') resolve(String(event.data.phone || ''));
          else reject(new Error(event.data.error || 'Telefone não encontrado.'));
        };
        window.addEventListener('message', handleResult);
        window.postMessage({ type: 'FLUXA_PHONE_REQUEST', requestId, payload: { mapUrl } }, window.location.origin);
      });
      const link = whatsappLink(phone, firstMessage(lead));
      if (!link) throw new Error('O número encontrado não tem um formato válido para WhatsApp.');
      await post({
        id: lead.id,
        action: 'update_contact',
        contact: lead.whatsapp_url || '',
        email: lead.instagram || '',
        phone,
      });
      if (popup) popup.location.href = link;
      else window.open(link, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      popup?.close();
      setError(reason instanceof Error ? reason.message : 'Não foi possível localizar o WhatsApp.');
    } finally {
      setBusy(false);
    }
  };
  const selected = data?.leads.find((l) => l.id === selectedId) || null;
  const groups = useMemo(() => {
    const all = data?.leads || [];
    const scoped = all.filter((l) => l.location === city);
    const today = new Date().toISOString().slice(0, 10);
    return {
      'A abordar': scoped.filter((l) =>
        ['01 PESQUISADA', '02 PRONTA'].includes(l.stage),
      ),
      'Em conversa': scoped.filter((l) =>
        [
          '03 MENSAGEM ENVIADA',
          '04 RESPONDEU',
          '05 DEMANDA IDENTIFICADA',
          '06 PROPOSTA ENVIADA',
        ].includes(l.stage),
      ),
      Fechadas: scoped.filter((l) => l.stage === '07 FECHADA'),
      Perdidas: scoped.filter((l) => l.stage === '08 PERDIDA'),
      Todos: scoped,
      'Follow-ups': all.filter(
        (l) =>
          l.next_follow_up_at &&
          l.next_follow_up_at.slice(0, 10) <= today &&
          !['07 FECHADA', '08 PERDIDA'].includes(l.stage),
      ),
    };
  }, [data, city]);
  const visible = (
    groups[filter as keyof typeof groups] || groups.Todos
  ).filter((l) =>
    `${l.clinic} ${l.services} ${l.site_issue}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const due = groups['Follow-ups'].sort((a, b) =>
    a.next_follow_up_at.localeCompare(b.next_follow_up_at),
  );
  const add = async () => {
    if (await post({ type: 'add_lead', ...draft })) {
      setShowAdd(false);
      setCity(`${draft.city.trim()} · ${draft.state.trim().toUpperCase()}`);
      setDraft({
        name: '',
        city: 'Recife',
        state: 'PE',
        contact: '',
        email: '',
        focus: '',
        opportunity: '',
        opening: '',
      });
      setFilter('Todos');
    }
  };
  const cityBatches = [
    ...new Set([
      ...(data?.leads || []).map((l) => String(l.location)),
    ]),
  ];
  const action = async (lead: Lead, name: string, value?: number) => {
    if (await post({ id: lead.id, action: name, value })) {
      if (name === 'sale') setSaleValue('');
    }
  };
  const removeLead = async (lead: Lead) => {
    if (!confirm(`Excluir ${lead.clinic} definitivamente da lista?`)) return;
    if (await post({ type: 'lead_delete', id: lead.id })) {
      if (selectedId === lead.id) setSelectedId(null);
    }
  };
  const removeBatch = async (location: string, count: number) => {
    if (!confirm(`Excluir definitivamente as ${count} empresa${count === 1 ? '' : 's'} do lote ${location}?`)) return;
    if (await post({ type: 'lead_batch_delete', location })) {
      const nextLocation = (data?.leads || []).find((lead) => lead.location !== location)?.location || '';
      if (city === location) setCity(nextLocation);
      setSelectedId(null);
    }
  };
  const editClient = (client?: Client) => {
    if (!client) {
      setEditingClient(null);
      setClientDraft(emptyClient());
    } else {
      let services = [];
      try { services = JSON.parse(client.services_json || '[]'); } catch { services = []; }
      setEditingClient(client.id);
      setClientDraft({ name: client.name, status: client.status, category: client.category, receivable: String(client.receivable || ''), expenses: String(client.expenses || ''), totalRevenue: String(client.total_revenue || ''), referenceMonth: client.reference_month, services: services.length ? services.map((s:any) => ({ description: s.description, value: String(s.value || '') })) : [{ description: '', value: '' }] });
    }
    setShowClient(true);
  };
  const saveClient = async () => {
    const ok = await post({ type: editingClient ? 'client_update' : 'client_create', id: editingClient || undefined, ...clientDraft, receivable: Number(clientDraft.receivable), expenses: Number(clientDraft.expenses), totalRevenue: Number(clientDraft.totalRevenue), services: clientDraft.services.map((s:any) => ({ description: s.description, value: Number(s.value) })) });
    if (ok) setShowClient(false);
  };
  if (error && !data)
    return (
      <main className="loading">
        <h1>Não foi possível abrir o CRM</h1>
        <p>{error}</p>
        <button onClick={refresh}>Tentar novamente</button>
      </main>
    );
  if (!data)
    return (
      <main className="loading">
        <Sparkles />
        <p>Preparando a operação comercial…</p>
      </main>
    );
  const m = data.metrics;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeClients = data.clients.filter((client) => client.status === 'active');
  const monthRevenue = data.clients.reduce((sum, client) => sum + ((client.status === 'active' || client.reference_month === currentMonth) ? Number(client.monthly_revenue || 0) : 0), 0);
  const receivable = data.clients.reduce((sum, client) => sum + Number(client.receivable || 0), 0);
  const expenses = data.clients.reduce((sum, client) => sum + Number(client.expenses || 0), 0);
  const categories = CATEGORIES.map((name) => ({ name, value: data.clients.filter((client) => client.category === name).reduce((sum, client) => sum + Number(client.monthly_revenue || 0), 0) })).filter((item) => item.value > 0);
  const categoryTotal = categories.reduce((sum, item) => sum + item.value, 0) || 1;
  const pipeline = [
    { name: 'A abordar', value: data.leads.filter((lead) => ['01 PESQUISADA','02 PRONTA'].includes(lead.stage)).length },
    { name: 'Em conversa', value: data.leads.filter((lead) => ['03 MENSAGEM ENVIADA','04 RESPONDEU','05 DEMANDA IDENTIFICADA','06 PROPOSTA ENVIADA'].includes(lead.stage)).length },
    { name: 'Fechadas', value: data.leads.filter((lead) => lead.stage === '07 FECHADA').length },
  ];
  const maxPipeline = Math.max(1, ...pipeline.map((item) => item.value));
  return (
    <div className="shell">
      <aside className="nav">
        <div className="brand">
          <span className="brand-icon">
            <Sparkles size={19} />
          </span>
          <div>
            <strong>Fluxa CRM</strong>
            <small>Prospecção e sites</small>
          </div>
        </div>
        <div className="nav-section">OPERAÇÃO</div>
        <button
          className={tab === 'dashboard' ? 'active' : ''}
          onClick={() => setTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          Visão geral
        </button>
        <button
          className={tab === 'fila' ? 'active' : ''}
          onClick={() => setTab('fila')}
        >
          <Target size={18} />
          Prospecção
          <ChevronRight size={15} />
        </button>
        <button
          className={tab === 'pesquisa' ? 'active' : ''}
          onClick={() => setTab('pesquisa')}
        >
          <Search size={18} />
          Pesquisar empresas
        </button>
        <button
          className={tab === 'previews' ? 'active' : ''}
          onClick={() => setTab('previews')}
        >
          <Sparkles size={18} />
          Criar prévias
          {data.previews.length > 0 && <b>{data.previews.length}</b>}
        </button>
        <button
          className={tab === 'followups' ? 'active' : ''}
          onClick={() => setTab('followups')}
        >
          <CalendarClock size={18} />
          Follow-ups{due.length > 0 && <b>{due.length}</b>}
        </button>
        <button
          className={tab === 'clientes' ? 'active' : ''}
          onClick={() => setTab('clientes')}
        >
          <WalletCards size={18} />
          Clientes & finanças
        </button>
        <button
          className={tab === 'guia' ? 'active' : ''}
          onClick={() => setTab('guia')}
        >
          <Clipboard size={18} />
          Oferta e scripts
        </button>
        <div className="nav-bottom">
          <span>Estratégia atual</span>
          <strong>Da pesquisa ao site publicado.</strong>
          <p>Qualifique, aborde, crie a prévia e acompanhe o fechamento.</p>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <div>
            <div className="eyebrow">OPERAÇÃO COMERCIAL · OUTUBRO 2026</div>
            <h1>
              {tab === 'fila'
                ? 'Empresas para prospectar'
                : tab === 'dashboard'
                  ? 'Visão geral do negócio'
                : tab === 'pesquisa'
                  ? 'Pesquisa de empresas'
                  : tab === 'previews'
                    ? 'Criação de prévias'
                  : tab === 'followups'
                    ? 'Conversas para retomar'
                    : tab === 'clientes'
                      ? 'Clientes e finanças'
                      : 'Oferta e abordagem'}
            </h1>
            <p>
              {tab === 'fila'
                ? 'Uma lista inicial para iniciar conversas reais — sem supor que exista demanda.'
                : tab === 'dashboard'
                  ? 'Prospecção, carteira de clientes e saúde financeira em um só lugar.'
                : tab === 'pesquisa'
                  ? 'Encontre negócios por nicho e região para montar sua fila.'
                  : tab === 'previews'
                    ? 'Monte, edite, publique e envie sites demonstrativos em poucos passos.'
                  : tab === 'followups'
                    ? 'Próximas ações organizadas por data.'
                    : tab === 'clientes'
                      ? 'Receitas, serviços e valores a receber por cliente.'
                    : 'Um roteiro simples para transformar conversa em projeto.'}
            </p>
          </div>
          <div className="top-buttons">
            <span className="live">
              <i /> Dados salvos
            </span>
            <button
              className="primary"
              onClick={() => {
                if (tab === 'clientes') { editClient(); return; }
                const [selectedCity, selectedState] = city.split(' · ');
                setDraft((current) => ({
                  ...current,
                  city: selectedCity,
                  state: selectedState || 'PE',
                }));
                setShowAdd(true);
              }}
            >
              <Plus size={17} /> {tab === 'clientes' ? 'Novo cliente' : 'Nova empresa'}
            </button>
          </div>
        </header>
        {toast && (
          <div className="toast">
            <Check size={16} />
            {toast}
          </div>
        )}
        {error && (
          <div className="error">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        )}
        {tab !== 'dashboard' && tab !== 'clientes' && <div className="kpis">
          <div>
            <Users />
            <span>Empresas</span>
            <strong>{m.total}</strong>
          </div>
          <div>
            <Send />
            <span>Prontas para contato</span>
            <strong>{m.ready}</strong>
          </div>
          <div>
            <MessageCircle />
            <span>Respostas</span>
            <strong>{m.replies}</strong>
          </div>
          <div>
            <Target />
            <span>Demandas</span>
            <strong>{m.demands}</strong>
          </div>
          <div>
            <CheckCircle2 />
            <span>Projetos fechados</span>
            <strong>{m.sales}</strong>
          </div>
        </div>}
        {tab === 'dashboard' && (
          <div className="business-dashboard">
            <div className="finance-kpis">
              <article><span className="metric-icon teal"><TrendingUp /></span><div><small>RECEITA DO MÊS</small><strong>{money(monthRevenue)}</strong><p>recorrência ativa</p></div></article>
              <article><span className="metric-icon blue"><Users /></span><div><small>CLIENTES ATIVOS</small><strong>{activeClients.length}</strong><p>{data.clients.length} na carteira</p></div></article>
              <article><span className="metric-icon violet"><Target /></span><div><small>LEADS NO FUNIL</small><strong>{data.leads.length}</strong><p>{m.replies || 0} respostas</p></div></article>
              <article><span className="metric-icon amber"><HandCoins /></span><div><small>A RECEBER</small><strong>{money(receivable)}</strong><p>despesas: {money(expenses)}</p></div></article>
            </div>
            <div className="dashboard-panels">
              <section className="panel wide">
                <div className="panel-title"><div><small>PIPELINE COMERCIAL</small><h2>Da pesquisa ao fechamento</h2></div><button className="text-button" onClick={() => setTab('fila')}>Abrir prospecção →</button></div>
                <div className="pipeline-chart">
                  {pipeline.map((item) => <div key={item.name}><span>{item.name}<b>{item.value}</b></span><i><em style={{width: `${Math.max(item.value ? 8 : 0, item.value / maxPipeline * 100)}%`}} /></i></div>)}
                </div>
              </section>
              <section className="panel">
                <div className="panel-title"><div><small>RECEITA POR CATEGORIA</small><h2>Mix de serviços</h2></div></div>
                {categories.length ? <div className="category-list">{categories.map((item, index) => <div key={item.name}><i style={{background: ['#12a8b5','#4f7df3','#8b5cf6','#f59e0b','#10b981','#ef6f61','#64748b'][index]}} /><span>{item.name}</span><b>{Math.round(item.value/categoryTotal*100)}%</b><small>{money(item.value)}</small></div>)}</div> : <div className="mini-empty">Cadastre clientes para visualizar a distribuição.</div>}
              </section>
            </div>
            <section className="panel latest">
              <div className="panel-title"><div><small>MOVIMENTO RECENTE</small><h2>Últimos leads</h2></div><button className="text-button" onClick={() => setTab('clientes')}>Gerenciar clientes →</button></div>
              <div className="simple-table"><div className="simple-row head"><span>Empresa</span><span>Etapa</span><span>Cidade</span><span>Oportunidade</span></div>{data.leads.slice(0,5).map((lead) => <button className="simple-row" key={lead.id} onClick={() => setSelectedId(lead.id)}><strong>{lead.clinic}</strong><span><i className="status-dot" />{cleanStage(lead.stage)}</span><span>{lead.location}</span><span>{lead.site_issue}</span></button>)}</div>
            </section>
          </div>
        )}
        {tab === 'clientes' && (
          <div className="clients-page">
            <div className="finance-kpis compact">
              <article><span className="metric-icon teal"><DollarSign /></span><div><small>RECEITA MENSAL</small><strong>{money(monthRevenue)}</strong></div></article>
              <article><span className="metric-icon blue"><Users /></span><div><small>CLIENTES ATIVOS</small><strong>{activeClients.length}</strong></div></article>
              <article><span className="metric-icon amber"><HandCoins /></span><div><small>A RECEBER</small><strong>{money(receivable)}</strong></div></article>
              <article><span className="metric-icon violet"><WalletCards /></span><div><small>SALDO PROJETADO</small><strong>{money(monthRevenue-expenses)}</strong></div></article>
            </div>
            <section className="panel clients-table-panel">
              <div className="panel-title"><div><small>CARTEIRA</small><h2>Clientes e serviços</h2></div><button className="primary" onClick={() => editClient()}><Plus size={16}/> Adicionar cliente</button></div>
              {data.clients.length ? <div className="clients-table"><div className="client-row head"><span>Cliente</span><span>Categoria</span><span>Status</span><span>Mensal</span><span>A receber</span><span>Ações</span></div>{data.clients.map((client) => <div className="client-row" key={client.id}><strong>{client.name}<small>{(() => { try { return JSON.parse(client.services_json||'[]').map((s:any)=>s.description).join(', ') || 'Sem serviços'; } catch { return 'Sem serviços'; } })()}</small></strong><span>{client.category}</span><span className={`client-status ${client.status}`}>{client.status === 'active' ? 'Ativo' : 'Inativo'}</span><b>{money(client.monthly_revenue)}</b><span>{money(client.receivable)}</span><span className="client-actions"><button onClick={() => editClient(client)}>Editar</button><button className="delete" onClick={() => { if (confirm(`Excluir ${client.name}?`)) post({type:'client_delete',id:client.id}); }} aria-label="Excluir"><Trash2 size={15}/></button></span></div>)}</div> : <div className="empty"><WalletCards/><strong>Sua carteira começa aqui.</strong><p>Cadastre o primeiro cliente e os serviços contratados.</p><button className="primary" onClick={() => editClient()}><Plus size={16}/> Novo cliente</button></div>}
            </section>
          </div>
        )}
        {tab === 'fila' && (
          <>
            <div className="city-batches">
              <div className="batch-heading">
                <strong>Lotes por cidade</strong>
                <span>Pesquise e importe novos contatos sem API paga</span>
              </div>
              <div className="city-options">
                {cityBatches.map((name, index) => {
                  const count = data.leads.filter(
                    (l) => l.location === name,
                  ).length;
                  return (
                    <div className="batch-card" key={name}>
                      <button
                        className={`batch-select ${city === name ? 'selected' : ''}`}
                        onClick={() => {
                          setCity(name);
                          setQuery('');
                          setFilter('A abordar');
                        }}
                      >
                        <small>LOTE {String(index + 1).padStart(2, '0')}</small>
                        <strong>{name}</strong>
                        <span>
                          {count} empresa{count === 1 ? '' : 's'}
                        </span>
                        <i>
                          <em style={{ width: `${Math.min(100, count * 2)}%` }} />
                        </i>
                      </button>
                      <button
                        className="batch-delete"
                        onClick={() => void removeBatch(name, count)}
                        disabled={busy}
                        title={`Excluir lote ${name}`}
                        aria-label={`Excluir lote ${name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p>
                “Pesquisada” indica um candidato ainda não conferido. Confirme
                empresa, localização e contato antes de marcar como pronta.{' '}
                <button
                  className="inline-research"
                  onClick={() => setTab('pesquisa')}
                >
                  Pesquisar outra região →
                </button>
              </p>
            </div>
            <div className="content-head">
              <div>
                <h2>Fila de prospecção · {city}</h2>
                <p>
                  Priorize empresas sem site ou com presença digital fraca. Confirme o canal e
                  personalize antes de enviar.
                </p>
              </div>
              <div className="search">
                <Search size={18} />
                <input
                  placeholder="Buscar empresa ou serviço"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="filters">
              {[
                'A abordar',
                'Em conversa',
                'Fechadas',
                'Perdidas',
                'Todos',
              ].map((name) => (
                <button
                  key={name}
                  className={filter === name ? 'active' : ''}
                  onClick={() => setFilter(name)}
                >
                  {name}
                  <b>{groups[name as keyof typeof groups].length}</b>
                </button>
              ))}
            </div>
            <div className="lead-grid">
              {visible.map((lead) => (
                <article className="agency-card" key={lead.id}>
                  <div className="card-top">
                    <span
                      className={`priority ${lead.score >= 3 ? 'high' : ''}`}
                    >
                      {lead.score >= 3 ? 'Prioridade alta' : 'Prioridade média'}
                    </span>
                    <span className="card-status-actions">
                      <span className="stage">{cleanStage(lead.stage)}</span>
                      <button
                        className="lead-delete"
                        onClick={() => void removeLead(lead)}
                        disabled={busy}
                        title={`Excluir ${lead.clinic}`}
                        aria-label={`Excluir ${lead.clinic}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                  <h3>{lead.clinic}</h3>
                  <p className="focus">{lead.services}</p>
                  <div className="opportunity">
                    <span>ONDE PODEMOS AJUDAR</span>
                    <strong>{lead.site_issue}</strong>
                  </div>
                  <div className="card-actions">
                    {whatsappLink(lead.phone, firstMessage(lead)) ? (
                      <a
                        className="whatsapp-card-link"
                        href={whatsappLink(lead.phone, firstMessage(lead))}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={16} /> Enviar no WhatsApp
                      </a>
                    ) : (
                      <button
                        className="whatsapp-card-link"
                        disabled={busy}
                        onClick={() => void lookupWhatsapp(lead)}
                      >
                        <Search size={16} /> Buscar WhatsApp
                      </button>
                    )}
                    <button
                      className="outline"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      Ver abordagem <ChevronRight size={16} />
                    </button>
                    <button
                      className="subtle"
                      onClick={() =>
                        copy(firstMessage(lead), 'Mensagem copiada.')
                      }
                    >
                      Copiar mensagem <Copy size={15} />
                    </button>
                  </div>
                </article>
              ))}
              {!visible.length && (
                <div className="empty">
                  Nenhuma empresa neste filtro. Pesquise ou adicione contatos
                  nesta região.
                </div>
              )}
            </div>
          </>
        )}
        {tab === 'pesquisa' && (
          <ResearchPanel
            onImported={(next, location) => {
              setData(next as Data);
              setCity(location);
              setQuery('');
              setFilter('A abordar');
              setTab('fila');
              notify('Empresas importadas para a fila de prospecção.');
            }}
          />
        )}
        {tab === 'previews' && (
          <PreviewStudio leads={data.leads} previews={data.previews} busy={busy} save={post} copy={copy} />
        )}
        {tab === 'followups' && (
          <div className="follow-layout">
            <div className="content-head">
              <div>
                <h2>Follow-ups vencidos ou de hoje</h2>
                <p>Retome apenas conversas que você realmente iniciou.</p>
              </div>
            </div>
            {due.length ? (
              due.map((lead) => (
                <article className="follow-card" key={lead.id}>
                  <div>
                    <small>
                      {formatDate(lead.next_follow_up_at)} ·{' '}
                      {cleanStage(lead.stage)}
                    </small>
                    <h3>{lead.clinic}</h3>
                  </div>
                  <div>
                    <button
                      className="outline"
                      onClick={() =>
                        copy(followupText(lead.clinic), 'Follow-up copiado.')
                      }
                    >
                      <Copy size={15} /> Copiar follow-up
                    </button>
                    <button
                      className="primary"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      Abrir empresa
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                <CalendarClock />
                <strong>Nenhum follow-up vencido.</strong>
                <p>
                  Ao marcar uma mensagem enviada, o CRM agenda um retorno em
                  dois dias.
                </p>
              </div>
            )}
          </div>
        )}
        {tab === 'guia' && (
          <div className="guide">
            <section className="guide-hero">
              <span>OFERTA DE ENTRADA</span>
              <h2>Sites rápidos para negócios locais</h2>
              <p>
                Criativos, landing pages ou uma automação delimitada. Primeiro
                projeto pago, prazo e entregáveis definidos antes de começar.
                Não venda “faço qualquer coisa”.
              </p>
            </section>
            <div className="guide-grid">
              <section>
                <span>01 · ABERTURA</span>
                <h3>Descubra a demanda</h3>
                <p>
                  “Vi que vocês atuam com [serviço]. Posso apoiar a equipe em
                  demandas pontuais. Há alguma entrega represada esta semana?”
                </p>
              </section>
              <section>
                <span>02 · QUALIFICAÇÃO</span>
                <h3>Entenda o trabalho</h3>
                <p>
                  Peça tipo de entrega, volume, prazo, referências, quem aprova
                  e se o trabalho será white-label.
                </p>
              </section>
              <section>
                <span>03 · PROPOSTA</span>
                <h3>Feche o escopo</h3>
                <p>
                  Registre entregáveis, prazo, número de revisões, valor, forma
                  de pagamento e o que fica fora.
                </p>
              </section>
              <section>
                <span>04 · EXECUÇÃO</span>
                <h3>Entregue e aprenda</h3>
                <p>
                  Comece pequeno. Depois da entrega, peça feedback e avalie uma
                  parceria recorrente — sem prometer resultado não medido.
                </p>
              </section>
            </div>
            <div className="guide-note">
              <LayoutDashboard size={20} />
              <p>
                Inspirado no vídeo: organizar contatos, follow-ups, histórico e
                escopo. Não ativamos prospecção automática nem integração não
                oficial com WhatsApp.
              </p>
            </div>
          </div>
        )}
      </main>
      {selected && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <aside className="drawer">
            <div className="drawer-head">
              <div>
                <small>EMPRESA · {cleanStage(selected.stage)}</small>
                <h2>{selected.clinic}</h2>
                <p>{selected.location}</p>
              </div>
              <button aria-label="Fechar" onClick={() => setSelectedId(null)}>
                <X />
              </button>
            </div>
            <div className="drawer-body">
              <div className="detail-block">
                <span>POR QUE ENTRAR EM CONTATO</span>
                <p>{selected.site_issue}</p>
                <small>{selected.verification_notes}</small>
              </div>
              <div className="detail-block">
                <span>1. PRIMEIRA MENSAGEM</span>
                <blockquote>{firstMessage(selected)}</blockquote>
                <button
                  className="primary"
                  onClick={() =>
                    copy(firstMessage(selected), 'Primeira mensagem copiada.')
                  }
                >
                  <Copy size={16} /> Copiar primeira mensagem
                </button>
              </div>
              <div className="detail-block">
                <span>2. SEGUNDA MENSAGEM</span>
                <blockquote style={{ whiteSpace: 'pre-line' }}>
                  {secondMessage}
                </blockquote>
                <button
                  className="outline"
                  onClick={() => copy(secondMessage, 'Segunda mensagem copiada.')}
                >
                  <Copy size={16} /> Copiar segunda mensagem
                </button>
              </div>
              <div className="detail-block">
                <span>3. APÓS A RESPOSTA POSITIVA</span>
                <blockquote style={{ whiteSpace: 'pre-line' }}>
                  {positiveReplyMessage}
                </blockquote>
                <button
                  className="outline"
                  onClick={() => copy(positiveReplyMessage, 'Terceira mensagem copiada.')}
                >
                  <Copy size={16} /> Copiar terceira mensagem
                </button>
              </div>
              <div className="contact-actions">
                {whatsappLink(selected.phone, firstMessage(selected)) ? (
                  <>
                    <a
                      href={whatsappLink(selected.phone, firstMessage(selected))}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={17} /> Enviar primeira mensagem no WhatsApp
                    </a>
                    <button
                      onClick={() =>
                        copy(
                          whatsappLink(selected.phone),
                          'Link do WhatsApp copiado.',
                        )
                      }
                    >
                      <Copy size={16} /> {whatsappLink(selected.phone)}
                    </button>
                  </>
                ) : (
                  <button disabled={busy} onClick={() => void lookupWhatsapp(selected)}>
                    <Search size={17} /> Buscar telefone e abrir WhatsApp
                  </button>
                )}
                {selected.whatsapp_url?.startsWith('https://') && (
                  <a
                    href={selected.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} /> Abrir canal público
                  </a>
                )}
                {selected.instagram && (
                  <button
                    onClick={() => copy(selected.instagram, 'E-mail copiado.')}
                  >
                    <Mail size={17} /> {selected.instagram} <Copy size={14} />
                  </button>
                )}
                {selected.phone && (
                  <button
                    onClick={() => copy(selected.phone, 'Telefone copiado.')}
                  >
                    <Copy size={16} /> {selected.phone}
                  </button>
                )}
              </div>
              {!whatsappLink(selected.phone, firstMessage(selected)) && (
                <p className="hint">
                  Sem link direto: adicione abaixo um celular público com DDD
                  para gerar o wa.me.
                </p>
              )}
              {selected.stage !== '07 FECHADA' &&
                selected.stage !== '08 PERDIDA' && (
                  <div className="detail-block contact-editor">
                    <span>CONFIRMAR OU CORRIGIR CONTATO</span>
                    <input
                      placeholder="Site ou link público (https://)"
                      value={contactDraft.contact}
                      onChange={(e) =>
                        setContactDraft({
                          ...contactDraft,
                          contact: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="E-mail público"
                      value={contactDraft.email}
                      onChange={(e) =>
                        setContactDraft({
                          ...contactDraft,
                          email: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Celular público com DDD (gera wa.me)"
                      value={contactDraft.phone}
                      onChange={(e) =>
                        setContactDraft({
                          ...contactDraft,
                          phone: e.target.value,
                        })
                      }
                    />
                    <button
                      className="outline"
                      disabled={busy}
                      onClick={() =>
                        post({
                          id: selected.id,
                          action: 'update_contact',
                          ...contactDraft,
                        })
                      }
                    >
                      Salvar contato
                    </button>
                  </div>
                )}
              <p className="hint">
                Abrir o canal não significa que a mensagem foi enviada. Confirme
                abaixo só depois de enviar manualmente.
              </p>
              <div className="detail-block">
                <span>PRÓXIMO PASSO</span>
                <div className="action-grid">
                  {selected.stage === '01 PESQUISADA' && (
                    <button
                      onClick={() => action(selected, 'ready')}
                      disabled={busy}
                    >
                      Contato verificado
                    </button>
                  )}
                  {selected.stage === '02 PRONTA' && (
                    <button
                      onClick={() => action(selected, 'mark_sent')}
                      disabled={busy}
                    >
                      Marcar mensagem enviada
                    </button>
                  )}
                  {selected.stage === '03 MENSAGEM ENVIADA' && (
                    <button
                      onClick={() => action(selected, 'mark_replied')}
                      disabled={busy}
                    >
                      Marcar resposta
                    </button>
                  )}
                  {selected.stage === '04 RESPONDEU' && (
                    <button
                      onClick={async () => {
                        if (await post({ type: 'preview_create', id: selected.id })) {
                          setSelectedId(null);
                          setTab('previews');
                        }
                      }}
                      disabled={busy}
                    >
                      Aceitou — criar prévia
                    </button>
                  )}
                  {selected.stage === '05 DEMANDA IDENTIFICADA' && (
                    <>
                      <button onClick={() => { setSelectedId(null); setTab('previews'); }}>Abrir prévia</button>
                      <button onClick={() => action(selected, 'proposal')} disabled={busy}>Proposta enviada</button>
                    </>
                  )}
                  {selected.stage === '06 PROPOSTA ENVIADA' && (
                    <div className="sale">
                      <input
                        type="number"
                        min="1"
                        placeholder="Valor fechado (R$)"
                        value={saleValue}
                        onChange={(e) => setSaleValue(e.target.value)}
                      />
                      <button
                        disabled={busy || !Number(saleValue)}
                        onClick={() =>
                          action(selected, 'sale', Number(saleValue))
                        }
                      >
                        Fechar projeto
                      </button>
                    </div>
                  )}
                  {!['07 FECHADA', '08 PERDIDA'].includes(selected.stage) && (
                    <button
                      className="danger"
                      onClick={() => action(selected, 'lost')}
                      disabled={busy}
                    >
                      Marcar perdida
                    </button>
                  )}
                  <button
                    className="danger delete-lead"
                    onClick={() => void removeLead(selected)}
                    disabled={busy}
                  >
                    <Trash2 size={15} /> Excluir empresa da lista
                  </button>
                </div>
                <div className="schedule">
                  <label>
                    Agendar próximo contato
                    <input
                      type="date"
                      value={
                        followDate ||
                        selected.next_follow_up_at?.slice(0, 10) ||
                        ''
                      }
                      onChange={(e) => setFollowDate(e.target.value)}
                    />
                  </label>
                  <button
                    className="outline"
                    disabled={
                      busy || !(followDate || selected.next_follow_up_at)
                    }
                    onClick={async () => {
                      if (
                        await post({
                          id: selected.id,
                          action: 'schedule_followup',
                          followUpAt:
                            followDate ||
                            selected.next_follow_up_at?.slice(0, 10),
                        })
                      )
                        setFollowDate('');
                    }}
                  >
                    Salvar data
                  </button>
                </div>
                {selected.next_follow_up_at && (
                  <small>
                    Próximo contato: {formatDate(selected.next_follow_up_at)}
                  </small>
                )}
              </div>
              <div className="detail-block">
                <span>NOTAS E HISTÓRICO</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="O que foi conversado? Qual é a próxima ação?"
                />
                <button
                  className="outline"
                  disabled={!note.trim() || busy}
                  onClick={async () => {
                    if (
                      await post({ type: 'note', id: selected.id, body: note })
                    )
                      setNote('');
                  }}
                >
                  Salvar nota
                </button>
                <div className="timeline">
                  {[
                    ...data.events
                      .filter((e) => e.lead_id === selected.id)
                      .map((e) => ({ at: e.created_at, text: e.event_type })),
                    ...data.notes
                      .filter((n) => n.lead_id === selected.id)
                      .map((n) => ({ at: n.created_at, text: n.body })),
                  ]
                    .sort((a, b) => b.at.localeCompare(a.at))
                    .map((item, i) => (
                      <p key={i}>
                        <small>{formatDate(item.at)}</small>
                        {item.text}
                      </p>
                    ))}
                </div>
              </div>
              <div className="detail-block">
                <span>FONTES PÚBLICAS</span>
                {safeSources(selected.sources_json).map((source, i) => (
                  <a
                    className="source"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    key={i}
                  >
                    {source.type}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
      {showAdd && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <aside className="drawer add-drawer">
            <div className="drawer-head">
              <div>
                <small>NOVO CONTATO</small>
                <h2>Adicionar empresa</h2>
              </div>
              <button aria-label="Fechar" onClick={() => setShowAdd(false)}>
                <X />
              </button>
            </div>
            <div className="drawer-body add-form">
              <p>
                O lead entra como “Pesquisada”. Verifique os dados antes da
                abordagem.
              </p>
              {(
                [
                  ['name', 'Nome da empresa *'],
                  ['city', 'Cidade'],
                  ['state', 'UF'],
                  ['contact', 'Link público de contato (https://)'],
                  ['email', 'E-mail público'],
                  ['focus', 'Serviços da empresa'],
                  ['opportunity', 'Onde podemos ajudar'],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label>
                Mensagem inicial
                <textarea
                  value={draft.opening}
                  onChange={(e) =>
                    setDraft({ ...draft, opening: e.target.value })
                  }
                  placeholder="Se deixar vazio, usamos a pergunta curta sobre a cidade."
                />
              </label>
              <button
                className="primary"
                disabled={
                  busy || !draft.name || (!draft.contact && !draft.email)
                }
                onClick={add}
              >
                <Plus size={16} /> Adicionar à fila
              </button>
            </div>
          </aside>
        </div>
      )}
      {showClient && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowClient(false); }}>
          <aside className="drawer add-drawer client-drawer">
            <div className="drawer-head"><div><small>CLIENTES & FINANÇAS</small><h2>{editingClient ? 'Editar cliente' : 'Novo cliente'}</h2></div><button aria-label="Fechar" onClick={() => setShowClient(false)}><X /></button></div>
            <div className="drawer-body add-form">
              <div className="form-grid"><label>Nome do cliente *<input value={clientDraft.name} onChange={(e) => setClientDraft({...clientDraft,name:e.target.value})}/></label><label>Status<select value={clientDraft.status} onChange={(e) => setClientDraft({...clientDraft,status:e.target.value})}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label></div>
              <div className="form-grid"><label>Categoria<select value={clientDraft.category} onChange={(e) => setClientDraft({...clientDraft,category:e.target.value})}>{CATEGORIES.map((category)=><option key={category}>{category}</option>)}</select></label><label>Mês de referência<input type="month" value={clientDraft.referenceMonth} onChange={(e) => setClientDraft({...clientDraft,referenceMonth:e.target.value})}/></label></div>
              <div className="services-editor"><div className="services-title"><span>SERVIÇOS CONTRATADOS</span><button onClick={() => setClientDraft({...clientDraft,services:[...clientDraft.services,{description:'',value:''}]})}><Plus size={14}/> Serviço</button></div>{clientDraft.services.map((service:any,index:number)=><div className="service-row" key={index}><input placeholder="Ex.: Gestão de tráfego" value={service.description} onChange={(e) => { const services=[...clientDraft.services];services[index]={...service,description:e.target.value};setClientDraft({...clientDraft,services}); }}/><input type="number" min="0" placeholder="R$ 0" value={service.value} onChange={(e) => { const services=[...clientDraft.services];services[index]={...service,value:e.target.value};setClientDraft({...clientDraft,services}); }}/><button disabled={clientDraft.services.length===1} onClick={() => setClientDraft({...clientDraft,services:clientDraft.services.filter((_:any,i:number)=>i!==index)})}><X size={15}/></button></div>)}<strong className="services-total">Mensalidade total <b>{money(clientDraft.services.reduce((sum:number,s:any)=>sum+Number(s.value||0),0))}</b></strong></div>
              <div className="form-grid three"><label>A receber<input type="number" min="0" value={clientDraft.receivable} onChange={(e) => setClientDraft({...clientDraft,receivable:e.target.value})}/></label><label>Despesas<input type="number" min="0" value={clientDraft.expenses} onChange={(e) => setClientDraft({...clientDraft,expenses:e.target.value})}/></label><label>Receita histórica<input type="number" min="0" value={clientDraft.totalRevenue} onChange={(e) => setClientDraft({...clientDraft,totalRevenue:e.target.value})}/></label></div>
              <button className="primary" disabled={busy || !clientDraft.name.trim()} onClick={saveClient}>{editingClient ? 'Salvar alterações' : 'Adicionar cliente'}</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
