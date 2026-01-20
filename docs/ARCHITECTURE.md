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
- **`AniListService`**: Integration with AniList GraphQL API for anime metadata and sync. Implements write-through cache pattern with MongoDB and Redis.
- **`AnimeSubtitleService`**: Extracts subtitles from MKV containers and searches OpenSubtitles.
- **`PolishSubtitleService`**: Integration with animesub.info for Polish subtitles with release group matching.
- **`NotificationService`**: Sends Discord webhook notifications for download events.
- **`PVRService`**: Automated episode downloading with release profile support.
- **`ReleaseProfileService`**: Torrent scoring and filtering based on quality and release groups.
- **`EpisodeService`**: Episode tracking and watch status management.
- **`ConversionService`**: Video format conversion and codec handling.
- **`QueueService`**: Download queue management and prioritization.
- **`CodecDetection`**: Media codec analysis using FFprobe.

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

1. **Discovery**: User finds anime in `SeasonView` (via `useSeasonAnime`) or syncs from AniList.
2. **Library**: User "Tracks" anime, adding it to MongoDB via `LibraryService`.
3. **Download**: User searches and starts torrents via `DownloaderService` (proxied through `useVideoPlayer` or `useAnimeDetails`).
4. **Processing**: `AutoConverter` notices new files and prepares them for the web if needed.
5. **Streaming**: `useVideoPlayer` determines the best streaming strategy (Direct vs. Transcode) and mounts the `VideoPlayer`.
6. **Notifications**: `NotificationService` sends Discord alerts when episodes are ready.

## 🌐 API Routes

The application exposes a comprehensive REST API:

### Anime Management
- `GET/POST /api/anime/season` - Seasonal anime listing
- `GET /api/anime/search` - Search anime
- `GET /api/anime/[id]` - Get anime details
- `POST /api/anime/[id]/add` - Add anime to library
- `POST /api/anime/[id]/subscribe` - Subscribe for auto-downloads
- `PUT /api/anime/[id]/release-profile` - Configure release preferences
- `POST /api/anime/[id]/link` - Link local folder
- `GET /api/anime/skip-times/[malId]/[episode]` - Get AniSkip data

### Downloads & Library
- `GET /api/downloader/search` - Search Nyaa.si
- `GET /api/downloader/search-episode` - Search specific episode
- `POST /api/downloader/download-magnet` - Start torrent
- `GET /api/downloader/status/[gid]` - Download status
- `GET /api/library` - List library folders
- `GET /api/library/[folder]` - Get folder contents

### Streaming & Media
- `GET /api/stream/[...path]` - Stream with transcoding
- `GET /api/stream-direct/[...path]` - Direct streaming
- `POST /api/convert/[...path]` - Convert video format

### Subtitles
- `GET /api/subtitles/search` - Search OpenSubtitles
- `GET /api/subtitles/anime/search` - Search with anime context
- `GET /api/subtitles/polish/download` - Get Polish subtitles
- `POST /api/subtitles/download` - Download subtitle
- `GET /api/subtitles/extract/[index]/[...path]` - Extract from MKV
- `GET /api/subtitles/metadata/[...path]` - Get subtitle metadata

### Episodes & Settings
- `POST /api/episodes/[id]/watch` - Mark episode watched
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings
- `GET/POST /api/settings/release-profile` - Global release profile

### Integration & Automation
- `POST /api/pvr/run` - Trigger PVR cycle
- `POST /api/webhooks/qbittorrent` - Download completion webhook
- `GET /api/anilist/planning` - Get AniList planning list
- `POST /api/anilist/progress` - Update AniList progress
- `GET /api/stats/summary` - Library statistics
