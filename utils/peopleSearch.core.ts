/**
 * People search filters (spec §21: name, @username, country, fan club).
 *
 * Pure, so `node --test` can load it. Any country or fan club can be chosen;
 * the API accepts any (GET /social/search, profileService.search).
 */

export interface PeopleFilters {
  country: string | null;
  fanClubId: string | null;
}

export function peopleSearchFilters({
  country,
  fanClub,
}: {
  country: { country_code: string | null } | null;
  fanClub: { id: string } | null;
}): PeopleFilters {
  // A club already says where; the API ANDs the filters, so sending the
  // country too would hide members whose profile names another country, or
  // none. A country listed without a code cannot be matched against profiles.
  if (fanClub) return { country: null, fanClubId: fanClub.id };
  return { country: country?.country_code ?? null, fanClubId: null };
}

/** Two characters of a name or handle, or any filter, starts a search. */
export function isSearchingPeople(query: string, filters: PeopleFilters): boolean {
  return query.trim().length >= 2 || !!filters.country || !!filters.fanClubId;
}
