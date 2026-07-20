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
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList } from '../types';
import { MailIcon, PhoneIcon, EyeIcon, EyeOffIcon, ShieldIcon } from '../components/Icons';
import { loginUser, registerUser } from '../services/api';

type Mode = 'login' | 'signup';
type Method = 'email' | 'phone';

export default function LoginScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [mode, setMode] = useState<Mode>('login');
    const [method, setMethod] = useState<Method>('email');
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'IMPORTER' | 'SUPPLIER'>('IMPORTER');

    const isLogin = mode === 'login';
    const isEmail = method === 'email';

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!isLogin && !name.trim()) {
            Alert.alert('Missing info', 'Please enter your full name.');
            return;
        }
        if (isLogin && !username.trim()) {
            Alert.alert('Missing info', 'Please enter your username or email address.');
            return;
        }
        if (!isLogin && isEmail && !email.trim()) {
            Alert.alert('Missing info', 'Please enter your email address.');
            return;
        }
        if (!isLogin && !isEmail && !phone.trim()) {
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

        setSubmitting(true);
        try {
            if (isLogin) {
                const authRes = await loginUser(username.trim(), password.trim());
                if (!authRes?.accessToken) {
                    Alert.alert('Login failed', 'The server did not return a valid token.');
                    return;
                }
                (globalThis as any).__IMPORT_EASE_TOKEN__ = authRes.accessToken;
                (globalThis as any).__IMPORT_EASE_USERNAME__ = authRes.username || username.trim();
                (globalThis as any).__IMPORT_EASE_ROLE__ = authRes.role || 'IMPORTER';
                navigation.replace('Main');
            } else {
                const emailAddr = isEmail ? email.trim() : `${phone.trim()}@importease.local`;
                const displayName = name.trim() || emailAddr.split('@')[0];
                const authRes = await registerUser(displayName, emailAddr, password.trim(), role);
                if (!authRes?.accessToken) {
                    Alert.alert('Signup failed', 'The server did not return a valid token.');
                    return;
                }
                (globalThis as any).__IMPORT_EASE_TOKEN__ = authRes.accessToken;
                (globalThis as any).__IMPORT_EASE_EMAIL__ = emailAddr;
                (globalThis as any).__IMPORT_EASE_USERNAME__ = displayName;
                (globalThis as any).__IMPORT_EASE_ROLE__ = authRes.role || role;
                navigation.replace('Main');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
                    </View>

                    {/* ── Admin entry ── */}
                    <TouchableOpacity
                        style={[styles.adminBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('AdminLogin')}
                        activeOpacity={0.7}
                    >
                        <ShieldIcon size={14} color={colors.orange} />
                        <Text style={[styles.adminBtnText, { color: colors.orange }]}>Admin</Text>
                    </TouchableOpacity>

                    {/* ── Form card ── */}
                    <View style={[styles.card, { backgroundColor: colors.card }]}>

                        {/* Method toggle — sign up only */}
                        {!isLogin && (
                            <View style={[styles.methodRow, { borderBottomColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[styles.methodBtn, isEmail && { borderBottomColor: colors.navy, borderBottomWidth: 2 }]}
                                    onPress={() => setMethod('email')}
                                    activeOpacity={0.8}
                                >
                                    <MailIcon size={14} color={isEmail ? colors.navy : colors.muted} />
                                    <Text style={[styles.methodText, { color: isEmail ? colors.navy : colors.muted }]}>
                                        Email
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodBtn, !isEmail && { borderBottomColor: colors.navy, borderBottomWidth: 2 }]}
                                    onPress={() => setMethod('phone')}
                                    activeOpacity={0.8}
                                >
                                    <PhoneIcon size={14} color={!isEmail ? colors.navy : colors.muted} />
                                    <Text style={[styles.methodText, { color: !isEmail ? colors.navy : colors.muted }]}>
                                        Phone
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Username or Email — login only */}
                        {isLogin && (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>Username or email</Text>
                                <TextInput
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter username or email"
                                    placeholderTextColor={colors.caption}
                                    autoCapitalize="none"
                                    style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>
                        )}

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

                        {/* Email or Phone — sign up only */}
                        {!isLogin && (isEmail ? (
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
                                    <View style={[styles.phonePrefix, { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }]}>
                                        <Text style={[styles.phonePrefixText, { color: colors.text }]}>GH +233</Text>
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
                        ))}

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
                                    {showPassword ? (
                                      <EyeOffIcon size={18} color={colors.muted} />
                                    ) : (
                                      <EyeIcon size={18} color={colors.muted} />
                                    )}
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

                        {/* Role selector — sign up only */}
                        {!isLogin && (
                            <View style={styles.fieldWrap}>
                                <Text style={[styles.label, { color: colors.muted }]}>I am a</Text>
                                <View style={[styles.roleRow, { backgroundColor: colors.surfaceAlt }]}>
                                    <TouchableOpacity
                                        style={[styles.roleBtn, role === 'IMPORTER' && { backgroundColor: colors.navy }]}
                                        onPress={() => setRole('IMPORTER')}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.roleBtnText, { color: role === 'IMPORTER' ? colors.white : colors.muted }]}>
                                            Importer
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.roleBtn, role === 'SUPPLIER' && { backgroundColor: colors.navy }]}
                                        onPress={() => setRole('SUPPLIER')}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.roleBtnText, { color: role === 'SUPPLIER' ? colors.white : colors.muted }]}>
                                            Supplier
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
                            disabled={submitting}
                            activeOpacity={0.88}
                        >
                            <Text style={[styles.submitText, { color: colors.white }]}>
                                {submitting
                                    ? isLogin ? 'Logging in…' : 'Creating account…'
                                    : isLogin
                                        ? 'Log in'
                                        : 'Create account'}
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
        marginBottom: Space.sm,
    },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.pill, alignItems: 'center' },
    modeBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    adminBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: Radius.pill,
        paddingVertical: 9,
        marginBottom: Space.lg,
        borderWidth: 1,
    },
    adminBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3 },

    card: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.md, ...CardShadow },

    methodRow: { flexDirection: 'row', marginBottom: Space.md, borderBottomWidth: 1 },
    methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 10, marginBottom: -1 },
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

    roleRow: { flexDirection: 'row', borderRadius: Radius.pill, padding: 4 },
    roleBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.pill, alignItems: 'center' },
    roleBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

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
