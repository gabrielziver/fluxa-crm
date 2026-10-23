/* oxlint-disable typescript/no-explicit-any */
import { getD1 } from '@/db';

const STOCK = {
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
  ],
  local: [
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  ],
};

const slugify = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'empresa';

const profileFor = (lead: any) => {
  const haystack = `${lead.clinic} ${lead.services}`.toLowerCase();
  if (/restaurante|hamburg|pizza|aça|acai|café|cafe|confeitaria|food|bar|lanch/.test(haystack))
    return { key: 'food' as const, label: 'sabores', services: ['Destaques da casa', 'Pedidos rápidos', 'Atendimento especial'], accent: '#7c3aed' };
  if (/barbear|salão|salao|beleza|estética|estetica|cabelo|unha/.test(haystack))
    return { key: 'beauty' as const, label: 'cuidado', services: ['Serviços personalizados', 'Horários flexíveis', 'Agendamento fácil'], accent: '#b45376' };
  if (/clínica|clinica|dent|saúde|saude|médic|medic|terap|psico/.test(haystack))
    return { key: 'health' as const, label: 'cuidado', services: ['Atendimento especializado', 'Equipe preparada', 'Agendamento facilitado'], accent: '#087f86' };
  if (/academia|fitness|crossfit|pilates|treino/.test(haystack))
    return { key: 'fitness' as const, label: 'resultado', services: ['Estrutura completa', 'Acompanhamento próximo', 'Planos sob medida'], accent: '#ea580c' };
  return { key: 'local' as const, label: 'experiência', services: ['Atendimento próximo', 'Soluções sob medida', 'Contato facilitado'], accent: '#2563eb' };
};

const safeUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href.slice(0, 1000) : '';
  } catch { return ''; }
};

export async function listPreviews() {
  const db = getD1();
  return (await db.prepare('SELECT p.*, l.clinic, l.location, l.phone FROM previews p JOIN leads l ON l.id=p.lead_id ORDER BY p.updated_at DESC').all()).results;
}

export async function createPreview(leadId: string) {
  const db = getD1();
  const lead = await db.prepare("SELECT * FROM leads WHERE id=? AND id LIKE 'agency-%'").bind(leadId).first<any>();
  if (!lead) throw new Error('Empresa não encontrada.');
  const existing = await db.prepare('SELECT * FROM previews WHERE lead_id=?').bind(leadId).first<any>();
  if (existing) return existing;
  const profile = profileFor(lead);
  const images = STOCK[profile.key];
  const now = new Date().toISOString();
  const id = `preview-${crypto.randomUUID()}`;
  const slug = `${slugify(lead.clinic)}-${crypto.randomUUID().slice(0, 6)}`;
  await db.batch([
    db.prepare('INSERT INTO previews (id,lead_id,slug,status,theme,accent,headline,subheadline,about,cta_label,hero_image_url,gallery_json,services_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(
      id, leadId, slug, 'draft', 'modern', profile.accent,
      `${lead.clinic}: ${profile.label} que merece destaque.`,
      `Conheça nossos serviços em ${lead.city || lead.location} e fale com a equipe em poucos segundos.`,
      `${lead.clinic} reúne atendimento próximo, qualidade e uma experiência pensada para cada cliente. Esta é uma demonstração inicial e todos os textos e imagens podem ser personalizados.`,
      'Falar no WhatsApp', images[0], JSON.stringify(images.slice(1)), JSON.stringify(profile.services), now, now,
    ),
    db.prepare('UPDATE leads SET preview_accepted=1,preview_accepted_at=COALESCE(preview_accepted_at,?),interest=?,stage=?,updated_at=? WHERE id=?').bind(now, 'Aceitou receber prévia', '05 DEMANDA IDENTIFICADA', now, leadId),
    db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(leadId, 'Prévia criada', lead.stage, '05 DEMANDA IDENTIFICADA', JSON.stringify({ slug }), now),
  ]);
  return db.prepare('SELECT * FROM previews WHERE id=?').bind(id).first();
}

export async function updatePreview(input: any) {
  const db = getD1();
  const current = await db.prepare('SELECT * FROM previews WHERE id=?').bind(input.id).first<any>();
  if (!current) throw new Error('Prévia não encontrada.');
  const themes = ['modern', 'premium', 'bold'];
  const theme = themes.includes(input.theme) ? input.theme : current.theme;
  const accent = /^#[0-9a-f]{6}$/i.test(input.accent || '') ? input.accent : current.accent;
  const services = Array.isArray(input.services) ? input.services.map((x: unknown) => String(x).trim().slice(0, 90)).filter(Boolean).slice(0, 6) : JSON.parse(current.services_json || '[]');
  const gallery = Array.isArray(input.gallery) ? input.gallery.map(safeUrl).filter(Boolean).slice(0, 6) : JSON.parse(current.gallery_json || '[]');
  const now = new Date().toISOString();
  await db.prepare('UPDATE previews SET status=?,theme=?,accent=?,headline=?,subheadline=?,about=?,cta_label=?,hero_image_url=?,gallery_json=?,services_json=?,updated_at=? WHERE id=?').bind(
    input.status === 'published' ? 'published' : 'draft', theme, accent,
    String(input.headline || current.headline).trim().slice(0, 140),
    String(input.subheadline || current.subheadline).trim().slice(0, 240),
    String(input.about || current.about).trim().slice(0, 600),
    String(input.ctaLabel || current.cta_label).trim().slice(0, 50),
    safeUrl(input.heroImageUrl) || current.hero_image_url,
    JSON.stringify(gallery), JSON.stringify(services), now, current.id,
  ).run();
  if (input.status === 'published') {
    await db.batch([
      db.prepare('UPDATE leads SET preview_sent_at=COALESCE(preview_sent_at,?),updated_at=? WHERE id=?').bind(now, now, current.lead_id),
      db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(current.lead_id, 'Prévia publicada', '05 DEMANDA IDENTIFICADA', '05 DEMANDA IDENTIFICADA', JSON.stringify({ slug: current.slug }), now),
    ]);
  }
  return db.prepare('SELECT * FROM previews WHERE id=?').bind(current.id).first();
}

export async function getPreviewBySlug(slug: string) {
  return getD1().prepare('SELECT p.*,l.clinic,l.location,l.city,l.phone FROM previews p JOIN leads l ON l.id=p.lead_id WHERE p.slug=?').bind(slug).first<any>();
}
