type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
  | Record<string, any>;
const BASE_API_URL = "https://v3.football.api-sports.io/";
const fetchWithAuth = async (
    endpoint: string,
    apiKey: string,
    params?: Record<string, QueryValue>
  ): Promise<any> => {
    // build URL using the base + endpoint so we handle existing query strings correctly
    const url = new URL(endpoint, BASE_API_URL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return; // skip empty

        if (Array.isArray(value)) {
          // append multiple entries for array values
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else if (typeof value === "object") {
          // for objects, stringify
          url.searchParams.append(key, JSON.stringify(value));
        } else {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // try to include body text for easier debugging
      const text = await response.text().catch(() => "");
      throw new Error(
        `API error: ${response.status} ${response.statusText} ${text}`
      );
    }

    return response.json();
  }

  export default fetchWithAuth;
