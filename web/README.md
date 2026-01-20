# Anime Downloader - Web Application

This is the main web application for Anime Downloader, built with [Next.js 16](https://nextjs.org) using the App Router architecture.

## 🚀 Quick Start

### Prerequisites

Ensure you have the following running:
- Node.js 18+
- MongoDB
- Redis
- FFmpeg & FFprobe
- qBittorrent with WebUI enabled

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file in the `web/` directory with the following variables:

#### Required
```env
MONGODB_URI=mongodb://localhost:27017/anime
REDIS_URL=redis://localhost:6379
ARIA2_PATH=/path/to/downloads
QBIT_URL=http://localhost:8080
QBIT_USER=admin
QBIT_PASS=adminadmin
```

#### Optional
```env
OPENSUBTITLES_API_KEY=your_key_here
ANISKIP_CLIENT_ID=your_client_id_here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Development

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the application.

### Production

```bash
npm run build
npm run start
```

### Testing

```bash
npm run test
```

## 📁 Project Structure

```
web/src/
├── app/                    # Next.js App Router (Pages & API Routes)
│   ├── api/                # REST API endpoints
│   ├── anime/              # Anime detail pages
│   ├── player/             # Video player page
│   └── season/             # Seasonal discovery page
├── components/             # React UI Components
│   ├── anime/              # Anime-related components
│   ├── player/             # Video player components
│   ├── season/             # Season browsing components
│   └── ui/                 # Reusable UI elements
├── hooks/                  # Custom React Hooks (Business Logic)
│   ├── useAnimeDetails.ts  # Anime metadata & operations
│   ├── useVideoPlayer.ts   # Video playback logic
│   └── useSeasonAnime.ts   # Seasonal discovery
├── lib/                    # Backend Services
│   ├── services/           # Core business logic
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript type definitions
│   └── env.ts              # Environment validation
└── models/                 # MongoDB Mongoose models
```

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video Player**: Vidstack
- **Icons**: Lucide React
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis
- **Media Processing**: FFmpeg

## 📚 Documentation

For comprehensive documentation, see:

- [Features](../docs/FEATURES.md) - Complete feature list
- [Setup Guide](../docs/SETUP.md) - Detailed installation steps
- [Architecture](../docs/ARCHITECTURE.md) - Technical design patterns

## 🔧 Key Features

- **Seasonal Anime Discovery** with MAL/AniList integration
- **Smart Download Management** via qBittorrent
- **Premium Video Streaming** with adaptive transcoding
- **Subtitle Management** (English & Polish)
- **Auto-Download System (PVR)** with release profiles
- **Discord Notifications** for new episodes
- **Browser Extension** for one-click downloads

## 📄 License

MIT © 2026
