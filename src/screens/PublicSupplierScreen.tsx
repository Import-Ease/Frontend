import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { PackageIcon, MailIcon, PhoneIcon, ChevronLeftIcon, StarIcon, CheckBadgeIcon } from '../components/Icons';
import { fetchPublicSupplierProfile, fetchSupplierProducts } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PublicSupplier'>;
type Route = RouteProp<RootStackParamList, 'PublicSupplier'>;

export default function PublicSupplierScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { supplierId } = route.params;
  const { colors } = useAppTheme();

  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prof, prods] = await Promise.all([
          fetchPublicSupplierProfile(supplierId),
          fetchSupplierProducts(supplierId).catch(() => []),
        ]);
        if (!cancelled) {
          setProfile(prof);
          setProducts(Array.isArray(prods) ? prods : []);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supplierId]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}><ActivityIndicator size="large" color={colors.navy} /></View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: colors.muted }]}>Supplier not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  const renderStars = (count: number) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={14} color={i < count ? colors.green : colors.caption} filled={i < count} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <ChevronLeftIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>Supplier Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Banner */}
        <View style={[s.banner, { backgroundColor: colors.navy }]}>
          {profile.logoUrl ? (
            <Image source={{ uri: profile.logoUrl }} style={s.logo} resizeMode="contain" />
          ) : (
            <View style={[s.logo, s.logoPlaceholder, { backgroundColor: colors.navyDim }]}>
              <Text style={[s.logoInitials, { color: colors.navy }]}>
                {(profile.name || 'S').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={s.bannerName}>{profile.name}</Text>
          {profile.verified && (
            <View style={s.verifiedBadge}>
              <CheckBadgeIcon size={14} color="#FFFFFF" />
              <Text style={s.verifiedText}>Verified Supplier</Text>
            </View>
          )}
          {profile.shippingOrigin && (
            <Text style={s.bannerLocation}>{profile.shippingOrigin}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <Text style={[s.statVal, { color: colors.cobalt }]}>{profile.productCount ?? 0}</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>Products</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <Text style={[s.statVal, { color: colors.green }]}>{profile.ordersCompleted ?? 0}</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>Completed</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.card }]}>
            <Text style={[s.statVal, { color: colors.orange }]}>{profile.totalOrders ?? 0}</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>Orders</Text>
          </View>
        </View>

        {/* Business info */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Business Information</Text>
          {profile.description ? (
            <Text style={[s.description, { color: colors.textSoft }]}>{profile.description}</Text>
          ) : null}
          {profile.category ? (
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.muted }]}>Category</Text>
              <Text style={[s.infoVal, { color: colors.text }]}>{profile.category}</Text>
            </View>
          ) : null}
          {profile.address ? (
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.muted }]}>Location</Text>
              <Text style={[s.infoVal, { color: colors.text }]}>{profile.address}</Text>
            </View>
          ) : null}
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: colors.muted }]}>Member since</Text>
            <Text style={[s.infoVal, { color: colors.text }]}>{memberSince}</Text>
          </View>
          {profile.email ? (
            <View style={s.contactRow}>
              <MailIcon size={14} color={colors.caption} />
              <Text style={[s.contactText, { color: colors.muted }]}>{profile.email}</Text>
            </View>
          ) : null}
          {profile.phone ? (
            <View style={s.contactRow}>
              <PhoneIcon size={14} color={colors.caption} />
              <Text style={[s.contactText, { color: colors.muted }]}>{profile.phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Products */}
        {products.length > 0 ? (
          <View style={[s.section, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Products ({products.length})</Text>
            {products.slice(0, 10).map((prod: any) => (
              <TouchableOpacity
                key={prod.id}
                style={[s.productRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('ProductDetail', {
                    productId: String(prod.id),
                    productName: prod.name || prod.productName,
                  })
                }
              >
                {prod.imageUrl ? (
                  <Image source={{ uri: prod.imageUrl }} style={s.productThumb} resizeMode="cover" />
                ) : (
                  <View style={[s.productThumb, s.productThumbPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                    <PackageIcon size={18} color={colors.caption} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.productName, { color: colors.text }]} numberOfLines={1}>{prod.name || prod.productName}</Text>
                  <Text style={[s.productPrice, { color: colors.green }]}>
                    GHS {Number(prod.price ?? prod.productPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {products.length > 10 && (
              <Text style={[s.moreText, { color: colors.muted }]}>+{products.length - 10} more products</Text>
            )}
          </View>
        ) : null}

        {/* Reviews placeholder */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Reviews</Text>
          <View style={s.reviewPlaceholder}>
            {renderStars(0)}
            <Text style={[s.noReviews, { color: colors.muted }]}>No reviews yet</Text>
          </View>
        </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.md, paddingVertical: Space.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, flex: 1, textAlign: 'center' },

  banner: {
    alignItems: 'center', paddingVertical: Space.xl, paddingHorizontal: Space.lg,
    marginHorizontal: Space.md, borderRadius: Radius.lg,
  },
  logo: { width: 80, height: 80, borderRadius: 40, marginBottom: Space.md },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  logoInitials: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl },
  bannerName: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl, color: '#FFFFFF', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  verifiedText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, color: '#FFFFFF' },
  bannerLocation: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },

  statsRow: { flexDirection: 'row', gap: Space.sm, marginHorizontal: Space.md, marginTop: Space.md },
  statCard: {
    flex: 1, borderRadius: Radius.md, padding: Space.sm, alignItems: 'center',
    ...CardShadow,
  },
  statVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  section: {
    marginHorizontal: Space.md, marginTop: Space.md, borderRadius: Radius.lg,
    padding: Space.md, ...CardShadow,
  },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.sm },

  description: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 20, marginBottom: Space.md },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  infoVal: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  contactText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: Space.sm,
    paddingVertical: Space.sm, borderBottomWidth: 0.5,
  },
  productThumb: { width: 48, height: 48, borderRadius: Radius.sm },
  productThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  productPrice: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm, marginTop: 1 },
  moreText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, textAlign: 'center', marginTop: Space.sm },

  reviewPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: Space.sm },
  noReviews: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
});
