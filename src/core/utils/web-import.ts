import { invoke } from '@tauri-apps/api/core';

interface WebsiteHtmlResponse {
  html: string;
  final_url: string;
}

export interface ImportedWebContent {
  title: string;
  contentHtml: string;
  sourceUrl: string;
}

export interface ImportExtractionOptions {
  includeFooter: boolean;
  includeImages: boolean;
}

const DEFAULT_IMPORT_OPTIONS: ImportExtractionOptions = {
  includeFooter: false,
  includeImages: true,
};

const BASE_STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'canvas',
  'svg',
  'nav',
  'header',
  'aside',
  'form',
  'button',
  'input',
  'select',
  'textarea',
  '[role="navigation"]',
  '[aria-hidden="true"]',
];

const POSITIVE_HINTS = [
  'content',
  'article',
  'post',
  'entry',
  'main',
  'body',
  'markdown',
  'prose',
  'blog',
];

const NEGATIVE_HINTS = [
  'nav',
  'menu',
  'header',
  'footer',
  'sidebar',
  'share',
  'comment',
  'advert',
  'ad-',
  'promo',
  'breadcrumb',
  'related',
];

const SAFE_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'br',
  'figure',
  'figcaption',
  'article',
  'section',
  'main',
  'div',
  'span',
]);

const SAFE_GLOBAL_ATTRS = new Set(['colspan', 'rowspan']);
const SAFE_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href', 'title']),
  img: new Set(['src', 'alt', 'title']),
};
const MIN_EXTRACTED_TEXT_LENGTH = 220;
const MAX_SOURCE_HTML_CHARS = 2_000_000;
const MAX_IMPORTED_TEXT_CHARS = 120_000;
const MAX_FALLBACK_PARAGRAPHS = 120;

function normalizeText(input: string | null | undefined): string {
  return (input ?? '').replace(/\s+/g, ' ').trim();
}

function scoreHints(el: HTMLElement): number {
  const hint = `${el.id} ${el.className}`.toLowerCase();
  let score = 0;

  for (const token of POSITIVE_HINTS) {
    if (hint.includes(token)) {
      score += 35;
    }
  }

  for (const token of NEGATIVE_HINTS) {
    if (hint.includes(token)) {
      score -= 45;
    }
  }

  return score;
}

function scoreCandidate(el: HTMLElement): number {
  const textLength = normalizeText(el.textContent).length;
  if (textLength < 140) {
    return Number.NEGATIVE_INFINITY;
  }

  const paragraphCount = el.querySelectorAll('p').length;
  const headingCount = el.querySelectorAll('h1,h2,h3').length;
  const linkTextLength = Array.from(el.querySelectorAll('a')).reduce((sum, link) => {
    return sum + normalizeText(link.textContent).length;
  }, 0);
  const linkDensity = linkTextLength / Math.max(1, textLength);

  const tag = el.tagName.toLowerCase();
  const tagBonus = tag === 'article' ? 180 : tag === 'main' ? 140 : tag === 'section' ? 40 : 0;
  const listPenalty = Math.max(0, el.querySelectorAll('li').length - paragraphCount * 2) * 8;

  return (
    textLength +
    paragraphCount * 28 +
    headingCount * 20 +
    tagBonus +
    scoreHints(el) -
    linkDensity * 280 -
    listPenalty
  );
}

function normalizeOptions(options?: Partial<ImportExtractionOptions>): ImportExtractionOptions {
  return {
    includeFooter: options?.includeFooter ?? DEFAULT_IMPORT_OPTIONS.includeFooter,
    includeImages: options?.includeImages ?? DEFAULT_IMPORT_OPTIONS.includeImages,
  };
}

function buildStripSelectors(options: ImportExtractionOptions): string {
  const selectors = [...BASE_STRIP_SELECTORS];
  if (!options.includeFooter) {
    selectors.push('footer', '[role="contentinfo"]');
  }
  return selectors.join(',');
}

function removeNoise(root: ParentNode, options: ImportExtractionOptions): void {
  root.querySelectorAll(buildStripSelectors(options)).forEach((node) => node.remove());
}

