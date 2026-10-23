/* oxlint-disable typescript/no-explicit-any */
import { getD1 } from '@/db';
import { initialMessage } from '@/lib/outreach';

export const STAGES = [
  '01 PESQUISADA',
  '02 PRONTA',
  '03 MENSAGEM ENVIADA',
  '04 RESPONDEU',
  '05 DEMANDA IDENTIFICADA',
  '06 PROPOSTA ENVIADA',
  '07 FECHADA',
  '08 PERDIDA',
] as const;
const intro = () => initialMessage('Recife');
const VERIFIED_PUBLIC_MOBILES: Record<string, string> = {
  'agency-dyzzi': '(81) 99677-5499',
  'agency-kind': '(81) 97310-3864',
  'agency-crevior': '(81) 99478-5391',
  'agency-cactus': '(81) 97908-9999',
};
const AGENCIES = [
  {
    id: 'agency-cosmica',
    name: 'Agência Cósmica',
    focus: 'mídias sociais, tráfego pago e landing pages',
    opportunity: 'Apoio de produção para campanhas e páginas',
    contact: 'https://www.agenciacosmica.com.br/contato',
    email: 'contato@agenciacosmica.com.br',
    source: 'https://www.agenciacosmica.com.br/servicos',
    priority: 3,
  },
  {
    id: 'agency-one8020',
    name: 'ONE 80/20',
    focus: 'tráfego pago, redes sociais e websites',
    opportunity: 'Criativos e landing pages para campanhas',
    contact: 'https://one8020.com.br/',
    email: '',
    source: 'https://one8020.com.br/',
    priority: 3,
  },
  {
    id: 'agency-lothax',
    name: 'Lothax',
    focus: 'SEO, sites, anúncios e direção de arte',
    opportunity: 'Apoio em design e produção web',
    contact: 'https://www.lothax.com.br/',
    email: '',
    source: 'https://www.lothax.com.br/',
    priority: 3,
  },
  {
    id: 'agency-quartza',
    name: 'QUARTZA',
    focus: 'identidade visual, gestão de redes sociais e tráfego pago',
    opportunity: 'Criativos e identidade visual em projetos pontuais',
    contact: 'https://www.agenciaquartza.com.br/',
    email: 'agenciaquartza@gmail.com',
    source: 'https://www.agenciaquartza.com.br/',
    priority: 3,
  },
  {
    id: 'agency-storm',
    name: 'Storm Studio',
    focus: 'redes sociais, vídeo e branding',
    opportunity: 'Apoio em peças visuais e páginas de campanha',
    contact: 'https://www.stormlabs.com.br/',
    email: '',
    source: 'https://www.stormlabs.com.br/',
    priority: 2,
  },
  {
    id: 'agency-dyzzi',
    name: 'DYZZI',
    focus: 'conteúdo, design, tráfego e automações',
    opportunity: 'Apoio de execução em design e automações',
    contact: 'https://www.agenciadyzzi.com.br/',
    email: '',
    source: 'https://www.agenciadyzzi.com.br/',
    priority: 2,
  },
  {
    id: 'agency-include',
    name: 'INCLUDE',
    focus: 'tráfego pago e gestão de redes sociais',
    opportunity: 'Criativos e landing pages para clientes da agência',
    contact: 'https://www.includeweb.com.br/',
    email: '',
    source: 'https://www.includeweb.com.br/',
    priority: 2,
  },
  {
    id: 'agency-tante',
    name: 'Tante Comunicação Digital',
    focus: 'sites, inbound marketing e redes sociais',
    opportunity: 'Apoio em páginas e materiais visuais',
    contact: 'https://www.tante.com.br/',
    email: '',
    source: 'https://www.tante.com.br/',
    priority: 2,
  },
  {
    id: 'agency-hangar',
    name: 'Hangar Interactive',
    focus: 'sites, landing pages e identidade visual',
    opportunity: 'Apoio na produção de páginas e peças digitais',
    contact: 'https://hangarinteractive.com.br/',
    email: '',
    source: 'https://hangarinteractive.com.br/',
    priority: 3,
  },
  {
    id: 'agency-aipim',
    name: 'Aipim Studio Digital',
    focus: 'sites, landing pages e e-commerce',
    opportunity: 'Apoio em páginas e design para projetos web',
    contact: 'https://www.aipimweb.com.br/',
    email: '',
    source: 'https://www.aipimweb.com.br/',
    priority: 3,
  },
  {
    id: 'agency-othuki',
    name: 'Othuki',
    focus: 'websites, inteligência artificial e tráfego',
    opportunity: 'Apoio técnico em sites e automações delimitadas',
    contact: 'https://othuki.com.br/',
    email: '',
    source: 'https://othuki.com.br/',
    priority: 3,
  },
  {
    id: 'agency-volts',
    name: 'Volts',
    focus: 'sites, landing pages e aplicativos',
    opportunity: 'Apoio na execução de interfaces e páginas',
    contact: 'https://voltsstudio.com.br/',
    email: '',
    source: 'https://voltsstudio.com.br/',
    priority: 3,
  },
  {
    id: 'agency-atrius',
    name: 'Atrius Digital',
    focus: 'WordPress e landing pages',
    opportunity: 'Apoio em criação e manutenção de páginas',
    contact: 'https://atriusdigital.com.br/',
    email: '',
    source: 'https://atriusdigital.com.br/',
    priority: 3,
  },
  {
    id: 'agency-olli',
    name: 'OlliMKT',
    focus: 'branding, conteúdo, tráfego e landing pages',
    opportunity: 'Criativos e páginas para campanhas',
    contact: 'https://www.ollimkt.com.br/',
    email: 'contato@ollimkt.com.br',
    source: 'https://www.ollimkt.com.br/',
    priority: 3,
  },
  {
    id: 'agency-redeform',
    name: 'Redeform',
    focus: 'design gráfico, mídias sociais e sites',
    opportunity: 'Reforço para peças e produção web',
    contact: 'https://redeform.com.br/',
    email: 'contato@redeform.com.br',
    source: 'https://redeform.com.br/',
    priority: 3,
  },
  {
    id: 'agency-pepperweb',
    name: 'PepperWeb',
    focus: 'tráfego pago, inteligência artificial e design',
    opportunity: 'Criativos e automações de escopo fechado',
    contact: 'https://pepperweb.com.br/',
    email: '',
    source: 'https://pepperweb.com.br/',
    priority: 3,
  },
  {
    id: 'agency-safari',
    name: 'Safari',
    focus: 'websites e branding',
    opportunity: 'Apoio na produção web e peças de marca',
    contact: 'https://safari.com.br/',
    email: 'contato@safari.com.br',
    source: 'https://safari.com.br/portfolio/',
    priority: 2,
  },
  {
    id: 'agency-livo',
    name: 'Agência Livo',
    focus: 'redes sociais, sites e identidade visual',
    opportunity: 'Reforço em páginas e identidade visual',
    contact: 'https://www.agencialivo.com.br/',
    email: '',
    source: 'https://www.agencialivo.com.br/',
    priority: 2,
  },
  {
    id: 'agency-opera',
    name: 'Agência Ópera',
    focus: 'sites, anúncios e redes sociais',
    opportunity: 'Criativos e landing pages para campanhas',
    contact: 'https://www.agenciaopera.com.br/',
    email: '',
    source: 'https://www.agenciaopera.com.br/',
    priority: 2,
  },
  {
    id: 'agency-apollo',
    name: 'Apollo Hub',
    focus: 'inbound, performance, branding e sites',
    opportunity: 'Produção de landing pages e criativos',
    contact: 'https://apollohubco.com.br/',
    email: '',
    source: 'https://apollohubco.com.br/',
    priority: 3,
  },
  {
    id: 'agency-digitalnativa',
    name: 'Digital Nativa',
    focus: 'design, web e marketing',
    opportunity: 'Apoio em design e desenvolvimento web',
    contact: 'https://www.digitalnativa.com.br/',
    email: '',
    source: 'https://www.digitalnativa.com.br/',
    priority: 2,
  },
  {
    id: 'agency-saulo',
    name: 'Saulo Andrade MKT',
    focus: 'conteúdo, sites e SEO',
    opportunity: 'Apoio na produção de páginas e conteúdo visual',
    contact: 'https://sauloandrademkt.com.br/',
    email: '',
    source: 'https://sauloandrademkt.com.br/',
    priority: 2,
  },
  {
    id: 'agency-atriosweb',
    name: 'Atriosweb',
    focus: 'sites, e-commerce e marketing digital',
    opportunity: 'Apoio em páginas e design para projetos digitais',
    contact: 'https://www.atriosweb.com.br/',
    email: '',
    source: 'https://www.atriosweb.com.br/',
    priority: 2,
  },
  {
    id: 'agency-clave',
    name: 'Estúdio Clave',
    focus: 'identidade visual, editorial e web',
    opportunity: 'Apoio em projetos de design e web',
    contact: 'https://estudioclave.com.br/',
    email: '',
    source: 'https://estudioclave.com.br/servicos/',
    priority: 2,
  },
  {
    id: 'agency-foguete',
    name: 'Agência Foguete',
    focus: 'marketing digital e comunicação',
    opportunity: 'Reforço em criativos e entregas web',
    contact: 'https://agenciafoguete.com.br/',
    email: '',
    source: 'https://agenciafoguete.com.br/',
    priority: 2,
  },
  {
    id: 'agency-rejunta',
    name: 'Rejunta Comunicação',
    focus: 'comunicação, marketing e sites',
    opportunity: 'Apoio em peças digitais e páginas',
    contact: 'https://rejuntacomunicacao.com.br/',
    email: '',
    source: 'https://rejuntacomunicacao.com.br/',
    priority: 2,
  },
  {
    id: 'agency-amplifique',
    name: 'Amplifique+ Digital',
    focus: 'anúncios, redes sociais, sites e CRM',
    opportunity: 'Criativos, landing pages e automações',
    contact: 'https://agenciademarketingemrecife.com.br/',
    email: '',
    source: 'https://agenciademarketingemrecife.com.br/',
    priority: 3,
  },
  {
    id: 'agency-liderdigital',
    name: 'Líder Digital',
    focus: 'SEO e tráfego pago',
    opportunity: 'Apoio em landing pages e materiais de campanha',
    contact: 'https://agencialiderdigital.dev.br/',
    email: '',
    source: 'https://agencialiderdigital.dev.br/',
    priority: 2,
  },
  {
    id: 'agency-aura',
    name: 'Aura Agência Digital',
    focus: 'marketing estratégico e e-commerce',
    opportunity: 'Reforço de design e automações pontuais',
    contact: 'https://auraagenciadigital.com/',
    email: '',
    source: 'https://auraagenciadigital.com/',
    priority: 2,
  },
  {
    id: 'agency-mobic',
    name: 'MOBIC',
    focus: 'tráfego pago e gestão de leads',
    opportunity: 'Criativos, páginas e automações comerciais',
    contact: 'https://mobic.com.br/',
    email: '',
    source: 'https://mobic.com.br/',
    priority: 3,
  },
  {
    id: 'agency-mycom',
    name: 'MyCom',
    focus: 'inteligência artificial, software e marketing',
    opportunity: 'Apoio técnico em automações e interfaces',
    contact: 'https://mycom.dev.br/',
    email: '',
    source: 'https://mycom.dev.br/',
    priority: 2,
  },
  {
    id: 'agency-kind',
    name: 'Agência KIND',
    focus: 'identidade visual, redes sociais e vídeo',
    opportunity: 'Reforço em peças e identidade visual',
    contact: 'https://agenciakind.com.br/',
    email: 'agenciakindmkt@gmail.com',
    source: 'https://agenciakind.com.br/',
    priority: 2,
  },
  {
    id: 'agency-mz',
    name: 'MZ Comunicação',
    focus: 'publicidade e marketing',
    opportunity: 'Reforço em criativos e páginas de campanha',
    contact: 'https://mzcomunicacao.com.br/home/',
    email: '',
    source: 'https://mzcomunicacao.com.br/home/',
    priority: 2,
  },
  {
    id: 'agency-fille',
    name: 'Agência Fille',
    focus: 'audiovisual, tráfego, branding e landing pages',
    opportunity: 'Páginas e criativos para campanhas',
    contact: 'https://agenciafille.com.br/',
    email: '',
    source: 'https://agenciafille.com.br/',
    priority: 3,
  },
  {
    id: 'agency-concept',
    name: 'Concept',
    focus: 'social media, tráfego, sites e IA',
    opportunity: 'Apoio em páginas e automações de escopo fechado',
    contact: 'https://www.marketingconcept.com.br/',
    email: '',
    source: 'https://www.marketingconcept.com.br/',
    priority: 3,
  },
  {
    id: 'agency-house',
    name: 'HOUSE Assessoria',
    focus: 'criativos, campanhas e landing pages',
    opportunity: 'Reforço de produção em criativos e páginas',
    contact: 'https://www.houseagencia.com.br/',
    email: 'comercial@houseagencia.com.br',
    source: 'https://www.houseagencia.com.br/',
    priority: 3,
  },
  {
    id: 'agency-crevior',
    name: 'Crevior',
    focus: 'branding, identidade visual e UX/UI',
    opportunity: 'Apoio em identidade visual e interfaces',
    contact: 'https://crevior.com.br/',
    email: 'contato@crevior.com.br',
    source: 'https://crevior.com.br/',
    priority: 2,
  },
  {
    id: 'agency-caos',
    name: 'Caos Criativo',
    focus: 'comunicação e produção criativa',
    opportunity: 'Reforço em peças e produção digital',
    contact: 'https://criativocaos.com.br/',
    email: 'caoscriativope@gmail.com',
    source: 'https://criativocaos.com.br/',
    priority: 2,
  },
  {
    id: 'agency-desata',
    name: 'Desata',
    focus: 'marketing digital, aplicações web e automações',
    opportunity: 'Apoio técnico em páginas e automações',
    contact: 'https://desata.com.br/',
    email: '',
    source: 'https://desata.com.br/',
    priority: 3,
  },
  {
    id: 'agency-dife',
    name: 'DIFE Agência Criativa',
    focus: 'branding e estratégia criativa',
    opportunity: 'Apoio em identidade visual e peças digitais',
    contact: 'https://www.agenciadife.com/',
    email: 'contato@agenciadife.com',
    source: 'https://www.agenciadife.com/',
    priority: 2,
  },
  {
    id: 'agency-vento',
    name: 'Vento Design',
    focus: 'branding, redes sociais, tráfego e sites',
    opportunity: 'Criativos, landing pages e produção visual',
    contact: 'https://ventodesign.com.br/',
    email: '',
    source: 'https://ventodesign.com.br/',
    priority: 3,
  },
  {
    id: 'agency-lunae',
    name: 'Lunae Solutions',
    focus: 'desenvolvimento web, mobile e software',
    opportunity: 'Apoio em interfaces e páginas',
    contact: 'https://lunaesolutions.com.br/',
    email: '',
    source: 'https://lunaesolutions.com.br/',
    priority: 2,
  },
  {
    id: 'agency-cactus',
    name: 'Cactus Comunicação',
    focus: 'branding, tráfego, audiovisual e sites',
    opportunity: 'Apoio em criativos e landing pages',
    contact: 'https://cactuscomunicacao.com.br/',
    email: 'comercial@cactuscomunicacao.com.br',
    source: 'https://cactuscomunicacao.com.br/',
    priority: 3,
  },
  {
    id: 'agency-jamile',
    name: 'Jamile da Cruz Marketing Digital',
    focus: 'sites, redes sociais, tráfego e identidade visual',
    opportunity: 'Reforço de execução em páginas e peças',
    contact: 'https://www.jamiledacruz.com.br/',
    email: '',
    source: 'https://www.jamiledacruz.com.br/',
    priority: 2,
  },
  {
    id: 'agency-speedybyte',
    name: 'SpeedyByte',
    focus: 'SEO, sites e automação com IA',
    opportunity: 'Apoio em landing pages e automações',
    contact: 'https://speedybyte.com.br/',
    email: '',
    source: 'https://speedybyte.com.br/',
    priority: 2,
  },
  {
    id: 'agency-bynnes',
    name: 'Bynnes Agência Digital',
    focus: 'soluções digitais e desenvolvimento web',
    opportunity: 'Apoio na produção de interfaces e páginas',
    contact: 'https://bynnes.com.br/',
    email: '',
    source: 'https://bynnes.com.br/',
    priority: 2,
  },
  {
    id: 'agency-moretes',
    name: 'Morete’s',
    focus: 'SEO, sites, tráfego pago e dados',
    opportunity: 'Landing pages, criativos e apoio técnico',
    contact: 'https://moretes.com.br/',
    email: '',
    source: 'https://moretes.com.br/',
    priority: 3,
  },
  {
    id: 'agency-solar',
    name: 'Publicidade Solar',
    focus: 'marketing estratégico e tráfego pago',
    opportunity: 'Apoio em criativos para campanhas',
    contact: 'https://www.publicidadesolar.com.br/',
    email: '',
    source: 'https://www.publicidadesolar.com.br/',
    priority: 2,
  },
  {
    id: 'agency-criamundo',
    name: 'Cria Mundo',
    focus: 'comunicação, marketing e criação de sites',
    opportunity: 'Reforço em páginas e peças digitais',
    contact: 'https://criamundo.com.br/',
    email: '',
    source: 'https://criamundo.com.br/',
    priority: 2,
  },
  {
    id: 'agency-ioio',
    name: 'IOIO.ag',
    focus: 'live marketing e experiências de marca',
    opportunity: 'Apoio em peças e páginas para ativações',
    contact: 'https://agenciaioio.com/',
    email: '',
    source: 'https://agenciaioio.com/',
    priority: 2,
  },
];
const isAgency = (id: string) => id.startsWith('agency-');
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export async function ensureSeeded() {
  // O antigo lote demonstrativo de agências não é mais recriado.
}

