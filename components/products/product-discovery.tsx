'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, SlidersHorizontal, X } from 'lucide-react';
import type { DiscoveryFilters, TherapyProduct, TreatmentArea } from '@/lib/products/types';
import { catalogGroups, treatmentCategories } from '@/lib/products/content';
import { defaultFilters, filterProducts, formatPowerArrangement, formatPrice, formatWavelengths, getDiscoveryPrice, getDiscountPercentage, getProductPriceTier, priceTiers } from '@/lib/products/discovery';
import styles from './product-discovery.module.css';

function PriceInformation({ product }: { product: TherapyProduct }) {
  const price = getDiscoveryPrice(product);
  const tier = priceTiers.find(item => item.id === getProductPriceTier(product));
  const discount = getDiscountPercentage(product);
  return <div className={styles.price}>
    <span>{price === null ? 'Price not established' : product.currentPrice === null ? 'Supplied reference · not a live quote' : 'Last checked price · USD'}</span>
    <strong>{price === null ? 'Check seller price' : formatPrice(price)}</strong>
    {tier && <span>{tier.label} · {product.currentPrice === null ? 'reference-price tier' : 'price tier'}</span>}
    {discount !== null && product.originalPrice !== null && <small>Recorded comparison: {formatPrice(product.originalPrice)} → {formatPrice(price!)} ({discount}% difference). No current discount verified.</small>}
    <small>Price last checked: {product.lastPriceChecked ?? 'Not independently checked'}</small>
  </div>;
}

