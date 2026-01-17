# Anime Downloader 🎬

A personal media server for anime enthusiasts that automates torrent search, downloading, and streaming with subtitle support.

## Features

- 🔍 **Torrent Search** - Search Nyaa for anime torrents with automatic group prioritization (SubsPlease, Erai-raws)
- 📥 **qBittorrent Integration** - Add magnet links directly to your torrent client
- 🎥 **Video Streaming** - Stream downloaded episodes directly in browser with HLS support
- 📝 **Smart Subtitles** - Automatic subtitle matching from Anime Tosho (English) and animesub.info (Polish)
- 🔄 **Auto Conversion** - Background MKV→MP4 conversion for browser compatibility
- 📚 **Library Management** - Track anime with metadata from Jikan API (MyAnimeList)
- 🔧 **Codec Detection** - Intelligent codec analysis for optimal streaming strategy

## Tech Stack

| Category       | Technology                     |
| -------------- | ------------------------------ |
| Framework      | Next.js 16 (App Router)        |
| Language       | TypeScript                     |
| Database       | MongoDB + Redis (caching)      |
| Streaming      | FFmpeg (conversion), HLS       |
| Video Player   | Vidstack                       |
| Torrent Client | qBittorrent (WebUI API)        |
| External APIs  | Jikan (MAL), Nyaa, Anime Tosho |

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance
- Redis instance
- qBittorrent with WebUI enabled
- FFmpeg (installed and in PATH)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/anime-downloader.git
cd anime-downloader/web
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the `web` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/anime_downloader
REDIS_URL=redis://localhost:6379

# qBittorrent
QBIT_URL=http://localhost:8080
QBIT_USER=admin
QBIT_PASS=adminadmin

# Storage path (where torrents are downloaded)
ARIA2_PATH=/path/to/anime/downloads
```

4. **Run development server**

```bash
npm run dev
```

App will be available at `http://localhost:3002`

### Production

```bash
npm run build
npm run start
```

## Project Structure

```
web/src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API endpoints
│   │   ├── anime/          # Anime metadata & search
│   │   ├── downloader/     # Torrent search & downloads
│   │   ├── library/        # Library management
│   │   ├── stream/         # Video streaming
│   │   └── subtitles/      # Subtitle fetching
│   ├── anime/              # Anime detail pages
│   └── watch/              # Video player page
├── lib/                    # Core services
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Shared utilities
│   ├── animeParser.ts      # Filename parsing
│   ├── animeSubtitleService.ts  # Subtitle resolution
│   ├── autoConverter.ts    # Background conversion
│   ├── codecDetection.ts   # FFprobe integration
│   ├── conversionService.ts # FFmpeg conversion
│   ├── db.ts               # MongoDB/Redis connections
│   ├── downloader.ts       # qBittorrent & Nyaa API
│   └── jikanService.ts     # MAL metadata
├── models/                 # Mongoose schemas
└── components/             # React components
```

## API Reference

### Torrent Search

```
GET /api/downloader/search?q=one%20piece&sort=seeders&order=desc
```

Returns sorted torrent results with codec metadata.

### Add Download

```
POST /api/downloader/download-magnet
Body: { magnets: ["magnet:?..."], folder: "One Piece" }
```

### Library

```
GET /api/library
```

Returns tracked anime with linked folders.

```
GET /api/library/[folder]
```

Returns episodes for a specific anime folder.

### Streaming

```
GET /api/stream/[...path]
```

Streams video file with proper headers.

### Subtitles

```
GET /api/subtitles/anime?filename=[filename]
```

Returns matched subtitle URL from Anime Tosho.

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch
```

## License

MIT
