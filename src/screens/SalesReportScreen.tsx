import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { ArrowLeftIcon, DollarSignIcon, PackageIcon, CheckCircleIcon, ClockIcon, BarChartIcon } from '../components/Icons';
import { fetchSupplierDashboard } from '../services/api';

export default function SalesReportScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [dd, setDd] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;
    if (!token) { setLoading(false); return; }
    try {
      const data = await fetchSupplierDashboard(token);
      setDd(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load report.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revenue = Number(dd?.revenue ?? 0);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: Space.sm }} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Sales Report</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error && !dd ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg }}>
          <Text style={[s.emptyText, { color: colors.muted }]}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.cobaltDim, marginTop: Space.md }]} onPress={() => { setLoading(true); load(); }} activeOpacity={0.8}>
            <Text style={[s.retryText, { color: colors.cobalt }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.revenueCard, { backgroundColor: colors.card, borderLeftColor: colors.orange }]}>
            <DollarSignIcon size={24} color={colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={[s.revenueLabel, { color: colors.muted }]}>Total Revenue</Text>
              <Text style={[s.revenueVal, { color: colors.orange }]}>
                GHS {revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <PackageIcon size={18} color={colors.cobalt} />
              <Text style={[s.statVal, { color: colors.cobalt }]}>{dd?.activeShipments ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Active</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <ClockIcon size={18} color={colors.orange} />
              <Text style={[s.statVal, { color: colors.orange }]}>{dd?.pendingOrders ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Pending</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: colors.card }]}>
              <CheckCircleIcon size={18} color={colors.green} />
              <Text style={[s.statVal, { color: colors.green }]}>{dd?.completedDeliveries ?? 0}</Text>
              <Text style={[s.statLabel, { color: colors.muted }]}>Completed</Text>
            </View>
          </View>

          <View style={[s.section, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
            {dd?.recentOrders?.length ? (
              dd.recentOrders.map((o: any, i: number) => (
                <View key={o.id || i} style={[s.orderRow, i < dd.recentOrders.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.orderId, { color: colors.text }]} numberOfLines={1}>{o.trackingId || o.id}</Text>
                    <Text style={[s.orderDesc, { color: colors.muted }]} numberOfLines={1}>{o.description || '—'}</Text>
                  </View>
                  <Text style={[s.orderStatus, { color: colors.cobalt }]}>{o.status ?? '—'}</Text>
                </View>
              ))
            ) : (
              <View style={s.emptyCard}>
                <BarChartIcon size={28} color={colors.caption} />
                <Text style={[s.emptyText, { color: colors.muted }]}>No orders to report yet</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={[s.disabledBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => Alert.alert('Export', 'Download reports is coming soon.')} activeOpacity={0.8}>
            <Text style={[s.disabledText, { color: colors.muted }]}>Download report (coming soon)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.sm, paddingVertical: Space.sm, borderBottomWidth: 0.5 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  scroll: { padding: Space.lg, paddingBottom: 60 },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center', marginTop: Space.sm },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.pill },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  revenueCard: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.md, borderLeftWidth: 3, ...CardShadow },
  revenueLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3, textTransform: 'uppercase' },
  revenueVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: Space.sm, marginBottom: Space.md },
  statCard: { flex: 1, borderRadius: Radius.md, padding: Space.sm, alignItems: 'center', ...CardShadow },
  statVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginTop: 4 },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  section: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.sm },
  orderId: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  orderDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },
  orderStatus: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

  emptyCard: { alignItems: 'center', paddingVertical: 30 },
  emptyCardText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

  disabledBtn: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  disabledText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});