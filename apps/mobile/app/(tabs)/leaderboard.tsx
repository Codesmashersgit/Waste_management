import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, type Leader } from '../../utils/api';

const INK = '#102A28';
const GREEN = '#176B4D';
const LIME = '#C9F06A';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

export default function LeaderboardScreen() {
  const { t, language } = useLanguage();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaders(data.slice().sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER)));
      setError(false);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const podium = leaders.length >= 3 ? [leaders[1], leaders[0], leaders[2]] : leaders.slice(0, 3);
  const topThree = leaders.slice(0, 3);
  const totalPoints = topThree.reduce((sum, leader) => sum + leader.points, 0);
  const topLabel = error ? t('communitySubtitleUnavailable') : t('leaderboardTopSummary').replace('{count}', String(leaders.length));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>{t('communityTitle').toUpperCase()}</Text><Text style={styles.title}>{t('leaderboardTitle')}</Text></View><LanguageToggle /></View>
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <Text style={styles.heroEyebrow}>{t('leaderboardTopLabel').toUpperCase()}</Text>
          <Text style={styles.heroTitle}>{t('leaderboardHeroTitle')}</Text>
          <Text style={styles.heroHint}>{topLabel}</Text>
          {loading ? <ActivityIndicator color={LIME} style={styles.loading} /> : podium.length > 0 ? <View style={styles.podium}>
            {podium.map(person => {
              const rank = person.rank ?? leaders.indexOf(person) + 1;
              const first = rank === 1;
              return <View key={`${rank}-${person.name}`} style={[styles.podiumPerson, first && styles.podiumFirst, rank === 2 && styles.podiumSecond, rank === 3 && styles.podiumThird]}>
                {first ? <Text style={styles.crown}>✦</Text> : null}
                <View style={[styles.avatar, first && styles.avatarFirst]}><Text style={[styles.avatarText, first && styles.avatarTextFirst]}>{initials(person.name)}</Text></View>
                <Text style={styles.podiumName} numberOfLines={1}>{shortName(person.name)}</Text>
                <Text style={styles.podiumPoints}>{person.points.toLocaleString(locale)}</Text>
                <View style={[styles.rankBadge, first && styles.rankBadgeFirst]}><Text style={[styles.rankBadgeText, first && styles.rankBadgeTextFirst]}>{rank}</Text></View>
              </View>;
            })}
          </View> : <View style={styles.podiumEmpty}><Text style={styles.emptyMark}>♻</Text><Text style={styles.emptyText}>{error ? t('leaderboardFailed') : t('noActivity')}</Text></View>}
        </View>

        <View style={styles.content}>
          {topThree.length > 0 ? <View style={styles.summaryCard}><View><Text style={styles.summaryLabel}>{t('leaderboardCommunityPoints')}</Text><Text style={styles.summaryValue}>{totalPoints.toLocaleString(locale)}</Text></View><View style={styles.summaryIcon}><Text style={styles.summaryGlyph}>✦</Text></View></View> : null}
          <View style={styles.listHeading}><View><Text style={styles.sectionEyebrow}>{t('communityTitle').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('leaderboardAllTitle')}</Text></View><Text style={styles.countBadge}>{leaders.length.toLocaleString(locale)}</Text></View>
          {error ? <View style={styles.emptyCard}><Text style={styles.emptyText}>{t('leaderboardFailed')}</Text></View>
            : loading ? <View style={styles.loadingList}><ActivityIndicator color={GREEN} /></View>
              : leaders.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>{t('noActivity')}</Text></View>
                : <View style={styles.leaderList}>{leaders.map((person, index) => {
                  const rank = person.rank ?? index + 1;
                  return <View key={`${rank}-${person.name}`} style={[styles.leaderRow, rank <= 3 && styles.leaderTopRow]}>
                    <View style={[styles.rankNumber, rank === 1 && styles.rankNumberFirst]}><Text style={[styles.rankNumberText, rank === 1 && styles.rankNumberFirstText]}>{rank}</Text></View>
                    <View style={[styles.listAvatar, rank === 1 && styles.listAvatarFirst]}><Text style={styles.listAvatarText}>{initials(person.name)}</Text></View>
                    <View style={styles.leaderInfo}><Text style={styles.leaderName} numberOfLines={1}>{person.name}</Text><Text style={styles.leaderCaption}>{t('communityContributor')}</Text></View>
                    <View style={styles.pointsInfo}><Text style={styles.leaderPoints}>{person.points.toLocaleString(locale)}</Text><Text style={styles.pointsUnit}>{t('pointsShort')}</Text></View>
                  </View>;
                })}</View>}
          <Text style={styles.footerNote}>{api.isConfigured ? t('communitySubtitleLive') : t('communitySubtitleUnavailable')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'WC';
}

