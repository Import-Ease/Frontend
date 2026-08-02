import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { UserIcon, MailIcon, PhoneIcon, GlobeIcon, StarIcon, PencilIcon, CheckBadgeIcon } from '../components/Icons';
import {
  fetchMySupplierProfile,
  createSupplierProfile,
  updateSupplierProfile,
  fetchPublicSupplierProfile,
  fetchSupplierProducts,
} from '../services/api';

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  logoUrl: string;
  category: string;
  shippingOrigin: string;
};

const EMPTY_FORM: FormData = {
  name: '', email: '', phone: '', address: '',
  description: '', logoUrl: '', category: '', shippingOrigin: '',
};

export default function SupplierProfileScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publicData, setPublicData] = useState<any>(null);

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const data = await fetchMySupplierProfile(token);
      setHasProfile(true);
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        description: data.description || '',
        logoUrl: data.logoUrl || '',
        category: data.category || '',
        shippingOrigin: data.shippingOrigin || '',
      });
      if (data.id) {
        try {
          const pub = await fetchPublicSupplierProfile(data.id);
          setPublicData(pub);
        } catch {}
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('No supplier profile found')) {
        setHasProfile(false);
      } else {
        setError(msg || 'Could not load profile');
      }
      setForm(EMPTY_FORM);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null); setLoading(true); loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setLoading(true); loadProfile();
    });
    return unsub;
  }, [navigation, loadProfile]);

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing info', 'Business name is required.'); return;
    }
    const token = getToken();
    if (!token) { Alert.alert('Not logged in', 'Please sign in again.'); return; }
    const payload = {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      address: form.address.trim(), description: form.description.trim(),
      logoUrl: form.logoUrl.trim(), category: form.category.trim(),
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
      setEditing(false);
      Alert.alert('Saved', 'Your supplier profile has been updated.');
      loadProfile();
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
  const stats = publicData;

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.cobalt} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !hasProfile) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: colors.muted }]}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.cobaltDim, marginTop: Space.md }]} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={[s.retryBtnText, { color: colors.cobalt }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasProfile && !editing) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.cobaltDim }]}>
              <UserIcon size={40} color={colors.cobalt} strokeWidth={1.2} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No supplier profile yet</Text>
            <Text style={[s.emptyText, { color: colors.muted }]}>Create a profile to start selling on ImportEase</Text>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: colors.cobalt }]}
              onPress={() => { setEditing(true); setForm(EMPTY_FORM); }}
              activeOpacity={0.85}
            >
              <Text style={s.createBtnText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (editing) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.editHeader}>
              <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.7}>
                <Text style={[s.cancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[s.editTitle, { color: colors.text }]}>{hasProfile ? 'Edit Profile' : 'Create Profile'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
                <Text style={[s.saveText, { color: colors.cobalt }]}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.card, { backgroundColor: colors.card }]}>
              {[
                { key: 'name' as keyof FormData, label: 'Business name *', icon: <UserIcon size={14} color={colors.cobalt} />, placeholder: 'e.g. Premium Exports Ltd' },
                { key: 'description' as keyof FormData, label: 'Business description', icon: null, placeholder: 'Tell buyers about your business...', multiline: true },
                { key: 'category' as keyof FormData, label: 'Category', icon: null, placeholder: 'e.g. Electronics, Food, Textiles' },
                { key: 'email' as keyof FormData, label: 'Email', icon: <MailIcon size={14} color={colors.green} />, placeholder: 'supplier@example.com', keyboardType: 'email-address' as const },
                { key: 'phone' as keyof FormData, label: 'Phone', icon: <PhoneIcon size={14} color={colors.skyBlue} />, placeholder: '+233 24 000 0000', keyboardType: 'phone-pad' as const },
                { key: 'address' as keyof FormData, label: 'Address', icon: <GlobeIcon size={14} color={colors.navy} />, placeholder: 'Business address' },
                { key: 'shippingOrigin' as keyof FormData, label: 'Shipping origin', icon: <GlobeIcon size={14} color={colors.orange} />, placeholder: 'e.g. China, India, Turkey' },
                { key: 'logoUrl' as keyof FormData, label: 'Logo URL', icon: null, placeholder: 'https://example.com/logo.png' },
              ].map((field) => (
                <View key={field.key} style={s.fieldWrap}>
                  <View style={s.labelRow}>
                    {field.icon}{field.icon ? <View style={{ width: 4 }} /> : null}
                    <Text style={[s.label, { color: colors.muted }]}>{field.label}</Text>
                  </View>
                  <TextInput
                    value={form[field.key]}
                    onChangeText={(v) => updateField(field.key, v)}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.caption}
                    keyboardType={(field as any).keyboardType}
                    autoCapitalize="none"
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 3 : 1}
                    style={[s.input, field.multiline && s.textarea, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                  />
                </View>
              ))}
              {form.logoUrl ? (
                <Image source={{ uri: form.logoUrl }} style={s.logoPreview} resizeMode="contain" />
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[s.banner, { backgroundColor: colors.navy }]}>
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={s.profileLogo} resizeMode="contain" />
          ) : (
            <View style={[s.profileLogo, s.profileLogoPlaceholder, { backgroundColor: colors.navyDim }]}>
              <Text style={[s.profileLogoInitials, { color: colors.navy }]}>{initials}</Text>
            </View>
          )}
          <Text style={s.bannerName}>{form.name || username || 'Your Business'}</Text>
          {stats?.verified && (
            <View style={s.verifiedBadge}>
              <CheckBadgeIcon size={14} color="#FFFFFF" />
              <Text style={s.verifiedBadgeText}>Verified Supplier</Text>
            </View>
          )}
          {form.shippingOrigin ? (
            <Text style={s.bannerSub}>{form.shippingOrigin}</Text>
          ) : null}
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => setEditing(true)}
            activeOpacity={0.85}
          >
            <PencilIcon size={14} color={colors.navy} />
            <Text style={s.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.cobalt }]}>{stats.productCount ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Products</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.green }]}>{stats.ordersCompleted ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Completed</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.orange }]}>{stats.totalOrders ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Orders</Text>
            </View>
          </View>
        )}

        {/* Business info */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Business Information</Text>
          {form.description ? (
            <Text style={[s.descriptionText, { color: colors.textSoft }]}>{form.description}</Text>
          ) : null}
          {[
            { label: 'Category', value: form.category },
            { label: 'Location', value: form.address },
            { label: 'Shipping from', value: form.shippingOrigin },
          ].map((item) => item.value ? (
            <View key={item.label} style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[s.infoValue, { color: colors.text }]}>{item.value}</Text>
            </View>
          ) : null)}
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: colors.muted }]}>Member since</Text>
            <Text style={[s.infoValue, { color: colors.text }]}>
              {stats?.createdAt ? new Date(stats.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
            </Text>
          </View>
          <View style={s.contactSection}>
            {form.email ? (
              <View style={s.contactRow}>
                <MailIcon size={14} color={colors.caption} />
                <Text style={[s.contactText, { color: colors.muted }]}>{form.email}</Text>
              </View>
            ) : null}
            {form.phone ? (
              <View style={s.contactRow}>
                <PhoneIcon size={14} color={colors.caption} />
                <Text style={[s.contactText, { color: colors.muted }]}>{form.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Reviews placeholder */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Reviews</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: Space.sm }}>
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} size={14} color={colors.caption} filled={false} />
            ))}
            <Text style={[s.emptyText, { color: colors.muted }]}>No reviews yet</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Space.lg },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.pill },
  retryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  createBtn: { marginTop: Space.lg, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.pill },
  createBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },

  /* Banner */
  banner: { alignItems: 'center', paddingVertical: Space.xl, paddingHorizontal: Space.lg, marginHorizontal: Space.md, marginTop: Space.md, borderRadius: Radius.lg },
  profileLogo: { width: 80, height: 80, borderRadius: 40, marginBottom: Space.md },
  profileLogoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  profileLogoInitials: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl },
  bannerName: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl, color: '#FFFFFF', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  verifiedBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, color: '#FFFFFF' },
  bannerSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: Space.md },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
  editProfileBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, color: '#1A3A8F' },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: Space.sm, marginHorizontal: Space.md, marginTop: Space.md },
  statCard: { flex: 1, borderRadius: Radius.md, padding: Space.sm, alignItems: 'center', ...CardShadow },
  statVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  /* Section */
  section: { marginHorizontal: Space.md, marginTop: Space.md, borderRadius: Radius.lg, padding: Space.md, ...CardShadow },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.sm },
  descriptionText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 20, marginBottom: Space.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  infoValue: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  contactSection: { marginTop: Space.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contactText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

  /* Edit mode */
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.md, paddingVertical: Space.sm },
  editTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  cancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  saveText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  card: { marginHorizontal: Space.md, marginTop: Space.md, borderRadius: Radius.lg, padding: Space.md, ...CardShadow },
  fieldWrap: { marginBottom: Space.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3 },
  input: { borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
  textarea: { height: 80, textAlignVertical: 'top' },
  logoPreview: { width: '100%', height: 100, borderRadius: Radius.md, marginTop: Space.sm },
});
