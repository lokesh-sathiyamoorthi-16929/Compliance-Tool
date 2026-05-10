export interface Ad360ConnectionConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface Ad360Health {
  ok: boolean;
  configured: boolean;
  message: string;
}
