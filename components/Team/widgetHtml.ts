import Colors from "@/constants/colors";

/**
 * Shared HTML shell for api-sports widget embeds.
 *
 * Notes verified against widgets.js 3.1.0 (the bundle was downloaded and
 * grepped, not assumed):
 *  - `showError` is SINGULAR. `data-show-errors` is silently ignored.
 *  - `teamVenue` does not exist — `data-team-venue` is a dead attribute and was
 *    being passed by both existing team screens.
 *  - The bundle has no client-side cache, so every mount is a billed upstream
 *    call. Keep these behind `lazy` tabs.
 *
 * The overflow-x rules matter for gesture handling: with no horizontally
 * scrollable region inside the WebView, every horizontal pan reaches the
 * swipeable pager unambiguously. That removes the conflict rather than trying
 * to arbitrate it.
 */
function shell(lang: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      html, body {
        margin: 0;
        padding: 8px 12px;
        background: ${Colors.background.deepDark};
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }
      .widget-container, .table-widget, table, .standing-component {
        max-width: 100% !important;
        overflow-x: hidden !important;
      }
      table { table-layout: fixed; width: 100%; }
    </style>
  </head>
  <body>
${body}
    <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
  </body>
</html>`;
}

function config(apiKey: string, lang: string): string {
  return `    <api-sports-widget
      data-type="config"
      data-key="${apiKey}"
      data-sport="football"
      data-theme="grey"
      data-lang="${lang}"
      data-show-logos="true"
      data-show-toolbar="false"
      data-show-error="false"
    ></api-sports-widget>`;
}

export function teamStatisticsWidgetHtml(opts: {
  apiKey: string;
  teamId: number;
  leagueId: number;
  season: number;
  lang: string;
}): string {
  return shell(
    opts.lang,
    `${config(opts.apiKey, opts.lang)}

    <api-sports-widget
      data-type="team"
      data-team-id="${opts.teamId}"
      data-team-statistics="true"
      data-team-squad="false"
      data-team-tab="stats"
      data-league="${opts.leagueId}"
      data-season="${opts.season}"
    ></api-sports-widget>`,
  );
}