function tryNormalizeSourceUrl(sourceUrl?: string): string | null {
  if (!sourceUrl?.trim()) {
    return null;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function absolutizeUrls(container: HTMLElement, baseUrl: string): void {
  const toAbsolute = (raw: string): string => {
    try {
      return new URL(raw, baseUrl).toString();
    } catch {
      return raw;
    }
  };

  container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    a.setAttribute('href', toAbsolute(a.getAttribute('href') ?? ''));
  });

  container.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
    img.setAttribute('src', toAbsolute(img.getAttribute('src') ?? ''));
  });
}

function isSafeUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) {
    return false;
  }

  if (value.startsWith('#')) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeElementTree(root: HTMLElement, options: ImportExtractionOptions): void {
  const walk = (node: Node): void => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === 'img' && !options.includeImages) {
      element.remove();
      return;
    }

    if (!SAFE_TAGS.has(tag)) {
      const parent = element.parentNode;
      if (!parent) {
        return;
      }
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      return;
    }

    const allowedForTag = SAFE_ATTRS_BY_TAG[tag] ?? new Set<string>();
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (!allowedForTag.has(name) && !SAFE_GLOBAL_ATTRS.has(name)) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'href' && !isSafeUrl(value)) {
        element.removeAttribute(attr.name);
      }
      if (name === 'src' && !isSafeUrl(value)) {
        element.removeAttribute(attr.name);
      }
    }

    if (tag === 'a' && element.getAttribute('href')) {
      element.setAttribute('rel', 'noopener noreferrer nofollow');
      element.setAttribute('target', '_blank');
    }

    const children = Array.from(element.childNodes);
    for (const child of children) {
      walk(child);
    }
  };

  walk(root);
}

function extractBestElement(doc: Document): HTMLElement {
  const candidates = Array.from(
    doc.body.querySelectorAll<HTMLElement>('main,article,[role="main"],section,div'),
  ).filter((el) => !el.closest('nav,header,footer,aside,[role="navigation"]'));

  let best: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = scoreCandidate(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best ?? doc.body;
}

function getHtmlTextLength(html: string): number {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  return normalizeText(parsed.body.textContent).length;
}

function truncateHtmlToTextBudget(
  html: string,
  maxChars: number,
): { html: string; truncated: boolean } {
  if (maxChars <= 0) {
    return { html: '', truncated: html.trim().length > 0 };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let remaining = maxChars;
  let truncated = false;

  const trimNode = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (!text) {
        return false;
      }
      if (remaining <= 0) {
        node.parentNode?.removeChild(node);
        truncated = true;
        return false;
      }
      if (text.length <= remaining) {
        remaining -= text.length;
        return true;
      }

      const clipped = `${text.slice(0, Math.max(0, remaining)).trimEnd()}...`;
      node.textContent = clipped;
      remaining = 0;
      truncated = true;
      return true;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return false;
    }

    const element = node as HTMLElement;
    const children = Array.from(element.childNodes);
    let hasContent = false;

    for (const child of children) {
      const kept = trimNode(child);
      hasContent = hasContent || kept;
    }

    const tag = element.tagName.toLowerCase();
    if (!hasContent && !['img', 'br', 'hr'].includes(tag)) {
      element.parentNode?.removeChild(element);
      return false;
    }

    return true;
  };

  Array.from(doc.body.childNodes).forEach((node) => {
    trimNode(node);
  });

  return { html: doc.body.innerHTML.trim(), truncated };
}

function limitFallbackParagraphs(
  paragraphs: string[],
  maxChars: number,
): { paragraphs: string[]; truncated: boolean } {
  const limited: string[] = [];
  let remaining = maxChars;
  let truncated = false;

  for (const paragraph of paragraphs.slice(0, MAX_FALLBACK_PARAGRAPHS)) {
    if (remaining <= 0) {
      truncated = true;
      break;
    }

    if (paragraph.length <= remaining) {
      limited.push(paragraph);
      remaining -= paragraph.length;
      continue;
    }

    limited.push(`${paragraph.slice(0, Math.max(0, remaining)).trimEnd()}...`);
    remaining = 0;
    truncated = true;
    break;
  }

  if (paragraphs.length > MAX_FALLBACK_PARAGRAPHS) {
    truncated = true;
  }

  return { paragraphs: limited, truncated };
}

function resolveTitle(doc: Document, sourceUrl?: string): string {
  const fromTitleTag = normalizeText(doc.title);
  if (fromTitleTag) {
    return fromTitleTag;
  }

  const fromMeta =
    normalizeText(doc.querySelector('meta[property="og:title"]')?.getAttribute('content')) ||
    normalizeText(doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'));

  if (fromMeta) {
    return fromMeta;
  }

  const fromH1 = normalizeText(doc.querySelector('h1')?.textContent);
  if (fromH1) {
    return fromH1;
  }

  if (!sourceUrl) {
    return 'Imported Page';
  }

  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return 'Imported Page';
  }
}

