import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { isSearchingPeople, peopleSearchFilters } from '../peopleSearch.core.ts';

/**
 * People search (spec §21: by name, @username, country, fan club). It used to
 * offer only "my country" and "my fan club"; any country or club now.
 */
describe('peopleSearchFilters', () => {
  it('a chosen country filters by its code', () => {
    assert.deepEqual(peopleSearchFilters({ country: { country: 'Spain', country_code: 'ES' }, fanClub: null }), { country: 'ES', fanClubId: null });
  });

  it('a chosen club filters by the club alone: a member whose profile has another country, or none, still shows', () => {
    // The club is picked under a country, but the API ANDs the two filters.
    assert.deepEqual(
      peopleSearchFilters({ country: { country: 'Spain', country_code: 'ES' }, fanClub: { id: 'club-1' } }),
      { country: null, fanClubId: 'club-1' },
    );
  });

  it('a country without a code cannot filter people, and nothing chosen filters nothing', () => {
    assert.deepEqual(peopleSearchFilters({ country: { country: 'Atlantis', country_code: null }, fanClub: null }), { country: null, fanClubId: null });
    assert.deepEqual(peopleSearchFilters({ country: null, fanClub: null }), { country: null, fanClubId: null });
  });
});

describe('isSearchingPeople', () => {
  it('searches on two characters of a name or handle, or on any filter', () => {
    assert.equal(isSearchingPeople('a', { country: null, fanClubId: null }), false);
    assert.equal(isSearchingPeople(' al ', { country: null, fanClubId: null }), true);
    assert.equal(isSearchingPeople('', { country: 'ES', fanClubId: null }), true);
    assert.equal(isSearchingPeople('', { country: null, fanClubId: 'club-1' }), true);
  });
});
