import HeaderStack from "@/components/HeaderStack";
import { useEffect, useState } from "react";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import WebView from "react-native-webview";
import { StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

export default function DonateScreen() {
  const [link, setLink] = useState<any>();
  const loadDonoationForm = async () => {
    const res = await GiveWPService.getForms();
    console.log(res.forms[1].info.link);
    setLink(res.forms[1].info.link);
  };
  useEffect(() => {
    loadDonoationForm();
  }, []);
  return (
    <View style={styles.container}>
      <HeaderStack title="Donate" />
      <WebView
        source={{ uri: "https://casamadridista.com/givewp-donation-form" }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    margin: 0,
    padding: 0,
  },
  webview: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
});
