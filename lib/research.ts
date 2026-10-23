import { getD1 } from '@/db';
import { bootstrap } from '@/lib/crm';
import { initialMessage } from '@/lib/outreach';
import { env } from 'cloudflare:workers';

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
type Category = 'todas' | 'restaurante' | 'barbearia' | 'beleza' | 'clinica' | 'academia';
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
  source?: 'google' | 'osm';
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  hasWebsite?: boolean;
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
  if (!['todas', 'restaurante', 'barbearia', 'beleza', 'clinica', 'academia'].includes(category))
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
  if (category === 'todas' || category === 'restaurante') sections.push('nwr(area.searchArea)["amenity"~"restaurant|cafe|fast_food"]["name"];');
  if (category === 'todas' || category === 'barbearia') sections.push('nwr(area.searchArea)["shop"="hairdresser"]["name"~"barbear|barber",i];');
  if (category === 'todas' || category === 'beleza') sections.push('nwr(area.searchArea)["shop"~"beauty|hairdresser"]["name"];');
  if (category === 'todas' || category === 'clinica') sections.push('nwr(area.searchArea)["amenity"~"clinic|dentist|doctors"]["name"];');
  if (category === 'todas' || category === 'academia') sections.push('nwr(area.searchArea)["leisure"="fitness_centre"]["name"];');
  return `[out:json][timeout:12][maxsize:10485760];${stateArea}${cityArea}(${sections.join('')});out center 300;`;
}

const GOOGLE_CATEGORY: Record<Category, string> = {
  todas: 'empresas locais',
  restaurante: 'restaurantes',
  barbearia: 'barbearias',
  beleza: 'salões de beleza e clínicas de estética',
  clinica: 'clínicas e consultórios',
  academia: 'academias e estúdios fitness',
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
};

