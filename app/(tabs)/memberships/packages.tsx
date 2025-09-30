import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { Check } from 'lucide-react-native';

const packages = [
  {
    id: 1,
    name: 'Basic',
    price: '$9.99',
    period: 'per month',
    features: [
      'Access to news and updates',
      'Photo gallery access',
      'Community forum',
      'Email support',
    ],
  },
  {
    id: 2,
    name: 'Premium',
    price: '$19.99',
    period: 'per month',
    features: [
      'All Basic features',
      'Exclusive content',
      'Live match updates',
      'Priority support',
      'Member badge',
    ],
    popular: true,
  },
  {
    id: 3,
    name: 'VIP',
    price: '$49.99',
    period: 'per month',
    features: [
      'All Premium features',
      'VIP events access',
      'Meet & greet opportunities',
      'Exclusive merchandise',
      'Personal account manager',
    ],
  },
];

export default function PackagesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Choose Your Membership Package</Text>
        <Text style={styles.subheader}>
          Join Casa Madridista and get exclusive access to Real Madrid content
        </Text>

        {packages.map((pkg) => (
          <View key={pkg.id} style={[styles.card, pkg.popular && styles.popularCard]}>
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <Text style={styles.packageName}>{pkg.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{pkg.price}</Text>
              <Text style={styles.period}>{pkg.period}</Text>
            </View>
            <View style={styles.featuresContainer}>
              {pkg.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Check size={20} color={Colors.accent} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.button, pkg.popular && styles.popularButton]}>
              <Text style={[styles.buttonText, pkg.popular && styles.popularButtonText]}>
                Select Plan
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subheader: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  popularCard: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -12,
    left: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  packageName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.royalBlue,
    marginRight: 8,
  },
  period: {
    fontSize: 14,
    color: Colors.textLight,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  popularButton: {
    backgroundColor: Colors.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
  popularButtonText: {
    color: Colors.secondary,
  },
});
