'use client';
/* oxlint-disable typescript/no-explicit-any */
import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, Image as ImageIcon, Monitor, Send, Smartphone, Sparkles, WandSparkles, X } from 'lucide-react';

const parse = (value: string) => { try { return JSON.parse(value || '[]'); } catch { return []; } };

export default function PreviewStudio({ leads, previews, busy, save, copy }: { leads:any[]; previews:any[]; busy:boolean; save:(payload:any)=>Promise<boolean>; copy:(value:string,label?:string)=>void }) {
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [leadId,setLeadId]=useState('');
  const [device,setDevice]=useState<'desktop'|'mobile'>('desktop');
  const selected=previews.find((item)=>item.id===selectedId)||null;
  const eligible=useMemo(()=>leads.filter((lead)=>!previews.some((preview)=>preview.lead_id===lead.id)&&!['07 FECHADA','08 PERDIDA'].includes(lead.stage)),[leads,previews]);
  const [draft,setDraft]=useState<any>(null);
  const openEditor=(preview:any)=>{setSelectedId(preview.id);setDraft({id:preview.id,headline:preview.headline,subheadline:preview.subheadline,about:preview.about,ctaLabel:preview.cta_label,theme:preview.theme,accent:preview.accent,heroImageUrl:preview.hero_image_url,services:parse(preview.services_json),gallery:parse(preview.gallery_json)});};
  const create=async()=>{if(!leadId)return;if(await save({type:'preview_create',id:leadId})){setLeadId('');}};
  const persist=async(status='draft')=>{if(!draft)return;if(await save({type:'preview_update',...draft,status}))setSelectedId(null);};
  const urlFor=(preview:any)=>typeof window==='undefined'?`/preview/${preview.slug}`:`${window.location.origin}/preview/${preview.slug}`;
  return <div className="preview-studio">
    <section className="workflow-strip">
      {[['1','Pesquisar'],['2','Abordar'],['3','Aceite'],['4','Criar prévia'],['5','Fechar']].map(([number,label],index)=><div className={index<4?'done':''} key={number}><b>{index<3?<Check size={13}/>:number}</b><span>{label}</span></div>)}
    </section>
    <div className="preview-heading"><div><span>GERADOR DE SITES</span><h2>Prévias personalizadas</h2><p>Crie somente depois que a empresa aceitar. O Fluxa monta o primeiro rascunho e você ajusta antes de enviar.</p></div><div className="preview-create"><select value={leadId} onChange={(e)=>setLeadId(e.target.value)}><option value="">Escolha uma empresa interessada</option>{eligible.map((lead)=><option key={lead.id} value={lead.id}>{lead.clinic} · {lead.location}</option>)}</select><button className="primary" disabled={!leadId||busy} onClick={create}><WandSparkles size={16}/>{busy?'Criando…':'Criar prévia'}</button></div></div>
    <div className="preview-stats"><article><Sparkles/><div><strong>{previews.length}</strong><span>prévias criadas</span></div></article><article><Eye/><div><strong>{previews.filter((p)=>p.status==='published').length}</strong><span>links publicados</span></div></article><article><Send/><div><strong>{leads.filter((l)=>l.preview_sent_at).length}</strong><span>prévias enviadas</span></div></article></div>
    {previews.length?<div className="preview-list">{previews.map((preview)=><article key={preview.id} className="preview-card"><div className="preview-thumb" style={{backgroundImage:`linear-gradient(120deg,${preview.accent}dd,#07111dcc),url(${preview.hero_image_url})`}}><span>{preview.theme}</span><strong>{preview.headline}</strong></div><div className="preview-card-body"><div><span className={`preview-status ${preview.status}`}>{preview.status==='published'?'Publicada':'Rascunho'}</span><h3>{preview.clinic}</h3><p>{preview.location}</p></div><div className="preview-card-actions"><button className="outline" onClick={()=>openEditor(preview)}>Editar</button>{preview.status==='published'&&<><button onClick={()=>copy(urlFor(preview),'Link da prévia copiado.')}><Copy size={15}/></button><a href={`/preview/${preview.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a></>}</div></div></article>)}</div>:<div className="preview-empty"><WandSparkles/><strong>Nenhuma prévia criada ainda.</strong><p>Quando uma empresa aceitar receber a demonstração, selecione-a acima. O site inicial fica pronto em segundos.</p></div>}
    {selected&&draft&&<div className="preview-overlay"><div className="preview-editor"><header><div><span>EDITOR DE PRÉVIA</span><h2>{selected.clinic}</h2></div><div className="device-toggle"><button className={device==='desktop'?'active':''} onClick={()=>setDevice('desktop')}><Monitor/></button><button className={device==='mobile'?'active':''} onClick={()=>setDevice('mobile')}><Smartphone/></button></div><button className="close-preview" onClick={()=>setSelectedId(null)}><X/></button></header><div className="editor-layout"><aside>
      <label>Estilo<select value={draft.theme} onChange={(e)=>setDraft({...draft,theme:e.target.value})}><option value="modern">Moderno</option><option value="premium">Premium</option><option value="bold">Marcante</option></select></label>
      <label>Cor principal<div className="color-field"><input type="color" value={draft.accent} onChange={(e)=>setDraft({...draft,accent:e.target.value})}/><input value={draft.accent} onChange={(e)=>setDraft({...draft,accent:e.target.value})}/></div></label>
      <label>Título<input value={draft.headline} onChange={(e)=>setDraft({...draft,headline:e.target.value})}/></label>
      <label>Subtítulo<textarea value={draft.subheadline} onChange={(e)=>setDraft({...draft,subheadline:e.target.value})}/></label>
      <label>Sobre<textarea value={draft.about} onChange={(e)=>setDraft({...draft,about:e.target.value})}/></label>
      <label>Texto do botão<input value={draft.ctaLabel} onChange={(e)=>setDraft({...draft,ctaLabel:e.target.value})}/></label>
      <label><span><ImageIcon size={14}/> Foto de capa</span><input value={draft.heroImageUrl} onChange={(e)=>setDraft({...draft,heroImageUrl:e.target.value})} placeholder="https://..."/></label>
      <label>Serviços<textarea value={draft.services.join('\n')} onChange={(e)=>setDraft({...draft,services:e.target.value.split('\n')})} placeholder="Um serviço por linha"/></label>
      <label>Imagens da galeria<textarea value={draft.gallery.join('\n')} onChange={(e)=>setDraft({...draft,gallery:e.target.value.split('\n')})} placeholder="Uma URL por linha"/></label>
    </aside><section className={`live-canvas ${device} theme-${draft.theme}`} style={{'--preview-accent':draft.accent} as React.CSSProperties}><div className="browser-bar"><i/><i/><i/><span>{selected.slug}</span></div><div className="canvas-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(4,8,15,.88),rgba(4,8,15,.2)),url(${draft.heroImageUrl})`}}><div><small>CONHEÇA {selected.clinic.toUpperCase()}</small><h1>{draft.headline}</h1><p>{draft.subheadline}</p><button>{draft.ctaLabel}</button></div></div><div className="canvas-services">{draft.services.filter(Boolean).slice(0,3).map((service:string,index:number)=><article key={`${service}-${index}`}><b>0{index+1}</b><strong>{service}</strong><span>Qualidade e atenção em cada detalhe.</span></article>)}</div><div className="canvas-about"><span>SOBRE</span><p>{draft.about}</p></div></section></div><footer><button className="outline" disabled={busy} onClick={()=>persist('draft')}>Salvar rascunho</button><button className="primary" disabled={busy} onClick={()=>persist('published')}><Send size={16}/>Publicar e gerar link</button></footer></div></div>}
  </div>;
}
