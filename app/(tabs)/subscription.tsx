import { Platform, View, Text } from 'react-native';
import { useEffect } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

//...

export default function SubscriptionsScreen() {

  useEffect(() => { 
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === 'ios') {
       Purchases.configure({apiKey: 'appl_gjexmEzrmHXGjAMYVpmrYt'});
    } else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: 'goog_DxVEuQrGUEhgNWsjcJLzfuCmblL'});
    }
    getCustomerInfo();
  }, []);

  const getCustomerInfo = async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log(customerInfo);
  }

  return (
    <View>
      <Text>Subscriptions</Text>
    </View>
  )
}