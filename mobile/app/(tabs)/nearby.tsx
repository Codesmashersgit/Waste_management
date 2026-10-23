import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, type WasteReport } from '../../utils/api';
import { TrackingMap } from '../../components/TrackingMap';

const GREEN = '#13765A';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;
const statusKeys: Record<string, 'pendingStatus' | 'assignedStatus' | 'collectedStatus' | 'soldStatus'> = {
  pending: 'pendingStatus', assigned: 'assignedStatus', collected: 'collectedStatus', sold: 'soldStatus',
};

export default function NearbyScreen() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    if (!api.isConfigured) {
      setLoading(false);
      setFailed(true);
      return;
    }
    try {
      const next = await api.getReports();
      setReports(next);
      setLoadedAt(Date.now());
      setSelectedId(current => current && next.some(report => report.id === current) ? current : next[0]?.id ?? null);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadReports(), 0);
    return () => clearTimeout(initialLoad);
  }, [loadReports]);
  const selected = reports.find(report => report.id === selectedId) ?? reports[0];
  const hasCoordinates = selected?.latitude != null && selected.longitude != null;
  const locationTime = selected?.collectorLastLocationAt ? Date.parse(selected.collectorLastLocationAt) : NaN;
  const collectorLocationFresh = loadedAt !== null && Number.isFinite(locationTime) && locationTime <= loadedAt && loadedAt - locationTime < 2 * 60 * 1000;
  const collectorPoint = collectorLocationFresh && selected?.collectorLatitude != null && selected.collectorLongitude != null
    ? { latitude: selected.collectorLatitude, longitude: selected.collectorLongitude }
    : null;

  const refresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const callCollector = async () => {
    if (!selected?.collectorPhone) return;
    try { await Linking.openURL(`tel:${selected.collectorPhone}`); }
    catch { Alert.alert(t('callUnavailable'), t('callUnavailableHint')); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <Text style={styles.eyebrow}>{t('aroundYou').toUpperCase()}</Text>
        <Text style={styles.title}>{t('nearbyTitle')}</Text>
        <Text style={styles.subtitle}>{t('nearbySubtitle')}</Text>

        {loading ? <View style={styles.loading}><ActivityIndicator color={GREEN} /><Text style={styles.body}>{t('loadingReports')}</Text></View>
          : selected && hasCoordinates ? <View style={styles.mapCard}>
            <TrackingMap
              reportPoint={{ latitude: selected.latitude!, longitude: selected.longitude! }}
              collectorPoint={collectorPoint}
              reportLabel={`${selected.wasteType} · ${selected.location}`}
              collectorLabel={selected.collectorName || t('assignedCollector')}
              height={290}
            />
            <View style={styles.mapDetails}>
              <View style={styles.rowBetween}>
                <Text style={styles.reportName} numberOfLines={1}>{selected.location}</Text>
                <View style={[styles.statusBadge, { backgroundColor: selected.status === 'collected' || selected.status === 'sold' ? '#DDF5E7' : '#F6EFD9' }]}>
                  <Text style={[styles.statusText, { color: selected.status === 'collected' || selected.status === 'sold' ? GREEN : '#8A6918' }]}>{t(statusKeys[selected.status] || 'pendingStatus')}</Text>
                </View>
              </View>
              <Text style={styles.body}>{selected.wasteType} · {selected.amount}</Text>
              {selected.collectorName ? <View style={styles.collectorRow}>
                <View style={styles.collectorCopy}>
                  <Text style={styles.collectorName}>{selected.collectorName}</Text>
                  <Text style={[styles.body, collectorLocationFresh && styles.liveText]}>{collectorLocationFresh ? t('collectorLive') : selected.collectorLastLocationAt ? t('collectorLocationStale') : t('waitingCollectorLocation')}</Text>
                  <Text style={styles.body}>{selected.collectorPhone || t('collectorPhoneUnavailable')}</Text>
                </View>
                {selected.collectorPhone ? <TouchableOpacity style={styles.callButton} onPress={() => void callCollector()} accessibilityRole="button"><Text style={styles.callButtonText}>{t('callCollector')}</Text></TouchableOpacity> : null}
              </View> : <Text style={styles.helper}>{selected.status === 'pending' ? t('findingCollector') : t('noCollectorAssigned')}</Text>}
            </View>
          </View>
          : <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌖</Text>
            <Text style={styles.emptyTitle}>{t(failed ? 'nearbyUnavailable' : reports.length ? 'noReportCoordinates' : 'noReportYet')}</Text>
            <Text style={styles.body}>{t(failed ? 'nearbyUnavailableHint' : reports.length ? 'addLocationToMap' : 'nearbyEmptyHint')}</Text>
          </View>}

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>{t('yourReports')}</Text>
          <Text style={styles.count}>{reports.length}</Text>
        </View>
        {!reports.length && !loading ? <Text style={styles.body}>{t('noMyReports')}</Text> : null}
        {reports.map(report => {
          const selectedReport = report.id === selected?.id;
          return <TouchableOpacity key={report.id} style={[styles.reportItem, selectedReport && styles.reportItemSelected]} onPress={() => setSelectedId(report.id)} activeOpacity={0.8} accessibilityRole="button">
            <View style={styles.reportItemIcon}><Text style={styles.reportItemGlyph}>♻</Text></View>
            <View style={styles.reportItemCopy}>
              <Text style={styles.reportName} numberOfLines={1}>{report.location}</Text>
              <Text style={styles.body} numberOfLines={1}>{report.wasteType} · {report.amount}</Text>
              {report.collectorName ? <Text style={styles.collectorName} numberOfLines={1}>{t('collector')}: {report.collectorName}</Text> : null}
            </View>
            <Text style={styles.listStatus}>{t(statusKeys[report.status] || 'pendingStatus')}</Text>
          </TouchableOpacity>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28 },
  eyebrow: { fontFamily: FONT.bold, color: GREEN, letterSpacing: 1.1, fontSize: 12 },
  title: { fontFamily: FONT.bold, color: '#14201A', fontSize: 27, lineHeight: 36 },
  subtitle: { fontFamily: FONT.regular, color: '#728078', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  mapCard: { overflow: 'hidden', borderRadius: 23, borderWidth: 1, borderColor: '#E1E9E3', backgroundColor: '#FFFFFF' },
  mapDetails: { padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reportName: { flex: 1, fontFamily: FONT.bold, color: '#19251E', fontSize: 16 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontFamily: FONT.bold, fontSize: 10 },
  body: { fontFamily: FONT.regular, color: '#718078', fontSize: 12, lineHeight: 19 },
  helper: { fontFamily: FONT.medium, color: '#748078', fontSize: 12, marginTop: 12 },
  collectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 13, borderTopColor: '#EDF1EE', borderTopWidth: 1, paddingTop: 12 },
  collectorCopy: { flex: 1 },
  collectorName: { fontFamily: FONT.bold, color: GREEN, fontSize: 12 },
  liveText: { color: GREEN },
  callButton: { borderRadius: 12, backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 9 },
  callButtonText: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 12 },
  loading: { minHeight: 210, gap: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 23, backgroundColor: '#F4F7F4' },
  emptyCard: { minHeight: 210, padding: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 23, backgroundColor: '#F4F7F4' },
  emptyIcon: { fontFamily: FONT.regular, color: GREEN, fontSize: 42 },
  emptyTitle: { fontFamily: FONT.bold, color: '#1B2B22', fontSize: 17, textAlign: 'center', marginTop: 5 },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 27, marginBottom: 10 },
  sectionTitle: { fontFamily: FONT.bold, color: '#14201A', fontSize: 19 },
  count: { fontFamily: FONT.bold, color: GREEN, fontSize: 12, backgroundColor: '#DDF5E7', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  reportItem: { minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, paddingVertical: 9, borderBottomWidth: 1, borderColor: '#EDF1EE', borderRadius: 15 },
  reportItemSelected: { backgroundColor: '#F3F8F4' },
  reportItemIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDF5E7' },
  reportItemGlyph: { fontFamily: FONT.bold, color: GREEN, fontSize: 18 },
  reportItemCopy: { flex: 1, minWidth: 0 },
  listStatus: { maxWidth: 75, fontFamily: FONT.bold, color: GREEN, fontSize: 10, textAlign: 'right' },
});
