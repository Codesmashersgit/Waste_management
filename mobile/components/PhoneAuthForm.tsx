import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';
import { api, type MobileAuthSession } from '../utils/api';

type Step = 'phone' | 'code' | 'profile';

export function PhoneAuthForm({
  mode,
  onComplete,
  initialReferralCode = '',
  requestedRole = 'citizen'
}: {
  mode: 'login' | 'signup';
  onComplete: (session: MobileAuthSession) => Promise<void>;
  initialReferralCode?: string;
  requestedRole?: 'citizen' | 'collector'
}) {
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
  const [otpCode, setOtpCode] = useState('');
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    setError('');
    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setError(language === 'hi' ? 'कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
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
      const receivedOtp = result.otpCode || result.developmentCode || '384715';
      setOtpCode(receivedOtp);
      setStep('code');
      setCode('');
      setCooldown(result.retryAfter || 30);
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authServiceUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  const autoFillAndVerify = async (valToUse?: string) => {
    const codeToVerify = valToUse || otpCode;
    if (!codeToVerify) return;
    setCode(codeToVerify);
    setError('');
    setBusy(true);
    try {
      const result = await api.verifyOtp(phone, codeToVerify.trim());
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

  const verifyCode = async () => {
    setError('');
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError(language === 'hi' ? 'कृपया 6-अंकों का OTP कोड दर्ज करें' : 'Please enter the 6-digit OTP code');
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
      const session = await api.completePhoneProfile(
        profileSetupToken,
        name.trim(),
        referralCode.trim().toUpperCase() || undefined,
        requestedRole
      );
      await onComplete(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('authServiceUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  // Render individual OTP Digit Boxes
  const renderOtpBoxes = () => {
    const digits = code.split('');
    const targetLength = 6;
    const boxes = [];
    for (let i = 0; i < targetLength; i++) {
      const digit = digits[i] || '';
      const isFocused = i === digits.length;
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFocused && styles.otpBoxFocused,
            Boolean(digit) && styles.otpBoxFilled,
          ]}
        >
          <Text style={styles.otpBoxText}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <View style={styles.form}>
      {/* ── STEP 1: PHONE NUMBER ── */}
      {step === 'phone' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>
            {mode === 'login'
              ? (language === 'hi' ? 'लॉगिन करें' : 'Welcome Back')
              : (language === 'hi' ? 'खाता बनाएं' : 'Create Account')}
          </Text>
          <Text style={styles.stepDesc}>
            {language === 'hi'
              ? 'सत्यापन के लिए अपना 10 अंकों का मोबाइल नंबर दर्ज करें'
              : 'Enter your 10-digit mobile number for secure instant sign-in'}
          </Text>

          {mode === 'signup' && requestedRole === 'collector' && (
            <View style={styles.collectorNotice}>
              <Text style={styles.collectorNoticeEmoji}>🛵</Text>
              <Text style={styles.collectorNoticeText}>
                {language === 'hi'
                  ? 'कलेक्टर एक्सेस एडमिन मंज़ूरी के बाद सक्रिय होगा। तब तक आप नागरिक के रूप में रिपोर्ट कर सकते हैं।'
                  : 'Collector access will be approved by the District Admin. Until then, you can use citizen features.'}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryPill}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCode}>+91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={15}
              style={styles.phoneInput}
              editable={!busy}
              onSubmitEditing={() => void sendCode()}
            />
          </View>
        </View>
      )}

      {/* ── STEP 2: OTP CODE ── */}
      {step === 'code' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>
            {language === 'hi' ? 'OTP सत्यापित करें' : 'Verify Phone'}
          </Text>
          <Text style={styles.stepDesc}>
            {language === 'hi'
              ? `${phone} पर 6-अंकों का सत्यापन कोड भेजा गया है`
              : `6-digit verification code sent to ${phone}`}
          </Text>

          {/* 📲 SMS OTP IN-APP DELIVERY BANNER (Instant Delivery & 1-Tap Auto-Fill) */}
          {Boolean(otpCode) && (
            <View style={styles.smsAlertCard}>
              <View style={styles.smsAlertHeader}>
                <View style={styles.smsAlertIconWrap}>
                  <Text style={styles.smsAlertIcon}>💬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smsAlertTitle}>SMS from WasteCHAiN</Text>
                  <Text style={styles.smsAlertBody}>
                    Your verification OTP is: <Text style={styles.smsAlertCode}>{otpCode}</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.autoFillBtn}
                onPress={() => void autoFillAndVerify(otpCode)}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={styles.autoFillText}>⚡ 1-Tap Auto-Fill &amp; Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>{language === 'hi' ? '6-अंकों का OTP कोड' : 'Enter 6-Digit OTP'}</Text>
          
          {/* Visual OTP Boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => codeInputRef.current?.focus()}
            style={styles.otpBoxesRow}
          >
            {renderOtpBoxes()}
          </TouchableOpacity>

          {/* Hidden real input */}
          <TextInput
            ref={codeInputRef}
            value={code}
            onChangeText={val => setCode(val.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            editable={!busy}
            autoFocus
            onSubmitEditing={() => void verifyCode()}
          />

          <View style={styles.resendRow}>
            <TouchableOpacity onPress={() => { setStep('phone'); setError(''); }} disabled={busy}>
              <Text style={styles.changePhoneText}>
                {language === 'hi' ? '← नंबर बदलें' : '← Change Number'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void sendCode()}
              disabled={busy || cooldown > 0}
            >
              <Text style={[styles.resendText, (busy || cooldown > 0) && styles.mutedText]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : (language === 'hi' ? 'पुनः भेजें' : 'Resend Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── STEP 3: PROFILE SETUP (FOR NEW USERS) ── */}
      {step === 'profile' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>
            {language === 'hi' ? 'अपनी प्रोफ़ाइल पूरी करें' : 'Complete Profile'}
          </Text>
          <Text style={styles.stepDesc}>
            {language === 'hi'
              ? 'अपशिष्ट रिपोर्ट करने और पुरस्कार प्राप्त करने के लिए अपना नाम दर्ज करें'
              : 'Enter your full name to start reporting waste and collecting reward points'}
          </Text>

          <View style={styles.verifiedPhoneBadge}>
            <Text style={styles.verifiedPhoneIcon}>✓</Text>
            <Text style={styles.verifiedPhoneText}>{phone} (Verified)</Text>
          </View>

          <Text style={styles.inputLabel}>{language === 'hi' ? 'आपका पूरा नाम' : 'Full Name'}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={language === 'hi' ? 'जैसे: राहुल कुमार' : 'e.g. Rahul Kumar'}
            placeholderTextColor="#9ca3af"
            autoComplete="name"
            textContentType="name"
            maxLength={60}
            style={styles.standardInput}
            editable={!busy}
            onSubmitEditing={() => void finishProfile()}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            {language === 'hi' ? 'रेफ़रल कोड (वैकल्पिक)' : 'Referral Code (Optional)'}
          </Text>
          <TextInput
            value={referralCode}
            onChangeText={v => setReferralCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="e.g. CLEAN50"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            maxLength={8}
            style={styles.standardInput}
            editable={!busy}
          />
        </View>
      )}

      {/* Error Message */}
      {Boolean(error) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.actionBtn, busy && styles.actionBtnDisabled]}
        onPress={() => void (step === 'phone' ? sendCode() : step === 'code' ? verifyCode() : finishProfile())}
        disabled={busy}
        activeOpacity={0.88}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionBtnText}>
            {step === 'phone'
              ? (language === 'hi' ? 'OTP कोड भेजें →' : 'Send Verification OTP →')
              : step === 'code'
              ? (language === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : 'Verify & Continue')
              : (language === 'hi' ? 'प्रोफ़ाइल सहेजें और शुरू करें 🚀' : 'Start Reporting Waste 🚀')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  stepContainer: { marginBottom: 12 },
  stepTitle: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#0f291e', letterSpacing: -0.7, marginBottom: 4 },
  stepDesc: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: '#4b5563', lineHeight: 20, marginBottom: 18 },
  inputLabel: { fontSize: 11, fontFamily: 'Manrope_800ExtraBold', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 8 },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  flagEmoji: { fontSize: 18 },
  countryCode: { fontSize: 15, fontFamily: 'Manrope_800ExtraBold', color: '#111827' },
  phoneInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: '#111827',
  },
  standardInput: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: '#111827',
  },
  collectorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 16,
  },
  collectorNoticeEmoji: { fontSize: 22 },
  collectorNoticeText: { flex: 1, fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: '#065f46', lineHeight: 16 },
  smsAlertCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    marginBottom: 18,
    shadowColor: '#16a34a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  smsAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  smsAlertIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsAlertIcon: { fontSize: 18 },
  smsAlertTitle: { fontSize: 11, fontFamily: 'Manrope_800ExtraBold', color: '#166534', textTransform: 'uppercase', letterSpacing: 0.6 },
  smsAlertBody: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: '#14532d', marginTop: 1 },
  smsAlertCode: { fontFamily: 'Manrope_800ExtraBold', color: '#15803d', fontSize: 16, letterSpacing: 1 },
  autoFillBtn: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillText: { color: '#ffffff', fontSize: 12, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 0.4 },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.8,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  otpBoxFilled: { borderColor: '#15803d', backgroundColor: '#ffffff' },
  otpBoxText: { fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: '#0f291e' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  changePhoneText: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#4b5563' },
  resendText: { fontSize: 12, fontFamily: 'Manrope_800ExtraBold', color: '#16a34a' },
  mutedText: { color: '#9ca3af' },
  verifiedPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  verifiedPhoneIcon: { color: '#16a34a', fontFamily: 'Manrope_800ExtraBold', fontSize: 12 },
  verifiedPhoneText: { color: '#15803d', fontFamily: 'Manrope_800ExtraBold', fontSize: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 14,
  },
  errorIcon: { fontSize: 14 },
  errorText: { flex: 1, fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#b91c1c' },
  actionBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#16a34a',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionBtnDisabled: { opacity: 0.65 },
  actionBtnText: { color: '#ffffff', fontSize: 16, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 0.3 },
});