export async function searchGooglePlaces(input: {
  city?: string;
  state?: string;
  category?: string;
  limit?: number;
}) {
  const { city, state, category, limit } = validate(input);
  const apiKey = String((env as unknown as Record<string, unknown>).GOOGLE_PLACES_API_KEY || '').trim();
  if (!apiKey)
    throw new Error('A busca Google Places ainda precisa da chave GOOGLE_PLACES_API_KEY. O código já está preparado; configure a chave para ativar a pesquisa real.');
  const requested = Math.min(limit, 60);
  const query = `${GOOGLE_CATEGORY[category]} em ${city || STATES[state]}, ${state}, Brasil`;
  const collected: GooglePlace[] = [];
  let pageToken = '';
  while (collected.length < requested) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,nextPageToken',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'pt-BR', regionCode: 'BR', pageSize: Math.min(20, requested - collected.length), ...(pageToken ? { pageToken } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json() as { places?: GooglePlace[]; nextPageToken?: string; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message || 'A Google Places API recusou a pesquisa. Confira a chave, o faturamento e se a Places API (New) está ativada.');
    collected.push(...(payload.places || []));
    if (!payload.nextPageToken || !(payload.places || []).length) break;
    pageToken = payload.nextPageToken;
  }
  const location = `${city || STATES[state]} · ${state}`;
  const db = getD1();
  const existing = (await db.prepare("SELECT id,clinic,location FROM leads WHERE id LIKE 'agency-%'").all()).results as { id:string; clinic:string; location:string }[];
  const ids = new Set(existing.map((item) => item.id));
  const names = new Set(existing.filter((item) => item.location === location).map((item) => normalize(item.clinic)));
  const candidates = collected.map((place): Candidate | null => {
    const placeId = safeText(place.id, 180);
    const name = safeText(place.displayName?.text, 120);
    if (!placeId || !name) return null;
    return {
      id: `agency-google-${placeId.replace(/[^A-Za-z0-9_-]/g, '')}`,
      placeId,
      source: 'google',
      name,
      city: city || STATES[state],
      state,
      category: safeText(place.primaryTypeDisplayName?.text, 80) || GOOGLE_CATEGORY[category],
      website: cleanUrl(place.websiteUri),
      email: '',
      phone: safeText(place.nationalPhoneNumber || place.internationalPhoneNumber, 50),
      osmUrl: cleanUrl(place.googleMapsUri),
      address: safeText(place.formattedAddress, 180),
      rating: Number(place.rating || 0),
      reviewCount: Number(place.userRatingCount || 0),
      hasWebsite: Boolean(place.websiteUri),
    };
  }).filter((candidate): candidate is Candidate => Boolean(candidate))
    .filter((candidate) => !ids.has(candidate.id) && !names.has(normalize(candidate.name)))
    .sort((a,b) => Number(a.hasWebsite)-Number(b.hasWebsite) || Number(Boolean(b.phone))-Number(Boolean(a.phone)) || (b.reviewCount || 0)-(a.reviewCount || 0))
    .slice(0, requested);
  return { candidates, found: collected.length, alreadyInCrm: collected.length-candidates.length, requested, city: city || '', state, location, provider: 'Google Places API (New)', attribution: 'Dados fornecidos pela Google Places API' };
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
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
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
        signal: AbortSignal.timeout(12000),
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
      'A fonte pública do mapa está indisponível agora. Use a busca no Google Maps e a importação em lote abaixo.',
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
      category: tags.amenity || tags.shop || tags.leisure || 'empresa local',
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
    throw new Error('Selecione de 1 a 100 empresas para importar.');
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
    const isGoogle = item.source === 'google' && /^agency-google-[A-Za-z0-9_-]+$/.test(item.id);
    const isOsm = /^agency-osm-(node|way|relation)-\d+$/.test(item.id);
    if (
      (!isGoogle && !isOsm) ||
      ids.has(item.id)
    )
      continue;
    const name = safeText(item.name, 120);
    if (!name || names.has(normalize(name))) continue;
    ids.add(item.id);
    names.add(normalize(name));
    const expected = isGoogle ? cleanUrl(item.osmUrl) : `https://www.openstreetmap.org/${item.id.replace('agency-osm-', '').replace(/-(?=\d+$)/, '/')}`;
    if (!expected) continue;
    if (isGoogle) {
      const hostname = new URL(expected).hostname;
      if (!hostname.endsWith('google.com')) continue;
    } else if (item.osmUrl !== expected) continue;
    const website = cleanUrl(item.website);
    const email = safeText(item.email, 120);
    const phone = safeText(item.phone, 50);
    const focus = safeText(item.category, 80) || 'negócio local (confirmar serviços)';
    const score = Math.min(4, 1 + Number(!website) + Number(Boolean(phone)) + Number((item.reviewCount || 0) >= 20));
    const opening = initialMessage(city);
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
          score,
          `${!website ? 'Sem site informado' : 'Site informado'} · ${item.reviewCount || 0} avaliações`,
          score >= 4 ? 'Alta' : score >= 3 ? 'Média' : 'Nova',
          website ? 'Avaliar qualidade do site atual.' : 'Empresa sem site informado no mapa.',
          website ? 'Site existente — verificar oportunidade de melhoria.' : 'Boa candidata para uma prévia gratuita.',
          email,
          Number(item.rating || 0),
          Number(item.reviewCount || 0),
          focus,
          phone,
          website,
          'Possível cliente para criação de site; interesse ainda não confirmado.',
          'Dados do OpenStreetMap podem estar incompletos ou desatualizados. Confirme empresa, cidade, serviços e canal antes de abordar.',
          opening,
          JSON.stringify([
            {
              type: isGoogle ? 'Google Maps' : 'OpenStreetMap',
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

export async function importPastedAgencies(input: {
  city?: string;
  state?: string;
  rows?: {
    name?: string;
    contact?: string;
    email?: string;
    phone?: string;
    mapUrl?: string;
    address?: string;
    category?: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
  }[];
}) {
  const { city, state } = validate({
    city: input.city,
    state: input.state,
    limit: 50,
  });
  if (
    !Array.isArray(input.rows) ||
    input.rows.length < 1 ||
    input.rows.length > 100
  )
    throw new Error('Cole entre 1 e 100 empresas.');
  const location = `${city || STATES[state]} · ${state}`;
  const db = getD1();
  const existing = (
    await db
      .prepare(
        "SELECT clinic FROM leads WHERE id LIKE 'agency-%' AND location=?",
      )
      .bind(location)
      .all()
  ).results as { clinic: string }[];
  const names = new Set(existing.map((item) => normalize(item.clinic)));
  const max = await db
    .prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads')
    .first<{ value: number }>();
  let number = max?.value ?? 0;
  const now = new Date().toISOString();
  const inserts = [];
  for (const row of input.rows) {
    const name = safeText(row.name, 120);
    if (!name || names.has(normalize(name))) continue;
    names.add(normalize(name));
    const contact = cleanUrl(row.contact);
    const mapUrl = cleanUrl(row.mapUrl);
    const email = safeText(row.email, 120);
    const phone = safeText(row.phone, 50);
    if (row.contact && !contact)
      throw new Error(`Link inválido para ${name}. Use https://.`);
    if (row.mapUrl && (!mapUrl || !new URL(mapUrl).hostname.endsWith('google.com')))
      throw new Error(`Link do Google Maps inválido para ${name}.`);
    const opening = initialMessage(city);
    const rating = Math.min(5, Math.max(0, Number(row.rating || 0)));
    const reviewCount = Math.max(0, Math.round(Number(row.reviewCount || 0)));
    const category = safeText(row.category, 80) || 'negócio local (confirmar serviços)';
    const address = safeText(row.address, 120) || '—';
    const image = cleanUrl(row.image);
    const score = Math.min(4, 1 + Number(Boolean(mapUrl)) + Number(reviewCount >= 20) + Number(rating >= 4.5));
    inserts.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          `agency-pasted-${crypto.randomUUID()}`,
          ++number,
          name,
          location,
          city || STATES[state],
          address,
          '01 PESQUISADA',
          score,
          mapUrl ? `${rating ? `Nota ${rating.toFixed(1)}` : 'Sem nota'} · ${reviewCount} avaliações` : 'Importação manual — verificar dados',
          score >= 4 ? 'Alta' : score >= 3 ? 'Média' : 'Nova',
          contact ? 'Verificar se o site pode ser melhorado.' : 'Empresa sem site informado.',
          contact ? 'Site existente — verificar oportunidade.' : 'Boa candidata para uma prévia gratuita.',
          email,
          rating,
          reviewCount,
          category,
          phone,
          contact,
          'Possível cliente para criação de site; interesse ainda não confirmado.',
          mapUrl ? 'Dados extraídos do Google Maps pelo Instant Data Scraper. Confirme telefone, site e canal antes de abordar.' : 'Empresa importada pelo usuário; confirme a fonte, serviços, localização e canal antes de abordar.',
          opening,
          JSON.stringify([
            ...(mapUrl ? [{ type: 'Google Maps', url: mapUrl, use: 'Fonte do registro público' }] : []),
            ...(contact ? [{ type: 'Link informado', url: contact, use: 'Verificar antes de abordar' }] : []),
            ...(image ? [{ type: 'Imagem pública', url: image, use: 'Referência visual do negócio' }] : []),
          ]),
          now,
          now,
        ),
    );
  }
  if (inserts.length) await db.batch(inserts);
  return { imported: inserts.length, data: await bootstrap(), location };
}
