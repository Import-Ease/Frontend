import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList } from '../types';
import { MailIcon } from '../components/Icons';
import { verifyOtp, resendOtp } from '../services/api';

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function VerifyOtpScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'VerifyOtp'>>();
  const email = route.params?.email ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');
  const complete = code.length === OTP_LENGTH;
  const canResend = countdown <= 0 && !resending;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const focusNext = (index: number) => {
    const next = inputs.current[index + 1];
    if (next) next.focus();
  };

  const handleDigitChange = (text: string, index: number) => {
    setError(null);
    const clean = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean) focusNext(index);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      const prev = inputs.current[index - 1];
      if (prev) prev.focus();
    }
  };

  const goToLogin = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleVerify = async () => {
    if (!complete) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      await verifyOtp(email, code);
      Alert.alert('Email verified', 'Your email has been verified. You can now log in.', [
        { text: 'OK', onPress: goToLogin },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await resendOtp(email);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      Alert.alert('Code sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <View style={[s.iconWrap, { backgroundColor: colors.greenDim }]}>
              <MailIcon size={26} color={colors.green} />
            </View>
            <Text style={[s.title, { color: colors.navy }]}>Check your email</Text>
            <Text style={[s.subtitle, { color: colors.muted }]}>
              We sent a 6 digit verification code to{'\n'}
              <Text style={[s.email, { color: colors.navy }]}>{email}</Text>
            </Text>
          </View>

          {/* OTP boxes */}
          <View style={s.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                value={d}
                onChangeText={(t) => handleDigitChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                style={[s.otpBox, { backgroundColor: colors.card, color: colors.text, borderColor: complete ? colors.green : colors.border }]}
                maxLength={2}
                keyboardType="number-pad"
                selectTextOnFocus
                autoFocus={i === 0}
                editable={!verifying}
              />
            ))}
          </View>

          {error && (
            <Text style={[s.error, { color: '#D94452' }]}>{error}</Text>
          )}

          {/* Verify */}
          <TouchableOpacity
            style={[s.verifyBtn, { backgroundColor: colors.navy, opacity: complete && !verifying ? 1 : 0.55 }]}
            onPress={handleVerify}
            disabled={!complete || verifying}
            activeOpacity={0.88}
          >
            {verifying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[s.verifyText, { color: colors.white }]}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={[s.resendHint, { color: colors.muted }]}>
              {canResend ? "Didn't get the code? " : 'Resend code in '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                <Text style={[s.resendLink, { color: resending ? colors.muted : colors.cobalt }]}>
                  {resending ? 'Sending…' : 'Resend'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[s.resendTimer, { color: colors.cobalt }]}>{fmtCountdown()}</Text>
            )}
          </View>

          {/* Back to login */}
          <TouchableOpacity style={s.backBtn} onPress={goToLogin} activeOpacity={0.7}>
            <Text style={[s.backText, { color: colors.cobalt }]}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: Space.lg, paddingTop: Space.xl, paddingBottom: 60 },

  header: { alignItems: 'center', marginBottom: Space.xl },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  title: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: Space.sm, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center', lineHeight: 21 },
  email: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Space.md },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: FontSize.lg,
  },

  error: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center', marginBottom: Space.md },

  verifyBtn: {
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Space.sm,
    minHeight: 52,
    ...CardShadow,
  },
  verifyText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Space.lg },
  resendHint: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  resendLink: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  resendTimer: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  backBtn: { alignItems: 'center', marginTop: Space.lg },
  backText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
