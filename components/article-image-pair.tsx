import Image from 'next/image';
import type { ArticleHeroImage } from '@/lib/content';
import styles from './article-image-pair.module.css';

export function ArticleImagePair({ images }: { images: [ArticleHeroImage, ArticleHeroImage] }) {
  return <div className={styles.imagePair}>
    {images.map((image, index) => <div className={styles.imageFrame} key={image.src}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 600px) 88vw, (max-width: 1400px) 44vw, 620px"
        loading="eager"
        fetchPriority={index === 0 ? 'high' : 'auto'}
        className={index === 0 ? styles.treatment : styles.diagram}
      />
    </div>)}
  </div>;
}
