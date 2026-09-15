const base = 'http://localhost:8788/api/crm';
const get = async () => {
  const response = await fetch(base);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
const post = async (body) => {
  const response = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const initial = await get();
assert(initial.leads.length === 32, `Esperados 32 leads, encontrados ${initial.leads.length}`);
assert(initial.metrics.ready === 26, `Esperados 26 contatos prontos, encontrados ${initial.metrics.ready}`);
for (const key of ['approached','replies','interested','previewAccepted','previewSent','negotiations','sales','paid','revenue']) assert(initial.metrics[key] === 0, `Métrica inicial ${key} não está zerada`);

await post({ id:'lead-002', action:'mark_sent' });
await post({ id:'lead-002', action:'mark_replied' });
await post({ id:'lead-002', action:'mark_interested' });
await post({ id:'lead-002', action:'preview_accepted' });
await post({ id:'lead-002', action:'preview_sent' });
await post({ id:'lead-002', action:'negotiation' });
await post({ id:'lead-002', action:'sale', value:397 });
await post({ id:'lead-002', action:'paid' });
await post({ id:'lead-002', action:'delivered' });
await post({ type:'note', id:'lead-002', body:'Teste de histórico local.' });
await post({ id:'lead-003', action:'mark_sent', followUpAt:'2020-01-01' });
const final = await get();
assert(final.metrics.approached === 2, 'Contatos enviados não foram contabilizados.');
assert(final.metrics.replies === 1 && final.metrics.interested === 1, 'Resposta ou interesse não foi contabilizado.');
assert(final.metrics.previewAccepted === 1 && final.metrics.previewSent === 1, 'Prévia não foi contabilizada.');
assert(final.metrics.negotiations === 1 && final.metrics.sales === 1 && final.metrics.paid === 1, 'Venda ou pagamento não foi contabilizado.');
assert(final.metrics.revenue === 397 && final.metrics.overdue === 1, 'Receita ou atraso incorreto.');
assert(final.events.filter((e)=>e.lead_id==='lead-002').length === 9, 'Histórico de etapas incompleto.');
assert(final.notes.some((n)=>n.lead_id==='lead-002' && n.body==='Teste de histórico local.'), 'Nota não foi salva.');
console.log(JSON.stringify({ initial: initial.metrics, final: final.metrics, historyEvents: final.events.length, notes: final.notes.length }, null, 2));
