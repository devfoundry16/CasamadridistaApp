/**
 * The push topics a device registers with, and the "Social activity" switch.
 *
 * Run with:  node --test utils/__tests__/pushTopics.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseSocialPref, registrationTopics, serialiseSocialPref, SOCIAL_TOPIC, withTopic } from '../pushTopics.core.ts';

describe('registrationTopics', () => {
  it('social is on by default, next to media and dm', () => {
    assert.deepEqual(registrationTopics(true), ['media', 'dm', 'social']);
  });

  it('switching social off keeps media and dm', () => {
    assert.deepEqual(registrationTopics(false), ['media', 'dm']);
  });

  it('returns a fresh array each time', () => {
    const a = registrationTopics(true);
    a.push('x');
    assert.deepEqual(registrationTopics(true), ['media', 'dm', 'social']);
  });
});

describe('withTopic', () => {
  it('adds a topic and keeps every other one in order', () => {
    assert.deepEqual(withTopic(['media', 'match', 'dm'], SOCIAL_TOPIC, true), ['media', 'match', 'dm', 'social']);
  });

  it('removes only that topic', () => {
    assert.deepEqual(withTopic(['media', 'social', 'match', 'dm'], SOCIAL_TOPIC, false), ['media', 'match', 'dm']);
  });

  it('is idempotent and never duplicates', () => {
    assert.deepEqual(withTopic(['media', 'social'], SOCIAL_TOPIC, true), ['media', 'social']);
    assert.deepEqual(withTopic(['media', 'media', 'dm'], SOCIAL_TOPIC, false), ['media', 'dm']);
    assert.deepEqual(withTopic([], SOCIAL_TOPIC, false), []);
  });

  it('does not change its input', () => {
    const topics = ['media', 'dm'];
    withTopic(topics, SOCIAL_TOPIC, true);
    assert.deepEqual(topics, ['media', 'dm']);
  });
});

describe('the stored preference', () => {
  it('reads as on unless it was explicitly switched off', () => {
    assert.equal(parseSocialPref(null), true);
    assert.equal(parseSocialPref(undefined), true);
    assert.equal(parseSocialPref(''), true);
    assert.equal(parseSocialPref('garbage'), true);
    assert.equal(parseSocialPref('1'), true);
    assert.equal(parseSocialPref('0'), false);
  });

  it('round-trips', () => {
    assert.equal(parseSocialPref(serialiseSocialPref(true)), true);
    assert.equal(parseSocialPref(serialiseSocialPref(false)), false);
  });
});
