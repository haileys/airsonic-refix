export type SonicastTarget = {
  name: string,
  url: string,
}

export interface Config {
  serverUrl: string,
  sonicastTargets: SonicastTarget[],
  radioCoverArt: { [id: string]: string },
}

const env = (window as any).env
const globalConfig = (window as any).config

export const config: Config = {
  serverUrl: env?.SERVER_URL,
  sonicastTargets: globalConfig?.sonicastTargets ?? [],
  radioCoverArt: globalConfig?.radioCoverArt ?? {},
}