function clampTitle(title: string): string {
  const normalized = normalizeText(title);
  if (!normalized) {
    return 'Imported Page';
  }

  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildImportedHtml(
  main: HTMLElement,
  sourceUrl: string | undefined,
  options: ImportExtractionOptions,
  footerHtml: string,
): string {
  const clone = main.cloneNode(true) as HTMLElement;
  removeNoise(clone, options);
  const normalizedSource = tryNormalizeSourceUrl(sourceUrl);
  if (normalizedSource) {
    absolutizeUrls(clone, normalizedSource);
  }
  sanitizeElementTree(clone, options);

  const cleaned = clone.innerHTML.trim();
  const content = cleaned || `<p>${escapeHtml(normalizeText(main.textContent) || 'No content extracted.')}</p>`;
  const limited = truncateHtmlToTextBudget(content, MAX_IMPORTED_TEXT_CHARS);
  const truncationNote = limited.truncated
    ? '<p><em>note: import truncated to keep document size manageable</em></p>'
    : '';
  const sourceBlock = normalizedSource
    ? `<p><em>Source: <a href="${escapeHtml(normalizedSource)}">${escapeHtml(normalizedSource)}</a></em></p>`
    : '';

  return `${sourceBlock}${limited.html}${truncationNote}${footerHtml}`;
}

function extractFooterHtml(
  doc: Document,
  sourceUrl: string | undefined,
  options: ImportExtractionOptions,
): string {
  if (!options.includeFooter) {
    return '';
  }

  const footerCandidates = Array.from(
    doc.querySelectorAll<HTMLElement>('footer,[role="contentinfo"]'),
  );

  if (!footerCandidates.length) {
    return '';
  }

  const normalizedSource = tryNormalizeSourceUrl(sourceUrl);
  const footerParts: string[] = [];

  for (const footer of footerCandidates) {
    const clone = footer.cloneNode(true) as HTMLElement;
    removeNoise(clone, { ...options, includeFooter: true });
    if (normalizedSource) {
      absolutizeUrls(clone, normalizedSource);
    }
    sanitizeElementTree(clone, options);

    const html = clone.innerHTML.trim();
    const textLength = normalizeText(clone.textContent).length;
    if (html && textLength > 18) {
      footerParts.push(html);
    }
  }

  if (!footerParts.length) {
    return '';
  }

  return `<hr /><p><em>Footer</em></p>${footerParts.join('')}`;
}

function isLikelyContentText(value: string): boolean {
  const normalized = normalizeText(value);
  if (normalized.length < 45 || normalized.length > 3500) {
    return false;
  }
  if (normalized.split(' ').length < 7) {
    return false;
  }
  if (/^(home|menu|next|previous|login|sign in|search)$/i.test(normalized)) {
    return false;
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return false;
  }
  const letters = (normalized.match(/[a-z]/gi) ?? []).length;
  if (letters / normalized.length < 0.45) {
    return false;
  }
  return true;
}

function collectTextFromJson(value: unknown, target: Set<string>): void {
  if (typeof value === 'string') {
    if (isLikelyContentText(value)) {
      target.add(normalizeText(value));
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextFromJson(item, target);
    }
    return;
  }

  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectTextFromJson(child, target);
    }
  }
}

function extractQuotedLongStrings(raw: string): string[] {
  const results: string[] = [];
  const regex = /"((?:\\.|[^"])*)"/g;
  let match: RegExpExecArray | null = regex.exec(raw);

  while (match) {
    const serialized = `"${match[1]}"`;
    try {
      const decoded = JSON.parse(serialized);
      if (typeof decoded === 'string' && isLikelyContentText(decoded)) {
        results.push(normalizeText(decoded));
      }
    } catch {
      // ignore malformed candidates
    }
    match = regex.exec(raw);
  }

  return results;
}

function splitLongText(text: string): string[] {
  return text
    .split(/\n{2,}|[.!?]\s+/g)
    .map((part) => normalizeText(part))
    .filter((part) => isLikelyContentText(part));
}

