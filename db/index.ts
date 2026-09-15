import { env } from 'cloudflare:workers';
export function getD1(): D1Database {
  if (!env.DB) throw new Error('O banco local D1 não está disponível.');
  return env.DB;
}
