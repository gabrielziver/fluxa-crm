import { getD1 } from '@/db';
import { bootstrap } from '@/lib/crm';

const STATES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};
type Category = 'todas' | 'marketing' | 'comunicacao' | 'design';
type OSMElement = {
  type: string;
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
};
export type Candidate = {
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
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const cleanUrl = (text?: string) => {
  if (!text) return '';
  try {
    const value = new URL(text.trim());
    return ['https:', 'http:'].includes(value.protocol) ? value.href : '';
  } catch {
    return '';
  }
};
const safeText = (value?: string, limit = 180) =>
  value?.trim().slice(0, limit) || '';
function validate(input: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
}) {
  const city = safeText(input.city, 60);
  const state = safeText(input.state, 2).toUpperCase();
  const category = (input.category || 'todas') as Category;
  const limit = Number(input.limit || 50);
  if (!STATES[state]) throw new Error('Escolha um estado brasileiro.');
  if (city && !/^[\p{L}\s.'-]{2,60}$/u.test(city))
    throw new Error('Informe uma cidade válida.');
  if (!['todas', 'marketing', 'comunicacao', 'design'].includes(category))
    throw new Error('Categoria inválida.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new Error('Escolha entre 1 e 100 resultados.');
  return { city, state, category, limit };
}
function queryFor(city: string, state: string, category: Category) {
  const stateArea = `area["boundary"="administrative"]["admin_level"="4"]["ISO3166-2"="BR-${state}"]->.state;`;
  const cityArea = city
    ? `rel(area.state)["boundary"="administrative"]["name"=${JSON.stringify(city)}];map_to_area->.searchArea;`
    : 'area.state->.searchArea;';
  const sections: string[] = [];
  if (
    category === 'todas' ||
    category === 'marketing' ||
    category === 'comunicacao'
  )
    sections.push(
      'nwr(area.searchArea)["office"="advertising_agency"]["name"];',
    );
  if (category === 'todas' || category === 'comunicacao')
    sections.push('nwr(area.searchArea)["office"="media"]["name"];');
  if (category === 'todas' || category === 'design')
    sections.push('nwr(area.searchArea)["office"="graphic_design"]["name"];');
  if (category === 'todas' || category === 'marketing')
    sections.push(
      'nwr(area.searchArea)["office"="company"]["name"~"marketing|publicidade|agencia|agência|digital",i];',
    );
  return `[out:json][timeout:20][maxsize:10485760];${stateArea}${cityArea}(${sections.join('')});out center 300;`;
}
export async function searchAgencies(input: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
}) {
  const { city, state, category, limit } = validate(input);
  const query = queryFor(city, state, category);
  const endpoints = [
    'https://overpass.private.coffee/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];
  let elements: OSMElement[] | null = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'FluxaCRM/1.0 (private research tool)',
          accept: 'application/json',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(22000),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as { elements?: OSMElement[] };
      if (Array.isArray(payload.elements)) {
        elements = payload.elements;
        break;
      }
    } catch {
      /* Try the next public instance. */
    }
  }
  if (!elements)
    throw new Error(
      'A fonte pública do mapa está indisponível agora. Tente novamente mais tarde ou adicione agências manualmente.',
    );
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const item of elements) {
    const tags = item.tags || {};
    const name = safeText(tags.name, 120);
    if (!name) continue;
    const key = normalize(name);
    if (seen.has(key)) continue;
    seen.add(key);
    const website = cleanUrl(tags.website || tags['contact:website']);
    const email = safeText(tags.email || tags['contact:email'], 120);
    const phone = safeText(tags.phone || tags['contact:phone'], 50);
    const address = [tags['addr:street'], tags['addr:housenumber']]
      .filter(Boolean)
      .join(', ');
    candidates.push({
      id: `agency-osm-${item.type}-${item.id}`,
      name,
      city: city || STATES[state],
      state,
      category: tags.office || 'agência',
      website,
      email,
      phone,
      osmUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      address,
    });
  }
  candidates.sort(
    (a, b) =>
      Number(Boolean(b.website || b.email || b.phone)) -
        Number(Boolean(a.website || a.email || a.phone)) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
  const db = getD1();
  const existing = (
    await db
      .prepare("SELECT id,clinic,location FROM leads WHERE id LIKE 'agency-%'")
      .all()
  ).results as { id: string; clinic: string; location: string }[];
  const location = `${city || STATES[state]} · ${state}`;
  const ids = new Set(existing.map((x) => x.id));
  const names = new Set(
    existing
      .filter((x) => x.location === location)
      .map((x) => normalize(x.clinic)),
  );
  const fresh = candidates
    .filter((x) => !ids.has(x.id) && !names.has(normalize(x.name)))
    .slice(0, limit);
  return {
    candidates: fresh,
    found: candidates.length,
    alreadyInCrm: candidates.length - fresh.length,
    requested: limit,
    city: city || '',
    state,
    location,
    provider: 'OpenStreetMap / Overpass',
    attribution: '© OpenStreetMap contributors · ODbL',
  };
}
export async function importAgencies(input: {
  city?: string;
  state?: string;
  candidates?: Candidate[];
}) {
  const { city, state } = validate({
    city: input.city,
    state: input.state,
    limit: 50,
  });
  const raw = input.candidates;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 100)
    throw new Error('Selecione de 1 a 100 agências para importar.');
  const db = getD1();
  const location = `${city || STATES[state]} · ${state}`;
  const existing = (
    await db
      .prepare("SELECT id,clinic,location FROM leads WHERE id LIKE 'agency-%'")
      .all()
  ).results as { id: string; clinic: string; location: string }[];
  const ids = new Set(existing.map((x) => x.id));
  const names = new Set(
    existing
      .filter((x) => x.location === location)
      .map((x) => normalize(x.clinic)),
  );
  const max = await db
    .prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads')
    .first<{ value: number }>();
  let number = max?.value ?? 0;
  const now = new Date().toISOString();
  const inserts = [];
  for (const item of raw) {
    if (
      !/^agency-osm-(node|way|relation)-\d+$/.test(item.id) ||
      ids.has(item.id)
    )
      continue;
    const name = safeText(item.name, 120);
    if (!name || names.has(normalize(name))) continue;
    ids.add(item.id);
    names.add(normalize(name));
    const expected = `https://www.openstreetmap.org/${item.id.replace('agency-osm-', '').replace(/-(?=\d+$)/, '/')}`;
    if (item.osmUrl !== expected) continue;
    const website = cleanUrl(item.website);
    const email = safeText(item.email, 120);
    const phone = safeText(item.phone, 50);
    const focus = 'comunicação, marketing ou design (confirmar serviços)';
    const opening = `Oi, pessoal da ${name}! Sou designer e desenvolvedor e posso apoiar a equipe em demandas pontuais, como criativos, landing pages e automações. Vocês precisam de reforço em alguma entrega esta semana? Se fizer sentido, envio exemplos e combinamos um primeiro projeto de escopo fechado.`;
    inserts.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          item.id,
          ++number,
          name,
          location,
          city || STATES[state],
          safeText(item.address, 120) || '—',
          '01 PESQUISADA',
          1,
          'Fonte aberta — verificar dados',
          'Nova',
          'Possível apoio de produção; demanda não confirmada.',
          'Possível apoio de produção; demanda não confirmada.',
          email,
          0,
          0,
          focus,
          phone,
          website,
          'Possível parceria; necessidade ainda não confirmada.',
          'Dados do OpenStreetMap podem estar incompletos ou desatualizados. Confirme agência, cidade, serviços e canal antes de abordar.',
          opening,
          JSON.stringify([
            {
              type: 'OpenStreetMap',
              url: expected,
              use: 'Fonte do registro geográfico',
            },
            ...(website
              ? [
                  {
                    type: 'Site informado no mapa',
                    url: website,
                    use: 'Canal a verificar',
                  },
                ]
              : []),
          ]),
          now,
          now,
        ),
    );
  }
  if (inserts.length) await db.batch(inserts);
  return { imported: inserts.length, data: await bootstrap() };
}
