<template>
  <!-- side menu -->
  <el-container class="layout-container-modern h-screen">
    <el-aside v-if="!notDisplaySideMenu" width="240px" class="glass-panel z-50 transition-all duration-300">
      <div class="p-4 h-full flex flex-col">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            YT Player
          </h2>
          <button
            @click="toggleMenu"
            class="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <el-icon class="text-gray-400"><Fold /></el-icon>
          </button>
        </div>

        <el-scrollbar class="flex-1 -mx-2 px-2">
          <el-menu router class="side-menu-modern" :default-active="$route.path">
            <el-menu-item index="/player" class="menu-item-modern">
              <el-icon><House /></el-icon>
              <span>Home</span>
            </el-menu-item>
            <el-menu-item index="/downLoad" class="menu-item-modern">
              <el-icon><Download /></el-icon>
              <span>Download</span>
            </el-menu-item>

            <div class="menu-divider"></div>

            <el-sub-menu index="saved" popper-class="modern-submenu-pop">
              <template #title>
                <div class="flex items-center gap-2">
                  <el-icon><List /></el-icon>
                  <span>Saved Playlists</span>
                </div>
                <el-icon v-if="isfetch" class="is-loading ml-auto"><Loading /></el-icon>
              </template>
              <el-menu-item
                v-for="(item, index) in playlistStore.listnames"
                :key="index"
                class="menu-item-modern group"
                @click="handlefetchPlaylist(item)"
              >
                <span class="truncate">{{ item }}</span>
                <button
                  @click.stop="handleDeleteList(item)"
                  class="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <el-icon size="14"><Close /></el-icon>
                </button>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="my-yt" popper-class="modern-submenu-pop">
              <template #title>
                <div class="flex items-center gap-2">
                  <el-icon><VideoPlay /></el-icon>
                  <span>My YouTube</span>
                </div>
                <el-icon v-if="isFetchingMyPlaylist" class="is-loading ml-auto"><Loading /></el-icon>
              </template>
              <el-menu-item v-if="!userStore.oauthToken" @click="handleGoogleYoutubeLogin" class="menu-item-modern">
                <el-icon><Connection /></el-icon>
                <span>Connect Account</span>
              </el-menu-item>
              <template v-else>
                <el-menu-item @click="fetchMyYoutubePlaylists" class="menu-item-modern">
                  <el-icon><Refresh /></el-icon>
                  <span>Refresh</span>
                </el-menu-item>
                <el-menu-item
                  v-for="(item, index) in useYoutubeData.myPlaylistData"
                  :key="`${item.value}-${index}`"
                  @click="handleSelectMyPlaylist(item.value)"
                  class="menu-item-modern"
                >
                  <span class="truncate">{{ item.name }}</span>
                </el-menu-item>
              </template>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </div>
    </el-aside>

    <el-container class="relative">
      <el-header height="70px" class="glass-panel flex items-center justify-between px-6 z-40 border-b-white/5">
        <div class="flex items-center gap-4 flex-1">
          <button
            v-if="notDisplaySideMenu"
            @click="toggleMenu"
            class="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <el-icon class="text-gray-400"><Expand /></el-icon>
          </button>

          <div class="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
            <el-dropdown @command="handleCommand" trigger="click">
              <button class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all whitespace-nowrap min-w-[140px]">
                <el-icon><List /></el-icon>
                <span>Quick History</span>
                <el-icon class="ml-auto"><CaretBottom /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu class="modern-dropdown-menu">
                  <el-dropdown-item v-for="(item, index) in listNames" :key="index" :command="item.value">
                    {{ item.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <div class="relative flex-1 group">
              <input
                v-model="listId"
                type="text"
                placeholder="Paste Playlist URL or ID..."
                class="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
                @keyup.enter="fetchData"
              >
              <button
                @click="fetchData"
                class="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-medium transition-all flex items-center gap-2"
              >
                <span>Load</span>
                <img v-if="isLoading" class="w-4 h-4" src="../assets/img/hutoa01-unscreen.gif" alt="">
              </button>
            </div>
          </div>

          <button @click="toggleHeaderContainer" class="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
            <el-icon><MoreFilled /></el-icon>
          </button>
        </div>

        <div class="flex items-center gap-4 ml-4">
          <router-link
            v-if="!userStore.accessToken"
            to="/login"
            class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            Sign In
          </router-link>
          <div v-else class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-white leading-none">{{ userStore.userInfo.name }}</p>
              <p class="text-xs text-gray-400 mt-1">Premium Member</p>
            </div>
            <el-dropdown trigger="click" @command="handleUserCommand">
              <div class="relative cursor-pointer group">
                <img :src="userStore.userInfo.avatar" alt="user" class="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-indigo-500/50 transition-all">
                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full"></div>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="modern-dropdown-menu">
                  <el-dropdown-item command="upload">
                    <el-icon><Upload /></el-icon> Upload Current
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" class="!text-red-400">
                    <el-icon><SwitchButton /></el-icon> Logout
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-icon v-if="isUploading" class="is-loading text-indigo-400"><Loading /></el-icon>
          </div>
        </div>

        <!-- Mobile Toolbar Expansion -->
        <div id="headerContainer" class="hidden absolute top-[70px] left-0 right-0 glass-panel p-4 flex flex-col gap-3 md:hidden z-30 animate-in slide-in-from-top duration-200">
          <input
            v-model="listId"
            type="text"
            placeholder="Playlist ID..."
            class="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-sm"
          >
          <button @click="fetchData" class="w-full h-11 bg-indigo-600 rounded-lg font-medium">Load Playlist</button>
        </div>
      </el-header>

      <el-main class="relative bg-[#020617] p-0 overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import {
  House, Download, Expand, Fold, List, CaretBottom,
  Loading, MoreFilled, Close, VideoPlay, Connection,
  Refresh, SwitchButton, Upload
} from '@element-plus/icons-vue'
import { useYoutubeDataStore, useUserStore, usePlaylistStore } from '../stores'
import { googleTokenLogin } from 'vue3-google-login'

const isLoading = ref(false)
const isfetch = ref(false)
const useYoutubeData = useYoutubeDataStore()
const listId = ref('')
const notDisplaySideMenu = ref(false)
const listNames = ref(useYoutubeData.listNameData)
const userStore = useUserStore()
const playlistStore = usePlaylistStore()
const isUploading = ref(false)
const isFetchingMyPlaylist = ref(false)

const fetchData = async () => {
  const pattern = /list=([a-zA-Z0-9_-]+)/
  const match = listId.value.match(pattern)
  if (!listId.value) return
  if (match) listId.value = match[1]

  isLoading.value = true
  await useYoutubeData.getSnippetData(listId.value)
  await useYoutubeData.getListName(listId.value)
  useYoutubeData.latestIndex = 0
  isLoading.value = false
}

const handleCommand = (command) => {
  listId.value = command
}

const handleUserCommand = async (command) => {
  if (command === 'logout') {
    userStore.accessToken = ''
    userStore.oauthToken = ''
    userStore.userInfo = {
      userId: '',
      username: '',
      email: '',
      avatar: '',
      creatAt: undefined,
      __v: undefined
    }
    window.location.reload()
  } else if (command === 'upload') {
    const listname = useYoutubeData.currentListName
    const playlist = useYoutubeData.snippetData
    const chunkSize = Math.ceil(playlist.length / 20)
    isUploading.value = true
    for (let i = 0; i < playlist.length; i += chunkSize) {
      const chunk = playlist.slice(i, i + chunkSize)
      const formData = new FormData()
      formData.append('dataChunk', JSON.stringify(chunk))
      await playlistStore.postPlaylist(listname, formData.getAll('dataChunk'), playlist.length)
    }
    isUploading.value = false
  }
}

const fetchMyYoutubePlaylists = async () => {
  if (!userStore.oauthToken) return
  isFetchingMyPlaylist.value = true
  await useYoutubeData.getMyPlaylistData(userStore.oauthToken)
  isFetchingMyPlaylist.value = false
}

const handleGoogleYoutubeLogin = async () => {
  try {
    const res = await googleTokenLogin({
      clientId: '959560237311-13dbj26mjffjcph7r49pq3c57lbvpgrr.apps.googleusercontent.com',
      scope: 'profile email https://www.googleapis.com/auth/youtube.readonly',
      prompt: 'consent'
    })
    userStore.setOauthToken(res.access_token)
    await userStore.getUserInfo(res.access_token)
    await fetchMyYoutubePlaylists()
  } catch (error) {
    console.log('google oauth for youtube playlists failed', error)
  }
}

const handleSelectMyPlaylist = (selectedListId) => {
  listId.value = selectedListId
}

const handlefetchPlaylist = async (listname) => {
  isfetch.value = true
  await playlistStore.fetchPlaylist(listname)
  isfetch.value = false
}

const toggleMenu = () => {
  notDisplaySideMenu.value = !notDisplaySideMenu.value
}

const toggleHeaderContainer = () => {
  const headerContainer = document.getElementById('headerContainer')
  headerContainer?.classList.toggle('hidden')
}

const handleDeleteList = async (listname) => {
  if (confirm(`確定要刪除 ${listname}?`)) {
    playlistStore.deletePlaylist(listname)
  }
}

onMounted(async () => {
  await userStore.authLogin()
  if (userStore.accessToken) {
    await playlistStore.fetchNames()
  }
  if (userStore.oauthToken) {
    await fetchMyYoutubePlaylists()
  }
})
</script>

<style scoped>
.side-menu-modern {
  background: transparent !important;
  border: none !important;
}

.menu-item-modern {
  @apply h-11 mb-1 rounded-xl flex items-center gap-3 px-4 transition-all duration-200 !bg-transparent text-gray-400 hover:!bg-white/5 hover:text-white border border-transparent;
}

:deep(.el-menu-item.is-active) {
  @apply !bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-medium;
}

:deep(.el-sub-menu__title) {
  @apply h-11 mb-1 rounded-xl flex items-center px-4 transition-all !bg-transparent text-gray-400 hover:!bg-white/5 hover:text-white border border-transparent;
}

.menu-divider {
  @apply h-px bg-white/5 my-4 mx-4;
}

:deep(.modern-submenu-pop.el-popper) {
  @apply !bg-[#111827] !border-white/10 !rounded-xl !shadow-2xl;
}

:deep(.modern-submenu-pop .el-menu) {
  @apply !bg-transparent !p-2;
}

.modern-dropdown-menu {
  @apply !bg-[#111827] !border-white/10 !p-1 !rounded-xl !shadow-2xl;
}

:deep(.el-dropdown-menu__item) {
  @apply !rounded-lg !text-gray-300 hover:!bg-white/5 hover:!text-white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
