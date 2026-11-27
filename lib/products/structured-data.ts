import type { TherapyProduct } from './types';
import { catalogGroups } from './content';

export function productItemLists(products: TherapyProduct[], origin: string) {
  return catalogGroups.flatMap(category => {
    const group = products.filter(product => product.category === category.id);
    if (!group.length) return [];
    return [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      '@id': `${origin}/red-light-therapy#${category.id}-list`,
      name: `${category.title} in the ProofWell catalog`,
      itemListOrder: 'https://schema.org/ItemListUnordered', numberOfItems: group.length,
      itemListElement: group.map((product, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: `${product.brand} ${product.productName}`,
        url: `${origin}/red-light-therapy#product-${product.id}`,
        ...(product.productImage ? { image: new URL(product.productImage.src, origin).href } : {}),
        description: product.keyFeatures.join('; '),
        // This multi-product discovery page describes a list, not Product rich results.
        // Supplied references do not establish current offers, reviews or ratings.
      })),
    }];
  });
}
