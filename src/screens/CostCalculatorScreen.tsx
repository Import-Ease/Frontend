import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { Eyebrow } from '../components';
import { LightbulbIcon } from '../components/Icons';
import { calculateCost, CalculatorResult } from '../services/api';

const ORIGINS = ['China', 'India', 'Turkey', 'Europe', 'USA'] as const;
type Origin = (typeof ORIGINS)[number];

interface GoodsType {
  key: string;
  label: string;
  apiValue: string;
}

const GOODS_TYPES: GoodsType[] = [
  { key: 'general', label: 'General goods', apiValue: 'general goods' },
  { key: 'electronics', label: 'Electronics', apiValue: 'electronics' },
  { key: 'coldchain', label: 'Cold chain', apiValue: 'cold chain' },
  { key: 'textiles', label: 'Textiles', apiValue: 'general goods' },
  { key: 'machinery', label: 'Machinery', apiValue: 'general goods' },
];

type SelectOption = string | GoodsType;

interface SelectRowProps {
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (key: string) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function SelectRow({ label, options, value, onChange, colors }: SelectRowProps) {
  return (
      <View style={{ marginBottom: Space.md }}>
        <Eyebrow color={colors.muted}>{label}</Eyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {options.map((opt) => {
              const key = typeof opt === 'string' ? opt : opt.key;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              const active = value === key;
              return (
                  <TouchableOpacity
                      key={key}
                      onPress={() => onChange(key)}
                      style={[s.optChip, { backgroundColor: active ? colors.cobalt : colors.surfaceAlt, borderWidth: active ? 0 : 1, borderColor: colors.border }]}
                      activeOpacity={0.8}
                  >
                    <Text style={[s.optChipText, { color: active ? '#FFFFFF' : colors.muted }]}>{lbl}</Text>
                  </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
  );
}

interface CostLineProps {
  label: string;
  val: number;
  color?: string;
  isTotal?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function CostLine({ label, val, color, isTotal = false, colors }: CostLineProps) {
  return (
      <View style={[s.costLine, isTotal && s.costLineTotal, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {color && <View style={[s.colorDot, { backgroundColor: color }]} />}
          <Text style={[s.costLineLabel, { color: colors.muted }, isTotal && { color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base }]}>
            {label}
          </Text>
        </View>
        <Text style={[s.costLineVal, { color: isTotal ? colors.navy : colors.text }, isTotal && { fontSize: FontSize.lg, fontFamily: 'Poppins_700Bold' }]}>
          GHS {Math.round(val).toLocaleString()}
        </Text>
      </View>
  );
}

export default function CostCalculatorScreen() {
  const { colors } = useAppTheme();
  const [origin, setOrigin] = useState<Origin>('China');
  const [goodsType, setGoodsType] = useState('general');
  const [weight, setWeight] = useState('0');
  const [insurance, setInsurance] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const fetchCost = useCallback(async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      setResult(null);
      return;
    }
    const goods = GOODS_TYPES.find((g) => g.key === goodsType);
    setLoading(true);
    try {
      const res = await calculateCost({
        origin,
        goodsType: goods?.apiValue ?? 'general goods',
        weightKg: w,
        insurance,
      });
      setResult(res);
    } catch (err: any) {
      Alert.alert('Calculation failed', err?.message || 'Could not calculate cost. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [origin, goodsType, weight, insurance]);

  useEffect(() => {
    const timer = setTimeout(fetchCost, 500);
    return () => clearTimeout(timer);
  }, [fetchCost]);

  const shipping = result?.shipping ?? 0;
  const harbour = result?.harbour ?? 0;
  const duties = result?.duties ?? 0;
  const transport = result?.transport ?? 0;
  const ins = result?.insurance ?? 0;
  const total = result?.total ?? 0;

  const barItems = [
    { label: 'Shipping', val: shipping, color: colors.cobalt },
    { label: 'Harbour', val: harbour, color: colors.skyBlue },
    { label: 'Duties', val: duties, color: colors.navy },
    { label: 'Transport', val: transport, color: colors.green },
    ...(insurance ? [{ label: 'Insurance', val: ins, color: colors.muted }] : []),
  ];

  const goodsLabel = GOODS_TYPES.find((g) => g.key === goodsType)?.label ?? 'General goods';
  const dutyRatePct = duties > 0 && shipping > 0
    ? ((duties / shipping) * 100).toFixed(0)
    : '10';

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: Space.lg }}>
            <Eyebrow color={colors.navy}>Cost calculator</Eyebrow>
            <Text style={[s.pageTitle, { color: colors.text }]}>What will it cost?</Text>
            <Text style={[s.pageSub, { color: colors.muted }]}>A quick estimate before you commit to anything</Text>
          </View>

          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.cardTitle, { color: colors.text }]}>Tell us about the shipment</Text>
            <SelectRow label="Coming from" options={ORIGINS} value={origin} onChange={(v) => setOrigin(v as Origin)} colors={colors} />
            <SelectRow label="Type of goods" options={GOODS_TYPES} value={goodsType} onChange={setGoodsType} colors={colors} />

            <View style={{ marginBottom: Space.md }}>
              <Eyebrow color={colors.muted}>Weight (kg)</Eyebrow>
              <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholderTextColor={colors.caption}
                  placeholder="e.g. 1000"
                  style={[s.weightInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.switchLabel, { color: colors.text }]}>Add cargo insurance?</Text>
                <Text style={[s.switchSub, { color: colors.caption }]}>Adds about 2% of freight + duties</Text>
              </View>
              <Switch
                  value={insurance}
                  onValueChange={setInsurance}
                  trackColor={{ false: colors.border, true: colors.cobaltDim }}
                  thumbColor={insurance ? colors.cobalt : colors.muted}
              />
            </View>
          </View>

          <View style={[s.card, { backgroundColor: colors.card, marginTop: Space.sm }]}>
            <Text style={[s.cardTitle, { color: colors.text }]}>Here's the estimate</Text>

            {loading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.navy} />
                <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, color: colors.muted, marginTop: 8 }}>
                  Calculating…
                </Text>
              </View>
            ) : (
              <>
                <View style={[s.barWrap, { backgroundColor: colors.surfaceAlt }]}>
                  {barItems.map((b) => (
                      <View key={b.label} style={[s.barSeg, { flex: b.val || 0.1, backgroundColor: b.color }]} />
                  ))}
                </View>

                {barItems.map((b) => (
                    <CostLine key={b.label} label={b.label} val={b.val} color={b.color} colors={colors} />
                ))}

                <View style={[s.divider, { backgroundColor: colors.border }]} />
                <CostLine label="Total landed cost" val={total} isTotal colors={colors} />
              </>
            )}
          </View>

          <View style={[s.noteBox, { backgroundColor: colors.navyDim, borderLeftWidth: 3, borderLeftColor: colors.navy }]}>
            <View style={s.noteHeader}>
              <LightbulbIcon size={16} color={colors.navy} />
              <Text style={[s.noteHeaderText, { color: colors.navy }]}>Estimate only</Text>
            </View>
            <Text style={[s.noteText, { color: colors.textSoft }]}>
              The duty rate for <Text style={{ fontFamily: 'Nunito_700Bold', color: colors.text }}>{goodsLabel}</Text> from{' '}
              <Text style={{ fontFamily: 'Nunito_700Bold', color: colors.text }}>{origin}</Text> works out to about{' '}
              <Text style={{ fontFamily: 'Nunito_700Bold', color: colors.navy }}>{dutyRatePct}%</Text>. Double-check with GRA before you file.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Space.lg, paddingBottom: 100 },

  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginTop: 4 },
  pageSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 3 },

  card: { borderRadius: Radius.lg, padding: Space.md, ...CardShadow },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: Space.md },

  optChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.pill },
  optChipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  weightInput: {
    borderRadius: Radius.md,
    padding: Space.sm + 4,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.base,
    marginTop: 8,
  },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Space.sm },
  switchLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  switchSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  barWrap: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    gap: 2,
    marginBottom: Space.md,
  },
  barSeg: { borderRadius: Radius.pill },

  costLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  costLineTotal: { borderBottomWidth: 0, paddingTop: Space.sm },
  colorDot: { width: 9, height: 9, borderRadius: 5 },
  costLineLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
  costLineVal: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  divider: { height: 1, marginVertical: Space.sm },

  noteBox: { borderRadius: Radius.md, padding: Space.md, marginTop: Space.sm },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  noteHeaderText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
  noteText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, lineHeight: 19 },
});
