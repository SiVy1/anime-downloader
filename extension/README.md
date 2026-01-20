# HiAnime to Nyaa Click-Downloader

Browser extension for one-click anime downloads from HiAnime.to and AniList.co directly to your qBittorrent instance.

## 🎯 Features

- **One-Click Downloads**: Instantly send torrents to qBittorrent from HiAnime.to
- **AniList Integration**: Quick download buttons on AniList.co anime pages
- **Seamless Integration**: Works with your Anime Downloader server

## 📦 Installation

### Chrome / Edge / Brave

1. Open your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

2. Enable **Developer mode** (toggle in the top-right corner)

3. Click **Load unpacked**

4. Select the `extension/` directory from this repository

5. The extension should now appear in your browser toolbar

## 🚀 Usage

### On HiAnime.to

1. Navigate to any anime page on [HiAnime.to](https://hianime.to)
2. Click the extension icon or look for the download button injected into the page
3. The extension will search Nyaa.si for matching torrents
4. Click to send the magnet link directly to your qBittorrent instance

### On AniList.co

1. Browse to any anime page on [AniList.co](https://anilist.co)
2. The extension adds a download button to the page
3. Click to initiate a torrent search and download

## ⚙️ Configuration

The extension requires your Anime Downloader server to be running:

- **Server URL**: Default is `http://localhost:3002`
- Make sure your qBittorrent instance is configured in the server's `.env.local`

## 🛠 Technical Details

- **Manifest Version**: 3
- **Supported Sites**: 
  - `https://hianime.to/*`
  - `https://anilist.co/*`
- **Permissions**: 
  - `activeTab` - Access to current tab
  - `scripting` - Inject download buttons
  - Host permissions for HiAnime and AniList

## 📝 Files

- `manifest.json` - Extension configuration
- `content.js` - Content script for page injection

## 🔒 Privacy

This extension:
- Only runs on HiAnime.to and AniList.co
- Communicates only with your local Anime Downloader server
- Does not collect or transmit any personal data to third parties
- Does not track your browsing activity

## 🐛 Troubleshooting

### Extension not working

1. Verify your Anime Downloader server is running at `http://localhost:3002`
2. Check browser console (F12) for error messages
3. Ensure qBittorrent WebUI is accessible from your server
4. Try reloading the extension: Extensions page → Click the reload icon

### Download button not appearing

1. Refresh the anime page
2. Check if the page structure has changed (site updates may require extension updates)
3. Verify the extension has permissions for the current site

## 📄 License

MIT © 2026
