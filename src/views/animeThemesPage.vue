<template>
  <div class="p-6 h-full flex flex-col gap-5">
    <!-- Header -->
    <div class="flex flex-col gap-4 shrink-0">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-white">Anime OP / ED</h2>
          <p class="text-xs text-gray-400 mt-1">點歌曲名稱會到播放頁的 YouTube 搜尋 · 資料來源 AnimeThemes</p>
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
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
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
    <el-scrollbar v-else class="flex-1 -mx-2 px-2">
      <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 pb-12">
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
                class="group flex items-baseline gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all"
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
</template>

<script setup>
// 依年份、季度瀏覽動畫 OP/ED；點歌曲會帶著關鍵字跳到播放頁的 YouTube 搜尋分頁
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Loading } from '@element-plus/icons-vue'
import { fetchAnimeYears, fetchSeasonAnime } from '../api/animeThemes'

const SEASONS = [
  { value: 'WINTER', label: 'Winter', months: '1–3月' },
  { value: 'SPRING', label: 'Spring', months: '4–6月' },
  { value: 'SUMMER', label: 'Summer', months: '7–9月' },
  { value: 'FALL', label: 'Fall', months: '10–12月' }
]

const router = useRouter()
const now = new Date()
const currentYear = now.getFullYear()

// 預設顯示現在的年份與季度
const year = ref(currentYear)
const season = ref(SEASONS[Math.floor(now.getMonth() / 3)].value)
const years = ref(Array.from({ length: currentYear - 1962 }, (_, index) => currentYear - index))
const keyword = ref('')
const animeList = ref([])
const loading = ref(false)
const errorMessage = ref('')
// 已經抓過的季度，切回來時不用重抓
const cache = new Map()

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
  router.push({ path: '/player', query: { q: theme.query } })
}

watch([year, season], loadSeason)

onMounted(async () => {
  loadSeason()
  try {
    const list = await fetchAnimeYears()
    if (list.length > 0) years.value = list.includes(year.value) ? list : [year.value, ...list]
  } catch (error) {
    // 取不到年份清單時沿用預設的範圍
    console.log('fetch anime years failed', error)
  }
})
</script>
