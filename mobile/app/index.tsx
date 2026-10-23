import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '../components/LanguageToggle';
import { PhoneAuthForm } from '../components/PhoneAuthForm';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { MobileAuthSession } from '../utils/api';

export default function WelcomeScreen() {
  const { userId, login, enterDemoMode, isLoading, isDemo } = useAuth();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ ref?: string }>();
  const initialReferralCode = typeof params.ref === 'string' ? params.ref : '';
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authDestination, setAuthDestination] = useState<'home' | 'report'>('report');
  const [signupRole, setSignupRole] = useState<'citizen' | 'collector'>('citizen');

  if (isLoading) return <View style={styles.loading} />;
  if (isDemo || userId != null) return <Redirect href="/(tabs)/home" />;

  const openAuth = (mode: 'login' | 'signup', destination: 'home' | 'report') => {
    setAuthMode(mode);
    setAuthDestination(destination);
    setAuthVisible(true);
  };
  const completeAuth = async (session: MobileAuthSession) => {
    await login(session);
    setAuthVisible(false);
    router.replace(authDestination === 'report' ? '/(tabs)/report' : '/(tabs)/home');
  };
  const openDemoDashboard = async () => {
    await enterDemoMode();
    setAuthVisible(false);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandLeaf}>♻️</Text></View>
            <View><Text style={styles.brandName}>WasteCHAiN</Text><Text style={styles.brandLine}>{t('landingTagline')}</Text></View>
          </View>
          <LanguageToggle />
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.eyebrow}><View style={styles.eyebrowDot} /><Text style={styles.eyebrowText}>{t('landingEyebrow')}</Text></View>
          <Text style={styles.title}>{t('landingTitle')}</Text>
          <Text style={styles.subtitle}>{t('landingSubtitle')}</Text>
        </View>

        <View style={styles.signupRoles}>
          <Text style={styles.rolePickerTitle}>{language === 'hi' ? 'आप WasteChain का इस्तेमाल कैसे करेंगे?' : 'How will you use WasteChain?'}</Text>
          <View style={styles.signupRoleRow}>
            <TouchableOpacity style={[styles.signupRoleCard, signupRole === 'citizen' && styles.signupRoleSelected]} onPress={() => setSignupRole('citizen')} accessibilityRole="radio" accessibilityState={{ selected: signupRole === 'citizen' }}>
              <Text style={styles.signupRoleIcon}>🏘️</Text><Text style={styles.signupRoleName}>{language === 'hi' ? 'रिपोर्ट करें' : 'Report waste'}</Text><Text style={styles.signupRoleHint}>{language === 'hi' ? 'निवासी खाता' : 'Resident account'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.signupRoleCard, signupRole === 'collector' && styles.signupRoleSelected]} onPress={() => setSignupRole('collector')} accessibilityRole="radio" accessibilityState={{ selected: signupRole === 'collector' }}>
              <Text style={styles.signupRoleIcon}>♻️</Text><Text style={styles.signupRoleName}>{language === 'hi' ? 'कलेक्टर बनें' : 'Collect waste'}</Text><Text style={styles.signupRoleHint}>{language === 'hi' ? 'एडमिन की मंज़ूरी' : 'Admin approval'}</Text>
            </TouchableOpacity>
          </View>
          {signupRole === 'collector' ? <Text style={styles.roleApprovalHint}>{language === 'hi' ? 'आपकी पहचान की जाँच के बाद एडमिन कलेक्टर सुविधा चालू करेगा।' : 'An administrator must approve collector access before pickup tasks are enabled.'}</Text> : null}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={() => openAuth('signup', 'report')} activeOpacity={0.88} accessibilityRole="button">
          <Text style={styles.cameraButtonIcon}>{signupRole === 'collector' ? '♻️' : '📸'}</Text><Text style={styles.createButtonText}>{signupRole === 'collector' ? (language === 'hi' ? 'कलेक्टर के लिए आवेदन' : 'Request collector access') : t('landingCreateAccount')}</Text><Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => openAuth('login', 'home')} activeOpacity={0.75} accessibilityRole="button">
          <Text style={styles.loginPrompt}>{t('landingHaveAccount')} </Text><Text style={styles.loginLink}>{t('landingLogin')}</Text>
        </TouchableOpacity>

        <View style={styles.cartoonScene} accessibilityLabel={t('landingIllustration')}>
          <View style={styles.sun} />
          <View style={[styles.cloud, styles.cloudOne]} /><View style={[styles.cloud, styles.cloudTwo]} />
          <View style={styles.sparkleOne}><Text>✦</Text></View><View style={styles.sparkleTwo}><Text>✦</Text></View>
          <View style={styles.ground} />
          <View style={styles.planet}><Text style={styles.planetEmoji}>🌍</Text></View>
          <View style={styles.cartoonPerson}><Text style={styles.personEmoji}>🧑🏽‍🌾</Text></View>
          <View style={styles.cartoonBin}><Text style={styles.binEmoji}>♻️</Text></View>
          <View style={styles.floatingLeaf}><Text>🍃</Text></View>
          <View style={styles.sceneLabel}><Text style={styles.sceneLabelText}>📸  →  ✨  →  🪙</Text></View>
          <View style={styles.sceneMessage}><Text style={styles.sceneMessageText}>{t('landingIllustration')}</Text></View>
        </View>

        <View style={styles.stepsTitleRow}>
          <Text style={styles.stepsTitle}>{t('landingStepsTitle')}</Text>
          <Text style={styles.stepsHint}>{t('landingStepsHint')}</Text>
        </View>
        <View style={styles.stepsCard}>
          <Step number="1" icon="📸" label={t('landingPhoto')} description={t('landingPhotoDesc')} />
          <Step number="2" icon="✨" label={t('landingVerify')} description={t('landingVerifyDesc')} />
          <Step number="3" icon="🪙" label={t('landingEarn')} description={t('landingEarnDesc')} last />
        </View>

        <View style={styles.rewardCard}>
          <View style={styles.rewardHeading}><Text style={styles.rewardHeadingIcon}>🎁</Text><Text style={styles.rewardHeadingText}>{t('landingRewardsTitle')}</Text></View>
          <View style={styles.rewardRows}>
            <View style={styles.rewardPill}><Text style={styles.rewardAmount}>✦</Text><Text style={styles.rewardLabel}>{t('landingReportReward')}</Text></View>
            <View style={styles.rewardPill}><Text style={styles.rewardAmount}>✦</Text><Text style={styles.rewardLabel}>{t('landingInviteReward')}</Text></View>
          </View>
          <Text style={styles.rewardHint}>{t('landingInviteHint')}</Text>
          <Text style={styles.cashNote}>{t('landingNotCash')}</Text>
        </View>

        <View style={styles.storySection}>
          <Text style={styles.sectionKicker}>{language === 'hi' ? 'एक साफ़ प्रक्रिया' : 'A CLEARER WAY TO ACT'}</Text>
          <Text style={styles.storyTitle}>{language === 'hi' ? 'छोटी रिपोर्ट। मिलकर सफ़ाई।' : 'Small reports. Coordinated cleanups.'}</Text>
          <Text style={styles.storyBody}>{language === 'hi' ? 'जब सही जानकारी कार्रवाई करने वाली टीम तक पहुँचे, तो कचरे की जगहों पर काम करना आसान होता है।' : 'Useful information helps the right people act on a waste hotspot and follow the pickup.'}</Text>
          <View style={styles.featureCard}>
            <Feature icon="📸" title={language === 'hi' ? 'जगह की रिपोर्ट करें' : 'Report a hotspot'} text={language === 'hi' ? 'फ़ोटो लें, कचरे का प्रकार चुनें और जगह दर्ज करें।' : 'Share a clear photo, choose the waste type and mark its location.'} />
            <Feature icon="✓" title={language === 'hi' ? 'जाँच और समीक्षा' : 'Review and verify'} text={language === 'hi' ? 'जाँच और एडमिन समीक्षा से रिपोर्ट उपयोगी रहती है।' : 'Photo checks and admin review help keep reports useful.'} />
            <Feature icon="🚚" title={language === 'hi' ? 'पिकअप तय करें' : 'Coordinate pickup'} text={language === 'hi' ? 'एडमिन कलेक्टर को काम दे सकते हैं और स्थिति देख सकते हैं।' : 'Admins can assign a collector and follow report status.'} />
            <Feature icon="📊" title={language === 'hi' ? 'नतीजा देखें' : 'See the outcome'} text={language === 'hi' ? 'अपने खाते में रिपोर्ट और योगदान की स्थिति देखें।' : 'Track report progress and your verified contribution.'} last />
          </View>
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.sectionKicker}>{language === 'hi' ? 'सबके लिए एक प्लेटफ़ॉर्म' : 'ONE PLATFORM, CLEAR ROLES'}</Text>
          <Text style={styles.storyTitle}>{language === 'hi' ? 'हर किसी का अगला कदम साफ़।' : 'Everyone knows their next step.'}</Text>
          <Role icon="🏘️" title={language === 'hi' ? 'निवासी' : 'Residents'} text={language === 'hi' ? 'पास की कचरे वाली जगह रिपोर्ट करें और आगे की स्थिति देखें।' : 'Report a hotspot and follow what happens next.'} />
          <Role icon="♻️" title={language === 'hi' ? 'कलेक्टर' : 'Collectors'} text={language === 'hi' ? 'दिए गए पिकअप देखें और सफ़ाई की स्थिति अपडेट करें।' : 'See assigned pickups and update collection status.'} />
          <Role icon="🛡️" title={language === 'hi' ? 'एडमिन' : 'Administrators'} text={language === 'hi' ? 'रिपोर्ट की समीक्षा करें और कलेक्टर को काम दें।' : 'Review reports, assign collectors and oversee activity.'} />
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapIcon}><Text style={{ fontSize: 25 }}>📍</Text></View>
          <Text style={styles.mapTitle}>{language === 'hi' ? 'जगह को मैप पर दिखाएँ' : 'Give the pickup a place to go.'}</Text>
          <Text style={styles.mapBody}>{language === 'hi' ? 'WasteChain जगह और मैप के लिए OpenStreetMap इस्तेमाल करता है। Google Maps API key की ज़रूरत नहीं।' : 'WasteChain uses OpenStreetMap for map views and location context. No Google Maps API key is needed.'}</Text>
          <TouchableOpacity style={styles.mapButton} onPress={() => void Linking.openURL('https://www.openstreetmap.org/#map=13/25.375/86.47')} accessibilityRole="link"><Text style={styles.mapButtonText}>{language === 'hi' ? 'मैप देखें' : 'Explore OpenStreetMap'} →</Text></TouchableOpacity>
          <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionKicker}>{language === 'hi' ? 'काम की जानकारी' : 'GOOD TO KNOW'}</Text>
          <Text style={styles.storyTitle}>{language === 'hi' ? 'कुछ ज़रूरी जवाब।' : 'A few quick answers.'}</Text>
          <Faq title={language === 'hi' ? 'कचरा कैसे रिपोर्ट करूँ?' : 'How do I report waste?'} body={language === 'hi' ? 'खाता बनाएँ, साफ़ फ़ोटो जोड़ें, प्रकार चुनें और जगह बताएं।' : 'Create an account, add a clear photo, select the waste type and provide its location.'} />
          <Faq title={language === 'hi' ? 'रिपोर्ट के बाद क्या होता है?' : 'What happens after I report?'} body={language === 'hi' ? 'रिपोर्ट समीक्षा के लिए सेवा पर जाती है। एडमिन कलेक्टर और स्थिति संभाल सकते हैं।' : 'Reports go to the WasteChain service for review. An administrator can coordinate the collector and status updates.'} />
          <Faq title={language === 'hi' ? 'क्या पॉइंट नकद हैं?' : 'Are points cash?'} body={language === 'hi' ? 'पॉइंट योगदान को ट्रैक करते हैं; ये नकद भुगतान नहीं हैं। मौजूदा नियम Rewards में देखें।' : 'Points track eligible contributions; they are not a cash payout. Check Rewards for current rules.'} />
        </View>

        <TouchableOpacity style={styles.bottomCta} onPress={() => openAuth('signup', 'report')} activeOpacity={0.88} accessibilityRole="button">
          <Text style={styles.bottomCtaKicker}>{language === 'hi' ? 'आपके मोहल्ले की अगली सफ़ाई' : 'YOUR NEIGHBOURHOOD’S NEXT CLEANUP'}</Text>
          <Text style={styles.bottomCtaTitle}>{language === 'hi' ? 'एक साफ़ रिपोर्ट से शुरुआत करें।' : 'Start with one clear report.'}</Text>
          <Text style={styles.bottomCtaAction}>{language === 'hi' ? 'अभी शुरू करें' : 'Get started'} →</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>{t('landingFooter')}</Text>
      </ScrollView>
      <Modal visible={authVisible} transparent animationType="slide" onRequestClose={() => setAuthVisible(false)} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setAuthVisible(false)} accessibilityRole="button" accessibilityLabel={t('authBack')} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboard}>
            <View style={styles.sheet}>
              <View style={styles.sheetTop}>
                <View style={styles.handle} />
                <TouchableOpacity style={styles.closeButton} onPress={() => setAuthVisible(false)} accessibilityRole="button" accessibilityLabel={t('authBack')}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                <View style={styles.sheetBrand}><Text style={styles.sheetBrandEmoji}>♻️</Text><Text style={styles.sheetBrandText}>WasteCHAiN</Text></View>
                {authMode === 'signup' ? <View style={styles.sheetRoleChoice}>
                  <Text style={styles.sheetRoleLabel}>{language === 'hi' ? 'खाता प्रकार' : 'ACCOUNT TYPE'}</Text>
                  <View style={styles.signupRoleRow}>
                    <TouchableOpacity style={[styles.sheetRoleOption, signupRole === 'citizen' && styles.sheetRoleSelected]} onPress={() => setSignupRole('citizen')} accessibilityRole="radio" accessibilityState={{ selected: signupRole === 'citizen' }}><Text style={styles.sheetRoleOptionText}>{language === 'hi' ? 'निवासी · रिपोर्ट करें' : 'Resident · report'}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.sheetRoleOption, signupRole === 'collector' && styles.sheetRoleSelected]} onPress={() => setSignupRole('collector')} accessibilityRole="radio" accessibilityState={{ selected: signupRole === 'collector' }}><Text style={styles.sheetRoleOptionText}>{language === 'hi' ? 'कलेक्टर · मंज़ूरी चाहिए' : 'Collector · approval required'}</Text></TouchableOpacity>
                  </View>
                </View> : null}
                <PhoneAuthForm mode={authMode} onComplete={completeAuth} initialReferralCode={initialReferralCode} requestedRole={authMode === 'signup' ? signupRole : 'citizen'} />
                {__DEV__ && authMode === 'login' ? <View style={styles.demoSection}>
                  <TouchableOpacity style={styles.demoButton} onPress={() => void openDemoDashboard()} accessibilityRole="button">
                    <Text style={styles.demoButtonText}>{t('demoDashboard')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.demoHint}>{t('demoDashboardHint')}</Text>
                </View> : null}
                <TouchableOpacity style={styles.sheetSwitch} onPress={() => {
                  const nextMode = authMode === 'signup' ? 'login' : 'signup';
                  setAuthMode(nextMode);
                  setAuthDestination(nextMode === 'signup' ? 'report' : 'home');
                }} accessibilityRole="button">
                  <Text style={styles.sheetSwitchText}>{t(authMode === 'signup' ? 'authLoginPrompt' : 'authCreatePrompt')} </Text>
                  <Text style={styles.sheetSwitchLink}>{t(authMode === 'signup' ? 'authLoginLink' : 'authCreate')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Step({ number, icon, label, description, last = false }: { number: string; icon: string; label: string; description: string; last?: boolean }) {
  return (
    <View style={[styles.step, last && styles.stepLast]}>
      <View style={styles.stepIconBox}><Text style={styles.stepIcon}>{icon}</Text><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View></View>
      <View style={styles.stepCopy}><Text style={styles.stepLabel}>{label}</Text><Text style={styles.stepDescription}>{description}</Text></View>
      {last ? <Text style={styles.stepDone}>✓</Text> : <Text style={styles.stepArrow}>↓</Text>}
    </View>
  );
}

function Feature({ icon, title, text, last = false }: { icon: string; title: string; text: string; last?: boolean }) {
  return <View style={[styles.featureRow, last && styles.featureLast]}><View style={styles.featureIcon}><Text style={styles.featureEmoji}>{icon}</Text></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View></View>;
}

function Role({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <View style={styles.roleCard}><Text style={styles.roleIcon}>{icon}</Text><View style={styles.roleCopy}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.roleText}>{text}</Text></View></View>;
}

function Faq({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }}><View style={styles.faqQuestion}><Text style={styles.faqTitle}>{title}</Text><Text style={styles.faqPlus}>{open ? '−' : '+'}</Text></View>{open ? <Text style={styles.faqBody}>{body}</Text> : null}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f8f4' },
  loading: { flex: 1, backgroundColor: '#f5f8f4' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7f8ec' },
  brandLeaf: { fontSize: 23 },
  brandName: { color: '#15351e', fontSize: 19, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -0.5 },
  brandLine: { color: '#738178', fontSize: 11, marginTop: 1, fontFamily: 'Manrope_700Bold' },
  heroCopy: { marginBottom: 16, padding: 20, borderRadius: 25, backgroundColor: '#10271f' },
  eyebrow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, marginBottom: 12 },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#c9f06a' },
  eyebrowText: { color: '#c9f06a', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 0.2 },
  title: { color: '#fff', fontSize: 38, lineHeight: 46, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -0.4 },
  subtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 360, fontFamily: 'DMSans_600SemiBold' },
  cartoonScene: { height: 196, borderRadius: 28, backgroundColor: '#e9f8ed', overflow: 'hidden', position: 'relative', marginBottom: 20, borderWidth: 1, borderColor: '#d5eedb' },
  sun: { position: 'absolute', width: 57, height: 57, borderRadius: 29, top: 19, right: 25, backgroundColor: '#ffcf67' },
  cloud: { position: 'absolute', height: 13, borderRadius: 12, backgroundColor: '#fff', opacity: 0.9 },
  cloudOne: { width: 50, top: 45, left: 27 }, cloudTwo: { width: 35, top: 72, right: 54 },
  sparkleOne: { position: 'absolute', left: 28, top: 91, color: '#f2a900' }, sparkleTwo: { position: 'absolute', right: 33, top: 113, color: '#f2a900' },
  ground: { position: 'absolute', height: 53, left: -14, right: -14, bottom: -22, borderRadius: 100, backgroundColor: '#78ca83' },
  planet: { position: 'absolute', left: '50%', top: 33, marginLeft: -47, width: 94, height: 94, borderRadius: 51, backgroundColor: '#c5ecff', borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  planetEmoji: { fontSize: 65 },
  cartoonPerson: { position: 'absolute', left: '13%', bottom: 22, width: 77, height: 91, alignItems: 'center', justifyContent: 'center' },
  personEmoji: { fontSize: 66 },
  cartoonBin: { position: 'absolute', right: '12%', bottom: 22, width: 55, height: 67, borderRadius: 15, backgroundColor: '#17934a', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  binEmoji: { fontSize: 30 },
  floatingLeaf: { position: 'absolute', top: 39, left: '31%', transform: [{ rotate: '-18deg' }] },
  sceneLabel: { position: 'absolute', right: 12, top: 12, backgroundColor: '#ffffffed', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14 },
  sceneLabelText: { color: '#277441', fontSize: 17, fontFamily: 'Manrope_800ExtraBold' },
  sceneMessage: { position: 'absolute', left: 12, top: 12, backgroundColor: '#ffffffed', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, maxWidth: '52%' },
  sceneMessageText: { color: '#277441', fontSize: 11, fontFamily: 'Manrope_800ExtraBold' },
  stepsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  stepsTitle: { color: '#1b3022', fontSize: 19, fontFamily: 'Manrope_800ExtraBold' },
  stepsHint: { color: '#748178', fontSize: 11, fontFamily: 'Manrope_700Bold' },
  stepsCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4ede5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 4, marginBottom: 15 },
  step: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: '#edf2ee' },
  stepLast: { borderBottomWidth: 0 },
  stepCopy: { flex: 1, paddingVertical: 8 },
  stepIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eff8f0', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  stepIcon: { fontSize: 24 },
  stepNumber: { position: 'absolute', right: -4, top: -4, backgroundColor: '#16823b', width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  stepLabel: { color: '#25382a', fontSize: 16, fontFamily: 'Manrope_800ExtraBold' },
  stepDescription: { color: '#738078', fontSize: 12, lineHeight: 18, marginTop: 0, fontFamily: 'DMSans_600SemiBold' },
  stepArrow: { color: '#98bca0', fontSize: 17, fontWeight: '900', paddingHorizontal: 3 },
  stepDone: { color: '#16823b', fontSize: 18, fontWeight: '900', paddingHorizontal: 3 },
  rewardCard: { backgroundColor: '#f1faf3', borderRadius: 20, borderWidth: 1, borderColor: '#d8efdd', padding: 15, marginBottom: 14 },
  rewardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
  rewardHeadingIcon: { fontSize: 20 },
  rewardHeadingText: { color: '#183c24', fontSize: 16, fontFamily: 'Manrope_800ExtraBold' },
  rewardRows: { flexDirection: 'row', gap: 9 },
  rewardPill: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#dfefe2', paddingHorizontal: 11, paddingVertical: 10 },
  rewardAmount: { color: '#16823b', fontSize: 22, fontFamily: 'Manrope_800ExtraBold' },
  rewardLabel: { color: '#4c5d51', fontSize: 11, lineHeight: 16, fontFamily: 'Manrope_700Bold', marginTop: 1 },
  rewardHint: { color: '#69776e', fontSize: 11, lineHeight: 17, marginTop: 7, fontFamily: 'DMSans_600SemiBold' },
  cashNote: { color: '#718077', fontSize: 10, lineHeight: 15, marginTop: 4, fontFamily: 'DMSans_400Regular' },
  createButton: { minHeight: 60, borderRadius: 18, backgroundColor: '#15803d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#15803d', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  cameraButtonIcon: { fontSize: 19 },
  createButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Manrope_800ExtraBold' },
  buttonArrow: { color: '#fff', fontSize: 21, fontWeight: '800' },
  loginButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  signupRoles: { marginTop: 2, marginBottom: 16 },
  rolePickerTitle: { color: '#32493a', fontSize: 12, fontFamily: 'Manrope_800ExtraBold', marginBottom: 8 },
  signupRoleRow: { flexDirection: 'row', gap: 8 },
  signupRoleCard: { flex: 1, minHeight: 86, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: '#e1ebe2', backgroundColor: '#fff' },
  signupRoleSelected: { borderColor: '#16823b', backgroundColor: '#f0faf2' },
  signupRoleIcon: { fontSize: 18 },
  signupRoleName: { color: '#20382a', fontSize: 12, marginTop: 3, fontFamily: 'Manrope_800ExtraBold' },
  signupRoleHint: { color: '#7a897e', fontSize: 9, marginTop: 1, fontFamily: 'DMSans_600SemiBold' },
  roleApprovalHint: { color: '#7b6842', fontSize: 10, lineHeight: 15, marginTop: 7, fontFamily: 'DMSans_600SemiBold' },
  sheetRoleChoice: { marginBottom: 14 },
  sheetRoleLabel: { color: '#758179', fontSize: 10, letterSpacing: 0.8, fontFamily: 'Manrope_800ExtraBold', marginBottom: 7 },
  sheetRoleOption: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e1ebe2', borderRadius: 12 },
  sheetRoleSelected: { borderColor: '#16823b', backgroundColor: '#f0faf2' },
  sheetRoleOptionText: { color: '#263a2c', fontSize: 10, lineHeight: 15, fontFamily: 'Manrope_800ExtraBold' },
  loginPrompt: { color: '#65736a', fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  loginLink: { color: '#147b38', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  storySection: { marginTop: 26, marginBottom: 22 },
  sectionKicker: { color: '#17803d', fontSize: 10, letterSpacing: 1.3, fontFamily: 'Manrope_800ExtraBold', marginBottom: 7 },
  storyTitle: { color: '#173522', fontSize: 25, lineHeight: 32, letterSpacing: -0.4, fontFamily: 'Manrope_800ExtraBold', marginBottom: 8 },
  storyBody: { color: '#65736a', fontSize: 14, lineHeight: 22, fontFamily: 'DMSans_600SemiBold', marginBottom: 15 },
  featureCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5eee6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#edf2ee' },
  featureLast: { borderBottomWidth: 0 },
  featureIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#edf8ef', alignItems: 'center', justifyContent: 'center' },
  featureEmoji: { color: '#16823b', fontSize: 20, fontWeight: '900' },
  featureCopy: { flex: 1 },
  featureTitle: { color: '#20382a', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  featureText: { color: '#78847b', fontSize: 11, lineHeight: 17, marginTop: 2, fontFamily: 'DMSans_600SemiBold' },
  roleSection: { marginTop: 7, marginBottom: 25 },
  roleCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, marginTop: 9, borderRadius: 17, backgroundColor: '#123323' },
  roleIcon: { fontSize: 23 },
  roleCopy: { flex: 1 },
  roleTitle: { color: '#fff', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  roleText: { color: '#d1e2d5', fontSize: 11, lineHeight: 16, marginTop: 2, fontFamily: 'DMSans_600SemiBold' },
  mapCard: { borderRadius: 22, backgroundColor: '#eaf6ec', padding: 18, marginBottom: 26, borderWidth: 1, borderColor: '#d8ecdc' },
  mapIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  mapTitle: { color: '#163822', fontSize: 21, lineHeight: 27, fontFamily: 'Manrope_800ExtraBold' },
  mapBody: { color: '#5f7163', fontSize: 13, lineHeight: 20, marginTop: 7, fontFamily: 'DMSans_600SemiBold' },
  mapButton: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, marginTop: 13 },
  mapButtonText: { color: '#167638', fontSize: 12, fontFamily: 'Manrope_800ExtraBold' },
  mapAttribution: { color: '#819087', fontSize: 9, marginTop: 9, fontFamily: 'DMSans_400Regular' },
  faqSection: { marginBottom: 24 },
  faqItem: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5eee6', borderRadius: 15, padding: 14, marginTop: 8 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqTitle: { flex: 1, color: '#23392a', fontSize: 13, fontFamily: 'Manrope_800ExtraBold' },
  faqPlus: { color: '#16823b', fontSize: 20, fontWeight: '700' },
  faqBody: { color: '#718077', fontSize: 12, lineHeight: 18, marginTop: 9, fontFamily: 'DMSans_600SemiBold' },
  bottomCta: { backgroundColor: '#123323', borderRadius: 23, padding: 20, marginBottom: 17 },
  bottomCtaKicker: { color: '#9ad7a8', fontSize: 9, letterSpacing: 1.1, fontFamily: 'Manrope_800ExtraBold' },
  bottomCtaTitle: { color: '#fff', fontSize: 23, lineHeight: 30, marginTop: 8, fontFamily: 'Manrope_800ExtraBold' },
  bottomCtaAction: { color: '#c7f56b', fontSize: 14, marginTop: 14, fontFamily: 'Manrope_800ExtraBold' },
  footer: { color: '#929d95', fontSize: 11, textAlign: 'center', marginTop: 5, fontFamily: 'DMSans_600SemiBold' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(13, 30, 18, 0.48)' },
  sheetKeyboard: { width: '100%', maxHeight: '88%' },
  sheet: { backgroundColor: '#f8fcf8', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 23, shadowColor: '#122619', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  sheetTop: { height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  handle: { width: 43, height: 5, borderRadius: 3, backgroundColor: '#c8d5ca' },
  closeButton: { position: 'absolute', right: -5, top: -6, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#64746a', fontSize: 27, lineHeight: 31, fontWeight: '500' },
  sheetContent: { paddingBottom: 12 },
  sheetBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  sheetBrandEmoji: { fontSize: 20 },
  sheetBrandText: { color: '#15351e', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  sheetSwitch: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sheetSwitchText: { color: '#758179', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  sheetSwitchLink: { color: '#147b38', fontSize: 12, fontFamily: 'Manrope_800ExtraBold' },
  demoSection: { marginTop: 5, marginBottom: 8 },
  demoButton: { minHeight: 48, borderRadius: 15, backgroundColor: '#102A28', alignItems: 'center', justifyContent: 'center' },
  demoButtonText: { color: '#C9F06A', fontSize: 14, fontFamily: 'Manrope_800ExtraBold' },
  demoHint: { color: '#758179', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
