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
  settings: () => request<{ whatsapp: string, retailPercentage: number, wholesalePercentage: number }>("/api/settings"),
  saveSettings: (data: { whatsapp?: string, retailPercentage?: number, wholesalePercentage?: number }) =>
    request<{ ok: boolean; whatsapp: string, retailPercentage: number, wholesalePercentage: number }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  products: () => request<{ products: import("./types").Product[] }>("/api/products"),
  saveProduct: (product: Record<string, unknown>, editing: boolean) =>
    request("/api/products", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(product),
    }),
  orders: () => request<{ orders: import("./types").Order[] }>("/api/orders"),
  updateOrderStatus: (id: string, status: "Novo" | "Entregue") =>
    request<{ ok: boolean; id: string; status: string }>("/api/orders", {
      method: "PUT",
      body: JSON.stringify({ id, status }),
    }),
  catalog: (type: string) =>
    request<{
      products: import("./types").Product[];
      whatsapp: string;
      type: string;
      accordColors: Array<{ name: string; bg: string; text: string }>;
    }>(`/api/catalog?type=${type}`),
  checkout: (data: Record<string, unknown>) =>
    request<{ id: string; total: number }>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
