import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, type Transaction, type WasteReport } from '../../utils/api';
import { reportDate } from '../../utils/impact';

type FeedCategory = 'all' | 'activity' | 'rewards';
type FeedItem = { id: string; category: Exclude<FeedCategory, 'all'>; title: string; detail: string; date: Date | null; amount?: number; icon: string; tone: 'green' | 'amber' | 'blue'; target: '/(tabs)/nearby' | '/(tabs)/collect' | '/(tabs)/rewards' };

const INK = '#102A28';
const GREEN = '#176B4D';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold' } as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FeedCategory>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextReports, rewards] = await Promise.all([
        userRole === 'collector' ? api.getTasks() : api.getReports(),
        api.getRewards(),
      ]);
      setReports(nextReports);
      setTransactions(rewards.transactions);
      setFailed(false);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, [userRole]);

  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const items = useMemo<FeedItem[]>(() => {
    const rewardItems: FeedItem[] = transactions.map(transaction => {
      const parsedDate = new Date(transaction.date);
      return {
        id: `reward-${transaction.id}`,
        category: 'rewards',
        title: transaction.description,
        detail: `${transaction.amount > 0 ? '+' : ''}${transaction.amount.toLocaleString(locale)} ${t('pointsShort')}`,
        date: Number.isNaN(parsedDate.getTime()) ? null : parsedDate,
        amount: transaction.amount,
        icon: transaction.amount >= 0 ? '⊕' : '↘',
        tone: 'amber',
        target: '/(tabs)/rewards',
      };
    });
    const reportItems: FeedItem[] = reports.map(report => {
      const completed = report.status === 'collected' || report.status === 'sold';
      const assigned = report.status === 'assigned';
      const status = t(report.status === 'sold' ? 'soldStatus' : completed ? 'collectedStatus' : assigned ? 'assignedStatus' : 'pendingStatus');
      const details = [report.location, report.wasteType, report.amount, report.collectorName].filter(Boolean).join(' · ');
      return {
        id: `report-${report.id}`,
        category: 'activity',
        title: completed ? t('collectionCompleted') : assigned ? t('assignedStatus') : t('reportSubmitted'),
        detail: `${status} · ${details}`,
        date: reportDate(report),
        icon: completed ? '✓' : assigned ? '↗' : '⌖',
        tone: completed ? 'green' : 'blue',
        target: userRole === 'collector' ? '/(tabs)/collect' : '/(tabs)/nearby',
      };
    });
    return [...rewardItems, ...reportItems].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  }, [locale, reports, t, transactions, userRole]);
  const visibleItems = filter === 'all' ? items : items.filter(item => item.category === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('authBack')}><Text style={styles.backGlyph}>‹</Text></TouchableOpacity>
          <View style={styles.headerTitle}><Text style={styles.eyebrow}>{t('accountUpdates').toUpperCase()}</Text><Text style={styles.title}>{t('notificationsTitle')}</Text></View>
          <LanguageToggle />
        </View>
        <Text style={styles.subtitle}>{t('notificationsSubtitle')}</Text>

        <View style={styles.filters}>
          {(['all', 'activity', 'rewards'] as const).map(category => <TouchableOpacity key={category} onPress={() => setFilter(category)} style={[styles.filterButton, filter === category && styles.filterActive]} accessibilityRole="button" accessibilityState={{ selected: filter === category }}><Text style={[styles.filterText, filter === category && styles.filterTextActive]}>{t(category === 'all' ? 'allUpdates' : category === 'activity' ? 'activity' : 'rewards')}</Text>{category === 'all' ? <Text style={[styles.filterCount, filter === category && styles.filterCountActive]}>{items.length}</Text> : null}</TouchableOpacity>)}
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('recentActivity')}</Text><Text style={styles.resultCount}>{visibleItems.length.toLocaleString(locale)}</Text></View>
        {loading ? <View style={styles.stateCard}><ActivityIndicator color={GREEN} /><Text style={styles.stateText}>{t('loadingReports')}</Text></View>
          : failed && items.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>{t('updatesUnavailable')}</Text><Text style={styles.stateText}>{t('nearbyUnavailableHint')}</Text></View>
            : visibleItems.length === 0 ? <View style={styles.stateCard}><View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>✓</Text></View><Text style={styles.stateTitle}>{t('noUpdatesYet')}</Text><Text style={styles.stateText}>{t('updatesWillAppear')}</Text></View>
              : <View style={styles.feedList}>{visibleItems.map(item => <TouchableOpacity key={item.id} style={styles.feedRow} onPress={() => router.push(item.target)} activeOpacity={0.75} accessibilityRole="button">
                <View style={[styles.feedIcon, item.tone === 'green' ? styles.toneGreen : item.tone === 'amber' ? styles.toneAmber : styles.toneBlue]}><Text style={[styles.feedGlyph, item.tone === 'green' ? styles.glyphGreen : item.tone === 'amber' ? styles.glyphAmber : styles.glyphBlue]}>{item.icon}</Text></View>
                <View style={styles.feedCopy}><Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.feedDetail} numberOfLines={2}>{item.detail}</Text><Text style={styles.feedTime}>{item.date ? item.date.toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : t('recentActivity')}</Text></View>
                <Text style={styles.feedArrow}>›</Text>
              </TouchableOpacity>)}</View>}
        {failed && items.length > 0 ? <Text style={styles.inlineError}>{t('updatesRefreshFailed')}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 32 },
  header: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#F3F5F2', alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: INK, fontFamily: FONT.medium, fontSize: 33, lineHeight: 38, marginTop: -4 },
  headerTitle: { flex: 1 },
  eyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 1.05 },
  title: { color: INK, fontFamily: FONT.bold, fontSize: 22, lineHeight: 28 },
  subtitle: { color: MUTED, fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 17 },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  filterButton: { minHeight: 37, paddingHorizontal: 13, borderRadius: 13, backgroundColor: '#F3F5F2', flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterActive: { backgroundColor: INK },
  filterText: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  filterTextActive: { color: '#FFFFFF' },
  filterCount: { color: GREEN, backgroundColor: '#DFF7E8', fontFamily: FONT.bold, fontSize: 9, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
  filterCountActive: { color: INK, backgroundColor: '#C9F06A' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 17 },
  resultCount: { color: GREEN, fontFamily: FONT.bold, fontSize: 10 },
  feedList: { borderTopWidth: 1, borderTopColor: '#E5E9E5' },
  feedRow: { minHeight: 82, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#E5E9E5' },
  feedIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toneGreen: { backgroundColor: '#DFF7E8' },
  toneAmber: { backgroundColor: '#FFF0D6' },
  toneBlue: { backgroundColor: '#E7EFFF' },
  feedGlyph: { fontFamily: FONT.bold, fontSize: 18 },
  glyphGreen: { color: GREEN },
  glyphAmber: { color: '#A86E19' },
  glyphBlue: { color: '#376CCA' },
  feedCopy: { flex: 1, minWidth: 0 },
  feedTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  feedDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15, marginTop: 1 },
  feedTime: { color: '#98A19D', fontFamily: FONT.regular, fontSize: 9, marginTop: 3 },
  feedArrow: { color: '#89958E', fontFamily: FONT.medium, fontSize: 23 },
  stateCard: { minHeight: 155, padding: 22, borderRadius: 18, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center', gap: 7 },
  stateTitle: { color: INK, fontFamily: FONT.bold, fontSize: 13, textAlign: 'center' },
  stateText: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  emptyIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  emptyGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 20 },
  inlineError: { color: '#9B5A1A', fontFamily: FONT.medium, fontSize: 10, marginTop: 10, textAlign: 'center' },
});
