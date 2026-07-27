const USE_LOCAL_BACKEND = process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true';
const API_BASE_URL = USE_LOCAL_BACKEND
  ? 'http://10.0.2.2:8080'
  : 'https://importease-backend.onrender.com';

function clearAuth() {
  (globalThis as any).__IMPORT_EASE_TOKEN__ = undefined;
  (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = undefined;
  (globalThis as any).__IMPORT_EASE_USERNAME__ = undefined;
  (globalThis as any).__IMPORT_EASE_EMAIL__ = undefined;
  (globalThis as any).__IMPORT_EASE_ROLE__ = undefined;
  import('../services/storage').then(m => m.clearAuthState()).catch(() => {});
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? 'GET';

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
    if (res.status === 401) {
      clearAuth();
      throw new Error('Session expired. Please log in again.');
    }
    const message = typeof data === 'string' ? data : data?.error || data?.message || 'Request failed';
    throw new Error(message);
  }

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

export async function forgotPassword(email: string) {
  return request<any>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  return request<any>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otpCode, newPassword }),
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

/* ── User Profile ─────────────────────────────────────── */

export async function fetchUserProfile(token: string) {
  return request<any>('/api/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateUserProfile(updates: Record<string, string>, token: string) {
  return request<any>('/api/users/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
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

/* ── Admin Users ─────────────────────────────────────── */

export async function getAdminUsers(token: string, query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : '';
  return request<any[]>(`/api/admin/users${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminUser(id: string, token: string) {
  return request<any>(`/api/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function toggleUserStatus(id: string, enabled: boolean, token: string) {
  return request<void>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  });
}

export async function updateUserRole(id: string, role: string, token: string) {
  return request<void>(`/api/admin/users/${id}/role`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
}

export async function resetUserPassword(id: string, password: string, token: string) {
  return request<void>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
}

export async function deleteUser(id: string, token: string) {
  return request<void>(`/api/admin/users/${id}`, {
    method: 'DELETE',
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

export async function getAdminShipmentDetail(shipmentId: string, token: string) {
  return request<any>(`/api/admin/shipments/${shipmentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminShipmentStages(shipmentId: string, token: string) {
  return request<any[]>(`/api/admin/shipments/${shipmentId}/stages`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminUpdateShipment(shipmentId: string, fields: Record<string, any>, token: string) {
  return request<any>(`/api/admin/shipments/${shipmentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(fields),
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

export async function verifyPayment(reference: string) {
  return request<any>(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
}

/* ── Product Search ───────────────────────────────────── */

export async function searchProducts(query: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request<any[]>(`/api/search?query=${encodeURIComponent(query)}`, { headers });
}

export async function getProductById(id: string) {
  return request<any>(`/api/products/${id}`);
}

/* ── Search History ─────────────────────────────────── */

export async function fetchSearchHistory(token: string) {
  return request<any[]>('/api/search/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteSearchHistoryItem(logId: number, token: string) {
  return request<void>(`/api/search/history/${logId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function clearSearchHistory(token: string) {
  return request<void>('/api/search/history', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* ── Reviews ─────────────────────────────────────────── */

export async function fetchReviewsByProduct(productId: string) {
  return request<any[]>(`/api/reviews/product/${productId}`);
}

/* ── Orders (Place Order flow) ──────────────────────── */

export async function createOrder(payload: { productId: number; shippingMode: string; destination: string; quantity: number }, token: string) {
  return request<any>('/api/shipments/order', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
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

/* ── Admin Documents ─────────────────────────────────── */
export async function getAdminShipmentDocuments(shipmentId: string, token: string) {
  return request<any[]>(`/api/admin/shipments/${shipmentId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function uploadAdminShipmentDocument(
  shipmentId: string,
  file: any,
  documentType: string,
  token: string,
) {
  const url = `${API_BASE_URL}/api/admin/shipments/${shipmentId}/documents`;
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.fileName || 'document.pdf', type: file.mimeType || 'application/octet-stream' } as any);
  form.append('documentType', documentType);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = text; }
    const message = typeof data === 'string' ? data : data?.error || data?.message || 'Upload failed';
    throw new Error(message);
  }
  return res.json();
}

/* ── Admin Event Log ─────────────────────────────────── */
export async function getAdminShipmentEvents(shipmentId: string, token: string) {
  return request<any[]>(`/api/admin/shipments/${shipmentId}/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* ── Admin Checkpoints ───────────────────────────────── */
export async function getAdminShipmentCheckpoints(shipmentId: string, token: string) {
  return request<any[]>(`/api/admin/shipments/${shipmentId}/checkpoints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addAdminShipmentCheckpoint(
  shipmentId: string,
  location: string,
  description: string,
  token: string,
) {
  return request<any>(`/api/admin/shipments/${shipmentId}/checkpoints`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ location, description }),
  });
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

/* ── Uploads ──────────────────────────────────────────── */

export async function getUploadSignature() {
  return request<any>('/api/uploads/signature');
}
