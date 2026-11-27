import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Layers3 } from 'lucide-react';
import { ProductDiscovery } from '@/components/products/product-discovery';
import styles from '@/components/products/product-discovery.module.css';
import { BreadcrumbSchema, JsonLd } from '@/components/seo';
import { therapyProducts } from '@/lib/products/catalog';
import { hubFaqs } from '@/lib/products/content';
import { productItemLists } from '@/lib/products/structured-data';
import { pageMetadata } from '@/lib/metadata';
import { pageRobots } from '@/lib/indexing';
import { siteUrl } from '@/lib/site';

const title = 'Best Red Light Therapy Devices: Compare Masks & Panels';
const description = 'Find your red light therapy shortlist by budget, treatment area, brand and features. Compare LED face masks and face-and-neck systems with clearly attributed prices and evidence limits.';
export const metadata: Metadata = {
  ...pageMetadata({ title, description, path: '/red-light-therapy', origin: siteUrl, imagePath: '/images/products/red-light-therapy-device-types-v1.webp' }),
  robots: pageRobots(true),
};

export default function RedLightTherapyHub() {
  return <div className={styles.hub}>
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Red light therapy</span></nav>
    <header className={styles.hero}>
      <div><span className="eyebrow">THE PROOFWELL DEVICE GUIDE</span>
        <h1>Best red light therapy devices.<br/><em>Find your fit.</em></h1>
        <p>Compare LED face masks, face-and-neck systems and compact body-area domes. Start with the area you want to cover, the features you value and a budget that works for you. Related far-infrared heat pads are listed separately.</p>
        <div className={styles.heroActions}><a className="button primary" href="#device-catalog">Find a device <ArrowRight size={16}/></a><a className="text-link" href="#buying-guide">How to choose <ArrowRight size={14}/></a></div>
      </div>
      <figure className={styles.heroVisual}><div className={styles.heroDevices}><Image src="/images/products/red-light-therapy-device-types-v1.webp" alt="Original category illustration showing a face mask, a face mask with a separate neck piece, and a full-height LED body panel. The panel is a concept, not a reviewed model." width={1536} height={1024} sizes="(max-width: 1000px) 88vw, 44vw" priority/></div><figcaption>Face · Face &amp; neck · Full-body panel concept. Original illustration; the panel is not a reviewed product.</figcaption></figure>
    </header>
    <aside className={styles.disclosure}><strong>Affiliate disclosure:</strong> ProofWell may earn a commission if you purchase through labeled affiliate links, at no additional cost to you. This guide uses supplied product records and existing desk-based reviews; we have not tested these devices. “Best” means a feature-based shortlist for your needs, not a clinical award. <Link href="/affiliate-disclosure">Read our disclosure.</Link></aside>
    <div className={styles.method}><span><Layers3 size={15}/> Treatment areas kept separate</span><span><Check size={15}/> Unknowns clearly marked</span><span><BookOpen size={15}/> Sources before sales claims</span></div>

    <ProductDiscovery products={therapyProducts}>

    <section className={styles.section} aria-labelledby="featured-comparisons">
      <div className={styles.sectionHeading}><div><span className="eyebrow">TAKE A CLOSER LOOK</span><h2 id="featured-comparisons">The differences that matter.</h2></div><p>Understand the practical tradeoffs before you follow a purchase link. These comparisons retain their own source and pricing limitations.</p></div>
      <div className={styles.twoGrid}>
        <article className={styles.editorialCard}><span className="eyebrow">FACE MASK COMPARISON</span><h3>Ulike ReGlow vs ReGlow Lite</h3><p>Three listings, three buying priorities: entry budget, mode choice and advertised facial coverage. Keep the ASINs and supplied offers separate.</p><Link className="text-link" href="/comparisons/ulike-led-mask-comparison">Compare the Ulike options <ArrowRight size={15}/></Link></article>
        <article className={styles.editorialCard}><span className="eyebrow">FORMAT COMPARISON · NOT A SHARED RANKING</span><h3>Ulike ReGlow vs MEGELIN White</h3><p>A face-only mask and a face-and-neck system address different coverage preferences. Compare the format and documentation rather than assuming one is a clinical winner.</p><Link className="text-link" href="/comparisons/ulike-reglow-vs-megelin-white-led-mask">Explore the coverage tradeoffs <ArrowRight size={15}/></Link></article>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="consumer-needs">
      <div className={styles.sectionHeading}><div><span className="eyebrow">CHOOSE BY YOUR ROUTINE</span><h2 id="consumer-needs">A shortlist for what matters to you.</h2></div><p>Convenience and intended skincare goals help you frame questions. They do not establish an acne, wrinkle or wellness outcome for a particular product.</p></div>
      <div className={styles.threeGrid}>
        <article className={styles.editorialCard}><span className="eyebrow">FACE · PORTABILITY</span><h3>A cable-free mask</h3><p>The three-mode Lite is described as cordless and rechargeable. Investigate the format if packing, storage and a simple routine are priorities; runtime has not been tested.</p><Link className="text-link" href="/comparisons/ulike-led-mask-comparison">See the Lite buying considerations <ArrowRight size={14}/></Link></article>
        <article className={styles.editorialCard}><span className="eyebrow">FACE · SHORT SESSIONS</span><h3>A five-minute format</h3><p>AMIRO advertises three five-minute modes and memory controls. Check the exact instructions; a shorter session or a mode name does not establish a better result.</p><Link className="text-link" href="/reviews/amiro-5-in-1-light-therapy-mask">Explore the AMIRO overview <ArrowRight size={14}/></Link></article>
        <article className={styles.editorialCard}><span className="eyebrow">FACE & NECK · COVERAGE</span><h3>Both areas in one routine</h3><p>The MEGELIN variants include separate face and neck pieces. Compare fit, positioning, power arrangement and the supplied offer before deciding; the linked review may retain an earlier price reference.</p><Link className="text-link" href="/reviews/megelin-white-led-face-neck-mask">Read the face-and-neck review <ArrowRight size={14}/></Link></article>
      </div>
    </section>

    </ProductDiscovery>

    <section className={styles.section} aria-labelledby="buying-guide">
      <div className={styles.sectionHeading}><div><span className="eyebrow">BUY WITH BETTER QUESTIONS</span><h2 id="buying-guide">What to check before you choose.</h2></div><p>Research on red and near-infrared light provides a background. It does not automatically validate every mask, panel or marketing claim.</p></div>
      <div className={styles.twoGrid}>
        <div className={styles.guide}><h3>Start with everyday use.</h3><ol><li><strong>Choose the treatment area.</strong> Face, face and neck, or a larger body area. Check actual coverage and positioning.</li><li><strong>Match the exact listing.</strong> Confirm ASIN, model, included components, seller and current return terms.</li><li><strong>Budget for the final total.</strong> Screenshot offers may expire. Check the current quote, taxes, shipping and any coupon conditions.</li></ol></div>
        <div className={styles.guide}><h3>Then look at the evidence.</h3><ol><li><strong>Ask for a measured protocol.</strong> Wavelength, irradiance at the wearing position, session time and uniformity belong together.</li><li><strong>Check device-specific support.</strong> A mode name, LED count or study of another device is not proof of an outcome.</li><li><strong>Verify regulatory wording.</strong> FDA clearance is different from approval and must match the exact device and intended use.</li></ol></div>
      </div>
      <p className={styles.safety}><strong>Safety first:</strong> Read the current model’s instructions, eye-protection directions, charging restrictions and contraindications. Ask a qualified professional about photosensitivity, medicines or eye conditions. Do not extend sessions or replace prescribed care based on this guide.</p>
      <div className={styles.faqs} aria-label="Red light therapy buying questions">{hubFaqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
    </section>

    <section className={styles.section} aria-labelledby="further-reading"><div className={styles.sectionHeading}><div><span className="eyebrow">THE SCIENCE BEHIND THE SPECS</span><h2 id="further-reading">Keep your curiosity switched on.</h2></div><p>Clear explanations for the questions a product listing may leave unanswered.</p></div><div className={styles.readingGrid}>
      {[
        ['Does red light therapy really work?', '/science/does-red-light-therapy-work'],
        ['How LED face masks work', '/science/how-led-masks-work'],
        ['Irradiance vs fluence', '/science/irradiance-vs-fluence'],
        ['Red vs near-infrared light', '/science/red-vs-near-infrared'],
        ['633 nm vs 830 nm', '/science/633-vs-830-nm'],
        ['How ProofWell evaluates evidence', '/editorial-policy'],
      ].map(([label, href]) => <Link href={href} key={href}>{label}<ArrowRight size={16}/></Link>)}
    </div></section>
    <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'Red light therapy devices', path: '/red-light-therapy' }]}/>
    {productItemLists(therapyProducts, siteUrl).map(list => <JsonLd data={list} key={list['@id']}/>)}
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: hubFaqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }}/>
  </div>;
}
