import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, Space, Radius, CardShadow, FontSize } from '../theme';
import { RootStackParamList } from '../types';
import { ChevronLeftIcon, SearchIcon, UserIcon, XIcon, CheckIcon, ShieldIcon } from '../components/Icons';
import {
    getAdminUsers,
    toggleUserStatus,
    updateUserRole,
    resetUserPassword,
    deleteUser,
} from '../services/api';

const ROLES = ['IMPORTER', 'SUPPLIER', 'ADMIN'];

export default function AdminUsersScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionModal, setActionModal] = useState(false);
    const [resetPwModal, setResetPwModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const getToken = () => (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ as string | undefined;

    const loadUsers = useCallback(async (q?: string) => {
        const token = getToken();
        if (!token) {
            navigation.replace('AdminLogin');
            return;
        }
        try {
            const data = await getAdminUsers(token, q);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            Alert.alert('Failed to load users', err?.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) loadUsers(query);
            else loadUsers();
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const handleToggleStatus = async (user: any) => {
        const token = getToken();
        if (!token) return;
        try {
            await toggleUserStatus(user.id, !user.enabled, token);
            loadUsers(query);
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not update user status.');
        }
    };

    const handleRoleChange = async (user: any, role: string) => {
        const token = getToken();
        if (!token) return;
        try {
            await updateUserRole(user.id, role, token);
            setActionModal(false);
            loadUsers(query);
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not update role.');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || newPassword.length < 6) {
            Alert.alert('Invalid', 'Password must be at least 6 characters.');
            return;
        }
        const token = getToken();
        if (!token) return;
        try {
            await resetUserPassword(selectedUser.id, newPassword, token);
            setResetPwModal(false);
            setNewPassword('');
            Alert.alert('Done', `Password reset for ${selectedUser.email || selectedUser.username}`);
        } catch (err: any) {
            Alert.alert('Failed', err?.message || 'Could not reset password.');
        }
    };

    const handleDelete = (user: any) => {
        Alert.alert(
            'Delete user',
            `Delete ${user.email || user.username}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const token = getToken();
                        if (!token) return;
                        try {
                            await deleteUser(user.id, token);
                            loadUsers(query);
                        } catch (err: any) {
                            Alert.alert('Failed', err?.message || 'Could not delete user.');
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <ChevronLeftIcon size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={[s.title, { color: colors.text }]}>User Management</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={[s.searchWrap, { backgroundColor: colors.card }]}>
                <SearchIcon size={16} color={colors.caption} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search by name, email or username..."
                    placeholderTextColor={colors.caption}
                    style={[s.searchInput, { color: colors.text }]}
                />
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={s.centered}>
                        <ActivityIndicator size="large" color={colors.orange} />
                    </View>
                ) : users.length === 0 ? (
                    <View style={s.centered}>
                        <Text style={[s.emptyText, { color: colors.muted }]}>No users found</Text>
                    </View>
                ) : (
                    users.map((user) => (
                        <View key={user.id} style={[s.card, { backgroundColor: colors.card }]}>
                            <View style={s.cardTop}>
                                <View style={[s.avatar, { backgroundColor: colors.navyDim }]}>
                                    <UserIcon size={16} color={colors.navy} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.userName, { color: colors.text }]}>
                                        {user.fullName || user.username || 'N/A'}
                                    </Text>
                                    <Text style={[s.userEmail, { color: colors.muted }]}>
                                        {user.email || 'No email'}
                                    </Text>
                                </View>
                                <View style={[s.roleBadge, { backgroundColor: user.role === 'ADMIN' ? colors.orangeDim : colors.cobaltDim }]}>
                                    <Text style={[s.roleText, { color: user.role === 'ADMIN' ? colors.orange : colors.cobalt }]}>
                                        {user.role}
                                    </Text>
                                </View>
                            </View>

                            <View style={[s.metaRow, { borderTopColor: colors.border }]}>
                                <Text style={[s.metaText, { color: colors.caption }]}>
                                    Username: {user.username}
                                </Text>
                                <Text style={[s.metaText, { color: colors.caption }]}>
                                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                                </Text>
                                <View style={[s.statusDot, { backgroundColor: user.enabled ? colors.green : colors.orange }]} />
                                <Text style={[s.metaText, { color: user.enabled ? colors.green : colors.orange }]}>
                                    {user.enabled ? 'Active' : 'Disabled'}
                                </Text>
                            </View>

                            <View style={s.actionRow}>
                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: user.enabled ? colors.orangeDim : colors.greenDim }]}
                                    onPress={() => handleToggleStatus(user)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.actionBtnText, { color: user.enabled ? colors.orange : colors.green }]}>
                                        {user.enabled ? 'Disable' : 'Enable'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: colors.cobaltDim }]}
                                    onPress={() => { setSelectedUser(user); setActionModal(true); }}
                                    activeOpacity={0.7}
                                >
                                    <ShieldIcon size={12} color={colors.cobalt} />
                                    <Text style={[s.actionBtnText, { color: colors.cobalt }]}>Role</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: colors.navyDim }]}
                                    onPress={() => { setSelectedUser(user); setResetPwModal(true); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.actionBtnText, { color: colors.navy }]}>Reset PW</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: colors.greenDim }]}
                                    onPress={() => handleDelete(user)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.actionBtnText, { color: colors.green }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Role picker modal */}
            <Modal visible={actionModal} transparent animationType="fade" onRequestClose={() => setActionModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Change Role</Text>
                        <Text style={[s.modalSub, { color: colors.muted }]}>
                            {selectedUser?.email || selectedUser?.username}
                        </Text>
                        {ROLES.map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[s.roleOption, { backgroundColor: colors.surfaceAlt }]}
                                onPress={() => handleRoleChange(selectedUser, role)}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.roleOptionText, { color: colors.text }]}>{role}</Text>
                                {selectedUser?.role === role && (
                                    <CheckIcon size={14} color={colors.green} />
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[s.modalCancel, { backgroundColor: colors.surfaceAlt }]}
                            onPress={() => setActionModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.modalCancelText, { color: colors.muted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Reset password modal */}
            <Modal visible={resetPwModal} transparent animationType="fade" onRequestClose={() => setResetPwModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Reset Password</Text>
                        <Text style={[s.modalSub, { color: colors.muted }]}>
                            {selectedUser?.email || selectedUser?.username}
                        </Text>
                        <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New password (min 6 chars)"
                            placeholderTextColor={colors.caption}
                            secureTextEntry
                            style={[s.pwInput, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                        />
                        <View style={s.modalActions}>
                            <TouchableOpacity
                                style={[s.modalBtn, { backgroundColor: colors.surfaceAlt }]}
                                onPress={() => { setResetPwModal(false); setNewPassword(''); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.modalBtnText, { color: colors.muted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalBtn, { backgroundColor: colors.orange }]}
                                onPress={handleResetPassword}
                                activeOpacity={0.7}
                            >
                                <Text style={[s.modalBtnText, { color: '#FFFFFF' }]}>Reset</Text>
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
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: Space.lg, borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, flex: 1, textAlign: 'center' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center', gap: Space.sm,
        margin: Space.lg, marginBottom: 0,
        borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 12,
        ...CardShadow,
    },
    searchInput: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, padding: 0 },

    content: { padding: Space.md, paddingBottom: 100 },
    centered: { paddingVertical: 60, alignItems: 'center' },
    emptyText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm },

    card: {
        padding: Space.md, borderRadius: Radius.lg, marginBottom: Space.sm, ...CardShadow,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginBottom: Space.sm },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    userName: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
    userEmail: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 1 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
    roleText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    metaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingTop: Space.sm, borderTopWidth: 1, marginBottom: Space.sm, flexWrap: 'wrap',
    },
    metaText: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
    statusDot: { width: 8, height: 8, borderRadius: 4 },

    actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill,
    },
    actionBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs },

    /* Modal */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: Space.lg,
    },
    modalCard: {
        width: '100%', borderRadius: Radius.lg, padding: Space.lg, ...CardShadow,
    },
    modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md, marginBottom: 2 },
    modalSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginBottom: Space.md },

    roleOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13, marginBottom: 8,
    },
    roleOptionText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    pwInput: {
        borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 12,
        fontFamily: 'Nunito_400Regular', fontSize: FontSize.base, marginBottom: Space.md,
    },
    modalActions: { flexDirection: 'row', gap: Space.sm },
    modalBtn: { flex: 1, borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center' },
    modalBtnText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

    modalCancel: { borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: Space.sm },
    modalCancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
