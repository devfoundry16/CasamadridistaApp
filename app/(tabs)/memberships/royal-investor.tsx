import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { Crown, TrendingUp, Users, Award } from 'lucide-react-native';

const benefits = [
  {
    icon: Crown,
    title: 'Exclusive Access',
    description: 'VIP access to all club events and facilities',
  },
  {
    icon: TrendingUp,
    title: 'Investment Returns',
    description: 'Share in club success and revenue growth',
  },
  {
    icon: Users,
    title: 'Network',
    description: 'Connect with elite investors and club management',
  },
  {
    icon: Award,
    title: 'Recognition',
    description: 'Special recognition at Santiago Bernabéu',
  },
];

export default function RoyalInvestorScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Crown size={48} color={Colors.accent} />
          <Text style={styles.title}>Royal Investor Program</Text>
          <Text style={styles.subtitle}>
            Join an elite group of investors supporting Real Madrid's legacy
          </Text>
        </View>

        <View style={styles.investmentCard}>
          <Text style={styles.cardTitle}>Investment Opportunity</Text>
          <Text style={styles.investmentAmount}>Starting at €100,000</Text>
          <Text style={styles.investmentDescription}>
            Become a part of Real Madrid's future and enjoy exclusive benefits reserved for our most valued supporters.
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Investor Benefits</Text>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.iconContainer}>
                  <Icon size={24} color={Colors.accent} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Invest?</Text>
          <Text style={styles.ctaDescription}>
            Contact our investment team to learn more about this exclusive opportunity.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Request Information</Text>
          </TouchableOpacity>
        </View>
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
  heroSection: {
    alignItems: 'center' as const,
    marginBottom: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  investmentCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 12,
  },
  investmentAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 12,
  },
  investmentDescription: {
    fontSize: 14,
    color: Colors.textWhite,
    lineHeight: 22,
    opacity: 0.9,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 16,
  },
  benefitCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.secondary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
});
