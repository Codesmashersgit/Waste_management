import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api, type WasteReport } from '../utils/api';
import { collectedKilograms } from '../utils/impact';
import { TrackingMap } from './TrackingMap';

const INK = '#102A28';
const GREEN = '#176B4D';
const LIME = '#C9F06A';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

export default function CollectorDashboard() {
  const { userName } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [tasks, setTasks] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setTasks(await api.getTasks());
      setFailed(false);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const now = new Date();
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const greeting = now.getHours() < 12 ? t('goodMorning') : now.getHours() < 17 ? t('goodAfternoon') : t('goodEvening');
  const completed = tasks.filter(task => task.status === 'collected' || task.status === 'sold');
  const totalKg = collectedKilograms(completed);
  const recordedSales = completed.reduce((sum, task) => sum + (Number.isFinite(task.saleRevenue) ? Number(task.saleRevenue) : 0), 0);
  const activeTask = tasks.find(task => task.status === 'assigned');
  const addressParts = [activeTask?.latitude, activeTask?.longitude];
  const hasCoordinates = addressParts[0] != null && addressParts[1] != null;
  const openTasks = () => router.push('/(tabs)/collect');
  const navigate = async () => {
    if (!hasCoordinates) return;
    try { await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${activeTask!.latitude},${activeTask!.longitude}&travelmode=driving`); }
    catch { /* Native navigation availability differs by device. The in-app task map remains available. */ }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.header}><View><Text style={styles.modeLabel}>{t('collectorMode')}</Text><Text style={styles.greeting}>{greeting},</Text><Text style={styles.name}>{userName?.trim().split(/\s+/)[0] || t('friend')}</Text></View><LanguageToggle /></View>
          <View style={styles.salesRow}><View><Text style={styles.salesLabel}>{t('recordedSales')}</Text><Text style={styles.salesValue}>₹{recordedSales.toLocaleString(locale)}</Text><Text style={styles.salesHint}>{t('recordedSalesHint')}</Text></View><View style={styles.salesMark}><Text style={styles.salesMarkGlyph}>₹</Text></View></View>
          <View style={styles.heroStats}><HeroStat value={String(completed.length)} label={t('completedPickups')} /><View style={styles.separator} /><HeroStat value={totalKg === null ? '—' : `${totalKg.toLocaleString(locale, { maximumFractionDigits: 1 })} kg`} label={t('wasteCollected')} /><View style={styles.separator} /><HeroStat value={String(tasks.filter(task => task.status === 'assigned').length)} label={t('activePickups')} /></View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <TouchableOpacity style={styles.taskButton} onPress={openTasks} activeOpacity={0.86} accessibilityRole="button"><View style={styles.taskButtonIcon}><Text style={styles.taskButtonGlyph}>⌖</Text></View><View style={styles.taskButtonCopy}><Text style={styles.taskButtonTitle}>{t('openCollectorTasks')}</Text><Text style={styles.taskButtonHint}>{t('collectorHomeSubtitle')}</Text></View><Text style={styles.taskButtonArrow}>→</Text></TouchableOpacity>

        <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>{t('activePickups').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('priorityNearby')}</Text></View><TouchableOpacity onPress={openTasks} accessibilityRole="button"><Text style={styles.link}>{t('seeAll')}</Text></TouchableOpacity></View>

        {loading ? <View style={styles.stateCard}><ActivityIndicator color={GREEN} /></View>
          : activeTask ? <View style={styles.taskCard}>
            <View style={styles.taskMeta}><View style={styles.plasticBadge}><Text style={styles.plasticBadgeText}>{activeTask.wasteType.toUpperCase()}</Text></View><Text style={styles.taskId}>#{activeTask.id}</Text></View>
            <Text style={styles.taskTitle} numberOfLines={1}>{activeTask.location}</Text><Text style={styles.taskDetail}>{activeTask.amount} · {t('collectorPickupAssigned')}</Text>
            {hasCoordinates ? <View style={styles.taskImageMap}><TrackingMap reportPoint={{ latitude: activeTask.latitude!, longitude: activeTask.longitude! }} collectorPoint={null} reportLabel={`${activeTask.wasteType} · ${activeTask.location}`} collectorLabel={t('assignedCollector')} height={180} /></View> : null}
            <TouchableOpacity style={styles.navigateButton} onPress={() => void navigate()} disabled={!hasCoordinates} accessibilityRole="button"><Text style={styles.navigateGlyph}>↗</Text><Text style={styles.navigateText}>{t('navigateToPickup')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.viewTaskButton} onPress={openTasks} accessibilityRole="button"><Text style={styles.viewTaskText}>{t('viewTaskDetails')}</Text></TouchableOpacity>
          </View>
            : <View style={styles.emptyCard}><View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>{failed ? '!' : '✓'}</Text></View><Text style={styles.emptyTitle}>{failed ? t('taskLoadFailed') : t('noActivePickup')}</Text><Text style={styles.emptyText}>{failed ? t('nearbyUnavailableHint') : t('waitingForAssignment')}</Text></View>}

        <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>{t('recentActivity').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('completedCollections')}</Text></View></View>
        {completed.length ? completed.slice(0, 4).map(task => <View key={task.id} style={styles.completedRow}><View style={styles.completedIcon}><Text style={styles.completedGlyph}>✓</Text></View><View style={styles.completedCopy}><Text style={styles.completedTitle} numberOfLines={1}>{task.location}</Text><Text style={styles.completedDetail}>{task.wasteType} · {task.amount}</Text></View><Text style={styles.completedStatus}>{t(task.status === 'sold' ? 'soldStatus' : 'collectedStatus')}</Text></View>) : <Text style={styles.activityEmpty}>{loading ? t('loadingReports') : t('noRecentActivity')}</Text>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return <View style={styles.heroStat}><Text style={styles.heroStatValue}>{value}</Text><Text style={styles.heroStatLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  safeTop: { backgroundColor: INK, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  hero: { paddingHorizontal: 21, paddingTop: 10, paddingBottom: 19, backgroundColor: INK, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 230, height: 230, borderRadius: 115, top: -135, right: -89, backgroundColor: '#1A3B34' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeLabel: { color: LIME, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.1 },
  greeting: { color: '#AFC1BA', fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, marginTop: 5 },
  name: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 24, lineHeight: 30 },
  salesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 18 },
  salesLabel: { color: '#AFC1BA', fontFamily: FONT.medium, fontSize: 11 },
  salesValue: { color: LIME, fontFamily: FONT.heavy, fontSize: 35, lineHeight: 43 },
  salesHint: { color: '#9FB1AA', fontFamily: FONT.regular, fontSize: 9 },
  salesMark: { width: 59, height: 59, borderRadius: 21, backgroundColor: 'rgba(201,240,106,.13)', alignItems: 'center', justifyContent: 'center' },
  salesMarkGlyph: { color: LIME, fontFamily: FONT.bold, fontSize: 31 },
  heroStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)' },
  heroStat: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  heroStatValue: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 13, textAlign: 'center' },
  heroStatLabel: { color: '#9FB1AA', fontFamily: FONT.regular, fontSize: 9, textAlign: 'center' },
  separator: { width: 1, height: 29, backgroundColor: 'rgba(255,255,255,.13)' },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 21, paddingTop: 18, paddingBottom: 27 },
  taskButton: { minHeight: 72, borderRadius: 20, backgroundColor: '#C9F06A', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13 },
  taskButtonIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  taskButtonGlyph: { color: LIME, fontSize: 23 },
  taskButtonCopy: { flex: 1 },
  taskButtonTitle: { color: INK, fontFamily: FONT.bold, fontSize: 13 },
  taskButtonHint: { color: '#52694D', fontFamily: FONT.regular, fontSize: 10, lineHeight: 14 },
  taskButtonArrow: { color: INK, fontFamily: FONT.bold, fontSize: 22 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25, marginBottom: 11 },
  eyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 1.1 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 18, lineHeight: 25 },
  link: { color: GREEN, fontFamily: FONT.bold, fontSize: 11 },
  taskCard: { borderRadius: 19, padding: 14, borderWidth: 1, borderColor: '#E5E9E5', backgroundColor: '#FFFFFF', shadowColor: INK, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plasticBadge: { backgroundColor: '#DFF7E8', borderRadius: 18, paddingHorizontal: 9, paddingVertical: 4 },
  plasticBadgeText: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.5 },
  taskId: { color: MUTED, fontFamily: FONT.regular, fontSize: 10 },
  taskTitle: { color: INK, fontFamily: FONT.bold, fontSize: 16, marginTop: 8 },
  taskDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 11 },
  taskImageMap: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  navigateButton: { minHeight: 45, borderRadius: 13, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  navigateGlyph: { color: LIME, fontFamily: FONT.bold, fontSize: 16 },
  navigateText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 12 },
  viewTaskButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  viewTaskText: { color: GREEN, fontFamily: FONT.bold, fontSize: 12 },
  stateCard: { minHeight: 100, borderRadius: 18, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { minHeight: 148, borderRadius: 19, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  emptyGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 20 },
  emptyTitle: { color: INK, fontFamily: FONT.bold, fontSize: 13, textAlign: 'center' },
  emptyText: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 2 },
  completedRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  completedIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  completedGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 17 },
  completedCopy: { flex: 1, minWidth: 0 },
  completedTitle: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  completedDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 9 },
  completedStatus: { color: GREEN, fontFamily: FONT.bold, fontSize: 9 },
  activityEmpty: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, paddingVertical: 10 },
});
