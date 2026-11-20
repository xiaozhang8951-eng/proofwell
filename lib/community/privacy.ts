// Fixed request template; never put a nickname, comment body or Auth token in a URL.
export function commentRemovalLink(article: string, id: string) {
  if (!/^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(article) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return 'mailto:proofwelllife@gmail.com';
  const body = `Please review my comment removal request.\nArticle: https://proofwelllife.com${article}\nComment reference: ${id}\n\nPlease tell me what minimal information is needed to verify this request. I will not send passwords, session tokens or medical records.`;
  return `mailto:proofwelllife@gmail.com?subject=${encodeURIComponent('ProofWell comment removal request')}&body=${encodeURIComponent(body)}`;
}
