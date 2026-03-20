<template>
  <!-- side menu -->
  <el-container class="layout-container-demo" style="height: 100vh">
    <el-aside v-if="!notDisplaySideMenu" width="200px" class=" z-10">
      <el-scrollbar>
        <button
          v-if="!notDisplaySideMenu"
          @click="toggleMenu"
          class="w-11 h-11 flex items-center justify-center mb-3
                rounded-md
                bg-black/20 backdrop-blur-sm
                border border-gray-300/50
                shadow-[0_0_8px_#ffffff33,inset_0_0_6px_#ffffff44]
                hover:bg-black/30 hover:shadow-[0_0_12px_#ffffff55,inset_0_0_8px_#ffffff66]
                transition-all duration-300"
        >
          <el-icon class="text-gray-200 drop-shadow-[0_0_2px_#ffffffaa]">
            <Fold />
          </el-icon>
        </button>
        <el-menu router class="side-menu">
          <el-menu-item index="/player" class="side-list-item">
            <template #title>
              <el-icon>
                <House></House>
              </el-icon> home
            </template>
          </el-menu-item>
          <el-menu-item index="/downLoad" class="side-list-item">
            <template #title>
              <el-icon>
                <Download></Download>
              </el-icon> download
            </template>
          </el-menu-item>
        </el-menu>
        <el-menu class="side-menu">
          <el-sub-menu index="1" popper-class="neon-submenu-pop">
            <template #title>
              <div class="submenu-title">
                <el-icon>
                  <List />
                </el-icon>
                <span>Saved</span>
              </div>
              <el-icon v-if="isfetch" class="is-loading">
                <Loading />
              </el-icon>
            </template>
            <el-menu-item class="side-list-item list-item" v-for="(item, index) in playlistStore.listnames" :key="index"
              @click="handlefetchPlaylist(item)">
              <span @click.stop="handleDeleteList(item)"
                class="delete-chip absolute left-2 flex items-center justify-center w-5 h-5 rounded-full p-2">X</span>
              {{ item }}
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
        <el-menu class="side-menu">
          <el-sub-menu index="2" popper-class="neon-submenu-pop">
            <template #title>
              <div class="submenu-title">
                <el-icon>
                  <List />
                </el-icon>
                <span>My YT</span>
              </div>
              <el-icon v-if="isFetchingMyPlaylist" class="is-loading">
                <Loading />
              </el-icon>
            </template>
            <el-menu-item class="side-list-item" v-if="!userStore.oauthToken" @click="handleGoogleYoutubeLogin">
              Connect
            </el-menu-item>
            <template v-else>
              <el-menu-item class="side-list-item" @click="fetchMyYoutubePlaylists">
                Refresh
              </el-menu-item>
              <el-menu-item
                class="side-list-item"
                v-for="(item, index) in useYoutubeData.myPlaylistData"
                :key="`${item.value}-${index}`"
                @click="handleSelectMyPlaylist(item.value)"
              >
                {{ item.name }}
              </el-menu-item>
            </template>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>
    <!-- input area -->
    <el-container>
      <el-header style="text-align: center; font-size: 16px"
        class=" shadow-lg shadow-black flex justify-between md:justify-center items-center">
        <button
          v-if="notDisplaySideMenu"
          @click="toggleMenu"
          class="w-11 h-11 min-w-[2.75rem] flex items-center justify-center
                rounded-md
                bg-black/20 backdrop-blur-sm
                border border-gray-300/50
                shadow-[0_0_8px_#ffffff33,inset_0_0_6px_#ffffff44]
                hover:bg-black/30 hover:shadow-[0_0_12px_#ffffff55,inset_0_0_8px_#ffffff66]
                transition-all duration-300"
        >
          <el-icon class="text-gray-200 drop-shadow-[0_0_2px_#ffffffaa]">
            <Expand />
          </el-icon>
        </button>
        <button @click="toggleHeaderContainer"
          class="md:hidden  w-11 h-11 min-w-[2.75rem] rounded-md flex ml-auto items-center justify-center bg-transparent ">
          <el-icon>
            <MoreFilled />
          </el-icon>
        </button>
        <div id="headerContainer"
          class="rounded-md absolute top-12 left-0 md:top-0 h-fit bg-slate-300/50 md:bg-transparent hidden overflow-hidden transition-all w-full md:h-full p-1 md:flex justify-center gap-3 items-center md:relative z-30">
          <el-dropdown @command="handleCommand" class="border border-gray-300/50">
            <span class="el-dropdown-link">
              <el-icon class="el-icon--left">
                <List />
              </el-icon>list history
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="(item, index) in listNames" :key="index" :command="item.value" divided>
                  {{ item.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <input v-model="listId" type="text" placeholder="listId"
            class="w-full h-12 md:w-8/12 md:h-full md:mt-0 mt-3 mr-1 rounded-md">
          <span class="w-36 inline-flex items-center justify-center border border-gray-300/50">
            <button @click="fetchData" class="mt-3 md:mt-0 bg-black">append</button>
            <img v-if="isLoading" class="w-7 h-7" src="../assets/img/hutoa01-unscreen.gif" alt="">
          </span>
        </div>
        <div v-if="!userStore.accessToken" class="p-1 min-w-fit bg-red-400 rounded-md border-l-fuchsia-200 border">
          <router-link to="/login">登入/註冊</router-link>
        </div>
        <div v-else class=" flex items-center justify-evenly w-24 min-w-[6rem]">
          <img width="30" :src="userStore.userInfo.avatar" alt="user" class=" rounded-full">
          <span class=" min-w-fit text-white">{{ userStore.userInfo.name }}</span>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <span class="pt-1 cursor-pointer text-white ">
              <el-icon>
                <CaretBottom />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">登出</el-dropdown-item>
                <el-dropdown-item command="upload">上傳清單</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-icon v-if="isUploading" class="is-loading" style="color: white">
            <Loading />
          </el-icon>
        </div>
      </el-header>
      <!-- songList -->
      <el-main class="flex justify-centeritems-center  max-w-[100vw] h-[100vh] ">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
// import
import { ref, onMounted } from 'vue'
import { House, Download, Expand, Fold, List, CaretBottom, Loading, MoreFilled } from '@element-plus/icons-vue'
import { useYoutubeDataStore, useUserStore, usePlaylistStore } from '../stores'
import { googleTokenLogin } from 'vue3-google-login'

// variables
const isLoading = ref(false) // 使用youtube api抓資料
const isfetch = ref(false) // 使用自己server抓資料
const useYoutubeData = useYoutubeDataStore()
const listId = ref('')
const notDisplaySideMenu = ref(true)
const listNames = ref(useYoutubeData.listNameData) // array
const userStore = useUserStore()
const playlistStore = usePlaylistStore()
const isUploading = ref(false)
const isFetchingMyPlaylist = ref(false)
// methods
const fetchData = async () => {
  const pattern = /list=([a-zA-Z0-9_-]+)/
  const match = listId.value.match(pattern)
  if (listId.value === '') {
    alert('not enter a url or listId')
    return
  }
  if (match) {
    listId.value = match[1]
  }
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
      const res = await playlistStore.postPlaylist(listname, formData.getAll('dataChunk'), playlist.length)
      console.log(res)
    }
    isUploading.value = false
    // console.log(res);
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
  alert('確定要刪除?')
  playlistStore.deletePlaylist(listname)
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
.el-main {
  /* background: url('../assets/img/main_bg01.jpg') no-repeat center; */
  background: black;
  overflow: hidden;
  padding: 0;
}

.layout-container-demo .el-header {
  position: relative;
  background-color: rgb(253, 44, 44);
  background: none;
  color: black;
  outline-style: solid;
  outline-width: 2px;
  outline-color: rgb(97, 97, 97);
}

.layout-container-demo .el-aside {
  color: var(--el-text-color-primary);
  background: rgb(0, 0, 0);
  /* margin-right: 1.25rem; */
  padding: 0.5rem;
  background-size: cover;
  background-position-x: center;
  border-right: 1px solid rgb(97, 97, 97);
}

.side-menu {
  background: linear-gradient(155deg, rgba(8, 20, 34, 0.9), rgba(4, 8, 20, 0.88));
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 12px;
  margin-bottom: 0.6rem;
  padding: 0.25rem;
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.2), inset 0 0 10px rgba(34, 211, 238, 0.08);
}

.submenu-title {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.side-list-item {
  color: #05434e;
  border-radius: 10px;
  margin: 0.12rem 0;
  min-height: 38px;
  transition: all 0.22s ease;
}

:deep(.side-list-item.is-active),
.side-list-item:hover {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.52), rgba(6, 182, 212, 0.22));
  color: #f0fdff;
  text-shadow: 0 0 7px rgba(103, 232, 249, 0.45);
}

:deep(.side-menu .el-sub-menu__title) {
  color: #e6f9ff;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(125, 211, 252, 0.16);
}

:deep(.side-menu .el-sub-menu__title:hover) {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.38), rgba(2, 132, 199, 0.16));
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}

.list-item {
  color: #67e8f9;
  background: rgba(2, 6, 23, 0.5);
  display: flex;
  position: relative;
  padding-left: 2.1rem;
  padding-right: 0.5rem;
}

.list-item:hover {
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.2), rgba(103, 232, 249, 0.08));
  color: #ecfeff;
}

