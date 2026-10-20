export function initialMessage(city?: string) {
  const place = city?.trim() || 'sua cidade';
  return `Oi, pessoal! Vi que vocês são de ${place}. Poderiam me tirar uma dúvida?`;
}

export const replyMessage =
  'Sou designer e posso apoiar a equipe em demandas pontuais. Vocês estão com alguma entrega represada ou precisando de reforço em alguma demanda esta semana?\n\nSe fizer sentido, envio alguns trabalhos e combinamos um primeiro projeto de escopo fechado.';

export function whatsappLink(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const national =
    digits.startsWith('55') && digits.length === 13 ? digits.slice(2) : digits;
  return /^\d{2}9\d{8}$/.test(national) ? `https://wa.me/55${national}` : '';
}
