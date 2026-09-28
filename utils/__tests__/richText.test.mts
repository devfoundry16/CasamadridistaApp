/**
 * The rich-text tokenizer behind `components/Social/RichText.tsx`.
 *
 * Run with:  node --test utils/__tests__/richText.test.mts
 *
 * The one property every case relies on: joining the token values gives back
 * the input exactly, so rendering the tokens never drops or reorders a
 * character.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HASHTAG_MAX, hrefForToken, isSafeUrl, linkTokens, normaliseHashtag, tokenize, type RichToken } from '../richText.core.ts';

const round = (text: string) => tokenize(text).map((t) => t.value).join('');
const kinds = (text: string) => tokenize(text).map((t) => [t.type, t.value]);

describe('tokenize: plain text', () => {
  it('an empty string is no tokens', () => {
    assert.deepEqual(tokenize(''), []);
  });

  it('text with nothing special is one text token', () => {
    assert.deepEqual(tokenize('Hala Madrid'), [{ type: 'text', value: 'Hala Madrid' }]);
  });

  it('adjacent text is merged, never split into runs', () => {
    const tokens = tokenize('a @ b # c');
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].type, 'text');
  });

  it('round-trips arbitrary input', () => {
    for (const text of [
      'see https://casa.com/a, then @ali.f and #HalaMadrid!',
      'مرحبا #ريال_مدريد https://x.com/ب؟',
      '@@ ## http:// https:// (https://a.b/c)',
      'emoji 🤍 #🤍 @🤍',
    ]) {
      assert.equal(round(text), text);
    }
  });
});

describe('tokenize: URLs', () => {
  it('finds an https URL', () => {
    assert.deepEqual(kinds('go to https://casamadridista.com/news now'), [
      ['text', 'go to '],
      ['url', 'https://casamadridista.com/news'],
      ['text', ' now'],
    ]);
  });

  it('finds http, case-insensitively', () => {
    assert.deepEqual(kinds('HTTP://Example.com'), [['url', 'HTTP://Example.com']]);
  });

  it('ignores other schemes', () => {
    for (const text of ['ftp://x.com', 'javascript:alert(1)', 'mailto:a@b.com', 'www.casa.com', 'file:///etc/passwd']) {
      assert.ok(tokenize(text).every((t) => t.type !== 'url'), text);
    }
  });

  it('leaves trailing punctuation out of the URL', () => {
    assert.deepEqual(kinds('read https://a.com/x.'), [
      ['text', 'read '],
      ['url', 'https://a.com/x'],
      ['text', '.'],
    ]);
    assert.deepEqual(kinds('(https://a.com/x)'), [
      ['text', '('],
      ['url', 'https://a.com/x'],
      ['text', ')'],
    ]);
    assert.deepEqual(kinds('https://a.com/x?!'), [
      ['url', 'https://a.com/x'],
      ['text', '?!'],
    ]);
    assert.deepEqual(kinds('"https://a.com/x",'), [
      ['text', '"'],
      ['url', 'https://a.com/x'],
      ['text', '",'],
    ]);
  });

  it('leaves Arabic punctuation out of the URL', () => {
    assert.deepEqual(kinds('https://a.com/x، و'), [
      ['url', 'https://a.com/x'],
      ['text', '، و'],
    ]);
    assert.deepEqual(kinds('https://a.com/x؟'), [
      ['url', 'https://a.com/x'],
      ['text', '؟'],
    ]);
  });

  it('keeps a closing bracket that balances one inside the URL', () => {
    assert.deepEqual(kinds('https://en.wikipedia.org/wiki/Real_(club)'), [['url', 'https://en.wikipedia.org/wiki/Real_(club)']]);
  });

  it('keeps query strings and fragments', () => {
    assert.deepEqual(kinds('https://a.com/p?q=1&r=2#top'), [['url', 'https://a.com/p?q=1&r=2#top']]);
  });

  it('a bare scheme is text', () => {
    assert.deepEqual(kinds('https://'), [['text', 'https://']]);
    assert.deepEqual(kinds('https://.'), [['text', 'https://.']]);
  });

  it('a URL glued to a word is text', () => {
    assert.ok(tokenize('xhttps://a.com').every((t) => t.type === 'text'));
  });

  it('a hashtag or mention inside a URL stays part of the URL', () => {
    assert.deepEqual(kinds('https://a.com/#tag/@user'), [['url', 'https://a.com/#tag/@user']]);
  });

  it('balances brackets across a run of them', () => {
    assert.deepEqual(kinds('(see https://a.com/x_(y)))'), [
      ['text', '(see '],
      ['url', 'https://a.com/x_(y)'],
      ['text', '))'],
    ]);
    assert.deepEqual(kinds('https://a.com/((a))].'), [['url', 'https://a.com/((a))'], ['text', '].']]);
  });

  it('trims a long run of trailing punctuation in linear time', () => {
    const text = 'https://example.com/' + ')'.repeat(20_000);
    const started = performance.now();
    const tokens = tokenize(text);
    const elapsed = performance.now() - started;
    assert.deepEqual(tokens, [
      { type: 'url', value: 'https://example.com/' },
      { type: 'text', value: ')'.repeat(20_000) },
    ]);
    assert.ok(elapsed < 50, `took ${elapsed.toFixed(1)} ms`);
  });
});

describe('tokenize: mentions', () => {
  it('finds a valid handle', () => {
    assert.deepEqual(kinds('hi @ali.fayad!'), [
      ['text', 'hi '],
      ['mention', '@ali.fayad'],
      ['text', '!'],
    ]);
  });

  it('a mention at the start of the text', () => {
    assert.deepEqual(kinds('@casa_madrid'), [['mention', '@casa_madrid']]);
  });

  it('a sentence-ending dot is not part of the handle', () => {
    assert.deepEqual(kinds('thanks @ali.'), [
      ['text', 'thanks '],
      ['mention', '@ali'],
      ['text', '.'],
    ]);
  });

  it('matches the username rule: letter first, 3 to 20 characters', () => {
    assert.ok(tokenize('@ab').every((t) => t.type === 'text'), 'too short');
    assert.ok(tokenize('@1abc').every((t) => t.type === 'text'), 'starts with a digit');
    assert.ok(tokenize('@_abc').every((t) => t.type === 'text'), 'starts with underscore');
    assert.deepEqual(kinds('@abc'), [['mention', '@abc']]);
    assert.deepEqual(kinds('@' + 'a'.repeat(20)), [['mention', '@' + 'a'.repeat(20)]]);
    assert.ok(tokenize('@' + 'a'.repeat(21)).every((t) => t.type === 'text'), 'too long');
  });

  it('reads a capitalised handle, since handles are stored lower-case', () => {
    assert.deepEqual(kinds('@Ali_F'), [['mention', '@Ali_F']]);
  });

  it('an email address is not a mention', () => {
    assert.ok(tokenize('write to ali@casa.com').every((t) => t.type === 'text'));
  });

  it('a handle glued to Arabic letters is not a mention', () => {
    assert.ok(tokenize('@alifمرحبا').every((t) => t.type === 'text'));
  });

  it('a mention right after Arabic text and a space', () => {
    assert.deepEqual(kinds('مرحبا @ali_f'), [
      ['text', 'مرحبا '],
      ['mention', '@ali_f'],
    ]);
  });
});

describe('tokenize: hashtags', () => {
  it('finds a Latin hashtag', () => {
    assert.deepEqual(kinds('#HalaMadrid tonight'), [
      ['hashtag', '#HalaMadrid'],
      ['text', ' tonight'],
    ]);
  });

  it('finds an Arabic hashtag, with an underscore', () => {
    assert.deepEqual(kinds('يلا #ريال_مدريد'), [
      ['text', 'يلا '],
      ['hashtag', '#ريال_مدريد'],
    ]);
  });

  it('keeps Arabic diacritics inside the tag', () => {
    assert.deepEqual(kinds('#مَدريد'), [['hashtag', '#مَدريد']]);
  });

  it('digits are allowed', () => {
    assert.deepEqual(kinds('#UCL15'), [['hashtag', '#UCL15']]);
  });

  it('stops at punctuation', () => {
    assert.deepEqual(kinds('#Real, #Madrid.'), [
      ['hashtag', '#Real'],
      ['text', ', '],
      ['hashtag', '#Madrid'],
      ['text', '.'],
    ]);
  });

  it(`at most ${HASHTAG_MAX} characters`, () => {
    assert.deepEqual(kinds('#' + 'a'.repeat(HASHTAG_MAX)), [['hashtag', '#' + 'a'.repeat(HASHTAG_MAX)]]);
    assert.ok(tokenize('#' + 'a'.repeat(HASHTAG_MAX + 1)).every((t) => t.type === 'text'));
  });

  it('a hash glued to a word is not a tag', () => {
    assert.ok(tokenize('C#sharp a#b').every((t) => t.type === 'text'));
  });

  it('a lone hash or a double hash is text', () => {
    assert.ok(tokenize('# ##').every((t) => t.type === 'text'));
  });
});

describe('tokenize: mixed', () => {
  it('everything at once, in order', () => {
    const tokens: RichToken[] = tokenize('@ali look https://a.com/x #HalaMadrid');
    assert.deepEqual(
      tokens.map((t) => t.type),
      ['mention', 'text', 'url', 'text', 'hashtag'],
    );
  });
});

describe('linkTokens', () => {
  it('keeps links, mentions and hashtags in order and drops the text', () => {
    assert.deepEqual(linkTokens('see https://casa.com with @ali_f #HalaMadrid'), [
      { type: 'url', value: 'https://casa.com' },
      { type: 'mention', value: '@ali_f' },
      { type: 'hashtag', value: '#HalaMadrid' },
    ]);
  });

  it('plain text and an empty string have none', () => {
    assert.deepEqual(linkTokens('Hala Madrid'), []);
    assert.deepEqual(linkTokens(''), []);
  });

  it('stops at five by default', () => {
    const out = linkTokens('#a #b #c #d #e #f #g');
    assert.deepEqual(out.map((t) => t.value), ['#a', '#b', '#c', '#d', '#e']);
  });

  it('takes a different limit', () => {
    assert.deepEqual(linkTokens('#a #b #c', 2).map((t) => t.value), ['#a', '#b']);
    assert.deepEqual(linkTokens('#a #b #c', 0), []);
  });
});

describe('isSafeUrl', () => {
  it('only http and https', () => {
    assert.equal(isSafeUrl('https://a.com'), true);
    assert.equal(isSafeUrl('HTTP://a.com'), true);
    assert.equal(isSafeUrl('javascript:alert(1)'), false);
    assert.equal(isSafeUrl('casamadridistaapp://x'), false);
    assert.equal(isSafeUrl(' https://a.com'), false);
    assert.equal(isSafeUrl(''), false);
  });
});

describe('hrefForToken', () => {
  it('a mention opens the by-handle profile route, lower-cased', () => {
    assert.equal(hrefForToken({ type: 'mention', value: '@Ali.F' }), '/user/@ali.f');
  });

  it('a hashtag opens the hashtag feed, without the # and percent-encoded', () => {
    assert.equal(hrefForToken({ type: 'hashtag', value: '#HalaMadrid' }), '/community/hashtag/HalaMadrid');
    assert.equal(
      hrefForToken({ type: 'hashtag', value: '#ريال_مدريد' }),
      `/community/hashtag/${encodeURIComponent('ريال_مدريد')}`,
    );
  });

  it('a URL and plain text are not in-app routes', () => {
    assert.equal(hrefForToken({ type: 'url', value: 'https://a.com' }), null);
    assert.equal(hrefForToken({ type: 'text', value: 'hello' }), null);
  });

  it('every mention and hashtag the tokenizer emits gets a route', () => {
    for (const token of tokenize('@ali_1 #Casa #مدريد @x.y.z')) {
      if (token.type === 'mention' || token.type === 'hashtag') assert.ok(hrefForToken(token));
    }
  });

  it('a malformed token never becomes a path', () => {
    assert.equal(hrefForToken({ type: 'mention', value: '@../admin' }), null);
    assert.equal(hrefForToken({ type: 'hashtag', value: '#a/b' }), null);
  });
});

describe('normaliseHashtag', () => {
  it('keeps the tag as written, without a leading #', () => {
    assert.equal(normaliseHashtag('HalaMadrid'), 'HalaMadrid');
    assert.equal(normaliseHashtag('#HalaMadrid'), 'HalaMadrid');
    assert.equal(normaliseHashtag('ريال_مدريد'), 'ريال_مدريد');
  });

  it('decodes a still-encoded route param', () => {
    assert.equal(normaliseHashtag(encodeURIComponent('ريال_مدريد')), 'ريال_مدريد');
    assert.equal(normaliseHashtag('%23Casa'), 'Casa');
  });

  it('takes the first value of an array param', () => {
    assert.equal(normaliseHashtag(['Casa', 'x']), 'Casa');
  });

  it('refuses anything that is not a tag', () => {
    for (const bad of [undefined, null, '', '#', 'a b', 'a/b', 'a#b', '%E0%A4%A', 'a'.repeat(HASHTAG_MAX + 1), 42]) {
      assert.equal(normaliseHashtag(bad as any), null, String(bad));
    }
    assert.equal(normaliseHashtag('a'.repeat(HASHTAG_MAX)), 'a'.repeat(HASHTAG_MAX));
  });
});
