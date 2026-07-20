import React, { useState } from 'react';
import {
  Alert,
  KeyboardTypeOptions,
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
import { RootStackParamList } from '../types';
import { Eyebrow } from '../components';
import { ChevronLeftIcon } from '../components/Icons';
import { createShipment } from '../services/api';

const GOODS_TYPES = ['General goods', 'Electronics', 'Cold chain', 'Textiles', 'Machinery', 'Construction', 'Pharmaceuticals'];
const CARRIERS = ['Maersk Line', 'MSC Cargo', 'Hapag-Lloyd', 'COSCO Shipping', 'Evergreen Marine', 'CMA CGM', 'Other'];

interface FormState {
  trackingId: string;
  description: string;
  origin: string;
  carrier: string;
  carrierCustom: string;
  goodsType: string;
  weight: string;
  eta: string;
  notes: string;
}

const initialForm: FormState = {
  trackingId: '',
  description: '',
  origin: '',
  carrier: '',
  carrierCustom: '',
  goodsType: '',
  weight: '',
  eta: '',
  notes: '',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function Field({ label, children, colors }: FieldProps) {
  return (
      <View style={{ marginBottom: Space.md }}>
        <Eyebrow color={colors.muted}>{label}</Eyebrow>
        <View style={{ marginTop: 8 }}>{children}</View>
      </View>
  );
}

interface InputBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function InputBox({ value, onChangeText, placeholder, keyboardType = 'default', colors }: InputBoxProps) {
  return (
      <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.caption}
          keyboardType={keyboardType}
          style={[s.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
      />
  );
}

interface ChipSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function ChipSelect({ options, value, onChange, colors }: ChipSelectProps) {
  return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map((opt) => {
            const active = value === opt;
            return (
                <TouchableOpacity
                    key={opt}
                    onPress={() => onChange(opt)}
                    style={[s.chip, { backgroundColor: active ? colors.cobalt : colors.surfaceAlt, borderWidth: active ? 0 : 1, borderColor: colors.border }]}
                    activeOpacity={0.8}
                >
                  <Text style={[s.chipText, { color: active ? '#FFFFFF' : colors.muted }]}>{opt}</Text>
                </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
  );
}

export default function AddShipmentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AddShipment'>>();
  const [form, setForm] = useState<FormState>(initialForm);
  const { colors } = useAppTheme();

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.trackingId || !form.description || !form.origin || !form.eta) {
      Alert.alert('A few things are missing', 'Please fill in the tracking ID, description, origin, and ETA so we can track it properly.');
      return;
    }

    try {
      const token = (globalThis as any).__IMPORT_EASE_TOKEN__;
      if (!token) {
        Alert.alert('Not signed in', 'Please log in before adding a shipment.');
        return;
      }

      const payload = {
        trackingId: form.trackingId,
        description: form.description,
        goodsType: form.goodsType || 'General goods',
        carrier: form.carrier === 'Other' ? form.carrierCustom || form.carrier : form.carrier,
        originPort: form.origin,
        destinationPort: 'Tema, GH',
        weightKg: Number(form.weight || 0),
        estimatedTimeOfArrival: form.eta,
      };

      await createShipment(payload, token);
      Alert.alert('Shipment added', `${form.trackingId} is now on your dashboard.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Could not save shipment', error?.message || 'Please try again.');
    }
  };

  return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: colors.surfaceAlt }]} activeOpacity={0.7}>
              <ChevronLeftIcon size={18} color={colors.cobalt} />
              <Text style={[s.backText, { color: colors.cobalt }]}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: Space.lg }}>
            <Eyebrow color={colors.navy}>Quick add</Eyebrow>
            <Text style={[s.pageTitle, { color: colors.text }]}>New shipment</Text>
            <Text style={[s.pageSub, { color: colors.muted }]}>Add the details and we'll start tracking it for you</Text>
          </View>

          <View style={[s.card, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>What's coming in</Text>
            <Field label="Tracking ID" colors={colors}>
              <InputBox value={form.trackingId} onChangeText={(v) => set('trackingId', v)} placeholder="e.g. SHP-2026-0050" colors={colors} />
            </Field>
            <Field label="What is it?" colors={colors}>
              <InputBox value={form.description} onChangeText={(v) => set('description', v)} placeholder="e.g. Industrial Generators (×4)" colors={colors} />
            </Field>
          </View>

          <View style={[s.card, { backgroundColor: colors.card, marginTop: Space.sm }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Route & carrier</Text>
            <Field label="Origin port or city" colors={colors}>
              <InputBox value={form.origin} onChangeText={(v) => set('origin', v)} placeholder="e.g. Shenzhen, CN" colors={colors} />
            </Field>
            <Field label="Carrier" colors={colors}>
              <ChipSelect options={CARRIERS} value={form.carrier} onChange={(v) => set('carrier', v)} colors={colors} />
              {form.carrier === 'Other' && (
                  <View style={{ marginTop: 8 }}>
                    <InputBox value={form.carrierCustom} onChangeText={(v) => set('carrierCustom', v)} placeholder="Enter carrier name" colors={colors} />
                  </View>
              )}
            </Field>
          </View>

          <View style={[s.card, { backgroundColor: colors.card, marginTop: Space.sm }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Goods details</Text>
            <Field label="Type of goods" colors={colors}>
              <ChipSelect options={GOODS_TYPES} value={form.goodsType} onChange={(v) => set('goodsType', v)} colors={colors} />
            </Field>
            <Field label="Weight (kg)" colors={colors}>
              <InputBox value={form.weight} onChangeText={(v) => set('weight', v)} placeholder="e.g. 3200" keyboardType="numeric" colors={colors} />
            </Field>
            <Field label="Estimated arrival" colors={colors}>
              <InputBox value={form.eta} onChangeText={(v) => set('eta', v)} placeholder="YYYY-MM-DD" colors={colors} />
            </Field>
          </View>

          <View style={[s.card, { backgroundColor: colors.card, marginTop: Space.sm }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Anything else?</Text>
            <TextInput
                value={form.notes}
                onChangeText={(v) => set('notes', v)}
                placeholder="Any special instructions or notes…"
                placeholderTextColor={colors.caption}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[s.input, { height: 90, backgroundColor: colors.surfaceAlt, color: colors.text }]}
            />
          </View>

          <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.navy }]} onPress={handleSubmit} activeOpacity={0.88}>
            <Text style={s.submitText}>Add shipment</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn} activeOpacity={0.7}>
            <Text style={[s.cancelText, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Space.lg, paddingBottom: 60 },

  headerRow: { marginBottom: Space.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.pill },
  backText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.xxl, marginTop: 4 },
  pageSub: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm, marginTop: 3 },

  card: { borderRadius: Radius.lg, padding: Space.md, ...CardShadow },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginBottom: Space.md },

  input: {
    borderRadius: Radius.md,
    padding: Space.sm + 4,
    fontFamily: 'Nunito_400Regular',
    fontSize: FontSize.base,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  chipText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },

  submitBtn: {
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Space.lg,
  },
  submitText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.base, color: '#FFFFFF' },

  cancelBtn: { alignItems: 'center', paddingVertical: Space.md },
  cancelText: { fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
