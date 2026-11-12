import type { Metadata } from 'next';
import {Header,Footer} from '@/components/layout';
import {OrganizationSchema} from '@/components/seo';
import {pageMetadata} from '@/lib/metadata';
import {siteUrl} from '@/lib/site';
import {pageRobots} from '@/lib/indexing';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/libre-baskerville/latin-400.css';
import '@fontsource/libre-baskerville/latin-400-italic.css';
import './globals.css';
const description='Evidence-led choices for beauty, wellness, and healthy living. Independent research frameworks, product reviews, comparisons, and practical buying guides.';
export const metadata:Metadata={...pageMetadata({title:'ProofWell — Evidence over everything',description,path:'/',origin:siteUrl}),metadataBase:new URL(siteUrl),title:{default:'ProofWell — Evidence over everything',template:'%s | ProofWell'},robots:pageRobots(true),other:{partnerboostverifycode:'32dc01246faccb7f5b3cad5016dd5033'}};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" data-scroll-behavior="smooth">
    <head>
      {/* Google Tag Manager */}
      <script id="google-tag-manager" dangerouslySetInnerHTML={{__html:`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TK8MNNSV');`}}/>
      {/* End Google Tag Manager */}
    </head>
    <body>
      {/* Google Tag Manager (noscript) */}
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TK8MNNSV" height="0" width="0" style={{display:'none',visibility:'hidden'}} title="Google Tag Manager"/></noscript>
      {/* End Google Tag Manager (noscript) */}
      <a href="#main" className="skip-link">Skip to content</a><Header/><main id="main">{children}</main><Footer/><OrganizationSchema description={description}/>
    </body>
  </html>;
}
