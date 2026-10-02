import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/colors';
import { profileTabs, type ProfileTab } from '@/utils/profileGrid.core';
import SegmentTab from './SegmentTab';

interface Props {
  active: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  /** Saved is shown on your own profile only. */
  isSelf: boolean;
  /** Media is shown on a Casa Media contributor's profile only. */
  isContributor?: boolean;
}

/** Posts | Videos | Tagged, plus Media for a contributor and Saved on your own. */
export default function ProfileTabs({ active, onSelect, isSelf, isContributor = false }: Props) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {profileTabs(isSelf, isContributor).map((tab) => (
        <SegmentTab key={tab} label={t(`social.profile.tabs.${tab}`)} on={tab === active} onPress={() => onSelect(tab)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});
