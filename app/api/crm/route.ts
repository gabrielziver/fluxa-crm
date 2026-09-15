/* oxlint-disable typescript/no-explicit-any */
import { addNote, bootstrap, updateLead } from '@/lib/crm';

export async function GET(){try{return Response.json(await bootstrap())}catch(error){return Response.json({error:error instanceof Error?error.message:'Erro ao carregar o CRM.'},{status:500})}}
export async function POST(request:Request){try{const body=await request.json() as any;if(body.type==='note')return Response.json(await addNote(body.id,body.body));return Response.json(await updateLead(body))}catch(error){return Response.json({error:error instanceof Error?error.message:'Erro ao atualizar o CRM.'},{status:400})}}
