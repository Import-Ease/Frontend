import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, Space, Radius, CardShadow, FontSize } from '../theme';
import { SHIPMENTS } from '../data/shipments';
import { StatusBadge, PrimaryButton } from '../components';

export default function AdminDashboardScreen() {
    const { colors } = useAppTheme();
    const [data] = useState(SHIPMENTS);

    const advanceShipment = (id: string) => {
        Alert.alert('Admin Action', `Advancing shipment ${id} to the next logistics stage.`);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Text style={[s.title, { color: colors.text }]}>Admin Control Panel</Text>
                <Text style={{ color: colors.green, fontFamily: 'Nunito_700Bold', fontSize: FontSize.xs }}>
                    INTERNAL USE ONLY
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: Space.md }}>
                <Text style={[s.sectionLabel, { color: colors.muted }]}>GLOBAL SHIPMENTS</Text>

                {data.map((ship) => (
                    <View key={ship.id} style={[s.adminCard, { backgroundColor: colors.card }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: colors.navy, fontFamily: 'Poppins_700Bold', fontSize: FontSize.sm }}>
                                {ship.id}
                            </Text>
                            <StatusBadge status={ship.status} label={ship.statusLabel} />
                        </View>

                        <Text style={{ color: colors.text, marginTop: 5, fontFamily: 'Nunito_400Regular', fontSize: FontSize.sm }}>
                            {ship.description}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: FontSize.xs, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                            User: Nana Afia Oppong
                        </Text>

                        <View style={[s.actionRow, { borderTopColor: colors.border }]}>
                            <PrimaryButton
                                label="Advance Stage"
                                color={colors.cobalt}
                                onPress={() => advanceShipment(ship.id)}
                            />
                            <PrimaryButton label="Edit" ghost />
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    header: { padding: Space.lg, borderBottomWidth: 1 },
    title: { fontSize: FontSize.xl, fontFamily: 'Poppins_700Bold' },
    sectionLabel: { fontSize: FontSize.xs, fontFamily: 'Nunito_700Bold', marginBottom: 10, letterSpacing: 1 },
    adminCard: { padding: Space.md, borderRadius: Radius.md, marginBottom: Space.sm, ...CardShadow },
    actionRow: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, paddingTop: 10 },
});