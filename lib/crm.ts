/* oxlint-disable typescript/no-explicit-any */
import { getD1 } from '@/db';
import { SALES_SCRIPTS, SEED_LEADS } from '@/db/seed-data';

export const STAGES = ['01 PROSPECTADO','02 QUALIFICADO','03 CONTATO PRONTO','04 MENSAGEM ENVIADA','05 RESPONDEU','06 INTERESSADO','07 PRÉVIA ACEITA','08 PRÉVIA EM PRODUÇÃO','09 PRÉVIA ENVIADA','10 NEGOCIAÇÃO','11 FECHADO','12 PAGO','13 EM PRODUÇÃO','14 ENTREGUE','15 FOLLOW-UP','16 PERDIDO'] as const;

export async function ensureSeeded() {
  const db = getD1();
  const count = await db.prepare('SELECT COUNT(*) AS total FROM leads').first<{total:number}>();
  if ((count?.total ?? 0) > 0) return;
  const now = new Date().toISOString();
  await db.batch(SEED_LEADS.map((l) => db.prepare('INSERT OR IGNORE INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(l.id,l.leadNumber,l.clinic,l.location,l.city,l.neighborhood,l.stage,l.score,l.scoreBreakdown,l.className,l.siteIssue,l.siteProblem,l.instagram,l.rating,l.reviewCount,l.services,l.phone,l.whatsappUrl,l.rationale,l.verificationNotes,l.specificOpening,JSON.stringify(l.sources),now,now)));
}

export async function bootstrap() {
  await ensureSeeded(); const db = getD1();
  const leads = (await db.prepare('SELECT * FROM leads ORDER BY score DESC, review_count DESC').all()).results;
  const events = (await db.prepare('SELECT * FROM lead_events ORDER BY created_at DESC').all()).results;
  const notes = (await db.prepare('SELECT * FROM lead_notes ORDER BY created_at DESC').all()).results;
  const now = new Date().toISOString(), day=now.slice(0,10);
  const active = leads.filter((l:any) => !['11 FECHADO','12 PAGO','13 EM PRODUÇÃO','14 ENTREGUE','16 PERDIDO'].includes(l.stage));
  const number = (key:string) => leads.filter((l:any) => l[key]).length;
  const approached=number('first_contact_at'), replies=number('replied_at'), interested=leads.filter((l:any)=>l.interest==='Sim').length, sales=number('closed_at');
  const metrics={total:leads.length,ready:leads.filter((l:any)=>String(l.whatsapp_url).startsWith('https://wa.me/')).length,approached,replies,interested,previewAccepted:number('preview_accepted_at'),previewSent:number('preview_sent_at'),negotiations:number('proposal_at'),sales,paid:number('paid_at'),revenue:leads.reduce((s:number,l:any)=>s+(Number(l.closed_value)||0),0),due:active.filter((l:any)=>l.next_follow_up_at?.slice(0,10)===day).length,overdue:active.filter((l:any)=>l.next_follow_up_at && l.next_follow_up_at.slice(0,10)<day).length,replyRate:approached?replies/approached:null,closeRate:interested?sales/interested:null};
  return {leads,events,notes,metrics,stages:STAGES};
}

const ACTIONS:Record<string,{stage:string,event:string,fields?:Record<string,unknown>}>= {
  mark_sent:{stage:'04 MENSAGEM ENVIADA',event:'Mensagem enviada',fields:{contact_result:'Aguardando resposta'}}, mark_replied:{stage:'05 RESPONDEU',event:'Resposta recebida',fields:{contact_result:'Respondeu'}}, mark_interested:{stage:'06 INTERESSADO',event:'Lead interessado',fields:{interest:'Sim'}}, mark_not_interested:{stage:'16 PERDIDO',event:'Sem interesse',fields:{interest:'Não',contact_result:'Sem interesse'}}, preview_accepted:{stage:'07 PRÉVIA ACEITA',event:'Prévia aceita'}, preview_sent:{stage:'09 PRÉVIA ENVIADA',event:'Prévia enviada'}, negotiation:{stage:'10 NEGOCIAÇÃO',event:'Negociação iniciada'}, sale:{stage:'11 FECHADO',event:'Venda fechada'}, paid:{stage:'12 PAGO',event:'Pagamento confirmado',fields:{paid:1}}, delivered:{stage:'14 ENTREGUE',event:'Projeto entregue'}, no_response:{stage:'15 FOLLOW-UP',event:'Sem resposta',fields:{contact_result:'Não respondeu'}}, lost:{stage:'16 PERDIDO',event:'Lead perdido'}, schedule_followup:{stage:'15 FOLLOW-UP',event:'Follow-up agendado'}
};

export async function updateLead(input:{id:string;action?:string;stage?:string;value?:number;followUpAt?:string}) {
  await ensureSeeded(); const db=getD1(); const lead=await db.prepare('SELECT stage FROM leads WHERE id=?').bind(input.id).first<{stage:string}>(); if(!lead)throw new Error('Lead não encontrado.');
  const def=input.stage?{stage:input.stage,event:'Etapa atualizada'}:ACTIONS[input.action||'']; if(!def||!STAGES.includes(def.stage as any))throw new Error('Ação ou etapa inválida.');
  const now=new Date().toISOString(); const fields:Record<string,unknown>={stage:def.stage,updated_at:now,...def.fields};
  if(input.action==='mark_sent'){fields.first_contact_at=now;fields.last_contact_at=now;fields.next_follow_up_at=input.followUpAt||new Date(Date.now()+2*86400000).toISOString().slice(0,10)}
  if(input.action==='mark_replied'){fields.replied_at=now;fields.last_contact_at=now;fields.next_follow_up_at=null}
  if(input.action==='preview_accepted')fields.preview_accepted_at=now;if(input.action==='preview_sent')fields.preview_sent_at=now;if(input.action==='negotiation')fields.proposal_at=now;
  if(input.action==='sale'){if(!input.value||input.value<=0)throw new Error('Informe o valor da venda.');fields.closed_at=now;fields.closed_value=input.value;fields.next_follow_up_at=null}
  if(input.action==='paid')fields.paid_at=now;if(input.action==='delivered')fields.delivered_at=now;
  if(['schedule_followup','no_response'].includes(input.action||'')){if(!input.followUpAt)throw new Error('Informe a data do follow-up.');fields.next_follow_up_at=input.followUpAt}
  const keys=Object.keys(fields); const update=db.prepare(`UPDATE leads SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`).bind(...keys.map(k=>fields[k]),input.id);
  const event=db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(input.id,def.event,lead.stage,def.stage,JSON.stringify({value:input.value,followUpAt:input.followUpAt}),now);
  await db.batch([update,event]); return bootstrap();
}

export async function addNote(id:string,body:string){if(!body.trim())throw new Error('A nota não pode ficar vazia.');await ensureSeeded();const db=getD1();await db.prepare('INSERT INTO lead_notes (lead_id,body,created_at) VALUES (?,?,?)').bind(id,body.trim(),new Date().toISOString()).run();return bootstrap()}

export async function addManualLead(input:{clinic?:string;city?:string;neighborhood?:string;phone?:string;whatsapp?:string;services?:string}) {
  const clinic=input.clinic?.trim(), city=input.city?.trim(), phone=input.phone?.trim();
  if(!clinic||!city||!phone)throw new Error('Preencha clínica, cidade e telefone.');
  await ensureSeeded(); const db=getD1();
  const max=await db.prepare('SELECT COALESCE(MAX(lead_number),0) AS value FROM leads').first<{value:number}>();
  const leadNumber=(max?.value??0)+1, now=new Date().toISOString();
  const digits=(input.whatsapp||phone).replace(/\D/g,'');
  const normalized=digits.length>=12?digits:digits.length>=10?`55${digits}`:'';
  const whatsappUrl=normalized?`https://wa.me/${normalized}`:'Não disponível';
  const id=`lead-manual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const stage=normalized?'03 CONTATO PRONTO':'02 QUALIFICADO';
  const insert=db.prepare('INSERT INTO leads (id,lead_number,clinic,location,city,neighborhood,stage,score,score_breakdown,class_name,site_issue,site_problem,instagram,rating,review_count,services,phone,whatsapp_url,rationale,verification_notes,specific_opening,sources_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,leadNumber,clinic,`${city} / ${input.neighborhood?.trim()||'bairro a confirmar'}`,city,input.neighborhood?.trim()||'bairro a confirmar',stage,1,'Lead adicionado manualmente — qualificação pendente','Novo','A confirmar','Lead manual ainda precisa de pesquisa e qualificação.','Não confirmado',0,0,input.services?.trim()||'Não verificados',phone,whatsappUrl,'Lead adicionado manualmente para pesquisa e prospecção.','Dados informados manualmente; confirme presença, serviços e contato antes da abordagem.',SALES_SCRIPTS.noSite,'[]',now,now);
  const event=db.prepare('INSERT INTO lead_events (lead_id,event_type,from_stage,to_stage,metadata_json,created_at) VALUES (?,?,?,?,?,?)').bind(id,'Lead adicionado manualmente',null,stage,null,now);
  await db.batch([insert,event]); return bootstrap();
}
