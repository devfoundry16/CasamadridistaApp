import CustomWebView from "@/components/CustomWebView";
import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

const MatchDetailScreen = () => {
  const { id } = useLocalSearchParams();
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
                          data-key="2efab6a210831868664529f16d897809"
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
      <HeaderStack title="Match Details" />
      <View style={styles.container}>
      <CustomWebView size={800} title="Match Details" statsHtml={statsHtml} />
    </View>
    </>
    
  );
};

export default MatchDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
});
