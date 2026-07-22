import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, Space, Radius, CardShadow, FontSize } from '../theme';
import { RootStackParamList } from '../types';
import { StatusBadge } from '../components';
import { ChevronLeftIcon, LogoutIcon, TruckIcon, UserIcon, CheckIcon, ShieldIcon } from '../components/Icons';
import { getAllShipmentsAdmin, advanceShipmentStage } from '../services/api';

const STAGE_OPTIONS = ['ORIGIN', 'TRANSIT', 'AT_PORT', 'CUSTOMS', 'DELIVERED'] as const;

interface AdminShipment {
    id: string;
    trackingId: string;
    description: string;
    status: string;
    carrier: string;
    userFullName: string;
    userEmail: string;
    eta: string;
    goodsType: string;
    originPort: string;
    destinationPort: string;
}

function mapAdminShipment(raw: any): AdminShipment {
    return {
        id: raw.id ?? '',
        trackingId: raw.trackingId ?? raw.id?.slice(0, 8) ?? '—',
        description: raw.description ?? '',
        status: raw.status ?? 'PENDING',
        carrier: raw.carrier ?? '',
        userFullName: (raw.userFullName ?? raw.user?.fullName) ?? '',
        userEmail: (raw.userEmail ?? raw.user?.email) ?? '',
        eta: raw.estimatedTimeOfArrival ?? '',
        goodsType: raw.goodsType ?? '',
        originPort: raw.originPort ?? '',
        destinationPort: raw.destinationPort ?? '',
    };
}

const STATUS_MAP: Record<string, { status: 'origin' | 'transit' | 'port' | 'customs' | 'delivered'; label: string }> = {
    PENDING:    { status: 'origin',   label: 'Pending' },
    ORIGIN:     { status: 'origin',   label: 'At Origin' },
    TRANSIT:    { status: 'transit',  label: 'In Transit' },
    AT_PORT:    { status: 'port',     label: 'At Port' },
    CUSTOMS:    { status: 'customs',  label: 'At Customs' },
    DELIVERED:  { status: 'delivered', label: 'Delivered' },
    ARCHIVED:   { status: 'delivered', label: 'Archived' },
};

