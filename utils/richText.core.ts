/**
 * Split user-written text into plain text, links, @mentions and #hashtags.
 *
 * Pure, with no imports, so `utils/__tests__/richText.test.mts` runs it under
 * `node --test`. `components/Social/RichText.tsx` renders the tokens.
 *
 * Joining every token's `value` gives back the input exactly: a token is a
 * slice of the text, never a rewrite of it. A mention keeps its `@` and a
 * hashtag its `#`.
 *
 * The rules:
 *   - URLs are http(s) only. Trailing punctuation (Latin and Arabic) is left
 *     out of the link, except a closing bracket that balances one inside it.
 *   - A mention is `@` plus a handle that passes the username rule
 *     `^[a-z][a-z0-9_.]{2,19}$`, read case-insensitively because handles are
 *     stored lower-case. A trailing dot ends the sentence, not the handle.
 *   - A hashtag is `#` plus 1–50 Unicode letters, digits or `_`. Combining marks
 *     count as part of a letter, so Arabic with diacritics stays one tag.
 *   - None of them starts in the middle of a word: `ali@casa.com`, `C#` and
 *     `xhttps://` are plain text.
 */

export type RichTokenType = 'text' | 'url' | 'mention' | 'hashtag';

export interface RichToken {
  type: RichTokenType;
  value: string;
}

export const HASHTAG_MAX = 50;

const USERNAME = /^[a-z][a-z0-9_.]{2,19}$/;

// One pass finds every candidate; each is then checked by its own rule. A
// rejected candidate becomes plain text.
const CANDIDATE = /https?:\/\/[^\s<>"]+|@[A-Za-z0-9_.]+|#[\p{L}\p{M}\p{N}_]+/giu;

// Characters that end a sentence rather than a link.
const TRAILING = new Set(['.', ',', ';', ':', '!', '?', "'", '"', ')', ']', '}', '>', '،', '؛', '؟', '۔', '…']);
const OPENERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

const WORD_CHAR = /[\p{L}\p{M}\p{N}_]/u;

/**
 * Trim sentence punctuation off the end of a URL candidate.
 *
 * Linear: the brackets are counted once, then the end index walks down and the
 * string is sliced once. Openers are never trailing punctuation, so only the
 * closer counts change as characters are dropped.
 */
function trimUrl(url: string): string {
  const open: Record<string, number> = { '(': 0, '[': 0, '{': 0 };
  const close: Record<string, number> = { ')': 0, ']': 0, '}': 0 };
  for (const ch of url) {
    if (ch in open) open[ch]++;
    else if (ch in close) close[ch]++;
  }

  let end = url.length;
  while (end > 0) {
    const last = url[end - 1];
    if (!TRAILING.has(last)) break;
    const opener = OPENERS[last];
    // `…/Real_(club)`: the `)` closes a bracket the URL opened, so it stays.
    if (opener && open[opener] >= close[last]) break;
    if (opener) close[last]--;
    end--;
  }
  return end === url.length ? url : url.slice(0, end);
}

/** A link we are willing to open: http or https, nothing else. */
export function isSafeUrl(url: string): boolean {
  return /^https?:\/\/\S/i.test(url);
}

function push(tokens: RichToken[], type: RichTokenType, value: string) {
  if (!value) return;
  const last = tokens[tokens.length - 1];
  if (type === 'text' && last?.type === 'text') last.value += value;
  else tokens.push({ type, value });
}

export function tokenize(text: string): RichToken[] {
  const tokens: RichToken[] = [];
  if (!text) return tokens;

  let cursor = 0;
  CANDIDATE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CANDIDATE.exec(text)) !== null) {
    const start = match.index;
    const raw = match[0];
    const before = start > 0 ? text[start - 1] : '';
    const after = text.slice(start + raw.length, start + raw.length + 1);

    let type: RichTokenType | null = null;
    let value = raw;

    if (raw[0] === '@') {
      // The dots at the end close a sentence: "thanks @ali."
      const handle = raw.slice(1).replace(/\.+$/, '');
      const ok =
        !(before && (WORD_CHAR.test(before) || before === '.' || before === '@')) &&
        !(after && WORD_CHAR.test(after)) &&
        USERNAME.test(handle.toLowerCase());
      if (ok) {
        type = 'mention';
        value = `@${handle}`;
      }
    } else if (raw[0] === '#') {
      const tag = raw.slice(1);
      const ok = !(before && (WORD_CHAR.test(before) || before === '#' || before === '&')) && tag.length <= HASHTAG_MAX;
      if (ok) type = 'hashtag';
    } else {
      const url = trimUrl(raw);
      const ok = !(before && WORD_CHAR.test(before)) && /^https?:\/\/[\p{L}\p{N}]/iu.test(url);
      if (ok) {
        type = 'url';
        value = url;
      }
    }

    push(tokens, 'text', text.slice(cursor, start));
    if (type) {
      push(tokens, type, value);
      cursor = start + value.length;
      // Whatever was trimmed off (a dot, a bracket) is read again as text.
      CANDIDATE.lastIndex = cursor;
    } else {
      push(tokens, 'text', raw);
      cursor = start + raw.length;
    }
  }

  push(tokens, 'text', text.slice(cursor));
  return tokens;
}