function shortName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  header: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.1 },
  title: { color: INK, fontFamily: FONT.bold, fontSize: 27, lineHeight: 35 },
  hero: { minHeight: 300, backgroundColor: INK, paddingHorizontal: 21, paddingTop: 19, overflow: 'hidden', borderBottomLeftRadius: 27, borderBottomRightRadius: 27 },
  heroOrb: { position: 'absolute', right: -94, top: -84, width: 220, height: 220, borderRadius: 110, backgroundColor: '#173A34' },
  heroEyebrow: { color: LIME, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 23, lineHeight: 29, marginTop: 4 },
  heroHint: { color: '#B5C5BE', fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, marginTop: 1 },
  podium: { height: 174, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginTop: 8 },
  podiumPerson: { width: '30%', alignItems: 'center', justifyContent: 'flex-start', borderTopLeftRadius: 17, borderTopRightRadius: 17, paddingTop: 11, position: 'relative', backgroundColor: 'rgba(255,255,255,.07)' },
  podiumFirst: { height: 150, backgroundColor: 'rgba(201,240,106,.13)' },
  podiumSecond: { height: 126 },
  podiumThird: { height: 112 },
  crown: { color: LIME, fontFamily: FONT.bold, fontSize: 17, position: 'absolute', top: -22 },
  avatar: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#B89070', borderWidth: 2, borderColor: 'rgba(255,255,255,.35)', alignItems: 'center', justifyContent: 'center' },
  avatarFirst: { width: 45, height: 45, borderRadius: 17, backgroundColor: '#D4B586', borderColor: LIME },
  avatarText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 12 },
  avatarTextFirst: { fontSize: 14 },
  podiumName: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 10, marginTop: 5, maxWidth: '90%' },
  podiumPoints: { color: LIME, fontFamily: FONT.bold, fontSize: 9 },
  rankBadge: { position: 'absolute', bottom: 5, width: 21, height: 21, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  rankBadgeFirst: { backgroundColor: LIME },
  rankBadgeText: { color: '#B9C9C2', fontFamily: FONT.bold, fontSize: 10 },
  rankBadgeTextFirst: { color: INK },
  podiumEmpty: { height: 150, alignItems: 'center', justifyContent: 'center', gap: 5 },
  emptyMark: { color: LIME, fontSize: 29 },
  emptyText: { color: MUTED, fontFamily: FONT.regular, fontSize: 12, textAlign: 'center' },
  loading: { marginVertical: 45 },
  content: { paddingHorizontal: 21, paddingTop: 15 },
  summaryCard: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 17, backgroundColor: '#F2F8F3', borderWidth: 1, borderColor: '#E1EEE4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: MUTED, fontFamily: FONT.medium, fontSize: 10 },
  summaryValue: { color: GREEN, fontFamily: FONT.bold, fontSize: 21, lineHeight: 27 },
  summaryIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  summaryGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 19 },
  listHeading: { marginTop: 23, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 1 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 17, lineHeight: 23 },
  countBadge: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, backgroundColor: '#DFF7E8', overflow: 'hidden', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4 },
  leaderList: { borderRadius: 18, borderWidth: 1, borderColor: '#E5E9E5', overflow: 'hidden' },
  leaderRow: { minHeight: 64, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  leaderTopRow: { backgroundColor: '#FBFCFB' },
  rankNumber: { width: 23, height: 23, borderRadius: 8, backgroundColor: '#F1F3F1', alignItems: 'center', justifyContent: 'center' },
  rankNumberFirst: { backgroundColor: LIME },
  rankNumberText: { color: MUTED, fontFamily: FONT.bold, fontSize: 10 },
  rankNumberFirstText: { color: INK },
  listAvatar: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#E6EEE8', alignItems: 'center', justifyContent: 'center' },
  listAvatarFirst: { backgroundColor: '#EAF4D2' },
  listAvatarText: { color: GREEN, fontFamily: FONT.bold, fontSize: 10 },
  leaderInfo: { flex: 1, minWidth: 0 },
  leaderName: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  leaderCaption: { color: MUTED, fontFamily: FONT.regular, fontSize: 9 },
  pointsInfo: { alignItems: 'flex-end' },
  leaderPoints: { color: GREEN, fontFamily: FONT.bold, fontSize: 12 },
  pointsUnit: { color: MUTED, fontFamily: FONT.regular, fontSize: 9 },
  emptyCard: { minHeight: 90, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F4', borderRadius: 16, padding: 16 },
  loadingList: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  footerNote: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 14 },
});
