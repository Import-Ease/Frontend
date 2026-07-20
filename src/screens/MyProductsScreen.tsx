import React, { useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
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
import { RootStackParamList, Product } from '../types';
import { PlusIcon, PackageIcon } from '../components/Icons';
import { fetchMyProducts, createProduct, updateProduct, deleteProduct, fetchMyProductCount, initiateSubscriptionUpgrade } from '../services/api';

type FormData = {
    productName: string;
    description: string;
    productPrice: string;
    quantity: string;
    imageUrl: string;
};

const EMPTY_FORM: FormData = {
    productName: '',
    description: '',
    productPrice: '',
    quantity: '',
    imageUrl: '',
};

export default function MyProductsScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [tierInfo, setTierInfo] = useState<{ productCount: number; subscriptionTier: string; paidUntil: string | null } | null>(null);
    const [upgrading, setUpgrading] = useState(false);

    const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

    const loadProducts = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const data = await fetchMyProducts(token);
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadTierInfo = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const info = await fetchMyProductCount(token);
            setTierInfo(info);
        } catch {
            // ignore — tier info is optional
        }
    }, []);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setLoading(true);
            loadProducts();
            loadTierInfo();
        });
        return unsubscribe;
    }, [navigation, loadProducts, loadTierInfo]);

    const openAddForm = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormVisible(true);
    };

    const openEditForm = (product: Product) => {
        setEditingId(product.id);
        setForm({
            productName: product.productName || '',
            description: product.description || '',
            productPrice: String(product.productPrice ?? ''),
            quantity: String(product.quantity ?? ''),
            imageUrl: product.imageUrl || '',
        });
        setFormVisible(true);
    };

    const handleSave = async () => {
        if (!form.productName.trim()) {
            Alert.alert('Missing info', 'Product name is required.');
            return;
        }
        if (!form.productPrice || isNaN(Number(form.productPrice)) || Number(form.productPrice) <= 0) {
            Alert.alert('Invalid price', 'Please enter a valid product price.');
            return;
        }

        const token = getToken();
        if (!token) {
            Alert.alert('Not logged in', 'Please sign in again.');
            return;
        }

        const payload = {
            productName: form.productName.trim(),
            description: form.description.trim(),
            productPrice: Number(form.productPrice),
            quantity: form.quantity ? Number(form.quantity) : 0,
            imageUrl: form.imageUrl.trim(),
        };

        setSaving(true);
        try {
            if (editingId) {
                await updateProduct(editingId, payload, token);
            } else {
                await createProduct(payload, token);
            }
            setFormVisible(false);
            loadProducts();
        } catch (error: any) {
            const msg = error?.message || 'Failed to save product.';
            if (msg.includes('Free tier limited to 5 products')) {
                Alert.alert(
                    'Free plan limit reached',
                    "You\u2019ve reached your free plan limit. Upgrade to add more products.",
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade', onPress: handleUpgrade },
                    ],
                );
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (product: Product) => {
        Alert.alert(
            'Delete product',
            `Are you sure you want to delete "${product.productName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const token = getToken();
                        if (!token) return;
                        try {
                            await deleteProduct(product.id, token);
                            setProducts((prev) => prev.filter((p) => p.id !== product.id));
                        } catch (error: any) {
                            Alert.alert('Error', error?.message || 'Failed to delete product.');
                        }
                    },
                },
            ],
        );
    };

    const updateField = (key: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleUpgrade = async () => {
        const token = getToken();
        if (!token) {
            Alert.alert('Not logged in', 'Please sign in again.');
            return;
        }
        setUpgrading(true);
        try {
            const result = await initiateSubscriptionUpgrade(token);
            if (result.authorizationUrl) {
                Linking.openURL(result.authorizationUrl);
            }
        } catch (error: any) {
            Alert.alert('Upgrade failed', error?.message || 'Could not start upgrade. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    const isFreeTier = tierInfo?.subscriptionTier === 'FREE' || !tierInfo;
    const isAtLimit = isFreeTier && products.length >= 5;

    const renderItem = ({ item }: { item: Product }) => (
        <View style={[s.card, { backgroundColor: colors.card }]}>
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={s.cardImage} resizeMode="cover" />
            ) : (
                <View style={[s.cardImage, s.cardImagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                    <PackageIcon size={28} color={colors.caption} />
                </View>
            )}
            <View style={s.cardBody}>
                <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>
                            {item.productName}
                        </Text>
                        <Text style={[s.cardPrice, { color: colors.green }]}>
                            GHS {Number(item.productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                    {item.quantity != null && (
                        <View style={[s.qtyBadge, { backgroundColor: colors.navyDim }]}>
                            <Text style={[s.qtyText, { color: colors.navy }]}>Qty: {item.quantity}</Text>
                        </View>
                    )}
                </View>
                {item.description ? (
                    <Text style={[s.cardDesc, { color: colors.muted }]} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={s.cardActions}>
                    <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.cobaltDim }]}
                        onPress={() => openEditForm(item)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.actionText, { color: colors.cobalt }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: 'rgba(220,50,50,0.10)' }]}
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.actionText, { color: '#DC3232' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={s.container}>
                {/* Header */}
                <View style={s.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.pageTitle, { color: colors.text }]}>My Products</Text>
                        <Text style={[s.subtitle, { color: colors.muted }]}>
                            {tierInfo
                                ? isFreeTier
                                    ? `${products.length} / 5 products used · FREE`
                                    : `Unlimited products · PAID${tierInfo.paidUntil ? ` (renews ${new Date(tierInfo.paidUntil).toLocaleDateString()})` : ''}`
                                : 'Manage your product catalog'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[s.addBtn, { backgroundColor: isAtLimit ? colors.surfaceAlt : colors.cobalt, opacity: isAtLimit ? 0.5 : 1 }]}
                        onPress={isAtLimit ? handleUpgrade : openAddForm}
                        disabled={saving || upgrading}
                        activeOpacity={0.85}
                    >
                        <PlusIcon size={16} color={isAtLimit ? colors.muted : '#FFFFFF'} strokeWidth={2.5} />
                        <Text style={[s.addBtnText, { color: isAtLimit ? colors.muted : '#FFFFFF' }]}>
                            {isAtLimit ? 'Upgrade' : 'Add Product'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isAtLimit && (
                    <TouchableOpacity
                        style={[s.upgradeBanner, { backgroundColor: colors.cobaltDim }]}
                        onPress={handleUpgrade}
                        disabled={upgrading}
                        activeOpacity={0.85}
                    >
                        <Text style={[s.upgradeBannerText, { color: colors.cobalt }]}>
                            {upgrading ? 'Starting upgrade…' : 'Upgrade to PAID — $4/month for unlimited products'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Product list */}
                {loading ? (
                    <View style={s.centered}>
                        <ActivityIndicator size="large" color={colors.navy} />
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>
                            Loading products...
                        </Text>
                    </View>
                ) : products.length === 0 ? (
                    <View style={s.centered}>
                        <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                            <PackageIcon size={40} color={colors.caption} strokeWidth={1.2} />
                        </View>
                        <Text style={[s.emptyTitle, { color: colors.text }]}>No products yet</Text>
                        <Text style={[s.emptyText, { color: colors.muted }]}>
                            Tap "Add Product" to list your first product
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={s.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Add / Edit Modal */}
            <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={s.modalHeader}>
                            <TouchableOpacity
                                onPress={() => setFormVisible(false)}
                                style={s.cancelBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.cancelText, { color: colors.muted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={[s.modalTitle, { color: colors.text }]}>
                                {editingId ? 'Edit Product' : 'Add Product'}
                            </Text>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving}
                                style={s.saveBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.saveText, { color: colors.cobalt }]}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={s.modalScroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={s.formGroup}>
                                <Text style={[s.formLabel, { color: colors.muted }]}>Product name *</Text>
                                <TextInput
                                    value={form.productName}
                                    onChangeText={(v) => updateField('productName', v)}
                                    placeholder="e.g. Premium Cocoa Beans"
                                    placeholderTextColor={colors.caption}
                                    style={[s.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            <View style={s.formGroup}>
                                <Text style={[s.formLabel, { color: colors.muted }]}>Description</Text>
                                <TextInput
                                    value={form.description}
                                    onChangeText={(v) => updateField('description', v)}
                                    placeholder="Brief description of the product"
                                    placeholderTextColor={colors.caption}
                                    multiline
                                    numberOfLines={3}
                                    style={[s.formInput, s.formTextarea, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            <View style={s.formRow}>
                                <View style={[s.formGroup, { flex: 1 }]}>
                                    <Text style={[s.formLabel, { color: colors.muted }]}>Price (GHS) *</Text>
                                    <TextInput
                                        value={form.productPrice}
                                        onChangeText={(v) => updateField('productPrice', v)}
                                        placeholder="0.00"
                                        keyboardType="decimal-pad"
                                        placeholderTextColor={colors.caption}
                                        style={[s.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                    />
                                </View>
                                <View style={[s.formGroup, { flex: 1 }]}>
                                    <Text style={[s.formLabel, { color: colors.muted }]}>Quantity</Text>
                                    <TextInput
                                        value={form.quantity}
                                        onChangeText={(v) => updateField('quantity', v)}
                                        placeholder="0"
                                        keyboardType="number-pad"
                                        placeholderTextColor={colors.caption}
                                        style={[s.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                    />
                                </View>
                            </View>

                            <View style={s.formGroup}>
                                <Text style={[s.formLabel, { color: colors.muted }]}>Image URL</Text>
                                <TextInput
                                    value={form.imageUrl}
                                    onChangeText={(v) => updateField('imageUrl', v)}
                                    placeholder="https://example.com/image.jpg"
                                    placeholderTextColor={colors.caption}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                    style={[s.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>

                            {form.imageUrl ? (
                                <View style={s.previewWrap}>
                                    <Image
                                        source={{ uri: form.imageUrl }}
                                        style={s.previewImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : null}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: Space.lg },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Space.lg },
    pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: 2 },
    subtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: Radius.pill },
    addBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    upgradeBanner: { borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: Space.md, marginBottom: Space.lg, alignItems: 'center' },
    upgradeBannerText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    centered: { alignItems: 'center', paddingTop: 60 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
    emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center' },

    list: { paddingBottom: 40 },

    card: { borderRadius: Radius.lg, marginBottom: Space.md, overflow: 'hidden', ...CardShadow },
    cardImage: { width: '100%', height: 140 },
    cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    cardBody: { padding: Space.md },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    cardName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 2 },
    cardPrice: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg },
    cardDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 4 },
    qtyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
    qtyText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    cardActions: { flexDirection: 'row', gap: 8, marginTop: Space.md },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
    actionText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    /* Modal */
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.md, paddingVertical: Space.sm, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    cancelBtn: { padding: Space.sm },
    cancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
    modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
    saveBtn: { padding: Space.sm },
    saveText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    modalScroll: { padding: Space.lg, paddingBottom: 60 },

    formGroup: { marginBottom: Space.md },
    formLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 6, letterSpacing: 0.3 },
    formInput: { borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
    formTextarea: { height: 80, textAlignVertical: 'top' },
    formRow: { flexDirection: 'row', gap: Space.md },

    previewWrap: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Space.sm },
    previewImage: { width: '100%', height: 160, borderRadius: Radius.md },
});