async function deleteLeadRows(ids: string[]) {
  if (!ids.length) return;
  const db = getD1();
  const placeholders = ids.map(() => '?').join(',');
  await db.batch([
    db.prepare(`DELETE FROM previews WHERE lead_id IN (${placeholders})`).bind(...ids),
    db.prepare(`DELETE FROM lead_events WHERE lead_id IN (${placeholders})`).bind(...ids),
    db.prepare(`DELETE FROM lead_notes WHERE lead_id IN (${placeholders})`).bind(...ids),
    db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`).bind(...ids),
  ]);
}

export async function deleteLead(id: string) {
  if (!isAgency(id || '')) throw new Error('Empresa inválida.');
  const db = getD1();
  const exists = await db.prepare('SELECT id FROM leads WHERE id=?').bind(id).first();
  if (!exists) throw new Error('Empresa não encontrada.');
  await deleteLeadRows([id]);
  return bootstrap();
}

export async function deleteLeadBatch(location: string) {
  const normalized = location?.trim();
  if (!normalized) throw new Error('Lote inválido.');
  const db = getD1();
  const rows = (await db
    .prepare("SELECT id FROM leads WHERE id LIKE 'agency-%' AND location=?")
    .bind(normalized)
    .all()).results as { id: string }[];
  await deleteLeadRows(rows.map((row) => row.id));
  return bootstrap();
}

export async function bootstrap() {
  await ensureSeeded();
  const db = getD1();
  const leads = (
    await db
      .prepare(
        "SELECT * FROM leads WHERE id LIKE 'agency-%' ORDER BY score DESC, lead_number ASC",
      )
      .all()
  ).results as any[];
  const events = (
    await db
      .prepare(
        "SELECT e.* FROM lead_events e JOIN leads l ON l.id=e.lead_id WHERE l.id LIKE 'agency-%' ORDER BY e.created_at DESC",
      )
      .all()
  ).results;
  const notes = (
    await db
      .prepare(
        "SELECT n.* FROM lead_notes n JOIN leads l ON l.id=n.lead_id WHERE l.id LIKE 'agency-%' ORDER BY n.created_at DESC",
      )
      .all()
  ).results;
  const clients = (
    await db.prepare('SELECT * FROM clients ORDER BY status ASC, updated_at DESC').all()
  ).results as any[];
  const previews = (
    await db.prepare('SELECT p.*,l.clinic,l.location,l.phone FROM previews p JOIN leads l ON l.id=p.lead_id ORDER BY p.updated_at DESC').all()
  ).results as any[];
  const count = (key: string) => leads.filter((l) => l[key]).length;
  const active = leads.filter(
    (l) => !['07 FECHADA', '08 PERDIDA'].includes(l.stage),
  );
  const approached = count('first_contact_at'),
    replies = count('replied_at');
  const metrics = {
    total: leads.length,
    ready: leads.filter((l) => l.stage === '02 PRONTA').length,
    approached,
    replies,
    demands: leads.filter((l) =>
      ['05 DEMANDA IDENTIFICADA', '06 PROPOSTA ENVIADA', '07 FECHADA'].includes(
        l.stage,
      ),
    ).length,
    proposals: count('proposal_at'),
    sales: count('closed_at'),
    revenue: leads.reduce((sum, l) => sum + (Number(l.closed_value) || 0), 0),
    due: active.filter((l) => l.next_follow_up_at?.slice(0, 10) === today())
      .length,
    overdue: active.filter(
      (l) => l.next_follow_up_at && l.next_follow_up_at.slice(0, 10) < today(),
    ).length,
    replyRate: approached ? replies / approached : null,
  };
  return { leads, events, notes, clients, previews, metrics, stages: STAGES };
}
const ACTIONS: Record<string, { stage: string; event: string }> = {
  ready: { stage: '02 PRONTA', event: 'Contato qualificado' },
  mark_sent: { stage: '03 MENSAGEM ENVIADA', event: 'Mensagem enviada' },
  mark_replied: { stage: '04 RESPONDEU', event: 'Resposta recebida' },
  demand: { stage: '05 DEMANDA IDENTIFICADA', event: 'Demanda identificada' },
  proposal: { stage: '06 PROPOSTA ENVIADA', event: 'Proposta enviada' },
  sale: { stage: '07 FECHADA', event: 'Parceria fechada' },
  lost: { stage: '08 PERDIDA', event: 'Oportunidade perdida' },
};

export async function updateLead(input: {
  id: string;
  action?: string;
  stage?: string;
  value?: number;
  followUpAt?: string;
  contact?: string;
  email?: string;
  phone?: string;
}) {
  if (!isAgency(input.id || ''))
    throw new Error('Lead fora da operação de agências.');
  await ensureSeeded();
  const db = getD1();
  const lead = await db
    .prepare('SELECT stage,whatsapp_url,instagram,phone FROM leads WHERE id=?')
    .bind(input.id)
    .first<{
      stage: string;
      whatsapp_url: string;
      instagram: string;
      phone: string;
    }>();
  if (!lead) throw new Error('Agência não encontrada.');
  const now = new Date().toISOString();
  if (input.action === 'update_contact') {
    const contact = input.contact?.trim() || '',
      email = input.email?.trim() || '',
      phone = input.phone?.trim() || '';
    if (contact && !/^https:\/\//i.test(contact))
      throw new Error('O site ou link de contato deve começar com https://.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error('Informe um e-mail válido.');
    if (!contact && !email && !phone)
      throw new Error('Informe ao menos um canal de contato.');
    await db
      .prepare(
        'UPDATE leads SET whatsapp_url=?,instagram=?,phone=?,updated_at=? WHERE id=?',
      )
      .bind(contact, email, phone, now, input.id)
      .run();
    return bootstrap();
  }
  if (input.action === 'schedule_followup') {
    if (['07 FECHADA', '08 PERDIDA'].includes(lead.stage))
      throw new Error('Esta oportunidade já foi concluída.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.followUpAt || ''))
      throw new Error('Informe uma data válida.');
    await db.batch([
      db
        .prepare('UPDATE leads SET next_follow_up_at=?,updated_at=? WHERE id=?')
        .bind(input.followUpAt, now, input.id),
      db
        .prepare(
          'INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        )
        .bind(
          input.id,
          'Follow-up agendado',
          lead.stage,
          lead.stage,
          JSON.stringify({ date: input.followUpAt }),
          now,
        ),
    ]);
    return bootstrap();
  }
  const allowed: Record<string, string[]> = {
    ready: ['01 PESQUISADA'],
    mark_sent: ['02 PRONTA'],
    mark_replied: ['03 MENSAGEM ENVIADA'],
    demand: ['04 RESPONDEU'],
    proposal: ['05 DEMANDA IDENTIFICADA'],
    sale: ['06 PROPOSTA ENVIADA'],
    lost: [
      '01 PESQUISADA',
      '02 PRONTA',
      '03 MENSAGEM ENVIADA',
      '04 RESPONDEU',
      '05 DEMANDA IDENTIFICADA',
      '06 PROPOSTA ENVIADA',
    ],
  };
  if (!input.action || !allowed[input.action]?.includes(lead.stage))
    throw new Error('Esta ação não corresponde à etapa atual.');
  if (
    input.action === 'ready' &&
    !lead.whatsapp_url &&
    !lead.instagram &&
    !lead.phone
  )
    throw new Error(
      'Encontre e confira um canal de contato antes de marcar como pronta.',
    );
  const def = ACTIONS[input.action];
  if (!def) throw new Error('Ação inválida.');
  const fields: Record<string, unknown> = { stage: def.stage, updated_at: now };
  if (input.action === 'mark_sent') {
    fields.first_contact_at = now;
    fields.last_contact_at = now;
    fields.next_follow_up_at = input.followUpAt || plusDays(2);
  }
  if (input.action === 'mark_replied') {
    fields.replied_at = now;
    fields.last_contact_at = now;
    fields.next_follow_up_at = null;
  }
  if (input.action === 'demand') fields.interest = 'Sim';
  if (input.action === 'proposal') {
    fields.proposal_at = now;
    fields.next_follow_up_at = plusDays(2);
  }
  if (input.action === 'sale') {
    if (!input.value || input.value <= 0)
      throw new Error('Informe o valor do projeto.');
    fields.closed_at = now;
    fields.closed_value = input.value;
    fields.next_follow_up_at = null;
  }
  if (input.action === 'lost') fields.next_follow_up_at = null;
  const keys = Object.keys(fields);
  await db.batch([
    db
      .prepare(
        `UPDATE leads SET ${keys.map((k) => `${k}=?`).join(',')} WHERE id=?`,
      )
      .bind(...keys.map((k) => fields[k]), input.id),
    db
      .prepare(
        'INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      )
      .bind(
        input.id,
        def.event,
        lead.stage,
        def.stage,
        JSON.stringify({ value: input.value }),
        now,
      ),
  ]);
  return bootstrap();
}
export async function addNote(id: string, body: string) {
  if (!isAgency(id)) throw new Error('Lead fora da operação de agências.');
  if (!body.trim()) throw new Error('Escreva uma nota.');
  await ensureSeeded();
  const db = getD1();
  await db
    .prepare('INSERT INTO lead_notes (lead_id,body,created_at) VALUES (?,?,?)')
    .bind(id, body.trim(), new Date().toISOString())
    .run();
  return bootstrap();
}
export async function addManualLead(input: {
  name?: string;
  city?: string;
  state?: string;
  contact?: string;
  email?: string;
  focus?: string;
  opportunity?: string;
  opening?: string;
}) {
  const name = input.name?.trim(),
    contact = input.contact?.trim(),
    email = input.email?.trim();
  if (!name || (!contact && !email))
    throw new Error('Informe o nome e um canal de contato.');
  if (contact && !/^https:\/\//i.test(contact))
    throw new Error('O link deve começar com https://.');
  await ensureSeeded();
  const db = getD1();
  const max = await db
    .prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads')
    .first<{ value: number }>();
  const now = new Date().toISOString();
  const id = `agency-manual-${crypto.randomUUID()}`;
  const city = input.city?.trim() || 'A confirmar';
  const state = input.state?.trim().toUpperCase() || '';
  const location = state ? `${city} · ${state}` : city;
  const focus = input.focus?.trim() || 'serviços a confirmar';
  await db.batch([
    db
      .prepare(
        'INSERT INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        (max?.value ?? 0) + 1,
        name,
        location,
        city,
        '—',
        '01 PESQUISADA',
        1,
        'Lead manual — verificar dados',
        'Nova',
        input.opportunity?.trim() || 'A investigar',
        input.opportunity?.trim() || 'A investigar',
        email || '',
        0,
        0,
        focus,
        '',
        contact || '',
        'Necessidade ainda não confirmada.',
        'Lead manual; verificar contato e serviços antes de enviar.',
        input.opening?.trim() || initialMessage(city),
        JSON.stringify(
          contact
            ? [
                {
                  type: 'Contato informado',
                  url: contact,
                  use: 'Verificar antes de abordar',
                },
              ]
            : [],
        ),
        now,
        now,
      ),
    db
      .prepare(
        'INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      )
      .bind(id, 'Agência adicionada', null, '01 PESQUISADA', null, now),
  ]);
  return bootstrap();
}

type ClientInput = {
  id?: string;
  name?: string;
  status?: string;
  category?: string;
  receivable?: number;
  expenses?: number;
  totalRevenue?: number;
  referenceMonth?: string;
  services?: { description?: string; value?: number }[];
};

const normalizeClient = (input: ClientInput) => {
  const name = input.name?.trim();
  if (!name) throw new Error('Informe o nome do cliente.');
  const services = (input.services || [])
    .map((service) => ({
      description: service.description?.trim() || 'Serviço',
      value: Math.max(0, Number(service.value) || 0),
    }))
    .filter((service) => service.description || service.value);
  return {
    name,
    status: input.status === 'inactive' ? 'inactive' : 'active',
    category: input.category?.trim() || 'Outros',
    monthlyRevenue: services.reduce((sum, service) => sum + service.value, 0),
    receivable: Math.max(0, Number(input.receivable) || 0),
    expenses: Math.max(0, Number(input.expenses) || 0),
    totalRevenue: Math.max(0, Number(input.totalRevenue) || 0),
    referenceMonth: /^\d{4}-\d{2}$/.test(input.referenceMonth || '')
      ? input.referenceMonth!
      : new Date().toISOString().slice(0, 7),
    servicesJson: JSON.stringify(services),
  };
};

export async function createClient(input: ClientInput) {
  await ensureSeeded();
  const db = getD1();
  const client = normalizeClient(input);
  const now = new Date().toISOString();
  await db.prepare('INSERT INTO clients (id,name,status,category,monthly_revenue,receivable,expenses,total_revenue,reference_month,services_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(`client-${crypto.randomUUID()}`, client.name, client.status, client.category, client.monthlyRevenue, client.receivable, client.expenses, client.totalRevenue, client.referenceMonth, client.servicesJson, now, now).run();
  return bootstrap();
}

export async function updateClient(input: ClientInput) {
  if (!input.id?.startsWith('client-')) throw new Error('Cliente inválido.');
  await ensureSeeded();
  const db = getD1();
  const client = normalizeClient(input);
  await db.prepare('UPDATE clients SET name=?,status=?,category=?,monthly_revenue=?,receivable=?,expenses=?,total_revenue=?,reference_month=?,services_json=?,updated_at=? WHERE id=?')
    .bind(client.name, client.status, client.category, client.monthlyRevenue, client.receivable, client.expenses, client.totalRevenue, client.referenceMonth, client.servicesJson, new Date().toISOString(), input.id).run();
  return bootstrap();
}

export async function deleteClient(id: string) {
  if (!id?.startsWith('client-')) throw new Error('Cliente inválido.');
  await ensureSeeded();
  await getD1().prepare('DELETE FROM clients WHERE id=?').bind(id).run();
  return bootstrap();
}
