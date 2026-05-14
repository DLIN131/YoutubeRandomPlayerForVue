/**
 * Values come from Vite env (prefix VITE_ is required for client exposure).
 * Copy .env.example to .env in the project root and set your keys.
 */
export const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
