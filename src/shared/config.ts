export type SonicastTarget = {
  name: string,
  url: string,
}

export interface Config {
  serverUrl: string,
  sonicastTargets: SonicastTarget[],
}

const env = (window as any).env

export const config: Config = {
  serverUrl: env?.SERVER_URL,
  sonicastTargets: parseSonicastTargets(env?.SONICAST_TARGETS),
}

function parseSonicastTargets(json?: string): SonicastTarget[] {
  if (!json) {
    return []
  }

  try {
    return JSON.parse(json)
  } catch (err) {
    console.warn('parsing env.SONICAST_TARGETS:', err)
    return []
  }
}
