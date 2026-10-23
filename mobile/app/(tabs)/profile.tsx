import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, type MobileReferralInfo, type WasteReport } from '../../utils/api';
import { collectedKilograms } from '../../utils/impact';

const GREEN = '#176B4D';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

export default function ProfileScreen() {
  const { userName, userPhone, userEmail, userRole, requestedRole, logout, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [invite, setInvite] = useState<MobileReferralInfo | null>(null);
  const [reports, setReports] = useState<WasteReport[] | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [requestingCollector, setRequestingCollector] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.getReferralInfo().catch(() => null),
      api.getReports().catch(() => null),
      api.getRewards().catch(() => null),
    ]).then(([inviteInfo, userReports, rewards]) => {
      if (!active) return;
      setInvite(inviteInfo);
      setReports(userReports);
      setPoints(rewards?.balance ?? null);
    });
    return () => { active = false; };
  }, []);

  const shareInvite = async () => {
    try {
      const details = invite ?? await api.getReferralInfo();
      setInvite(details);
      await Share.share({ message: `${t('referralShareMessage')} ${details.code}\n${details.shareUrl}` });
    } catch { Alert.alert(t('referralCardTitle'), t('referralShareError')); }
  };

  const signOut = async () => {
    await logout();
    router.replace('/');
  };
  const requestCollector = async () => {
    setRequestingCollector(true);
    try {
      await api.requestCollectorAccess();
      await refreshProfile();
      Alert.alert(t('collectorRequestSent'), t('collectorRequestPending'));
    } catch (error) {
      Alert.alert(t('collectorRequestFailed'), error instanceof Error ? error.message : t('collectorRequestFailed'));
    } finally { setRequestingCollector(false); }
  };
  const initials = userName?.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'WC';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('profileTitle').toUpperCase()}</Text>
        <Text style={styles.title}>{t('profileSubtitle')}</Text>

        <View style={styles.accountCard}>
          <View style={styles.accountOrb} />
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{userName || t('friend')}</Text>
          <Text style={styles.muted}>{userPhone || userEmail || 'WasteChain'}</Text>
          <View style={styles.rolePill}><Text style={styles.roleText}>{userRole.toUpperCase()}</Text></View>
          {requestedRole === 'collector' && userRole !== 'collector' ? <Text style={styles.pendingRole}>{language === 'hi' ? 'कलेक्टर अनुरोध · एडमिन की मंज़ूरी बाकी' : 'Collector access request · awaiting admin approval'}</Text> : null}
          {userRole === 'citizen' && !requestedRole ? <TouchableOpacity style={styles.requestCollectorButton} onPress={() => void requestCollector()} disabled={requestingCollector} accessibilityRole="button"><Text style={styles.requestCollectorText}>{requestingCollector ? '…' : t('requestCollectorAccess')}</Text></TouchableOpacity> : null}
          <View style={styles.profileStats}>
            <ProfileStat value={points === null ? '—' : points.toLocaleString('en-IN')} label={t('pointsShort')} />
            <ProfileStat value={reports === null ? '—' : collectedKilograms(reports)?.toLocaleString('en-IN', { maximumFractionDigits: 1 }) ?? '—'} label="kg" />
            <ProfileStat value={reports === null ? '—' : String(reports.length)} label={t('reports')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <Text style={styles.muted}>{t('chooseLanguage')}</Text>
          <View style={styles.language}><LanguageToggle /></View>
        </View>

        <View style={styles.inviteCard}>
          <View style={styles.inviteIcon}><Text style={styles.inviteGlyph}>♙</Text></View>
          <Text style={styles.sectionTitle}>{t('referralCardTitle')}</Text>
          <Text style={styles.muted}>{t('referralCardDesc')}</Text>
          {invite ? <Text style={styles.rewardAmount}>{t('referralRewardAmount').replace('{points}', invite.rewardPoints.toLocaleString('en-IN'))}</Text> : null}
          <View style={styles.inviteRow}>
            <Text style={styles.inviteCode}>{invite?.code || '••••••••'}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={() => void shareInvite()} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.shareButtonText}>{t('referralShareButton')} ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('profileShortcuts')}</Text>
        <View style={styles.shortcutGroup}>
          <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/rewards')} accessibilityRole="button"><View style={styles.shortcutIcon}><Text style={styles.shortcutGlyph}>⊕</Text></View><View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>{t('rewards')}</Text><Text style={styles.shortcutHint}>{t('pointBalance')}</Text></View><Text style={styles.shortcutArrow}>›</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/impact')} accessibilityRole="button"><View style={[styles.shortcutIcon, styles.shortcutIconTeal]}><Text style={styles.shortcutGlyph}>▥</Text></View><View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>{t('myImpact')}</Text><Text style={styles.shortcutHint}>{t('impactSubtitle')}</Text></View><Text style={styles.shortcutArrow}>›</Text></TouchableOpacity>
          {userRole === 'citizen' ? <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/nearby')} accessibilityRole="button"><View style={[styles.shortcutIcon, styles.shortcutIconBlue]}><Text style={styles.shortcutGlyph}>⌖</Text></View><View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>{t('nearby')}</Text><Text style={styles.shortcutHint}>{t('nearbySubtitle')}</Text></View><Text style={styles.shortcutArrow}>›</Text></TouchableOpacity> : null}
          {userRole === 'collector' ? <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/collect')} accessibilityRole="button"><View style={[styles.shortcutIcon, styles.shortcutIconTeal]}><Text style={styles.shortcutGlyph}>♻</Text></View><View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>{t('collect')}</Text><Text style={styles.shortcutHint}>{t('takeActionSubtitle')}</Text></View><Text style={styles.shortcutArrow}>›</Text></TouchableOpacity> : null}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={() => void signOut()} accessibilityRole="button">
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 },
  eyebrow: { fontFamily: FONT.bold, color: GREEN, letterSpacing: 1.1, fontSize: 12 },
  title: { fontFamily: FONT.bold, color: '#14201A', fontSize: 25, marginBottom: 18 },
  accountCard: { borderRadius: 23, backgroundColor: '#102A28', alignItems: 'center', padding: 22, overflow: 'hidden' },
  accountOrb: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#173A32', right: -90, top: -82 },
  avatar: { width: 74, height: 74, borderRadius: 26, backgroundColor: '#C99B70', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT.heavy, color: '#FFFFFF', fontSize: 22 },
  name: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 21, marginTop: 8 },
  muted: { fontFamily: FONT.regular, color: '#728078', fontSize: 13, lineHeight: 20, marginTop: 2 },
  rolePill: { backgroundColor: '#22483F', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 99, marginTop: 10 },
  roleText: { fontFamily: FONT.bold, color: '#C9F06A', fontSize: 10, letterSpacing: 0.7 },
  pendingRole: { color: '#FDE68A', backgroundColor: '#3C3420', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 9, fontSize: 10, textAlign: 'center', fontFamily: FONT.bold },
  requestCollectorButton: { marginTop: 10, borderRadius: 11, borderWidth: 1, borderColor: '#55786A', paddingHorizontal: 13, paddingVertical: 9 },
  requestCollectorText: { color: '#D8F4DD', fontSize: 11, fontFamily: FONT.bold, textAlign: 'center' },
  profileStats: { width: '100%', flexDirection: 'row', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#355149' },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatValue: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 15 },
  profileStatLabel: { color: '#AFC8C0', fontFamily: FONT.regular, fontSize: 10 },
  section: { paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  sectionTitle: { fontFamily: FONT.bold, color: '#17241D', fontSize: 17 },
  language: { alignSelf: 'flex-start', marginTop: 11 },
  inviteCard: { marginTop: 20, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#DCE9DF', backgroundColor: '#F7FAF7' },
  inviteIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#FFF0D8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  inviteGlyph: { fontFamily: FONT.bold, color: '#B77519', fontSize: 23 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 15 },
  inviteCode: { fontFamily: FONT.bold, color: GREEN, fontSize: 15, letterSpacing: 1.2 },
  rewardAmount: { color: GREEN, fontFamily: FONT.bold, fontSize: 12, marginTop: 5 },
  shareButton: { backgroundColor: GREEN, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  shareButtonText: { fontFamily: FONT.bold, color: '#FFFFFF', fontSize: 12 },
  signOutButton: { marginTop: 20, minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#E9DAD6', backgroundColor: '#FFF9F8' },
  signOutText: { fontFamily: FONT.bold, color: '#A5483D', fontSize: 14 },
  sectionHeading: { color: '#14201A', fontFamily: FONT.bold, fontSize: 17, marginTop: 23, marginBottom: 9 },
  shortcutGroup: { borderWidth: 1, borderColor: '#E5E9E5', borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  shortcutRow: { minHeight: 66, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  shortcutIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#FFF0D6', alignItems: 'center', justifyContent: 'center' },
  shortcutIconTeal: { backgroundColor: '#DFF7E8' },
  shortcutIconBlue: { backgroundColor: '#E7EFFF' },
  shortcutGlyph: { color: GREEN, fontFamily: FONT.bold, fontSize: 19 },
  shortcutCopy: { flex: 1 },
  shortcutTitle: { color: '#15231F', fontFamily: FONT.bold, fontSize: 12 },
  shortcutHint: { color: '#6E7B76', fontFamily: FONT.regular, fontSize: 9, lineHeight: 13 },
  shortcutArrow: { color: '#8D9992', fontFamily: FONT.medium, fontSize: 25 },
});

function ProfileStat({ value, label }: { value: string; label: string }) {
  return <View style={styles.profileStat}><Text style={styles.profileStatValue}>{value}</Text><Text style={styles.profileStatLabel}>{label}</Text></View>;
}
