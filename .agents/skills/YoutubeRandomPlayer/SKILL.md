---
name: YouTubeRandomPlayer Management
description: Expert instructions for maintaining and extending the YouTube Random Player (Vue 3)
---

# YouTube Random Player Professional Skill

This document serves as the authoritative guide for AI assistants and developers working on the YouTube Random Player project. It outlines the architectural principles, state management patterns, and UI/UX standards required for this application.

## 🏗 Architectural Overview

The application is built on a modern **Vue 3 + Vite** stack, utilizing a modular store architecture with **Pinia**.

### 🛠 Core Technology Stack
- **Frontend**: Vue 3 (Composition API)
- **State Management**: Pinia (Modules: `user`, `youtubeData`, `playlistData`)
- **Styling**: Tailwind CSS + Element Plus (Glassmorphism theme)
- **API**: YouTube Data API v3 (REST via Axios)
- **Authentication**: Google OAuth2 (for playlist write access)

## 📦 State Management Directory

### `youtubeData` Store
The central hub for playlist and video metadata.
- **`snippetData`**: Reactive list of videos in the current queue.
- **`recommendedVideos`**: Search results from the Discovery engine.
- **`addVideoToPlaylist()`**: Handles cloud-side duplicate checking before insertion.
- **`checkVideoInPlaylist()`**: High-efficiency API call for duplicate verification.

### `user` Store
Manages authentication state.
- **`oauthToken`**: Required for YouTube "My Playlists" and "Write" permissions.
- **`accessToken`**: Backend-specific session token.

### `playlistData` Store
Handles integration with the custom backend (`ytdl-server-byvu`).

## 🔌 API Integration Guidelines

### YouTube v3 Standards
- **Cloud-First Validation**: Always perform a cloud-side check via `playlistItems.list` with `videoId` filter before adding to a playlist.
- **Quota Management**: Minimize `part` parameters. Use `part=id` for existence checks and `part=snippet` for metadata.
- **OAuth Scopes**: Ensure `https://www.googleapis.com/auth/youtube.force-ssl` or `.readonly` / `.playlist` scopes are correctly requested during login.

## 🎨 UI/UX Design System (Premium Aesthetics)

### Glassmorphism Principles
- **Panels**: Use `bg-white/5` with `backdrop-blur-xl` and `border-white/10`.
- **Color Palette**: Dark-centric (`#020617` background) with Indigo (`#6366f1`) and Cyan accents.
- **Typography**: Tracking-widest for uppercase headers, bold weights for titles, and truncated text for long descriptions.

### Notification System (Toast)
- **Placement**: Always centered within the viewport using `Teleport` to `body`.
- **Style**: Black/90 background, minimalist icons, 2000ms duration.
- **Context**: Used strictly for transient feedback (Success/Warning).

## 🚀 Development Workflow

### Adding New Features
1. **API First**: Define the endpoint in `fetchYoutubeData.js`.
2. **Store Logic**: Implement the action in the relevant Pinia module with error handling.
3. **Component Integration**: Use `storeToRefs` for reactivity and integrate the UI following the Glassmorphism system.
4. **Validation**: Verify API quota impact and responsive layout.

## ⚠️ Important Considerations
- **Sync Issues**: Local `snippetData` can become stale if modified externally. Always prioritize cloud data for write operations.
- **Duplicate Prevention**: Never rely solely on local state for duplicate checking. Always query the YouTube cloud.
- **Performance**: Use `el-scrollbar` for all lists to ensure smooth scrolling in large playlists (3000+ items).
