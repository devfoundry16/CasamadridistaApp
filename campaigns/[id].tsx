import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors, {altColors as colors} from '@/constants/colors';
import { wordpressService, Campaign as WPCampaign, Donor as WPDonor } from '@/services/wordpress';
import { Lock } from 'lucide-react-native';

const DONATION_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campaign, setCampaign] = useState<WPCampaign | null>(null);
  const [donors, setDonors] = useState<WPDonor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [donating, setDonating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadCampaignData();
    }
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setError('');
      console.log('[Campaign] Loading campaign:', id);

      const campaignId = parseInt(id || '0', 10);
      if (!campaignId) {
        throw new Error('Invalid campaign ID');
      }

      const [campaignData, donorsData] = await Promise.all([
        wordpressService.getCampaign(campaignId),
        wordpressService.getDonors(campaignId),
      ]);

      console.log('[Campaign] Loaded campaign:', campaignData.title.rendered);
      console.log('[Campaign] Loaded donors:', donorsData.length);

      setCampaign(campaignData);
      setDonors(donorsData);
    } catch (err) {
      console.error('[Campaign] Error loading campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!campaign) return;

    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid donation amount');
      return;
    }

    try {
      setDonating(true);
      console.log('[Campaign] Processing donation:', amount);

      await wordpressService.createDonation({
        campaignId: campaign.id,
        amount,
        currency: campaign.acf?.currency || 'USD',
      });

      Alert.alert(
        'Thank You!',
        'Your donation has been processed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedAmount(null);
              setCustomAmount('');
              loadCampaignData();
            },
          },
        ]
      );
    } catch (err) {
      console.error('[Campaign] Donation error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process donation');
    } finally {
      setDonating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading campaign...</Text>
        </View>
      </View>
    );
  }

  if (error || !campaign) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Campaign' }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Campaign not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={loadCampaignData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const amountRaised = campaign.acf?.amount_raised || 0;
  const goalAmount = campaign.acf?.goal_amount || 1000000;
  const currency = campaign.acf?.currency || 'USD';
  const campaignImage = campaign.acf?.campaign_image || 'https://via.placeholder.com/600x300';
  const description = stripHtml(campaign.content.rendered);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: campaign.title.rendered.replace(/&#8217;/g, "'"),
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {campaign.title.rendered.replace(/&#8217;/g, "'")}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>

        <Image source={{ uri: campaignImage }} style={styles.campaignImage} />

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>AMOUNT RAISED</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(amountRaised, currency)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OUR GOAL</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(goalAmount, currency)}
            </Text>
          </View>
        </View>

        <View style={[styles.donationCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.donationTitle, { color: colors.text }]}>
            How much would you like to donate today?
          </Text>
          <Text style={[styles.donationSubtitle, { color: colors.textSecondary }]}>
            All donations directly impact our organization and help us further our mission.
          </Text>

          <Text style={[styles.amountLabel, { color: colors.text }]}>Donation Amount *</Text>
          <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>
            {currency} $
          </Text>

          <View style={styles.amountGrid}>
            {DONATION_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedAmount === amount && {
                    backgroundColor: '#C9A961',
                    borderColor: '#C9A961',
                  },
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.amountButtonText,
                    { color: colors.text },
                    selectedAmount === amount && { color: '#FFFFFF' },
                  ]}
                >
                  ${amount}.00
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              styles.customAmountInput,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Enter custom amount"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              setSelectedAmount(null);
            }}
          />

          <TouchableOpacity
            style={[
              styles.donateButton,
              { backgroundColor: '#C9A961' },
              donating && { opacity: 0.6 },
            ]}
            onPress={handleDonate}
            disabled={donating}
            activeOpacity={0.8}
          >
            {donating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.donateButtonText}>Donate now →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.secureContainer}>
            <Lock size={16} color={colors.textSecondary} />
            <Text style={[styles.secureText, { color: colors.textSecondary }]}>
              100% Secure Donation
            </Text>
          </View>
        </View>

        <View style={styles.donorsSection}>
          <Text style={[styles.donorsTitle, { color: colors.text }]}>Top Donors</Text>

          {donors.length === 0 ? (
            <View style={[styles.noDonorsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.noDonorsText, { color: colors.textSecondary }]}>
                No top donors listed yet.
              </Text>
              <Text style={[styles.noDonorsSubtext, { color: colors.textSecondary }]}>
                Be one of the first to make an impact!
              </Text>
              <TouchableOpacity
                style={[styles.firstDonorButton, { borderColor: '#C9A961' }]}
                onPress={() => {}}
              >
                <Text style={[styles.firstDonorButtonText, { color: '#C9A961' }]}>
                  Be the first donor
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            donors.map((donor) => {
              const donorName = donor.acf?.donor_name || donor.title.rendered;
              const donorAvatar = donor.acf?.donor_avatar || 'https://via.placeholder.com/50';

              return (
                <View
                  key={donor.id}
                  style={[styles.donorCard, { backgroundColor: colors.card }]}
                >
                  <Image
                    source={{ uri: donorAvatar }}
                    style={styles.donorAvatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <Text style={[styles.donorName, { color: colors.text }]}>{donorName}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  campaignImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  donationCard: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  donationSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  currencyLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  amountButton: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  customAmountInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  donateButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secureText: {
    fontSize: 12,
  },
  donorsSection: {
    padding: 20,
  },
  donorsTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  noDonorsCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDonorsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  noDonorsSubtext: {
    fontSize: 14,
    marginBottom: 20,
  },
  firstDonorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  firstDonorButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  donorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
