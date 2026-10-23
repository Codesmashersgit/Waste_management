import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { TabPage, InfoCard, pageStyles as s } from '../../components/TabPage';
import { api, type WasteReport } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrackingMap } from '../../components/TrackingMap';

const LIVE_TRACKING_OPTIONS = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 10,
  timeInterval: 10000,
};

export default function CollectScreen() {
  const [tasks, setTasks] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [online, setOnline] = useState(false);
  const [saleAmounts, setSaleAmounts] = useState<Record<number, string>>({});
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());
  const onlineRef = useRef(false);
  const liveTrackingAlertShownRef = useRef(false);
  const { userRole } = useAuth();
  const { t } = useLanguage();

  const refresh = useCallback(async () => {
    try { setTasks(await api.getTasks()); }
    catch (error) { Alert.alert(t('taskLoadFailed'), error instanceof Error ? error.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    const initialLoad = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(initialLoad);
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    void api.getProfile().then(profile => {
      if (mounted) setPhone(profile.phone ?? '');
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!online) return;
    let watcher: Location.LocationSubscription | null = null;
    let mounted = true;
    let sendingLocation = false;
    const goUnavailable = () => {
      onlineRef.current = false;
      setOnline(false);
      void api.setCollectorAvailability(false).catch(() => {});
    };
    const appStateListener = AppState.addEventListener('change', state => {
      if (state !== 'active' && onlineRef.current) goUnavailable();
    });
    void (async () => {
      try {
        watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 30000 },
          async position => {
            setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            if (sendingLocation) return;
            sendingLocation = true;
            try {
              const currentTasks = await api.getTasks();
              if (currentTasks.some(task => task.status === 'assigned' || task.status === 'collected')) {
                goUnavailable();
                await refresh();
                return;
              }
              const result = await api.setCollectorAvailability(true, position.coords.latitude, position.coords.longitude);
              if (result?.assignedCount) {
                onlineRef.current = false;
                setOnline(false);
                await refresh();
              }
            } catch {
              const latestTasks = await api.getTasks().catch(() => []);
              if (latestTasks.some(task => task.status === 'assigned' || task.status === 'collected')) {
                goUnavailable();
                await refresh();
              }
            } finally { sendingLocation = false; }
          },
        );
        if (!mounted) watcher.remove();
      } catch {
        Alert.alert(t('locationCaptureFailed'));
        goUnavailable();
      }
    })();
    return () => {
      mounted = false;
      watcher?.remove();
      appStateListener.remove();
      if (onlineRef.current) {
        onlineRef.current = false;
        void api.setCollectorAvailability(false).catch(() => {});
      }
    };
  }, [online, refresh, t]);

  const activeTaskId = tasks.find(task => task.status === 'assigned')?.id ?? null;
  useEffect(() => {
    if (userRole !== 'collector' || activeTaskId == null) return;
    let watcher: Location.LocationSubscription | null = null;
    let mounted = true;
    let sending = false;
    let queuedPosition: { latitude: number; longitude: number } | null = null;

    const sendLocation = async (latitude: number, longitude: number) => {
      if (!mounted) return;
      setCurrentLocation({ latitude, longitude });
      if (sending) {
        queuedPosition = { latitude, longitude };
        return;
      }
      sending = true;
      try {
        await api.updateCollectorLocation(latitude, longitude);
      } catch (error) {
        if (!liveTrackingAlertShownRef.current) {
          liveTrackingAlertShownRef.current = true;
          Alert.alert(t('taskFailed'), error instanceof Error ? error.message : t('locationCaptureFailed'));
        }
      } finally {
        sending = false;
        if (queuedPosition) {
          const latest = queuedPosition;
          queuedPosition = null;
          void sendLocation(latest.latitude, latest.longitude);
        }
      }
    };

    void (async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (!liveTrackingAlertShownRef.current) {
            liveTrackingAlertShownRef.current = true;
            Alert.alert(t('addLocation'), t('locationPermission'));
          }
          return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await sendLocation(current.coords.latitude, current.coords.longitude);
        watcher = await Location.watchPositionAsync(LIVE_TRACKING_OPTIONS, position => {
          void sendLocation(position.coords.latitude, position.coords.longitude);
        });
        if (!mounted) watcher.remove();
      } catch {
        if (!liveTrackingAlertShownRef.current) {
          liveTrackingAlertShownRef.current = true;
          Alert.alert(t('taskFailed'), t('locationCaptureFailed'));
        }
      }
    })();
    return () => { mounted = false; watcher?.remove(); };
  }, [activeTaskId, userRole, t]);

  const toggleAvailability = async () => {
    if (online) {
      onlineRef.current = false;
      setOnline(false);
      try { await api.setCollectorAvailability(false); }
      catch (error) { Alert.alert(t('taskFailed'), error instanceof Error ? error.message : 'Please try again.'); }
      return;
    }
    if (userRole !== 'collector') {
      Alert.alert(t('taskFailed'), 'Collector access is enabled by the admin.');
      return;
    }
    if (!phone) {
      Alert.alert('Verified mobile number required', 'Sign in with a verified mobile number before going online so citizens can contact you.');
      return;
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { Alert.alert(t('addLocation'), t('locationPermission')); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await api.setCollectorAvailability(true, position.coords.latitude, position.coords.longitude);
      onlineRef.current = true;
      setOnline(true);
      await refresh();
      if (result?.assignedCount) {
        onlineRef.current = false;
        setOnline(false);
        Alert.alert(t('assignedToYou'));
      }
    } catch (error) {
      Alert.alert(t('taskFailed'), error instanceof Error ? error.message : t('locationCaptureFailed'));
      await refresh();
    }
  };

  const markCollected = async (reportId: number) => {
    setBusyId(reportId);
    try { await api.collectTask(reportId); await refresh(); }
    catch (error) { Alert.alert(t('taskFailed'), error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusyId(null); }
  };

  const declineTask = async (reportId: number) => {
    setBusyId(reportId);
    try {
      await api.declineTask(reportId);
      setAcceptedIds(prev => { const next = new Set(prev); next.delete(reportId); return next; });
      await refresh();
    } catch (error) { Alert.alert(t('taskFailed'), error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusyId(null); }
  };

  const submitSale = async (reportId: number) => {
    const rawAmount = saleAmounts[reportId]?.trim() ?? '';
    const revenue = Number(rawAmount);
    if (!rawAmount || !Number.isFinite(revenue) || revenue < 0) {
      Alert.alert(t('saleAmount'), 'Enter a valid sale amount in rupees.');
      return;
    }
    setBusyId(reportId);
    try { await api.recordSale(reportId, Math.round(revenue)); await refresh(); }
    catch (error) { Alert.alert(t('taskFailed'), error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusyId(null); }
  };

  const activeTasks = tasks.filter(task => task.status === 'assigned' || task.status === 'collected');

  return <TabPage title={t('takeAction')} subtitle={t('takeActionSubtitle')}>
    <InfoCard>
      <Text style={s.cardTitle}>{t('beforeCollect')}</Text>
      <Text style={s.muted}>{t('safety')}</Text>
      <Text style={[s.muted, { marginTop: 8 }]}>{t('onlineHint')}</Text>
      {userRole === 'collector' ? <>
        <Text style={s.label}>{t('collectorVerifiedPhone')}</Text>
        <View style={[s.input, { justifyContent: 'center', minHeight: 48 }]}>
          <Text style={s.bodyText}>{phone || t('collectorNoVerifiedPhone')}</Text>
        </View>
        <Text style={[s.muted, { marginTop: 5 }]}>{t('collectorPhoneHelp')}</Text>
      </> : null}
      <TouchableOpacity onPress={() => void toggleAvailability()} style={[s.pill, { marginTop: 12, backgroundColor: online ? '#475569' : '#15803d' }]} accessibilityRole="button">
        <Text style={s.pillText}>{online ? `●  ${t('goOffline')}` : `●  ${t('goOnline')}`}</Text>
      </TouchableOpacity>
    </InfoCard>
    {loading ? <ActivityIndicator color="#15803d" /> : activeTasks.length === 0 ? <InfoCard>
      <Text style={s.cardTitle}>{online ? t('noAssignments') : t('waitingForAssignment')}</Text>
      <Text style={s.muted}>{t('waitingForAssignment')}</Text>
    </InfoCard> : activeTasks.map(item => {
      const isAccepted = acceptedIds.has(item.id);
      return (
        <InfoCard key={item.id}>
          {/* Task Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={s.cardTitle}>🚛 {t('assignedToYou')} #{item.id}</Text>
            <View style={{ backgroundColor: item.status === 'assigned' ? '#dcfce7' : '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'assigned' ? '#15803d' : '#1d4ed8' }}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Waste Info */}
          <Text style={[s.bodyText, { fontWeight: '600' }]}>♻️ {item.wasteType}</Text>
          <Text style={s.bodyText}>📍 {item.location}</Text>
          <Text style={s.muted}>⚖️ Estimated: {item.amount}</Text>

          {/* Waste Photo */}
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 12, marginTop: 10, backgroundColor: '#eef3ef' }} resizeMode="cover" /> : null}

          {/* ACCEPT / DECLINE — shown only if not yet accepted */}
          {item.status === 'assigned' && !isAccepted ? (
            <View style={{ marginTop: 14 }}>
              <Text style={[s.muted, { textAlign: 'center', marginBottom: 10, fontWeight: '600' }]}>
                📬 Nayi complaint assign hui hai! Accept karein?
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setAcceptedIds(prev => new Set([...prev, item.id]))}
                  style={[s.pill, { flex: 1, backgroundColor: '#15803d' }]}
                  disabled={busyId === item.id}
                  accessibilityRole="button"
                >
                  <Text style={s.pillText}>✅ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void declineTask(item.id)}
                  style={[s.pill, { flex: 1, backgroundColor: '#dc2626' }]}
                  disabled={busyId === item.id}
                  accessibilityRole="button"
                >
                  {busyId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={s.pillText}>❌ Decline</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* NAVIGATION MAP — shown after accept or for collected tasks */}
          {(isAccepted || item.status === 'collected') && item.latitude != null && item.longitude != null ? <>
            <TrackingMap
              reportPoint={{ latitude: item.latitude, longitude: item.longitude }}
              collectorPoint={item.status === 'assigned' ? currentLocation : null}
              reportLabel={`Waste pickup · ${item.location}`}
              collectorLabel="Your current location"
              height={220}
            />
            {item.status === 'assigned' ? (
              <TouchableOpacity onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}&travelmode=driving`)} style={[s.pill, { backgroundColor: '#14532d' }]} accessibilityRole="button">
                <Text style={s.pillText}>🗺️ Navigate to Pickup ↗</Text>
              </TouchableOpacity>
            ) : null}
          </> : isAccepted && <Text style={s.muted}>Pickup location coordinates not available.</Text>}

          {/* MARK COLLECTED button — only after accept */}
          {item.status === 'assigned' && isAccepted ? (
            <TouchableOpacity onPress={() => void markCollected(item.id)} style={[s.pill, { marginTop: 10, backgroundColor: '#166534' }]} disabled={busyId === item.id} accessibilityRole="button">
              {busyId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={s.pillText}>✅ {t('startCollection')} — Kachra Collect Kiya!</Text>}
            </TouchableOpacity>
          ) : null}

          {/* SALE entry — after collected */}
          {item.status === 'collected' ? <View style={{ marginTop: 12 }}>
            <Text style={s.label}>💰 {t('saleAmount')} (Kitne mein becha?)</Text>
            <TextInput value={saleAmounts[item.id] ?? ''} onChangeText={value => setSaleAmounts(current => ({ ...current, [item.id]: value }))} placeholder="0" keyboardType="decimal-pad" style={s.input} accessibilityLabel={t('saleAmount')} />
            <TouchableOpacity onPress={() => void submitSale(item.id)} style={s.pill} disabled={busyId === item.id} accessibilityRole="button">
              {busyId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={s.pillText}>💵 {t('recordSale')}</Text>}
            </TouchableOpacity>
          </View> : null}
        </InfoCard>
      );
    })}
    {!api.isConfigured && <Text style={s.muted}>{t('serviceUnavailable')}</Text>}
  </TabPage>;
}
