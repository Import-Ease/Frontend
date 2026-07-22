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
import { EyeIcon, EyeOffIcon, ChevronLeftIcon } from '../components/Icons';
import { loginUser } from '../services/api';
import { saveAdminToken } from '../services/storage';

export default function AdminLoginScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!username.trim()) {
            Alert.alert('Missing info', 'Please enter your username or email.');
            return;
        }
        if (!password) {
            Alert.alert('Missing info', 'Please enter a password.');
            return;
        }

        setSubmitting(true);
        try {
            const authRes = await loginUser(username.trim(), password.trim());
            if (!authRes?.accessToken) {
                Alert.alert('Login failed', 'The server did not return a valid token.');
                return;
            }
            if (authRes.role !== 'ADMIN') {
                Alert.alert('Access denied', 'This account does not have admin access.');
                return;
            }
            await saveAdminToken(authRes.accessToken);
            navigation.replace('AdminDashboard');
        } catch (error: any) {
            Alert.alert('Login failed', error?.message || 'Invalid credentials. Please try again.');
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
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
                        activeOpacity={0.7}
                    >
                        <ChevronLeftIcon size={18} color={colors.cobalt} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoWrap}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: colors.navy }]}>
                            Admin Portal
                        </Text>
                        <Text style={[styles.tagline, { color: colors.muted }]}>
                            Authorized personnel only
                        </Text>
                    </View>

                    {/* Form card */}
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        {/* Username */}
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.muted }]}>Username or email</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter admin username"
                                placeholderTextColor={colors.caption}
                                autoCapitalize="none"
                                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
                            <View style={[styles.passwordRow, { backgroundColor: colors.surfaceAlt }]}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
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

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: colors.navy }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.88}
                        >
                            <Text style={[styles.submitText, { color: colors.white }]}>
                                {submitting ? 'Verifying…' : 'Access Admin Panel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Space.lg, paddingBottom: 40 },

    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },

    logoWrap: { alignItems: 'center', paddingTop: Space.sm, paddingBottom: Space.lg },
    logo: { width: 80, height: 80, marginBottom: Space.sm },
    appName: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl, marginBottom: 4 },
    tagline: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    card: { borderRadius: Radius.lg, padding: Space.md, ...CardShadow },

    fieldWrap: { marginBottom: Space.md },
    label: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 6, letterSpacing: 0.3 },
    input: {
        borderRadius: Radius.md,
        paddingHorizontal: Space.md,
        paddingVertical: 13,
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.base,
    },

    passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingRight: Space.sm },
    passwordInput: { flex: 1 },
    eyeBtn: { padding: Space.sm },

    submitBtn: { borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: Space.xs },
    submitText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },
});
