import { API, PlayQueue, Track } from '@/shared/api'
import { ReplayGainMode } from './audio'
import { AuthService } from '@/auth/service'

export interface PlaybackEvent {
  playing: boolean,
  position?: number,
  duration?: number,
}

export type PlaybackCallback = (ev: PlaybackEvent) => void;
export type PlayQueueCallback = (queue: PlayQueue) => void;

export type PlayerState = {
  tracks: Track[],
  index: number,
  time: number,
  shuffle: boolean,
  repeat: boolean,
  playing: boolean,
}

type Action<Param> = { param: Param, result: void };
type Query<Data> = { param: void, result: Data };

type CommandMap = {
  'play': Action<void>,
  'pause': Action<void>,
  'skip-next': Action<void>,
  'skip-previous': Action<void>,
  'seek': Action<{ pos: number }>,
  'play-index': Action<{ index: number }>,
  'reset-queue': Action<void>,
  'clear-queue': Action<void>,
  'add-to-queue': Action<{ tracks: string[] }>,
  'set-next-in-queue': Action<{ tracks: string[] }>,
  'queue': Query<PlayQueue>,
  'play-track-list': Action<{ tracks: string[], index?: number, shuffle?: boolean }>,
  'load-player-state': Action<PlayerState>,
  'unload-player-state': Query<PlayerState>,
  'remove-from-queue': Action<{ index: number }>,
  'shuffle-queue': Action<void>,
  'replay-gain-mode': Action<{ mode: string }>,
  'set-repeat': Action<{ repeat: boolean }>,
  'set-shuffle': Action<{ shuffle: boolean }>,
  'set-volume': Action<{ volume: number }>,
  'set-playback-rate': Action< { rate: number }>,
};

type CommandName = keyof CommandMap;
type CommandParam<C extends CommandName> = CommandMap[C]['param'];
type CommandResult<C extends CommandName> = CommandMap[C]['result'];

type ErrorResponse = {
  seq: number,
  kind: 'error',
  data: { message: string },
}

type SuccessResponse<C extends CommandName> = {
  seq: number,
  kind: C,
  data: CommandResult<C>
}

type Response = ErrorResponse | SuccessResponse<CommandName>

// interface ServerMsg {
//   playback?: PlaybackEvent,
//   queue?: PlayQueue,
// }

type CommandMsg<C extends CommandName> = {
  command: {
    seq: number,
    name: C,
    param: CommandParam<C>,
  }
}

type ClientMsg = CommandMsg<CommandName>

type ServerMsg =
  | { playback: PlaybackEvent }
  | { queue: PlayQueue }
  | { response: Response }
  ;

function websocketUrl(baseUrl: string, auth: AuthService) {
  const url = new URL(baseUrl)
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/'
  }

  return new URL(url + 'ws?' + auth.urlParams)
}

export class Sonicast {
  private api: API
  private commandSeq = 0
  private awaitingSend: string[] = []
  private awaitingResponse: Map<number, (_: Response) => void> = new Map()
  private websocketUrl: URL
  private websocket: WebSocket | null = null
  private disposing = false

  public onplayback: PlaybackCallback | null = null
  public onplayqueue: PlayQueueCallback | null = null

  constructor(api: API, baseUrl: string, auth: AuthService) {
    this.api = api
    this.websocketUrl = websocketUrl(baseUrl, auth)

    this.connectWebsocket()
  }

  dispose() {
    this.disposing = true

    if (this.websocket) {
      this.websocket.close()
    }
  }

  private receiveServerMessage(msg: ServerMsg) {
    if ('playback' in msg) {
      if (this.onplayback) {
        this.onplayback(msg.playback)
      }
      return
    }

    if ('queue' in msg) {
      this.normalizePlayQueueInPlace(msg.queue)
      if (this.onplayqueue) {
        this.onplayqueue(msg.queue)
      }
    }

    if ('response' in msg) {
      const response = msg.response
      const callback = this.awaitingResponse.get(response.seq)
      if (callback) {
        this.awaitingResponse.delete(response.seq)
        callback(response)
      }
    }
  }

  private connectWebsocket() {
    if (this.disposing) {
      return
    }

    this.websocket = new WebSocket(this.websocketUrl)
    this.websocket.onopen = () => this.websocketDidOpen()
    this.websocket.onclose = () => this.websocketDidClose()
    this.websocket.onmessage = (ev) => this.websocketDidReceiveMessage(ev)
  }

  private websocketDidOpen() {
    const messages = this.awaitingSend
    this.awaitingSend = []

    for (const message of messages) {
      this.websocket!.send(message)
    }
  }

