<template>
  <div ref="pageRef" class="p-4 lg:p-6 h-full flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden">
    <!-- 桌面版左右兩欄各自捲動；手機版整頁上下捲動，播放器在上、清單在下。
         註解要放在根元素裡面：外層的 <transition> 只接受單一根元素 -->
    <!-- 左側：依年份、季度瀏覽動畫主題曲 -->
    <div class="order-2 lg:order-1 shrink-0 lg:shrink lg:flex-1 min-w-0 lg:min-h-0 flex flex-col gap-5">
    <!-- Header -->
    <div class="flex flex-col gap-4 shrink-0">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-white">Anime OP / ED</h2>
          <p class="text-xs text-gray-400 mt-1">點歌曲名稱會在這一頁搜尋 YouTube 並播放 · 資料來源 AnimeThemes</p>
        </div>
        <span v-if="!loading" class="text-xs text-gray-400 font-mono">
          {{ filteredAnime.length }} anime · {{ themeCount }} songs
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model.number="year"
          class="h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-gray-200 outline-none focus:border-indigo-500/50"
          aria-label="Year"
        >
          <option v-for="item in years" :key="item" :value="item" class="bg-[#111827]">{{ item }}</option>
        </select>

        <div class="flex rounded-xl border border-white/10 overflow-hidden">
          <button
            v-for="item in SEASONS"
            :key="item.value"
            @click="season = item.value"
            :class="[
              'px-4 h-10 text-sm font-semibold transition-all flex items-center gap-1.5',
              season === item.value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            ]"
          >
            <span>{{ item.label }}</span>
            <span class="text-[10px] opacity-70 hidden sm:inline">{{ item.months }}</span>
          </button>
        </div>

        <div class="relative flex-1 min-w-[180px] max-w-md">
          <input
            v-model="keyword"
            type="text"
            placeholder="Filter by anime, song or artist..."
            class="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 pl-10 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
          >
          <span class="absolute left-3.5 inset-y-0 flex items-center text-gray-400 pointer-events-none"><el-icon><Search /></el-icon></span>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="loading" class="flex-1 py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
      <el-icon class="is-loading text-4xl text-indigo-400"><Loading /></el-icon>
      <p class="text-sm">Loading {{ year }} {{ seasonLabel }}...</p>
    </div>
    <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <p class="text-sm">{{ errorMessage }}</p>
      <button @click="loadSeason" class="text-indigo-400 text-sm hover:underline">Retry</button>
    </div>
    <div v-else-if="filteredAnime.length === 0" class="flex-1 flex items-center justify-center text-gray-500 text-sm">
      No anime found for {{ year }} {{ seasonLabel }}
    </div>
    <el-scrollbar v-else class="lg:flex-1 -mx-2 px-2">
      <div class="grid grid-cols-1 2xl:grid-cols-2 gap-4 pb-12">
        <div
          v-for="anime in filteredAnime"
          :key="anime.id"
          class="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
        >
          <img
            v-if="anime.cover"
            :src="anime.cover"
            :alt="`Cover: ${anime.title}`"
            loading="lazy"
            decoding="async"
            class="w-20 h-28 object-cover rounded-xl shadow-lg shrink-0 bg-white/5"
          >
          <div v-else class="w-20 h-28 rounded-xl bg-white/5 shrink-0"></div>

          <div class="flex flex-col min-w-0 flex-1 gap-2">
            <div>
              <a
                :href="anime.siteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm font-bold text-gray-100 hover:text-indigo-300 leading-snug line-clamp-2"
              >
                {{ anime.title }}
              </a>
              <p class="text-[11px] text-gray-500 truncate">{{ anime.subtitle }}</p>
            </div>

            <div class="flex flex-col gap-1">
              <button
                v-for="theme in anime.themes"
                :key="theme.id"
                @click="searchOnYoutube(theme)"
                :class="[
                  'group flex items-baseline gap-2 text-left px-2 py-1.5 rounded-lg transition-all',
                  activeThemeId === theme.id ? 'bg-indigo-500/15' : 'hover:bg-indigo-500/10'
                ]"
                :title="`Search YouTube: ${theme.query}`"
              >
                <span
                  :class="[
                    'shrink-0 w-9 text-center text-[10px] font-bold rounded px-1 py-0.5',
                    theme.type === 'OP' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-cyan-500/20 text-cyan-300'
                  ]"
                >
                  {{ theme.label }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="text-xs font-semibold text-gray-200 group-hover:text-indigo-300">{{ theme.title }}</span>
                  <span v-if="theme.artists" class="text-[11px] text-gray-500"> — {{ theme.artists }}</span>
                </span>
                <el-icon class="shrink-0 self-center text-gray-600 group-hover:text-indigo-400"><Search /></el-icon>
              </button>
              <p v-if="anime.themes.length === 0" class="text-[11px] text-gray-600 px-2">No themes listed yet</p>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    </div>

    <!-- 右側（手機版在上方）：YouTube 播放器與搜尋 -->
    <aside class="order-1 lg:order-2 shrink-0 lg:w-[380px] xl:w-[440px] lg:h-full min-h-0 flex flex-col gap-3">
      <button
        @click="isPanelOpen = !isPanelOpen"
        class="lg:hidden flex items-center justify-between px-4 h-10 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-200"
      >
        <span class="truncate">{{ playingTitle || 'YouTube player & search' }}</span>
        <el-icon :class="['transition-transform shrink-0', isPanelOpen ? 'rotate-180' : '']"><ArrowDown /></el-icon>
      </button>

      <div v-show="isPanelOpen" class="flex flex-col gap-3 min-h-0 lg:flex-1">
        <div class="w-full aspect-video max-h-[30vh] lg:max-h-none rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black shrink-0">
          <youtubePlayer
            v-if="playingVideoId"
            :width="'100%'"
            :height="'100%'"
            :vid="playingVideoId"
            :title="playingTitle"
            :id="PLAYER_ID"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <el-icon class="text-4xl"><VideoPlay /></el-icon>
            <span class="text-sm">點清單裡的歌曲，或在下面搜尋</span>
          </div>
        </div>

        <p v-if="playingTitle" class="hidden lg:block px-1 text-sm font-bold text-gray-100 line-clamp-2 shrink-0">
          {{ playingTitle }}
        </p>

        <div class="h-56 lg:h-auto lg:flex-1 min-h-0">
          <youtubeSearch
            ref="searchRef"
            max-height=""
            :playing-video-id="playingVideoId"
            @loadVideo="playVideo"
          />
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
// 寫在模組層級：切到別頁再回來時保留已載入的季度和上次選的年份、季度，不用重抓
const cache = new Map()
const lastSelection = { year: null, season: null }
let cachedYears = null
</script>

<script setup>
// 依年份、季度瀏覽動畫 OP/ED；點歌曲會在右側搜尋 YouTube，可以直接播放或加入播放清單
import { ref, computed, watch, onMounted } from 'vue'
import { Search, Loading, ArrowDown, VideoPlay } from '@element-plus/icons-vue'
import { fetchAnimeYears, fetchSeasonAnime } from '../api/animeThemes'
import youtubePlayer from '../components/youtubePlayer.vue'
import youtubeSearch from '../components/youtubeSearch.vue'

// youtubePlayer 用 id 組出播放器元素的 id，取一個不會和播放頁重複的值
const PLAYER_ID = -2

const SEASONS = [
  { value: 'WINTER', label: 'Winter', months: '1–3月' },
  { value: 'SPRING', label: 'Spring', months: '4–6月' },
  { value: 'SUMMER', label: 'Summer', months: '7–9月' },
  { value: 'FALL', label: 'Fall', months: '10–12月' }
]

const now = new Date()
const currentYear = now.getFullYear()

// 預設顯示現在的年份與季度；這次開網頁期間看過別的季度，回來時維持上次的選擇
const year = ref(lastSelection.year ?? currentYear)
const season = ref(lastSelection.season ?? SEASONS[Math.floor(now.getMonth() / 3)].value)
const years = ref(Array.from({ length: currentYear - 1962 }, (_, index) => currentYear - index))
const keyword = ref('')
const animeList = ref([])
const loading = ref(false)
const errorMessage = ref('')

const pageRef = ref(null)
const searchRef = ref(null)
const playingVideoId = ref('')
const playingTitle = ref('')
const activeThemeId = ref(null)
// 手機版可以把播放器與搜尋收起來，讓出空間看清單
const isPanelOpen = ref(true)

const seasonLabel = computed(() => SEASONS.find((item) => item.value === season.value)?.label ?? '')

const toTheme = (theme) => {
  const title = theme.song?.title?.native || theme.song?.title?.romaji || ''
  const performances = theme.song?.performances ?? []
  const artists = performances.map((item) => item.artist?.name?.native || item.artist?.name?.main).filter(Boolean)
  return {
    id: theme.id,
    type: theme.type,
    label: theme.slug,
    title: title || '(untitled)',
    romaji: theme.song?.title?.romaji ?? '',
    artists: artists.join(', '),
    // YouTube 搜尋用：歌名加歌手，沒有歌名時不提供
    query: title ? [title, artists[0]].filter(Boolean).join(' ') : ''
  }
}

const toAnime = (anime) => {
  const covers = anime.images?.edges?.map((edge) => edge.node) ?? []
  const cover = covers.find((image) => image.facet === 'SMALL_COVER') ?? covers[0]
  const title = anime.title?.native || anime.title?.romaji || ''
  return {
    id: anime.id,
    title,
    subtitle: [anime.title?.romaji, anime.format].filter((text) => text && text !== title).join(' · '),
    english: anime.title?.english ?? '',
    siteUrl: anime.siteUrl,
    cover: cover?.link ?? '',
    themes: (anime.animethemes ?? []).map(toTheme)
  }
}

const loadSeason = async () => {
  const key = `${year.value}-${season.value}`
  lastSelection.year = year.value
  lastSelection.season = season.value
  errorMessage.value = ''
  if (cache.has(key)) {
    animeList.value = cache.get(key)
    return
  }
  loading.value = true
  try {
    const data = (await fetchSeasonAnime(year.value, season.value)).map(toAnime)
    cache.set(key, data)
    // 等待期間使用者可能已經切到別的季度
    if (key === `${year.value}-${season.value}`) animeList.value = data
  } catch (error) {
    console.error('Fetch anime themes failed', error)
    if (key === `${year.value}-${season.value}`) {
      animeList.value = []
      errorMessage.value = '載入失敗，請稍後再試'
    }
  } finally {
    if (key === `${year.value}-${season.value}`) loading.value = false
  }
}

const filteredAnime = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return animeList.value
  const match = (value) => value?.toLowerCase().includes(text)
  return animeList.value.filter((anime) =>
    match(anime.title) || match(anime.subtitle) || match(anime.english) ||
    anime.themes.some((theme) => match(theme.title) || match(theme.romaji) || match(theme.artists))
  )
})

const themeCount = computed(() => filteredAnime.value.reduce((sum, anime) => sum + anime.themes.length, 0))

const searchOnYoutube = (theme) => {
  if (!theme.query) return
  activeThemeId.value = theme.id
  isPanelOpen.value = true
  searchRef.value?.searchFor(theme.query)
  // 手機版播放器與搜尋結果在頁面最上方，捲回去才看得到
  pageRef.value?.scrollTo({ top: 0 })
}

const playVideo = (item) => {
  playingVideoId.value = item.snippet.resourceId.videoId
  playingTitle.value = item.snippet.title
}

watch([year, season], loadSeason)

onMounted(async () => {
  loadSeason()
  try {
    if (!cachedYears) cachedYears = await fetchAnimeYears()
    const list = cachedYears
    if (list.length > 0) years.value = list.includes(year.value) ? list : [year.value, ...list]
  } catch (error) {
    // 取不到年份清單時沿用預設的範圍
    console.log('fetch anime years failed', error)
  }
})
</script>
