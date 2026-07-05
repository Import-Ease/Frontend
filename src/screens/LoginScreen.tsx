import React, { useState } from 'react';
import {
    Alert,
    Image,
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, FontSize, Radius, Space, CardShadow, AppColors } from '../theme';
import { RootStackParamList } from '../types';

type Mode = 'login' | 'signup';
type Method = 'email' | 'phone';

export default function LoginScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [mode, setMode] = useState<Mode>('login');
    const [method, setMethod] = useState<Method>('email');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isLogin = mode === 'login';
    const isEmail = method === 'email';


    const handleLogin = () => {
        if (email.toLowerCase() === 'admin@importease.com') {
            // If admin, go to hidden dashboard
            navigation.replace('AdminDashboard');
        } else {
            // If regular user, go to normal app
            navigation.replace('Main');
        }
    };

    // Add this state inside LoginScreen
    const [tapCount, setTapCount] = useState(0);

    const handleLogoTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount >= 5) {
            setTapCount(0);
            navigation.navigate('AdminDashboard');
        }
    };

    const handleSubmit = () => {
        if (!isLogin && !name.trim()) {
            Alert.alert('Missing info', 'Please enter your full name.');
            return;
        }
        if (isEmail && !email.trim()) {
            Alert.alert('Missing info', 'Please enter your email address.');
            return;
        }
        if (!isEmail && !phone.trim()) {
            Alert.alert('Missing info', 'Please enter your phone number.');
            return;
        }
        if (!password) {
            Alert.alert('Missing info', 'Please enter a password.');
            return;
        }
        if (!isLogin && password !== confirm) {
            Alert.alert("Passwords don't match", 'Please make sure both passwords are the same.');
            return;
        }
        navigation.replace('Main');
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Logo ── */}
                    <View style={styles.logoWrap}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: colors.navy }]}>
                            Import<Text style={{ color: colors.green }}>Ease</Text>
                        </Text>
                        <Text style={[styles.tagline, { color: colors.muted }]}>
                            Your import duty companion
                        </Text>
                    </View>

                    {/* ── Mode toggle ── */}
                    <View style={[styles.modeToggle, { backgroundColor: colors.surfaceAlt }]}>
                        <TouchableOpacity
                            style={[styles.modeBtn, isLogin && { backgroundColor: colors.navy }]}
                            onPress={() => setMode('login')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.modeBtnText, { color: isLogin ? colors.white : colors.muted }]}>
                                Log in
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, !isLogin && { backgroundColor: colors.navy }]}
                            onPress={() => setMode('signup')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.modeBtnText, { color: !isLogin ? colors.white : colors.muted }]}>
                                Sign up
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modeBtn}
                            onPress={handleLogoTap}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.modeBtnText, { color: isLogin ? colors.white : colors.muted }]}>
                                Admin
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Form card ── */}
                    <View style={[styles.card, { backgroundColor: colors.card }]}>

                        {/* Method toggle */}
                        <View style={[styles.methodRow, { borderBottomColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.methodBtn, isEmail && { borderBottomColor: colors.navy, borderBottomWidth: 2 }]}
                                onPress={() => setMethod('email')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.methodText, { color: isEmail ? colors.navy : colors.muted }]}>
                                    📧 Email
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodBtn, !isEmail && { borderBottomColor: colors.navy, borderBottomWidth: 2 }]}
                                onPress={() => setMethod('phone')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.methodText, { color: !isEmail ? colors.navy : colors.muted }]}>
                                    📱 Phone
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Full name — sign up only */}
                        {!isLogin && (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>Full name</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Ama Mensah"
                                    placeholderTextColor={colors.caption}
                                    autoCapitalize="words"
                                    style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>
                        )}

                        {/* Email or Phone */}
                        {isEmail ? (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>Email address</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="you@example.com"
                                    placeholderTextColor={colors.caption}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>
                        ) : (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>Phone number</Text>
                                <View style={styles.phoneRow}>
                                    <View style={[styles.phonePrefix, { backgroundColor: colors.surfaceAlt }]}>
                                        <Text style={[styles.phonePrefixText, { color: colors.text }]}>🇬🇭 +233</Text>
                                    </View>
                                    <TextInput
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="024 000 0000"
                                        placeholderTextColor={colors.caption}
                                        keyboardType="phone-pad"
                                        style={[styles.input, styles.phoneInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Password */}
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
                            <View style={[styles.passwordRow, { backgroundColor: colors.surfaceAlt }]}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="At least 8 characters"
                                    placeholderTextColor={colors.caption}
                                    secureTextEntry={!showPassword}
                                    style={[styles.input, styles.passwordInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword((v) => !v)}
                                    style={styles.eyeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm password — sign up only */}
                        {!isLogin && (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>Confirm password</Text>
                                <TextInput
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    placeholder="Same password again"
                                    placeholderTextColor={colors.caption}
                                    secureTextEntry={!showPassword}
                                    style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>
                        )}

                        {/* Forgot password — login only */}
                        {isLogin && (
                            <TouchableOpacity
                                onPress={() => Alert.alert('Reset password', "We'll send a reset link to your email.")}
                                style={styles.forgotBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.forgotText, { color: colors.cobalt }]}>Forgot password?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: colors.navy }]}
                            onPress={handleSubmit}
                            activeOpacity={0.88}
                        >
                            <Text style={[styles.submitText, { color: colors.white }]}>
                                {isLogin ? 'Log in' : 'Create account'}
                            </Text>
                        </TouchableOpacity>

                        {/* Switch mode hint */}
                        <View style={styles.switchHint}>
                            <Text style={[styles.switchHintText, { color: colors.muted }]}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            </Text>
                            <TouchableOpacity onPress={() => setMode(isLogin ? 'signup' : 'login')} activeOpacity={0.7}>
                                <Text style={[styles.switchHintLink, { color: colors.navy }]}>
                                    {isLogin ? 'Sign up' : 'Log in'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Footer ── */}
                    <Text style={[styles.footer, { color: colors.caption }]}>
                        By continuing you agree to our{' '}
                        <Text style={{ color: colors.navy }}>Terms</Text> &{' '}
                        <Text style={{ color: colors.navy }}>Privacy Policy</Text>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Styles — no colors here, all passed inline above ──
const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Space.lg, paddingBottom: 40 },

    logoWrap: { alignItems: 'center', paddingTop: Space.xl, paddingBottom: Space.lg },
    logo: { width: 90, height: 90, marginBottom: Space.sm },
    appName: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: 4 },
    tagline: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    modeToggle: {
        flexDirection: 'row',
        borderRadius: Radius.pill,
        padding: 4,
        marginBottom: Space.lg,
    },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.pill, alignItems: 'center' },
    modeBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    card: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.md, ...CardShadow },

    methodRow: { flexDirection: 'row', marginBottom: Space.md, borderBottomWidth: 1 },
    methodBtn: { flex: 1, alignItems: 'center', paddingBottom: 10, marginBottom: -1 },
    methodText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    fieldWrap: { marginBottom: Space.md },
    label: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 6, letterSpacing: 0.3 },
    input: {
        borderRadius: Radius.md,
        paddingHorizontal: Space.md,
        paddingVertical: 13,
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.base,
    },

    phoneRow: { flexDirection: 'row', gap: Space.sm },
    phonePrefix: { borderRadius: Radius.md, paddingHorizontal: Space.md, justifyContent: 'center' },
    phonePrefixText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
    phoneInput: { flex: 1 },

    passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingRight: Space.sm },
    passwordInput: { flex: 1 },
    eyeBtn: { padding: Space.sm },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: Space.md },
    forgotText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    submitBtn: { borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Space.xs },
    submitText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },

    switchHint: { flexDirection: 'row', justifyContent: 'center', marginTop: Space.md },
    switchHintText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
    switchHintLink: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    footer: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, textAlign: 'center', marginTop: Space.sm },
});