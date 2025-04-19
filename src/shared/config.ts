export interface Config {
  serverUrl: string,
  sonicastUrl: string,
}

const env = (window as any).env

export const config: Config = {
  serverUrl: env?.SERVER_URL || '',
  sonicastUrl: env?.SONICAST_URL || '',
}
