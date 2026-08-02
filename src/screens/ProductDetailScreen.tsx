import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList } from '../types';
import { Eyebrow } from '../components';
import { SearchIcon, PhoneIcon, ChevronLeftIcon, StarIcon, CheckBadgeIcon } from '../components/Icons';
import { getProductById, fetchReviewsByProduct } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

interface Review {
  id: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { productId, productName: initialName } = route.params;
  const { colors } = useAppTheme();

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prod, revs] = await Promise.all([
          getProductById(productId),
          fetchReviewsByProduct(productId).catch(() => []),
        ]);
        if (!cancelled) {
          setProduct(prod);
          setReviews(Array.isArray(revs) ? revs : []);
        }
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: colors.muted }]}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const productName = product.name ?? initialName ?? 'Product';
  const productPrice = product.price ?? 0;
  const productDescription = product.description ?? '';
  const productImage = product.imageUrl ?? '';
  const supplierName = product.supplier?.name ?? '';
  const supplierPhone = product.supplier?.phone ?? '';
  const supplierEmail = product.supplier?.email ?? '';

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        size={14}
        color={i < rating ? colors.green : colors.caption}
        filled={i < rating}
      />
    ));
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={s.headerRow}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ChevronLeftIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {productName}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Image */}
        {productImage ? (
          <Image source={{ uri: productImage }} style={s.productImage} resizeMode="cover" />
        ) : (
          <View style={[s.productImage, s.imagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
            <SearchIcon size={48} color={colors.caption} strokeWidth={1.2} />
          </View>
        )}

        {/* Product Info */}
        <View style={[s.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[s.productName, { color: colors.text }]}>{productName}</Text>
          <Text style={[s.productPrice, { color: colors.green }]}>
            GHS {Number(productPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>

          {productDescription ? (
            <>
              <Eyebrow color={colors.navy}>Description</Eyebrow>
              <Text style={[s.description, { color: colors.textSoft }]}>{productDescription}</Text>
            </>
          ) : null}
        </View>

        {/* Supplier Card */}
        {(supplierName || product?.supplier) && (
          <TouchableOpacity
            style={[s.supplierCard, { backgroundColor: colors.card }]}
            activeOpacity={0.85}
            onPress={() => {
              const supplierId = product?.supplier?.id;
              if (supplierId) {
                navigation.navigate('PublicSupplier', { supplierId });
              }
            }}
          >
            <View style={s.supplierCardHeader}>
              <View style={[s.supplierAvatar, { backgroundColor: colors.navyDim }]}>
                <Text style={[s.supplierAvatarText, { color: colors.navy }]}>
                  {(supplierName || 'S').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.supplierName, { color: colors.text }]}>{supplierName}</Text>
                {product?.supplier?.shippingOrigin && (
                  <Text style={[s.supplierOrigin, { color: colors.muted }]}>
                    {product.supplier.shippingOrigin}
                  </Text>
                )}
                {product?.supplier?.subscriptionTier === 'PAID' && (
                  <View style={s.verifiedRow}>
                    <CheckBadgeIcon size={12} color={colors.green} />
                    <Text style={[s.verifiedText, { color: colors.green }]}>Verified Supplier</Text>
                  </View>
                )}
              </View>
              <Text style={[s.viewSupplierArrow, { color: colors.cobalt }]}>{'>'}</Text>
            </View>
            <View style={s.supplierCardFooter}>
              <Text style={[s.viewSupplierLabel, { color: colors.cobalt }]}>View Supplier Profile</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Reviews */}
        <View style={[s.infoCard, { backgroundColor: colors.card }]}>
          <Eyebrow color={colors.navy}>Reviews</Eyebrow>
          {reviews.length === 0 ? (
            <Text style={[s.noReviews, { color: colors.muted }]}>No reviews yet</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={[s.reviewItem, { borderBottomColor: colors.border }]}>
                <View style={s.reviewHeader}>
                  <Text style={[s.reviewAuthor, { color: colors.text }]}>{rev.authorName}</Text>
                  <View style={s.starsRow}>{renderStars(rev.rating)}</View>
                </View>
                {rev.comment ? (
                  <Text style={[s.reviewComment, { color: colors.textSoft }]}>{rev.comment}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[s.orderButton, { backgroundColor: getToken() ? colors.cobalt : colors.muted }]}
          onPress={() => {
            if (!getToken()) {
              Alert.alert('Login required', 'Please log in to place an order.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log in', onPress: () => navigation.navigate('Login') },
              ]);
              return;
            }
            navigation.navigate('PlaceOrder', {
              productId,
              productName,
              productPrice,
              imageUrl: productImage,
              supplierName,
            });
          }}
          activeOpacity={0.9}
        >
          <Text style={s.orderButtonText}>{getToken() ? 'Place Order' : 'Log in to order'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, flex: 1, textAlign: 'center' },

  productImage: { width: '100%', height: 260 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  infoCard: {
    marginHorizontal: Space.lg,
    marginTop: Space.md,
    borderRadius: Radius.lg,
    padding: Space.md,
    ...CardShadow,
  },

  productName: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginBottom: 4 },
  productPrice: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl, marginBottom: Space.md },

  description: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 20, marginTop: Space.sm },

  supplierCard: {
    marginHorizontal: Space.lg, marginTop: Space.md, borderRadius: Radius.lg,
    padding: Space.md, ...CardShadow,
  },
  supplierCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  supplierAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  supplierAvatarText: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  supplierName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 2 },
  supplierOrigin: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  verifiedText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
  viewSupplierArrow: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg },
  supplierCardFooter: { borderTopWidth: 0.5, borderTopColor: '#E0E0E0', marginTop: Space.sm, paddingTop: Space.sm, alignItems: 'center' },
  viewSupplierLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  contactText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

  noReviews: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: Space.sm },

  reviewItem: { paddingTop: Space.sm, paddingBottom: Space.sm, borderBottomWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 18 },

  orderButton: {
    marginHorizontal: Space.lg,
    marginTop: Space.lg,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.md },
});
