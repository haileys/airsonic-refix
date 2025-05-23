<template>
  <div v-if="album">
    <Hero :image="album.image">
      <h1>
        {{ album.name }}
        <b-button variant="link" class="p-0" @click="toggleFavourite">
          <Icon :icon="isFavourite ? 'heart-fill' : 'heart'" />
        </b-button>
      </h1>
      <div class="d-flex flex-wrap align-items-center">
        <div>
          by
          <span v-for="(artist, index) in album.artists" :key="artist.id">
            <span v-if="index > 0">, </span>
            <router-link :to="{name: 'artist', params: { id: artist.id }}">
              {{ artist.name }}
            </router-link>
          </span>
        </div>
        <span v-if="album.year" class="mx-1"> • {{ album.year }}</span>
        <span class="me-3" />
        <div class="d-flex flex-nowrap">
          <ExternalLink v-if="album.lastFmUrl" :href="album.lastFmUrl" class="btn btn-link p-0 me-2" title="Last.fm">
            <IconLastFm />
          </ExternalLink>
          <ExternalLink v-if="album.musicBrainzUrl" :href="album.musicBrainzUrl" class="btn btn-link me-2 p-0" title="MusicBrainz">
            <IconMusicBrainz />
          </ExternalLink>
        </div>
      </div>

      <div v-if="album.genres.length">
        <span v-for="({ name: genre }, index) in album.genres" :key="genre">
          <span v-if="index > 0">•</span>
          <router-link :to="{name: 'genre', params: { id: genre }}">
            {{ genre }}
          </router-link>
        </span>
      </div>

      <OverflowFade v-if="album.description" class="mt-3">
        {{ album.description }}
      </OverflowFade>

      <div class="text-nowrap mt-3">
        <b-button variant="secondary" class="me-2" @click="playNow">
          <Icon icon="play" /> Play
        </b-button>
        <b-button variant="secondary" class="me-2" @click="shuffleNow">
          <Icon icon="shuffle" /> Shuffle
        </b-button>
        <OverflowMenu class="px-1">
          <ContextMenuItem icon="plus" @click="setNextInQueue">
            Play next
          </ContextMenuItem>
          <ContextMenuItem icon="plus" @click="addToQueue">
            Add to queue
          </ContextMenuItem>
          <ContextMenuItem @click="copyLink">
            Copy link
          </ContextMenuItem>
        </OverflowMenu>
      </div>
    </Hero>
    <div class="row">
      <div class="col">
        <TrackList :tracks="album.tracks" no-album />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import TrackList from '@/library/track/TrackList.vue'
  import { Album } from '@/shared/api'
  import { useFavouriteStore } from '@/library/favourite/store'
  import IconLastFm from '@/shared/components/IconLastFm.vue'
  import IconMusicBrainz from '@/shared/components/IconMusicBrainz.vue'
  import OverflowFade from '@/shared/components/OverflowFade.vue'
  import { usePlayerStore } from '@/player/store'
  import { useClipboard } from '@vueuse/core'

  export default defineComponent({
    components: {
      OverflowFade,
      IconMusicBrainz,
      IconLastFm,
      TrackList,
    },
    props: {
      id: { type: String, required: true },
      track: { type: String, default: '' },
    },
    setup() {
      return {
        favouriteStore: useFavouriteStore(),
        playerStore: usePlayerStore(),
        clipboard: useClipboard(),
      }
    },
    data() {
      return {
        album: null as null | Album,
      }
    },
    computed: {
      isFavourite(): boolean {
        return !!this.favouriteStore.albums[this.id]
      },
    },
    async created() {
      this.album = await this.$api.getAlbumDetails(this.id)

      const queueIsEmpty = (this.playerStore?.queue?.length ?? 0) === 0
      if (queueIsEmpty) {
        this.selectTrack()
      }
    },
    methods: {
      playNow() {
        return this.playerStore.playNow(this.album!.tracks!)
      },
      shuffleNow() {
        return this.playerStore.shuffleNow(this.album!.tracks!)
      },
      setNextInQueue() {
        if (this.album) {
          return this.playerStore.setNextInQueue(this.album.tracks!)
        }
      },
      addToQueue() {
        if (this.album) {
          return this.playerStore.addToQueue(this.album.tracks!)
        }
      },
      toggleFavourite() {
        return this.favouriteStore.toggle('album', this.id)
      },
      copyLink() {
        const route = this.$router.resolve({ name: 'album', params: { id: this.id } })
        const url = new URL(route.href, location.origin).href
        this.clipboard.copy(url)
      },
      selectTrack() {
        const tracks = this.album?.tracks ?? []
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i]
          if (track.id === this.track) {
            this.playerStore.loadPlayerState({
              tracks,
              index: i,
              time: 0,
              shuffle: false,
              repeat: false,
              playing: false,
            })
            break
          }
        }
      }
    }
  })
</script>
