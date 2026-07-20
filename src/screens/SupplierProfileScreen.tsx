import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { UserIcon, MailIcon, PhoneIcon, GlobeIcon } from '../components/Icons';
import {
    fetchMySupplierProfile,
    createSupplierProfile,
    updateSupplierProfile,
} from '../services/api';

type FormData = {
    name: string;
    email: string;
    phone: string;
    address: string;
    shippingOrigin: string;
};

const EMPTY_FORM: FormData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    shippingOrigin: '',
};

export default function SupplierProfileScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

    const loadProfile = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await fetchMySupplierProfile(token);
            setHasProfile(true);
            setForm({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                shippingOrigin: data.shippingOrigin || '',
            });
        } catch {
            setHasProfile(false);
            setForm(EMPTY_FORM);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setLoading(true);
            loadProfile();
        });
        return unsubscribe;
    }, [navigation, loadProfile]);

    const updateField = (key: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Missing info', 'Business name is required.');
            return;
        }

        const token = getToken();
        if (!token) {
            Alert.alert('Not logged in', 'Please sign in again.');
            return;
        }

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            shippingOrigin: form.shippingOrigin.trim(),
        };

        setSaving(true);
        try {
            if (hasProfile) {
                await updateSupplierProfile(payload, token);
            } else {
                await createSupplierProfile(payload, token);
                setHasProfile(true);
            }
            setDirty(false);
            Alert.alert('Saved', 'Your supplier profile has been updated.');
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const username = (globalThis as any).__IMPORT_EASE_USERNAME__ as string | undefined;
    const initials = username
        ? username.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={s.header}>
                        <View style={[s.avatar, { backgroundColor: colors.orangeDim }]}>
                            <Text style={[s.avatarText, { color: colors.orange }]}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.pageTitle, { color: colors.text }]}>Supplier Profile</Text>
                            <Text style={[s.subtitle, { color: colors.muted }]}>
                                {hasProfile ? 'View and edit your business info' : 'Set up your supplier profile'}
                            </Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={s.centered}>
                            <ActivityIndicator size="large" color={colors.cobalt} />
                            <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>
                                Loading profile...
                            </Text>
                        </View>
                    ) : (
                        <View style={[s.card, { backgroundColor: colors.card }]}>
                            {/* Business Name */}
                            <View style={s.fieldWrap}>
                                <View style={s.labelRow}>
                                    <UserIcon size={14} color={colors.cobalt} />
                                    <Text style={[s.label, { color: colors.muted }]}>Business name *</Text>
                                </View>
                                <TextInput
                                    value={form.name}
                                    onChangeText={(v) => updateField('name', v)}
                                    placeholder="e.g. Premium Exports Ltd"
                                    placeholderTextColor={colors.caption}
                                    style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {/* Email */}
                            <View style={s.fieldWrap}>
                                <View style={s.labelRow}>
                                    <MailIcon size={14} color={colors.green} />
                                    <Text style={[s.label, { color: colors.muted }]}>Email</Text>
                                </View>
                                <TextInput
                                    value={form.email}
                                    onChangeText={(v) => updateField('email', v)}
                                    placeholder="supplier@example.com"
                                    placeholderTextColor={colors.caption}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {/* Phone */}
                            <View style={s.fieldWrap}>
                                <View style={s.labelRow}>
                                    <PhoneIcon size={14} color={colors.skyBlue} />
                                    <Text style={[s.label, { color: colors.muted }]}>Phone</Text>
                                </View>
                                <TextInput
                                    value={form.phone}
                                    onChangeText={(v) => updateField('phone', v)}
                                    placeholder="+233 24 000 0000"
                                    placeholderTextColor={colors.caption}
                                    keyboardType="phone-pad"
                                    style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {/* Address */}
                            <View style={s.fieldWrap}>
                                <View style={s.labelRow}>
                                    <GlobeIcon size={14} color={colors.navy} />
                                    <Text style={[s.label, { color: colors.muted }]}>Address</Text>
                                </View>
                                <TextInput
                                    value={form.address}
                                    onChangeText={(v) => updateField('address', v)}
                                    placeholder="Business address"
                                    placeholderTextColor={colors.caption}
                                    style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {/* Shipping Origin */}
                            <View style={s.fieldWrap}>
                                <View style={s.labelRow}>
                                    <GlobeIcon size={14} color={colors.orange} />
                                    <Text style={[s.label, { color: colors.muted }]}>Shipping origin</Text>
                                </View>
                                <TextInput
                                    value={form.shippingOrigin}
                                    onChangeText={(v) => updateField('shippingOrigin', v)}
                                    placeholder="e.g. China, India, Turkey"
                                    placeholderTextColor={colors.caption}
                                    style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {/* Save */}
                            <TouchableOpacity
                                style={[
                                    s.saveBtn,
                                    { backgroundColor: dirty ? colors.cobalt : colors.surfaceAlt },
                                ]}
                                onPress={handleSave}
                                disabled={saving || !dirty}
                                activeOpacity={0.85}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={[s.saveBtnText, { color: dirty ? '#FFFFFF' : colors.muted }]}>
                                        {hasProfile ? 'Save changes' : 'Create profile'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Space.lg, paddingBottom: 60 },

    header: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginBottom: Space.lg },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg },
    pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: 2 },
    subtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    centered: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center' },

    card: { borderRadius: Radius.lg, padding: Space.lg, ...CardShadow },

    fieldWrap: { marginBottom: Space.md },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    label: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3 },
    input: {
        borderRadius: Radius.md,
        paddingHorizontal: Space.md,
        paddingVertical: 13,
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.base,
    },

    saveBtn: {
        borderRadius: Radius.pill,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: Space.sm,
    },
    saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },
});
