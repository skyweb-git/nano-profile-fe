const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'SPAN',
  'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4'
]);

const BLOCK_TAGS = new Set(['P', 'DIV', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4']);

/** True when the string looks like HTML markup (not plain text). */
export function isRichBioHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

/** Plain text from bio HTML or plain string (for empty checks / phone extract). */
export function bioToPlainText(value) {
  const raw = String(value || '');
  if (!raw) return '';
  if (!isRichBioHtml(raw)) return raw;
  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = raw;
  return (el.textContent || el.innerText || '').replace(/\u00a0/g, ' ').trim();
}

function cleanNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.nodeValue || '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName;
  // Convert Word/list spans and common paste wrappers
  if (tag === 'FONT') {
    const frag = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) frag.appendChild(cleaned);
    });
    return frag;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    const frag = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) frag.appendChild(cleaned);
    });
    // Preserve line breaks from unknown block tags
    if (BLOCK_TAGS.has(tag) || tag === 'TR' || tag === 'TABLE') {
      frag.appendChild(document.createElement('br'));
    }
    return frag;
  }

  // Keep bold/italic/underline from Word/Google Docs span styles
  if (tag === 'SPAN') {
    const weight = String(node.style?.fontWeight || '');
    const style = String(node.style?.fontStyle || '');
    const deco = String(node.style?.textDecoration || '');
    const isBold = weight === 'bold' || weight === '700' || parseInt(weight, 10) >= 600;
    const isItalic = style === 'italic';
    const isUnderline = deco.includes('underline');

    let inner = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) inner.appendChild(cleaned);
    });

    const wrap = (tagName, children) => {
      const el = document.createElement(tagName);
      el.appendChild(children);
      return el;
    };

    let result = inner;
    if (isUnderline) result = wrap('u', result);
    if (isItalic) result = wrap('em', result);
    if (isBold) result = wrap('strong', result);
    return result;
  }

  const el = document.createElement(tag === 'DIV' ? 'P' : tag);
  Array.from(node.childNodes).forEach((child) => {
    const cleaned = cleanNode(child);
    if (cleaned) el.appendChild(cleaned);
  });
  return el;
}

/**
 * Sanitize pasted / stored bio HTML. Keeps bold, italic, underline, lists, paragraphs.
 */
export function sanitizeBioHtml(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (typeof document === 'undefined') {
    return raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+=("|')[\s\S]*?\1/gi, '');
  }

  // Plain text → preserve line breaks
  if (!isRichBioHtml(raw)) {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  const doc = document.createElement('div');
  doc.innerHTML = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

  const out = document.createElement('div');
  Array.from(doc.childNodes).forEach((child) => {
    const cleaned = cleanNode(child);
    if (cleaned) out.appendChild(cleaned);
  });

  // Normalize empty paragraphs
  let html = out.innerHTML
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  return html;
}
