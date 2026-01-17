# ✨ Features

**Anime Downloader** is more than just a downloader; it's a smart media management suite.

## 🔍 Discovery & Tracking

- **Seasonal View**: Browse currently airing anime fetched from Jikan (MAL).
- **Smart Search**: Filter seasonal anime by title or genres.
- **One-Click Tracking**: Instantly add upcoming series to your watched library.

## 📥 Smart Downloading

- **Group Prioritization**: Automatically prioritizes high-quality releases from groups like **SubsPlease** and **Erai-raws**.
- **Instant Magnet Integration**: Magnet links are pushed directly to qBittorrent with organized subfolders.
- **Live Streaming**: Start watching while the torrent is still downloading. The player supports buffering from qBittorrent's temporary storage.

## 🎥 Premium Playback Experience

- **Smart Streaming**:
  - **Direct Play**: If the file is H.264/AAC, it streams natively for zero CPU overhead.
  - **Live Transcoding**: If the codec is unsupported (e.g., HEVC/MKV), it transcodes on-the-fly via FFmpeg.
- **Auto Intro/Outro Skip**: Integration with **AniSkip** allows skipping openings and endings with a single button click.
- **Dynamic Chapters**: Interactive timeline markers based on skip-times.

## 📝 Subtitle Mastery

- **Internal Extraction**: Automatically extracts `.ass`/`.vtt` subtitles from MKV containers.
- **Online Search**: Integrated search for external subtitles via OpenSubtitles.com.
- **Automatic Matching**: Attempts to find the best matching subtitle based on release filename.

## 🔄 Library Automation

- **Auto Conversion**: Background service that converts MKV to web-friendly MP4 to ensure native browser support and seekability.
- **Metadata Enrichment**: Automatic fetching of synopses, scores, and cover art.
- **Watch Status**: Track which episodes you've already seen.
