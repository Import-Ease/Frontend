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
  AdminDashboard: undefined; // Add this
  AddShipment: undefined;
};

export type MainTabParamList = {
  Shipments: undefined;
  Alerts: undefined;
  Calculator: undefined;
};

