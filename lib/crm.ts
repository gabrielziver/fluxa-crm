/* oxlint-disable typescript/no-explicit-any */
import { getD1 } from '@/db';

export const STAGES = ['01 PESQUISADA','02 PRONTA','03 MENSAGEM ENVIADA','04 RESPONDEU','05 DEMANDA IDENTIFICADA','06 PROPOSTA ENVIADA','07 FECHADA','08 PERDIDA'] as const;
const intro=(name:string,focus:string)=>`Oi, pessoal da ${name}! Vi que vocês trabalham com ${focus}. Sou designer e desenvolvedor e posso apoiar a equipe em demandas pontuais, nos bastidores — criativos para campanhas, landing pages e automações. Vocês estão com alguma entrega represada ou precisando de reforço em alguma dessas frentes esta semana? Se fizer sentido, envio alguns trabalhos e combinamos um primeiro projeto de escopo fechado.`;
const AGENCIES=[
  {id:'agency-cosmica',name:'Agência Cósmica',focus:'mídias sociais, tráfego pago e landing pages',opportunity:'Apoio de produção para campanhas e páginas',contact:'https://www.agenciacosmica.com.br/contato',email:'contato@agenciacosmica.com.br',source:'https://www.agenciacosmica.com.br/servicos',priority:3},
  {id:'agency-one8020',name:'ONE 80/20',focus:'tráfego pago, redes sociais e websites',opportunity:'Criativos e landing pages para campanhas',contact:'https://one8020.com.br/',email:'',source:'https://one8020.com.br/',priority:3},
  {id:'agency-lothax',name:'Lothax',focus:'SEO, sites, anúncios e direção de arte',opportunity:'Apoio em design e produção web',contact:'https://www.lothax.com.br/',email:'',source:'https://www.lothax.com.br/',priority:3},
  {id:'agency-quartza',name:'QUARTZA',focus:'identidade visual, gestão de redes sociais e tráfego pago',opportunity:'Criativos e identidade visual em projetos pontuais',contact:'https://www.agenciaquartza.com.br/',email:'agenciaquartza@gmail.com',source:'https://www.agenciaquartza.com.br/',priority:3},
  {id:'agency-storm',name:'Storm Studio',focus:'redes sociais, vídeo e branding',opportunity:'Apoio em peças visuais e páginas de campanha',contact:'https://www.stormlabs.com.br/',email:'',source:'https://www.stormlabs.com.br/',priority:2},
  {id:'agency-dyzzi',name:'DYZZI',focus:'conteúdo, design, tráfego e automações',opportunity:'Apoio de execução em design e automações',contact:'https://www.agenciadyzzi.com.br/',email:'',source:'https://www.agenciadyzzi.com.br/',priority:2},
  {id:'agency-include',name:'INCLUDE',focus:'tráfego pago e gestão de redes sociais',opportunity:'Criativos e landing pages para clientes da agência',contact:'https://www.includeweb.com.br/',email:'',source:'https://www.includeweb.com.br/',priority:2},
  {id:'agency-tante',name:'Tante Comunicação Digital',focus:'sites, inbound marketing e redes sociais',opportunity:'Apoio em páginas e materiais visuais',contact:'https://www.tante.com.br/',email:'',source:'https://www.tante.com.br/',priority:2},
];
const isAgency=(id:string)=>id.startsWith('agency-');
const today=()=>new Date().toISOString().slice(0,10);
const plusDays=(n:number)=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);

