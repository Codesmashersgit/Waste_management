import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type MessageKey } from '../contexts/LanguageContext';
import { api, type Transaction, type WasteReport } from '../utils/api';
import { collectedKilograms, completedReportStreak, reportDate } from '../utils/impact';

const INK = '#102A28';
const GREEN = '#176B4D';
const LIME = '#C9F06A';
const MUTED = '#728078';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

function monthRange(now: Date) {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
  };
}

function readableDate(raw: string | undefined, locale: string, fallback: string) {
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default function CitizenDashboard() {
  const { userName, userId } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [points, setPoints] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [scrollY] = useState(() => new Animated.Value(0));
  const [heroExpandedHeight, setHeroExpandedHeight] = useState(0);
  const [heroIntroHeight, setHeroIntroHeight] = useState(0);

  const loadData = useCallback(async () => {
    if (!api.isConfigured || userId === null) return;
    try {
      const [nextReports, rewards] = await Promise.all([api.getReports(), api.getRewards()]);
      setReports(nextReports);
      setTransactions(rewards.transactions);
      setPoints(rewards.balance);
      setLoadFailed(false);
    } catch (error) {
      console.warn('Could not refresh the citizen dashboard:', error instanceof Error ? error.message : 'unknown error');
      setLoadFailed(true);
    }
  }, [userId]);

  useEffect(() => {
    const initial = setTimeout(() => void loadData(), 0);
    const poll = setInterval(() => void loadData(), 15000);
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => { clearTimeout(initial); clearInterval(poll); clearInterval(timer); };
  }, [loadData]);

  const now = clock;
  const { start, end, previousStart } = monthRange(now);
  const monthKg = collectedKilograms(reports, start, end);
  const previousKg = collectedKilograms(reports, previousStart, start);
  const goalKg = 25;
  const progress = monthKg === null ? 0 : Math.min(100, Math.round(monthKg / goalKg * 100));
  const streak = completedReportStreak(reports, now);
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const dateLabel = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = now.getHours() < 12 ? t('goodMorning') : now.getHours() < 17 ? t('goodAfternoon') : t('goodEvening');
  const firstName = userName?.trim().split(/\s+/)[0] || t('friend');
  const latestReport = reports[0];
  const goalCaption = `${now.toLocaleDateString(locale, { month: 'long' })} ${t('goal')}`;
  const completedReports = reports.filter(report => report.status === 'collected' || report.status === 'sold');
  const displayKg = monthKg === null ? '—' : monthKg.toLocaleString(locale, { maximumFractionDigits: 1 });
  const percentChange = monthKg !== null && previousKg !== null && previousKg > 0
    ? Math.round((monthKg - previousKg) / previousKg * 100)
    : null;
  const headerHeight = heroExpandedHeight > 0 && heroIntroHeight > 0
    ? scrollY.interpolate({
      inputRange: [0, heroIntroHeight],
      outputRange: [heroExpandedHeight, heroExpandedHeight - heroIntroHeight],
      extrapolate: 'clamp',
    })
    : undefined;
  const introHeight = heroIntroHeight > 0
    ? scrollY.interpolate({ inputRange: [0, heroIntroHeight], outputRange: [heroIntroHeight, 0], extrapolate: 'clamp' })
    : undefined;
  const introOpacity = heroIntroHeight > 0
    ? scrollY.interpolate({ inputRange: [0, heroIntroHeight * 0.72], outputRange: [1, 0], extrapolate: 'clamp' })
    : 1;
  const compactMetricsOpacity = heroIntroHeight > 0
    ? scrollY.interpolate({ inputRange: [0, heroIntroHeight * 0.8], outputRange: [0, 1], extrapolate: 'clamp' })
    : 0;
  const expandedMetricsOpacity = heroIntroHeight > 0
    ? scrollY.interpolate({ inputRange: [0, heroIntroHeight * 0.8], outputRange: [1, 0], extrapolate: 'clamp' })
    : 1;
  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }),
    [scrollY],
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openNotifications = () => router.push('/(tabs)/notifications' as Href);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          setHeroExpandedHeight(current => current === 0 ? height : current);
        }}
        style={[styles.heroShell, headerHeight ? { height: headerHeight } : null]}
      >
      <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <Animated.View
            onLayout={event => {
              const height = event.nativeEvent.layout.height;
              setHeroIntroHeight(current => current === 0 ? height : current);
            }}
            style={[styles.heroIntro, introHeight ? { height: introHeight, opacity: introOpacity } : null]}
          >
          <View style={styles.topRow}>
            <Text style={styles.date}>{dateLabel}</Text>
            <TouchableOpacity style={styles.avatarButton} onPress={openNotifications} accessibilityRole="button" accessibilityLabel={t('notificationsTitle')}>
              <Text style={styles.avatarText}>{userName?.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'WC'}</Text>
              <View style={styles.avatarLeaf}><Text style={styles.avatarLeafText}>✦</Text></View>
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>{greeting}, {firstName}</Text>
          </Animated.View>

          <View style={styles.heroDetails}>
          <Animated.View style={{ opacity: expandedMetricsOpacity }}>
          <View style={styles.impactRow}>
            <View style={[styles.progressRing, {
              borderTopColor: progress > 0 ? LIME : '#48625B',
              borderRightColor: progress > 25 ? LIME : '#48625B',
              borderBottomColor: progress > 50 ? LIME : '#48625B',
              borderLeftColor: progress > 75 ? LIME : '#48625B',
            }]} accessibilityLabel={`${progress}% ${goalCaption}`}>
              <View style={styles.progressTrack}>
                <Text style={styles.progressNumber}>{progress}%</Text>
                <Text style={styles.progressCaption}>{goalCaption}</Text>
              </View>
            </View>
            <View style={styles.monthImpact}>
              <Text style={styles.monthEyebrow}>{t('impactThisMonth')}</Text>
              <View style={styles.kgRow}>
                <Text style={styles.kgNumber}>{displayKg}</Text>
                <Text style={styles.kgUnit}>kg</Text>
              </View>
              <Text style={styles.changeText}>
                {percentChange !== null ? `${percentChange >= 0 ? '↑' : '↓'} ${Math.abs(percentChange)}% ${t('vsLastMonth')}` : t('monthlyGoalLine').replace('{goal}', String(goalKg))}
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={styles.statIconCircle}><Text style={styles.statGlyph}>⊕</Text></View>
              <View>
                <Text style={styles.statValue}>{points === null ? '—' : points.toLocaleString(locale)}</Text>
                <Text style={styles.statLabel}>{t('impactPoints')}</Text>
              </View>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.heroStat}>
              <Text style={styles.streakGlyph}>✣</Text>
              <View>
                <Text style={styles.statValue}>{streak} {t('days')}</Text>
                <Text style={styles.statLabel}>{t('currentStreak')}</Text>
              </View>
            </View>
          </View>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.compactMetrics, { opacity: compactMetricsOpacity }]}>
            <View style={styles.compactImpactColumn}>
              <View style={[styles.compactProgressRing, {
                borderTopColor: progress > 0 ? LIME : '#48625B',
                borderRightColor: progress > 25 ? LIME : '#48625B',
                borderBottomColor: progress > 50 ? LIME : '#48625B',
                borderLeftColor: progress > 75 ? LIME : '#48625B',
              }]}>
                <View style={styles.compactProgressTrack}>
                  <Text style={styles.compactProgressNumber}>{progress}%</Text>
                  <Text style={styles.compactProgressCaption}>{goalCaption}</Text>
                </View>
              </View>
              <View style={styles.compactMonthImpact}>
                <Text style={styles.compactMonthLabel}>{t('impactThisMonth')}</Text>
                <View style={styles.kgRow}>
                  <Text style={styles.compactKgNumber}>{displayKg}</Text>
                  <Text style={styles.compactKgUnit}>kg</Text>
                </View>
                <Text style={styles.compactChangeText} numberOfLines={1}>
                  {percentChange !== null ? `${percentChange >= 0 ? '↑' : '↓'} ${Math.abs(percentChange)}% ${t('vsLastMonth')}` : t('monthlyGoalLine').replace('{goal}', String(goalKg))}
                </Text>
              </View>
            </View>

            <View style={styles.compactStatsColumn}>
              <View style={styles.compactStat}>
                <Text style={styles.compactStatIcon}>paid</Text>
                <View style={styles.compactStatCopy}>
                  <Text style={styles.compactStatValue}>{points === null ? '—' : points.toLocaleString(locale)}</Text>
                  <Text style={styles.compactStatLabel}>{t('impactPoints')}</Text>
                </View>
              </View>
              <View style={styles.compactStatDivider} />
              <View style={styles.compactStat}>
                <Text style={styles.compactStatIcon}>local_fire_department</Text>
                <View style={styles.compactStatCopy}>
                  <Text style={styles.compactStatValue}>{streak} {t('days')}</Text>
                  <Text style={styles.compactStatLabel}>{t('currentStreak')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
          </View>
        </View>
      </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: heroExpandedHeight || 360 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TouchableOpacity style={styles.reportBanner} onPress={() => router.push('/(tabs)/report')} activeOpacity={0.86} accessibilityRole="button">
          <View style={styles.cameraTile}><Text style={styles.cameraGlyph}>photo_camera</Text></View>
          <View style={styles.reportCopy}>
            <Text style={styles.reportTitle}>{t('reportWaste')}</Text>
            <Text style={styles.reportHint}>{t('reportAIHint')}</Text>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.eyebrow}>{t('aroundYou').toUpperCase()}</Text>
            <Text style={styles.sectionTitle}>{t('makeImpactNearby')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/nearby')} accessibilityRole="button">
            <Text style={styles.linkText}>{t('viewMap')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nearbyCard} onPress={() => router.push('/(tabs)/nearby')} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t('viewMap')}>
          <View style={styles.mapArtwork}>
            <View style={styles.mapRoadOne} />
            <View style={styles.mapRoadTwo} />
            <View style={styles.mapRoadThree} />
            <View style={styles.mapPark} />
            <View style={styles.mapPin}><Text style={styles.mapPinText}>♻</Text></View>
          </View>
          <View style={styles.nearbyDetails}>
            <View style={styles.nearbyMetaRow}>
              <View style={styles.wastePill}><Text style={styles.wastePillText}>{latestReport?.wasteType?.toUpperCase() || t('yourImpact')}</Text></View>
              <Text style={styles.nearbyDistance}>{latestReport ? `#${latestReport.id}` : t('nearby')}</Text>
            </View>
            <Text style={styles.nearbyName} numberOfLines={1}>{latestReport?.location || t('noReportYet')}</Text>
            <Text style={styles.nearbySub} numberOfLines={1}>{latestReport ? `${latestReport.amount} · ${t(latestReport.status === 'collected' || latestReport.status === 'sold' ? 'collectedStatus' : latestReport.status === 'assigned' ? 'assignedStatus' : 'pendingStatus')}` : t('nearbyCardHint')}</Text>
            <Text style={styles.nearbyPoints}>{latestReport ? `●  ${t('collector')}: ${latestReport.collectorName || t('findingCollector')}` : `＋  ${t('reports')}: ${reports.length}`}</Text>
          </View>
        </TouchableOpacity>

        {/* 🔔 ACTIVE COMPLAINT STATUS SECTION */}
        {reports.filter(r => r.status === 'pending' || r.status === 'assigned').length > 0 && (
          <View style={{ marginTop: 20, marginBottom: 4 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>📬 Aapki Active Complaints</Text>
            {reports.filter(r => r.status === 'pending' || r.status === 'assigned').slice(0, 3).map(report => {
              const isPending = report.status === 'pending';
              const isAssigned = report.status === 'assigned';
              const bgColor = isPending ? '#FFF7E6' : '#ECFDF5';
              const borderColor = isPending ? '#F59E0B' : '#10B981';
              const badgeColor = isPending ? '#D97706' : '#059669';
              const badgeBg = isPending ? '#FEF3C7' : '#D1FAE5';
              const emoji = isPending ? '🔍' : '🚛';
              const statusText = isPending ? 'Collector Dhundh Raha Hai...' : `Collector Aa Raha Hai!`;
              const collectorInfo = isAssigned && report.collectorName ? `👷 ${report.collectorName}${report.collectorPhone ? ` · 📞 ${report.collectorPhone}` : ''}` : null;
              return (
                <View key={report.id} style={{ backgroundColor: bgColor, borderRadius: 14, borderWidth: 1.5, borderColor, padding: 14, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 }}>
                        {emoji} #{report.id} · {report.wasteType}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>📍 {report.location}</Text>
                      <Text style={{ fontSize: 12, color: '#555' }}>⚖️ {report.amount}</Text>
                      {collectorInfo && (
                        <Text style={{ fontSize: 12, color: '#065f46', fontWeight: '600', marginTop: 6 }}>{collectorInfo}</Text>
                      )}
                    </View>
                    <View style={{ backgroundColor: badgeBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: badgeColor }}>{isPending ? 'PENDING' : 'ASSIGNED'}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: badgeColor, fontWeight: '600', marginTop: 8 }}>{statusText}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recently collected — show success message */}
        {reports.filter(r => r.status === 'collected' || r.status === 'sold').slice(0, 1).map(report => (
          <View key={`done-${report.id}`} style={{ backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1.5, borderColor: '#3B82F6', padding: 14, marginBottom: 10, marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e40af' }}>
              {report.status === 'sold' ? '♻️ Kachra Recycle Ho Gaya! 🎉' : '✅ Kachra Collect Ho Gaya!'}
            </Text>
            <Text style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>#{report.id} · {report.wasteType} · {report.amount}</Text>
            <Text style={{ fontSize: 13, color: '#059669', fontWeight: '700', marginTop: 6 }}>+50 Points 🏆 Aapke Account Mein Credit Ho Gaye!</Text>
          </View>
        ))}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
          <View style={styles.quickGrid}>
            <QuickCard icon="redeem" tint="#FFF0D8" color="#B77519" title={t('rewards')} detail={points === null ? '—' : `${points.toLocaleString(locale)} ${t('pointsShort')}`} onPress={() => router.push('/(tabs)/rewards')} />
            <QuickCard icon="monitoring" tint="#DDF5F1" color="#148575" title={t('myImpact')} detail={`${completedReports.length} ${t('reports')} · ${monthKg === null ? '—' : `${displayKg} kg`}`} onPress={() => router.push('/(tabs)/impact')} />
            <QuickCard icon="emoji_events" tint="#EEE9FF" color="#7561C8" title={t('leaderboard')} detail={t('seeCommunityRanks')} onPress={() => router.push('/(tabs)/leaderboard')} />
          </View>
        </View>

        <View style={styles.activityHeading}>
          <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/rewards')} accessibilityRole="button"><Text style={styles.linkText}>{t('seeAll')}</Text></TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {transactions.length > 0 ? transactions.slice(0, 3).map(item => <TransactionRow key={`tx-${item.id}`} item={item} locale={locale} t={t} />)
            : reports.length > 0 ? reports.slice(0, 2).map(report => <ReportRow key={`report-${report.id}`} report={report} locale={locale} t={t} />)
              : <View style={styles.emptyActivity}>
                <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View>
                <View style={styles.emptyCopy}><Text style={styles.activityTitle}>{t(loadFailed ? 'dashboardOffline' : 'noRecentActivity')}</Text><Text style={styles.activitySub}>{t(loadFailed ? 'pullToRetry' : 'reportForActivity')}</Text></View>
              </View>}
        </View>
        <View style={{ height: 28 }} />
      </Animated.ScrollView>
    </View>
  );
}

function QuickCard({ icon, tint, color, title, detail, onPress }: { icon: string; tint: string; color: string; title: string; detail: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={[styles.quickIconTile, { backgroundColor: tint }]}><Text style={[styles.quickGlyph, { color }]}>{icon}</Text></View>
      <Text style={styles.quickTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.quickDetail} numberOfLines={1}>{detail}</Text>
    </TouchableOpacity>
  );
}

function TransactionRow({ item, locale, t }: { item: Transaction; locale: string; t: (key: MessageKey) => string }) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: '#DDF5E7' }]}><Text style={styles.activityGlyph}>✓</Text></View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.activitySub}>{readableDate(item.date, locale, t('recentActivity'))}</Text>
      </View>
      <View style={styles.activityPoints}>
        <Text style={styles.activityPointsValue}>{item.amount > 0 ? '+' : ''}{item.amount}</Text>
        <Text style={styles.activitySub}>{t('pointsShort')}</Text>
      </View>
    </View>
  );
}

