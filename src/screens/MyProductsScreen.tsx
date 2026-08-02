import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import {
  PlusIcon, PackageIcon, SearchIcon, CheckCircleIcon, AlertTriangleIcon,
  DollarSignIcon, ClockIcon,
} from '../components/Icons';
import {
  fetchMyProducts, createProduct, updateProduct, deleteProduct,
  fetchMyProductCount, initiateSubscriptionUpgrade, fetchSupplierDashboard,
} from '../services/api';
import { pickAndUploadImage } from '../services/cloudinary';

type FormData = {
  productName: string;
  description: string;
  productPrice: string;
  quantity: string;
  imageUrl: string;
};
const EMPTY_FORM: FormData = {
  productName: '', description: '', productPrice: '', quantity: '', imageUrl: '',
};

type FieldErrors = { productName?: string; productPrice?: string };

function StatCard({ icon, val, label, color, colors }: {
  icon: React.ReactNode; val: string | number; label: string;
  color: string; colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={[st.statCard, { backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: color }]}>
      <View style={[st.statIconWrap, { backgroundColor: color + '18' }]}>{icon}</View>
      <Text style={[st.statVal, { color }]}>{val}</Text>
      <Text style={[st.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function MyProductsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [tierInfo, setTierInfo] = useState<{ productCount: number; subscriptionTier: string; paidUntil: string | null } | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

  const loadProducts = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const data = await fetchMyProducts(token);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products');
      setProducts([]);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const dd = await fetchSupplierDashboard(token);
      setDashboard(dd);
    } catch {}
  }, []);

  const handleRetry = useCallback(async () => {
    setError(null); setLoading(true);
    await Promise.all([loadProducts(), loadDashboard()]);
    setLoading(false);
  }, [loadProducts, loadDashboard]);

  const loadTierInfo = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try { const info = await fetchMyProductCount(token); setTierInfo(info); } catch {}
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setLoading(true);
      Promise.all([loadProducts(), loadDashboard(), loadTierInfo()]).finally(() => setLoading(false));
    });
    return unsub;
  }, [navigation, loadProducts, loadDashboard, loadTierInfo]);

  const openAddForm = () => {
    setEditingId(null); setForm(EMPTY_FORM); setFieldErrors({}); setSavedSuccess(false); setFormVisible(true);
  };
  const openEditForm = (product: Product) => {
    setEditingId(product.id); setFieldErrors({}); setSavedSuccess(false);
    setForm({
      productName: product.productName || '',
      description: product.description || '',
      productPrice: String(product.productPrice ?? ''),
      quantity: String(product.quantity ?? ''),
      imageUrl: product.imageUrl || '',
    });
    setFormVisible(true);
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.productName.trim()) errs.productName = 'Product name is required';
    if (!form.productPrice || isNaN(Number(form.productPrice)) || Number(form.productPrice) <= 0) {
      errs.productPrice = 'Enter a valid price greater than 0';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const token = getToken();
    if (!token) { Alert.alert('Not logged in', 'Please sign in again.'); return; }
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
      setSavedSuccess(true);
      setTimeout(() => { setFormVisible(false); loadProducts(); loadDashboard(); }, 800);
    } catch (error: any) {
      const msg = error?.message || 'Failed to save product.';
      if (msg.includes('Free tier limited to 5 products')) {
        Alert.alert('Free plan limit reached', "You've reached your free plan limit. Upgrade to add more products.", [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleUpgrade },
        ]);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Delete product', `Are you sure you want to delete "${product.productName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const token = getToken();
          if (!token) return;
          try {
            await deleteProduct(product.id, token);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
            loadDashboard();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete product.');
          }
        },
      },
    ]);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleUpgrade = async () => {
    const token = getToken();
    if (!token) { Alert.alert('Not logged in', 'Please sign in again.'); return; }
    setUpgrading(true);
    try {
      const result = await initiateSubscriptionUpgrade(token);
      if (result.authorizationUrl) Linking.openURL(result.authorizationUrl);
    } catch (error: any) {
      Alert.alert('Upgrade failed', error?.message || 'Could not start upgrade.');
    } finally { setUpgrading(false); }
  };

  const isFreeTier = tierInfo?.subscriptionTier === 'FREE' || !tierInfo;
  const isAtLimit = isFreeTier && products.length >= 5;
  const dd = dashboard;

  const recentOrders = useMemo(() => {
    if (!dd?.recentOrders) return [];
    return dd.recentOrders as any[];
  }, [dd]);

  const renderItem = ({ item }: { item: Product }) => (
    <View style={[st.card, { backgroundColor: colors.card }]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={st.cardImage} resizeMode="cover" />
      ) : (
        <View style={[st.cardImage, st.cardImagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
          <PackageIcon size={28} color={colors.caption} />
        </View>
      )}
      <View style={st.cardBody}>
        <View style={st.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[st.cardName, { color: colors.text }]} numberOfLines={1}>{item.productName}</Text>
            <Text style={[st.cardPrice, { color: colors.green }]}>
              GHS {Number(item.productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          {item.quantity != null && (
            <View style={[st.qtyBadge, { backgroundColor: colors.navyDim }]}>
              <Text style={[st.qtyText, { color: colors.navy }]}>Qty: {item.quantity}</Text>
            </View>
          )}
        </View>
        {item.description ? (
          <Text style={[st.cardDesc, { color: colors.muted }]} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={st.cardActions}>
          <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.cobaltDim }]} onPress={() => openEditForm(item)} activeOpacity={0.8}>
            <Text style={[st.actionText, { color: colors.cobalt }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.actionBtn, { backgroundColor: 'rgba(220,50,50,0.10)' }]} onPress={() => handleDelete(item)} activeOpacity={0.8}>
            <Text style={[st.actionText, { color: '#DC3232' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={st.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[st.pageTitle, { color: colors.text }]}>Dashboard</Text>
            <Text style={[st.subtitle, { color: colors.muted }]}>
              {tierInfo
                ? isFreeTier
                  ? `${products.length} / 5 products · FREE`
                  : `Unlimited products · PAID${tierInfo.paidUntil ? ` (renews ${new Date(tierInfo.paidUntil).toLocaleDateString()})` : ''}`
                : 'Supplier overview'}
            </Text>
          </View>
        </View>

        {/* Upgrade banner */}
        {isAtLimit && (
          <TouchableOpacity style={[st.upgradeBanner, { backgroundColor: colors.cobaltDim }]} onPress={handleUpgrade} disabled={upgrading} activeOpacity={0.85}>
            <Text style={[st.upgradeBannerText, { color: colors.cobalt }]}>
              {upgrading ? 'Starting upgrade...' : 'Upgrade to PAID - $4/month for unlimited products'}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={st.centered}>
            <ActivityIndicator size="large" color={colors.navy} />
          </View>
        ) : error && !dd ? (
          <View style={st.centered}>
            <Text style={[st.emptyDesc, { color: colors.muted }]}>{error}</Text>
            <TouchableOpacity style={[st.retryBtn, { backgroundColor: colors.cobaltDim, marginTop: Space.md }]} onPress={handleRetry} activeOpacity={0.8}>
              <Text style={[st.retryBtnText, { color: colors.cobalt }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats cards */}
            {dd && (
              <View style={st.statsRow}>
                <StatCard icon={<PackageIcon size={18} color={colors.cobalt} />} val={dd.activeShipments ?? 0} label="Active" color={colors.cobalt} colors={colors} />
                <StatCard icon={<ClockIcon size={18} color={colors.orange} />} val={dd.pendingOrders ?? 0} label="Pending" color={colors.orange} colors={colors} />
                <StatCard icon={<CheckCircleIcon size={18} color={colors.green} />} val={dd.completedDeliveries ?? 0} label="Completed" color={colors.green} colors={colors} />
              </View>
            )}
            {dd && (
              <View style={[st.revenueCard, { backgroundColor: colors.card, borderLeftColor: colors.orange }]}>
                <DollarSignIcon size={20} color={colors.orange} />
                <View style={{ flex: 1 }}>
                  <Text style={[st.revenueLabel, { color: colors.muted }]}>Revenue</Text>
                  <Text style={[st.revenueVal, { color: colors.orange }]}>
                    GHS {(dd.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            )}

            {/* Product count chip */}
            <View style={[st.countChip, { backgroundColor: colors.surfaceAlt }]}>
              <PackageIcon size={16} color={colors.muted} />
              <Text style={[st.countChipText, { color: colors.muted }]}>
                {products.length} product{products.length !== 1 ? 's' : ''} listed
              </Text>
            </View>

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <View style={[st.sectionCard, { backgroundColor: colors.card }]}>
                <Text style={[st.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
                {recentOrders.map((order: any, idx: number) => (
                  <View key={order.id || idx} style={[st.orderRow, idx < recentOrders.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.orderId, { color: colors.text }]} numberOfLines={1}>{order.trackingId || order.id}</Text>
                      <Text style={[st.orderDesc, { color: colors.muted }]} numberOfLines={1}>{order.description}</Text>
                    </View>
                    <Text style={[st.orderStatus, { color: colors.cobalt }]}>{order.status}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Product list */}
            <View style={st.listHeader}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>My Products</Text>
            </View>
            {products.length === 0 ? (
              <View style={[st.emptyCard, { backgroundColor: colors.card }]}>
                <View style={[st.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <PackageIcon size={40} color={colors.caption} strokeWidth={1.2} />
                </View>
                <Text style={[st.emptyTitle, { color: colors.text }]}>No products yet</Text>
                <Text style={[st.emptyDesc, { color: colors.muted }]}>Tap the + button to list your first product</Text>
              </View>
            ) : (
              products.map((item) => (
                <View key={item.id} style={[st.card, { backgroundColor: colors.card }]}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={st.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[st.cardImage, st.cardImagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                      <PackageIcon size={28} color={colors.caption} />
                    </View>
                  )}
                  <View style={st.cardBody}>
                    <View style={st.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.cardName, { color: colors.text }]} numberOfLines={1}>{item.productName}</Text>
                        <Text style={[st.cardPrice, { color: colors.green }]}>
                          GHS {Number(item.productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                      {item.quantity != null && (
                        <View style={[st.qtyBadge, { backgroundColor: colors.navyDim }]}>
                          <Text style={[st.qtyText, { color: colors.navy }]}>Qty: {item.quantity}</Text>
                        </View>
                      )}
                    </View>
                    {item.description ? (
                      <Text style={[st.cardDesc, { color: colors.muted }]} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <View style={st.cardActions}>
                      <TouchableOpacity style={[st.actionBtn, { backgroundColor: colors.cobaltDim }]} onPress={() => openEditForm(item)} activeOpacity={0.8}>
                        <Text style={[st.actionText, { color: colors.cobalt }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[st.actionBtn, { backgroundColor: 'rgba(220,50,50,0.10)' }]} onPress={() => handleDelete(item)} activeOpacity={0.8}>
                        <Text style={[st.actionText, { color: '#DC3232' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB - Add Product */}
      <TouchableOpacity
        style={[st.fab, { backgroundColor: isAtLimit ? colors.muted : colors.cobalt }]}
        onPress={isAtLimit ? handleUpgrade : openAddForm}
        disabled={saving || upgrading}
        activeOpacity={0.85}
      >
        <PlusIcon size={22} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={st.modalHeader}>
              <TouchableOpacity onPress={() => setFormVisible(false)} style={st.cancelBtn} activeOpacity={0.7}>
                <Text style={[st.cancelText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[st.modalTitle, { color: colors.text }]}>
                {editingId ? 'Edit Product' : 'Add Product'}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={saving || savedSuccess} style={st.saveBtn} activeOpacity={0.7}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.cobalt} />
                ) : (
                  <Text style={[st.saveText, { color: savedSuccess ? colors.green : colors.cobalt }]}>
                    {savedSuccess ? 'Saved!' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={st.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Saved confirmation */}
              {savedSuccess && (
                <View style={[st.successBanner, { backgroundColor: colors.greenDim }]}>
                  <CheckCircleIcon size={16} color={colors.green} />
                  <Text style={[st.successText, { color: colors.green }]}>Product added successfully!</Text>
                </View>
              )}

              {/* Product name */}
              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.muted }]}>Product name *</Text>
                <TextInput
                  value={form.productName}
                  onChangeText={(v) => updateField('productName', v)}
                  placeholder="e.g. Premium Cocoa Beans"
                  placeholderTextColor={colors.caption}
                  style={[st.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }, fieldErrors.productName && { borderWidth: 1, borderColor: '#DC3232' }]}
                />
                {fieldErrors.productName && (
                  <Text style={[st.fieldError, { color: '#DC3232' }]}>{fieldErrors.productName}</Text>
                )}
              </View>

              {/* Description */}
              <View style={st.formGroup}>
                <View style={st.labelRow}>
                  <Text style={[st.formLabel, { color: colors.muted }]}>Description</Text>
                  <Text style={[st.charCount, { color: colors.caption }]}>{form.description.length}/500</Text>
                </View>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => { if (v.length <= 500) updateField('description', v); }}
                  placeholder="Brief description of the product"
                  placeholderTextColor={colors.caption}
                  multiline numberOfLines={3}
                  style={[st.formInput, st.formTextarea, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                />
              </View>

              {/* Price & Quantity */}
              <View style={st.formRow}>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.muted }]}>Price (GHS) *</Text>
                  <TextInput
                    value={form.productPrice}
                    onChangeText={(v) => updateField('productPrice', v)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.caption}
                    style={[st.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }, fieldErrors.productPrice && { borderWidth: 1, borderColor: '#DC3232' }]}
                  />
                  {fieldErrors.productPrice && (
                    <Text style={[st.fieldError, { color: '#DC3232' }]}>{fieldErrors.productPrice}</Text>
                  )}
                </View>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.muted }]}>Quantity</Text>
                  <TextInput
                    value={form.quantity}
                    onChangeText={(v) => updateField('quantity', v)}
                    placeholder="0"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.caption}
                    style={[st.formInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                  />
                </View>
              </View>

              {/* Image */}
              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.muted }]}>Product Image</Text>
                <TouchableOpacity
                  style={[st.imagePickerBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={async () => {
                    setUploadingImage(true);
                    const url = await pickAndUploadImage();
                    setUploadingImage(false);
                    if (url) updateField('imageUrl', url);
                  }}
                  disabled={uploadingImage}
                  activeOpacity={0.8}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.caption} />
                  ) : (
                    <SearchIcon size={22} color={colors.caption} />
                  )}
                  <Text style={[st.imagePickerText, { color: colors.caption }]}>
                    {uploadingImage ? 'Uploading...' : form.imageUrl ? 'Change Image' : 'Tap to select image'}
                  </Text>
                </TouchableOpacity>
              </View>

              {form.imageUrl ? (
                <View style={st.previewWrap}>
                  <Image source={{ uri: form.imageUrl }} style={st.previewImage} resizeMode="cover" />
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Space.lg, paddingBottom: 40 },

  headerRow: { marginBottom: Space.lg },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginBottom: 2 },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

  upgradeBanner: { borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: Space.md, marginBottom: Space.lg, alignItems: 'center' },
  upgradeBannerText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  centered: { alignItems: 'center', paddingTop: 60 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.pill },
  retryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: Space.sm, marginBottom: Space.sm },
  statCard: { flex: 1, borderRadius: Radius.md, padding: Space.sm, ...CardShadow },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: Space.xs },
  statVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },

  revenueCard: {
    flexDirection: 'row', alignItems: 'center', gap: Space.md,
    borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.md,
    borderLeftWidth: 3, ...CardShadow,
  },
  revenueLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3, textTransform: 'uppercase' },
  revenueVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginTop: 2 },

  countChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, marginBottom: Space.md },
  countChipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

  sectionCard: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.sm },

  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.sm },
  orderId: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  orderDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },
  orderStatus: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

  listHeader: { marginBottom: Space.sm },

  /* Empty */
  emptyCard: { alignItems: 'center', paddingVertical: 40, borderRadius: Radius.lg, ...CardShadow },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
  emptyDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center' },

  /* Product card */
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

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },

  /* Modal */
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.md, paddingVertical: Space.sm, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  cancelBtn: { padding: Space.sm },
  cancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  saveBtn: { padding: Space.sm },
  saveText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  modalScroll: { padding: Space.lg, paddingBottom: 60 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: Space.md, borderRadius: Radius.md, marginBottom: Space.md },
  successText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  formGroup: { marginBottom: Space.md },
  formLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 6, letterSpacing: 0.3 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  formInput: { borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
  formTextarea: { height: 80, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: Space.md },
  fieldError: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 4 },

  imagePickerBtn: { borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  previewWrap: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Space.sm },
  previewImage: { width: '100%', height: 160, borderRadius: Radius.md },
});
