/**
 * AniList Mutations Service
 *
 * Functions that require user authentication (access token)
 * for reading user-specific data and making mutations.
 */

const ANILIST_API_URL = "https://graphql.anilist.co";

interface AniListMediaEntry {
  id: number;
  mediaId: number;
  status: string;
  progress: number;
  media: {
    id: number;
    title: {
      romaji: string;
      english: string | null;
    };
    coverImage: {
      large: string;
      extraLarge: string;
    };
    episodes: number | null;
    status: string;
    nextAiringEpisode?: {
      episode: number;
      airingAt: number;
    };
  };
}

interface MediaListResponse {
  MediaListCollection: {
    lists: Array<{
      name: string;
      entries: AniListMediaEntry[];
    }>;
  };
}

interface SaveMediaListEntryResponse {
  SaveMediaListEntry: {
    id: number;
    mediaId: number;
    status: string;
    progress: number;
  };
}

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
): Promise<T | null> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`[AniListMutations] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("[AniListMutations] GraphQL errors:", data.errors);
      return null;
    }

    return data.data as T;
  } catch (error) {
    console.error("[AniListMutations] Request error:", error);
    return null;
  }
}

const GET_USER_MEDIA_LIST = `
  query GetUserMediaList($userId: Int!, $status: MediaListStatus!) {
    MediaListCollection(userId: $userId, type: ANIME, status: $status) {
      lists {
        name
        entries {
          id
          mediaId
          status
          progress
          media {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
              extraLarge
            }
            episodes
            status
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      }
    }
  }
`;

const SAVE_MEDIA_LIST_ENTRY = `
  mutation SaveMediaListEntry($mediaId: Int!, $status: MediaListStatus, $progress: Int) {
    SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
      id
      mediaId
      status
      progress
    }
  }
`;

/**
 * Get user's "Planning to Watch" list
 */
export async function getPlanningList(
  accessToken: string,
  userId: number,
): Promise<AniListMediaEntry[]> {
  const data = await graphqlRequest<MediaListResponse>(
    GET_USER_MEDIA_LIST,
    { userId, status: "PLANNING" },
    accessToken,
  );

  if (!data?.MediaListCollection?.lists) return [];

  return data.MediaListCollection.lists.flatMap((list) => list.entries);
}

/**
 * Get user's currently watching list
 */
export async function getCurrentlyWatching(
  accessToken: string,
  userId: number,
): Promise<AniListMediaEntry[]> {
  const data = await graphqlRequest<MediaListResponse>(
    GET_USER_MEDIA_LIST,
    { userId, status: "CURRENT" },
    accessToken,
  );

  if (!data?.MediaListCollection?.lists) return [];

  return data.MediaListCollection.lists.flatMap((list) => list.entries);
}

/**
 * Update progress for a media entry
 * If anime is in PLANNING status, it will be moved to CURRENT
 */
export async function updateProgress(
  accessToken: string,
  mediaId: number,
  progress: number,
): Promise<boolean> {
  const data = await graphqlRequest<SaveMediaListEntryResponse>(
    SAVE_MEDIA_LIST_ENTRY,
    { mediaId, status: "CURRENT", progress },
    accessToken,
  );

  if (data?.SaveMediaListEntry) {
    console.log(
      `[AniListMutations] Updated progress for ${mediaId} to ${progress}`,
    );
    return true;
  }
  return false;
}

/**
 * Add anime to user's list with specified status
 */
export async function addToList(
  accessToken: string,
  mediaId: number,
  status: "PLANNING" | "CURRENT" | "COMPLETED" | "DROPPED" | "PAUSED",
): Promise<boolean> {
  const data = await graphqlRequest<SaveMediaListEntryResponse>(
    SAVE_MEDIA_LIST_ENTRY,
    { mediaId, status, progress: status === "COMPLETED" ? undefined : 0 },
    accessToken,
  );

  if (data?.SaveMediaListEntry) {
    console.log(
      `[AniListMutations] Added ${mediaId} to list with status ${status}`,
    );
    return true;
  }
  return false;
}

/**
 * Mark anime as completed
 */
export async function markCompleted(
  accessToken: string,
  mediaId: number,
  totalEpisodes: number,
): Promise<boolean> {
  const data = await graphqlRequest<SaveMediaListEntryResponse>(
    SAVE_MEDIA_LIST_ENTRY,
    { mediaId, status: "COMPLETED", progress: totalEpisodes },
    accessToken,
  );

  if (data?.SaveMediaListEntry) {
    console.log(`[AniListMutations] Marked ${mediaId} as completed`);
    return true;
  }
  return false;
}
