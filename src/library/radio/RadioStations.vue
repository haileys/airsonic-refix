<template>
  <ContentLoader v-slot :loading="items === null">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h1 class="mb-0 me-2 text-truncate">
        Radio
      </h1>
      <div class="d-flex">
        <b-button v-if="!showTiles" variant="link" @click="showTiles = true">
          Show tiles
        </b-button>
        <b-button v-else variant="link" @click="showTiles = false">
          Show list
        </b-button>
        <b-button variant="link" :disabled="unsupported" @click="openAddModal">
          <Icon icon="plus" />
        </b-button>
      </div>
    </div>

    <template v-if="items.length > 0">
      <template v-if="showTiles">
        <Tiles square>
          <Tile
            v-for="item in items" :key="item.id"
            :image="item.image"
            :to="null"
            :title="item.title"
            @click="play(item)"
          >
            <template #title>
              <span class="title">{{ item.title }}</span>
            </template>
          </Tile>
        </Tiles>
      </template>
      <template v-else>
        <TrackList :tracks="items" no-artist no-album no-duration no-queue-track-list>
          <template #context-menu="{ item }">
            <ContextMenuItem icon="edit" @click="openEditModal(item)">
              Edit
            </ContextMenuItem>
            <b-dropdown-divider />
            <ContextMenuItem icon="x" variant="danger" @click="deleteRadioStation(item)">
              Delete
            </ContextMenuItem>
          </template>
        </TrackList>
      </template>
    </template>
    <EmptyIndicator v-else-if="unsupported" label="Not supported" />
    <EmptyIndicator v-else />

    <EditModal :visible.sync="modalVisible" :item="editItem" @confirm="saveRadioStation">
      <template #title="{ item }">
        {{ item?.id ? "Edit" : "Add" }} Radio Station
      </template>
      <template #default="{ item }">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input v-model="item.title" class="form-control" type="text">
        </div>
        <div class="mb-3">
          <label class="form-label">Stream URL</label>
          <input v-model="item.url" class="form-control" type="text">
        </div>
        <div class="mb-3">
          <label class="form-label">Home Page URL</label>
          <input v-model="item.description" class="form-control" type="text">
        </div>
      </template>
    </EditModal>
  </ContentLoader>
</template>
<script lang="ts">
  import { defineComponent } from 'vue'
  import { RadioStation, UnsupportedOperationError, Track } from '@/shared/api'
  import { usePlayerStore } from '@/player/store'
  import ContentLoader from '@/shared/components/ContentLoader.vue'
  import EditModal from '@/shared/components/EditModal.vue'
  import TrackList from '@/library/track/TrackList.vue'

  export default defineComponent({
    components: {
      TrackList,
      ContentLoader,
      EditModal,
    },
    data() {
      return {
        items: null as null | RadioStation[],
        unsupported: false,
        modalVisible: false,
        showTiles: true,
        editItem: {},
        playerStore: usePlayerStore(),
      }
    },
    async created() {
      try {
        this.items = await this.$api.getRadioStations()
      } catch (err) {
        if (err instanceof UnsupportedOperationError) {
          this.items = []
          this.unsupported = true
          return
        }
        throw err
      }
    },
    methods: {
      play(station: RadioStation) {
        const track = station as (RadioStation & Track) as Track
        return this.playerStore.playNow([track])
      },
      openAddModal() {
        this.editItem = {}
        this.modalVisible = true
      },
      openEditModal(item: RadioStation) {
        this.editItem = item
        this.modalVisible = true
      },
      deleteRadioStation(item: RadioStation) {
        this.$api.deleteRadioStation(item.id)
        this.items = this.items!.filter(x => x.id !== item.id)
      },
      async saveRadioStation(item: RadioStation) {
        this.editItem = {}
        if (item.id) {
          this.items = await this.$api.updateRadioStation(item)
        } else {
          this.items = await this.$api.addRadioStation(item.title, item.url, item.description)
        }
      },
    },
  })
</script>
<style>
.tiles {
  cursor:pointer;
}
.title:hover {
  text-decoration:underline;
}
</style>
