import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';
import { api, type MobileAuthSession } from '../utils/api';

type Step = 'phone' | 'code' | 'profile';

export function PhoneAuthForm({ mode, onComplete, initialReferralCode = '', requestedRole = 'citizen' }: { mode: 'login' | 'signup'; onComplete: (session: MobileAuthSession) => Promise<void>; initialReferralCode?: string; requestedRole?: 'citizen' | 'collector' }) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
  const [profileSetupToken, setProfileSetupToken] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    setError('');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError(t('authPhoneRequired'));
      return;
    }
    if (!api.isConfigured) {
      setError(t('authServiceUnavailable'));
      return;
    }
    setBusy(true);
    try {
      const result = await api.requestOtp(phone.trim());
      setPhone(result.phone);
      setDevelopmentCode(result.developmentCode || '');
      setStep('code');
      setCode('');
      setCooldown(result.retryAfter || 30);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authServiceUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError(t('authCodeRequired'));
      return;
    }
    setBusy(true);
    try {
      const result = await api.verifyOtp(phone, code.trim());
      if (result.needsProfile) {
        setProfileSetupToken(result.profileSetupToken);
        setPhone(result.phone);
        setStep('profile');
      } else {
        await onComplete(result);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authServiceUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  const finishProfile = async () => {
    setError('');
    if (name.trim().length < 2) {
      setError(t('authNameRequired'));
      return;
    }
    setBusy(true);
    try {
      const session = await api.completePhoneProfile(profileSetupToken, name.trim(), referralCode.trim().toUpperCase() || undefined, requestedRole);
      await onComplete(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authServiceUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  const title = step === 'profile' ? t('authNameLabel') : step === 'code' ? t('authCodeLabel') : t(mode === 'login' ? 'loginScreenTitle' : 'signupScreenTitle');

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>{title}</Text>
      <Text style={styles.helper}>
        {step === 'profile' ? t('authProfileHint') : step === 'code' ? `${t('authCodeSent')} ${phone}` : t('authPhoneHint')}
      </Text>

      {step === 'phone' ? <>
        {mode === 'signup' && requestedRole === 'collector' ? <View style={styles.notice}><Text style={styles.noticeText}>{language === 'hi' ? 'कलेक्टर सुविधा एडमिन की जाँच के बाद चालू होगी। मंज़ूरी तक यह खाता निवासी की सुविधाएँ इस्तेमाल करेगा।' : 'Collector access will be reviewed by an administrator. Until approved, this account can only use resident features.'}</Text></View> : null}
        <Text style={styles.label}>{t('authPhoneLabel')}</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t('authPhonePlaceholder')}
          placeholderTextColor="#98a49b"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={18}
          style={styles.input}
          accessibilityLabel={t('authPhoneLabel')}
          editable={!busy}
          onSubmitEditing={() => void sendCode()}
        />
      </> : null}

      {step === 'code' ? <>
        {developmentCode ? <View style={styles.notice}><Text style={styles.noticeText}>{language === 'hi' ? 'लोकल टेस्ट कोड: ' : 'Local development code: '}{developmentCode}</Text></View> : null}
        <Text style={styles.label}>{t('authCodeLabel')}</Text>
        <TextInput
          value={code}
          onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 10))}
          placeholder={t('authCodePlaceholder')}
          placeholderTextColor="#98a49b"
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          maxLength={10}
          style={[styles.input, styles.codeInput]}
          accessibilityLabel={t('authCodeLabel')}
          editable={!busy}
          onSubmitEditing={() => void verifyCode()}
        />
      </> : null}

      {step === 'profile' ? <>
        <Text style={styles.label}>{t('authNameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('authNamePlaceholder')}
          placeholderTextColor="#98a49b"
          autoComplete="name"
          textContentType="name"
          maxLength={80}
          style={styles.input}
          accessibilityLabel={t('authNameLabel')}
          editable={!busy}
          returnKeyType="done"
          onSubmitEditing={() => void finishProfile()}
        />
        <Text style={styles.verifiedPhone}>✓  {phone}</Text>
        <Text style={[styles.label, styles.referralLabel]}>{t('authReferralLabel')}</Text>
        <TextInput
          value={referralCode}
          onChangeText={value => setReferralCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          placeholder={t('authReferralPlaceholder')}
          placeholderTextColor="#98a49b"
          autoCapitalize="characters"
          maxLength={8}
          style={styles.input}
          accessibilityLabel={t('authReferralLabel')}
          editable={!busy}
        />
      </> : null}

      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      <TouchableOpacity
        style={[styles.primaryButton, busy && styles.disabled]}
        onPress={() => void (step === 'phone' ? sendCode() : step === 'code' ? verifyCode() : finishProfile())}
        disabled={busy}
        activeOpacity={0.86}
        accessibilityRole="button"
      >
        {busy ? <ActivityIndicator color="#fff" size="small" /> : null}
        <Text style={styles.primaryLabel}>
          {busy ? t(step === 'phone' ? 'authSending' : step === 'code' ? 'authChecking' : 'authFinishing') :
            step === 'phone' ? t('authSendCode') : step === 'code' ? t('authVerifyCode') : t('authFinishSignup')}
        </Text>
      </TouchableOpacity>

      {step === 'code' ? <View style={styles.secondaryRow}>
        <TouchableOpacity onPress={() => { setStep('phone'); setError(''); }} disabled={busy} accessibilityRole="button">
          <Text style={styles.textAction}>{t('authChangePhone')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void sendCode()} disabled={busy || cooldown > 0} accessibilityRole="button">
          <Text style={[styles.textAction, (busy || cooldown > 0) && styles.mutedAction]}>{cooldown > 0 ? `${t('authSendAgainIn')} ${cooldown}s` : t('authResendCode')}</Text>
        </TouchableOpacity>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  formTitle: { color: '#17291c', fontSize: 21, lineHeight: 29, fontFamily: 'Manrope_800ExtraBold' },
  helper: { color: '#68766d', fontSize: 13, lineHeight: 20, marginTop: 5, marginBottom: 17, fontFamily: 'DMSans_600SemiBold' },
  notice: { padding: 10, borderRadius: 12, backgroundColor: '#f1f8e9', borderWidth: 1, borderColor: '#d8ebca', marginBottom: 12 },
  noticeText: { color: '#526d39', fontSize: 11, lineHeight: 17, fontFamily: 'DMSans_600SemiBold' },
  label: { color: '#35473b', fontSize: 13, fontFamily: 'Manrope_700Bold', marginBottom: 7 },
  input: { minHeight: 54, borderRadius: 15, borderWidth: 1.3, borderColor: '#dce7de', backgroundColor: '#fff', paddingHorizontal: 15, color: '#17291c', fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  codeInput: { letterSpacing: 5, fontSize: 20 },
  verifiedPhone: { color: '#16823b', fontSize: 12, fontFamily: 'Manrope_700Bold', marginTop: 10 },
  referralLabel: { marginTop: 15 },
  errorBox: { padding: 11, borderRadius: 12, backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#ffd2ce', marginTop: 12 },
  errorText: { color: '#ad3027', fontSize: 12, fontFamily: 'Manrope_700Bold', lineHeight: 19 },
  primaryButton: { minHeight: 54, borderRadius: 16, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 15 },
  primaryLabel: { color: '#fff', fontSize: 15, fontFamily: 'Manrope_800ExtraBold' },
  disabled: { opacity: 0.65 },
  secondaryRow: { minHeight: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textAction: { color: '#147b38', fontSize: 13, fontFamily: 'Manrope_800ExtraBold' },
  mutedAction: { color: '#9aa69d' },
});
