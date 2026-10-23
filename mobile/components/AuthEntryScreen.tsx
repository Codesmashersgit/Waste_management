import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageToggle } from './LanguageToggle';
import { PhoneAuthForm } from './PhoneAuthForm';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { MobileAuthSession } from '../utils/api';

export function AuthEntryScreen({ mode }: { mode: 'login' | 'signup' }) {
  const { login, enterDemoMode } = useAuth();
  const { t } = useLanguage();

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
            <Text style={styles.backArrow}>‹</Text><Text style={styles.backLabel}>{t('authBack')}</Text>
          </TouchableOpacity>
          <LanguageToggle />
        </View>

        <View style={styles.illustration}>
          <View style={styles.sun} />
          <View style={styles.cloud}><View style={styles.cloudBump} /></View>
          <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>{mode === 'signup' ? '👋' : '🌱'}</Text></View>
          <View style={styles.illustrationBadge}><Text style={styles.badgeEmoji}>♻️</Text></View>
          <View style={styles.illustrationGround} />
        </View>

        <Text style={styles.brand}>WASTE-CHAiN</Text>
        <Text style={styles.subtitle}>{t('authScreenIntro')}</Text>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}><Text style={styles.benefitEmoji}>🔐</Text></View>
          <View style={styles.benefitCopy}>
            <Text style={styles.benefitTitle}>{t('authSecureNote')}</Text>
            <Text style={styles.benefitText}>{t('landingSubtitle')}</Text>
          </View>
        </View>

        <PhoneAuthForm mode={mode} onComplete={complete} />

        {__DEV__ && mode === 'login' ? <View style={styles.demoSection}>
          <TouchableOpacity style={styles.demoButton} onPress={() => void openDemoDashboard()} accessibilityRole="button">
            <Text style={styles.demoButtonText}>{t('demoDashboard')}</Text>
          </TouchableOpacity>
          <Text style={styles.demoHint}>{t('demoDashboardHint')}</Text>
        </View> : null}

        <TouchableOpacity style={styles.switchButton} onPress={switchMode} accessibilityRole="button">
          <Text style={styles.switchPrompt}>{t(mode === 'login' ? 'authCreatePrompt' : 'authLoginPrompt')} </Text>
          <Text style={styles.switchLink}>{t(mode === 'login' ? 'authCreate' : 'authLoginLink')}</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>{t('landingFooter')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fcf8' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 22, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backArrow: { color: '#274333', fontSize: 31, lineHeight: 33 },
  backLabel: { color: '#526258', fontSize: 12, fontWeight: '800' },
  illustration: { height: 138, borderRadius: 27, backgroundColor: '#e8f7eb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#d5eedb', marginBottom: 16 },
  sun: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: '#ffcf67', top: 16, right: 23 },
  cloud: { position: 'absolute', left: 34, top: 38, width: 57, height: 15, borderRadius: 10, backgroundColor: '#fff' },
  cloudBump: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', top: -10, left: 15 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#cfebd4', zIndex: 1 },
  avatarEmoji: { fontSize: 57 },
  illustrationBadge: { position: 'absolute', zIndex: 2, bottom: 22, right: '27%', width: 38, height: 38, borderRadius: 14, backgroundColor: '#188642', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 20 },
  illustrationGround: { position: 'absolute', left: -15, right: -15, bottom: -30, height: 63, borderRadius: 60, backgroundColor: '#80cd8a' },
  brand: { color: '#188642', fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 1.8 },
  subtitle: { color: '#66746a', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 5, marginBottom: 13 },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4ede5', marginBottom: 16 },
  benefitIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9f8ec' },
  benefitEmoji: { fontSize: 20 },
  benefitCopy: { flex: 1, gap: 2 },
  benefitTitle: { color: '#284432', fontSize: 12, fontWeight: '900' },
  benefitText: { color: '#718077', fontSize: 10, lineHeight: 15 },
  switchButton: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchPrompt: { color: '#758179', fontSize: 12, fontWeight: '600' },
  switchLink: { color: '#147b38', fontSize: 12, fontWeight: '900' },
  footnote: { color: '#929d95', fontSize: 10, textAlign: 'center' },
  demoSection: { marginTop: 4, marginBottom: 4 },
  demoButton: { minHeight: 48, borderRadius: 15, backgroundColor: '#102A28', alignItems: 'center', justifyContent: 'center' },
  demoButtonText: { color: '#C9F06A', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  demoHint: { color: '#728078', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
