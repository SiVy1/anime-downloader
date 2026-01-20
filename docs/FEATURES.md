# ✨ Features

**Anime Downloader** is more than just a downloader; it's a smart media management suite.

## 🔍 Discovery & Tracking

- **Seasonal View**: Browse currently airing anime fetched from Jikan (MAL).
- **AniList Integration**: Sync your anime library with AniList. Track progress and update watching status.
- **Smart Search**: Filter seasonal anime by title or genres.
- **One-Click Tracking**: Instantly add upcoming series to your watched library.

## 📥 Smart Downloading

- **Group Prioritization**: Automatically prioritizes high-quality releases from groups like **SubsPlease** and **Erai-raws**.
- **Instant Magnet Integration**: Magnet links are pushed directly to qBittorrent with organized subfolders.

## 🎥 Premium Playback Experience

- **Smart Streaming**:
  - **Direct Play**: If the file is H.264/AAC, it streams natively for zero CPU overhead.
  - **Live Transcoding**: If the codec is unsupported (e.g., HEVC/MKV), it transcodes on-the-fly via FFmpeg.
- **Auto Intro/Outro Skip**: Integration with **AniSkip** allows skipping openings and endings with a single button click.
- **Dynamic Chapters**: Interactive timeline markers based on skip-times.

## 📝 Subtitle Mastery

- **Internal Extraction**: Automatically extracts `.ass`/`.vtt` subtitles from MKV containers.
- **Online Search**: Integrated search for external subtitles via OpenSubtitles.com.
- **Polish Subtitles**: Dedicated integration with animesub.info for Polish anime subtitles.
- **Automatic Matching**: Attempts to find the best matching subtitle based on release filename.

## 🔄 Library Automation

- **Auto Conversion**: Background service that converts MKV to web-friendly MP4 to ensure native browser support and seekability.
- **Metadata Enrichment**: Automatic fetching of synopses, scores, and cover art.
- **Watch Status**: Track which episodes you've already seen.

## 📡 PVR Auto-Download

- **Series Subscriptions**: Subscribe to tracked anime - the system will automatically search for and download new episodes.
- **Release Profiles**: Configure per-anime preferences for:
  - Preferred release groups (SubsPlease, Erai-raws, etc.)
  - Quality settings (720p, 1080p, 4K)
  - Excluded groups
- **Global Defaults**: Set default preferences that apply to all new subscriptions.
- **Cron-Based Scheduling**: Trigger the PVR cycle via Linux cron for reliable automatic downloads.

## 🔔 Notifications & Integration

- **Discord Webhooks**: Receive notifications in Discord when new episodes are downloaded.
- **Browser Extension**: One-click download from HiAnime.to and AniList.co to your qBittorrent instance.
- **Queue Management**: Smart download queue with prioritization and scheduling.
