import React, { useEffect, useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme, FontSize, Radius, Space } from '../theme';
import { STAGES } from '../data/shipments';
import { ShipmentAlert, ShipmentCosts, ShipmentStatus } from '../types';

/* ── STATUS BADGE ─────────────────────────────────────── */
interface StatusBadgeProps {
  status: ShipmentStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const STATUS_MAP: Record<ShipmentStatus, { color: string; bg: string }> = {
    delivered: { color: colors.green, bg: colors.greenDim },
    customs:   { color: colors.skyBlue, bg: colors.skyBlueDim },
    port:      { color: colors.cobalt, bg: colors.cobaltDim },
    transit:   { color: colors.navy, bg: colors.navyDim },
    origin:    { color: colors.textSoft, bg: colors.surfaceAlt },
  };

  const tone = STATUS_MAP[status] ?? STATUS_MAP.origin;
  return (
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        <Text style={[styles.badgeText, { color: tone.color }]}>{label}</Text>
      </View>
  );
}

/* ── EYEBROW LABEL ────────────────────────────────────── */
interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
}

export function Eyebrow({ children, color, size = FontSize.xs }: EyebrowProps) {
  const { colors } = useAppTheme();
  return (
      <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: size, color: color ?? colors.muted, letterSpacing: 0.3 }}>
        {children}
      </Text>
  );
}

/* ── SECTION HEADER ───────────────────────────────────── */
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  const { colors } = useAppTheme();
  return (
      <View style={{ marginBottom: Space.lg }}>
        {eyebrow ? <Eyebrow color={colors.navy}>{eyebrow}</Eyebrow> : null}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSub, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
  );
}

/* ── FREIGHT PROGRESS RAIL ────────────────────────────── */
interface FreightRailProps {
  stageIndex: number;
  status: ShipmentStatus;
}

export function FreightRail({ stageIndex, status }: FreightRailProps) {
  const { colors } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'delivered') return;
    const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulseAnim]);

  const fillColor = status === 'delivered' ? colors.green : colors.cobalt;

  return (
      <View style={rail.wrap}>
        <View style={[rail.trackBg, { backgroundColor: colors.surfaceAlt }]} />
        <View style={[rail.trackFill, { width: `${(stageIndex / 4) * 100}%`, backgroundColor: fillColor }]} />
        <View style={rail.nodesRow}>
          {STAGES.map((stage, i) => {
            const done = i < stageIndex;
            const curr = i === stageIndex;
            return (
                <View key={stage} style={rail.nodeCol}>
                  <View
                      style={[
                        rail.nodeOuter,
                        { backgroundColor: colors.white, borderColor: colors.border },
                        (done || curr) && { borderColor: fillColor },
                      ]}
                  >
                    {done && <Text style={{ color: fillColor, fontSize: 9, fontWeight: '700' }}>✓</Text>}
                    {curr && <Animated.View style={[rail.nodeDot, { opacity: pulseAnim, backgroundColor: fillColor }]} />}
                  </View>
                  <Text
                      style={[
                        rail.nodeLabel,
                        { color: colors.caption },
                        done && { color: colors.textSoft },
                        curr && { color: fillColor },
                      ]}
                  >
                    {stage}
                  </Text>
                </View>
            );
          })}
        </View>
      </View>
  );
}

/* ── ALERT BANNER ─────────────────────────────────────── */
interface AlertBannerProps {
  alert: ShipmentAlert | null;
}

export function AlertBanner({ alert }: AlertBannerProps) {
  const { colors } = useAppTheme();
  if (!alert) return null;
  const isWarn = alert.type === 'warning';
  const tone = isWarn ? colors.green : colors.cobalt;
  const toneDim = isWarn ? colors.greenDim : colors.cobaltDim;
  return (
      <View style={[styles.alertBox, { backgroundColor: toneDim }]}>
        <Text style={{ fontSize: 15, marginRight: Space.sm }}>{isWarn ? '👀' : '✨'}</Text>
        <Text style={[styles.alertText, { color: colors.textSoft }]}>{alert.msg}</Text>
      </View>
  );
}

/* ── COST BAR ─────────────────────────────────────────── */
interface CostBarProps {
  costs: ShipmentCosts;
}

export function CostBar({ costs }: CostBarProps) {
  const { colors } = useAppTheme();
  const total = Object.values(costs).reduce((a, b) => a + b, 0);
  const rows = [
    { label: 'Shipping', val: costs.shipping, color: colors.cobalt },
    { label: 'Harbour',  val: costs.harbour,  color: colors.skyBlue },
    { label: 'Duties',   val: costs.duties,   color: colors.navy },
    { label: 'Transport',val: costs.transport, color: colors.green },
  ];
  return (
      <View style={{ marginTop: Space.md, paddingTop: Space.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={styles.costHeader}>
          <Eyebrow color={colors.muted}>Cost breakdown</Eyebrow>
          <Text style={[styles.costTotal, { color: colors.navy }]}>GHS {total.toLocaleString()}</Text>
        </View>
        <View style={[styles.costBarWrap, { backgroundColor: colors.surfaceAlt }]}>
          {rows.map((r) => (
              <View key={r.label} style={[styles.costBarSeg, { flex: r.val, backgroundColor: r.color }]} />
          ))}
        </View>
        <View style={styles.costLegend}>
          {rows.map((r) => (
              <View key={r.label} style={styles.costLegendItem}>
                <View style={[styles.costDot, { backgroundColor: r.color }]} />
                <Text style={[styles.costLegendLabel, { color: colors.muted }]}>{r.label} </Text>
                <Text style={[styles.costLegendVal, { color: colors.text }]}>GHS {r.val.toLocaleString()}</Text>
              </View>
          ))}
        </View>
      </View>
  );
}

/* ── PRIMARY BUTTON ───────────────────────────────────── */
interface PrimaryButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  color?: string;
  ghost?: boolean;
}

export function PrimaryButton({ label, onPress, color, ghost = false }: PrimaryButtonProps) {
  const { colors } = useAppTheme();
  return (
      <TouchableOpacity
          onPress={onPress}
          style={[styles.btn, { backgroundColor: ghost ? colors.surfaceAlt : (color ?? colors.cobalt) }]}
          activeOpacity={0.8}
      >
        <Text style={[styles.btnText, { color: ghost ? colors.textSoft : colors.white }]}>{label}</Text>
      </TouchableOpacity>
  );
}

/* ── STYLES ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl, marginTop: 4 },
  sectionSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 3 },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: Radius.md, padding: Space.md, marginTop: Space.sm },
  alertText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 19, flex: 1 },
  costHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.sm },
  costTotal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  costBarWrap: { flexDirection: 'row', height: 8, borderRadius: Radius.pill, overflow: 'hidden', marginBottom: Space.sm, gap: 2 },
  costBarSeg: { borderRadius: Radius.pill },
  costLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, rowGap: 6 },
  costLegendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 2 },
  costDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  costLegendLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  costLegendVal: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.pill, marginRight: Space.sm, marginBottom: Space.sm },
  btnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});

const rail = StyleSheet.create({
  wrap: { marginTop: Space.md, marginBottom: Space.xs },
  trackBg: { position: 'absolute', top: 9, left: 9, right: 9, height: 3, borderRadius: 2 },
  trackFill: { position: 'absolute', top: 9, left: 9, height: 3, borderRadius: 2 },
  nodesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  nodeCol: { flex: 1, alignItems: 'center', gap: 6 },
  nodeOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  nodeDot: { width: 8, height: 8, borderRadius: 4 },
  nodeLabel: { fontFamily: 'Nunito_700Bold', fontSize: 9, textAlign: 'center' },
});