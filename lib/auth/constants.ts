export const ACCESS_TOKEN_COOKIE = "prm_access_token";
export const REFRESH_TOKEN_COOKIE = "prm_refresh_token";

/** Matches backend JWT `expiresIn: '1d'`. */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Matches backend refresh token TTL (30 days). */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
