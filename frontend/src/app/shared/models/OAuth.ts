export type OAuthFromCodeToken = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type OAuthFromRefreshToken = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export type OAuthClaims = {
  sub: string;
  email: string;
}
