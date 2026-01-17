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

- 🔍 **Discovery** - Integrated Seasonal view with MAL metadata.
- 📥 **Organized Downloads** - qBittorrent integration with release group prioritization.
- 🎥 **Premium Player** - Powered by Vidstack with **AniSkip** integration (Skip Intro/Outro).
- 🔄 **Smart Stream** - Automated transcoding or direct play based on codec analysis.
- 📝 **Subtitles** - Online searching and internal extraction from containers.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Vidstack, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, MongoDB (Library State), Redis (Caching), FFmpeg (Processing).
- **Infrastructure**: qBittorrent (Downloader), Jikan API (Metadata).

---

## 📄 License

MIT © 2026
