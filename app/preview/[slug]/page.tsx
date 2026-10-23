import { notFound } from 'next/navigation';
/* oxlint-disable next/no-img-element */
import { Clock3, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { getPreviewBySlug } from '@/lib/previews';
import { whatsappLink } from '@/lib/outreach';
import './preview-page.css';

export default async function PublicPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preview = await getPreviewBySlug(slug);
  if (!preview) notFound();
  const services = JSON.parse(preview.services_json || '[]') as string[];
  const gallery = JSON.parse(preview.gallery_json || '[]') as string[];
  const whatsapp = whatsappLink(preview.phone);
  return (
    <main className={`public-preview theme-${preview.theme}`} style={{ '--accent': preview.accent } as React.CSSProperties}>
      <nav><strong>{preview.clinic}</strong><div><a href="#servicos">Serviços</a><a href="#sobre">Sobre</a><a className="nav-cta" href={whatsapp || '#contato'}>Contato</a></div></nav>
      <section className="preview-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,10,18,.88),rgba(8,10,18,.22)),url(${preview.hero_image_url})` }}>
        <div><span><Sparkles size={14}/> EXPERIÊNCIA LOCAL</span><h1>{preview.headline}</h1><p>{preview.subheadline}</p><a href={whatsapp || '#contato'}><MessageCircle size={18}/>{preview.cta_label}</a></div>
      </section>
      <section id="servicos" className="preview-section"><span>O QUE VOCÊ ENCONTRA AQUI</span><h2>Feito para atender você melhor</h2><div className="service-cards">{services.map((service, index)=><article key={service}><b>{String(index+1).padStart(2,'0')}</b><h3>{service}</h3><p>Qualidade, praticidade e atenção em cada detalhe.</p></article>)}</div></section>
      {gallery.length > 0 && <section className="preview-gallery">{gallery.map((image,index)=><img src={image} alt={`${preview.clinic} — ambiente ${index+1}`} key={image}/>)}</section>}
      <section id="sobre" className="preview-about"><div><span>SOBRE NÓS</span><h2>Uma experiência que começa antes da sua visita</h2></div><p>{preview.about}</p></section>
      <section id="contato" className="preview-contact"><div><MapPin/><span>Atendimento em</span><strong>{preview.location}</strong></div><div><Clock3/><span>Fale diretamente</span><strong>Resposta pelo WhatsApp</strong></div><a href={whatsapp || '#'}><MessageCircle/>{preview.cta_label}</a></section>
      <footer><strong>{preview.clinic}</strong><span>Prévia demonstrativa criada com Fluxa · Textos e imagens podem ser personalizados.</span></footer>
    </main>
  );
}
