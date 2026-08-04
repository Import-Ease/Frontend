import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList, Shipment, mapBackendShipment } from '../types';
import { Eyebrow, PrimaryButton } from '../components';
import { CheckCircleIcon } from '../components/Icons';
import { fetchShipments } from '../services/api';

export default function AlertsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [alertShipments, setAlertShipments] = useState<Shipment[]>([]);

  const loadData = useCallback(async () => {
    const token = (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await fetchShipments(token);
      const mapped: Shipment[] = raw.map(mapBackendShipment);
      setAlertShipments(mapped.filter((s) => s.alert !== null));
    } catch (err: any) {
      Alert.alert('Failed to load alerts', err?.message || 'Please try again.');
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

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: Space.lg }}>
            <Eyebrow color={colors.navy}>Smart alerts</Eyebrow>
            <Text style={[s.pageTitle, { color: colors.text }]}>What needs you</Text>
            <Text style={[s.pageSub, { color: colors.muted }]}>We watch your shipments so you don't have to</Text>
          </View>

          {/* count banner */}
          <View style={[s.countBanner, { backgroundColor: colors.navyDim, borderLeftWidth: 4, borderLeftColor: colors.navy }]}>
            <Text style={[s.countNum, { color: colors.navy }]}>{loading ? '—' : alertShipments.length}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.countLabel, { color: colors.text }]}>
                {alertShipments.length === 1 ? 'thing' : 'things'} need your attention
              </Text>
              <Text style={[s.countSub, { color: colors.textSoft }]}>Take a look when you get a chance</Text>
            </View>
          </View>

          {loading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.navy} />
                <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>Loading alerts…</Text>
              </View>
          ) : alertShipments.length === 0 ? (
              <View style={s.empty}>
                <View style={[s.emptyIconWrap, { backgroundColor: colors.greenDim }]}>
                  <CheckCircleIcon size={40} color={colors.green} strokeWidth={1.5} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No alerts available.</Text>
              </View>
          ) : (
              alertShipments.map((ship) => {
                if (!ship.alert) return null;
                const tone = colors.cobalt;
                const toneDim = colors.cobaltDim;
                return (
                    <View key={ship.id} style={[s.alertCard, { backgroundColor: colors.card }]}>
                      <View style={s.alertTop}>
                        <Text style={[s.alertDesc, { color: colors.text }]}>{ship.description}</Text>
                      </View>

                      <View style={[s.alertMsgBox, { backgroundColor: toneDim }]}>
                        <Text style={[s.alertMsg, { color: colors.textSoft }]}>{ship.alert.msg}</Text>
                      </View>

                      <Text style={[s.alertTime, { color: colors.caption }]}>{ship.lastUpdate}</Text>

                      <View style={{ flexDirection: 'row', marginTop: Space.md }}>
                        <PrimaryButton label="Mark resolved" color={tone} />
                        <PrimaryButton label="View shipment" ghost />
                      </View>
                    </View>
                );
              })
          )}
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
  alertMsgBox: { borderRadius: Radius.sm, padding: Space.sm },
  alertMsg: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, lineHeight: 19 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.md },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: 4 },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
});