function ProductCard({ product }: { product: TherapyProduct }) {
  return <article className={styles.productCard} id={`product-${product.id}`} data-product-id={product.id}>
    {product.productImage ? <figure className={styles.productFigure}>
      <Image src={product.productImage.src} alt={product.productImage.alt} width={product.productImage.width} height={product.productImage.height} sizes="(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 520px"/>
      <figcaption>{product.productImage.note}</figcaption>
    </figure> : <div className={styles.noImage}>Product image not established</div>}
    <div className={styles.productBody}>
      <span className="eyebrow">{product.brand} · {product.category === 'face' ? 'FACE DEVICE' : product.category === 'face-neck' ? 'FACE & NECK' : product.category === 'related-heat' ? 'THERMAL PAD · NOT LED' : 'BODY-AREA DEVICE'}</span>
      <h4>{product.productName}</h4>
      {product.asin && <p className={styles.model}>ASIN {product.asin}</p>}
      {product.identityStatus === 'needs-confirmation' && <p className={styles.caution}>Model name and appearance need confirmation. Match the ASIN.</p>}
      <PriceInformation product={product}/>
      <ul className={styles.features}>{product.keyFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
      <p className={styles.fit}><strong>Consider for: </strong>{product.suitableFor.join('; ')}.</p>
      <p className={styles.limitation}><strong>Before deciding: </strong>{product.limitations[0]}</p>
      <details className={styles.sourceDetails}>
        <summary>Specifications, sources & limitations</summary>
        <dl>
          <div><dt>LEDs / light points</dt><dd>{product.ledNotes ?? (product.ledCount === null ? 'Not established' : `${product.ledCount} supplier-listed beads`)}</dd></div>
          <div><dt>Wavelengths</dt><dd>{formatWavelengths(product)}{product.wavelengthNotes && <span> · {product.wavelengthNotes}</span>}</dd></div>
          <div><dt>Modes</dt><dd>{product.category === 'related-heat' ? 'Not applicable to LED modes' : `${product.treatmentModes ?? 'Not established'} · advertised settings, not proven benefits`}{product.modeNotes && <span> · {product.modeNotes}</span>}</dd></div>
          <div><dt>Power</dt><dd>{product.powerNotes ?? 'Arrangement not established'}</dd></div>
          <div><dt>FDA status</dt><dd>{product.fdaStatus === null ? 'Not independently verified. FDA-cleared and FDA-approved are different.' : product.fdaStatus === 'cleared' ? 'FDA-cleared for the documented indications; not FDA-approved.' : 'FDA-approved for the documented indications.'}</dd></div>
          <div><dt>Rating / review count</dt><dd>{product.rating === null ? 'Not independently checked' : `${product.rating} / 5`}{product.reviewCount !== null ? ` · ${product.reviewCount} reviews` : ''}</dd></div>
        </dl>
        <p>{product.priceSource}</p>
        {product.sourceNotes && <p>{product.sourceNotes}</p>}
        {product.referencePriceDate && <p>Reference supplied: {product.referencePriceDate}. This is not a live price-check date.</p>}
        <ul>{[...product.limitations.slice(1), ...product.evidenceNotes].map(note => <li key={note}>{note}</li>)}</ul>
        <div className={styles.sourceLinks}>{product.sourceUrls.map((url, index) => url.startsWith('/') ? <Link href={url} key={url}>Source article {index + 1} <ArrowRight size={12}/></Link> : <a href={url} key={url} target="_blank" rel="nofollow noopener noreferrer">Supplier listing <ArrowUpRight size={12}/><span className="sr-only"> (opens in a new tab)</span></a>)}</div>
      </details>
      <div className={styles.productActions}>
        {product.reviewUrl && <Link href={product.reviewUrl} className="text-link">Read the editorial assessment <ArrowRight size={14}/></Link>}
        {product.affiliateUrl && <>
          <small>Affiliate link · ProofWell may earn a commission.</small>
          <a href={product.affiliateUrl} className="button primary" target="_blank" rel="sponsored nofollow noopener noreferrer">Check seller price <ArrowUpRight size={15}/><span className="sr-only"> for {product.brand} {product.productName} (opens in a new tab)</span></a>
        </>}
        {product.amazonUrl && <a href={product.amazonUrl} className={styles.amazonLink} target="_blank" rel="nofollow noopener noreferrer">Exact Amazon listing <ArrowUpRight size={12}/><span className="sr-only"> (opens in a new tab)</span></a>}
      </div>
    </div>
  </article>;
}

function SpecificationTable({ products, title }: { products: TherapyProduct[]; title: string }) {
  return <div className={styles.specGroup}>
    <h3>{title}</h3>
    <div className={styles.tableScroll} role="region" aria-label={`${title} specification comparison`} tabIndex={0}>
      <table>
        <caption>Supplier-attributed specifications. Unknown values are not zero; none are ProofWell measurements.</caption>
        <thead><tr>{['Device', 'Price basis · USD', 'LEDs / light points', 'Wavelengths', 'Modes', 'Coverage', 'Power', 'FDA status'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{products.map(product => <tr key={product.id}>
          <th scope="row"><a href={`#product-${product.id}`}>{product.brand} {product.productName}</a>{product.asin && <small>{product.asin}</small>}</th>
          <td>{getDiscoveryPrice(product) === null ? 'Unknown — unclassified' : `${formatPrice(getDiscoveryPrice(product)!)} · ${product.currentPrice === null ? 'supplied reference' : 'checked quote'}`}<small>Last checked: {product.lastPriceChecked ?? 'Not independently checked'}</small></td>
          <td>{product.ledNotes ?? product.ledCount ?? 'Unknown'}</td>
          <td>{formatWavelengths(product)}{product.wavelengthNotes && <small>{product.wavelengthNotes}</small>}</td>
          <td>{product.category === 'related-heat' ? 'Not LED modes' : product.treatmentModes ?? 'Unknown'}{product.modeNotes && <small>{product.modeNotes}</small>}</td>
          <td>{product.coverageArea ?? 'Unknown'}</td>
          <td>{formatPowerArrangement(product)}<small>Rechargeable: {product.rechargeable === null ? 'unknown' : product.rechargeable ? 'supplier-listed' : 'no'}</small></td>
          <td>{product.fdaStatus === null ? 'Not verified' : product.fdaStatus === 'cleared' ? 'Cleared, not approved' : 'Approved for documented indications'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

export function ProductDiscovery({ products, children }: { products: TherapyProduct[]; children?: ReactNode }) {
  const [filters, setFilters] = useState<DiscoveryFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = filterProducts(products, filters);
  const brands = [...new Set(products.map(product => product.brand))].sort();
  const modes = [...new Set(products.flatMap(product => product.treatmentModes === null ? [] : [product.treatmentModes]))].sort((a, b) => a - b);
  const groups = catalogGroups.map(category => ({ ...category, products: filtered.filter(product => product.category === category.id) })).filter(group => group.products.length);
  const activeCount = Object.entries(filters).filter(([name, value]) => name !== 'sort' && value !== 'all').length;
  function update<K extends keyof DiscoveryFilters>(name: K, value: DiscoveryFilters[K]) { setFilters(previous => ({ ...previous, [name]: value })); }
  function pickArea(area: TreatmentArea) { setFilters({ ...defaultFilters, area }); }

  return <div className={styles.discovery}>
    <section className={styles.section} aria-labelledby="treatment-areas">
      <div className={styles.sectionHeading}><div><span className="eyebrow">01 / CHOOSE THE AREA</span><h2 id="treatment-areas">Different formats. Different decisions.</h2></div><p>A face mask and a full-body panel do different jobs. We keep their shortlists and comparisons separate.</p></div>
      <div className={styles.categoryGrid}>
        {treatmentCategories.map((category, index) => {
          const count = products.filter(product => product.category === category.id).length;
          return <article className={styles.categoryCard} key={category.id}>
            <span className={styles.categoryNumber}>0{index + 1}</span>
            <h3>{category.title}</h3><p>{category.description}</p><p className={styles.categoryDetail}>{category.detail}</p>
            <span className={styles.categoryCount}>{count ? `${count} documented listings` : 'No documented products yet'}</span>
            <a href="#device-catalog" onClick={() => pickArea(category.id)} className="text-link">{count ? 'Explore this format' : 'See catalog coverage'} <ArrowRight size={15}/></a>
          </article>;
        })}
      </div>
    </section>

    <section className={styles.section} aria-labelledby="shop-by-budget">
      <div className={styles.sectionHeading}><div><span className="eyebrow">02 / FIND YOUR RANGE</span><h2 id="shop-by-budget">A budget is a starting point.</h2></div><p>Price does not establish effectiveness. These ranges use checked prices when available, otherwise disclosed reference prices.</p></div>
      <div className={styles.budgetGrid}>{priceTiers.map(tier => <button key={tier.id} type="button" className={styles.budgetCard} aria-pressed={filters.budget === tier.id} onClick={() => update('budget', filters.budget === tier.id ? 'all' : tier.id)}>
        <span>{tier.id === 'budget' ? 'Budget' : tier.id === 'mid-range' ? 'Mid-range' : 'Premium'}</span><strong>{tier.label}</strong><small>{tier.description}</small><ArrowRight size={18}/>
      </button>)}</div>
      <p className={styles.budgetNote}>Unknown prices remain unclassified. A screenshot offer is never presented as a live quote.</p>
    </section>

    <section className={styles.section} aria-labelledby="device-catalog" id="catalog-section">
      <div className={styles.sectionHeading}><div><span className="eyebrow">03 / THE PRODUCT FINDER</span><h2 id="device-catalog">Build your shortlist.</h2></div><p>Filter features first, then read the evidence and practical limitations. These are feature-based options, not clinical rankings.</p></div>
      <div className={styles.filterBar}>
        <button type="button" className={styles.filterToggle} aria-expanded={filtersOpen} aria-controls="product-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17}/> Filters{activeCount > 0 ? ` (${activeCount})` : ''}<span>{filtersOpen ? '−' : '+'}</span></button>
        <div className={styles.filterPanel} id="product-filters" data-expanded={filtersOpen}>
          <div><label htmlFor="filter-area">Treatment area</label><select id="filter-area" value={filters.area} onChange={event => update('area', event.target.value as DiscoveryFilters['area'])}><option value="all">All areas / related heat</option>{treatmentCategories.map(category => <option value={category.id} key={category.id}>{category.title}</option>)}</select></div>
          <div><label htmlFor="filter-budget">Budget · USD</label><select id="filter-budget" value={filters.budget} onChange={event => update('budget', event.target.value as DiscoveryFilters['budget'])}><option value="all">All / unknown prices</option>{priceTiers.map(tier => <option value={tier.id} key={tier.id}>{tier.label}</option>)}</select></div>
          <div><label htmlFor="filter-brand">Brand</label><select id="filter-brand" value={filters.brand} onChange={event => update('brand', event.target.value)}><option value="all">All brands</option>{brands.map(brand => <option key={brand}>{brand}</option>)}</select></div>
          <div><label htmlFor="filter-power">Power arrangement</label><select id="filter-power" value={filters.power} onChange={event => update('power', event.target.value as DiscoveryFilters['power'])}><option value="all">Any / unknown</option><option value="wireless">Wireless / cable-free</option><option value="wired">Wired / controller cable</option><option value="unknown">Arrangement unknown</option></select></div>
          <div><label htmlFor="filter-modes">Treatment modes</label><select id="filter-modes" value={filters.modes} onChange={event => update('modes', event.target.value === 'all' ? 'all' : Number(event.target.value))}><option value="all">Any / unknown</option>{modes.map(mode => <option value={mode} key={mode}>{mode} advertised modes</option>)}</select></div>
          <div><label htmlFor="filter-sort">Sort within each area</label><select id="filter-sort" value={filters.sort} onChange={event => update('sort', event.target.value as DiscoveryFilters['sort'])}><option value="editorial">Catalog order</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></div>
        </div>
        <div className={styles.resultsBar}><p role="status" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} in {groups.length} catalog {groups.length === 1 ? 'group' : 'groups'}</p><button type="button" onClick={() => setFilters(defaultFilters)}><X size={13}/> Clear filters</button></div>
      </div>
      <noscript><p className={styles.notice}>Enable JavaScript to filter. All catalog records, sources and links remain readable below.</p></noscript>
      {!filtered.length ? <div className={styles.empty}>
        <h3>{filters.area === 'full-body' ? 'Full-body product research is still to come.' : 'No listings match this combination.'}</h3>
        <p>{filters.area === 'full-body' ? 'There are no documented panels in this catalog. We will add products when model-matched sources are available, without inventing a ranking.' : 'Try a wider budget or another feature. A product with an unknown price is excluded from a specific budget range.'}</p>
        <button type="button" className="button" onClick={() => setFilters(defaultFilters)}>Show all documented listings <ArrowRight size={15}/></button>
      </div> : groups.map(group => <section className={styles.productGroup} key={group.id} aria-labelledby={`group-${group.id}`}>
        <div className={styles.groupHeading}><h3 id={`group-${group.id}`}>{group.title}</h3><span>{group.products.length} {group.products.length === 1 ? 'listing' : 'listings'} · compared within this group</span></div>
        {group.id === 'face' && <p className={styles.groupLink}>Comparing Ulike models? <Link href="/comparisons/ulike-led-mask-comparison">Read the ReGlow vs ReGlow Lite buying guide <ArrowRight size={13}/></Link></p>}
        {group.id === 'full-body' && <p className={styles.groupLink}>These compact domes are shown over selected face or body areas. Their records do not establish simultaneous whole-body coverage.</p>}
        {group.id === 'related-heat' && <p className={styles.groupLink}>Far-infrared heat pads are thermal devices, not red/near-infrared LED devices. They are listed separately and are not ranked against LED products.</p>}
        <div className={styles.productGrid}>{group.products.map(product => <ProductCard product={product} key={product.id}/>)}</div>
      </section>)}
    </section>

    {children}

    <section className={styles.section} aria-labelledby="technical-comparison">
      <div className={styles.sectionHeading}><div><span className="eyebrow">04 / LOOK PAST THE LED COUNT</span><h2 id="technical-comparison">The specifications, in context.</h2></div><p>This table follows your filters and keeps treatment areas separate. More modes, a higher price or more LEDs do not establish better results.</p></div>
      {groups.length ? groups.map(group => <SpecificationTable products={group.products} title={group.title} key={group.id}/>) : <p className={styles.notice}>No matching products to compare. Clear the filters to see documented specifications.</p>}
      <p className={styles.budgetNote}>Scroll each table horizontally on smaller screens. Unknowns stay visible rather than being inferred from another model.</p>
    </section>
  </div>;
}
