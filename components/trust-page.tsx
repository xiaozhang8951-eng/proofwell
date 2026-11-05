import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { InfoPage } from '@/lib/trust-pages';
import { headingId } from '@/lib/content';
import { OfficialContact } from './official-contact';
import { ContactForm } from './interactive';
import { BreadcrumbSchema } from './seo';

export function TrustPage({ page, url }: { page: InfoPage; url: string }) {
  const contact = page.contact && <section className="trust-contact" aria-labelledby="official-contact-heading">
    <h2 id="official-contact-heading">{page.contact.title}</h2>
    <p>{page.contact.purpose}</p><OfficialContact/>
  </section>;
  return <div className="info-page trust-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{page.eyebrow.split(' · ')[0]}</span></nav>
    <header className="page-intro"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p>
      {page.draftUpdated && <p className="policy-date">Draft updated <time dateTime={page.draftUpdated}>{new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${page.draftUpdated}T00:00:00Z`))}</time> · Owner approval and effective date pending.</p>}
    </header>
    {page.contactFirst && contact}
    <div className="info-body">{page.sections.map((section,index) => <section id={headingId(section.title)} key={section.title}>
      <span className="info-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
      <div><h2>{section.title}</h2>{section.ownerInput && <span className="owner-confirmation">OWNER CONFIRMATION REQUIRED</span>}<p>{section.text}</p>
        {section.items && <ul className="trust-list">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
        {section.links && <div className="info-links section-links">{section.links.map(link => <Link href={link.href} key={link.href}>{link.label} <ArrowUpRight size={12} aria-hidden="true"/></Link>)}</div>}
      </div>
    </section>)}
    {!page.contactFirst && contact}
    {url === '/contact' && <details className="contact-form-preview"><summary>Optional form preview — sending is not connected</summary><p>For actual inquiries, use the official email above. This form does not send, receive, or store messages.</p><ContactForm/></details>}
    <nav className="info-links" aria-label="Trust and policy pages">{[['About','/about'],['Editorial Policy','/editorial-policy'],['Affiliate Disclosure','/affiliate-disclosure'],['Privacy Policy','/privacy-policy'],['Contact','/contact']].map(([name,path]) => <Link href={path} aria-current={path===url?'page':undefined} key={path}>{name}</Link>)}</nav>
    </div><BreadcrumbSchema items={[{name:'Home',path:'/'},{name:page.seoTitle,path:url}]}/>
  </div>;
}
