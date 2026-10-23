import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useLanguage, type MessageKey } from '../../contexts/LanguageContext';
import { api, type WasteReport, type WasteVerification } from '../../utils/api';

const INK = '#102A28';
const GREEN = '#176B4D';
const GREEN_BRIGHT = '#24966C';
const LIME = '#C9F06A';
const SOFT = '#F3F5F2';
const LINE = '#E5E9E5';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

const wasteOptions: { value: string; key: MessageKey; icon: string; tint: string }[] = [
  { value: 'Plastic', key: 'plastic', icon: 'water_bottle', tint: '#E2F5E8' },
  { value: 'Paper', key: 'paper', icon: 'description', tint: '#E8F0FF' },
  { value: 'Organic', key: 'organic', icon: 'compost', tint: '#FFF0D6' },
  { value: 'Metal', key: 'metal', icon: 'build', tint: '#E7EDF1' },
  { value: 'Glass', key: 'glass', icon: 'wine_bar', tint: '#DDF4F1' },
  { value: 'Other', key: 'other', icon: 'recycling', tint: '#EEE9FF' },
];

type WastePhoto = { uri: string; base64: string; mimeType: string };
type FlowStep = 'photo' | 'materials' | 'result' | 'location' | 'success';

export default function ReportScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('photo');
  const [photo, setPhoto] = useState<WastePhoto | null>(null);
  const [wasteTypes, setWasteTypes] = useState<string[]>([]);
  const [verification, setVerification] = useState<WasteVerification | null>(null);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [locating, setLocating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<WasteReport | null>(null);

  const stepNumber = step === 'photo' ? 1 : step === 'materials' ? 2 : step === 'result' ? 3 : step === 'location' ? 4 : 4;
  const progress = step === 'success' ? 1 : stepNumber / 4;
  const detectedTypes = verification?.wasteTypes ?? [];
  const typeMismatch = Boolean(verification?.isWaste && detectedTypes.length && !detectedTypes.some(detected => wasteTypes.some(selected => selected.toLowerCase() === detected.toLowerCase())));
  const activeTitle = step === 'photo' ? t('reportStepPhoto') : step === 'materials' ? t('reportStepMaterials') : step === 'result' ? t('verifiedResultTitle') : step === 'location' ? t('reportStepLocation') : t('reportLiveTitle');
  const selectedLabel = useMemo(() => wasteTypes.map(value => t((wasteOptions.find(option => option.value === value)?.key ?? 'other') as MessageKey)).join(', '), [t, wasteTypes]);

  const pickPhoto = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert(t('photoRequired'), t('verifyFailed'));
      return;
    }
    setPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
    setVerification(null);
    setStep('materials');
    // Auto-capture location in background — so by the time user reaches location step, it's already done 📍
    void captureLocation();
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('photoRequired'), t('cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.72, base64: true });
    pickPhoto(result);
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.72, base64: true });
    pickPhoto(result);
  };

  const toggleWasteType = (type: string) => {
    setWasteTypes(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
    setVerification(null);
  };

  const verifyPhoto = async () => {
    if (!photo) {
      Alert.alert(t('photoRequired'), t('photoRequiredDesc'));
      return;
    }
    if (!wasteTypes.length) {
      Alert.alert(t('selectTypeRequired'), t('selectTypeRequiredDesc'));
      return;
    }
    if (!api.isConfigured) {
      Alert.alert(t('notVerified'), t('verificationUnavailable'));
      return;
    }
    setVerifying(true);
    try {
      const result = await api.verifyWaste({ imageBase64: photo.base64, mimeType: photo.mimeType, selectedTypes: wasteTypes, language });
      setVerification(result);
      if (result.isWaste) {
        setAmount(result.estimatedAmount || '');
        setStep('result');
      } else {
        Alert.alert(t('notVerified'), result.notes || t('verifyFailed'));
      }
    } catch {
      Alert.alert(t('notVerified'), t('verifyFailed'));
    } finally {
      setVerifying(false);
    }
  };

  const captureLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('addLocation'), t('locationPermission'));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setCoordinates(point);
      try {
        const addresses = await Location.reverseGeocodeAsync(point);
        const address = addresses[0];
        if (address) {
          const locality = [address.name, address.street, address.district, address.city, address.region].filter(Boolean);
          if (locality.length) setLocation([...new Set(locality)].join(', '));
        }
      } catch {
        // Coordinates are enough to route the collector if reverse geocoding is offline.
      }
    } catch {
      Alert.alert(t('addLocation'), t('locationCaptureFailed'));
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    if (!wasteTypes.length) {
      Alert.alert(t('selectTypeRequired'), t('selectTypeRequiredDesc'));
      return;
    }
    if (!location.trim()) {
      Alert.alert(t('addLocation'), t('locationRequired'));
      return;
    }
    if (!coordinates) {
      Alert.alert(t('addLocation'), t('locationPermission'));
      return;
    }
    if (!photo) {
      Alert.alert(t('photoRequired'), t('photoRequiredDesc'));
      return;
    }
    if (!verification?.isWaste) {
      Alert.alert(t('verifyRequired'), t('verifyRequiredDesc'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitReport({
        location: location.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        wasteType: wasteTypes.join(', '),
        amount: amount.trim() || verification.estimatedAmount,
        details: details.trim(),
        imageBase64: photo.base64,
        mimeType: photo.mimeType,
        verificationResult: verification,
      });
      setSubmittedReport(result);
      setStep('success');
    } catch (error) {
      Alert.alert(t('reportFailed'), error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('photo');
    setPhoto(null);
    setWasteTypes([]);
    setVerification(null);
    setLocation('');
    setCoordinates(null);
    setAmount('');
    setDetails('');
    setSubmittedReport(null);
  };

  return (
    <SafeAreaView style={[styles.safe, step === 'photo' && styles.safeDark]} edges={['top']}>
      <StatusBar style={step === 'photo' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 'success' ? (
          <View style={styles.successPage}>
            <View style={styles.successOrb}><Text style={styles.successCheck}>✓</Text></View>
            <View style={styles.successBadge}><Text style={styles.successBadgeText}>{t('reportSubmitted').toUpperCase()}</Text></View>
            <Text style={styles.successTitle}>{t('reportLiveTitle')}</Text>
            <Text style={styles.successCopy}>{t('reportSent')}</Text>
            <View style={styles.timelineCard}>
              <TimelineItem active title={t('verifiedResultTitle')} detail={`${selectedLabel} · ${amount || verification?.estimatedAmount || '—'}`} />
              <TimelineItem active title={t('collectorAssignmentTitle')} detail={submittedReport?.collectorName || t('findingCollector')} last />
            </View>
            <View style={styles.reportIdCard}>
              <View><Text style={styles.detailEyebrow}>{t('reportNumberLabel')}</Text><Text style={styles.reportId}>#{submittedReport?.id ?? '—'}</Text></View>
              <Text style={styles.reportIdIcon}>♻</Text>
            </View>
            <PrimaryButton label={t('backToHome')} onPress={() => { reset(); router.replace('/(tabs)/home'); }} />
            <TouchableOpacity onPress={reset} style={styles.secondaryAction} accessibilityRole="button"><Text style={styles.secondaryActionText}>{t('startAnotherReport')}</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.topHeader, step === 'photo' && styles.topHeaderDark]}>
              <View style={styles.topLine}>
                {step !== 'photo' ? <TouchableOpacity onPress={() => setStep(step === 'materials' ? 'photo' : step === 'result' ? 'materials' : 'result')} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('authBack')}><Text style={styles.backGlyph}>‹</Text></TouchableOpacity> : <View style={styles.brandMark}><Text style={styles.brandGlyph}>♻</Text></View>}
                <View style={styles.titleBlock}><Text style={[styles.screenTitle, step === 'photo' && styles.lightText]}>{t('reportTitle')}</Text><Text style={[styles.screenSubtitle, step === 'photo' && styles.lightMuted]}>{activeTitle}</Text></View>
                <LanguageToggle />
              </View>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
                <Text style={[styles.progressLabel, step === 'photo' && styles.lightMuted]}>{String(stepNumber).padStart(2, '0')} / 04</Text>
              </View>
              {step === 'photo' ? <View style={styles.photoIntro}><Text style={styles.photoIntroEyebrow}>{t('reportStepPhoto').toUpperCase()}</Text><Text style={styles.photoIntroTitle}>{t('photoFirstTitle')}</Text><Text style={styles.photoIntroText}>{t('photoFirstDesc')}</Text></View> : null}
            </View>

            {step === 'photo' ? (
              <View style={styles.pageBody}>
                <View style={styles.cameraIllustration}>
                  <View style={styles.illustrationHalo} />
                  <View style={styles.cameraIconBox}><Text style={styles.cameraIcon}>photo_camera</Text></View>
                  <View style={styles.photoTips}><Text style={styles.tipDot}>●</Text><Text style={styles.photoTipText}>{t('photoUploadHint')}</Text></View>
                </View>
                <View style={styles.primaryActions}>
                  <PrimaryButton label={t('camera')} icon="photo_camera" iconFont onPress={() => void takePhoto()} />
                  <TouchableOpacity style={styles.galleryButton} onPress={() => void choosePhoto()} accessibilityRole="button"><Text style={styles.galleryIcon}>photo_library</Text><Text style={styles.galleryLabel}>{t('gallery')}</Text></TouchableOpacity>
                </View>
                <View style={styles.privacyNote}><Text style={styles.privacyIcon}>✓</Text><Text style={styles.privacyText}>{t('photoPrivacyHint')}</Text></View>
              </View>
            ) : null}

            {step === 'materials' ? (
              <View style={styles.pageBody}>
                {photo ? <View style={styles.photoFrame}><Image source={{ uri: photo.uri }} style={styles.photoPreview} accessibilityLabel={t('addPhoto')} /><View style={styles.photoReadyBadge}><Text style={styles.photoReadyCheck}>✓</Text><Text style={styles.photoReadyText}>{t('photoReady')}</Text></View><TouchableOpacity style={styles.retakeButton} onPress={() => setStep('photo')} accessibilityRole="button"><Text style={styles.retakeText}>↻  {t('retakePhoto')}</Text></TouchableOpacity></View> : null}
                <SectionHeading eyebrow={t('reportStepMaterials')} title={t('selectMaterialsTitle')} detail={t('selectMaterialsHint')} />
                <View style={styles.typeGrid}>
                  {wasteOptions.map(option => {
                    const selected = wasteTypes.includes(option.value);
                    return <TouchableOpacity key={option.value} onPress={() => toggleWasteType(option.value)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.typeCard, selected && styles.typeCardSelected]}>
                      <View style={[styles.typeIconWrap, { backgroundColor: option.tint }]}><Text style={styles.typeIcon}>{option.icon}</Text></View>
                      <Text numberOfLines={1} style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{t(option.key)}</Text>
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Text style={styles.checkboxText}>✓</Text> : null}</View>
                    </TouchableOpacity>;
                  })}
                </View>
                <View style={styles.selectedHint}><Text style={styles.selectedCount}>{wasteTypes.length}</Text><Text style={styles.selectedCopy}>{t('selected')}</Text></View>
                <PrimaryButton label={verifying ? t('verifying') : t('verifyGemini')} icon={verifying ? undefined : '✦'} onPress={() => void verifyPhoto()} disabled={verifying || !wasteTypes.length} loading={verifying} />
                <Text style={styles.serviceHint}>{api.isConfigured ? t('reportingLive') : t('verificationUnavailable')}</Text>
              </View>
            ) : null}

            {step === 'result' && verification ? (
              <View style={styles.pageBody}>
                {photo ? <View style={styles.resultPhotoFrame}><Image source={{ uri: photo.uri }} style={styles.photoPreview} accessibilityLabel={t('addPhoto')} /><View style={styles.confidencePill}><Text style={styles.confidenceSpark}>✦</Text><Text style={styles.confidenceText}>{Math.round(verification.confidence * 100)}% {t('confidence')}</Text></View></View> : null}
                <View style={styles.verifiedHeading}><View style={styles.verifiedIcon}><Text style={styles.verifiedCheck}>✓</Text></View><View style={styles.verifiedCopy}><Text style={styles.detailEyebrow}>{t('verifiedResultTitle').toUpperCase()}</Text><Text style={styles.verifiedTitle}>{verification.wasteTypes.join(', ') || selectedLabel}</Text></View></View>
                <View style={styles.resultMetrics}>
                  <MetricCard label={t('aiAmount')} value={verification.estimatedAmount || '—'} icon="↕" />
                  <MetricCard label={t('confidence')} value={`${Math.round(verification.confidence * 100)}%`} icon="✦" />
                </View>
                {verification.notes ? <View style={styles.aiNote}><Text style={styles.aiNoteIcon}>✦</Text><View style={styles.aiNoteCopy}><Text style={styles.aiNoteTitle}>{t('aiNotes')}</Text><Text style={styles.aiNoteText}>{verification.notes}</Text></View></View> : null}
                {typeMismatch ? <View style={styles.mismatchBox}><Text style={styles.mismatchText}>{t('materialMismatch')}</Text></View> : null}
                <View style={styles.aiCategoryRow}><Text style={styles.aiCategoryLabel}>{t('aiTypes')}</Text><TouchableOpacity onPress={() => { setVerification(null); setStep('materials'); }} accessibilityRole="button"><Text style={styles.editText}>{t('editMaterials')} ›</Text></TouchableOpacity></View>
                <View style={styles.chipRow}>{wasteTypes.map(type => <View key={type} style={styles.materialChip}><Text style={styles.materialChipText}>{t((wasteOptions.find(option => option.value === type)?.key ?? 'other') as MessageKey)}</Text></View>)}</View>
                <PrimaryButton label={t('continueToLocation')} icon="→" onPress={() => setStep('location')} />
              </View>
            ) : null}

            {step === 'location' ? (
              <View style={styles.pageBody}>
                <SectionHeading eyebrow={t('reportStepLocation')} title={t('confirmLocationTitle')} detail={t('reportLocationHint')} />
                <View style={styles.locationCard}>
                  <View style={styles.locationPin}><Text style={styles.locationPinGlyph}>⌖</Text></View>
                  <View style={styles.locationInfo}><Text style={styles.locationTitle}>{coordinates ? t('locationCaptured') : t('useCurrentLocation')}</Text><Text style={styles.locationCoordinates}>{coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}` : t('locationPermission')}</Text></View>
                  <View style={[styles.locationStatus, coordinates && styles.locationStatusReady]}><Text style={styles.locationStatusGlyph}>{coordinates ? '✓' : '·'}</Text></View>
                </View>
                <TouchableOpacity onPress={() => void captureLocation()} style={styles.locationButton} disabled={locating} accessibilityRole="button">
                  {locating ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.locationButtonGlyph}>⌖</Text><Text style={styles.locationButtonText}>{t('useCurrentLocation')}</Text></>}
                </TouchableOpacity>
                <Text style={styles.fieldLabel}>{t('location')}</Text>
                <TextInput value={location} onChangeText={setLocation} placeholder={t('locationPlaceholder')} placeholderTextColor="#98A39D" style={styles.textInput} accessibilityLabel={t('location')} returnKeyType="next" />
                <Text style={styles.fieldLabel}>{t('amount')}</Text>
                <TextInput value={amount} onChangeText={setAmount} placeholder={verification?.estimatedAmount || t('amountPlaceholder')} placeholderTextColor="#98A39D" style={styles.textInput} accessibilityLabel={t('amount')} returnKeyType="next" />
                <Text style={styles.fieldLabel}>{t('details')}</Text>
                <TextInput value={details} onChangeText={setDetails} placeholder={t('detailsPlaceholder')} placeholderTextColor="#98A39D" style={[styles.textInput, styles.detailsInput]} multiline maxLength={240} textAlignVertical="top" accessibilityLabel={t('details')} />
                <View style={styles.submitSummary}><View style={styles.summaryCheck}><Text style={styles.summaryCheckText}>✓</Text></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{selectedLabel || t('whatFound')}</Text><Text style={styles.summaryDetail}>{t('verified')} · {amount || verification?.estimatedAmount || '—'}</Text></View>{photo ? <Image source={{ uri: photo.uri }} style={styles.summaryPhoto} /> : null}</View>
                <PrimaryButton label={submitting ? t('reportSending') : t('submitReport')} icon={submitting ? undefined : '→'} onPress={() => void submit()} disabled={submitting} loading={submitting} />
                <Text style={styles.serviceHint}>{api.isConfigured ? t('reportingLive') : t('reportingUnavailable')}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow.toUpperCase()}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDetail}>{detail}</Text></View>;
}

function PrimaryButton({ label, icon, iconFont = false, onPress, disabled = false, loading = false }: { label: string; icon?: string; iconFont?: boolean; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={[styles.primaryButton, disabled && styles.disabledButton]} disabled={disabled} activeOpacity={0.86} accessibilityRole="button">
    {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryButtonLabel}>{label}</Text>{icon ? <Text style={[styles.primaryButtonIcon, iconFont && styles.materialIcon]}>{icon}</Text> : null}</>}
  </TouchableOpacity>;
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <View style={styles.metricCard}><Text style={styles.metricIcon}>{icon}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function TimelineItem({ active, title, detail, last = false }: { active: boolean; title: string; detail: string; last?: boolean }) {
  return <View style={styles.timelineItem}><View style={[styles.timelineMarker, active && styles.timelineMarkerActive]}><Text style={styles.timelineMarkerText}>{active ? '✓' : '·'}</Text></View><View style={styles.timelineCopy}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.timelineDetail}>{detail}</Text></View>{!last ? <View style={styles.timelineLine} /> : null}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  safeDark: { backgroundColor: INK },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  topHeader: { backgroundColor: '#FFFFFF', paddingHorizontal: 21, paddingTop: 10, paddingBottom: 22 },
  topHeaderDark: { backgroundColor: INK, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 24 },
  topLine: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 40, height: 40, borderRadius: 14, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  brandGlyph: { color: INK, fontSize: 23 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: INK, fontFamily: FONT.medium, fontSize: 34, lineHeight: 39, marginTop: -4 },
  titleBlock: { flex: 1 },
  screenTitle: { color: INK, fontFamily: FONT.bold, fontSize: 17, lineHeight: 23 },
  screenSubtitle: { color: MUTED, fontFamily: FONT.regular, fontSize: 12, lineHeight: 17 },
  lightText: { color: '#FFFFFF' },
  lightMuted: { color: '#AFC1BA' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  progressTrack: { height: 5, flex: 1, borderRadius: 9, backgroundColor: '#E8ECE8', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 9, backgroundColor: GREEN_BRIGHT },
  progressLabel: { color: MUTED, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 0.5 },
  photoIntro: { marginTop: 28 },
  photoIntroEyebrow: { color: LIME, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.6 },
  photoIntroTitle: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 29, lineHeight: 37, marginTop: 6 },
  photoIntroText: { color: '#B7C9C2', fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, marginTop: 5, maxWidth: 310 },
  pageBody: { paddingHorizontal: 21, paddingTop: 20, gap: 15 },
  cameraIllustration: { minHeight: 285, borderRadius: 26, backgroundColor: '#E8EEE9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  illustrationHalo: { position: 'absolute', width: 235, height: 235, borderRadius: 118, backgroundColor: '#D9EACF' },
  cameraIconBox: { width: 100, height: 100, borderRadius: 31, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', shadowColor: INK, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5, transform: [{ rotate: '-5deg' }] },
  cameraIcon: { color: LIME, fontFamily: 'MaterialSymbols_400Regular', fontSize: 48, lineHeight: 57 },
  photoTips: { position: 'absolute', bottom: 18, left: 18, right: 18, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 9, alignItems: 'center' },
  tipDot: { color: GREEN_BRIGHT, fontSize: 10 },
  photoTipText: { color: MUTED, fontFamily: FONT.medium, fontSize: 11, flex: 1 },
  primaryActions: { gap: 10 },
  primaryButton: { minHeight: 55, backgroundColor: GREEN, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18, shadowColor: GREEN, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  primaryButtonLabel: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 15, flex: 1, textAlign: 'center', paddingLeft: 22 },
  primaryButtonIcon: { color: LIME, fontFamily: FONT.bold, fontSize: 21, minWidth: 22, textAlign: 'right' },
  disabledButton: { opacity: 0.5 },
  galleryButton: { minHeight: 52, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  galleryIcon: { fontSize: 21, lineHeight: 26, color: GREEN, fontFamily: 'MaterialSymbols_400Regular' },
  galleryLabel: { color: INK, fontFamily: FONT.bold, fontSize: 14 },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 5, marginTop: 2 },
  privacyIcon: { color: GREEN_BRIGHT, fontFamily: FONT.bold, fontSize: 15 },
  privacyText: { flex: 1, color: MUTED, fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },
  photoFrame: { borderRadius: 23, overflow: 'hidden', height: 235, backgroundColor: SOFT, position: 'relative' },
  photoPreview: { width: '100%', height: '100%' },
  photoReadyBadge: { position: 'absolute', left: 12, bottom: 12, borderRadius: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoReadyCheck: { color: GREEN_BRIGHT, fontFamily: FONT.bold, fontSize: 12 },
  photoReadyText: { color: INK, fontFamily: FONT.bold, fontSize: 10 },
  retakeButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  retakeText: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  sectionHeading: { marginTop: 2 },
  sectionEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.1 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 23, lineHeight: 29, marginTop: 3 },
  sectionDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 13, lineHeight: 19, marginTop: 3 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  typeCard: { width: '31.5%', minHeight: 95, borderWidth: 1, borderColor: LINE, borderRadius: 17, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  typeCardSelected: { borderColor: GREEN_BRIGHT, backgroundColor: '#F2FAF5' },
  typeIconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  typeIcon: { fontFamily: 'MaterialSymbols_400Regular', fontSize: 23, lineHeight: 28, color: GREEN },
  materialIcon: { fontFamily: 'MaterialSymbols_400Regular' },
  typeLabel: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  typeLabelSelected: { color: GREEN },
  checkbox: { position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 6, borderWidth: 1, borderColor: '#C5CEC8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: GREEN_BRIGHT, borderColor: GREEN_BRIGHT },
  checkboxText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 10, lineHeight: 12 },
  selectedHint: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: SOFT, borderRadius: 12, paddingVertical: 5, paddingHorizontal: 10 },
  selectedCount: { color: GREEN, fontFamily: FONT.bold, fontSize: 12 },
  selectedCopy: { color: MUTED, fontFamily: FONT.medium, fontSize: 11 },
  serviceHint: { textAlign: 'center', color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15, marginTop: -7, paddingHorizontal: 12 },
  resultPhotoFrame: { height: 205, borderRadius: 23, overflow: 'hidden', backgroundColor: SOFT, position: 'relative' },
  confidencePill: { position: 'absolute', bottom: 12, left: 12, borderRadius: 20, backgroundColor: INK, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  confidenceSpark: { color: LIME, fontSize: 13 },
  confidenceText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 10 },
  verifiedHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifiedIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  verifiedCheck: { color: GREEN, fontFamily: FONT.bold, fontSize: 24 },
  verifiedCopy: { flex: 1 },
  detailEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1 },
  verifiedTitle: { color: INK, fontFamily: FONT.bold, fontSize: 18, lineHeight: 24 },
  resultMetrics: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, minHeight: 93, padding: 12, borderRadius: 16, backgroundColor: SOFT, position: 'relative' },
  metricIcon: { color: GREEN_BRIGHT, fontFamily: FONT.bold, fontSize: 18 },
  metricLabel: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, marginTop: 5 },
  metricValue: { color: INK, fontFamily: FONT.bold, fontSize: 15 },
  aiNote: { flexDirection: 'row', gap: 10, backgroundColor: '#F4F8F3', borderRadius: 16, borderWidth: 1, borderColor: '#E7EEE7', padding: 13 },
  aiNoteIcon: { color: GREEN, fontSize: 16 },
  aiNoteCopy: { flex: 1 },
  aiNoteTitle: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  aiNoteText: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, marginTop: 2 },
  mismatchBox: { padding: 11, borderRadius: 13, backgroundColor: '#FFF4E6' },
  mismatchText: { color: '#9A5B17', fontFamily: FONT.medium, fontSize: 11, lineHeight: 16 },
  aiCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiCategoryLabel: { color: INK, fontFamily: FONT.bold, fontSize: 13 },
  editText: { color: GREEN, fontFamily: FONT.bold, fontSize: 11 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -8 },
  materialChip: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: '#DFF7E8' },
  materialChipText: { color: GREEN, fontFamily: FONT.bold, fontSize: 10 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  locationPin: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  locationPinGlyph: { color: GREEN, fontSize: 23 },
  locationInfo: { flex: 1 },
  locationTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  locationCoordinates: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15 },
  locationStatus: { width: 25, height: 25, borderRadius: 13, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center' },
  locationStatusReady: { backgroundColor: '#DFF7E8' },
  locationStatusGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 15 },
  locationButton: { minHeight: 49, borderRadius: 15, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  locationButtonGlyph: { color: LIME, fontSize: 21 },
  locationButtonText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 13 },
  fieldLabel: { color: INK, fontFamily: FONT.bold, fontSize: 12, marginBottom: -9 },
  textInput: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: '#FAFBFA', paddingHorizontal: 14, color: INK, fontFamily: FONT.medium, fontSize: 13 },
  detailsInput: { minHeight: 86, paddingTop: 12 },
  submitSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 16, backgroundColor: '#F4F8F4', borderWidth: 1, borderColor: '#E7EEE7' },
  summaryCheck: { width: 32, height: 32, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  summaryCheckText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 17 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  summaryDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 10 },
  summaryPhoto: { width: 42, height: 42, borderRadius: 11 },
  successPage: { flex: 1, paddingHorizontal: 24, paddingTop: 44, paddingBottom: 20, alignItems: 'stretch' },
  successOrb: { alignSelf: 'center', width: 90, height: 90, borderRadius: 32, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.18, shadowRadius: 18, elevation: 4 },
  successCheck: { color: LIME, fontFamily: FONT.bold, fontSize: 45, lineHeight: 54 },
  successBadge: { alignSelf: 'center', backgroundColor: '#DFF7E8', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6, marginTop: 23 },
  successBadgeText: { color: GREEN, fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.8 },
  successTitle: { color: INK, fontFamily: FONT.bold, fontSize: 27, lineHeight: 34, textAlign: 'center', marginTop: 10 },
  successCopy: { color: MUTED, fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 5, marginBottom: 21 },
  timelineCard: { backgroundColor: '#F7F9F7', borderRadius: 19, padding: 15, marginBottom: 13 },
  timelineItem: { minHeight: 59, flexDirection: 'row', alignItems: 'flex-start', gap: 11, position: 'relative' },
  timelineMarker: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#E7ECE8', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineMarkerActive: { backgroundColor: '#DFF7E8' },
  timelineMarkerText: { color: GREEN, fontFamily: FONT.bold, fontSize: 13 },
  timelineCopy: { flex: 1, paddingTop: 1 },
  timelineTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  timelineDetail: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15 },
  timelineLine: { position: 'absolute', top: 25, left: 12, width: 1, height: 34, backgroundColor: '#DCE5DE' },
  reportIdCard: { padding: 15, marginBottom: 19, borderRadius: 18, backgroundColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportId: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 20 },
  reportIdIcon: { color: LIME, fontSize: 30 },
  secondaryAction: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  secondaryActionText: { color: GREEN, fontFamily: FONT.bold, fontSize: 13 },
});
