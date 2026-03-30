<template>
  <div class="w-full h-screen flex justify-center items-center bg-[#020617] relative overflow-hidden">
    <!-- Decorative background blobs -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s"></div>

    <div class="glass-card login-card min-w-[320px] sm:min-w-[480px] p-10 rounded-3xl flex flex-col items-center gap-8 relative z-10">
      <div class="text-center">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Welcome Back
        </h1>
        <p class="text-gray-400 text-sm">Sign in to sync your playlists and start listening</p>
      </div>

      <div class="w-full flex flex-col gap-4">
        <button 
          @click="handleGoogleAccessTokenLogin"
          class="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <div class="text-xs text-gray-500 mt-4">
        By continuing, you agree to our <span class="text-indigo-400 cursor-pointer">Terms of Service</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { googleTokenLogin } from 'vue3-google-login'
import { useUserStore } from '../stores'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const GOOGLE_CLIENT_ID = '959560237311-13dbj26mjffjcph7r49pq3c57lbvpgrr.apps.googleusercontent.com'

const handleGoogleAccessTokenLogin = async () => {
  try {
    const res = await googleTokenLogin({
      clientId: GOOGLE_CLIENT_ID,
      scope: 'profile email https://www.googleapis.com/auth/youtube.readonly',
      prompt: 'consent'
    })
    const token = res.access_token

    const success = await userStore.getUserInfo(token)
    if (success) {
      router.push('/')
      return
    }
    alert('Login failed. Please try again.')
  } catch (err) {
    console.error('Google login error:', err)
  }
}
</script>

<style scoped>
.login-card {
  animation: fadeIn 0.6s ease-out;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
