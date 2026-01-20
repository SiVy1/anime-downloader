# Anime Downloader 🎬

A premium personal media server for anime enthusiasts. It transforms your local library into a Netflix-like experience with automatic metadata, background conversion, and smart streaming.

---

## 🌟 Quick Start

```bash
git clone https://github.com/your-username/anime-downloader.git
cd anime-downloader/web
npm install
# Configure .env.local (see docs/SETUP.md)
npm run dev
```

---

## 📖 Documentation

For a deep dive into the system, please refer to the following guides:

- **✨ [Features](docs/FEATURES.md)**: Explore what you can do with Anime Downloader.
- **🏗 [Architecture](docs/ARCHITECTURE.md)**: Learn about the internal design (Hooks, Containers, Services).
- **⚙️ [Setup & Config](docs/SETUP.md)**: Detailed steps to get the server running.

---

## 🚀 Key Highlights

- 🔍 **Discovery** - Integrated Seasonal view with MAL metadata and AniList sync.
- 📥 **Organized Downloads** - qBittorrent integration with release group prioritization.
- 🎥 **Premium Player** - Powered by Vidstack with **AniSkip** integration (Skip Intro/Outro).
- 🔄 **Smart Stream** - Automated transcoding or direct play based on codec analysis.
- 📝 **Subtitles** - Online searching (OpenSubtitles + Polish subtitles via animesub.info) and internal extraction from containers.
- 📱 **Browser Extension** - One-click download from HiAnime.to and AniList.co.
- 🔔 **Notifications** - Discord webhook integration for download alerts.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Vidstack, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, MongoDB (Library State), Redis (Caching), FFmpeg (Processing).
- **Infrastructure**: qBittorrent (Downloader), Jikan API (Metadata).

---

## 🔑 Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis cache connection string
- `ARIA2_PATH` - Download folder path
- `QBIT_URL` - qBittorrent WebUI URL
- `QBIT_USER` - qBittorrent username
- `QBIT_PASS` - qBittorrent password

### Optional
- `OPENSUBTITLES_API_KEY` - For online subtitle search
- `ANISKIP_CLIENT_ID` - For intro/outro skipping (default provided)
- `DISCORD_WEBHOOK_URL` - For download notifications

See [docs/SETUP.md](docs/SETUP.md) for detailed configuration.

---

## 🌐 API Routes

The server provides comprehensive REST API endpoints:

- **Anime Management**: `/api/anime/*` - Search, season listing, subscribe, release profiles
- **Downloads**: `/api/downloader/*` - Torrent search, magnet downloads, status tracking
- **Library**: `/api/library/*` - Folder management and file operations
- **Streaming**: `/api/stream/*` - Video streaming with transcoding
- **Subtitles**: `/api/subtitles/*` - Search, extract, download (English & Polish)
- **Episodes**: `/api/episodes/*` - Watch status tracking
- **PVR**: `/api/pvr/run` - Auto-download scheduler
- **AniList**: `/api/anilist/*` - AniList API sync
- **Stats**: `/api/stats/*` - Library statistics
- **Webhooks**: `/api/webhooks/qbittorrent` - Download completion hooks

---

## 📄 License

MIT © 2026
