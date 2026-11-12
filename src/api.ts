import {
  saveProductToFirebase,
  saveOrderToFirebase,
  updateOrderStatusInFirebase,
  saveSettingsToFirebase,
  syncApiToFirebase,
} from "./lib/firebaseService";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}

export const api = {
  session: () => request<{ authenticated: boolean }>("/api/auth?action=session"),
  login: (password: string) =>
    request("/api/auth?action=login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () => request("/api/auth?action=logout", { method: "POST" }),
  changePassword: (current: string, next: string) =>
    request<{ ok: boolean }>("/api/auth?action=password", {
      method: "PUT",
      body: JSON.stringify({ current, next }),
    }),
  settings: () => request<{ whatsapp: string; retailPercentage: number; wholesalePercentage: number }>("/api/settings"),
  saveSettings: async (data: { whatsapp?: string; retailPercentage?: number; wholesalePercentage?: number }) => {
    const res = await request<{ ok: boolean; whatsapp: string; retailPercentage: number; wholesalePercentage: number }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    saveSettingsToFirebase(data).catch((err) => console.warn("Firebase sync settings error:", err));
    return res;
  },
  products: () => request<{ products: import("./types").Product[] }>("/api/products"),
  saveProduct: async (product: Record<string, unknown>, editing: boolean) => {
    const res = await request("/api/products", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(product),
    });
    saveProductToFirebase(product as any).catch((err) => console.warn("Firebase sync product error:", err));
    return res;
  },
  orders: () => request<{ orders: import("./types").Order[] }>("/api/orders"),
  updateOrderStatus: async (id: string, status: "Novo" | "Entregue") => {
    const res = await request<{ ok: boolean; id: string; status: string }>("/api/orders", {
      method: "PUT",
      body: JSON.stringify({ id, status }),
    });
    updateOrderStatusInFirebase(id, status).catch((err) => console.warn("Firebase sync order status error:", err));
    return res;
  },
  catalog: (type: string) =>
    request<{
      products: import("./types").Product[];
      whatsapp: string;
      type: string;
      accordColors: Array<{ name: string; bg: string; text: string }>;
    }>(`/api/catalog?type=${type}`),
  checkout: async (data: Record<string, unknown>) => {
    const res = await request<{ id: string; total: number }>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
    saveOrderToFirebase({
      ...data,
      id: res.id,
      total: res.total,
      date: new Date().toISOString(),
      status: "Novo",
    } as any).catch((err) => console.warn("Firebase sync checkout error:", err));
    return res;
  },
  // Firebase Sync
  syncWithFirebase: () => syncApiToFirebase(),
};