function extractRscPayloadParagraphs(rawHtml: string): string[] {
  const paragraphs = new Set<string>();
  const childrenRegex = /"children":"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null = childrenRegex.exec(rawHtml);

  while (match) {
    const serialized = `"${match[1]}"`;
    try {
      const decoded = JSON.parse(serialized);
      if (typeof decoded === 'string' && isLikelyContentText(decoded)) {
        paragraphs.add(normalizeText(decoded));
      }
    } catch {
      // Ignore malformed encoded strings.
    }
    match = childrenRegex.exec(rawHtml);
  }

  return Array.from(paragraphs);
}

function extractScriptFallbackParagraphs(doc: Document, rawHtml: string): string[] {
  const paragraphs = new Set<string>();
  const scripts = Array.from(doc.querySelectorAll('script'));

  for (const script of scripts) {
    const raw = script.textContent?.trim();
    if (!raw || raw.length < 120) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      collectTextFromJson(parsed, paragraphs);
      continue;
    } catch {
      // Not pure JSON, fall through.
    }

    for (const quoted of extractQuotedLongStrings(raw)) {
      paragraphs.add(quoted);
    }
  }

  if (paragraphs.size === 0) {
    const bodyText = normalizeText(doc.body.textContent);
    for (const part of splitLongText(bodyText)) {
      paragraphs.add(part);
    }
  }

  for (const part of extractRscPayloadParagraphs(rawHtml)) {
    paragraphs.add(part);
  }

  return Array.from(paragraphs)
    .sort((a, b) => b.length - a.length)
    .slice(0, 20);
}

function buildFallbackTextHtml(
  paragraphs: string[],
  sourceUrl: string | undefined,
  footerHtml: string,
): string {
  const limited = limitFallbackParagraphs(paragraphs, MAX_IMPORTED_TEXT_CHARS);
  const normalizedSource = tryNormalizeSourceUrl(sourceUrl);
  const sourceBlock = normalizedSource
    ? `<p><em>Source: <a href="${escapeHtml(normalizedSource)}">${escapeHtml(normalizedSource)}</a></em></p>`
    : '';

  const body = limited.paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const truncationNote = limited.truncated
    ? '<p><em>note: import truncated to keep document size manageable</em></p>'
    : '';

  return `${sourceBlock}${body}${truncationNote}${footerHtml}`;
}

export async function fetchWebsiteHtml(url: string): Promise<WebsiteHtmlResponse> {
  return await invoke<WebsiteHtmlResponse>('fetch_website_html', { url });
}

export function extractMainContentFromHtml(
  rawHtml: string,
  sourceUrl?: string,
  options?: Partial<ImportExtractionOptions>,
): ImportedWebContent {
  const resolvedOptions = normalizeOptions(options);
  const isRawHtmlTruncated = rawHtml.length > MAX_SOURCE_HTML_CHARS;
  const boundedRawHtml = isRawHtmlTruncated
    ? rawHtml.slice(0, MAX_SOURCE_HTML_CHARS)
    : rawHtml;
  const parser = new DOMParser();
  const doc = parser.parseFromString(boundedRawHtml, 'text/html');
  const fallbackParagraphs = extractScriptFallbackParagraphs(doc, boundedRawHtml);
  const footerHtml = extractFooterHtml(doc, sourceUrl, resolvedOptions);
  removeNoise(doc, resolvedOptions);

  const bestElement = extractBestElement(doc);
  const title = clampTitle(resolveTitle(doc, sourceUrl));
  let contentHtml = buildImportedHtml(bestElement, sourceUrl, resolvedOptions, footerHtml);

  if (getHtmlTextLength(contentHtml) < MIN_EXTRACTED_TEXT_LENGTH && fallbackParagraphs.length > 0) {
    contentHtml = buildFallbackTextHtml(fallbackParagraphs, sourceUrl, footerHtml);
  }

  if (isRawHtmlTruncated) {
    contentHtml = `${contentHtml}<p><em>note: source page trimmed before extraction due to size limit</em></p>`;
  }

  return {
    title,
    contentHtml,
    sourceUrl: sourceUrl?.trim() ?? '',
  };
}

export async function importFromWebsite(
  url: string,
  options?: Partial<ImportExtractionOptions>,
): Promise<ImportedWebContent> {
  const response = await fetchWebsiteHtml(url);
  return extractMainContentFromHtml(response.html, response.final_url || url, options);
}
