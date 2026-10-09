import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import FeedList from "@/components/Community/FeedList";
import FeedTabs from "@/components/Community/FeedTabs";
import ComposerRow from "@/components/Home/ComposerRow";
import ExclusiveFromMadridModule from "@/components/Home/ExclusiveFromMadridModule";
import MembershipStrip from "@/components/Home/MembershipStrip";
import StoriesRow from "@/components/Media/Stories/StoriesRow";
import UserStoriesRow from "@/components/Social/stories/UserStoriesRow";
import Colors from "@/constants/colors";
import { useIsMatchWindow } from "@/hooks/media/useMatchWindow";
import { useStories } from "@/hooks/media/useStories";
import { useUser } from "@/hooks/useUser";
import type { FeedTab } from "@/services/FeedService";

/** Home's feeds. Fan-club posts have their own tab (Fan Clubs). */
const HOME_TABS: readonly FeedTab[] = ["for-you", "reels", "trending", "recent"];

/**
 * Home is the community feed (spec 2.1.0 §03): a compact header, then the
 * posts. Match and team data live in the Team tab, so the old hero, fixture
 * block, standings and promo sections are gone.
 *
 * Everything above the posts is the list's own header, so it scrolls with
 * them and the feed is one list, not a list inside a ScrollView.
 */
export default function HomeScreen() {
  const [tab, setTab] = useState<FeedTab>("for-you");
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const { data: stories } = useStories();
  // True for a fixture within ±24h of kickoff (see the hook): match-day media
  // leads Home only then.
  const isMatchWindow = useIsMatchWindow();
  const name = [user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(" ") || null;

  const header = (
    <View>
      {isMatchWindow ? <ExclusiveFromMadridModule /> : null}
      <MembershipStrip />
      <ComposerRow />
      {/* Stories: yours and other fans' first, then Casa Media's official row,
          which is hidden entirely when there are none. */}
      <View style={{ marginTop: 8 }}>
        <UserStoriesRow viewerId={user?.id ?? null} viewerName={name} viewerAvatar={user?.profile?.avatar_url ?? null} />
        {stories?.length ? <StoriesRow groups={stories} compact /> : null}
      </View>
      <FeedTabs
        active={tab}
        onSelect={setTab}
        tabs={HOME_TABS}
        trailing={
          // People search (spec §21), signed in only: it is the Friends screen's.
          user?.id ? (
            <TouchableOpacity
              onPress={() => router.push("/social/friends?focus=search" as never)}
              accessibilityRole="button"
              accessibilityLabel={t("social.friends.searchPeople")}
              hitSlop={8}
              style={{ paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Search size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <FeedList tab={tab} header={header} />
    </View>
  );
}
