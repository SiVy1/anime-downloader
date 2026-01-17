# ⚙️ Setup & Configuration

This guide provides detailed instructions on how to set up and configure your **Anime Downloader** instance.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18 or newer.
- **MongoDB**: A running instance (local or remote).
- **Redis**: A running instance (used for caching Jikan API responses).
- **FFmpeg & FFprobe**: Required for video analysis and conversion. Ensure they are in your system `PATH`.
- **qBittorrent**: Version 4.x+ with **WebUI enabled**.

## 🚀 Installation

1. **Clone the repo**:

   ```bash
   git clone https://github.com/your-username/anime-downloader.git
   cd anime-downloader/web
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the `web/` directory.

## 🔧 Environment Variables

The application strictly validates environment variables at startup. If critical variables are missing, the server will intentionally fail to start in production.

### Required Variables

| Variable      | Description                       | Example                           |
| :------------ | :-------------------------------- | :-------------------------------- |
| `MONGODB_URI` | Connection string for MongoDB     | `mongodb://localhost:27017/anime` |
| `REDIS_URL`   | Connection string for Redis       | `redis://localhost:6379`          |
| `ARIA2_PATH`  | Absolute path to downloads folder | `C:\AnimeDownloads`               |
| `QBIT_URL`    | URL of qBittorrent WebUI          | `http://localhost:8080`           |
| `QBIT_USER`   | qBittorrent username              | `admin`                           |
| `QBIT_PASS`   | qBittorrent password              | `adminadmin`                      |

### Optional Variables

| Variable                | Description                    | Use Case                       |
| :---------------------- | :----------------------------- | :----------------------------- |
| `OPENSUBTITLES_API_KEY` | Your OpenSubtitles.com API key | Online subtitle search         |
| `ANISKIP_CLIENT_ID`     | AniSkip Client ID              | Automatic intro/outro skipping |

## 🏃 Running the App

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3002`.

### Production Build

```bash
npm run build
npm run start
```

## 🧪 Verification

To ensure everything is working correctly, run the test suite:

```bash
npm run test
```
