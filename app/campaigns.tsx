import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import {altColors as colors} from '@/constants/colors';
import { wordpressService, Campaign as WPCampaign, Donor as WPDonor } from '@/services/wordpress';

export default function CampaignsScreen() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<WPCampaign[]>([]);
  const [topDonors, setTopDonors] = useState<WPDonor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    try {
      setError('');
      console.log('[Campaigns] Loading campaigns and donors...');
      
      const [campaignsData, donorsData] = await Promise.all([
        wordpressService.getCampaigns({ per_page: 20 }),
        wordpressService.getDonors(),
      ]);

      console.log('[Campaigns] Loaded campaigns:', campaignsData.length);
      console.log('[Campaigns] Loaded donors:', donorsData.length);

      setCampaigns(campaignsData);
      setTopDonors(donorsData.slice(0, 10));
    } catch (err) {
      console.error('[Campaigns] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCampaignPress = (campaign: WPCampaign) => {
    console.log('[Campaigns] Opening campaign:', campaign.slug);
    //router.push({ pathname: '/campaign/[id]', params: { id: campaign.id.toString() } });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading campaigns...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Campaigns' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Active Campaigns</Text>
          
          {campaigns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.lightGray }]}>
                No active campaigns at the moment
              </Text>
            </View>
          ) : (
            campaigns.map((campaign) => {
              const amountRaised = campaign.acf?.amount_raised || 0;
              const goalAmount = campaign.acf?.goal_amount || 1000000;
              const currency = campaign.acf?.currency || 'USD';
              const avatar = campaign.acf?.campaign_avatar || 'https://via.placeholder.com/60';

              return (
                <TouchableOpacity
                  key={campaign.id}
                  style={[styles.campaignCard, { backgroundColor: colors.card }]}
                  //onPress={() => handleCampaignPress(campaign)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: avatar }}
                    style={styles.campaignAvatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.campaignInfo}>
                    <Text
                      style={[styles.campaignName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {campaign.title.rendered.replace(/&#8217;/g, "'")}
                    </Text>
                    <View style={styles.campaignStats}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          AMOUNT RAISED
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {formatCurrency(amountRaised, currency)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          OUR GOAL
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {formatCurrency(goalAmount, currency)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Top Donors</Text>
          
          {topDonors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.lightGray }]}>
                No donors yet. Be the first to make an impact!
              </Text>
            </View>
          ) : (
            topDonors.map((donor) => {
              const donorName = donor.acf?.donor_name || donor.title.rendered;
              const donorAvatar = donor.acf?.donor_avatar || 'https://via.placeholder.com/50';
              const amount = donor.acf?.donation_amount || 0;
              const currency = donor.acf?.currency || 'USD';

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
                  <View style={styles.donorInfo}>
                    <Text style={[styles.donorName, { color: colors.text }]} numberOfLines={1}>
                      {donorName}
                    </Text>
                    <Text style={[styles.donorAmount, { color: colors.textSecondary }]}>
                      {formatCurrency(amount, currency)}
                    </Text>
                  </View>
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
    padding: 16,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  campaignCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  campaignInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  donorAmount: {
    fontSize: 13,
  },
});
