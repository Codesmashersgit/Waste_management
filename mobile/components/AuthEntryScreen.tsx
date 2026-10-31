import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageToggle } from './LanguageToggle';
import { PhoneAuthForm } from './PhoneAuthForm';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { MobileAuthSession } from '../utils/api';

const FONT = {
  regular: 'DMSans_500Medium',
  medium: 'Manrope_600SemiBold',
  semiBold: 'Manrope_700Bold',
  bold: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
} as const;

export function AuthEntryScreen({ mode }: { mode: 'login' | 'signup' }) {
  const { login, enterDemoMode } = useAuth();
  const { t, language } = useLanguage();

  const complete = async (session: MobileAuthSession) => {
    await login(session);
    router.replace('/(tabs)/home');
  };

  const openDemoDashboard = async () => {
    await enterDemoMode();
    router.replace('/(tabs)/home');
  };

  const goBack = () => router.replace('/');
  const switchMode = () => router.replace(mode === 'login' ? '/signup' : '/login');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel={t('authBack')}>
            <View style={styles.backIconCircle}>
              <Text style={styles.backArrow}>‹</Text>
            </View>
            <Text style={styles.backLabel}>{t('authBack')}</Text>
          </TouchableOpacity>
          <LanguageToggle />
        </View>

        {/* Premium Fintech / Modern Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroBadgeRow}>
            <View style={styles.networkBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.networkBadgeText}>
                {mode === 'signup' 
                  ? (language === 'hi' ? 'नया नागरिक खाता' : 'NEW RESIDENT CITIZEN') 
                  : (language === 'hi' ? 'सुरक्षित प्रमाणीकरण' : 'SECURE PHONE PORTAL')}
              </Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>v2.4 OTP</Text>
            </View>
          </View>

          <View style={styles.heroBrandRow}>
            <View style={styles.brandIconBox}>
              <Text style={styles.brandIcon}>{mode === 'signup' ? '🌱' : '⚡'}</Text>
            </View>
            <View style={styles.heroTitleBox}>
              <Text style={styles.heroBrandTitle}>WasteCHAiN</Text>
              <Text style={styles.heroBrandSub}>
                {mode === 'signup' 
                  ? (language === 'hi' ? 'सफाई में भाग लें व रिवॉर्ड पाएँ' : 'Citizen Eco-Logistics Network')
                  : (language === 'hi' ? 'मोबाइल नंबर से तुरंत लॉगिन करें' : 'One-Tap Verified Mobile Sign-in')}
              </Text>
            </View>
          </View>

          {/* Feature Badges Bar */}
          <View style={styles.pillRow}>
            <View style={styles.microPill}>
              <Text style={styles.microPillIcon}>💬</Text>
              <Text style={styles.microPillText}>{language === 'hi' ? 'तुरंत SMS OTP' : 'Instant SMS'}</Text>
            </View>
            <View style={styles.microPill}>
              <Text style={styles.microPillIcon}>📍</Text>
              <Text style={styles.microPillText}>{language === 'hi' ? 'GPS टैग्ड' : 'GPS Verified'}</Text>
            </View>
            <View style={styles.microPill}>
              <Text style={styles.microPillIcon}>🪙</Text>
              <Text style={styles.microPillText}>{language === 'hi' ? 'इको टोकन' : 'Eco Points'}</Text>
            </View>
          </View>
        </View>

        {/* Phone OTP Verification Form */}
        <View style={styles.formContainer}>
          <PhoneAuthForm mode={mode} onComplete={complete} />
        </View>

        {__DEV__ && mode === 'login' ? (
          <View style={styles.demoSection}>
            <TouchableOpacity style={styles.demoButton} onPress={() => void openDemoDashboard()} accessibilityRole="button">
              <Text style={styles.demoButtonText}>{t('demoDashboard')}</Text>
            </TouchableOpacity>
            <Text style={styles.demoHint}>{t('demoDashboardHint')}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.switchButton} onPress={switchMode} accessibilityRole="button">
          <Text style={styles.switchPrompt}>{t(mode === 'login' ? 'authCreatePrompt' : 'authLoginPrompt')} </Text>
          <Text style={styles.switchLink}>{t(mode === 'login' ? 'authCreate' : 'authLoginLink')}</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          {language === 'hi' 
            ? 'गोपनीयता सुरक्षित · OTP कोड किसी के साथ साझा न करें' 
            : 'End-to-End Encrypted · Do not share your OTP with anyone'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0C1E1B' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backArrow: { color: '#E8F5E9', fontSize: 24, lineHeight: 26, marginTop: -2 },
  backLabel: { color: '#A5C4B5', fontSize: 13, fontFamily: FONT.bold },

  heroCard: {
    backgroundColor: '#132C27',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E493F',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(201, 240, 106, 0.08)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 240, 106, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 240, 106, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9F06A',
  },
  networkBadgeText: {
    color: '#C9F06A',
    fontSize: 11,
    fontFamily: FONT.heavy,
    letterSpacing: 0.5,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionBadgeText: {
    color: '#8CA699',
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  brandIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#1E493F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F6E5E',
  },
  brandIcon: {
    fontSize: 26,
  },
  heroTitleBox: {
    flex: 1,
  },
  heroBrandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: FONT.heavy,
    letterSpacing: -0.3,
  },
  heroBrandSub: {
    color: '#A5C4B5',
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONT.medium,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
  },
  microPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  microPillIcon: {
    fontSize: 11,
  },
  microPillText: {
    color: '#D4E8DC',
    fontSize: 11,
    fontFamily: FONT.bold,
  },

  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 18,
  },

  switchButton: { minHeight: 46, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchPrompt: { color: '#8EA498', fontSize: 13, fontFamily: FONT.medium },
  switchLink: { color: '#C9F06A', fontSize: 13, fontFamily: FONT.heavy },
  footnote: { color: '#5A7569', fontSize: 11, textAlign: 'center', marginTop: 8, fontFamily: FONT.medium },
  demoSection: { marginTop: 4, marginBottom: 8 },
  demoButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#1E493F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E6E5F' },
  demoButtonText: { color: '#C9F06A', fontSize: 13, fontFamily: FONT.bold },
  demoHint: { color: '#7E978B', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 5 },
});
