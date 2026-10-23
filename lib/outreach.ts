export function initialMessage(city?: string, business?: string) {
  const name = business?.trim() || 'empresa';
  return `Opa, tudo certo? 😁 Encontrei a ${name} no Google e vi que vocês ainda não têm um site próprio.`;
}

export const secondMessage =
  'Imagina quem procura a academia encontrar um site bonito, mostrando a estrutura, modalidades e com contato direto pelo WhatsApp? Passa muito mais confiança!\n\nTô criando sites assim por um valor bem acessível. Posso preparar uma prévia personalizada, totalmente grátis e sem compromisso. Quer ver?';

export const positiveReplyMessage =
  'Boa! 😁 Vou preparar uma prévia personalizada pra vocês verem o site funcionando.\n\nÉ grátis e sem compromisso!\n\nAssim que ficar pronta, te mando o link! 🚀';

export function whatsappLink(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const national =
    digits.startsWith('55') && digits.length === 13 ? digits.slice(2) : digits;
  return /^\d{2}9\d{8}$/.test(national) ? `https://wa.me/55${national}` : '';
}
