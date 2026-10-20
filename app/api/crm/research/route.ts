import { importAgencies, importPastedAgencies, searchAgencies } from '@/lib/research';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      city?: string;
      state?: string;
      category?: string;
      limit?: number;
      candidates?: Parameters<typeof importAgencies>[0]['candidates'];
      rows?: Parameters<typeof importPastedAgencies>[0]['rows'];
    };
    if (body.action === 'search')
      return Response.json(await searchAgencies(body));
    if (body.action === 'import')
      return Response.json(await importAgencies(body));
    if (body.action === 'import_pasted')
      return Response.json(await importPastedAgencies(body));
    return Response.json(
      { error: 'Ação de pesquisa inválida.' },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha na pesquisa.' },
      { status: 400 },
    );
  }
}