  private websocketDidReceiveMessage(ev: MessageEvent) {
    const msg = JSON.parse(ev.data) as ServerMsg

    if (!('playback' in msg)) {
      // don't trace playback messages, they're too spammy
      console.log('WebSocket RX:', ev.data)
    }

    this.receiveServerMessage(msg)
  }

  private websocketDidClose() {
    this.websocket = null

    // reconnect websocket after a small delay if it ever closes:
    setTimeout(() => this.connectWebsocket(), 500)
  }

  private async send(msg: ClientMsg) {
    const json = JSON.stringify(msg)
    console.log('WebSocket TX:', json)
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(json)
    } else {
      this.awaitingSend.push(json)
    }
  }

  private async command<Cmd extends CommandName>(
    name: Cmd,
    param: CommandParam<Cmd>
  ): Promise<CommandResult<Cmd>> {
    // take next seq for command
    const seq = ++this.commandSeq

    return new Promise((resolve, reject) => {
      this.awaitingResponse.set(seq, (msg: Response) => {
        if (msg.kind === 'error') {
          reject(new Error(`command ${name} failed: ${msg.data.message}`))
        } else if (msg.kind === name) {
          resolve(msg.data)
        } else {
          reject(new Error(`received invalid response for command ${name}: ${JSON.stringify(msg)}`))
        }
      })

      this.send({ command: { seq, name, param } })
    })
  }

  private normaliseTracks(tracks: Track[]): Track[] {
    return tracks.map(t => this.api.normalizeTrack(t))
  }

  private normalizePlayQueueInPlace(playQueue: PlayQueue) {
    playQueue.tracks = this.normaliseTracks(playQueue.tracks)
  }

  async getPlayQueue(): Promise<PlayQueue> {
    const queue = await this.command('queue', undefined)
    this.normalizePlayQueueInPlace(queue)
    return queue
  }

  async playTrackList(tracks: Track[], opts: { index?: number, shuffle?: boolean }): Promise<void> {
    await this.command('play-track-list', {
      tracks: tracks.map((t) => t.id),
      index: opts.index,
      shuffle: opts.shuffle,
    })
  }

  async loadPlayerState(state: PlayerState): Promise<void> {
    await this.command('load-player-state', state)
  }

  async unloadPlayerState(): Promise<PlayerState> {
    const state = await this.command('unload-player-state', undefined)
    state.tracks = this.normaliseTracks(state.tracks)
    return state
  }

  async playIndex(index: number): Promise<void> {
    await this.command('play-index', { index })
  }

  async play(): Promise<void> {
    await this.command('play', undefined)
  }

  async pause(): Promise<void> {
    await this.command('pause', undefined)
  }

  async next(): Promise<void> {
    await this.command('skip-next', undefined)
  }

  async previous(): Promise<void> {
    await this.command('skip-previous', undefined)
  }

  async seek(pos: number): Promise<void> {
    await this.command('seek', { pos })
  }

  async resetQueue(): Promise<void> {
    await this.command('reset-queue', undefined)
  }

  async clearQueue(): Promise<void> {
    await this.command('clear-queue', undefined)
  }

  async addToQueue(tracks: Track[]): Promise<void> {
    await this.command('add-to-queue', {
      tracks: tracks.map((t) => t.id)
    })
  }

  async setNextInQueue(tracks: Track[]): Promise<void> {
    await this.command('set-next-in-queue', {
      tracks: tracks.map((t) => t.id)
    })
  }

  async removeFromQueue(index: number): Promise<void> {
    await this.command('remove-from-queue', { index })
  }

  async shuffleQueue(): Promise<void> {
    await this.command('shuffle-queue', undefined)
  }

  async replayGainMode(mode: ReplayGainMode): Promise<void> {
    let modeString
    if (mode === ReplayGainMode.None) {
      modeString = 'none'
    } else if (mode === ReplayGainMode.Track) {
      modeString = 'track'
    } else if (mode === ReplayGainMode.Album) {
      modeString = 'album'
    } else {
      return
    }

    await this.command('replay-gain-mode', { mode: modeString })
  }

  async setRepeat(repeat: boolean): Promise<void> {
    await this.command('set-repeat', { repeat })
  }

  async setShuffle(shuffle: boolean): Promise<void> {
    await this.command('set-shuffle', { shuffle })
  }

  async setVolume(volume: number): Promise<void> {
    await this.command('set-volume', { volume })
  }

  async setPlaybackRate(rate: number): Promise<void> {
    await this.command('set-playback-rate', { rate })
  }
}
