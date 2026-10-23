import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, type MobileReferralInfo, type Transaction } from '../../utils/api';

const INK = '#102A28';
const GREEN = '#176B4D';
const LIME = '#C9F06A';
const MUTED = '#6E7B76';
const FONT = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'Manrope_700Bold', heavy: 'Manrope_800ExtraBold' } as const;

export default function RewardsScreen() {
  const { userId } = useAuth();
  const { t, language } = useLanguage();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referral, setReferral] = useState<MobileReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      if (userId === null) throw new Error('Sign in first.');
      const [rewards, invite] = await Promise.all([api.getRewards(), api.getReferralInfo().catch(() => null)]);
      setBalance(rewards.balance);
      setTransactions(rewards.transactions);
      setReferral(invite);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const shareInvite = async () => {
    try {
      const details = referral ?? await api.getReferralInfo();
      setReferral(details);
      await Share.share({ message: `${t('referralShareMessage')} ${details.code}\n${details.shareUrl}` });
    } catch {
      Alert.alert(t('referralCardTitle'), t('referralShareError'));
    }
  };

  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const points = balance === null ? '—' : balance.toLocaleString(locale);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={GREEN} colors={[GREEN]} />}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>WASTE-CHAiN</Text><Text style={styles.title}>{t('rewardsTitle')}</Text></View><LanguageToggle /></View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceOrb} />
          <Text style={styles.balanceLabel}>{t('pointBalance')}</Text>
          <View style={styles.balanceRow}>{loading ? <ActivityIndicator color={LIME} /> : <Text style={styles.balance}>{points}</Text>}<Text style={styles.pointsUnit}>{t('pointsShort')}</Text></View>
          <View style={styles.balanceFooter}><View style={styles.coinCircle}><Text style={styles.coinGlyph}>⊕</Text></View><Text style={styles.balanceHint}>{failed ? t('pointsPreview') : t('pointsConnected')}</Text></View>
        </View>

        <View style={styles.earnHeading}><View><Text style={styles.sectionEyebrow}>{t('rewards').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('landingRewardsTitle')}</Text></View></View>
        <View style={styles.earnCard}>
          <View style={styles.earnIcon}><Text style={styles.earnGlyph}>♻</Text></View>
          <View style={styles.earnCopy}><Text style={styles.earnTitle}>{t('landingReportReward')}</Text><Text style={styles.earnDescription}>{t('landingVerifyDesc')}</Text></View>
          <Text style={styles.earnArrow}>✓</Text>
        </View>
        <View style={styles.inviteCard}>
          <View style={styles.inviteIcon}><Text style={styles.inviteGlyph}>↗</Text></View>
          <View style={styles.inviteCopy}><Text style={styles.inviteTitle}>{t('landingInviteReward')}</Text><Text style={styles.inviteDescription}>{referral ? t('referralRewardAmount').replace('{points}', referral.rewardPoints.toLocaleString(locale)) : t('referralCardDesc')}</Text></View>
          <TouchableOpacity onPress={() => void shareInvite()} style={styles.shareButton} accessibilityRole="button"><Text style={styles.shareButtonText}>{t('referralShareButton')}</Text></TouchableOpacity>
        </View>
        <Text style={styles.cashNote}>{t('landingNotCash')}</Text>

        <View style={styles.activityHeading}><View><Text style={styles.sectionEyebrow}>{t('pointsShort').toUpperCase()}</Text><Text style={styles.sectionTitle}>{t('recentActivity')}</Text></View><Text style={styles.activityCount}>{transactions.length}</Text></View>
        {failed ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>{t('loadActivityFailed')}</Text><Text style={styles.emptyText}>{t('pullToRetry')}</Text></View>
          : loading ? <View style={styles.loading}><ActivityIndicator color={GREEN} /></View>
            : transactions.length === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>✦</Text></View><Text style={styles.emptyTitle}>{t('noActivity')}</Text><Text style={styles.emptyText}>{t('reportForActivity')}</Text></View>
              : <View style={styles.transactionList}>{transactions.map(item => <TransactionRow key={`transaction-${item.id}`} item={item} locale={locale} />)}</View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionRow({ item, locale }: { item: Transaction; locale: string }) {
  const positive = item.amount >= 0;
  let date = item.date;
  const parsed = new Date(item.date);
  if (!Number.isNaN(parsed.getTime())) date = parsed.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return <View style={styles.transactionRow}>
    <View style={[styles.transactionIcon, positive ? styles.transactionEarn : styles.transactionSpend]}><Text style={[styles.transactionGlyph, positive ? styles.positiveGlyph : styles.negativeGlyph]}>{positive ? '↗' : '↘'}</Text></View>
    <View style={styles.transactionCopy}><Text style={styles.transactionTitle} numberOfLines={1}>{item.description}</Text><Text style={styles.transactionDate}>{date}</Text></View>
    <Text style={[styles.transactionAmount, !positive && styles.transactionAmountSpend]}>{positive ? '+' : ''}{item.amount.toLocaleString(locale)}<Text style={styles.transactionUnit}> pts</Text></Text>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 35 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  eyebrow: { color: GREEN, fontFamily: FONT.heavy, fontSize: 10, letterSpacing: 1.5 },
  title: { color: INK, fontFamily: FONT.bold, fontSize: 27, lineHeight: 35 },
  balanceCard: { minHeight: 170, borderRadius: 24, overflow: 'hidden', backgroundColor: INK, padding: 19, justifyContent: 'center' },
  balanceOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 100, backgroundColor: '#173A34', right: -72, top: -47 },
  balanceLabel: { color: '#AFC1BA', fontFamily: FONT.medium, fontSize: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minHeight: 60 },
  balance: { color: LIME, fontFamily: FONT.heavy, fontSize: 43, lineHeight: 55 },
  pointsUnit: { color: '#BBC9C3', fontFamily: FONT.medium, fontSize: 13 },
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  coinCircle: { width: 25, height: 25, borderRadius: 13, borderWidth: 1.5, borderColor: LIME, alignItems: 'center', justifyContent: 'center' },
  coinGlyph: { color: LIME, fontFamily: FONT.bold, fontSize: 15, lineHeight: 19 },
  balanceHint: { flex: 1, color: '#B5C5BE', fontFamily: FONT.regular, fontSize: 10, lineHeight: 15 },
  earnHeading: { marginTop: 27, marginBottom: 12 },
  sectionEyebrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 10, letterSpacing: 1.1 },
  sectionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 19, lineHeight: 26, marginTop: 2 },
  earnCard: { minHeight: 75, padding: 12, borderWidth: 1, borderColor: '#E5E9E5', backgroundColor: '#FFFFFF', borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  earnIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center' },
  earnGlyph: { color: GREEN, fontSize: 23 },
  earnCopy: { flex: 1 },
  earnTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  earnDescription: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, lineHeight: 15 },
  earnArrow: { color: GREEN, fontFamily: FONT.bold, fontSize: 17, marginRight: 3 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9, padding: 12, borderRadius: 18, backgroundColor: '#F5F7F4', borderWidth: 1, borderColor: '#E5E9E5' },
  inviteIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: '#FFF0D6', alignItems: 'center', justifyContent: 'center' },
  inviteGlyph: { color: '#A86E19', fontFamily: FONT.bold, fontSize: 21 },
  inviteCopy: { flex: 1 },
  inviteTitle: { color: INK, fontFamily: FONT.bold, fontSize: 11 },
  inviteDescription: { color: MUTED, fontFamily: FONT.regular, fontSize: 9, lineHeight: 13 },
  shareButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 12, backgroundColor: GREEN },
  shareButtonText: { color: '#FFFFFF', fontFamily: FONT.bold, fontSize: 10 },
  cashNote: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, textAlign: 'center', marginTop: 8 },
  activityHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 29, marginBottom: 9 },
  activityCount: { minWidth: 26, height: 26, textAlign: 'center', textAlignVertical: 'center', borderRadius: 14, backgroundColor: '#DFF7E8', overflow: 'hidden', color: GREEN, fontFamily: FONT.bold, fontSize: 11 },
  transactionList: { backgroundColor: '#FFFFFF' },
  transactionRow: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#EDF1EE', flexDirection: 'row', alignItems: 'center', gap: 11 },
  transactionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  transactionEarn: { backgroundColor: '#DFF7E8' },
  transactionSpend: { backgroundColor: '#FFF0E9' },
  transactionGlyph: { fontFamily: FONT.bold, fontSize: 19 },
  positiveGlyph: { color: GREEN },
  negativeGlyph: { color: '#B65B49' },
  transactionCopy: { flex: 1 },
  transactionTitle: { color: INK, fontFamily: FONT.bold, fontSize: 12 },
  transactionDate: { color: MUTED, fontFamily: FONT.regular, fontSize: 10, marginTop: 1 },
  transactionAmount: { color: GREEN, fontFamily: FONT.bold, fontSize: 12 },
  transactionAmountSpend: { color: '#B65B49' },
  transactionUnit: { color: MUTED, fontFamily: FONT.regular, fontSize: 9 },
  emptyCard: { minHeight: 130, borderRadius: 19, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 3 },
  emptyIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#DFF7E8', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyGlyph: { color: GREEN, fontSize: 20 },
  emptyTitle: { color: INK, fontFamily: FONT.bold, fontSize: 13, textAlign: 'center' },
  emptyText: { color: MUTED, fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 2 },
  loading: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
});
