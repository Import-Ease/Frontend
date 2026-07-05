import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { SHIPMENTS } from '../data/shipments';
import { Eyebrow, PrimaryButton, StatusBadge } from '../components';

const ALERT_SHIPMENTS = SHIPMENTS.filter((s) => s.alert);

interface EngineStat {
  label: string;
  val: string;
}

const ENGINE_STATS: EngineStat[] = [
  { label: 'Checks every', val: '15 min' },
  { label: "We'll notify you within", val: '90 min' },
  { label: 'Watching for', val: '7 kinds of delays' },
  { label: 'Powered by', val: 'Smart rules' },
];

export default function AlertsScreen() {
  const { colors } = useAppTheme(); // ← added

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: Space.lg }}>
            <Eyebrow color={colors.navy}>Smart alerts</Eyebrow>
            <Text style={[s.pageTitle, { color: colors.text }]}>What needs you</Text>
            <Text style={[s.pageSub, { color: colors.muted }]}>We watch your shipments so you don't have to</Text>
          </View>

          {/* count banner */}
          <View style={[s.countBanner, { backgroundColor: colors.navyDim }]}>
            <Text style={[s.countNum, { color: colors.navy }]}>{ALERT_SHIPMENTS.length}</Text>
            <View>
              <Text style={[s.countLabel, { color: colors.text }]}>
                {ALERT_SHIPMENTS.length === 1 ? 'thing' : 'things'} need your attention
              </Text>
              <Text style={[s.countSub, { color: colors.textSoft }]}>Take a look when you get a chance</Text>
            </View>
          </View>

          {ALERT_SHIPMENTS.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
                <Text style={[s.emptyText, { color: colors.muted }]}>All clear — every shipment is on track.</Text>
              </View>
          ) : (
              ALERT_SHIPMENTS.map((ship) => {
                if (!ship.alert) return null;
                const isWarn = ship.alert.type === 'warning';
                const tone = isWarn ? colors.green : colors.cobalt;
                const toneDim = isWarn ? colors.greenDim : colors.cobaltDim;
                return (
                    <View key={ship.id} style={[s.alertCard, { backgroundColor: colors.card }]}>
                      <View style={s.alertTop}>
                        <View style={{ flex: 1 }}>
                          <View style={s.alertIdRow}>
                            <Text style={{ fontSize: 15 }}>{isWarn ? '👀' : '✨'}</Text>
                            <Eyebrow color={colors.navy}>{ship.id}</Eyebrow>
                          </View>
                          <Text style={[s.alertDesc, { color: colors.text }]}>{ship.description}</Text>
                          <StatusBadge status={ship.status} label={ship.statusLabel} />
                        </View>
                        <Text style={[s.alertTime, { color: colors.caption }]}>{ship.lastUpdate}</Text>
                      </View>

                      <View style={[s.alertMsgBox, { backgroundColor: toneDim }]}>
                        <Text style={[s.alertMsg, { color: colors.textSoft }]}>{ship.alert.msg}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', marginTop: Space.md }}>
                        <PrimaryButton label="Mark resolved" color={tone} />
                        <PrimaryButton label="View shipment" ghost />
                      </View>
                    </View>
                );
              })
          )}

          {/* engine status panel */}
          <View style={[s.enginePanel, { backgroundColor: colors.surfaceAlt }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Space.md }}>
              <Text style={{ fontSize: 16 }}>🛟</Text>
              <Text style={[s.engineTitle, { color: colors.textSoft }]}>How alerts work</Text>
              <View style={[s.engineOnline, { backgroundColor: colors.greenDim }]}>
                <Text style={[s.engineOnlineText, { color: colors.green }]}>Active</Text>
              </View>
            </View>
            <View style={s.engineGrid}>
              {ENGINE_STATS.map((r) => (
                  <View key={r.label} style={s.engineStat}>
                    <Eyebrow color={colors.muted}>{r.label}</Eyebrow>
                    <Text style={[s.engineStatVal, { color: colors.text }]}>{r.val}</Text>
                  </View>
              ))}
            </View>
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

  countBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.lg,
  },
  countNum: { fontFamily: 'Poppins_700Bold', fontSize: 42 },
  countLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md },
  countSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  alertCard: {
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  alertTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Space.sm },
  alertIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertDesc: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 6 },
  alertTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginLeft: Space.sm },
  alertMsgBox: { borderRadius: Radius.md, padding: Space.sm },
  alertMsg: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 19 },

  enginePanel: {
    borderRadius: Radius.lg,
    padding: Space.md,
    marginTop: Space.lg,
  },
  engineTitle: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },
  engineOnline: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  engineOnlineText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
  engineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, rowGap: 14 },
  engineStat: { minWidth: '40%' },
  engineStatVal: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginTop: 3 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
});