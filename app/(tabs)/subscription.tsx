import { Platform, View, Text, Button } from 'react-native';
import { useEffect, useState } from 'react';
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

//...

export default function SubscriptionsScreen() {
    const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
    useEffect(() => {
        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: 'appl_gjexmEzrmHXGjAMYVpmrYt' });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: 'goog_DxVEuQrGUEhgNWsjcJLzfuCmblL' });
        }
        getOfferings();
    }, []);

    const getCustomerInfo = async () => {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log(JSON.stringify(customerInfo, null, 2));
    }
    const handleSubscribe = async (pkg: PurchasesPackage) => {
        const customerInfo = await Purchases.purchasePackage(pkg);
        console.log(JSON.stringify(customerInfo, null, 2));
    }
    const getOfferings = async () => {
        const offerings = await Purchases.getOfferings();
        if (offerings !== null && offerings.current?.availablePackages.length !== 0) {
            setOfferings(offerings);
        }
    }
    return (
        <View>
            <Text>Subscriptions</Text>
            {offerings?.current?.availablePackages.map(pkg => (
                <View key={pkg.identifier}>
                    <View style={{ marginVertical: 10 }}>
                        <Text>{pkg.product.title}</Text>
                        <Text>{pkg.product.priceString}</Text>
                        <Text>{pkg.packageType.toLocaleLowerCase()}</Text>
                    </View>
                    <Button title="Purchase" onPress={() => handleSubscribe(pkg)} />
                </View>
            ))}
        </View>
    )
}
