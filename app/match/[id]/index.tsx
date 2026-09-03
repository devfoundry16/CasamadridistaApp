import CustomWebView from "@/components/CustomWebView";
import WatchExclusiveBanner from "@/components/Media/Match/WatchExclusiveBanner";
import { isFinishedStatus } from "@/components/Media/Match/MatchIdentityStrip";
import { useMatchMedia } from "@/hooks/media/useMatchMedia";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

const MatchDetailScreen = () => {
  // Global, not local. `[id]` is a segment of the parent route, and each tab
  // child carries only the params of the URL that actually addressed it: enter
  // at `/match/123/media` (which is what the archive card pushes) and this
  // lazily-mounted sibling receives no `id` at all. The widget below then asks
  // API-Sports for game `undefined`, never gets an answer, and the WebView sits
  // on its startInLoadingState spinner forever — while the identity strip above
  // looks perfectly fine, because that is rendered by the layout, which reads
  // its own params. The layout hit the same scoping trap with `tab`.
  const { id } = useGlobalSearchParams();
  const router = useRouter();
  const { apiSports } = useEnvironment();

  // Same query key the layout already populated — this is a cache read, not a
  // second request.
  const matchId = Number.parseInt(String(id ?? ""), 10);
  const { data } = useMatchMedia(Number.isFinite(matchId) ? matchId : undefined);
  const firstPage = data?.pages[0];
  const mediaCount = data?.pages.reduce((sum, page) => sum + page.items.length, 0) ?? 0;
  const showBanner = isFinishedStatus(firstPage?.match?.status_short) && mediaCount > 0;

  const statsHtml = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          body {
                            margin: 0;
                            padding: 0;
                            background-color: transparent;
                          }
                          api-sports-widget {
                            background-color: none;
                          }
                        </style>
                      </head>
                      <body>
                        <api-sports-widget
                          data-type="config"
                          data-key="${apiSports.apiKey || ""}"
                          data-sport="football"
                          data-theme="grey"
                          data-show-logos="true"
                        ></api-sports-widget>

                        <api-sports-widget
                        data-type="game"
                        data-game-id=${id}
                        data-quarters="true"
                        data-game-tab="statistics"
                        ></api-sports-widget>
                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;
  return (
    <>
      <View className="flex-1 bg-bg-medium h-full">
        {showBanner ? (
          <WatchExclusiveBanner
            count={mediaCount}
            onPress={() =>
              router.push({ pathname: "/match/[id]/media", params: { id: String(id) } })
            }
          />
        ) : null}
        <CustomWebView size={800} statsHtml={statsHtml} />
      </View>
    </>
  );
};

export default MatchDetailScreen;
