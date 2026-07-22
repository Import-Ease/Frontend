import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList } from '../types';
import { Eyebrow, PrimaryButton } from '../components';
import { ChevronLeftIcon, SearchIcon, InfoIcon } from '../components/Icons';
import { createOrder } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlaceOrder'>;
type Route = RouteProp<RootStackParamList, 'PlaceOrder'>;

const SHIPPING_MODES = [
  { key: 'AIR', label: 'Air Freight' },
  { key: 'SEA', label: 'Sea Freight' },
];

export default function PlaceOrderScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { productId, productName, productPrice, imageUrl, supplierName } = route.params;
  const { colors } = useAppTheme();

  const [shippingMode, setShippingMode] = useState('AIR');
  const [destination, setDestination] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

  const handleSubmit = async () => {
    const token = getToken();
    if (!token) {
      Alert.alert('Not logged in', 'Please sign in to place an order.');
      return;
    }

    if (!destination.trim()) {
      Alert.alert('Missing destination', 'Please enter a shipping destination.');
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      Alert.alert('Invalid quantity', 'Please enter a quantity of at least 1.');
      return;
    }

    try {
      setSubmitting(true);
      await createOrder(
        {
          productId: Number(productId),
          shippingMode,
          destination: destination.trim(),
          quantity: qty,
        },
        token,
      );

      Alert.alert(
        'Order placed',
        'Your order has been created. You can pay for it later from your Shipments list.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert('Order failed', error?.message || 'Unable to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ChevronLeftIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>Place Order</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Summary */}
        <View style={[s.productCard, { backgroundColor: colors.card }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={s.productThumb} resizeMode="cover" />
          ) : (
            <View style={[s.productThumb, s.thumbPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
              <SearchIcon size={20} color={colors.caption} />
            </View>
          )}
          <View style={s.productInfo}>
            <Text style={[s.productName, { color: colors.text }]} numberOfLines={1}>
              {productName}
            </Text>
            <Text style={[s.productPrice, { color: colors.green }]}>
              GHS {Number(productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            {supplierName ? (
              <Text style={[s.supplierText, { color: colors.muted }]} numberOfLines={1}>
                {supplierName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Form */}
        <View style={[s.formCard, { backgroundColor: colors.card }]}>
          <Eyebrow color={colors.navy}>Shipping Mode</Eyebrow>
          <View style={s.modeRow}>
            {SHIPPING_MODES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  s.modeBtn,
                  {
                    backgroundColor: shippingMode === m.key ? colors.cobalt : colors.surfaceAlt,
                    borderColor: shippingMode === m.key ? colors.cobalt : colors.border,
                  },
                ]}
                onPress={() => setShippingMode(m.key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    s.modeBtnText,
                    { color: shippingMode === m.key ? '#FFFFFF' : colors.muted },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: Space.md }}>
            <Eyebrow color={colors.navy}>Destination</Eyebrow>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Tema, Ghana"
              placeholderTextColor={colors.caption}
              style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
            />
          </View>

          <View style={{ marginTop: Space.md }}>
            <Eyebrow color={colors.navy}>Quantity</Eyebrow>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="number-pad"
              placeholderTextColor={colors.caption}
              style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
            />
          </View>
        </View>

        {/* Payment note */}
        <View style={[s.noteCard, { backgroundColor: colors.greenDim }]}>
          <View style={s.noteIconWrap}>
            <InfoIcon size={16} color={colors.green} />
          </View>
          <Text style={[s.noteText, { color: colors.textSoft }]}>
            Payment happens later from your Shipments list. No payment required now.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitButton, { backgroundColor: colors.green }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={s.submitButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, flex: 1, textAlign: 'center' },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Space.lg,
    marginTop: Space.md,
    borderRadius: Radius.lg,
    padding: Space.md,
    gap: Space.md,
    ...CardShadow,
  },
  productThumb: { width: 72, height: 72, borderRadius: Radius.sm },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 2 },
  productPrice: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginBottom: 2 },
  supplierText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },

  formCard: {
    marginHorizontal: Space.lg,
    marginTop: Space.md,
    borderRadius: Radius.lg,
    padding: Space.md,
    ...CardShadow,
  },

  modeRow: { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  modeBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.base,
    marginTop: Space.sm,
  },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Space.lg,
    marginTop: Space.md,
    borderRadius: Radius.sm,
    padding: Space.md,
    gap: Space.sm,
  },
  noteIconWrap: { marginTop: 1 },
  noteText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, flex: 1, lineHeight: 19 },

  submitButton: {
    marginHorizontal: Space.lg,
    marginTop: Space.lg,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.md },
});