export async function ensureSeeded(){
  const db=getD1();const found=(await db.prepare("SELECT id FROM leads WHERE id LIKE 'agency-%'").all()).results as {id:string}[];const ids=new Set(found.map(x=>x.id));
  const max=await db.prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads').first<{value:number}>();let number=max?.value??0;const now=new Date().toISOString();
  const inserts=AGENCIES.filter(a=>!ids.has(a.id)).map(a=>db.prepare('INSERT OR IGNORE INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(a.id,++number,a.name,'Recife · PE','Recife','—','02 PRONTA',a.priority,'Prioridade da primeira rodada',a.priority===3?'Alta':'Média',a.opportunity,a.opportunity,a.email,0,0,a.focus,'',a.contact,'Possível parceria; necessidade ainda não confirmada.','Serviços verificados em site oficial. Confirmar pessoa e canal antes de enviar.',intro(a.name,a.focus),JSON.stringify([{type:'Site oficial',url:a.source,use:'Serviços declarados'},{type:'Contato',url:a.contact,use:'Canal público'}]),now,now));
  if(inserts.length)await db.batch(inserts);
}

export async function bootstrap(){
  await ensureSeeded();const db=getD1();
  const leads=(await db.prepare("SELECT * FROM leads WHERE id LIKE 'agency-%' ORDER BY score DESC, lead_number ASC").all()).results as any[];
  const events=(await db.prepare("SELECT e.* FROM lead_events e JOIN leads l ON l.id=e.lead_id WHERE l.id LIKE 'agency-%' ORDER BY e.created_at DESC").all()).results;
  const notes=(await db.prepare("SELECT n.* FROM lead_notes n JOIN leads l ON l.id=n.lead_id WHERE l.id LIKE 'agency-%' ORDER BY n.created_at DESC").all()).results;
  const count=(key:string)=>leads.filter(l=>l[key]).length;const active=leads.filter(l=>!['07 FECHADA','08 PERDIDA'].includes(l.stage));const approached=count('first_contact_at'),replies=count('replied_at');
  const metrics={total:leads.length,ready:leads.filter(l=>l.stage==='02 PRONTA').length,approached,replies,demands:leads.filter(l=>['05 DEMANDA IDENTIFICADA','06 PROPOSTA ENVIADA','07 FECHADA'].includes(l.stage)).length,proposals:count('proposal_at'),sales:count('closed_at'),revenue:leads.reduce((sum,l)=>sum+(Number(l.closed_value)||0),0),due:active.filter(l=>l.next_follow_up_at?.slice(0,10)===today()).length,overdue:active.filter(l=>l.next_follow_up_at&&l.next_follow_up_at.slice(0,10)<today()).length,replyRate:approached?replies/approached:null};
  return {leads,events,notes,metrics,stages:STAGES};
}
const ACTIONS:Record<string,{stage:string;event:string}>={ready:{stage:'02 PRONTA',event:'Contato qualificado'},mark_sent:{stage:'03 MENSAGEM ENVIADA',event:'Mensagem enviada'},mark_replied:{stage:'04 RESPONDEU',event:'Resposta recebida'},demand:{stage:'05 DEMANDA IDENTIFICADA',event:'Demanda identificada'},proposal:{stage:'06 PROPOSTA ENVIADA',event:'Proposta enviada'},sale:{stage:'07 FECHADA',event:'Parceria fechada'},lost:{stage:'08 PERDIDA',event:'Oportunidade perdida'}};

export async function updateLead(input:{id:string;action?:string;stage?:string;value?:number;followUpAt?:string}){
  if(!isAgency(input.id||''))throw new Error('Lead fora da operação de agências.');await ensureSeeded();const db=getD1();const lead=await db.prepare('SELECT stage FROM leads WHERE id=?').bind(input.id).first<{stage:string}>();if(!lead)throw new Error('Agência não encontrada.');
  const now=new Date().toISOString();
  if(input.action==='schedule_followup'){
    if(['07 FECHADA','08 PERDIDA'].includes(lead.stage))throw new Error('Esta oportunidade já foi concluída.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input.followUpAt||''))throw new Error('Informe uma data válida.');
    await db.batch([db.prepare('UPDATE leads SET next_follow_up_at=?,updated_at=? WHERE id=?').bind(input.followUpAt,now,input.id),db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(input.id,'Follow-up agendado',lead.stage,lead.stage,JSON.stringify({date:input.followUpAt}),now)]);return bootstrap();
  }
  const allowed:Record<string,string[]>={ready:['01 PESQUISADA'],mark_sent:['02 PRONTA'],mark_replied:['03 MENSAGEM ENVIADA'],demand:['04 RESPONDEU'],proposal:['05 DEMANDA IDENTIFICADA'],sale:['06 PROPOSTA ENVIADA'],lost:['01 PESQUISADA','02 PRONTA','03 MENSAGEM ENVIADA','04 RESPONDEU','05 DEMANDA IDENTIFICADA','06 PROPOSTA ENVIADA']};
  if(!input.action||!allowed[input.action]?.includes(lead.stage))throw new Error('Esta ação não corresponde à etapa atual.');
  const def=ACTIONS[input.action];if(!def)throw new Error('Ação inválida.');
  const fields:Record<string,unknown>={stage:def.stage,updated_at:now};
  if(input.action==='mark_sent'){fields.first_contact_at=now;fields.last_contact_at=now;fields.next_follow_up_at=input.followUpAt||plusDays(2)}
  if(input.action==='mark_replied'){fields.replied_at=now;fields.last_contact_at=now;fields.next_follow_up_at=null}
  if(input.action==='demand')fields.interest='Sim';
  if(input.action==='proposal'){fields.proposal_at=now;fields.next_follow_up_at=plusDays(2)}
  if(input.action==='sale'){if(!input.value||input.value<=0)throw new Error('Informe o valor do projeto.');fields.closed_at=now;fields.closed_value=input.value;fields.next_follow_up_at=null}
  if(input.action==='lost')fields.next_follow_up_at=null;
  const keys=Object.keys(fields);await db.batch([db.prepare(`UPDATE leads SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`).bind(...keys.map(k=>fields[k]),input.id),db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(input.id,def.event,lead.stage,def.stage,JSON.stringify({value:input.value}),now)]);return bootstrap();
}
export async function addNote(id:string,body:string){if(!isAgency(id))throw new Error('Lead fora da operação de agências.');if(!body.trim())throw new Error('Escreva uma nota.');await ensureSeeded();const db=getD1();await db.prepare('INSERT INTO lead_notes (lead_id,body,created_at) VALUES (?,?,?)').bind(id,body.trim(),new Date().toISOString()).run();return bootstrap()}
export async function addManualLead(input:{name?:string;city?:string;contact?:string;email?:string;focus?:string;opportunity?:string;opening?:string}){
  const name=input.name?.trim(),contact=input.contact?.trim(),email=input.email?.trim();if(!name||(!contact&&!email))throw new Error('Informe o nome e um canal de contato.');if(contact&&!/^https:\/\//i.test(contact))throw new Error('O link deve começar com https://.');
  await ensureSeeded();const db=getD1();const max=await db.prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads').first<{value:number}>();const now=new Date().toISOString();const id=`agency-manual-${crypto.randomUUID()}`;const city=input.city?.trim()||'A confirmar';const focus=input.focus?.trim()||'serviços a confirmar';
  await db.batch([db.prepare('INSERT INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,(max?.value??0)+1,name,city,city,'—','01 PESQUISADA',1,'Lead manual — verificar dados','Nova',input.opportunity?.trim()||'A investigar',input.opportunity?.trim()||'A investigar',email||'',0,0,focus,'',contact||'','Necessidade ainda não confirmada.','Lead manual; verificar contato e serviços antes de enviar.',input.opening?.trim()||intro(name,focus),JSON.stringify(contact?[{type:'Contato informado',url:contact,use:'Verificar antes de abordar'}]:[]),now,now),db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(id,'Agência adicionada',null,'01 PESQUISADA',null,now)]);return bootstrap();
}
