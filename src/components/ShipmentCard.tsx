import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme, FontSize, Radius, Space, CardShadow } from '../theme';
import { Shipment } from '../types';
import { Eyebrow, StatusBadge, FreightRail, AlertBanner, CostBar, PrimaryButton } from '../components';
import { AlertTriangleIcon, InfoIcon } from '../components/Icons';

interface ShipmentCardProps {
  ship: Shipment;
  onPayNow?: (shipmentId: string) => void;
  paying?: boolean;
  isAdmin?: boolean;
}

function ShipmentCardInner({ ship, onPayNow, paying, isAdmin }: ShipmentCardProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen((v) => !v)} activeOpacity={0.9} style={[s.shipCard, { backgroundColor: colors.card }]}>
      <View style={s.shipTop}>
        <View style={{ flex: 1 }}>
          <View style={s.shipIdRow}>
            <Eyebrow color={colors.navy}>{ship.id}</Eyebrow>
            <StatusBadge status={ship.status} label={ship.statusLabel} />
            {ship.alert && (
              <View style={{ marginLeft: 2 }}>
                {ship.alert.type === 'warning' ? (
                  <AlertTriangleIcon size={14} color={colors.green} />
                ) : (
                  <InfoIcon size={14} color={colors.cobalt} />
                )}
              </View>
            )}
          </View>
          <Text style={[s.shipDesc, { color: colors.text }]}>{ship.description}</Text>
          <Text style={[s.shipMeta, { color: colors.muted }]}>
            {ship.origin} → {ship.destination || 'Tema, GH'}  ·  {ship.carrier}  ·  {ship.weight}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: Space.sm }}>
          <Eyebrow color={colors.caption}>ETA</Eyebrow>
          <Text style={[s.shipEta, { color: colors.text }]}>{ship.eta}</Text>
          <Text style={[s.shipTime, { color: colors.caption }]}>{ship.lastUpdate}</Text>
        </View>
      </View>

      <FreightRail stageIndex={ship.stageIndex} status={ship.status} />

      {open && (
        <View>
          <AlertBanner alert={ship.alert} />
          {/* Quotation display */}
          {ship.quotationAmount != null && (
            <View style={[s.quotationRow, { backgroundColor: colors.surfaceAlt }]}>
              <View style={s.quotationLeft}>
                <Text style={[s.quotationLabel, { color: colors.muted }]}>Quotation</Text>
                <Text style={[s.quotationValue, { color: colors.text }]}>
                  {ship.quotationCurrency || 'GHS'} {Number(ship.quotationAmount).toLocaleString()}
                </Text>
              </View>
              <View style={s.quotationRight}>
                <Text style={[s.paymentLabel, { color: colors.muted }]}>
                  {ship.paymentStatus === 'PAID' ? 'Paid' : ship.paymentStatus === 'PARTIAL' ? `Paid ${ship.quotationCurrency || 'GHS'} ${Number(ship.amountPaid || 0).toLocaleString()}` : 'Unpaid'}
                </Text>
                <Text style={[s.paymentStatusText, {
                  color: ship.paymentStatus === 'PAID' ? colors.green : ship.paymentStatus === 'PARTIAL' ? colors.orange : colors.caption
                }]}>
                  {ship.paymentStatus === 'PAID' ? '✓' : ship.paymentStatus === 'PARTIAL' ? '◐' : '○'}
                </Text>
              </View>
            </View>
          )}
          <CostBar costs={ship.costs} />
          {ship.rawStatus === 'PENDING_PAYMENT' && onPayNow && (
            <TouchableOpacity
              style={[s.payNowButton, { backgroundColor: colors.green }]}
              onPress={() => onPayNow(ship.id)}
              disabled={paying}
              activeOpacity={0.9}
            >
              <Text style={s.payNowButtonText}>{paying ? 'Processing...' : 'Pay Now'}</Text>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', marginTop: Space.md, flexWrap: 'wrap' }}>
            {isAdmin && <PrimaryButton label="Update status" color={colors.cobalt} />}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export const ShipmentCard = memo(ShipmentCardInner);

const s = StyleSheet.create({
  shipCard: { borderRadius: Radius.lg, padding: Space.md, marginBottom: Space.sm, ...CardShadow },
  quotationRow: { flexDirection: 'row', borderRadius: Radius.md, padding: Space.sm, marginBottom: Space.sm },
  quotationLeft: { flex: 1 },
  quotationLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  quotationValue: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.base, marginTop: 2 },
  quotationRight: { alignItems: 'flex-end', justifyContent: 'center' },
  paymentLabel: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  paymentStatusText: { fontFamily: 'Poppins_700Bold', fontSize: FontSize.lg, marginTop: 2 },
  shipTop: { flexDirection: 'row', alignItems: 'flex-start' },
  shipIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' },
  shipDesc: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md, marginBottom: 3 },
  shipMeta: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs },
  shipEta: { fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm, marginTop: 4 },
  shipTime: { fontFamily: 'Nunito_400Regular', fontSize: FontSize.xs, marginTop: 4 },
  payNowButton: { borderRadius: Radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: Space.md },
  payNowButtonText: { color: '#FFFFFF', fontFamily: 'Nunito_700Bold', fontSize: FontSize.sm },
});
