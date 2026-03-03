// Small helpers for journal editing and previews.
export const extractTextFromContent = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map((n) => extractTextFromContent(n)).join(' ');
  if (node.text) return node.text;
  if (node.content) return extractTextFromContent(node.content);
  return '';
};

export const buildEntryPreview = (content: any): string => {
  const text = extractTextFromContent(content);
  return text || 'No content yet';
};
