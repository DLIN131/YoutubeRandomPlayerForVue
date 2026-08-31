<template>
  <div class="layout-container-modern h-screen w-screen overflow-hidden flex flex-col bg-[#020617] text-white select-none">
    <!-- Full-Screen Mobile Menu Overlay (滿版過渡動畫選單) -->
    <transition name="full-menu">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex flex-col p-5 sm:p-8 overflow-y-auto md:hidden"
      >
        <!-- Mobile Menu Top Header -->
        <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <el-icon class="text-white text-xl"><VideoPlay /></el-icon>
            </div>
            <div>
              <h2 class="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                YT Player
              </h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Random Player</p>
            </div>
          </div>
          <button
            @click="isMobileMenuOpen = false"
            class="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-gray-300 hover:text-white transition-all shadow-lg"
            aria-label="Close menu"
          >
            <el-icon size="20"><Close /></el-icon>
          </button>
        </div>

        <!-- Quick Load Bar in Mobile Menu -->
        <div class="my-5 shrink-0">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Load Playlist</label>
            <span v-if="useYoutubeData.isFetching" class="text-xs text-indigo-400 font-mono animate-pulse">
              Fetching: {{ useYoutubeData.fetchedCount }}{{ useYoutubeData.totalCount ? `/${useYoutubeData.totalCount}` : '' }}
            </span>
          </div>
          <div class="relative group">
            <input
              v-model="listId"
              type="text"
              placeholder="Paste Playlist URL or ID..."
              class="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 pr-24 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none text-white transition-all shadow-inner"
              @keyup.enter="handleMobileFetch"
            >
            <button
              @click="handleMobileFetch"
              :disabled="isLoading || useYoutubeData.isFetching"
              class="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 text-white shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <span v-if="isLoading || useYoutubeData.isFetching" class="font-mono text-xs">
                {{ useYoutubeData.fetchedCount }}{{ useYoutubeData.totalCount ? `/${useYoutubeData.totalCount}` : '' }}
              </span>
              <span v-else>Load</span>
              <el-icon v-if="isLoading || useYoutubeData.isFetching" class="is-loading"><Loading /></el-icon>
            </button>
          </div>
        </div>

        <!-- Main Navigation Cards -->
        <div class="grid grid-cols-2 gap-3 mb-6 shrink-0">
          <router-link
            to="/player"
            @click="isMobileMenuOpen = false"
            :class="[
              'p-4 rounded-2xl border flex flex-col gap-2 transition-all duration-200 active:scale-95',
              $route.path === '/player'
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-xl shadow-indigo-500/10'
                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
            ]"
          >
            <el-icon size="24"><House /></el-icon>
            <div>
              <span class="font-bold text-sm block">Home Player</span>
              <span class="text-[10px] text-gray-400">Play & Shuffle tracks</span>
            </div>
          </router-link>
          <router-link
            to="/downLoad"
            @click="isMobileMenuOpen = false"
            :class="[
              'p-4 rounded-2xl border flex flex-col gap-2 transition-all duration-200 active:scale-95',
              $route.path === '/downLoad'
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-xl shadow-indigo-500/10'
                : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
            ]"
          >
            <el-icon size="24"><Download /></el-icon>
            <div>
              <span class="font-bold text-sm block">Download</span>
              <span class="text-[10px] text-gray-400">Download MP3 tracks</span>
            </div>
          </router-link>
        </div>

        <!-- Scrollable Lists Container -->
        <div class="flex-1 overflow-y-auto space-y-6 -mx-2 px-2 pb-6">
          <!-- Quick History Section -->
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <el-icon class="text-indigo-400"><Clock /></el-icon> Quick History
              </span>
              <span class="text-[10px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {{ listNames.length }}
              </span>
            </div>
            <div v-if="listNames.length === 0" class="p-4 text-xs text-gray-500 bg-white/5 rounded-2xl text-center border border-white/5">
              No recent playlists
            </div>
            <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
              <div
                v-for="(item, index) in listNames"
                :key="`mob-history-${item.value}-${index}`"
                @click="handleMobileSelectHistory(item.value)"
                class="p-3.5 rounded-2xl bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-sm text-gray-200 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <el-icon class="text-indigo-400 shrink-0"><Clock /></el-icon>
                  <span class="truncate font-medium">{{ item.name }}</span>
                </div>
                <span class="text-xs text-indigo-400 shrink-0 font-medium">Load</span>
              </div>
            </div>
          </div>

          <!-- Saved Playlists Section -->
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <el-icon class="text-cyan-400"><List /></el-icon> Saved Playlists
              </span>
              <el-icon v-if="isfetch" class="is-loading text-cyan-400"><Loading /></el-icon>
              <span v-else class="text-[10px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {{ playlistStore.listnames?.length || 0 }}
              </span>
            </div>
            <div v-if="!playlistStore.listnames || playlistStore.listnames.length === 0" class="p-4 text-xs text-gray-500 bg-white/5 rounded-2xl text-center border border-white/5">
              No saved playlists
            </div>
            <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
              <div
                v-for="(item, index) in playlistStore.listnames"
                :key="`mob-saved-${index}`"
                @click="handleMobileFetchPlaylist(item)"
                class="p-3.5 rounded-2xl bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-sm text-gray-200 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <el-icon class="text-cyan-400 shrink-0"><List /></el-icon>
                  <span class="truncate font-medium">{{ item }}</span>
                </div>
                <button
                  @click.stop="handleDeleteList(item)"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  title="Delete playlist"
                >
                  <el-icon size="14"><Close /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- My YouTube Section -->
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <el-icon class="text-red-400"><VideoPlay /></el-icon> My YouTube Playlists
              </span>
              <button
                v-if="userStore.oauthToken"
                @click="fetchMyYoutubePlaylists"
                class="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <el-icon :class="{ 'animate-spin': isFetchingMyPlaylist }"><Refresh /></el-icon>
                <span>Refresh</span>
              </button>
            </div>
            <div v-if="!userStore.oauthToken">
              <button
                @click="handleGoogleYoutubeLogin"
                class="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <el-icon class="text-indigo-400 text-lg"><Connection /></el-icon>
                <span>Connect YouTube Account</span>
              </button>
            </div>
            <div v-else-if="useYoutubeData.myPlaylistData.length === 0" class="p-4 text-xs text-gray-500 bg-white/5 rounded-2xl text-center border border-white/5">
              No YouTube playlists found
            </div>
            <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
              <div
                v-for="(item, index) in useYoutubeData.myPlaylistData"
                :key="`mob-yt-${item.value}-${index}`"
                @click="handleMobileSelectMyPlaylist(item.value)"
                class="p-3.5 rounded-2xl bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-sm text-gray-200 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <el-icon class="text-red-400 shrink-0"><VideoPlay /></el-icon>
                  <span class="truncate font-medium">{{ item.name }}</span>
                </div>
                <span class="text-xs text-indigo-400 shrink-0 font-medium">Load</span>
              </div>
            </div>
          </div>
        </div>

        <!-- User Account Footer in Mobile Menu -->
        <div class="pt-4 border-t border-white/10 shrink-0">
          <div v-if="!userStore.accessToken">
            <router-link
              to="/login"
              @click="isMobileMenuOpen = false"
              class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-2xl text-sm font-bold text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              Sign In
            </router-link>
          </div>
          <div v-else class="flex items-center justify-between bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div class="flex items-center gap-3 min-w-0 pr-2">
              <img :src="userStore.userInfo.avatar" alt="avatar" class="w-10 h-10 rounded-full border border-white/10 shrink-0">
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">{{ userStore.userInfo.name }}</p>
                <p class="text-xs text-gray-400">Premium Member</p>
              </div>
            </div>
            <button
              @click="handleUserCommand('logout')"
              class="px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <el-icon size="16"><SwitchButton /></el-icon>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Main App Container -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Desktop Sidebar with Synchronous Width Transition (桌面端側邊欄即時縮放) -->
      <aside
        :class="[
          'hidden md:flex flex-col z-40 glass-panel border-r border-white/5 shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
          notDisplaySideMenu ? '!w-0 !p-0 !border-r-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        ]"
      >
        <div class="w-64 p-4 h-full flex flex-col shrink-0">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <el-icon class="text-white text-base"><VideoPlay /></el-icon>
              </div>
              <h2 class="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                YT Player
              </h2>
            </div>
            <button
              @click="toggleMenu"
              class="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-400 hover:text-white"
              title="Collapse sidebar"
            >
              <el-icon><Fold /></el-icon>
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

              <el-sub-menu index="history" popper-class="modern-submenu-pop">
                <template #title>
                  <div class="flex items-center gap-2">
                    <el-icon><Clock /></el-icon>
                    <span>Quick History</span>
                  </div>
                </template>
                <el-menu-item v-if="listNames.length === 0" disabled class="menu-item-modern !text-gray-500">
                  <span>No history yet</span>
                </el-menu-item>
                <el-menu-item
                  v-for="(item, index) in listNames"
                  :key="`side-history-${item.value}-${index}`"
                  class="menu-item-modern"
                  @click="handleCommand(item.value)"
                >
                  <span class="truncate">{{ item.name }}</span>
                </el-menu-item>
              </el-sub-menu>

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
                  <span>Connect</span>
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
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Top Header Navigation -->
        <header class="h-[70px] glass-panel flex items-center justify-between px-4 sm:px-6 z-30 border-b border-white/5 shrink-0">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Mobile Menu Trigger Button -->
            <button
              @click="isMobileMenuOpen = true"
              class="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-gray-300 hover:text-white transition-all shadow-sm shrink-0"
              aria-label="Open menu"
            >
              <el-icon size="18"><Fold /></el-icon>
            </button>

            <!-- Desktop Sidebar Toggle Button (when hidden) -->
            <button
              v-if="notDisplaySideMenu"
              @click="toggleMenu"
              class="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-400 hover:text-white shrink-0"
              title="Open sidebar"
            >
              <el-icon><Expand /></el-icon>
            </button>

            <!-- Mobile Brand Title / Active Playlist -->
            <div class="md:hidden flex items-center gap-2 min-w-0">
              <span class="font-bold text-base bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent truncate">
                {{ useYoutubeData.currentListName || 'YT Player' }}
              </span>
            </div>

            <!-- Desktop Search & Quick History Bar -->
            <div class="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
              <el-dropdown @command="handleCommand" trigger="click">
                <button class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all whitespace-nowrap min-w-[140px]">
                  <el-icon><Clock /></el-icon>
                  <span>Quick History</span>
                  <el-icon class="ml-auto"><CaretBottom /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="modern-dropdown-menu">
                    <el-dropdown-item v-if="listNames.length === 0" disabled>
                      No history yet
                    </el-dropdown-item>
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
                  class="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
                  @keyup.enter="fetchData"
                >
                <button
                  @click="fetchData"
                  :disabled="isLoading || useYoutubeData.isFetching"
                  class="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/80 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                >
                  <span v-if="isLoading || useYoutubeData.isFetching" class="font-mono text-xs">
                    Fetching ({{ useYoutubeData.fetchedCount }}{{ useYoutubeData.totalCount ? `/${useYoutubeData.totalCount}` : '' }})
                  </span>
                  <span v-else>Load</span>
                  <el-icon v-if="isLoading || useYoutubeData.isFetching" class="is-loading"><Loading /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- User Account Actions -->
          <div class="flex items-center gap-3 ml-3 shrink-0">
            <router-link
              v-if="!userStore.accessToken"
              to="/login"
              class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Sign In
            </router-link>
            <div v-else class="flex items-center gap-3">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-semibold text-white leading-none">{{ userStore.userInfo.name }}</p>
                <p class="text-[11px] text-gray-400 mt-1">Premium</p>
              </div>
              <el-dropdown trigger="click" @command="handleUserCommand">
                <div class="relative cursor-pointer group">
                  <img :src="userStore.userInfo.avatar" alt="user" class="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-indigo-500/50 transition-all">
                  <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#020617] rounded-full"></div>
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
        </header>

        <!-- Real-time Fetching Progress Pill -->
        <transition name="fade">
          <div
            v-if="useYoutubeData.isFetching"
            class="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-indigo-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center gap-3 pointer-events-none"
          >
            <el-icon class="is-loading text-indigo-400 text-lg"><Loading /></el-icon>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-white">Fetching videos:</span>
              <span class="text-xs text-indigo-300 font-mono font-bold">
                {{ useYoutubeData.fetchedCount }}{{ useYoutubeData.totalCount ? ` / ${useYoutubeData.totalCount}` : '' }}
              </span>
            </div>
          </div>
        </transition>

        <!-- Main View Outlet -->
        <main class="flex-1 relative bg-[#020617] p-0 overflow-hidden">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  House, Download, Expand, Fold, List, CaretBottom,
  Loading, Close, VideoPlay, Connection,
  Refresh, SwitchButton, Upload, Clock
} from '@element-plus/icons-vue'
import { useYoutubeDataStore, useUserStore, usePlaylistStore } from '../stores'
import { googleTokenLogin } from 'vue3-google-login'
import { GOOGLE_CLIENT_ID } from '../config/env'

