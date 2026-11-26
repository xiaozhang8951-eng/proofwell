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
        item: {
          '@type': product.identityStatus === 'documented' ? 'Product' : 'Thing',
          '@id': `${origin}/red-light-therapy#product-${product.id}`,
          name: `${product.brand} ${product.productName}`,
          category: category.title,
          url: `${origin}/red-light-therapy#product-${product.id}`,
          ...(product.identityStatus === 'documented' ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
          ...(product.productImage ? { image: new URL(product.productImage.src, origin).href } : {}),
          description: product.keyFeatures.join('; '),
          // No Offer or AggregateRating: supplied screenshots are not current offers,
          // and no independently checked rating dataset is available.
        },
      })),
    }];
  });
}
