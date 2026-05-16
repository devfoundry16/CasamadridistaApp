import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { MapPin, Users, X, Search } from 'lucide-react-native';
import FanClubService, { type FanClub, type FanClubCountry } from '@/services/FanClubService';
import Colors from '@/constants/colors';

interface Props {
  selectedCountry: FanClubCountry | null;
  selectedFanClub: FanClub | null;
  onCountryChange: (country: FanClubCountry | null) => void;
  onFanClubChange: (fanClub: FanClub | null) => void;
}

export default function TagPicker({ selectedCountry, selectedFanClub, onCountryChange, onFanClubChange }: Props) {
  const [modalType, setModalType]   = useState<'country' | 'fanclub' | null>(null);
  const [countries, setCountries]   = useState<FanClubCountry[]>([]);
  const [fanClubs, setFanClubs]     = useState<FanClub[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);

  const openCountry = async () => {
    setLoading(true);
    setSearch('');
    setModalType('country');
    try {
      const data = await FanClubService.getCountries();
      setCountries(data);
    } finally {
      setLoading(false);
    }
  };

  const openFanClub = async () => {
    if (!selectedCountry) return;
    setLoading(true);
    setSearch('');
    setModalType('fanclub');
    try {
      const data = await FanClubService.getClubsByCountry(selectedCountry.country);
      setFanClubs(data);
    } finally {
      setLoading(false);
    }
  };

  const close = () => { setModalType(null); setSearch(''); };

  const filteredCountries = countries.filter((c) =>
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClubs = fanClubs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-row flex-wrap px-4 gap-2 mb-2">
      {/* Country tag */}
      <TouchableOpacity
        onPress={openCountry}
        className="flex-row items-center rounded-full px-3 py-1.5"
        style={{ backgroundColor: Colors.background.medium }}
        activeOpacity={0.7}
      >
        <MapPin size={13} color={Colors.darkGold} />
        <Text className="ml-1 text-sm" style={{ color: Colors.text.primary }}>
          {selectedCountry ? selectedCountry.country : 'Tag Country'}
        </Text>
        {selectedCountry && (
          <TouchableOpacity onPress={() => { onCountryChange(null); onFanClubChange(null); }} className="ml-1">
            <X size={12} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Fan club tag */}
      {selectedCountry && (
        <TouchableOpacity
          onPress={openFanClub}
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: Colors.background.medium }}
          activeOpacity={0.7}
        >
          <Users size={13} color={Colors.darkGold} />
          <Text className="ml-1 text-sm" style={{ color: Colors.text.primary }}>
            {selectedFanClub ? selectedFanClub.name : 'Tag Fan Club'}
          </Text>
          {selectedFanClub && (
            <TouchableOpacity onPress={() => onFanClubChange(null)} className="ml-1">
              <X size={12} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={!!modalType} animationType="slide" transparent presentationStyle="overFullScreen">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-2xl pt-4 pb-8" style={{ backgroundColor: Colors.background.deepDark, maxHeight: '70%' }}>
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>
                {modalType === 'country' ? 'Select Country' : 'Select Fan Club'}
              </Text>
              <TouchableOpacity onPress={close}><X size={22} color={Colors.text.tertiary} /></TouchableOpacity>
            </View>
            <View className="flex-row items-center mx-4 mb-3 rounded-xl px-3 py-2" style={{ backgroundColor: Colors.background.medium }}>
              <Search size={16} color={Colors.text.tertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={Colors.text.tertiary}
                className="flex-1 ml-2 text-sm"
                style={{ color: Colors.text.primary }}
                autoFocus
              />
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.darkGold} className="py-8" />
            ) : (
              <FlatList
                data={modalType === 'country' ? filteredCountries : filteredClubs}
                keyExtractor={(item) => ('country' in item ? item.country : (item as FanClub).id)}
                renderItem={({ item }) =>
                  'country' in item ? (
                    <TouchableOpacity
                      onPress={() => { onCountryChange(item); onFanClubChange(null); close(); }}
                      className="px-4 py-3 border-b"
                      style={{ borderColor: Colors.border.default }}
                    >
                      <Text style={{ color: Colors.text.primary }}>{item.country}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => { onFanClubChange(item as FanClub); close(); }}
                      className="px-4 py-3 border-b"
                      style={{ borderColor: Colors.border.default }}
                    >
                      <Text style={{ color: Colors.text.primary }}>{(item as FanClub).name}</Text>
                    </TouchableOpacity>
                  )
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