const isLoading = ref(false)
const isfetch = ref(false)
const useYoutubeData = useYoutubeDataStore()
const listId = ref('')
const notDisplaySideMenu = ref(false)
const isMobileMenuOpen = ref(false)
const listNames = computed(() => useYoutubeData.listNameData)
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

const handleCommand = async (command) => {
  listId.value = command
  await fetchData()
  isMobileMenuOpen.value = false
}

const handleMobileFetch = async () => {
  if (!listId.value.trim()) return
  await fetchData()
  isMobileMenuOpen.value = false
}

const handleMobileSelectHistory = async (val) => {
  listId.value = val
  await fetchData()
  isMobileMenuOpen.value = false
}

const handleMobileFetchPlaylist = async (listname) => {
  await handlefetchPlaylist(listname)
  isMobileMenuOpen.value = false
}

const handleMobileSelectMyPlaylist = async (val) => {
  listId.value = val
  await fetchData()
  isMobileMenuOpen.value = false
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
  const res = await useYoutubeData.getMyPlaylistData(userStore.oauthToken)
  if (res === 401) {
    userStore.clearOauthToken()
  }
  isFetchingMyPlaylist.value = false
}

const handleGoogleYoutubeLogin = async () => {
  try {
    const res = await googleTokenLogin({
      clientId: GOOGLE_CLIENT_ID,
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
  @apply h-11 mb-1 rounded-xl flex items-center gap-2 px-4 transition-all duration-200 !bg-transparent text-gray-400 hover:!bg-white/5 hover:text-green-400 border border-transparent;
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

/* Fullscreen Mobile Menu Transition (滿版進退場過渡動畫) */
.full-menu-enter-active,
.full-menu-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.full-menu-enter-from,
.full-menu-leave-to {
  opacity: 0;
  transform: translateY(-24px) scale(0.97);
  filter: blur(8px);
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
