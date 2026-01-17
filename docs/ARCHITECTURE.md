# 🏗 Architecture

This document describes the technical architecture and design patterns of the **Anime Downloader** project.

## 🏗 Core Concepts

The application is built on **Next.js 16** using the **App Router** architecture. It follows a clean separation of concerns between the backend (API routes) and frontend (React components).

### 🛠 Frontend Pattern: Container/Presentational with Hooks

We use the **Container/Presentational** pattern to keep our UI code clean and maintainable:

- **Custom Hooks (`hooks/`)**: Encapsulate all business logic, state management, and API interactions.
  - `useAnimeDetails`: Manages anime metadata and library operations.
  - `useVideoPlayer`: Handles the complex playback logic, subtitles, and streaming strategies.
  - `useSeasonAnime`: Manages seasonal discovery and filtering.
- **Presentational Components (`components/`)**: Pure components that receive data via props and emit events via callbacks. They are responsible for the aesthetic "WOW" factor.
- **Containers (`app/`)**: Page components that compose hooks and components, acting as the layout glue.

### 🛡 Configuration & Validation

We use a centralized **Environment Validation** system in `web/src/lib/env.ts`.

- All `process.env` access is restricted to this file.
- The app performs a "fail-fast" validation at startup (runtime).
- It provides a strongly-typed `config` object used across the entire application.

### 🔌 Backend Services (`lib/`)

The backend logic is organized into specialized services:

- **`LibraryService`**: Manages the local file system interactions (async) and MongoDB state.
- **`DownloaderService`**: Interfaces with qBittorrent and searches Nyaa.si.
- **`AutoConverter`**: A background singleton that monitors and converts MKV files to MP4 using FFmpeg.
- **`JikanService`**: Wrapper for the MyAnimeList API with Redis caching.

## 📁 Project Structure

```bash
web/src/
├── app/                    # Next.js App Router (Containers)
├── components/             # Pure UI Components
│   ├── anime/              # Anime details components
│   ├── season/             # Season view components
│   └── player/             # Video player components
├── hooks/                  # Custom React Hooks (Business Logic)
├── lib/                    # Backend Core Services (Singletons)
│   ├── utils/              # Helper functions & Async FS utilities
│   ├── env.ts              # Central Config & Validation
│   └── ...                 # Specialized services (Downloader, Library, etc.)
├── models/                 # Mongoose Data Models
└── types/                  # Shared TypeScript Definitions
```

## 🔄 Data Flow

1. **Discovery**: User finds anime in `SeasonView` (via `useSeasonAnime`).
2. **Library**: User "Tracks" anime, adding it to MongoDB via `LibraryService`.
3. **Download**: User searches and starts torrents via `DownloaderService` (proxied through `useVideoPlayer` or `useAnimeDetails`).
4. **Processing**: `AutoConverter` notices new files and prepares them for the web if needed.
5. **Streaming**: `useVideoPlayer` determines the best streaming strategy (Direct vs. Transcode) and mounts the `VideoPlayer`.
