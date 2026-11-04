import type { Metadata } from 'next';
import {Header,Footer} from '@/components/layout';
import {JsonLd} from '@/components/seo';
import {siteUrl} from '@/lib/site';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/libre-baskerville/latin-400.css';
import '@fontsource/libre-baskerville/latin-400-italic.css';
import './globals.css';
const description='Evidence-led choices for beauty, wellness, and healthy living. Independent research frameworks, product reviews, comparisons, and practical buying guides.';
export const metadata:Metadata={...(siteUrl?{metadataBase:new URL(siteUrl),alternates:{canonical:'/'}}:{}),title:{default:'ProofWell — Evidence over everything',template:'%s | ProofWell'},description,openGraph:{title:'ProofWell',description,type:'website',siteName:'ProofWell',...(siteUrl?{url:siteUrl}:{})},twitter:{card:'summary_large_image',title:'ProofWell',description},robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main" className="skip-link">Skip to content</a><Header/><main id="main">{children}</main><Footer/>{siteUrl&&<JsonLd data={{'@context':'https://schema.org','@type':'Organization',name:'ProofWell',url:siteUrl,description}}/>}</body></html>}
