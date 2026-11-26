import { getArticles, articleUrl } from './content';
import type { Article } from './content';
import { categories, information } from './pages';
import { topics } from './site';
import { isEditorialDate } from './editorial';

// Explicit App Router pages share the sitemap registry, but not catch-all params.
const standalonePaths = ['/red-light-therapy'];

export function getPublicPaths(articles = getArticles()): string[] {
  return [...new Set(['/', ...standalonePaths, ...Object.keys(categories).map(slug => `/${slug}`),
    ...Object.keys(information).map(slug => `/${slug}`), '/topics',
    ...topics.map(([, slug]) => `/topics/${slug}`), ...articles.map(articleUrl)])];
}

export function getContentPaths(articles = getArticles()): string[] {
  return getPublicPaths(articles).filter(path => path !== '/' && !standalonePaths.includes(path));
}

export function isPublishedArticle(article: Article, today = new Date().toISOString().slice(0, 10)) {
  return isEditorialDate(article.published) && article.published <= today &&
    article.draft !== true && article.noindex !== true;
}

function hasCollectionContent(slug: string, articles: Article[]) {
  const category = categories[slug];
  return articles.some(article => category.sections ? category.sections.includes(article.section) :
    category.section ? article.section === category.section :
    category.topic ? article.topics.includes(category.topic) : article.section === slug);
}

export function getIndexablePaths(articles = getArticles()): string[] {
  const published = new Set(articles.filter(article => isPublishedArticle(article)).map(articleUrl));
  const articlePaths = new Set(articles.map(articleUrl));
  return getPublicPaths(articles).filter(path => {
    if (articlePaths.has(path)) return published.has(path);
    // The terms page is explicitly a legal draft; empty planned collections are placeholders.
    if (path === '/terms') return false;
    const slug = path.slice(1);
    if (Object.hasOwn(categories, slug)) return hasCollectionContent(slug, articles);
    if (path.startsWith('/topics/')) return articles.some(article => article.topics.includes(path.slice('/topics/'.length)));
    return true;
  });
}
