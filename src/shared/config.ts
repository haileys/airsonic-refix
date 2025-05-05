export type SonicastTarget = {
  name: string,
  url: string,
}

export interface PodcastConfig {
  url: string,
  podcastPrefix: string,
  episodePrefix: string,
}

export interface Config {
  serverUrl: string,
  podcasts?: PodcastConfig,
  sonicastTargets: SonicastTarget[],
  radioCoverArt: { [id: string]: string },
}

const env = (window as any).env
const globalConfig = (window as any).config

function podcastConfig(): PodcastConfig | undefined {
  if (globalConfig.podcasts) {
    return {
      url: globalConfig.podcasts.url,
      podcastPrefix: globalConfig.podcasts.podcastPrefix,
      episodePrefix: globalConfig.podcasts.episodePrefix,
    }
  }
}

export const config: Config = {
  serverUrl: globalConfig?.serverUrl ?? env?.SERVER_URL ?? '',
  podcasts: podcastConfig(),
  sonicastTargets: globalConfig?.sonicastTargets ?? [],
  radioCoverArt: globalConfig?.radioCoverArt ?? {},
}