function ReportRow({ report, locale, t }: { report: WasteReport; locale: string; t: (key: MessageKey) => string }) {
  const completed = report.status === 'collected' || report.status === 'sold';
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: completed ? '#DDF5E7' : '#F1F3EC' }]}><Text style={[styles.activityGlyph, { color: completed ? GREEN : '#8D9A91' }]}>{completed ? '✓' : '•'}</Text></View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle} numberOfLines={1}>{completed ? t('collectionCompleted') : t('reportSubmitted')}</Text>
        <Text style={styles.activitySub} numberOfLines={1}>{report.location} · {readableDate(reportDate(report)?.toISOString(), locale, t('recentActivity'))}</Text>
      </View>
      <Text style={[styles.activityStatus, { color: completed ? GREEN : '#8B7B46' }]}>{t(completed ? 'collectedStatus' : report.status === 'assigned' ? 'assignedStatus' : 'pendingStatus')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  heroShell: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, elevation: 8, backgroundColor: INK, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  heroSafeArea: { backgroundColor: INK, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  hero: { backgroundColor: INK, paddingHorizontal: 22, overflow: 'hidden' },
  heroIntro: { overflow: 'hidden' },
  heroDetails: { overflow: 'hidden', paddingBottom: 24, position: 'relative' },
  compactMetrics: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactImpactColumn: { width: '39%', alignItems: 'center', justifyContent: 'center', gap: 6 },
  compactProgressRing: { width: 62, height: 62, borderRadius: 34, borderWidth: 6, transform: [{ rotate: '-20deg' }], alignItems: 'center', justifyContent: 'center' },
  compactProgressTrack: { width: 50, height: 50, borderRadius: 27, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '20deg' }] },
  compactProgressNumber: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 15, lineHeight: 18 },
  compactProgressCaption: { fontFamily: FONT.regular, color: '#B9D4CC', fontSize: 7 },
  compactMonthImpact: { alignItems: 'center', maxWidth: '100%' },
  compactMonthLabel: { fontFamily: FONT.regular, color: '#A5C9C0', fontSize: 10, textAlign: 'center' },
  compactKgNumber: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 28, lineHeight: 33 },
  compactKgUnit: { fontFamily: FONT.bold, color: '#C1D8D1', fontSize: 12 },
  compactChangeText: { fontFamily: FONT.medium, color: LIME, fontSize: 8, marginTop: -1, textAlign: 'center' },
  compactStatsColumn: { flex: 1, justifyContent: 'center' },
  compactStat: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactStatIcon: { fontFamily: 'MaterialSymbols_400Regular', color: LIME, fontSize: 22, lineHeight: 27, width: 26, textAlign: 'center' },
  compactStatCopy: { flex: 1, minWidth: 0 },
  compactStatValue: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 15, lineHeight: 20 },
  compactStatLabel: { fontFamily: FONT.regular, color: '#AFC8C0', fontSize: 9, lineHeight: 13 },
  compactStatDivider: { height: 1, backgroundColor: '#355149', marginLeft: 34 },
  heroOrb: { position: 'absolute', width: 270, height: 270, borderRadius: 150, backgroundColor: '#173A32', right: -124, bottom: 18 },
  topRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: FONT.regular, color: '#9DCBC0', fontSize: 13 },
  avatarButton: { width: 52, height: 52, borderRadius: 19, backgroundColor: '#C99B70', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 16 },
  avatarLeaf: { position: 'absolute', width: 19, height: 19, borderRadius: 10, right: -3, top: -3, backgroundColor: LIME, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  avatarLeafText: { fontFamily: FONT.bold, color: INK, fontSize: 10 },
  greeting: { fontFamily: FONT.medium, color: '#FFFFFF', fontSize: 25, lineHeight: 36, marginTop: 1 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 25, marginTop: 20, marginBottom: 25, paddingLeft: 4 },
  progressRing: { width: 94, height: 94, borderRadius: 50, borderWidth: 8, transform: [{ rotate: '-20deg' }], alignItems: 'center', justifyContent: 'center' },
  progressTrack: { width: 75, height: 75, borderRadius: 40, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '20deg' }] },
  progressNumber: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 21, lineHeight: 26 },
  progressCaption: { fontFamily: FONT.regular, color: '#B9D4CC', fontSize: 10 },
  monthImpact: { flex: 1 },
  monthEyebrow: { fontFamily: FONT.regular, color: '#A5C9C0', fontSize: 13, marginBottom: 2 },
  kgRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  kgNumber: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 43, lineHeight: 52 },
  kgUnit: { fontFamily: FONT.bold, color: '#C1D8D1', fontSize: 16 },
  changeText: { fontFamily: FONT.medium, color: LIME, fontSize: 11, marginTop: 1 },
  heroDivider: { height: 1, backgroundColor: '#355149', marginBottom: 16 },
  heroStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  statIconCircle: { width: 24, height: 24, borderWidth: 2, borderRadius: 15, borderColor: LIME, alignItems: 'center', justifyContent: 'center' },
  statGlyph: { fontFamily: FONT.bold, color: LIME, fontSize: 17, lineHeight: 22 },
  streakGlyph: { fontFamily: FONT.heavy, color: LIME, fontSize: 24, width: 25, textAlign: 'center' },
  statValue: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  statLabel: { fontFamily: FONT.regular, color: '#AFC8C0', fontSize: 11, lineHeight: 16 },
  statSeparator: { width: 1, height: 38, backgroundColor: '#355149', marginHorizontal: 15 },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 22, paddingBottom: 18 },
  reportBanner: { marginTop: 22, minHeight: 89, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 26, backgroundColor: '#D2F58C', flexDirection: 'row', alignItems: 'center', gap: 15 },
  cameraTile: { width: 58, height: 58, borderRadius: 19, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  cameraGlyph: { color: '#FFFFFF', fontFamily: 'MaterialSymbols_400Regular', fontSize: 29, lineHeight: 36 },
  reportCopy: { flex: 1 },
  reportTitle: { fontFamily: FONT.bold, color: '#17251F', fontSize: 19, lineHeight: 25 },
  reportHint: { fontFamily: FONT.regular, color: '#637366', fontSize: 12, marginTop: 1 },
  bannerArrow: { fontFamily: FONT.medium, color: INK, fontSize: 28, marginLeft: 2 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 31, marginBottom: 14 },
  eyebrow: { fontFamily: FONT.bold, color: GREEN, fontSize: 12, letterSpacing: 1.2, lineHeight: 18 },
  sectionTitle: { fontFamily: FONT.medium, color: '#14201A', fontSize: 21, lineHeight: 29 },
  linkText: { fontFamily: FONT.bold, color: '#08775C', fontSize: 14, lineHeight: 21 },
  nearbyCard: { borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E8E2', overflow: 'hidden', shadowColor: '#0C2A1C', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  mapArtwork: { height: 143, backgroundColor: '#E8EFEB', overflow: 'hidden' },
  mapRoadOne: { position: 'absolute', height: 19, width: '130%', backgroundColor: '#FFFFFF', left: -38, top: 51, transform: [{ rotate: '-18deg' }] },
  mapRoadTwo: { position: 'absolute', height: 21, width: '130%', backgroundColor: '#FFFFFF', left: 82, top: 61, transform: [{ rotate: '48deg' }] },
  mapRoadThree: { position: 'absolute', height: 12, width: '88%', backgroundColor: '#F8FBF9', left: 25, top: 112, transform: [{ rotate: '-7deg' }] },
  mapPark: { position: 'absolute', width: 86, height: 220, borderRadius: 70, backgroundColor: '#C5E9E7', right: 31, top: -28, transform: [{ rotate: '11deg' }] },
  mapPin: { position: 'absolute', alignSelf: 'center', top: 47, width: 49, height: 49, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 7, borderBottomRightRadius: 20, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }], shadowColor: '#124E40', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  mapPinText: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 18, transform: [{ rotate: '-45deg' }] },
  nearbyDetails: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  nearbyMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  wastePill: { backgroundColor: '#DDF5E7', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 3 },
  wastePillText: { fontFamily: FONT.bold, color: GREEN, fontSize: 10, letterSpacing: 0.5 },
  nearbyDistance: { fontFamily: FONT.regular, color: MUTED, fontSize: 11 },
  nearbyName: { fontFamily: FONT.bold, color: '#15221B', fontSize: 17, lineHeight: 23 },
  nearbySub: { fontFamily: FONT.regular, color: '#748078', fontSize: 12, marginTop: 1 },
  nearbyPoints: { fontFamily: FONT.bold, color: '#08775C', fontSize: 12, marginTop: 7 },
  sectionBlock: { marginTop: 32 },
  quickGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickCard: { flex: 1, minWidth: 0, minHeight: 124, borderWidth: 1, borderColor: '#E1E8E2', borderRadius: 21, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  quickIconTile: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickGlyph: { fontFamily: 'MaterialSymbols_400Regular', fontSize: 24, lineHeight: 29 },
  quickTitle: { fontFamily: FONT.bold, color: '#19251E', fontSize: 13, lineHeight: 19 },
  quickDetail: { fontFamily: FONT.regular, color: '#718078', fontSize: 10, lineHeight: 15, marginTop: 1 },
  activityHeading: { marginTop: 32, marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityList: { gap: 0 },
  activityRow: { minHeight: 73, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF1EE', gap: 12 },
  activityIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activityGlyph: { fontFamily: FONT.medium, color: GREEN, fontSize: 25 },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: { fontFamily: FONT.bold, color: '#17241D', fontSize: 14, lineHeight: 19 },
  activitySub: { fontFamily: FONT.regular, color: '#7A877F', fontSize: 10, lineHeight: 15, marginTop: 1 },
  activityPoints: { alignItems: 'flex-end' },
  activityPointsValue: { fontFamily: FONT.bold, color: GREEN, fontSize: 14 },
  activityStatus: { fontFamily: FONT.bold, fontSize: 10 },
  emptyActivity: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDF5E7', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { fontFamily: FONT.medium, fontSize: 23, color: GREEN },
  emptyCopy: { flex: 1 },
});
