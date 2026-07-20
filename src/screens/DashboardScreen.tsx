import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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

import { useAppTheme, FontSize, Radius, Space, CardShadow, useThemeMode } from '../theme';
import { RootStackParamList, Shipment, ShipmentStatus, ShipmentSummary, mapBackendShipment, computeSummary } from '../types';
import { AlertBanner, CostBar, Eyebrow, FreightRail, PrimaryButton, StatusBadge } from '../components';
import {
  PackageIcon, AlertTriangleIcon, CheckCircleIcon, DollarSignIcon,
  CreditCardIcon, MoonIcon, SunIcon, SearchIcon, PlusIcon, InfoIcon,
} from '../components/Icons';
import { fetchShipments, fetchTotalCost, initializePayment } from '../services/api';

type FilterKey = ShipmentStatus | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'transit', label: 'Transit' },
  { key: 'customs', label: 'Customs' },
  { key: 'port', label: 'Port' },
  { key: 'delivered', label: 'Delivered' },
];

function greeting(username?: string): string {
  const hour = new Date().getHours();
  let g: string;
  if (hour < 12) g = 'Good morning';
  else if (hour < 18) g = 'Good afternoon';
  else g = 'Good evening';
  return username ? `${g}, ${username}` : g;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  val: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function SummaryCard({ icon, val, label, color, colors }: SummaryCardProps) {
  return (
      <View style={[s.summaryCard, { flex: 1, backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: color }]}>
        <View style={[s.summaryIconWrap, { backgroundColor: color + '14' }]}>
          {icon}
        </View>
        <Text style={[s.summaryVal, { color }]}>{val}</Text>
        <Text style={[s.summaryLabel, { color: colors.muted }]}>{label}</Text>
      </View>
  );
}

interface ShipmentCardProps {
  ship: Shipment;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function ShipmentCard({ ship, colors }: ShipmentCardProps) {
  const [open, setOpen] = useState(false);
  return (
      <TouchableOpacity onPress={() => setOpen((v) => !v)} activeOpacity={0.9} style={[s.shipCard, { backgroundColor: colors.card }]}>
        <View style={s.shipTop}>
          <View style={{ flex: 1 }}>
            <View style={s.shipIdRow}>
              <Eyebrow color={colors.navy}>{ship.id}</Eyebrow>
              <StatusBadge status={ship.status} label={ship.statusLabel} />
              {ship.alert && (
                <View style={{ marginLeft: 2 }}>
                  {ship.alert.type === 'warning' ? (
                    <AlertTriangleIcon size={14} color={colors.green} />
                  ) : (
                    <InfoIcon size={14} color={colors.cobalt} />
                  )}
                </View>
              )}
            </View>
            <Text style={[s.shipDesc, { color: colors.text }]}>{ship.description}</Text>
            <Text style={[s.shipMeta, { color: colors.muted }]}>
              {ship.origin} → {ship.destination || 'Tema, GH'}  ·  {ship.carrier}  ·  {ship.weight}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: Space.sm }}>
            <Eyebrow color={colors.caption}>ETA</Eyebrow>
            <Text style={[s.shipEta, { color: colors.text }]}>{ship.eta}</Text>
            <Text style={[s.shipTime, { color: colors.caption }]}>{ship.lastUpdate}</Text>
          </View>
        </View>

        <FreightRail stageIndex={ship.stageIndex} status={ship.status} />

        {open && (
            <View>
              <AlertBanner alert={ship.alert} />
              <CostBar costs={ship.costs} />
              <View style={{ flexDirection: 'row', marginTop: Space.md, flexWrap: 'wrap' }}>
                <PrimaryButton label="Update status" color={colors.cobalt} />
                <PrimaryButton label="Documents" color={colors.green} />
                <PrimaryButton label="Share" ghost />
              </View>
            </View>
        )}
      </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [payAmount, setPayAmount] = useState('0.00');
  const [payCurrency, setPayCurrency] = useState('GHS');
  const [paying, setPaying] = useState(false);
  const { colors } = useAppTheme();
  const { mode, setMode } = useThemeMode();

  const [loading, setLoading] = useState(true);
  const [backendShipments, setBackendShipments] = useState<any[]>([]);
  const [summary, setSummary] = useState<ShipmentSummary>({ active: 0, alerts: 0, cleared: 0, totalCosts: 'GHS 0' });

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;
  const getUsername = () => (globalThis as any).__IMPORT_EASE_USERNAME__ as string | undefined;

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [shipments, costRes] = await Promise.all([
        fetchShipments(token),
        fetchTotalCost(token).catch(() => null),
      ]);
      setBackendShipments(shipments);
      setSummary(computeSummary(shipments, costRes?.totalLandedCost));
    } catch (err: any) {
      Alert.alert('Failed to load shipments', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const shipments: Shipment[] = useMemo(
      () => backendShipments.map(mapBackendShipment),
      [backendShipments],
  );

  const visible = useMemo(
      () =>
          shipments.filter((ship) => {
            const matchesFilter = filter === 'all' || ship.status === filter;
            const matchesSearch =
                !search ||
                ship.description.toLowerCase().includes(search.toLowerCase()) ||
                ship.id.toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
          }),
      [shipments, filter, search],
  );

  const handlePaySupplier = async () => {
    const token = getToken();
    const payerEmail = (globalThis as any).__IMPORT_EASE_EMAIL__ || 'importer@importease.com';

    if (!token) {
      Alert.alert('Not logged in', 'Please sign in before starting a payment.');
      return;
    }

    const amountValue = Number(payAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid positive amount.');
      return;
    }

    try {
      setPaying(true);
      const result = await initializePayment(
        {
          payerEmail,
          supplierName: 'ImportEase Supplier',
          amount: amountValue.toFixed(2),
          currency: payCurrency.toUpperCase(),
        },
        token,
      );

      if (result?.authorizationUrl) {
        await Linking.openURL(String(result.authorizationUrl));
        Alert.alert('Payment started', 'Complete the checkout in your browser to finish the payment.');
      } else {
        Alert.alert('Payment setup failed', 'The server did not return a checkout link.');
      }
    } catch (error: any) {
      Alert.alert('Payment failed', error?.message || 'Unable to start payment right now.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>Loading shipments…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greeting, { color: colors.muted }]}>{greeting(getUsername())}</Text>
              <Text style={[s.pageTitle, { color: colors.text }]}>Your shipments</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                  style={[s.iconBtn, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  activeOpacity={0.85}
              >
                {mode === 'dark' ? (
                  <SunIcon size={18} color={colors.cobalt} />
                ) : (
                  <MoonIcon size={18} color={colors.navy} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                  style={[s.addBtn, { backgroundColor: colors.cobalt }]}
                  onPress={() => navigation.navigate('AddShipment')}
                  activeOpacity={0.85}
              >
                <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.summaryRow}>
            <SummaryCard icon={<PackageIcon size={20} color={colors.cobalt} />} val={summary.active} label="On the way" color={colors.cobalt} colors={colors} />
            <SummaryCard icon={<AlertTriangleIcon size={20} color={colors.skyBlue} />} val={summary.alerts} label="Need attention" color={colors.skyBlue} colors={colors} />
            <SummaryCard icon={<CheckCircleIcon size={20} color={colors.green} />} val={summary.cleared} label="Cleared" color={colors.green} colors={colors} />
          </View>

          <View style={[s.costCard, { backgroundColor: colors.card }]}>
            <View style={[s.costIconWrap, { backgroundColor: colors.navyDim }]}>
              <DollarSignIcon size={20} color={colors.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.summaryLabel, { color: colors.muted }]}>Total landed cost</Text>
              <Text style={[s.summaryVal, { color: colors.navy }]}>{summary.totalCosts}</Text>
            </View>
          </View>

          <View style={[s.paymentCard, { backgroundColor: colors.card }]}>
            <View style={s.paymentHeader}>
              <View style={[s.paymentIconWrap, { backgroundColor: colors.greenDim }]}>
                <CreditCardIcon size={18} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.paymentTitle, { color: colors.text }]}>Pay supplier</Text>
                <Text style={[s.paymentSubtitle, { color: colors.muted }]}>Send payment directly from ImportEase</Text>
              </View>
            </View>
            <View style={s.paymentRow}>
              <TextInput
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.caption}
                style={[s.payInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
              />
              <TextInput
                value={payCurrency}
                onChangeText={setPayCurrency}
                placeholder="Currency"
                autoCapitalize="characters"
                placeholderTextColor={colors.caption}
                style={[s.payInputSmall, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
              />
            </View>
            <TouchableOpacity
              style={[s.payButton, { backgroundColor: colors.green }]}
              onPress={handlePaySupplier}
              disabled={paying}
              activeOpacity={0.9}
            >
              <Text style={s.payButtonText}>{paying ? 'Processing…' : 'Pay supplier'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.searchWrap, { backgroundColor: colors.card }]}>
            <SearchIcon size={16} color={colors.caption} />
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by ID or description…"
                placeholderTextColor={colors.caption}
                style={[s.searchInput, { color: colors.text }]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Space.md }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: Space.md }}>
              {FILTERS.map((f) => (
                  <TouchableOpacity
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      style={[s.chip, { backgroundColor: filter === f.key ? colors.cobalt : colors.surfaceAlt }]}
                      activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, { color: filter === f.key ? '#FFFFFF' : colors.muted }]}>{f.label}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {visible.length === 0 ? (
              <View style={s.empty}>
                <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <PackageIcon size={40} color={colors.caption} strokeWidth={1.2} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No shipments found</Text>
                <Text style={[s.emptyText, { color: colors.muted }]}>Try a different filter or search, or add a new shipment.</Text>
              </View>
          ) : (
              visible.map((ship) => <ShipmentCard key={ship.id} ship={ship} colors={colors} />)
          )}
        </ScrollView>
      </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Space.lg, paddingBottom: 100 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Space.lg },
  greeting: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginTop: 2 },

  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: Radius.pill },
  addBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  summaryRow: { flexDirection: 'row', gap: Space.sm, marginBottom: Space.sm },
  summaryCard: { borderRadius: Radius.md, padding: Space.md, ...CardShadow },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm },
  summaryVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  summaryLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  costCard: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  costIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  paymentCard: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginBottom: Space.md },
  paymentIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md },
  paymentSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: Space.sm },
  payInput: { flex: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 12, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
  payInputSmall: { width: 84, borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 12, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
  payButton: { borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center' },
  payButtonText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 12,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.sm,
    padding: 0,
  },

  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
  chipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

  shipCard: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  shipTop: { flexDirection: 'row', alignItems: 'flex-start' },
  shipIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' },
  shipDesc: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 3 },
  shipMeta: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  shipEta: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm, marginTop: 4 },
  shipTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, textAlign: 'center' },
});
