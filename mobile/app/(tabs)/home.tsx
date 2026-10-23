import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { api, type MobileReferralInfo, type WasteReport } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageToggle } from '../../components/LanguageToggle';
import { TrackingMap } from '../../components/TrackingMap';
import CitizenDashboard from '../../components/CitizenDashboard';
import CollectorDashboard from '../../components/CollectorDashboard';

function StatCard({ icon, value, label, color }: any) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OperationsHomeScreen() {
  const { userName, userRole, logout, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ collected: '—', reports: 0, tokens: 0, co2: '—' });
  const [recentReports, setRecentReports] = useState<WasteReport[]>([]);
  const [referralInfo, setReferralInfo] = useState<MobileReferralInfo | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(0);

  const loadData = useCallback(async (showError = true) => {
    if (!api.isConfigured) return;
    try {
      const activeRole = await refreshProfile().catch(() => userRole);
      if (activeRole === 'admin') return;
      const reportsPromise = activeRole === 'collector' ? api.getTasks() : api.getReports();
      const [reports, rewards] = await Promise.all([reportsPromise, api.getRewards()]);
      setRecentReports(reports);
      setBalance(rewards.balance);
      setStats({ collected: activeRole === 'collector' ? String(reports.filter(report => report.status === 'collected' || report.status === 'sold').length) : '—', reports: reports.length, tokens: rewards.balance, co2: '—' });
    } catch (error) {
      if (showError) Alert.alert('Could not refresh', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [refreshProfile, userRole]);
  useEffect(() => {
    if (userRole === 'admin') return;
    const initialLoad = setTimeout(() => void loadData(false), 0);
    const poll = userRole === 'citizen' ? setInterval(() => void loadData(false), 15000) : null;
    return () => { clearTimeout(initialLoad); if (poll) clearInterval(poll); };
  }, [loadData, userRole]);
  useEffect(() => {
    if (userRole !== 'citizen') return;
    let active = true;
    void api.getReferralInfo().then(value => { if (active) setReferralInfo(value); })
      .catch(error => console.warn('Could not load invite code:', error instanceof Error ? error.message : 'unknown error'));
    return () => { active = false; };
  }, [userRole]);
  useEffect(() => {
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };
  const mapReports = recentReports.filter(report => report.latitude != null && report.longitude != null).slice(0, 4);
  const selectedMapReport = mapReports.find(report => report.id === selectedReportId) ?? mapReports[0];
  const collectorLocationTime = selectedMapReport?.collectorLastLocationAt ? Date.parse(selectedMapReport.collectorLastLocationAt) : NaN;
  const collectorLocationFresh = clockNow > 0 && Number.isFinite(collectorLocationTime) && clockNow - collectorLocationTime < 2 * 60 * 1000;
  const collectorLocationAgeSeconds = collectorLocationFresh ? Math.max(0, Math.floor((clockNow - collectorLocationTime) / 1000)) : null;
  const callCollector = async () => {
    const phone = selectedMapReport?.collectorPhone;
    if (!phone) return;
    try { await Linking.openURL(`tel:${phone}`); }
    catch { Alert.alert('Call unavailable', 'This device cannot place a phone call.'); }
  };
  const shareInvite = async () => {
    try {
      const invite = referralInfo ?? await api.getReferralInfo();
      setReferralInfo(invite);
      await Share.share({ message: `${t('referralShareMessage')} ${invite.code}\n${invite.shareUrl}` });
    } catch {
      Alert.alert(t('referralCardTitle'), t('referralShareError'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>🌿 WASTE-CHAiN</Text>
          <Text style={styles.headerSub}>{t('platform')}</Text>
        </View>
        {userRole !== 'admin' && <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{balance}</Text>
          <Text style={styles.coinLabel}>pts</Text>
        </View>}
      </View>
      <View style={styles.languageRow}><LanguageToggle /></View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.glowDot} />
          <View style={styles.welcomeBadge}>
            <Text style={styles.welcomeBadgeText}>🌱 {t('landingTagline')}</Text>
          </View>
          <Text style={styles.welcomeTitle}>{t('welcome')}</Text>
          <Text style={styles.welcomeName}>{userName || 'Eco Warrior'} 👋</Text>
          <Text style={styles.welcomeSub}>{userRole === 'admin' ? t('adminDashboardDescription') : api.isConfigured ? t('homeSubtitleLive') : t('homeSubtitleUnavailable')}</Text>
          <View style={styles.actionRow}>
            {userRole === 'citizen' && <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/report')}><Text style={styles.primaryBtnText}>📍 {t('reportWaste')}</Text></TouchableOpacity>}
            {userRole === 'collector' && <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/collect')}><Text style={styles.primaryBtnText}>♻️ {t('collectWaste')}</Text></TouchableOpacity>}
            {userRole === 'admin' && <TouchableOpacity style={styles.primaryBtn} onPress={() => api.adminDashboardUrl && void Linking.openURL(api.adminDashboardUrl)}><Text style={styles.primaryBtnText}>🛡️ {t('openAdminDashboard')}</Text></TouchableOpacity>}
            {userRole === 'citizen' && <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/leaderboard')}><Text style={styles.secondaryBtnText}>🏆 {t('leaderboard')}</Text></TouchableOpacity>}
          </View>
        </View>

        {/* Stats */}
        {userRole !== 'admin' && <Text style={styles.sectionTitle}>{t('communityImpact')}</Text>}
        {userRole !== 'admin' && <View style={styles.statsGrid}>
          <StatCard icon="♻️" value={stats.collected} label={t('wasteCollected')} color={Colors.primaryLight} />
          <StatCard icon="📍" value={stats.reports} label={t('reports')} color={Colors.blue} />
          <StatCard icon="🪙" value={stats.tokens} label={t('pointsEarned')} color={Colors.yellow} />
          <StatCard icon="🌱" value={stats.co2} label={t('co2Offset')} color="#15803d" />
        </View>}

        {userRole === 'citizen' && <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <View style={styles.referralIcon}><Text style={styles.referralIconText}>🎁</Text></View>
            <View style={styles.referralCopy}>
              <Text style={styles.referralTitle}>{t('referralCardTitle')}</Text>
              <Text style={styles.referralDescription}>{t('referralCardDesc')}</Text>
            </View>
          </View>
          <View style={styles.referralBottom}>
            <Text style={styles.referralCode}>{referralInfo?.code ?? '••••••••'}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={() => void shareInvite()} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.shareButtonText}>↗  {t('referralShareButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>}

        {userRole === 'citizen' && <View style={{ marginHorizontal: 16, marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ece4' }}>
          <Text style={{ color: '#17211a', fontSize: 16, fontWeight: '900', marginBottom: 8 }}>{t('myReports')}</Text>
          {selectedMapReport ? <View style={{ gap: 10, marginBottom: 12 }}>
            <Text style={{ color: '#547063', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>📍 COMPLAINT MAP · #{selectedMapReport.id}</Text>
            <TrackingMap
              reportPoint={{ latitude: selectedMapReport.latitude!, longitude: selectedMapReport.longitude! }}
              collectorPoint={collectorLocationFresh && selectedMapReport.collectorLatitude != null && selectedMapReport.collectorLongitude != null
                ? { latitude: selectedMapReport.collectorLatitude, longitude: selectedMapReport.collectorLongitude } : null}
              reportLabel={`${selectedMapReport.wasteType} · ${selectedMapReport.location}`}
              collectorLabel={selectedMapReport.collectorName || 'Assigned collector'}
              height={230}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#173323', fontSize: 13, fontWeight: '900' }}>{selectedMapReport.collectorName || (selectedMapReport.status === 'pending' ? 'Finding your nearest collector…' : 'Collector details unavailable')}</Text>
                <Text style={{ color: collectorLocationFresh ? '#15803d' : '#748078', fontSize: 11, marginTop: 3 }}>
                  {selectedMapReport.collectorName
                    ? collectorLocationFresh ? `● Live location · updated ${collectorLocationAgeSeconds! < 5 ? 'just now' : `${collectorLocationAgeSeconds}s ago`}` : selectedMapReport.collectorLastLocationAt ? 'Last location is currently not updating' : 'Waiting for collector location'
                    : selectedMapReport.status === 'pending' ? 'We will show their details as soon as assigned.' : 'No collector has been assigned yet.'}
                </Text>
                {selectedMapReport.collectorPhone ? <Text style={{ color: '#526358', fontSize: 12, marginTop: 3 }}>📞 {selectedMapReport.collectorPhone}</Text> : null}
              </View>
              {selectedMapReport.collectorPhone ? <TouchableOpacity onPress={() => void callCollector()} style={{ backgroundColor: '#15803d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }} accessibilityRole="button" accessibilityLabel="Call assigned collector">
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>Call</Text>
              </TouchableOpacity> : null}
            </View>
            {mapReports.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {mapReports.map(report => <TouchableOpacity key={report.id} onPress={() => setSelectedReportId(report.id)} style={{ backgroundColor: report.id === selectedMapReport.id ? '#15803d' : '#eff5f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: report.id === selectedMapReport.id ? '#fff' : '#365343', fontWeight: '800', fontSize: 11 }}>#{report.id} · {report.wasteType}</Text>
              </TouchableOpacity>)}
            </ScrollView> : null}
          </View> : null}
          {recentReports.length === 0 ? <Text style={{ color: '#748078', fontSize: 12 }}>{t('noMyReports')}</Text> : recentReports.slice(0, 4).map(report => {
            const labels = { pending: 'pendingStatus', assigned: 'assignedStatus', collected: 'collectedStatus', sold: 'soldStatus' } as const;
            const statusKey = labels[report.status as keyof typeof labels] || 'pendingStatus';
            return <TouchableOpacity key={report.id} onPress={() => setSelectedReportId(report.id)} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#edf2ee' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#203629', fontSize: 12, fontWeight: '800' }} numberOfLines={1}>#{report.id} · {report.wasteType}</Text>
                <Text style={{ color: '#68776d', fontSize: 11, marginTop: 3 }} numberOfLines={1}>📍 {report.location}</Text>
                {report.collectorName ? <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '700', marginTop: 3 }}>{t('collectorAssigned')}: {report.collectorName}</Text> : report.status === 'pending' ? <Text style={{ color: '#8a6a13', fontSize: 10, marginTop: 3 }}>{t('findingCollector')}</Text> : null}
              </View>
              <Text style={{ color: report.status === 'pending' ? '#a16207' : '#15803d', fontSize: 10, fontWeight: '900', maxWidth: 85, textAlign: 'right' }}>{t(statusKey)}</Text>
            </TouchableOpacity>;
          })}
        </View>}

        {/* Quick Actions */}
        {userRole !== 'admin' && <Text style={styles.sectionTitle}>{t('quickActions')}</Text>}
        {userRole !== 'admin' && <View style={styles.quickGrid}>
          {[
            { icon: '📍', title: t('reportWaste'), desc: t('reportStepDesc'), color: '#16a34a', route: '/(tabs)/report' },
            { icon: '♻️', title: t('collectWaste'), desc: t('collectDesc'), color: '#0891b2', route: '/(tabs)/collect' },
            { icon: '🪙', title: t('myPoints'), desc: t('pointsDesc'), color: '#d97706', route: '/(tabs)/rewards' },
            { icon: '🏆', title: t('leaderboard'), desc: t('ranksDesc'), color: '#7c3aed', route: '/(tabs)/leaderboard' },
          ].filter(item => userRole === 'citizen' || item.route === '/(tabs)/collect' || item.route === '/(tabs)/rewards').map((item, i) => (
            <TouchableOpacity key={i} style={[styles.quickCard, { borderColor: item.color + '40' }]} onPress={() => router.push(item.route as any)} activeOpacity={0.8}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickTitle}>{item.title}</Text>
              <Text style={styles.quickDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>}

        {/* How it works */}
        {userRole !== 'admin' && <Text style={styles.sectionTitle}>{t('howItWorks')}</Text>}
        {userRole !== 'admin' && <View style={styles.stepsCard}>
          {[
            { step: '01', title: t('reportStep'), desc: t('reportStepDesc'), color: '#16a34a' },
            { step: '02', title: t('collectStep'), desc: t('collectStepDesc'), color: '#0891b2' },
            { step: '03', title: t('impactStep'), desc: t('impactStepDesc'), color: '#d97706' },
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: s.color }]}>
                <Text style={styles.stepNum}>{s.step}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('signOut')}</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDeep },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  languageRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  headerBrand: { fontSize: 18, fontWeight: '900', color: Colors.text, letterSpacing: 1 },
  headerSub: { fontSize: 10, color: Colors.textDim, marginTop: 1 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.cardBorder },
  coinIcon: { fontSize: 14 },
  coinText: { fontSize: 15, fontWeight: '800', color: Colors.primaryLight },
  coinLabel: { fontSize: 10, color: Colors.textMuted },
  welcomeCard: { margin: 16, borderRadius: 24, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, padding: 22, overflow: 'hidden' },
  glowDot: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#16a34a20' },
  welcomeBadge: { backgroundColor: '#16a34a20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: '#16a34a40' },
  welcomeBadgeText: { fontSize: 11, color: Colors.primaryLight, fontWeight: '700' },
  welcomeTitle: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },
  welcomeName: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  welcomeSub: { fontSize: 13, color: Colors.textDim, lineHeight: 20, marginBottom: 18 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  referralCard: { marginHorizontal: 16, marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: '#f0fbf3', borderWidth: 1, borderColor: '#bce6c6' },
  referralHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  referralIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ddf5e3' },
  referralIconText: { fontSize: 21 },
  referralCopy: { flex: 1 },
  referralTitle: { color: '#15351e', fontSize: 16, fontWeight: '900' },
  referralDescription: { color: '#506457', fontSize: 12, lineHeight: 17, marginTop: 3 },
  referralBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 14 },
  referralCode: { color: '#176235', fontSize: 16, letterSpacing: 1.5, fontWeight: '900' },
  shareButton: { backgroundColor: '#15803d', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  shareButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  statCard: { width: '47%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, color: Colors.textDim, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  quickCard: { width: '47%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  quickIcon: { fontSize: 26 },
  quickTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  quickDesc: { fontSize: 11, color: Colors.textDim, lineHeight: 16 },
  stepsCard: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder, padding: 18, gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stepNum: { fontSize: 14, fontWeight: '900', color: '#fff' },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  stepDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  logoutBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
});

export default function HomeScreen() {
  const { userRole } = useAuth();
  if (userRole === 'citizen') return <CitizenDashboard />;
  if (userRole === 'collector') return <CollectorDashboard />;
  return <OperationsHomeScreen />;
}
