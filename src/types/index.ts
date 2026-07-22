export type ShipmentStatus = 'origin' | 'transit' | 'port' | 'customs' | 'delivered';

export type AlertType = 'warning' | 'info';

export interface ShipmentAlert {
  type: AlertType;
  msg: string;
}

export interface ShipmentCosts {
  shipping: number;
  harbour: number;
  duties: number;
  transport: number;
}

export interface Shipment {
  id: string;
  description: string;
  origin: string;
  destination: string;
  carrier: string;
  goodsType: string;
  weight: string;
  eta: string;
  status: ShipmentStatus;
  statusLabel: string;
  stageIndex: number;
  alert: ShipmentAlert | null;
  costs: ShipmentCosts;
  lastUpdate: string;
  rawStatus: string;
  productId: number | null;
  shippingMode: string | null;
  orderQuantity: number | null;
}

export interface ShipmentSummary {
  active: number;
  alerts: number;
  cleared: number;
  totalCosts: string;
}

/** Navigation param lists, used with @react-navigation typed hooks. */
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminShipmentDetail: { shipmentId: string };
  AddShipment: undefined;
  ProductDetail: { productId: string; productName?: string };
  PlaceOrder: { productId: string; productName: string; productPrice: number; imageUrl: string; supplierName: string };
};

export type MainTabParamList = {
  Shipments: undefined;
  SearchProducts: undefined;
  MyProducts: undefined;
  SupplierProfile: undefined;
  Alerts: undefined;
  Calculator: undefined;
  Settings: undefined;
};

export interface Product {
  id: string;
  productName: string;
  description: string;
  productPrice: number;
  quantity: number;
  imageUrl: string;
  supplierName: string;
  supplierContact: string;
}

export interface SupplierProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  shippingOrigin: string;
  ownerId: string;
}

/* ── Backend → Frontend mapping ────────────────────────── */

const STAGE_ORDER: Record<string, { status: ShipmentStatus; index: number; label: string }> = {
  ORDER_CREATED:   { status: 'origin',   index: 0, label: 'Order Created' },
  SUPPLIER_CONFIRMED: { status: 'origin',   index: 0, label: 'Supplier Confirmed' },
  SUPPLIER_PAID:   { status: 'origin',   index: 0, label: 'Supplier Paid' },
  AWAITING_PICKUP: { status: 'origin',   index: 0, label: 'Awaiting Pickup' },
  COLLECTED:       { status: 'origin',   index: 0, label: 'Collected' },
  ORIGIN_WAREHOUSE:{ status: 'origin',   index: 0, label: 'Origin Warehouse' },
  EXPORT_CUSTOMS:  { status: 'origin',   index: 0, label: 'Export Customs' },
  IN_TRANSIT:      { status: 'transit',  index: 1, label: 'In Transit' },
  DESTINATION_PORT:{ status: 'port',     index: 2, label: 'Destination Port' },
  IMPORT_CUSTOMS:  { status: 'customs',  index: 3, label: 'Import Customs' },
  WAREHOUSE:       { status: 'customs',  index: 3, label: 'Warehouse' },
  OUT_FOR_DELIVERY:{ status: 'transit',  index: 1, label: 'Out for Delivery' },
  DELIVERED:       { status: 'delivered', index: 4, label: 'Delivered' },
  PENDING_PAYMENT: { status: 'origin',   index: 0, label: 'Pending Payment' },
  PENDING:         { status: 'origin',   index: 0, label: 'Pending' },
  ORIGIN:          { status: 'origin',   index: 0, label: 'At Origin' },
  TRANSIT:         { status: 'transit',  index: 1, label: 'In Transit' },
  AT_PORT:         { status: 'port',     index: 2, label: 'At Port' },
  CUSTOMS:         { status: 'customs',  index: 3, label: 'At Customs' },
  ARCHIVED:        { status: 'delivered', index: 4, label: 'Archived' },
};

function calcLandedCost(weightKg: number | null): ShipmentCosts {
  const w = weightKg ?? 0;
  return {
    shipping: Math.round(w * 2.95 * 100) / 100,
    harbour: 200,
    duties: Math.round(w * 0.354 * 100) / 100,
    transport: 150,
  };
}

function deriveAlert(
  backendStatus: string,
  stages: any[] | undefined,
): ShipmentAlert | null {
  if (backendStatus === 'CUSTOMS') {
    return { type: 'warning', msg: 'Customs paperwork may need attention before this shipment can clear.' };
  }
  if (backendStatus === 'AT_PORT') {
    return { type: 'info', msg: 'Vessel has arrived at port. Ready for customs processing.' };
  }
  if (stages && stages.length > 0) {
    const latest = stages[stages.length - 1];
    if (latest?.note) {
      return { type: 'info', msg: latest.note };
    }
  }
  return null;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

/**
 * Transform a raw backend Shipment JSON object into the frontend Shipment shape.
 * Backend fields: id, trackingId, description, goodsType, carrier, originPort,
 *   destinationPort, weightKg, estimatedTimeOfArrival, status, archived, createdAt, stages
 */
export function mapBackendShipment(raw: any): Shipment {
  const mapped = STAGE_ORDER[raw.status] ?? STAGE_ORDER.PENDING;
  return {
    id: raw.trackingId ?? raw.id?.slice(0, 8) ?? 'SHP-???',
    description: raw.description ?? '',
    origin: raw.originPort ?? '',
    destination: raw.destinationPort ?? 'Tema, GH',
    carrier: raw.carrier ?? '',
    goodsType: raw.goodsType ?? '',
    weight: raw.weightKg != null ? `${Number(raw.weightKg).toLocaleString()} kg` : '',
    eta: raw.estimatedTimeOfArrival ?? '',
    status: mapped.status,
    statusLabel: mapped.label,
    stageIndex: mapped.index,
    alert: deriveAlert(raw.status, raw.stages),
    costs: calcLandedCost(raw.weightKg),
    lastUpdate: formatDate(raw.createdAt),
    rawStatus: raw.status ?? 'PENDING',
    productId: raw.productId ?? null,
    shippingMode: raw.shippingMode ?? null,
    orderQuantity: raw.orderQuantity ?? null,
  };
}

/**
 * Compute summary stats from a list of backend shipment objects.
 */
export function computeSummary(backendShipments: any[], totalLandedCost?: number): ShipmentSummary {
  const active = backendShipments.filter((s) => s.status !== 'ARCHIVED' && s.status !== 'DELIVERED').length;
  const cleared = backendShipments.filter((s) => s.status === 'DELIVERED').length;
  const alerts = backendShipments.filter((s) => s.status === 'CUSTOMS' || s.status === 'AT_PORT').length;
  const cost = totalLandedCost ?? backendShipments.reduce((sum, s) => {
    const w = s.weightKg ?? 0;
    return sum + w * 2.95 + 200 + w * 0.354 + 150;
  }, 0);
  return {
    active,
    alerts,
    cleared,
    totalCosts: `GHS ${Math.round(cost).toLocaleString()}`,
  };
}
