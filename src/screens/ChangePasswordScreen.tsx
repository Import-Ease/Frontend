import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { LockIcon } from '../components/Icons';
import { changePassword } from '../services/api';

export default function ChangePasswordScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const getToken = () => (globalThis as any).__IMPORT_EASE_TOKEN__ as string | undefined;

  const handleSave = async () => {
    if (!current.trim()) { Alert.alert('Missing info', 'Enter your current password.'); return; }
    if (next.length < 8) { Alert.alert('Weak password', 'New password must be at least 8 characters.'); return; }
    if (next !== confirm) { Alert.alert('Mismatch', 'New passwords do not match.'); return; }
    const token = getToken();
    if (!token) { Alert.alert('Not logged in', 'Please sign in again.'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm }, token);
      Alert.alert('Password updated', 'Your password has been changed successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not update password.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{ padding: Space.sm }}>
            <Text style={[s.headerBtn, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>Change Password</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7} style={{ padding: Space.sm }}>
            {saving ? <ActivityIndicator size="small" color={colors.cobalt} /> : <Text style={[s.headerBtn, { color: colors.cobalt }]}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.intro}>
            <View style={[s.introIcon, { backgroundColor: colors.cobaltDim }]}>
              <LockIcon size={22} color={colors.cobalt} />
            </View>
            <Text style={[s.introText, { color: colors.muted }]}>Choose a strong password that you don't use for other services.</Text>
          </View>

          <View style={[s.card, { backgroundColor: colors.card }]}>
            {[
              { key: 'current' as const, label: 'Current password', value: current, set: setCurrent, placeholder: 'Enter current password' },
              { key: 'next' as const, label: 'New password', value: next, set: setNext, placeholder: 'At least 8 characters' },
              { key: 'confirm' as const, label: 'Confirm new password', value: confirm, set: setConfirm, placeholder: 'Repeat new password' },
            ].map((f) => (
              <View key={f.key} style={s.field}>
                <Text style={[s.label, { color: colors.muted }]}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.caption}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
                />
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} activeOpacity={0.7} style={{ marginTop: Space.xs }}>
              <Text style={[s.toggleText, { color: colors.cobalt }]}>{showPwd ? 'Hide passwords' : 'Show passwords'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.xs, paddingVertical: Space.sm, borderBottomWidth: 0.5 },
  headerBtn: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base },
  title: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.md },
  scroll: { padding: Space.lg, paddingBottom: 60 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginBottom: Space.lg },
  introIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, color: '#888' },
  card: { borderRadius: Radius.lg, padding: Space.md, ...CardShadow },
  field: { marginBottom: Space.md },
  label: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs, marginBottom: 6, letterSpacing: 0.3 },
  input: { borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: 13, fontFamily: 'Nunito_400Regular', fontSize: FontSize.base },
  toggleText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});