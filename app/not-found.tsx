import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default function NotFound(){return <div className="info-page"><div className="page-intro"><span className="eyebrow">404 · AN OPEN QUESTION</span><h1>This page isn’t in the evidence.</h1><p>The address may have changed. Follow your curiosity back to the editorial library.</p><Link className="button primary" style={{marginTop:25}} href="/">Back to ProofWell →</Link></div></div>}