export default function AdminDashboardScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shipments, setShipments] = useState<AdminShipment[]>([]);
    const [stageModalVisible, setStageModalVisible] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<AdminShipment | null>(null);
    const [advancing, setAdvancing] = useState(false);

    const getToken = () => (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ as string | undefined;

    const loadData = useCallback(async () => {
        const token = getToken();
        if (!token) {
            navigation.replace('AdminLogin');
            return;
        }
        try {
            const raw = await getAllShipmentsAdmin(token);
            setShipments(raw.map(mapAdminShipment));
        } catch (err: any) {
            setError(err?.message || 'Failed to load shipments');
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

    const openStagePicker = (shipment: AdminShipment) => {
        setSelectedShipment(shipment);
        setStageModalVisible(true);
    };

    const handleAdvance = async (stageName: string) => {
        if (!selectedShipment) return;
        const token = getToken();
        if (!token) {
            setStageModalVisible(false);
            Alert.alert('Not authorized', 'Please log in as an admin.', [
                { text: 'OK', onPress: () => navigation.replace('AdminLogin') },
            ]);
            return;
        }
        setAdvancing(true);
        try {
            await advanceShipmentStage(selectedShipment.id, stageName, null, token);
            setStageModalVisible(false);
            setSelectedShipment(null);
            loadData();
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not advance stage.');
        } finally {
            setAdvancing(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Log out', 'Return to the login screen?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log out',
                style: 'destructive',
                onPress: () => {
                    (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = undefined;
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[s.title, { color: colors.text }]}>Admin Panel</Text>
                    <Text style={[s.subtitle, { color: colors.green }]}>INTERNAL USE ONLY</Text>
                </View>
                <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => navigation.navigate('AdminUsers')}
                    activeOpacity={0.7}
                >
                    <ShieldIcon size={18} color={colors.cobalt} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <LogoutIcon size={18} color={colors.orange} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <Text style={[s.sectionLabel, { color: colors.muted }]}>
                    ALL SHIPMENTS ({shipments.length})
                </Text>

                {error ? (
                    <View style={s.centered}>
                        <Text style={[s.emptyText, { color: colors.muted }]}>{error}</Text>
                        <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.orangeDim, marginTop: Space.md }]} onPress={handleRetry} activeOpacity={0.8}>
                            <Text style={[s.retryBtnText, { color: colors.orange }]}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : loading ? (
                    <View style={s.centered}>
                        <ActivityIndicator size="large" color={colors.orange} />
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>Loading shipments…</Text>
                    </View>
                ) : shipments.length === 0 ? (
                    <View style={s.centered}>
                        <TruckIcon size={36} color={colors.caption} strokeWidth={1.2} />
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.md }]}>No shipments yet</Text>
                    </View>
                ) : (
                    shipments.map((ship) => {
                        const mapped = STATUS_MAP[ship.status] ?? STATUS_MAP.PENDING;
                        return (
                            <TouchableOpacity
                                key={ship.id}
                                style={[s.card, { backgroundColor: colors.card }]}
                                onPress={() => navigation.navigate('AdminShipmentDetail', { shipmentId: ship.id })}
                                activeOpacity={0.95}
                            >
                                {/* Top row: tracking + status */}
                                <View style={s.cardTop}>
                                    <Text style={[s.trackingId, { color: colors.orange }]} numberOfLines={1}>
                                        {ship.trackingId}
                                    </Text>
                                    <StatusBadge status={mapped.status} label={mapped.label} />
                                </View>

                                {/* Description */}
                                <Text style={[s.description, { color: colors.text }]} numberOfLines={2}>
                                    {ship.description || 'No description'}
                                </Text>

                                {/* Meta rows */}
                                <View style={s.metaGrid}>
                                    {ship.carrier ? (
                                        <View style={s.metaItem}>
                                            <TruckIcon size={12} color={colors.muted} />
                                            <Text style={[s.metaText, { color: colors.muted }]} numberOfLines={1}>
                                                {ship.carrier}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {ship.eta ? (
                                        <View style={s.metaItem}>
                                            <Text style={[s.metaLabel, { color: colors.caption }]}>ETA</Text>
                                            <Text style={[s.metaText, { color: colors.muted }]} numberOfLines={1}>
                                                {ship.eta}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {ship.originPort ? (
                                        <View style={s.metaItem}>
                                            <Text style={[s.metaText, { color: colors.muted }]} numberOfLines={1}>
                                                {ship.originPort}{ship.destinationPort ? ` → ${ship.destinationPort}` : ''}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* User info */}
                                <View style={[s.userRow, { borderTopColor: colors.border }]}>
                                    <View style={[s.userAvatar, { backgroundColor: colors.navyDim }]}>
                                        <UserIcon size={12} color={colors.navy} />
                                    </View>
                                    <Text style={[s.userName, { color: colors.text }]} numberOfLines={1}>
                                        {ship.userFullName || ship.userEmail || 'Unknown user'}
                                    </Text>
                                </View>

                                {/* Action */}
                                <TouchableOpacity
                                    style={[s.advanceBtn, { backgroundColor: colors.orange }]}
                                    onPress={() => openStagePicker(ship)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={s.advanceBtnText}>Advance Stage</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Stage picker modal */}
            <Modal visible={stageModalVisible} transparent animationType="fade" onRequestClose={() => setStageModalVisible(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Advance Stage</Text>
                        {selectedShipment && (
                            <Text style={[s.modalSub, { color: colors.muted }]}>
                                {selectedShipment.trackingId}
                            </Text>
                        )}
                        <View style={s.stageList}>
                            {STAGE_OPTIONS.map((stage) => {
                                const isActive = selectedShipment && STATUS_MAP[selectedShipment.status]?.label.toLowerCase().replace('at ', '').replace(' ', '') === stage.toLowerCase().replace('at ', '').replace(' ', '');
                                return (
                                    <TouchableOpacity
                                        key={stage}
                                        style={[
                                            s.stageOption,
                                            { backgroundColor: colors.surfaceAlt },
                                            isActive && { backgroundColor: colors.orange + '22', borderColor: colors.orange },
                                        ]}
                                        onPress={() => handleAdvance(stage)}
                                        disabled={advancing}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[s.stageOptionText, { color: isActive ? colors.orange : colors.text }]}>
                                            {stage.replace('_', ' ')}
                                        </Text>
                                        {advancing && <ActivityIndicator size="small" color={colors.orange} style={{ marginLeft: 8 }} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={[s.modalCancel, { backgroundColor: colors.surfaceAlt }]}
                            onPress={() => { setStageModalVisible(false); setSelectedShipment(null); }}
                            disabled={advancing}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.modalCancelText, { color: colors.muted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
        padding: Space.lg,
        borderBottomWidth: 1,
    },
    title: { fontSize: FontSize.xl, fontFamily: 'Poppins_700Bold' },
    subtitle: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, letterSpacing: 0.5, marginTop: 2 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

    content: { padding: Space.md, paddingBottom: 100 },
    sectionLabel: {
        fontSize: FontSize.xs,
        fontFamily: 'Nunito_700Bold',
        letterSpacing: 1,
        marginBottom: Space.sm,
    },

    centered: { paddingVertical: 60, alignItems: 'center' },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.pill },
    retryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    card: {
        padding: Space.md,
        borderRadius: Radius.lg,
        marginBottom: Space.sm,
        ...CardShadow,
    },

    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    trackingId: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm, flex: 1, marginRight: 8 },

    description: {
        fontFamily: 'Nunito_400Regular',
        fontSize: FontSize.sm,
        marginBottom: 8,
    },

    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
    metaText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        marginBottom: 10,
    },
    userAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    userName: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, flex: 1 },

    advanceBtn: {
        borderRadius: Radius.pill,
        paddingVertical: 10,
        alignItems: 'center',
    },
    advanceBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm, color: '#FFFFFF' },

    /* Modal */
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
    modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md, marginBottom: 2 },
    modalSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginBottom: Space.md },

    stageList: { gap: 8, marginBottom: Space.md },
    stageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Radius.md,
        paddingHorizontal: Space.md,
        paddingVertical: 13,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    stageOptionText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    modalCancel: { borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center' },
    modalCancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
