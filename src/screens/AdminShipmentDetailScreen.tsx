import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAppTheme, Space, Radius, CardShadow, FontSize } from '../theme';
import { RootStackParamList } from '../types';
import { StatusBadge, Eyebrow } from '../components';
import { ChevronLeftIcon, UploadIcon, MapPinIcon, ClipboardIcon, ClockIcon } from '../components/Icons';
import {
    getAdminShipmentDetail,
    getAdminShipmentStages,
    adminUpdateShipment,
    advanceShipmentStage,
    getAdminShipmentDocuments,
    uploadAdminShipmentDocument,
    getAdminShipmentCheckpoints,
    addAdminShipmentCheckpoint,
    getAdminShipmentEvents,
} from '../services/api';
import * as ImagePicker from 'expo-image-picker';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AdminShipmentDetail'>;
type Route = RouteProp<RootStackParamList, 'AdminShipmentDetail'>;

const WORKFLOW_STAGES = [
    'ORDER_CREATED', 'SUPPLIER_CONFIRMED', 'SUPPLIER_PAID', 'AWAITING_PICKUP',
    'COLLECTED', 'ORIGIN_WAREHOUSE', 'EXPORT_CUSTOMS', 'IN_TRANSIT',
    'DESTINATION_PORT', 'IMPORT_CUSTOMS', 'WAREHOUSE', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

const STAGE_COLORS: Record<string, string> = {
    ORDER_CREATED: '#6B7EB8',
    SUPPLIER_CONFIRMED: '#7B8FC8',
    SUPPLIER_PAID: '#8BA0D8',
    AWAITING_PICKUP: '#9BB1E8',
    COLLECTED: '#2563D4',
    ORIGIN_WAREHOUSE: '#2563D4',
    EXPORT_CUSTOMS: '#E8842A',
    IN_TRANSIT: '#1A3A8F',
    DESTINATION_PORT: '#5B9BD5',
    IMPORT_CUSTOMS: '#E8842A',
    WAREHOUSE: '#3DB34A',
    OUT_FOR_DELIVERY: '#3DB34A',
    DELIVERED: '#3DB34A',
    PENDING: '#6B7EB8',
    PENDING_PAYMENT: '#6B7EB8',
    ORIGIN: '#2563D4',
    TRANSIT: '#1A3A8F',
    AT_PORT: '#5B9BD5',
    CUSTOMS: '#E8842A',
    ARCHIVED: '#95A5A6',
};

const DOCUMENT_TYPES = [
    'INVOICE', 'BILL_OF_LADING', 'PACKING_LIST',
    'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION', 'INSURANCE', 'OTHER',
];

export default function AdminShipmentDetailScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const { shipmentId } = route.params;

    const [shipment, setShipment] = useState<any>(null);
    const [stages, setStages] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [checkpoints, setCheckpoints] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);
    const [stageModal, setStageModal] = useState(false);
    const [docModal, setDocModal] = useState(false);
    const [cpModal, setCpModal] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [editFields, setEditFields] = useState<Record<string, string>>({});
    const [newStageNote, setNewStageNote] = useState('');
    const [selectedDocType, setSelectedDocType] = useState('INVOICE');
    const [newCpLocation, setNewCpLocation] = useState('');
    const [newCpDesc, setNewCpDesc] = useState('');

    const getToken = () => (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ as string | undefined;
    const getAdminEmail = () => (globalThis as any).__IMPORT_EASE_USERNAME__ as string | undefined;

    const token = getToken();

    const loadData = async () => {
        if (!token) {
            navigation.replace('AdminLogin');
            return;
        }
        try {
            const [shipRes, stagesRes, docsRes, cpRes, evtRes] = await Promise.all([
                getAdminShipmentDetail(shipmentId, token),
                getAdminShipmentStages(shipmentId, token),
                getAdminShipmentDocuments(shipmentId, token).catch(() => []),
                getAdminShipmentCheckpoints(shipmentId, token).catch(() => []),
                getAdminShipmentEvents(shipmentId, token).catch(() => []),
            ]);
            setShipment(shipRes);
            setStages(Array.isArray(stagesRes) ? stagesRes : []);
            setDocuments(Array.isArray(docsRes) ? docsRes : []);
            setCheckpoints(Array.isArray(cpRes) ? cpRes : []);
            setEvents(Array.isArray(evtRes) ? evtRes : []);
        } catch (err: any) {
            Alert.alert('Failed to load', err?.message || 'Could not load shipment details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [shipmentId]);

    const openEdit = () => {
        if (!shipment) return;
        setEditFields({
            trackingId: shipment.trackingId || '',
            description: shipment.description || '',
            carrier: shipment.carrier || '',
            originPort: shipment.originPort || '',
            destinationPort: shipment.destinationPort || '',
            status: shipment.status || '',
            paySupplier: shipment.paySupplier || '',
            quotationAmount: shipment.quotationAmount != null ? String(shipment.quotationAmount) : '',
            quotationCurrency: shipment.quotationCurrency || 'GHS',
            paymentStatus: shipment.paymentStatus || 'PENDING',
            amountPaid: shipment.amountPaid != null ? String(shipment.amountPaid) : '0',
        });
        setEditModal(true);
    };

    const handleSave = async () => {
        if (!token) return;
        try {
            await adminUpdateShipment(shipmentId, editFields, token);
            setEditModal(false);
            loadData();
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not update shipment.');
        }
    };

    const handleAdvance = async (stageName: string) => {
        if (!token) return;
        setAdvancing(true);
        try {
            await advanceShipmentStage(shipmentId, stageName, newStageNote || null, token);
            setStageModal(false);
            setNewStageNote('');
            loadData();
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not advance stage.');
        } finally {
            setAdvancing(false);
        }
    };

    const handleUploadDoc = async () => {
        if (!token) return;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                await uploadAdminShipmentDocument(shipmentId, asset, selectedDocType, token);
                setDocModal(false);
                loadData();
            }
        } catch (err: any) {
            Alert.alert('Upload Failed', err?.message || 'Could not upload document.');
        }
    };

    const handleAddCheckpoint = async () => {
        if (!token || !newCpLocation.trim() || !newCpDesc.trim()) {
            Alert.alert('Missing Fields', 'Location and description are required.');
            return;
        }
        try {
            await addAdminShipmentCheckpoint(shipmentId, newCpLocation.trim(), newCpDesc.trim(), token);
            setCpModal(false);
            setNewCpLocation('');
            setNewCpDesc('');
            loadData();
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not add checkpoint.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={s.centered}><ActivityIndicator size="large" color={colors.orange} /></View>
            </SafeAreaView>
        );
    }

    if (!shipment) {
        return (
            <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={s.centered}><Text style={[s.emptyText, { color: colors.muted }]}>Shipment not found</Text></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ChevronLeftIcon size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{shipment.trackingId || 'Shipment'}</Text>
                <TouchableOpacity style={[s.editBtn, { backgroundColor: colors.orangeDim }]} onPress={openEdit} activeOpacity={0.7}>
                    <Text style={[s.editBtnText, { color: colors.orange }]}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {/* Status card */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.statusRow}>
                        <Text style={[s.statusLabel, { color: colors.muted }]}>Status</Text>
                        <StatusBadge
                            status={shipment.status === 'DELIVERED' ? 'delivered' : shipment.status === 'IN_TRANSIT' || shipment.status === 'TRANSIT' || shipment.status === 'OUT_FOR_DELIVERY' ? 'transit' : shipment.status === 'DESTINATION_PORT' || shipment.status === 'AT_PORT' ? 'port' : shipment.status === 'IMPORT_CUSTOMS' || shipment.status === 'EXPORT_CUSTOMS' || shipment.status === 'CUSTOMS' ? 'customs' : 'origin'}
                            label={shipment.status?.replace(/_/g, ' ') || 'PENDING'}
                        />
                    </View>
                    <Text style={[s.description, { color: colors.text }]}>{shipment.description || 'No description'}</Text>
                </View>

                {/* Details card */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <Eyebrow color={colors.navy}>Details</Eyebrow>
                    <DetailRow label="Tracking ID" value={shipment.trackingId} colors={colors} />
                    <DetailRow label="Carrier" value={shipment.carrier} colors={colors} />
                    <DetailRow label="Origin" value={shipment.originPort} colors={colors} />
                    <DetailRow label="Destination" value={shipment.destinationPort} colors={colors} />
                    <DetailRow label="Goods Type" value={shipment.goodsType} colors={colors} />
                    <DetailRow label="Weight" value={shipment.weightKg ? `${shipment.weightKg} kg` : '—'} colors={colors} />
                    <DetailRow label="ETA" value={shipment.estimatedTimeOfArrival || '—'} colors={colors} />
                    <DetailRow label="Shipping Mode" value={shipment.shippingMode || '—'} colors={colors} />
                    <DetailRow label="Quantity" value={shipment.orderQuantity != null ? String(shipment.orderQuantity) : '—'} colors={colors} />
                    <DetailRow label="Pay Supplier" value={shipment.paySupplier || '(empty)'} colors={colors} />
                </View>

                {/* Quotation card */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <Eyebrow color={colors.navy}>Quotation / Payment</Eyebrow>
                    <DetailRow label="Quotation" value={shipment.quotationAmount != null ? `${shipment.quotationCurrency || 'GHS'} ${Number(shipment.quotationAmount).toLocaleString()}` : 'Not set'} colors={colors} />
                    <DetailRow label="Amount Paid" value={shipment.amountPaid != null ? `${shipment.quotationCurrency || 'GHS'} ${Number(shipment.amountPaid).toLocaleString()}` : 'GHS 0'} colors={colors} />
                    <DetailRow label="Outstanding" value={shipment.quotationAmount != null && shipment.amountPaid != null ? `${shipment.quotationCurrency || 'GHS'} ${Math.max(0, Number(shipment.quotationAmount) - Number(shipment.amountPaid)).toLocaleString()}` : '—'} colors={colors} />
                    <DetailRow label="Payment Status" value={shipment.paymentStatus || 'PENDING'} colors={colors} />
                </View>

                {/* Customer card */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <Eyebrow color={colors.navy}>Customer</Eyebrow>
                    <DetailRow label="Name" value={shipment.userFullName ?? shipment.user?.fullName ?? '—'} colors={colors} />
                    <DetailRow label="Email" value={shipment.userEmail ?? shipment.user?.email ?? '—'} colors={colors} />
                </View>

                {/* Stage History */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.trackingHeader}>
                        <Eyebrow color={colors.navy}>Stage History</Eyebrow>
                        <TouchableOpacity
                            style={[s.advanceBtn, { backgroundColor: colors.orange }]}
                            onPress={() => setStageModal(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.advanceBtnText}>Advance</Text>
                        </TouchableOpacity>
                    </View>
                    {stages.length === 0 ? (
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.sm }]}>No stages yet</Text>
                    ) : (
                        stages.map((stage: any, i: number) => (
                            <View key={stage.id || i} style={[s.timelineItem, { borderLeftColor: STAGE_COLORS[stage.stageName] || colors.cobalt }]}>
                                <View style={[s.timelineDot, { backgroundColor: STAGE_COLORS[stage.stageName] || colors.cobalt }]} />
                                <View style={s.timelineContent}>
                                    <Text style={[s.timelineStage, { color: colors.text }]}>
                                        {stage.stageName?.replace(/_/g, ' ') || 'Unknown'}
                                    </Text>
                                    {stage.note ? (
                                        <Text style={[s.timelineNote, { color: colors.textSoft }]}>{stage.note}</Text>
                                    ) : null}
                                    <View style={s.timelineMeta}>
                                        <Text style={[s.timelineTime, { color: colors.caption }]}>
                                            {stage.reachedAt ? new Date(stage.reachedAt).toLocaleString() : ''}
                                        </Text>
                                        {stage.updatedBy ? (
                                            <Text style={[s.timelineBy, { color: colors.caption }]}>
                                                by {stage.updatedBy}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Documents */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.trackingHeader}>
                        <Eyebrow color={colors.navy}>Documents</Eyebrow>
                        <TouchableOpacity
                            style={[s.advanceBtn, { backgroundColor: colors.orange }]}
                            onPress={() => {
                                setSelectedDocType('INVOICE');
                                setDocModal(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={s.advanceBtnText}>Upload</Text>
                        </TouchableOpacity>
                    </View>
                    {documents.length === 0 ? (
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.sm }]}>No documents uploaded</Text>
                    ) : (
                        documents.map((doc: any) => (
                            <TouchableOpacity
                                key={doc.id}
                                style={[s.docRow, { backgroundColor: colors.surfaceAlt }]}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert('Open', doc.fileUrl || 'No URL')}
                            >
                                <ClipboardIcon size={16} color={colors.cobalt} />
                                <View style={s.docInfo}>
                                    <Text style={[s.docName, { color: colors.text }]} numberOfLines={1}>{doc.fileName}</Text>
                                    <Text style={[s.docMeta, { color: colors.caption }]}>
                                        {doc.documentType} - {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Checkpoints */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.trackingHeader}>
                        <Eyebrow color={colors.navy}>Checkpoints</Eyebrow>
                        <TouchableOpacity
                            style={[s.advanceBtn, { backgroundColor: colors.orange }]}
                            onPress={() => setCpModal(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.advanceBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                    {checkpoints.length === 0 ? (
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.sm }]}>No checkpoints yet</Text>
                    ) : (
                        checkpoints.map((cp: any) => (
                            <View key={cp.id} style={s.cpRow}>
                                <MapPinIcon size={16} color={colors.cobalt} />
                                <View style={s.cpInfo}>
                                    <Text style={[s.cpLocation, { color: colors.text }]}>{cp.location}</Text>
                                    <Text style={[s.cpDesc, { color: colors.textSoft }]}>{cp.description}</Text>
                                    <Text style={[s.cpTime, { color: colors.caption }]}>
                                        {cp.timestamp ? new Date(cp.timestamp).toLocaleString() : ''}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Event Log */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <Eyebrow color={colors.navy}>Event Log</Eyebrow>
                    {events.length === 0 ? (
                        <Text style={[s.emptyText, { color: colors.muted, marginTop: Space.sm }]}>No events recorded</Text>
                    ) : (
                        events.map((evt: any) => (
                            <View key={evt.id} style={s.evtRow}>
                                <ClockIcon size={14} color={colors.caption} />
                                <View style={s.evtInfo}>
                                    <Text style={[s.evtDesc, { color: colors.text }]}>{evt.description}</Text>
                                    <Text style={[s.evtMeta, { color: colors.caption }]}>
                                        {evt.eventType?.replace(/_/g, ' ')} - {evt.createdAt ? new Date(evt.createdAt).toLocaleString() : ''}
                                        {evt.performedBy ? ` by ${evt.performedBy}` : ''}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Delivery Info */}
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <Eyebrow color={colors.navy}>Delivery Info</Eyebrow>
                    <DetailRow label="Estimated Delivery" value={shipment.estimatedTimeOfArrival || '—'} colors={colors} />
                    <DetailRow label="Actual Delivery" value={shipment.status === 'DELIVERED' ? (stages.find((s: any) => s.stageName === 'DELIVERED')?.reachedAt ? new Date(stages.find((s: any) => s.stageName === 'DELIVERED').reachedAt).toLocaleDateString() : 'Delivered') : 'Not yet delivered'} colors={colors} />
                </View>
            </ScrollView>

            {/* Edit modal */}
            <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
                <View style={s.modalOverlay}>
                    <ScrollView style={[s.modalCard, { backgroundColor: colors.card, maxHeight: '80%' }]} contentContainerStyle={{ padding: Space.lg }}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Edit Shipment</Text>
                        {Object.entries(editFields).map(([key, val]) => (
                            <View key={key} style={{ marginBottom: Space.sm }}>
                                <Text style={[s.fieldLabel, { color: colors.muted }]}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</Text>
                                <TextInput
                                    value={String(val)}
                                    onChangeText={(text) => setEditFields(prev => ({ ...prev, [key]: text }))}
                                    placeholderTextColor={colors.caption}
                                    style={[s.fieldInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                                />
                            </View>
                        ))}
                        <View style={s.modalActions}>
                            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setEditModal(false)} activeOpacity={0.7}>
                                <Text style={[s.modalBtnText, { color: colors.muted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.orange }]} onPress={handleSave} activeOpacity={0.7}>
                                <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Stage modal */}
            <Modal visible={stageModal} transparent animationType="fade" onRequestClose={() => setStageModal(false)}>
                <View style={s.modalOverlay}>
                    <ScrollView style={[s.modalCard, { backgroundColor: colors.card, maxHeight: '80%' }]} contentContainerStyle={{ padding: Space.lg }}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Advance Stage</Text>
                        <Text style={[s.modalSub, { color: colors.muted }]}>{shipment.trackingId}</Text>
                        <TextInput
                            placeholder="Note (optional)"
                            placeholderTextColor={colors.caption}
                            value={newStageNote}
                            onChangeText={setNewStageNote}
                            style={[s.fieldInput, { backgroundColor: colors.surfaceAlt, color: colors.text, marginBottom: Space.md }]}
                        />
                        {WORKFLOW_STAGES.map((stage) => (
                            <TouchableOpacity
                                key={stage}
                                style={[s.stageOption, { backgroundColor: colors.surfaceAlt }]}
                                onPress={() => handleAdvance(stage)}
                                disabled={advancing}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.stageOptionText, { color: colors.text }]}>{stage.replace(/_/g, ' ')}</Text>
                                {advancing && <ActivityIndicator size="small" color={colors.orange} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[s.modalCancel, { backgroundColor: colors.surfaceAlt }]} onPress={() => setStageModal(false)} disabled={advancing} activeOpacity={0.7}>
                            <Text style={[s.modalCancelText, { color: colors.muted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Document upload modal */}
            <Modal visible={docModal} transparent animationType="fade" onRequestClose={() => setDocModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Upload Document</Text>
                        <Text style={[s.modalSub, { color: colors.muted }]}>Select document type</Text>
                        <View style={s.docTypeGrid}>
                            {DOCUMENT_TYPES.map((dt) => (
                                <TouchableOpacity
                                    key={dt}
                                    style={[s.docTypeChip, { backgroundColor: selectedDocType === dt ? colors.orangeDim : colors.surfaceAlt }]}
                                    onPress={() => setSelectedDocType(dt)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.docTypeChipText, { color: selectedDocType === dt ? colors.orange : colors.text }]}>
                                        {dt.replace(/_/g, ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[s.uploadBtn, { backgroundColor: colors.orange }]} onPress={handleUploadDoc} activeOpacity={0.7}>
                            <UploadIcon size={18} color="#FFFFFF" />
                            <Text style={s.uploadBtnText}>Pick File</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.modalCancel, { backgroundColor: colors.surfaceAlt }]} onPress={() => setDocModal(false)} activeOpacity={0.7}>
                            <Text style={[s.modalCancelText, { color: colors.muted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Checkpoint modal */}
            <Modal visible={cpModal} transparent animationType="fade" onRequestClose={() => setCpModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Add Checkpoint</Text>
                        <TextInput
                            placeholder="Location (e.g. Port of Shanghai)"
                            placeholderTextColor={colors.caption}
                            value={newCpLocation}
                            onChangeText={setNewCpLocation}
                            style={[s.fieldInput, { backgroundColor: colors.surfaceAlt, color: colors.text, marginBottom: Space.sm }]}
                        />
                        <TextInput
                            placeholder="Description (e.g. Container loaded)"
                            placeholderTextColor={colors.caption}
                            value={newCpDesc}
                            onChangeText={setNewCpDesc}
                            style={[s.fieldInput, { backgroundColor: colors.surfaceAlt, color: colors.text, marginBottom: Space.md }]}
                        />
                        <View style={s.modalActions}>
                            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setCpModal(false)} activeOpacity={0.7}>
                                <Text style={[s.modalBtnText, { color: colors.muted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.orange }]} onPress={handleAddCheckpoint} activeOpacity={0.7}>
                                <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
    return (
        <View style={detail.row}>
            <Text style={[detail.label, { color: colors.muted }]}>{label}</Text>
            <Text style={[detail.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
        </View>
    );
}

const detail = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' },
    label: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, flex: 1 },
    value: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm, flex: 1, textAlign: 'right' },
});

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: Space.lg, borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill },
    editBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },
    title: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, flex: 1, textAlign: 'center', marginHorizontal: Space.sm },

    content: { padding: Space.md, paddingBottom: 100 },
    centered: { paddingVertical: 60, alignItems: 'center' },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    card: { padding: Space.md, borderRadius: Radius.lg, marginBottom: Space.sm, ...CardShadow },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.sm },
    statusLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
    description: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md },

    trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.sm },
    advanceBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill },
    advanceBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    timelineItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        borderLeftWidth: 2, paddingLeft: Space.md, marginLeft: 4, paddingVertical: Space.sm,
    },
    timelineDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', left: -6, top: 14 },
    timelineContent: { flex: 1 },
    timelineStage: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
    timelineNote: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 2 },
    timelineMeta: { flexDirection: 'row', gap: Space.sm, marginTop: 4 },
    timelineTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
    timelineBy: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },

    /* Document rows */
    docRow: {
        flexDirection: 'row', alignItems: 'center', padding: Space.sm,
        borderRadius: Radius.md, marginBottom: 6, gap: Space.sm,
    },
    docInfo: { flex: 1 },
    docName: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
    docMeta: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

    /* Document type grid */
    docTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Space.md },
    docTypeChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
    },
    docTypeChipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: Radius.pill, gap: Space.sm, marginBottom: Space.sm,
    },
    uploadBtnText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    /* Checkpoint rows */
    cpRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: Space.sm, gap: Space.sm,
        borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    cpInfo: { flex: 1 },
    cpLocation: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
    cpDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 2 },
    cpTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 2 },

    /* Event log */
    evtRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 6, gap: Space.sm,
        borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    evtInfo: { flex: 1 },
    evtDesc: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
    evtMeta: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Space.lg },
    modalCard: { width: '100%', borderRadius: Radius.lg, ...CardShadow },
    modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md, marginBottom: Space.md },
    modalSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginBottom: Space.md },

    fieldLabel: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 4, textTransform: 'uppercase' },
    fieldInput: { borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 10, fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },
    modalActions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.md },
    modalBtn: { flex: 1, borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center' },
    modalBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    stageOption: {
        borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13,
        marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    stageOptionText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    modalCancel: { borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: Space.sm },
    modalCancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
