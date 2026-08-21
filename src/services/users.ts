/**
 * Batch user-id -> username lookup.
 *
 * Backs "shared by X" / "authored by X" display in any consumer that only
 * has a bare owner_user_id (mod-ledger's Evaluation, navicharts' StarChart —
 * neither service stores a display name locally, since users live in
 * astrogators-table's separate database). Hits astrogators-table's
 * GET /users/lookup directly via the shared `apiClient` — every consumer
 * already points it at astrogators-table via AuthProvider's `apiBaseUrl`,
 * so no per-app backend proxying is needed for this.
 */

import { apiClient } from './api';

interface UserLookupItem {
  id: number;
  username: string;
}

interface UserLookupResponse {
  users: UserLookupItem[];
}

/**
 * Resolve a batch of user ids to usernames in one request.
 *
 * Dedupes ids client-side. Any id the backend doesn't recognize is simply
 * absent from the returned map — callers should treat a missing entry the
 * same way they already treat a null/unknown username.
 */
export const fetchUsernames = async (ids: number[]): Promise<Record<number, string>> => {
  if (ids.length === 0) {
    return {};
  }

  const unique = [...new Set(ids)];
  const response = await apiClient.get<UserLookupResponse>(
    `/api/v1/users/lookup?ids=${unique.join(',')}`
  );

  return Object.fromEntries(response.users.map((u) => [u.id, u.username]));
};
