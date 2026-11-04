import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './home-hero.module.css';

export function HomeHero() {
  return <section className={styles.hero} aria-label="ProofWell introduction">
    <div className={styles.inner}>
      <div className={styles.copy}>
        <div className={`eyebrow ${styles.eyebrow}`}><span className="live-dot"/> EVIDENCE OVER EVERYTHING</div>
        <h1>Health and beauty<br/>claims are easy.<br/><em>Evidence is harder.</em></h1>
        <p>ProofWell translates research and product claims into practical guidance across skin science, nutrition, healthy aging, and wellness technology.</p>
        <div className={styles.actions}>
          <Link className={`button primary ${styles.primary}`} href="/science">Explore the Evidence <ArrowRight size={16} aria-hidden="true"/></Link>
          <Link className="text-link" href="/reviews">See Our Reviews <ArrowUpRight size={16} aria-hidden="true"/></Link>
        </div>
      </div>
      <div className={styles.artwork}>
        <Image
          src="/images/proofwell-home-hero-visual.webp"
          alt="Conceptual wellness illustration of a woman surrounded by skin science, nutrition, healthy aging, and wearable technology imagery."
          width={642}
          height={413}
          sizes="(max-width: 900px) 90vw, (max-width: 1680px) 56vw, 900px"
          loading="eager"
          fetchPriority="high"
          className={styles.visual}
        />
      </div>
    </div>
  </section>;
}
