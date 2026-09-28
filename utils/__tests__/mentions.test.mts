/**
 * The composer's @-autocomplete and "Tag people" helpers.
 *
 * Run with:  node --test utils/__tests__/mentions.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activeMention,
  insertMention,
  peopleMatching,
  splitTagged,
  TAG_MAX,
  toggleTagged,
} from '../mentions.core.ts';

const at = (text: string, caret = text.length) => activeMention(text, { start: caret, end: caret });

describe('activeMention', () => {
  it('finds the @word the caret is at the end of', () => {
    assert.deepEqual(at('hi @al'), { start: 3, end: 6, query: 'al' });
  });

  it('a bare @ is active with an empty query', () => {
    assert.deepEqual(at('hi @'), { start: 3, end: 4, query: '' });
    assert.deepEqual(at('@'), { start: 0, end: 1, query: '' });
  });

  it('the query is what precedes the caret; the range covers the whole word', () => {
    // caret between "al" and "i"
    assert.deepEqual(at('hi @ali there', 6), { start: 3, end: 7, query: 'al' });
  });

  it('lower-cases the query', () => {
    assert.equal(at('@AlI')?.query, 'ali');
  });

  it('works at the start of the text and after a newline or punctuation', () => {
    assert.equal(at('@ali')?.query, 'ali');
    assert.equal(at('line\n@ali')?.query, 'ali');
    assert.equal(at('(@ali')?.query, 'ali');
    assert.equal(at('مرحبا @ali')?.query, 'ali');
  });

  it('is not active once the caret has left the word', () => {
    assert.equal(at('@ali '), null);
    assert.equal(at('@ali there'), null);
    assert.equal(at('hello'), null);
    assert.equal(at(''), null);
  });

  it('an @ glued to a word is an email, not a mention', () => {
    assert.equal(at('ali@casa'), null);
    assert.equal(at('x.@ali'), null);
    assert.equal(at('@@ali'), null);
  });

  it('a handle cannot start with a digit, underscore or dot', () => {
    assert.equal(at('@1ab'), null);
    assert.equal(at('@_ab'), null);
    assert.equal(at('@.ab'), null);
  });

  it('gives up past the longest possible handle', () => {
    assert.equal(at('@' + 'a'.repeat(20))?.query, 'a'.repeat(20));
    assert.equal(at('@' + 'a'.repeat(21)), null);
  });

  it('only for a collapsed caret, never a selected range', () => {
    assert.equal(activeMention('@ali', { start: 1, end: 4 }), null);
  });

  it('clamps a caret beyond the text', () => {
    assert.equal(activeMention('@ali', { start: 99, end: 99 })?.query, 'ali');
  });
});

describe('insertMention', () => {
  it('replaces the @word with the handle and a space, caret after the space', () => {
    const text = 'hi @al';
    const out = insertMention(text, at(text)!, 'ali.f');
    assert.deepEqual(out, { text: 'hi @ali.f ', caret: 10 });
  });

  it('replaces the whole word, not just up to the caret', () => {
    const text = 'hi @alxx there';
    const out = insertMention(text, activeMention(text, { start: 6, end: 6 })!, 'ali');
    assert.equal(out.text, 'hi @ali there');
    // After the existing space: no double space.
    assert.equal(out.caret, 8);
  });

  it('a mention in the middle of a line keeps what follows it', () => {
    const text = '@a,';
    const out = insertMention(text, activeMention(text, { start: 2, end: 2 })!, 'ali');
    assert.equal(out.text, '@ali ,');
  });

  it('a mention at the end of a line keeps the caret on that line', () => {
    const text = 'hi @al\nnext';
    const out = insertMention(text, activeMention(text, { start: 6, end: 6 })!, 'ali');
    // A space is added before the newline; the newline is not reused as one.
    assert.deepEqual(out, { text: 'hi @ali \nnext', caret: 8 });
  });
});

const person = (id: string, username: string | null, name: string) => ({
  id,
  username,
  name,
  avatar_url: null,
  country_code: null,
  is_member: false,
  is_verified: false,
});

describe('peopleMatching', () => {
  const friends = [person('1', 'zidane', 'Zinedine Zidane'), person('2', 'ali', 'Ali Hassan'), person('3', null, 'No Handle'), person('4', 'bale', 'Gareth Bale')];

  it('with no query: every friend, in order', () => {
    assert.deepEqual(peopleMatching('', friends, []).map((p) => p.id), ['1', '2', '3', '4']);
  });

  it('handle prefix first, then a name word prefix, then anywhere', () => {
    const people = [person('a', 'xal', 'Someone'), person('b', 'zz1', 'Big Al'), person('c', 'alonso', 'Xabi Alonso')];
    assert.deepEqual(peopleMatching('al', people, []).map((p) => p.id), ['c', 'b', 'a']);
  });

  it('friends come before search results, and a result already shown as a friend is not repeated', () => {
    const results = [
      { ...person('2', 'ali', 'Ali Hassan'), relationship: 'friends' },
      { ...person('9', 'alia', 'Alia'), relationship: 'none' },
    ];
    assert.deepEqual(peopleMatching('ali', friends, results).map((p) => p.id), ['2', '9']);
  });

  it('drops yourself and people you block from search results', () => {
    const results = [
      { ...person('s', 'alime', 'Me'), relationship: 'self' },
      { ...person('b', 'alib', 'Blocked'), relationship: 'blocking' },
      { ...person('o', 'alio', 'Other'), relationship: 'request_sent' },
    ];
    assert.deepEqual(peopleMatching('ali', [], results).map((p) => p.id), ['o']);
  });

  it('a mention needs a handle to insert', () => {
    assert.deepEqual(peopleMatching('', friends, [], { requireUsername: true }).map((p) => p.id), ['1', '2', '4']);
  });

  it('skips excluded ids, and stops at the limit', () => {
    assert.deepEqual(peopleMatching('', friends, [], { exclude: ['1'], limit: 2 }).map((p) => p.id), ['2', '3']);
  });

  it('a leading @ in the query is ignored', () => {
    assert.deepEqual(peopleMatching('@bal', friends, []).map((p) => p.id), ['4']);
  });
});

describe('toggleTagged', () => {
  const a = person('a', 'aaa', 'A');
  const b = person('b', 'bbb', 'B');

  it('adds, then removes', () => {
    const one = toggleTagged([], a);
    assert.deepEqual(one.map((p) => p.id), ['a']);
    assert.deepEqual(toggleTagged(one, a), []);
  });

  it(`stops at ${TAG_MAX}, but still lets you remove`, () => {
    const full = Array.from({ length: TAG_MAX }, (_, i) => person(String(i), `u${i}xx`, `P${i}`));
    assert.equal(toggleTagged(full, b), full);
    assert.equal(toggleTagged(full, full[3]).length, TAG_MAX - 1);
  });
});

describe('splitTagged', () => {
  const t = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), username: `u${i}`, name: `N${i}`, avatar_url: null }));

  it('shows up to two and counts the rest', () => {
    assert.deepEqual(splitTagged(t(0)), { shown: [], more: 0 });
    assert.deepEqual(splitTagged(t(2)).more, 0);
    assert.equal(splitTagged(t(2)).shown.length, 2);
    assert.deepEqual(splitTagged(t(5)).more, 3);
    assert.equal(splitTagged(t(5)).shown.length, 2);
  });

  it('three is shown whole rather than "two and 1 more"', () => {
    assert.deepEqual(splitTagged(t(3)), { shown: t(3), more: 0 });
  });

  it('shows everyone when asked', () => {
    assert.deepEqual(splitTagged(t(7), Infinity), { shown: t(7), more: 0 });
  });

  it('tolerates a missing list', () => {
    assert.deepEqual(splitTagged(undefined), { shown: [], more: 0 });
  });
});
