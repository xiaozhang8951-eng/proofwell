'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Heading = { title: string; id: string };
export function ArticleToc({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);
  const links = (mobile: boolean) => <nav aria-label={mobile ? 'Mobile article contents' : 'Table of contents'}>
    {headings.map(heading => <a href={`#${heading.id}`} key={heading.id} onClick={() => setOpen(false)}>{heading.title}</a>)}
  </nav>;
  return <aside className="toc">
    <div className="toc-desktop"><span className="eyebrow">IN THIS ARTICLE</span>{links(false)}</div>
    <div className="toc-mobile"><button type="button" aria-expanded={open} aria-controls="mobile-article-contents" onClick={() => setOpen(!open)}>
      <span className="eyebrow">IN THIS ARTICLE</span><ChevronDown size={16} aria-hidden="true"/>
    </button><div id="mobile-article-contents" hidden={!open}>{links(true)}</div></div>
  </aside>;
}
