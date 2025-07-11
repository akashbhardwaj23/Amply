"use server";

import { getUser } from "@civic/auth-web3/nextjs";
import { unstable_cache } from "next/cache";

interface SearchResultType {
  status: number;
  error?: string;
  data: string | null;
}

export async function getSearchResults(
  auth: string,
  location: string
): Promise<SearchResultType> {
  return unstable_cache(async () => {
    const user = await getUser();

    if (!user) {
      return {
        status: 404,
        error: "User Not Present",
        data: null,
      };
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${location}&format=json`,
        {
          signal: AbortSignal.timeout(5000),
          headers: {
            "User-Agent": "Amply-app",
          },
        }
      );

      if (!response.ok) {
        return {
          status: 504,
          error: "Unable to Reach the Api",
          data: null,
        };
      }

      const data = await response.json();

      return {
        status: 200,
        data: data,
      };
    } catch (err) {
      return {
        status: 504,
        error: "Unable to Reach the Api",
        data: null,
      };
    }
  })();
}
