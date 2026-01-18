import axios from "axios";
import { connectDB } from "./db";
import { getSetting } from "@/models/Settings";

/**
 * NotificationService - Handles sending notifications to external services (e.g., Discord)
 */
export async function sendDiscordNotification(message: string, embed?: any) {
  try {
    await connectDB();
    const webhookUrl = await getSetting<string>("discord_webhook_url", "");

    if (!webhookUrl) {
      console.log("[NotificationService] Discord Webhook URL not configured, skipping.");
      return;
    }

    const payload: any = {
      content: message,
    };

    if (embed) {
      payload.embeds = [
        {
          color: 3447003, // Blue
          timestamp: new Date().toISOString(),
          ...embed,
        },
      ];
    }

    await axios.post(webhookUrl, payload);
    console.log("[NotificationService] Discord notification sent successfully.");
  } catch (error: any) {
    console.error("[NotificationService] Failed to send Discord notification:", error.message);
  }
}

/**
 * Notify when a new episode is downloaded
 */
export async function notifyEpisodeDownloaded(animeTitle: string, episodeNumber: number, imageUrl?: string) {
  const message = `🎬 **Odcinek Gotowy do Oglądania!**`;
  const embed = {
    title: animeTitle,
    description: `Pomyślnie pobrano odcinek **${episodeNumber}**.`,
    thumbnail: imageUrl ? { url: imageUrl } : undefined,
    fields: [
      {
        name: "Status",
        value: "✅ Pobrany & Zmapowany",
        inline: true,
      },
    ],
  };

  await sendDiscordNotification(message, embed);
}

/**
 * Notify when a new torrent is added to the downloader
 */
export async function notifyDownloadStarted(animeTitle: string, episodeNumber: number) {
  const message = `📥 **Rozpoczęto Pobieranie**`;
  const embed = {
    title: animeTitle,
    description: `Dodano do kolejki: Odcinek **${episodeNumber}**.`,
    color: 15844367, // Yellow
  };

  await sendDiscordNotification(message, embed);
}
