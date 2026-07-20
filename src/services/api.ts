const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? 'GET';
  console.log(`[API] ${method} ${url}`);

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    console.log(`[API] ${method} ${url} => ${res.status}`, data);
    const message = typeof data === 'string' ? data : data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }

  console.log(`[API] ${method} ${url} => ${res.status} OK`);
  return data as T;
}

/* ── Auth ──────────────────────────────────────────────── */

export async function loginUser(username: string, password: string) {
  return request<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(username: string, email: string, password: string, role: string = 'IMPORTER') {
  return request<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role }),
  });
}

export async function deleteMyAccount(password: string, token: string) {
  const maskedToken = token ? `${token.substring(0, 10)}...` : '(empty)';
  console.log('[API] deleteMyAccount called', { tokenPreview: maskedToken, hasPassword: !!password });
  return request<any>('/api/users/me', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
}



/* ── Shipments ─────────────────────────────────────────── */

export async function fetchShipments(token: string) {
  return request<any[]>('/api/shipments', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createShipment(payload: any, token: string) {
  return request<any>('/api/shipments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function fetchTotalCost(token: string) {
  return request<{ totalLandedCost: number }>('/api/shipments/total-cost', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* ── Admin Shipments ───────────────────────────────────── */

export async function getAllShipmentsAdmin(token: string) {
  return request<any[]>('/api/admin/shipments', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function advanceShipmentStage(
  shipmentId: string,
  stageName: string,
  note: string | null,
  token: string,
) {
  return request<any>(`/api/admin/shipments/${shipmentId}/advance-stage`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ stageName, note }),
  });
}

/* ── Calculator ────────────────────────────────────────── */

export interface CalculatorParams {
  origin: string;
  goodsType: string;
  weightKg: number;
  insurance?: boolean;
}

export interface CalculatorResult {
  shipping: number;
  harbour: number;
  duties: number;
  transport: number;
  insurance: number;
  total: number;
}

export async function calculateCost(params: CalculatorParams) {
  const qs = new URLSearchParams({
    origin: params.origin,
    goodsType: params.goodsType,
    weightKg: String(params.weightKg),
    insurance: String(params.insurance ?? false),
  });
  return request<CalculatorResult>(`/api/calculator?${qs.toString()}`);
}

/* ── Payments ──────────────────────────────────────────── */

export async function initializePayment(payload: any, token: string) {
  return request<any>('/api/payments/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

/* ── Product Search ───────────────────────────────────── */

export async function searchProducts(query: string) {
  return request<any[]>(`/api/search?query=${encodeURIComponent(query)}`);
}

/* ── Supplier Profile ────────────────────────────────── */

export async function fetchMySupplierProfile(token: string) {
  return request<any>('/api/suppliers/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSupplierProfile(payload: any, token: string) {
  return request<any>('/api/suppliers/me', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateSupplierProfile(payload: any, token: string) {
  return request<any>('/api/suppliers/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

/* ── Supplier Products ───────────────────────────────── */

export async function fetchMyProducts(token: string) {
  return request<any[]>('/api/products/mine', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* ── Supplier Subscription ──────────────────────────── */

export async function fetchMyProductCount(token: string) {
  return request<{ productCount: number; subscriptionTier: string; paidUntil: string | null }>(
    '/api/suppliers/me/product-count',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function initiateSubscriptionUpgrade(token: string) {
  return request<{ reference: string; authorizationUrl: string; amount: number; currency: string }>(
    '/api/suppliers/me/upgrade',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

/* ── Supplier Products CRUD ─────────────────────────── */

export async function createProduct(payload: any, token: string) {
  return request<any>('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: any, token: string) {
  return request<any>(`/api/products/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string, token: string) {
  return request<any>(`/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
