import React, { useMemo, useState } from 'react';
import {
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
import { SHIPMENTS, SUMMARY } from '../data/shipments';
import { RootStackParamList, Shipment, ShipmentStatus } from '../types';
import { AlertBanner, CostBar, Eyebrow, FreightRail, PrimaryButton, StatusBadge } from '../components';

type FilterKey = ShipmentStatus | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'transit', label: 'Transit' },
  { key: 'customs', label: 'Customs' },
  { key: 'port', label: 'Port' },
  { key: 'delivered', label: 'Delivered' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface SummaryCardProps {
  icon: string;
  val: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function SummaryCard({ icon, val, label, color, colors }: SummaryCardProps) {
  return (
      <View style={[s.summaryCard, { flex: 1, backgroundColor: colors.card }]}>
        <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
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
              {ship.alert && <Text style={{ fontSize: 13, marginLeft: 2 }}>{ship.alert.type === 'warning' ? '👀' : '✨'}</Text>}
            </View>
            <Text style={[s.shipDesc, { color: colors.text }]}>{ship.description}</Text>
            <Text style={[s.shipMeta, { color: colors.muted }]}>
              {ship.origin} → Tema, GH  ·  {ship.carrier}  ·  {ship.weight}
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
  const { colors } = useAppTheme();

  const visible = useMemo(
      () =>
          SHIPMENTS.filter((ship) => {
            const matchesFilter = filter === 'all' || ship.status === filter;
            const matchesSearch =
                !search ||
                ship.description.toLowerCase().includes(search.toLowerCase()) ||
                ship.id.toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
          }),
      [filter, search]
  );

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.headerRow}>
            <View>
              <Text style={[s.greeting, { color: colors.navy }]}>{greeting()} 👋</Text>
              <Text style={[s.pageTitle, { color: colors.text }]}>Your shipments</Text>
            </View>
            <TouchableOpacity
                style={[s.addBtn, { backgroundColor: colors.navy }]}
                onPress={() => navigation.navigate('AddShipment')}
                activeOpacity={0.85}
            >
              <Text style={s.addBtnText}>＋ Add</Text>
            </TouchableOpacity>
          </View>

          <View style={s.summaryRow}>
            <SummaryCard icon="📦" val={SUMMARY.active} label="On the way" color={colors.cobalt} colors={colors} />
            <SummaryCard icon="👀" val={SUMMARY.alerts} label="Need attention" color={colors.skyBlue} colors={colors} />
            <SummaryCard icon="🎉" val={SUMMARY.cleared} label="Cleared" color={colors.green} colors={colors} />
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.card, marginBottom: Space.lg }]}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>💸</Text>
            <Text style={[s.summaryVal, { color: colors.navy }]}>{SUMMARY.totalCosts}</Text>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Total landed cost so far</Text>
          </View>

          <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by ID or description…"
              placeholderTextColor={colors.caption}
              style={[s.searchInput, { backgroundColor: colors.card, color: colors.text }]}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Space.md }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: Space.md }}>
              {FILTERS.map((f) => (
                  <TouchableOpacity
                      key={f.key}
                      onPress={() => setFilter(f.key)}
                      style={[s.chip, { backgroundColor: filter === f.key ? colors.cobaltDim : colors.surfaceAlt }]}
                      activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, { color: filter === f.key ? colors.cobalt : colors.muted }]}>{f.label}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {visible.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🌤️</Text>
                <Text style={[s.emptyText, { color: colors.muted }]}>Nothing here yet — try a different filter or search.</Text>
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
  greeting: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginTop: 4 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.pill },
  addBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  summaryRow: { flexDirection: 'row', gap: Space.sm, marginBottom: Space.sm },
  summaryCard: { borderRadius: Radius.md, padding: Space.md, ...CardShadow },
  summaryVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  summaryLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  searchInput: {
    borderRadius: Radius.pill,
    paddingHorizontal: Space.md,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.sm,
    marginBottom: Space.sm,
    ...CardShadow,
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
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
});