.delete-chip {
  background: rgba(100, 116, 139, 0.75);
  font-size: 11px;
  border: 1px solid rgba(226, 232, 240, 0.35);
  transition: all 0.2s ease;
}

.delete-chip:hover {
  background: rgba(239, 68, 68, 0.9);
}

:deep(.neon-submenu-pop.el-popper),
:deep(.neon-submenu-pop) {
  border: 1px solid rgba(34, 211, 238, 0.5) !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.35) !important;
}

:deep(.neon-submenu-pop .el-menu),
:deep(.neon-submenu-pop .el-menu--popup),
:deep(.neon-submenu-pop .el-menu--popup-container),
:deep(.neon-submenu-pop ul) {
  background: linear-gradient(160deg, rgba(5, 15, 30, 0.98), rgba(7, 22, 43, 0.98)) !important;
}

:deep(.neon-submenu-pop .el-menu-item) {
  color: #d7f9ff !important;
  min-width: 180px;
  border-left: 2px solid transparent;
  background: transparent !important;
}

:deep(.neon-submenu-pop .el-menu-item:hover),
:deep(.neon-submenu-pop .el-menu-item:focus) {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.38), rgba(8, 47, 73, 0.15)) !important;
  color: #f0fdff !important;
  border-left-color: rgba(103, 232, 249, 0.9);
}

.el-dropdown-link {
  background-color: rgb(2, 2, 2);
  height: 1.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: white;
  min-width: 7rem;
}
</style>
