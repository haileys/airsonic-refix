import { API, PlayQueue, Track } from '@/shared/api'
import { ReplayGainMode } from './audio'

const GET = 'GET'
const POST = 'POST'

export interface PlaybackEvent {
  playing: boolean,
  position?: number,
  duration?: number,
}

export type PlaybackCallback = (ev: PlaybackEvent) => void;
export type PlayQueueCallback = (queue: PlayQueue) => void;

type Action<Param> = { param: Param, result: void };

type CommandMap = {
  'play': Action<void>,
  'pause': Action<void>,
  'skip-next': Action<void>,
  'skip-previous': Action<void>,
  'seek': Action<{ pos: number }>,
  'play-index': Action<{ index: number }>,
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

export class Sonicast {
  private api: API
  private baseUrl: URL
  private commandSeq = 0
  private awaitingResponse: Map<number, (_: Response) => void> = new Map()
  private websocket: WebSocket

  public onplayback: PlaybackCallback | null = null
  public onplayqueue: PlayQueueCallback | null = null

  constructor(api: API, baseUrl: string) {
    this.api = api

    this.baseUrl = new URL(baseUrl)
    if (!this.baseUrl.pathname.endsWith('/')) {
      this.baseUrl.pathname += '/'
    }

    this.websocket = new WebSocket(this.baseUrl + 'ws')
    this.websocket.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ServerMsg
      this.receiveServerMessage(msg)
    }
  }

  private receiveServerMessage(msg: ServerMsg) {
    console.log('WebSocket RX:', msg)

    if ('playback' in msg) {
      if (this.onplayback) {
        this.onplayback(msg.playback)
      }
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

  private async send(msg: ClientMsg) {
    console.log('WebSocket TX:', msg)
    this.websocket.send(JSON.stringify(msg))
  }

  private async fetch(method: string, path: string, body?: object): Promise<object> {
    const opts: RequestInit & { headers: any } = {
      method,
      headers: {
        'content-type': 'application/json',
      },
    }

    if (body) {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      opts.body = JSON.stringify(body)
    }

    const url = this.baseUrl + path
    const response = await window.fetch(url, opts)

    if (!response.ok) {
      throw new Error(`${method} ${path} failed: ${response.status}`)
    }

    if (response.headers.get('content-type') === 'application/json') {
      return await response.json()
    }

    return {}
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

  private normalizePlayQueueInPlace(playQueue: PlayQueue) {
    playQueue.tracks = playQueue.tracks.map(t => this.api.normalizeTrack(t))
  }

  async getPlayQueue(): Promise<PlayQueue> {
    const queue = await this.fetch(GET, 'queue') as PlayQueue
    this.normalizePlayQueueInPlace(queue)
    return queue
  }

  async playTrackList(tracks: Track[], opts: { index?: number, shuffle?: boolean }): Promise<void> {
    await this.fetch(POST, 'play-track-list', {
      tracks: tracks.map((t) => t.id),
      index: opts.index,
      shuffle: opts.shuffle,
    })
  }

  async playIndex(index: number): Promise<void> {
    await this.fetch(POST, 'play-index', { index })
  }

  async play(): Promise<void> {
    await this.command('play', undefined)
    // await this.fetch(POST, 'play')
  }

  async pause(): Promise<void> {
    await this.command('pause', undefined)
    // await this.fetch(POST, 'pause')
  }

  async next(): Promise<void> {
    await this.command('skip-next', undefined)
    // await this.fetch(POST, 'next')
  }

  async previous(): Promise<void> {
    await this.command('skip-previous', undefined)
    // await this.fetch(POST, 'previous')
  }

  async seek(pos: number): Promise<void> {
    await this.command('seek', { pos })
    // await this.fetch(POST, 'seek', { pos })
  }

  async resetQueue(): Promise<void> {
    await this.fetch(POST, 'reset-queue')
  }

  async clearQueue(): Promise<void> {
    await this.fetch(POST, 'clear-queue')
  }

  async addToQueue(tracks: Track[]): Promise<void> {
    await this.fetch(POST, 'add-to-queue', {
      tracks: tracks.map((t) => t.id)
    })
  }

  async setNextInQueue(tracks: Track[]): Promise<void> {
    await this.fetch(POST, 'set-next-in-queue', {
      tracks: tracks.map((t) => t.id)
    })
  }

  async removeFromQueue(index: number): Promise<void> {
    await this.fetch(POST, 'remove-from-queue', { index })
  }

  async shuffleQueue(): Promise<void> {
    await this.fetch(POST, 'shuffle-queue')
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

    await this.fetch(POST, 'replay-gain-mode', { mode: modeString })
  }

  async setRepeat(repeat: boolean): Promise<void> {
    await this.fetch(POST, 'set-repeat', { repeat })
  }

  async setShuffle(shuffle: boolean): Promise<void> {
    await this.fetch(POST, 'set-shuffle', { shuffle })
  }

  async setVolume(volume: number): Promise<void> {
    await this.fetch(POST, 'set-volume', { volume })
  }

  async setPlaybackRate(rate: number): Promise<void> {
    await this.fetch(POST, 'set-playback-rate', { rate })
  }
}
