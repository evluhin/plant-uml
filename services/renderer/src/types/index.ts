export interface RenderRequest {
  source: string;
  format: 'svg' | 'png';
  theme?: string;
}

export interface RenderResponse {
  svg?: string;
  pngBase64?: string;
  metrics: {
    renderMs: number;
    coldStart: boolean;
  };
}

export interface JWTPayload {
  iss: string;
  iat: number;
  exp: number;
  nonce: string;
}