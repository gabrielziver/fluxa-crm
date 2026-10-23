# Fluxa CRM

CRM full-stack criado para encontrar negócios locais, organizar a prospecção, abordar contatos pelo WhatsApp e gerar prévias editáveis de sites antes da venda.

![Dashboard do Fluxa CRM](public/dashboard-fluxa.png)

## Visão do produto

O Fluxa transforma uma lista de oportunidades em um processo comercial rastreável. A operação começa pela pesquisa de empresas, passa por abordagem e follow-up e termina no controle dos clientes conquistados e da receita gerada.

### Principais recursos

- Dashboard executivo com receita mensal, clientes ativos, leads e valores a receber
- Funil comercial da pesquisa ao fechamento
- Pesquisa e importação de empresas por nicho, cidade e região
- Fila de prospecção com prioridade, estágio e abordagem personalizada
- Atalhos para WhatsApp e canais públicos de contato
- Mensagem de permissão antes de criar a demonstração
- Gerador de prévias com estilos moderno, premium e marcante
- Editor de textos, cores, serviços, capa e galeria
- Link público exclusivo para cada prévia
- Follow-ups automáticos por data
- Histórico de eventos e notas por lead
- Cadastro de clientes ativos e inativos
- Múltiplos serviços e mensalidades por cliente
- Controle de despesas, receita histórica e valores a receber
- Interface responsiva para desktop e celular

## Prospecção e relacionamento

![Área de prospecção](public/prospeccao-fluxa.png)

Cada oportunidade possui estágio, contexto comercial, canal de contato, mensagem inicial, notas e histórico. O sistema abre o `wa.me` com uma abordagem personalizada e mantém o envio sob controle do usuário, sem depender de disparos não oficiais.

## Prévias de sites

Depois que a empresa aceita receber uma demonstração, o Fluxa gera um primeiro site em segundos usando componentes responsivos. O usuário pode trocar o estilo visual, editar todo o conteúdo, selecionar imagens e publicar uma URL exclusiva para enviar ao potencial cliente.

O fluxo implementado é: pesquisa → qualificação → WhatsApp → aceite → prévia → proposta → venda.

## Clientes e finanças

![Clientes e finanças](public/clientes-fluxa.png)

O módulo financeiro conecta a execução comercial à carteira conquistada. Cada cliente pode ter vários serviços, categoria, mensalidade, despesas, receita acumulada e saldo pendente.

## Stack

- React 19 e TypeScript
- Vinext e Vite
- Cloudflare Workers e D1
- Drizzle ORM
- Tailwind CSS
- Lucide Icons
- OpenStreetMap / Overpass para pesquisa gratuita de negócios locais
- Google Maps + Instant Data Scraper para importar leads em massa sem API paga

## Pesquisa de empresas sem custo

Por padrão, o Fluxa consulta dados abertos do OpenStreetMap por servidores
Overpass e não exige cartão, conta de cobrança ou chave de API. Quando a
cobertura estiver incompleta, a interface abre uma busca pronta no Google Maps
e aceita diretamente o CSV exportado pela extensão Instant Data Scraper. O
importador reconhece nome, endereço, categoria, nota, avaliações, imagem e link
do estabelecimento, além de remover duplicatas antes da prospecção.

O código também possui integração opcional com a **Places API (New)** para uma
evolução futura. Essa opção exige faturamento no Google Cloud e não é usada no
modo gratuito:

```env
GOOGLE_PLACES_API_KEY=sua_chave
```

A chave é usada somente no servidor. Ela não deve ser adicionada ao frontend nem publicada no repositório.

## Arquitetura

- `app/`: interface e rotas da aplicação
- `app/api/crm/`: API do CRM
- `lib/`: regras de negócio, prospecção e persistência
- `db/`: schema do banco D1
- `drizzle/`: migrações versionadas

## Sobre o projeto

Projeto de portfólio desenvolvido por **Gabriel Oliveira**. Os nomes e dados exibidos nas capturas são fictícios ou utilizados apenas como demonstração da interface.

> Este repositório é apresentado para fins de portfólio e avaliação técnica.
