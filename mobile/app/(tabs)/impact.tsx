import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useLanguage, type MessageKey } from '../../contexts/LanguageContext';
import { api, type WasteReport } from '../../utils/api';
import { collectedKilograms, reportDate, reportKilograms } from '../../utils/impact';

const INK = '#102A28';
const GREEN = '#176B4D';
const LIME = '#C9F06A';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;
const materials: { value: string; key: MessageKey; color: string }[] = [
  { value: 'plastic', key: 'plastic', color: '#24966C' },
  { value: 'paper', key: 'paper', color: '#4D86F7' },
  { value: 'organic', key: 'organic', color: '#F5B84B' },
  { value: 'metal', key: 'metal', color: '#806BE8' },
  { value: 'glass', key: 'glass', color: '#35A8A1' },
  { value: 'other', key: 'other', color: '#9AA59F' },
];

export default function ImpactScreen() {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports(await api.getReports());
      setFailed(false);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const completed = reports.filter(report => report.status === 'collected' || report.status === 'sold');
  const totalKg = collectedKilograms(reports);
  const monthly = useMemo(() => {
    const now = new Date();
    const result = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { year: date.getFullYear(), month: date.getMonth(), label: date.toLocaleDateString(locale, { month: 'short' }), kg: 0 };
    });
    for (const report of completed) {
      const date = reportDate(report);
      const kg = reportKilograms(report);
      if (!date || kg === null) continue;
      const item = result.find(month => month.year === date.getFullYear() && month.month === date.getMonth());
      if (item) item.kg += kg;
    }
    return result;
  }, [completed, locale]);
  const maxMonthlyKg = Math.max(0.5, ...monthly.map(item => item.kg));
  const categoryTotals = useMemo(() => {
    const totals = new Map(materials.map(item => [item.value, 0]));
    for (const report of completed) {
      const kg = reportKilograms(report);
      if (kg === null) continue;
      const type = report.wasteType.toLowerCase();
      const matched = materials.find(item => item.value !== 'other' && type.includes(item.value));
      const key = matched?.value ?? 'other';
      totals.set(key, (totals.get(key) ?? 0) + kg);
    }
    return materials.map(item => ({ ...item, kg: totals.get(item.value) ?? 0 })).filter(item => item.kg > 0).sort((a, b) => b.kg - a.kg);
  }, [completed]);
  const categoryWeight = categoryTotals.reduce((sum, item) => sum + item.kg, 0);
  const formattedKg = totalKg === null ? '—' : totalKg.toLocaleString(locale, { maximumFractionDigits: 1 });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>{t('myImpact').toUpperCase()}</Text><Text style={styles.title}>{t('impactTitle')}</Text></View><LanguageToggle /></View>
        <Text style={styles.subtitle}>{t('impactSubtitle')}</Text>

        <View style={styles.impactHero}>
          <View style={styles.heroOrb} />
          <Text style={styles.heroLabel}>{t('totalCollected')}</Text>
          {loading ? <ActivityIndicator color={LIME} style={styles.heroLoading} /> : <View style={styles.totalRow}><Text style={styles.total}>{formattedKg}</Text><Text style={styles.unit}>kg</Text></View>}
          <Text style={styles.heroHint}>{t('verifiedCollections').replace('{count}', String(completed.length))}</Text>
          <View style={styles.chart}>
            {monthly.map((item, index) => <View key={`${item.year}-${item.month}`} style={styles.chartColumn}>
              <View style={styles.barTrack}><View style={[styles.bar, { height: `${Math.max(item.kg > 0 ? 9 : 4, item.kg / maxMonthlyKg * 100)}%` }, index === monthly.length - 1 && styles.barCurrent]} /></View>
              <Text style={[styles.chartLabel, index === monthly.length - 1 && styles.chartLabelCurrent]}>{item.label}</Text>
            </View>)}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Metric value={loading ? '—' : String(reports.length)} label={t('reports')} icon="⌖" tone="mint" />
          <Metric value={loading ? '—' : String(completed.length)} label={t('collections')} icon="✓" tone="amber" />
        </View>

        <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>{t('impactBreakdown').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('whereImpactComesFrom')}</Text></View></View>
        {!failed && categoryTotals.length > 0 ? <View style={styles.categoryCard}>{categoryTotals.map(item => {
          const share = categoryWeight ? item.kg / categoryWeight * 100 : 0;
          return <View key={item.value} style={styles.categoryItem}>
            <View style={styles.categoryTop}><View style={styles.categoryName}><View style={[styles.categoryDot, { backgroundColor: item.color }]} /><Text style={styles.categoryLabel}>{t(item.key)}</Text></View><Text style={styles.categoryAmount}>{item.kg.toLocaleString(locale, { maximumFractionDigits: 1 })} kg · {Math.round(share)}%</Text></View>
            <View style={styles.categoryTrack}><View style={[styles.categoryFill, { width: `${share}%`, backgroundColor: item.color }]} /></View>
          </View>;
        })}</View> : <View style={styles.noteCard}><View style={styles.noteIcon}><Text style={styles.noteGlyph}>{failed ? '!' : '♻'}</Text></View><View style={styles.noteCopy}><Text style={styles.noteTitle}>{failed ? t('impactUnavailable') : t('impactNoBreakdown')}</Text><Text style={styles.noteText}>{failed ? t('nearbyUnavailableHint') : t('verifiedCollections').replace('{count}', String(completed.length))}</Text></View></View>}

        <View style={styles.rippleCard}><View style={styles.rippleIcon}><Text style={styles.rippleGlyph}>✦</Text></View><View style={styles.rippleCopy}><Text style={styles.rippleEyebrow}>{t('impactRippleEffect').toUpperCase()}</Text><Text style={styles.rippleTitle}>{t('impactRippleTitle').replace('{count}', String(completed.length))}</Text><Text style={styles.rippleText}>{t('impactRippleHint')}</Text></View></View>

        <View style={styles.activityHeading}><Text style={styles.sectionTitle}>{t('recentActivity')}</Text><Text style={styles.activityCount}>{reports.length}</Text></View>
        {failed ? <Text style={styles.muted}>{t('impactUnavailable')}</Text> : !reports.length && !loading ? <Text style={styles.muted}>{t('noRecentActivity')}</Text> : reports.slice(0, 10).map(report => {
          const isComplete = report.status === 'collected' || report.status === 'sold';
          const date = reportDate(report);
          return <View key={report.id} style={styles.reportRow}>
            <View style={[styles.reportIcon, isComplete ? styles.reportIconDone : styles.reportIconPending]}><Text style={[styles.reportGlyph, isComplete && styles.reportGlyphDone]}>{isComplete ? '✓' : '·'}</Text></View>
            <View style={styles.reportCopy}><Text style={styles.reportName} numberOfLines={1}>{report.location}</Text><Text style={styles.reportMeta} numberOfLines={1}>{report.wasteType} · {date ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : t('recentActivity')}</Text></View>
            <Text style={[styles.reportStatus, isComplete ? styles.statusComplete : styles.statusPending]}>{t(report.status === 'sold' ? 'soldStatus' : isComplete ? 'collectedStatus' : report.status === 'assigned' ? 'assignedStatus' : 'pendingStatus')}</Text>
          </View>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label, icon, tone }: { value: string; label: string; icon: string; tone: 'mint' | 'amber' }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, tone === 'mint' ? styles.metricMint : styles.metricAmber]}><Text style={[styles.metricGlyph, tone === 'mint' ? styles.metricMintGlyph : styles.metricAmberGlyph]}>{icon}</Text></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.2 },
  title: { color: INK, fontFamily: FONT.bold, fontSize: 27, lineHeight: 35 },
  subtitle: { color: MUTED, fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, marginTop: 2, marginBottom: 16 },
  impactHero: { backgroundColor: INK, borderRadius: 24, paddingHorizontal: 19, paddingTop: 18, paddingBottom: 14, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -90, top: -73, backgroundColor: '#173A34' },
  heroLabel: { color: '#B8C9C2', fontFamily: FONT.medium, fontSize: 12 },
  heroLoading: { alignSelf: 'flex-start', marginVertical: 14 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 1 },
  total: { color: '#FFFFFF', fontFamily: FONT.heavy, fontSize: 40, lineHeight: 49 },
  unit: { color: '#C4D2CC', fontFamily: FONT.bold, fontSize: 15 },
  heroHint: { color: LIME, fontFamily: FONT.medium, fontSize: 11 },
  chart: { height: 101, flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 15 },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barTrack: { height: 74, width: '100%', justifyContent: 'flex-end', alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,.05)', overflow: 'hidden' },
  bar: { width: '68%', minHeight: 4, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#3A7762' },
  barCurrent: { backgroundColor: LIME },
  chartLabel: { color: '#91A59E', fontFamily: FONT.medium, fontSize: 9 },
  chartLabelCurrent: { color: LIME },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metric: { flex: 1, minHeight: 95, borderRadius: 18, borderWidth: 1, borderColor: '#E5E9E5', padding: 12, backgroundColor: '#FFFFFF' },
  metricIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricMint: { backgroundColor: '#DFF7E8' },
  metricAmber: { backgroundColor: '#FFF0D6' },
  metricGlyph: { fontFamily: FONT.bold, fontSize: 17 },
  metricMintGlyph: { color: GREEN },
  metricAmberGlyph: { color: '#A86E19' },
  metricValue: { color: INK, fontFamily: FONT.bold, fontSize: 19, marginTop: 4 },
  metricLabel: { color: MUTED, fontFamily: FONT.regular, fontSize: 10 },
  sectionHeading: { marginTop: 25, marginBottom: 10 },
  sectionEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 1.1 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 17, lineHeight: 24 },
  categoryCard: { borderRadius: 19, borderWidth: 1, borderColor: '#E5E9E5', padding: 15, gap: 14 },
  categoryItem: { gap: 7 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
  categoryLabel: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  categoryAmount: { color: MUTED, fontFamily: FONT.medium, fontSize: 10 },
  categoryTrack: { height: 6, backgroundColor: '#EFF2EF', borderRadius: 5, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 5 },
  noteCard: { minHeight: 74, flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 17, padding: 13, backgroundColor: '#F5F7F4' },
  noteIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  noteGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 19 },
  noteCopy: { flex: 1 },
  noteTitle: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  noteText: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15 },
  rippleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, marginTop: 13, backgroundColor: '#F1F8F3', borderRadius: 18, borderWidth: 1, borderColor: '#E2EFE6' },
  rippleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  rippleGlyph: { color: LIME, fontFamily: FONT.bold, fontSize: 20 },
  rippleCopy: { flex: 1 },
  rippleEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.8 },
  rippleTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12, marginTop: 1 },
  rippleText: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 14 },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 7 },
  activityCount: { color: GREEN, fontFamily: FONT.bold, fontSize: 11, backgroundColor: '#DFF7E8', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  muted: { color: MUTED, fontFamily: FONT.regular, fontSize: 12 },
  reportRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  reportIcon: { width: 41, height: 41, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reportIconDone: { backgroundColor: '#DFF7E8' },
  reportIconPending: { backgroundColor: '#F0F3EF' },
  reportGlyph: { color: '#8A9790', fontFamily: FONT.bold, fontSize: 21 },
  reportGlyphDone: { color: GREEN },
  reportCopy: { flex: 1, minWidth: 0 },
  reportName: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  reportMeta: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, marginTop: 1 },
  reportStatus: { maxWidth: 82, textAlign: 'right', fontFamily: FONT.bold, fontSize: 9 },
  statusComplete: { color: GREEN },
  statusPending: { color: '#8A6918' },
});
