import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Trash2, UserPlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import SuperAdminService, {
  AdminAssignment,
  AdminFanClub,
  UserSearchResult,
} from '@/services/SuperAdminService';

type Tab = 'admins' | 'clubs';

export default function AdminPanelScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('admins');

  // --- Admins tab state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [admins, setAdmins] = useState<AdminAssignment[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [fanClubs, setFanClubs] = useState<AdminFanClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // --- Clubs tab state ---
  const [editingClub, setEditingClub] = useState<string | null>(null);
  const [revenueInput, setRevenueInput] = useState('');
  const [isSavingClub, setIsSavingClub] = useState(false);

  const loadAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      const data = await SuperAdminService.listAdmins();
      setAdmins(data);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Unknown error';
      Alert.alert('Failed to load admins', msg);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  const loadFanClubs = useCallback(async () => {
    try {
      const data = await SuperAdminService.listFanClubs();
      setFanClubs(data);
      if (data.length > 0) setSelectedClubId(prev => prev || data[0].id);
    } catch {
      Alert.alert('Error', 'Failed to load fan clubs');
    }
  }, []);

  useEffect(() => {
    loadAdmins();
    loadFanClubs();
  }, [loadAdmins, loadFanClubs]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const results = await SuperAdminService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch {
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedClubId) {
      Alert.alert('Error', 'Select a user and a fan club first');
      return;
    }
    setIsAssigning(true);
    try {
      await SuperAdminService.assignAdmin(selectedUser.id, selectedClubId);
      Alert.alert('Success', `${selectedUser.email} assigned as admin`);
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery('');
      await loadAdmins();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Assignment failed';
      Alert.alert('Error', msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAdmin = (admin: AdminAssignment) => {
    Alert.alert(
      'Remove Admin',
      `Remove ${admin.user_profiles.email} from ${admin.fan_clubs.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SuperAdminService.removeAdmin(admin.user_id);
              await loadAdmins();
            } catch {
              Alert.alert('Error', 'Failed to remove admin');
            }
          },
        },
      ]
    );
  };

  const handleSaveRevenue = async (club: AdminFanClub) => {
    const pct = parseFloat(revenueInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Error', 'Enter a valid percentage between 0 and 100');
      return;
    }
    setIsSavingClub(true);
    try {
      const updated = await SuperAdminService.updateFanClub(club.id, pct);
      setFanClubs(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setEditingClub(null);
    } catch {
      Alert.alert('Error', 'Failed to update revenue percentage');
    } finally {
      setIsSavingClub(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-medium"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Super Admin Panel</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-bg-card mx-4 mt-4 rounded-xl overflow-hidden">
        {(['admins', 'clubs'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            className={`flex-1 py-3 items-center ${tab === t ? 'bg-rm-gold' : ''}`}
            onPress={() => setTab(t)}
          >
            <Text className={`font-semibold ${tab === t ? 'text-white' : 'text-text-secondary'}`}>
              {t === 'admins' ? 'Assign Admins' : 'Revenue %'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'admins' ? (
        <ScrollView className="flex-1 px-4 mt-4" keyboardShouldPersistTaps="handled">
          {/* Search */}
          <Text className="text-text-primary font-semibold mb-2">Search User</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 bg-bg-card text-text-primary rounded-xl px-4 py-3"
              placeholder="Email or name..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              className="bg-rm-gold rounded-xl px-4 items-center justify-center"
              onPress={handleSearch}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Search size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View className="bg-bg-card rounded-xl mb-4 overflow-hidden">
              {searchResults.map(user => (
                <TouchableOpacity
                  key={user.id}
                  className={`px-4 py-3 border-b border-border-default ${selectedUser?.id === user.id ? 'bg-rm-gold/20' : ''}`}
                  onPress={() => setSelectedUser(user)}
                >
                  <Text className="text-text-primary font-medium">{user.email}</Text>
                  {(user.first_name || user.last_name) && (
                    <Text className="text-text-secondary text-sm">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedUser && (
            <View className="bg-bg-card rounded-xl p-4 mb-4">
              <Text className="text-text-primary font-semibold mb-1">
                Selected: {selectedUser.email}
              </Text>
              <Text className="text-text-secondary text-sm mb-3">Assign to fan club:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                {fanClubs.map(club => (
                  <TouchableOpacity
                    key={club.id}
                    className={`mr-2 px-3 py-2 rounded-xl border ${selectedClubId === club.id ? 'border-rm-gold bg-rm-gold/20' : 'border-border-default bg-bg-light'}`}
                    onPress={() => setSelectedClubId(club.id)}
                  >
                    <Text className="text-text-primary text-sm font-medium">{club.name}</Text>
                    <Text className="text-text-secondary text-xs">{club.country}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                className={`bg-rm-gold rounded-xl py-3 items-center flex-row justify-center gap-2 ${isAssigning ? 'opacity-60' : ''}`}
                onPress={handleAssign}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <UserPlus size={18} color="#fff" />
                )}
                <Text className="text-white font-bold">Assign as Admin</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Admins */}
          <Text className="text-text-primary font-semibold mb-2">Current Admins</Text>
          {isLoadingAdmins ? (
            <ActivityIndicator color={Colors.darkGold} className="my-4" />
          ) : admins.length === 0 ? (
            <Text className="text-text-secondary text-center my-4">No admins assigned yet</Text>
          ) : (
            admins.map(admin => (
              <View key={admin.user_id} className="bg-bg-card rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-text-primary font-medium">{admin.user_profiles.email}</Text>
                  <Text className="text-text-secondary text-sm">
                    {admin.fan_clubs.name} · {admin.fan_clubs.country}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveAdmin(admin)}>
                  <Trash2 size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      ) : (
        <FlatList
          data={fanClubs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View className="bg-bg-card rounded-xl px-4 py-3 mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-1 mr-2">
                  <Text className="text-text-primary font-semibold">{item.name}</Text>
                  <Text className="text-text-secondary text-sm">{item.country}</Text>
                </View>
                {editingClub === item.id ? (
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="bg-bg-light text-text-primary rounded-lg px-3 py-1 w-16 text-center"
                      value={revenueInput}
                      onChangeText={setRevenueInput}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <Text className="text-text-secondary">%</Text>
                    <TouchableOpacity
                      className={`bg-rm-gold rounded-lg px-3 py-1 ${isSavingClub ? 'opacity-60' : ''}`}
                      onPress={() => handleSaveRevenue(item)}
                      disabled={isSavingClub}
                    >
                      <Text className="text-white font-bold">Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingClub(null)}>
                      <Text className="text-text-secondary">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="bg-bg-light rounded-lg px-3 py-1"
                    onPress={() => {
                      setEditingClub(item.id);
                      setRevenueInput(String(item.revenue_percentage));
                    }}
                  >
                    <Text className="text-rm-gold font-bold">{item.revenue_percentage}%</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-text-secondary text-xs">
                Wallet: ${Number(item.wallet_balance).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}
