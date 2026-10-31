import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '../components/LanguageToggle';
import { PhoneAuthForm } from '../components/PhoneAuthForm';
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
        {/* Top Navbar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLeaf}>♻️</Text>
            </View>
            <View>
              <Text style={styles.brandName}>WasteCHAiN</Text>
              <Text style={styles.brandLine}>{t('landingTagline')}</Text>
            </View>
          </View>
          <LanguageToggle />
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowCircle} />
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>{t('landingEyebrow')}</Text>
            </View>
            <View style={styles.geoLiveBadge}>
              <Text style={styles.geoLiveText}>📍 LIVE OPS</Text>
            </View>
          </View>

          <Text style={styles.title}>{t('landingTitle')}</Text>
          <Text style={styles.subtitle}>{t('landingSubtitle')}</Text>

          {/* Quick Metrics Strip */}
          <View style={styles.heroStatsStrip}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>98.4%</Text>
              <Text style={styles.heroStatLbl}>{language === 'hi' ? 'सफाई दर' : 'Pickup Rate'}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>AI</Text>
              <Text style={styles.heroStatLbl}>{language === 'hi' ? 'कचरा पहचान' : 'Vision Tag'}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatVal}>+10🪙</Text>
              <Text style={styles.heroStatLbl}>{language === 'hi' ? 'प्रति रिपोर्ट' : 'Per Report'}</Text>
            </View>
          </View>
        </View>

        {/* Role Selector Card */}
        <View style={styles.roleContainer}>
          <Text style={styles.rolePickerTitle}>
            {language === 'hi' ? 'आप WasteChain का इस्तेमाल कैसे करेंगे?' : 'Choose your platform role'}
          </Text>
          <View style={styles.signupRoleRow}>
            <TouchableOpacity 
              style={[styles.signupRoleCard, signupRole === 'citizen' && styles.signupRoleSelected]} 
              onPress={() => setSignupRole('citizen')} 
              accessibilityRole="radio" 
              accessibilityState={{ selected: signupRole === 'citizen' }}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconCircle, signupRole === 'citizen' && styles.roleIconCircleActive]}>
                <Text style={styles.signupRoleIcon}>📸</Text>
              </View>
              <Text style={[styles.signupRoleName, signupRole === 'citizen' && styles.signupRoleNameActive]}>
                {language === 'hi' ? 'नागरिक रिपोर्टर' : 'Citizen Reporter'}
              </Text>
              <Text style={styles.signupRoleHint}>
                {language === 'hi' ? 'फोटो खींचें · टोकन कमाएं' : 'Capture & earn points'}
              </Text>
              {signupRole === 'citizen' && <View style={styles.selectedPill}><Text style={styles.selectedPillText}>✓ Selected</Text></View>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.signupRoleCard, signupRole === 'collector' && styles.signupRoleSelected]} 
              onPress={() => setSignupRole('collector')} 
              accessibilityRole="radio" 
              accessibilityState={{ selected: signupRole === 'collector' }}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconCircle, signupRole === 'collector' && styles.roleIconCircleActive]}>
                <Text style={styles.signupRoleIcon}>🚚</Text>
              </View>
              <Text style={[styles.signupRoleName, signupRole === 'collector' && styles.signupRoleNameActive]}>
                {language === 'hi' ? 'फील्ड कलेक्टर' : 'Field Collector'}
              </Text>
              <Text style={styles.signupRoleHint}>
                {language === 'hi' ? 'रूट पिकअप · एडमिन अप्रूवल' : 'Route pickup & verification'}
              </Text>
              {signupRole === 'collector' && <View style={styles.selectedPill}><Text style={styles.selectedPillText}>✓ Selected</Text></View>}
            </TouchableOpacity>
          </View>
          {signupRole === 'collector' ? (
            <View style={styles.approvalNotice}>
              <Text style={styles.approvalNoticeIcon}>ℹ️</Text>
              <Text style={styles.roleApprovalHint}>
                {language === 'hi' 
                  ? 'कलेक्टर खाते के लिए व्यवस्थापक (Admin) द्वारा पहचान की पुष्टि आवश्यक है।' 
                  : 'Collector accounts require administrative verification before dispatch routes unlock.'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Primary Action Button (Continue with Phone OTP) */}
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => openAuth('signup', 'report')} 
          activeOpacity={0.85} 
          accessibilityRole="button"
        >
          <View style={styles.buttonContentRow}>
            <View style={styles.buttonIconBadge}>
              <Text style={styles.cameraButtonIcon}>{signupRole === 'collector' ? '🚚' : '📱'}</Text>
            </View>
            <View style={styles.buttonTextBox}>
              <Text style={styles.createButtonText}>
                {signupRole === 'collector' 
                  ? (language === 'hi' ? 'कलेक्टर के लिए OTP से जुड़ें' : 'Apply as Collector via OTP') 
                  : (language === 'hi' ? 'मोबाइल OTP से रिपोर्ट करें' : 'Continue with Mobile OTP')}
              </Text>
              <Text style={styles.createButtonSubtext}>
                {language === 'hi' ? 'तुरंत SMS वेरिफिकेशन · पासवर्ड की ज़रूरत नहीं' : 'Instant SMS code · 1-tap verify & report'}
              </Text>
            </View>
            <Text style={styles.buttonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Sign In Existing Account Link */}
        <TouchableOpacity style={styles.loginButton} onPress={() => openAuth('login', 'home')} activeOpacity={0.75} accessibilityRole="button">
          <Text style={styles.loginPrompt}>{t('landingHaveAccount')} </Text>
          <Text style={styles.loginLink}>{t('landingLogin')}</Text>
        </TouchableOpacity>

        {/* Modern Interactive Logistics Card (Replaced cartoon scene) */}
        <View style={styles.operationsCard}>
          <View style={styles.opsHeader}>
            <View style={styles.opsTag}>
              <Text style={styles.opsTagText}>{language === 'hi' ? '⚡ त्वरित प्रक्रिया' : '⚡ 3-STEP DISPATCH'}</Text>
            </View>
            <Text style={styles.opsStatusText}>● NETWORK READY</Text>
          </View>

          <View style={styles.opsFlowRow}>
            <View style={styles.opsFlowStep}>
              <View style={styles.opsIconCircle}>
                <Text style={styles.opsIconText}>📸</Text>
              </View>
              <Text style={styles.opsStepTitle}>{language === 'hi' ? '1. फोटो लें' : '1. Photo'}</Text>
              <Text style={styles.opsStepSub}>{language === 'hi' ? 'AI से पहचान' : 'AI Detect'}</Text>
            </View>
            <Text style={styles.opsFlowArrow}>→</Text>

            <View style={styles.opsFlowStep}>
              <View style={styles.opsIconCircle}>
                <Text style={styles.opsIconText}>📍</Text>
              </View>
              <Text style={styles.opsStepTitle}>{language === 'hi' ? '2. GPS टैग' : '2. Geo-Tag'}</Text>
              <Text style={styles.opsStepSub}>{language === 'hi' ? 'कलेक्टर अलर्ट' : 'Collector Alert'}</Text>
            </View>
            <Text style={styles.opsFlowArrow}>→</Text>

            <View style={styles.opsFlowStep}>
              <View style={[styles.opsIconCircle, styles.opsIconCircleGold]}>
                <Text style={styles.opsIconText}>🪙</Text>
              </View>
              <Text style={styles.opsStepTitle}>{language === 'hi' ? '3. रिवॉर्ड' : '3. Reward'}</Text>
              <Text style={styles.opsStepSub}>{language === 'hi' ? 'इको टोकन' : 'Tokens'}</Text>
            </View>
          </View>
        </View>

        {/* 3 Step Guidance */}
        <View style={styles.stepsTitleRow}>
          <Text style={styles.stepsTitle}>{t('landingStepsTitle')}</Text>
          <Text style={styles.stepsHint}>{t('landingStepsHint')}</Text>
        </View>
        <View style={styles.stepsCard}>
          <Step number="1" icon="📸" label={t('landingPhoto')} description={t('landingPhotoDesc')} />
          <Step number="2" icon="✨" label={t('landingVerify')} description={t('landingVerifyDesc')} />
          <Step number="3" icon="🪙" label={t('landingEarn')} description={t('landingEarnDesc')} last />
        </View>

        {/* Rewards Preview */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardHeading}>
            <Text style={styles.rewardHeadingIcon}>🎁</Text>
            <Text style={styles.rewardHeadingText}>{t('landingRewardsTitle')}</Text>
          </View>
          <View style={styles.rewardRows}>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardAmount}>+10🪙</Text>
              <Text style={styles.rewardLabel}>{t('landingReportReward')}</Text>
            </View>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardAmount}>+25🪙</Text>
              <Text style={styles.rewardLabel}>{t('landingInviteReward')}</Text>
            </View>
          </View>
          <Text style={styles.rewardHint}>{t('landingInviteHint')}</Text>
          <Text style={styles.cashNote}>{t('landingNotCash')}</Text>
        </View>

        {/* Features Walkthrough */}
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

        {/* Roles Section */}
        <View style={styles.roleSection}>
          <Text style={styles.sectionKicker}>{language === 'hi' ? 'सबके लिए एक प्लेटफ़ॉर्म' : 'ONE PLATFORM, CLEAR ROLES'}</Text>
          <Text style={styles.storyTitle}>{language === 'hi' ? 'हर किसी का अगला कदम साफ़।' : 'Everyone knows their next step.'}</Text>
          <Role icon="🏘️" title={language === 'hi' ? 'निवासी' : 'Residents'} text={language === 'hi' ? 'पास की कचरे वाली जगह रिपोर्ट करें और आगे की स्थिति देखें।' : 'Report a hotspot and follow what happens next.'} />
          <Role icon="♻️" title={language === 'hi' ? 'कलेक्टर' : 'Collectors'} text={language === 'hi' ? 'दिए गए पिकअप देखें और सफ़ाई की स्थिति अपडेट करें।' : 'See assigned pickups and update collection status.'} />
          <Role icon="🛡️" title={language === 'hi' ? 'एडमिन' : 'Administrators'} text={language === 'hi' ? 'रिपोर्ट की समीक्षा करें और कलेक्टर को काम दें।' : 'Review reports, assign collectors and oversee activity.'} />
        </View>

        {/* Map Context */}
        <View style={styles.mapCard}>
          <View style={styles.mapIcon}><Text style={{ fontSize: 25 }}>📍</Text></View>
          <Text style={styles.mapTitle}>{language === 'hi' ? 'जगह को मैप पर दिखाएँ' : 'Give the pickup a place to go.'}</Text>
          <Text style={styles.mapBody}>{language === 'hi' ? 'WasteChain जगह और मैप के लिए OpenStreetMap इस्तेमाल करता है। Google Maps API key की ज़रूरत नहीं।' : 'WasteChain uses OpenStreetMap for map views and location context. No Google Maps API key is needed.'}</Text>
          <TouchableOpacity style={styles.mapButton} onPress={() => void Linking.openURL('https://www.openstreetmap.org/#map=13/25.375/86.47')} accessibilityRole="link">
            <Text style={styles.mapButtonText}>{language === 'hi' ? 'मैप देखें' : 'Explore OpenStreetMap'} →</Text>
          </TouchableOpacity>
          <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionKicker}>{language === 'hi' ? 'काम की जानकारी' : 'GOOD TO KNOW'}</Text>
          <Text style={styles.storyTitle}>{language === 'hi' ? 'कुछ ज़रूरी जवाब।' : 'A few quick answers.'}</Text>
          <Faq title={language === 'hi' ? 'कचरा कैसे रिपोर्ट करूँ?' : 'How do I report waste?'} body={language === 'hi' ? 'खाता बनाएँ, साफ़ फ़ोटो जोड़ें, प्रकार चुनें और जगह बताएं।' : 'Create an account, add a clear photo, select the waste type and provide its location.'} />
          <Faq title={language === 'hi' ? 'रिपोर्ट के बाद क्या होता है?' : 'What happens after I report?'} body={language === 'hi' ? 'रिपोर्ट समीक्षा के लिए सेवा पर जाती है। एडमिन कलेक्टर और स्थिति संभाल सकते हैं।' : 'Reports go to the WasteChain service for review. An administrator can coordinate the collector and status updates.'} />
          <Faq title={language === 'hi' ? 'क्या पॉइंट नकद हैं?' : 'Are points cash?'} body={language === 'hi' ? 'पॉइंट योगदान को ट्रैक करते हैं; ये नकद भुगतान नहीं हैं। मौजूदा नियम Rewards में देखें।' : 'Points track eligible contributions; they are not a cash payout. Check Rewards for current rules.'} />
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity style={styles.bottomCta} onPress={() => openAuth('signup', 'report')} activeOpacity={0.88} accessibilityRole="button">
          <Text style={styles.bottomCtaKicker}>{language === 'hi' ? 'आपके मोहल्ले की अगली सफ़ाई' : 'YOUR NEIGHBOURHOOD’S NEXT CLEANUP'}</Text>
          <Text style={styles.bottomCtaTitle}>{language === 'hi' ? 'एक साफ़ रिपोर्ट से शुरुआत करें।' : 'Start with one clear report.'}</Text>
          <Text style={styles.bottomCtaAction}>{language === 'hi' ? 'अभी शुरू करें' : 'Get started'} →</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>{t('landingFooter')}</Text>
      </ScrollView>

      {/* Auth Modal Sheet */}
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
                <View style={styles.sheetBrand}>
                  <View style={styles.sheetBrandMark}><Text style={styles.sheetBrandEmoji}>♻️</Text></View>
                  <View>
                    <Text style={styles.sheetBrandText}>WasteCHAiN</Text>
                    <Text style={styles.sheetBrandSub}>
                      {authMode === 'signup' 
                        ? (language === 'hi' ? 'नागरिक सत्यापन पोर्टल' : 'Citizen Verification') 
                        : (language === 'hi' ? 'खाता लॉगिन' : 'Account Sign-in')}
                    </Text>
                  </View>
                </View>

                {authMode === 'signup' ? (
                  <View style={styles.sheetRoleChoice}>
                    <Text style={styles.sheetRoleLabel}>{language === 'hi' ? 'खाता प्रकार' : 'ACCOUNT TYPE'}</Text>
                    <View style={styles.signupRoleRow}>
                      <TouchableOpacity 
                        style={[styles.sheetRoleOption, signupRole === 'citizen' && styles.sheetRoleSelected]} 
                        onPress={() => setSignupRole('citizen')} 
                        accessibilityRole="radio" 
                        accessibilityState={{ selected: signupRole === 'citizen' }}
                      >
                        <Text style={[styles.sheetRoleOptionText, signupRole === 'citizen' && styles.sheetRoleOptionSelected]}>
                          {language === 'hi' ? '📸 निवासी · रिपोर्ट' : '📸 Resident · Report'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.sheetRoleOption, signupRole === 'collector' && styles.sheetRoleSelected]} 
                        onPress={() => setSignupRole('collector')} 
                        accessibilityRole="radio" 
                        accessibilityState={{ selected: signupRole === 'collector' }}
                      >
                        <Text style={[styles.sheetRoleOptionText, signupRole === 'collector' && styles.sheetRoleOptionSelected]}>
                          {language === 'hi' ? '🚚 कलेक्टर · मंज़ूरी' : '🚚 Collector · Route'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <PhoneAuthForm 
                  mode={authMode} 
                  onComplete={completeAuth} 
                  initialReferralCode={initialReferralCode} 
                  requestedRole={authMode === 'signup' ? signupRole : 'citizen'} 
                />

                {__DEV__ && authMode === 'login' ? (
                  <View style={styles.demoSection}>
                    <TouchableOpacity style={styles.demoButton} onPress={() => void openDemoDashboard()} accessibilityRole="button">
                      <Text style={styles.demoButtonText}>{t('demoDashboard')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.demoHint}>{t('demoDashboardHint')}</Text>
                  </View>
                ) : null}

                <TouchableOpacity 
                  style={styles.sheetSwitch} 
                  onPress={() => {
                    const nextMode = authMode === 'signup' ? 'login' : 'signup';
                    setAuthMode(nextMode);
                    setAuthDestination(nextMode === 'signup' ? 'report' : 'home');
                  }} 
                  accessibilityRole="button"
                >
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
  safe: { flex: 1, backgroundColor: '#F4F7F4' },
  loading: { flex: 1, backgroundColor: '#F4F7F4' },
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 32 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2E4', borderWidth: 1, borderColor: '#C5E8CC' },
  brandLeaf: { fontSize: 22 },
  brandName: { color: '#0F291E', fontSize: 20, fontFamily: FONT.heavy, letterSpacing: -0.6 },
  brandLine: { color: '#687B70', fontSize: 11, marginTop: 1, fontFamily: FONT.bold },

  /* Hero Section */
  heroCard: {
    backgroundColor: '#0C201A',
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#193F34',
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(201, 240, 106, 0.09)',
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9F06A' },
  eyebrowText: { color: '#C9F06A', fontSize: 10, fontFamily: FONT.heavy, letterSpacing: 0.5 },
  geoLiveBadge: {
    backgroundColor: 'rgba(201, 240, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 240, 106, 0.3)',
  },
  geoLiveText: { color: '#C9F06A', fontSize: 9, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 32, lineHeight: 40, fontFamily: FONT.heavy, letterSpacing: -0.6 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 22, marginTop: 8, fontFamily: FONT.semiBold },

  heroStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStatItem: { alignItems: 'center', flex: 1 },
  heroStatVal: { color: '#C9F06A', fontSize: 16, fontFamily: FONT.heavy },
  heroStatLbl: { color: '#A3BDB1', fontSize: 10, marginTop: 2, fontFamily: FONT.semiBold },
  heroStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)' },

  /* Role Selection */
  roleContainer: { marginBottom: 16 },
  rolePickerTitle: { color: '#253B30', fontSize: 13, fontFamily: FONT.heavy, marginBottom: 10, letterSpacing: -0.2 },
  signupRoleRow: { flexDirection: 'row', gap: 10 },
  signupRoleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDE8DF',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  signupRoleSelected: {
    borderColor: '#15803D',
    backgroundColor: '#F3FAF5',
    shadowColor: '#15803D',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconCircleActive: {
    backgroundColor: '#E1F5E6',
  },
  signupRoleIcon: { fontSize: 20 },
  signupRoleName: { color: '#1B3124', fontSize: 13, fontFamily: FONT.heavy },
  signupRoleNameActive: { color: '#15803D' },
  signupRoleHint: { color: '#6E8074', fontSize: 10, marginTop: 3, fontFamily: FONT.semiBold, lineHeight: 14 },
  selectedPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#15803D',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedPillText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#FCE7B2',
  },
  approvalNoticeIcon: { fontSize: 14 },
  roleApprovalHint: { color: '#7E6325', fontSize: 11, flex: 1, fontFamily: FONT.semiBold, lineHeight: 16 },

  /* Buttons */
  createButton: {
    borderRadius: 20,
    backgroundColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cameraButtonIcon: { fontSize: 20 },
  buttonTextBox: { flex: 1 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONT.heavy },
  createButtonSubtext: { color: '#DCF4E3', fontSize: 11, marginTop: 1, fontFamily: FONT.medium },
  buttonArrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginLeft: 8 },

  loginButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  loginPrompt: { color: '#65736A', fontSize: 13, fontFamily: FONT.semiBold },
  loginLink: { color: '#147B38', fontSize: 13, fontFamily: FONT.heavy },

  /* High Tech Operations Card */
  operationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2ECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  opsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F1',
    paddingBottom: 10,
    marginBottom: 14,
  },
  opsTag: {
    backgroundColor: '#E8F5EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  opsTagText: { color: '#16823B', fontSize: 10, fontFamily: FONT.heavy },
  opsStatusText: { color: '#27944E', fontSize: 10, fontFamily: FONT.heavy, letterSpacing: 0.5 },
  opsFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opsFlowStep: {
    alignItems: 'center',
    flex: 1,
  },
  opsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCEDDF',
    marginBottom: 6,
  },
  opsIconCircleGold: {
    backgroundColor: '#FFF9E8',
    borderColor: '#FEE8A2',
  },
  opsIconText: { fontSize: 22 },
  opsStepTitle: { color: '#183324', fontSize: 12, fontFamily: FONT.heavy },
  opsStepSub: { color: '#77887E', fontSize: 10, marginTop: 1, fontFamily: FONT.semiBold },
  opsFlowArrow: { color: '#A8BEB1', fontSize: 16, fontWeight: '900', marginTop: -14 },

  /* Steps Section */
  stepsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  stepsTitle: { color: '#1B3022', fontSize: 18, fontFamily: FONT.heavy },
  stepsHint: { color: '#748178', fontSize: 11, fontFamily: FONT.bold },
  stepsCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EDE5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 4, marginBottom: 15 },
  step: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: '#EDF2EE' },
  stepLast: { borderBottomWidth: 0 },
  stepCopy: { flex: 1, paddingVertical: 8 },
  stepIconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EFF8F0', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  stepIcon: { fontSize: 22 },
  stepNumber: { position: 'absolute', right: -4, top: -4, backgroundColor: '#16823B', width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  stepLabel: { color: '#25382A', fontSize: 15, fontFamily: FONT.heavy },
  stepDescription: { color: '#738078', fontSize: 12, lineHeight: 17, marginTop: 1, fontFamily: FONT.semiBold },
  stepArrow: { color: '#98BCA0', fontSize: 16, fontWeight: '900', paddingHorizontal: 3 },
  stepDone: { color: '#16823B', fontSize: 17, fontWeight: '900', paddingHorizontal: 3 },

  /* Reward Card */
  rewardCard: { backgroundColor: '#F1FAF3', borderRadius: 20, borderWidth: 1, borderColor: '#D8EFDD', padding: 15, marginBottom: 16 },
  rewardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
  rewardHeadingIcon: { fontSize: 20 },
  rewardHeadingText: { color: '#183C24', fontSize: 15, fontFamily: FONT.heavy },
  rewardRows: { flexDirection: 'row', gap: 10 },
  rewardPill: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#DFEFE2', paddingHorizontal: 12, paddingVertical: 10 },
  rewardAmount: { color: '#16823B', fontSize: 20, fontFamily: FONT.heavy },
  rewardLabel: { color: '#4C5D51', fontSize: 11, lineHeight: 16, fontFamily: FONT.bold, marginTop: 1 },
  rewardHint: { color: '#69776E', fontSize: 11, lineHeight: 16, marginTop: 7, fontFamily: FONT.semiBold },
  cashNote: { color: '#718077', fontSize: 10, lineHeight: 14, marginTop: 3, fontFamily: FONT.regular },

  /* Features */
  storySection: { marginTop: 18, marginBottom: 20 },
  sectionKicker: { color: '#17803D', fontSize: 10, letterSpacing: 1.3, fontFamily: FONT.heavy, marginBottom: 6 },
  storyTitle: { color: '#173522', fontSize: 23, lineHeight: 30, letterSpacing: -0.4, fontFamily: FONT.heavy, marginBottom: 6 },
  storyBody: { color: '#65736A', fontSize: 13, lineHeight: 20, fontFamily: FONT.semiBold, marginBottom: 14 },
  featureCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EEE6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2EE' },
  featureLast: { borderBottomWidth: 0 },
  featureIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EDF8EF', alignItems: 'center', justifyContent: 'center' },
  featureEmoji: { color: '#16823B', fontSize: 19, fontWeight: '900' },
  featureCopy: { flex: 1 },
  featureTitle: { color: '#20382A', fontSize: 13, fontFamily: FONT.heavy },
  featureText: { color: '#78847B', fontSize: 11, lineHeight: 16, marginTop: 1, fontFamily: FONT.semiBold },

  /* Roles */
  roleSection: { marginTop: 4, marginBottom: 20 },
  roleCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, marginTop: 9, borderRadius: 16, backgroundColor: '#10271F' },
  roleIcon: { fontSize: 22 },
  roleCopy: { flex: 1 },
  roleTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: FONT.heavy },
  roleText: { color: '#CBE0D1', fontSize: 11, lineHeight: 15, marginTop: 2, fontFamily: FONT.semiBold },

  /* Map */
  mapCard: { borderRadius: 20, backgroundColor: '#EAF6EC', padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#D8ECDC' },
  mapIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  mapTitle: { color: '#163822', fontSize: 19, lineHeight: 25, fontFamily: FONT.heavy },
  mapBody: { color: '#5F7163', fontSize: 12, lineHeight: 18, marginTop: 6, fontFamily: FONT.semiBold },
  mapButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, marginTop: 12 },
  mapButtonText: { color: '#167638', fontSize: 12, fontFamily: FONT.heavy },
  mapAttribution: { color: '#819087', fontSize: 9, marginTop: 8, fontFamily: FONT.regular },

  /* FAQ */
  faqSection: { marginBottom: 20 },
  faqItem: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EEE6', borderRadius: 14, padding: 13, marginTop: 8 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqTitle: { flex: 1, color: '#23392A', fontSize: 13, fontFamily: FONT.heavy },
  faqPlus: { color: '#16823B', fontSize: 18, fontWeight: '700' },
  faqBody: { color: '#718077', fontSize: 12, lineHeight: 17, marginTop: 8, fontFamily: FONT.semiBold },

  bottomCta: { backgroundColor: '#10271F', borderRadius: 22, padding: 20, marginBottom: 16 },
  bottomCtaKicker: { color: '#9AD7A8', fontSize: 9, letterSpacing: 1.1, fontFamily: FONT.heavy },
  bottomCtaTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 28, marginTop: 6, fontFamily: FONT.heavy },
  bottomCtaAction: { color: '#C9F06A', fontSize: 14, marginTop: 12, fontFamily: FONT.heavy },
  footer: { color: '#929D95', fontSize: 11, textAlign: 'center', marginTop: 4, fontFamily: FONT.semiBold },

  /* Modal Sheet */
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 20, 0.65)' },
  sheetKeyboard: { width: '100%', maxHeight: '90%' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 20 },
  sheetTop: { height: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#D4DDD6' },
  closeButton: { position: 'absolute', right: -4, top: -6, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#64746A', fontSize: 26, lineHeight: 28, fontWeight: '500' },
  sheetContent: { paddingBottom: 12 },
  sheetBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sheetBrandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E0F2E4', alignItems: 'center', justifyContent: 'center' },
  sheetBrandEmoji: { fontSize: 20 },
  sheetBrandText: { color: '#0F291E', fontSize: 16, fontFamily: FONT.heavy },
  sheetBrandSub: { color: '#73867B', fontSize: 11, fontFamily: FONT.medium },
  sheetRoleChoice: { marginBottom: 14 },
  sheetRoleLabel: { color: '#758179', fontSize: 10, letterSpacing: 0.8, fontFamily: FONT.heavy, marginBottom: 7 },
  sheetRoleOption: { flex: 1, padding: 11, borderWidth: 1, borderColor: '#DCE7DF', borderRadius: 12, alignItems: 'center' },
  sheetRoleSelected: { borderColor: '#15803D', backgroundColor: '#F0FAF2' },
  sheetRoleOptionText: { color: '#4B6253', fontSize: 11, fontFamily: FONT.bold },
  sheetRoleOptionSelected: { color: '#15803D', fontFamily: FONT.heavy },
  sheetSwitch: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sheetSwitchText: { color: '#758179', fontSize: 12, fontFamily: FONT.semiBold },
  sheetSwitchLink: { color: '#147B38', fontSize: 12, fontFamily: FONT.heavy },
  demoSection: { marginTop: 5, marginBottom: 8 },
  demoButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#10271F', alignItems: 'center', justifyContent: 'center' },
  demoButtonText: { color: '#C9F06A', fontSize: 13, fontFamily: FONT.heavy },
  demoHint: { color: '#758179', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
