import axios from "axios";

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (string | number | boolean)[]
  | Record<string, any>;

//const BASE_API_URL = "https://v3.football.api-sports.io/";

const BASE_API_URL = "http://localhost:3000/api/";

const fetchWithAuth = async (
  endpoint: string,
  apiKey: string,
  params?: Record<string, QueryValue>
): Promise<any> => {
  const url = new URL(endpoint, BASE_API_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else if (typeof value === "object") {
        url.searchParams.append(key, JSON.stringify(value));
      } else {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        "x-rapidapi-key": apiKey,
        Accept: "application/json",
      },
    });

    return response.data; // axios puts parsed JSON in `data`
  } catch (error: any) {
    if (error.response) {
      // API responded with error
      throw new Error(
        `API error: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      // no response received
      throw new Error("Network error: No response received from API");
    } else {
      // other error
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

export default fetchWithAuth;
