export function initialMessage(city?: string, business?: string) {
  const place = city?.trim() || 'sua cidade';
  const name = business?.trim() ? ` a ${business}` : ' vocês';
  return `Oi, tudo bem? Encontrei${name} pesquisando empresas em ${place}. Vi uma oportunidade de apresentar melhor os serviços e facilitar os contatos pelo WhatsApp. Posso preparar e enviar gratuitamente uma prévia de como o site de vocês poderia ficar? É sem compromisso.`;
}

export const replyMessage =
  'Perfeito! Vou montar uma demonstração usando as informações públicas da empresa. A prévia é gratuita e todos os textos, cores, fotos e serviços podem ser ajustados antes de colocar o site no ar.';

export function whatsappLink(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const national =
    digits.startsWith('55') && digits.length === 13 ? digits.slice(2) : digits;
  return /^\d{2}9\d{8}$/.test(national) ? `https://wa.me/55${national}` : '';
}
