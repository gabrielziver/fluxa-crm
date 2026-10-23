export function initialMessage(city?: string, business?: string) {
  const name = business?.trim() || 'empresa';
  return `Opa, tudo certo? 😁 Encontrei a ${name} no Google e vi que vocês ainda não têm um site próprio.`;
}

export const secondMessage =
  'Imagina quem procura a academia encontrar um site bonito, mostrando a estrutura, modalidades e com contato direto pelo WhatsApp? Passa muito mais confiança!\n\nTô criando sites assim por um valor bem acessível. Posso preparar uma prévia personalizada, totalmente grátis e sem compromisso. Quer ver?';

export const positiveReplyMessage =
  'Boa! 😁 Vou preparar uma prévia personalizada pra vocês verem o site funcionando.\n\nÉ grátis e sem compromisso!\n\nAssim que ficar pronta, te mando o link! 🚀';

export function normalizeBrazilianPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  let national =
    digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (national.startsWith('0') && (national.length === 11 || national.length === 12)) {
    national = national.slice(1);
  }

  return /^\d{10,11}$/.test(national) ? `55${national}` : '';
}

export function formatBrazilianPhone(phone?: string): string {
  const normalized = normalizeBrazilianPhone(phone);
  if (!normalized) return phone?.trim() || '';
  const national = normalized.slice(2);
  const ddd = national.slice(0, 2);
  const number = national.slice(2);
  return number.length === 9
    ? `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
    : `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
}

export function whatsappLink(phone?: string, message?: string): string {
  const normalized = normalizeBrazilianPhone(phone);
  if (!normalized) return '';

  const text = message?.trim()
    ? `&text=${encodeURIComponent(message.trim())}`
    : '';
  return `https://api.whatsapp.com/send?phone=${normalized}${text}`;
}
