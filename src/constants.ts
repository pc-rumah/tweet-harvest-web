import dayjs from "dayjs";
import path from "path";

export const TWITTER_SEARCH_ADVANCED_URL = {
  TOP: "https://x.com/search-advanced",
  LATEST: "https://x.com/search-advanced?f=live",
};

/**
 * Build a direct Twitter/X search URL using query parameters.
 * This avoids relying on the Advanced Search form UI which can change.
 */
export function buildTwitterSearchUrl(
  keywords: string,
  tab: "TOP" | "LATEST",
  fromDate?: string,
  toDate?: string
): string {
  let query = keywords;

  if (fromDate) {
    const [day, month, year] = fromDate.split(" ")[0].split("-");
    query += ` since:${year}-${month}-${day}`;
  }

  if (toDate) {
    const [day, month, year] = toDate.split(" ")[0].split("-");
    query += ` until:${year}-${month}-${day}`;
  }

  const encoded = encodeURIComponent(query);
  const tabParam = tab === "LATEST" ? "&f=live" : "";
  return `https://x.com/search?q=${encoded}${tabParam}&src=typed_query`;
}

export const NOW = dayjs().format("DD-MM-YYYY HH-mm-ss");

export const FOLDER_DESTINATION = "./tweets-data";
export const FUlL_PATH_FOLDER_DESTINATION = path.resolve(FOLDER_DESTINATION);

export const FILTERED_FIELDS = [
  "created_at",
  "id_str",
  "full_text",
  "quote_count",
  "reply_count",
  "retweet_count",
  "favorite_count",
  "lang",
  "user_id_str",
  "conversation_id_str",
  "username",
  "tweet_url",
  "image_url",
  "location",
  "in_reply_to_screen_name",
];
