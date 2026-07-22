import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme, useThemeMode, FontSize, Radius, Space, CardShadow } from '../theme';
import { RootStackParamList, Shipment, mapBackendShipment } from '../types';
import { Eyebrow, StatusBadge } from '../components';
import {
  UserIcon, MailIcon, MoonIcon, SunIcon, ShieldIcon, LogoutIcon, TrashIcon,
  InfoIcon, PackageIcon, AlertTriangleIcon, CheckCircleIcon, BarChartIcon,
} from '../components/Icons';
import { fetchShipments, fetchTotalCost, deleteMyAccount } from '../services/api';
import { clearAuthState } from '../services/storage';

interface StatCardProps {
  icon: React.ReactNode;
  val: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function StatCard({ icon, val, label, color, colors }: StatCardProps) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.card, borderLeftWidth: 3, borderLeftColor: color }]}>
      <View style={[s.statIconWrap, { backgroundColor: color + '18' }]}>
        {icon}
      </View>
      <Text style={[s.statVal, { color }]}>{val}</Text>
      <Text style={[s.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const username = (globalThis as any).__IMPORT_EASE_USERNAME__ as string | undefined;
  const email = (globalThis as any).__IMPORT_EASE_EMAIL__ as string | undefined;

  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalCost, setTotalCost] = useState<string>('GHS 0');
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const initials = username
    ? username
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const loadData = useCallback(async () => {
    const token = (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [raw, costRes] = await Promise.all([
        fetchShipments(token),
        fetchTotalCost(token).catch(() => null),
      ]);
      const mapped: Shipment[] = raw.map(mapBackendShipment);
      setShipments(mapped);
      if (costRes?.totalLandedCost) {
        setTotalCost(`GHS ${Math.round(costRes.totalLandedCost).toLocaleString()}`);
      } else {
        const total = raw.reduce((sum: number, s: any) => {
          const w = s.weightKg ?? 0;
          return sum + w * 2.95 + 200 + w * 0.354 + 150;
        }, 0);
        setTotalCost(`GHS ${Math.round(total).toLocaleString()}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const totalCount = shipments.length;
  const transitCount = shipments.filter((s) => s.status === 'transit').length;
  const customsCount = shipments.filter((s) => s.status === 'customs').length;
  const deliveredCount = shipments.filter((s) => s.status === 'delivered').length;
  const portCount = shipments.filter((s) => s.status === 'port').length;
  const originCount = shipments.filter((s) => s.status === 'origin').length;
  const alertCount = shipments.filter((s) => s.alert !== null).length;

  const maxBar = Math.max(transitCount, customsCount, deliveredCount, portCount, originCount, 1);

  const handleLogout = async () => {
    await clearAuthState();
    navigation.getParent<any>()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setDeleteModalVisible(true) },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Password required', 'Please enter your password to confirm deletion.');
      return;
    }
    const token = (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;
    if (!token) {
      Alert.alert('Not authenticated', 'Please log in again.');
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount(deletePassword.trim(), token);
      setDeleteModalVisible(false);
      setDeletePassword('');
      await clearAuthState();
    navigation.getParent<any>()?.reset({ index: 0, routes: [{ name: 'Login' }] });
  } catch (err: any) {
      console.log('[Settings] deleteMyAccount error:', err?.message, err);
      Alert.alert('Deletion failed', err?.message || 'Wrong password or account could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteAccount = () => {
    setDeleteModalVisible(false);
    setDeletePassword('');
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: Space.lg }}>
          <Eyebrow color={colors.orange}>Account</Eyebrow>
          <Text style={[s.pageTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Profile card */}
        <View style={[s.profileCard, { backgroundColor: colors.card }]}>
          <View style={[s.avatar, { backgroundColor: colors.orangeDim }]}>
            <Text style={[s.avatarText, { color: colors.orange }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {username || 'Unknown user'}
            </Text>
            <Text style={[s.profileEmail, { color: colors.muted }]} numberOfLines={1}>
              {email || 'No email'}
            </Text>
          </View>
        </View>

        {/* Account section */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.orange }]}>Account</Text>
          </View>

          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={[s.rowIconWrap, { backgroundColor: colors.orangeDim }]}>
              <UserIcon size={16} color={colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Name</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>{username || 'Not set'}</Text>
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.rowIconWrap, { backgroundColor: colors.greenDim }]}>
              <MailIcon size={16} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Email</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>{email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* ── REPORTS ───────────────────────────────────── */}
        <View style={[s.sectionHeaderRow, { marginBottom: Space.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.reportIconWrap, { backgroundColor: colors.orangeDim }]}>
              <BarChartIcon size={16} color={colors.orange} />
            </View>
            <Eyebrow color={colors.orange}>Reports</Eyebrow>
          </View>
        </View>

        {error ? (
          <View style={[s.emptyReport, { backgroundColor: colors.card }]}>
            <Text style={[s.emptyReportText, { color: colors.muted }]}>{error}</Text>
            <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.orangeDim }]} onPress={handleRetry} activeOpacity={0.8}>
              <Text style={[s.retryBtnText, { color: colors.orange }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.orange} />
            <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>Loading report…</Text>
          </View>
        ) : totalCount === 0 ? (
          <View style={[s.emptyReport, { backgroundColor: colors.card }]}>
            <PackageIcon size={32} color={colors.caption} strokeWidth={1.2} />
            <Text style={[s.emptyReportText, { color: colors.muted }]}>No shipment data yet</Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              <StatCard
                icon={<PackageIcon size={18} color={colors.cobalt} />}
                val={totalCount}
                label="Total"
                color={colors.cobalt}
                colors={colors}
              />
              <StatCard
                icon={<AlertTriangleIcon size={18} color={colors.orange} />}
                val={alertCount}
                label="Alerts"
                color={colors.orange}
                colors={colors}
              />
              <StatCard
                icon={<CheckCircleIcon size={18} color={colors.green} />}
                val={deliveredCount}
                label="Delivered"
                color={colors.green}
                colors={colors}
              />
            </View>

            {/* Cost card */}
            <View style={[s.costCard, { backgroundColor: colors.card }]}>
              <Text style={[s.costTitle, { color: colors.muted }]}>Total landed cost</Text>
              <Text style={[s.costVal, { color: colors.orange }]}>{totalCost}</Text>
            </View>

            {/* Status breakdown */}
            <View style={[s.breakdownCard, { backgroundColor: colors.card }]}>
              <Text style={[s.breakdownTitle, { color: colors.text }]}>Status breakdown</Text>
              {[
                { label: 'In transit', count: transitCount, color: colors.cobalt },
                { label: 'At customs', count: customsCount, color: colors.orange },
                { label: 'At port', count: portCount, color: colors.skyBlue },
                { label: 'Delivered', count: deliveredCount, color: colors.green },
                { label: 'At origin', count: originCount, color: colors.navy },
              ].map((bar) => (
                <View key={bar.label} style={s.barRow}>
                  <Text style={[s.barLabel, { color: colors.text }]}>{bar.label}</Text>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        {
                          backgroundColor: bar.color,
                          width: `${(bar.count / maxBar) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.barCount, { color: colors.muted }]}>{bar.count}</Text>
                </View>
              ))}
            </View>

            {/* Recent shipments */}
            <View style={[s.recentCard, { backgroundColor: colors.card }]}>
              <Text style={[s.recentTitle, { color: colors.text }]}>Recent shipments</Text>
              {shipments.slice(0, 5).map((ship) => (
                <View
                  key={ship.id}
                  style={[s.recentRow, { borderBottomColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={[s.recentId, { color: colors.orange }]}>{ship.id}</Text>
                      <StatusBadge status={ship.status} label={ship.statusLabel} />
                    </View>
                    <Text style={[s.recentDesc, { color: colors.text }]} numberOfLines={1}>
                      {ship.description}
                    </Text>
                    <Text style={[s.recentMeta, { color: colors.caption }]}>
                      {ship.origin} → {ship.destination || 'Tema, GH'}  ·  {ship.carrier}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.recentEta, { color: colors.text }]}>{ship.eta}</Text>
                    <Text style={[s.recentTime, { color: colors.caption }]}>{ship.lastUpdate}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Appearance section */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.orange }]}>Appearance</Text>
          </View>

          <View style={s.row}>
            <View style={[s.rowIconWrap, { backgroundColor: colors.navyDim }]}>
              {mode === 'dark' ? (
                <MoonIcon size={16} color={colors.navy} />
              ) : (
                <SunIcon size={16} color={colors.navy} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Theme</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>
                {mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['light', 'dark', 'system'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    s.themeChip,
                    {
                      backgroundColor: mode === opt ? colors.orange : colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setMode(opt)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.themeChipText,
                      { color: mode === opt ? '#FFFFFF' : colors.muted },
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About section */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.orange }]}>About</Text>
          </View>

          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={[s.rowIconWrap, { backgroundColor: colors.greenDim }]}>
              <ShieldIcon size={16} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Version</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>1.0.0</Text>
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.rowIconWrap, { backgroundColor: colors.skyBlueDim }]}>
              <InfoIcon size={16} color={colors.skyBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: colors.text }]}>ImportEase</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>Your import duty companion</Text>
            </View>
          </View>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: colors.card, borderColor: '#D94452' }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogoutIcon size={18} color="#D94452" />
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Delete Account button */}
        <TouchableOpacity
          style={[s.deleteBtn, { backgroundColor: '#D94452' }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.85}
        >
          <TrashIcon size={18} color="#FFFFFF" />
          <Text style={s.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password confirmation modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteAccount}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Confirm Deletion</Text>
            <Text style={[s.modalDesc, { color: colors.muted }]}>
              Enter your password to permanently delete your account.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.caption}
              secureTextEntry
              autoFocus
              style={[s.modalInput, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={cancelDeleteAccount}
                activeOpacity={0.8}
                disabled={deleting}
              >
                <Text style={[s.modalBtnText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: '#D94452', opacity: deleting ? 0.6 : 1 }]}
                onPress={confirmDeleteAccount}
                activeOpacity={0.8}
                disabled={deleting}
              >
                <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Space.lg, paddingBottom: 100 },

  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginTop: 4 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  profileName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md },
  profileEmail: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 2 },

  section: {
    borderRadius: Radius.lg,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  sectionHeader: {
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent',
  },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3, textTransform: 'uppercase' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.md,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent',
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
  rowValue: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },

  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  themeChipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: Space.sm,
    borderWidth: 1.5,
    ...CardShadow,
  },
  logoutText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base, color: '#D94452' },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: Space.sm,
    ...CardShadow,
  },
  deleteBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base, color: '#FFFFFF' },

  /* ── Delete modal ──────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Space.lg,
    ...CardShadow,
  },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md, marginBottom: Space.xs },
  modalDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginBottom: Space.md },
  modalInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: 13,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.base,
    borderWidth: 1,
    marginBottom: Space.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Space.sm,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  modalBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  /* ── Report styles ──────────────────────────────────── */
  statsRow: {
    flexDirection: 'row',
    gap: Space.sm,
    marginBottom: Space.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Space.sm,
    ...CardShadow,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  statVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xl },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },

  costCard: {
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  costTitle: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 },
  costVal: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl },

  breakdownCard: {
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  breakdownTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.md },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space.sm,
  },
  barLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, width: 80 },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: Space.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 4,
  },
  barCount: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm, width: 24, textAlign: 'right' },

  recentCard: {
    borderRadius: Radius.lg,
    padding: Space.md,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  recentTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: Space.md },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Space.sm,
    borderBottomWidth: 0.5,
  },
  recentId: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.xs },
  recentDesc: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm, marginBottom: 2 },
  recentMeta: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  recentEta: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.xs },
  recentTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

  emptyReport: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: Radius.lg,
    marginBottom: Space.sm,
    ...CardShadow,
  },
  emptyReportText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: Space.sm },

  retryBtn: { marginTop: Space.md, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.pill },
  retryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
});
