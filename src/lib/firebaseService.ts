import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Order } from "../types";

export type SyncMetadata = {
  lastSyncAt: string | null;
  productCount: number;
  orderCount: number;
  status: "idle" | "syncing" | "success" | "error";
  errorMessage?: string;
};

export type AppSettings = {
  whatsapp: string;
  retailPercentage: number;
  wholesalePercentage: number;
};

// ==========================================
// 1. SINCRONIZAÇÃO COMPLETA: API -> FIREBASE
// ==========================================
export async function syncApiToFirebase(): Promise<SyncMetadata> {
  const metaRef = doc(db, "metadata", "sync");

  // Marca início do sync
  await setDoc(metaRef, { status: "syncing", startedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

  try {
    // 1. Puxa dados da API
    const [productsRes, ordersRes, settingsRes] = await Promise.all([
      fetch("/api/products", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .catch(() => ({ products: [] })),
      fetch("/api/orders", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { orders: [] }))
        .catch(() => ({ orders: [] })),
      fetch("/api/settings", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({})),
    ]);

    const apiProducts: Product[] = productsRes.products || [];
    const apiOrders: Order[] = ordersRes.orders || [];

    // 2. Grava Produtos em Batch no Firestore
    if (apiProducts.length > 0) {
      const batch = writeBatch(db);
      for (const prod of apiProducts) {
        if (!prod.id) continue;
        const ref = doc(db, "products", String(prod.id));
        batch.set(ref, {
          ...prod,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
    }

    // 3. Grava Pedidos em Batch no Firestore
    if (apiOrders.length > 0) {
      const batch = writeBatch(db);
      for (const order of apiOrders) {
        if (!order.id) continue;
        const ref = doc(db, "orders", String(order.id));
        batch.set(ref, {
          ...order,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
    }

    // 4. Grava Configurações
    if (settingsRes && (settingsRes.whatsapp !== undefined || settingsRes.retailPercentage !== undefined)) {
      await setDoc(doc(db, "settings", "general"), {
        whatsapp: settingsRes.whatsapp || "",
        retailPercentage: Number(settingsRes.retailPercentage) || 0,
        wholesalePercentage: Number(settingsRes.wholesalePercentage) || 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    const meta: SyncMetadata = {
      lastSyncAt: new Date().toISOString(),
      productCount: apiProducts.length,
      orderCount: apiOrders.length,
      status: "success",
    };

    await setDoc(metaRef, meta, { merge: true });
    return meta;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao sincronizar";
    const meta: SyncMetadata = {
      lastSyncAt: null,
      productCount: 0,
      orderCount: 0,
      status: "error",
      errorMessage: errorMsg,
    };
    await setDoc(metaRef, meta, { merge: true }).catch(() => {});
    throw error;
  }
}

// ==========================================
// 2. LEITURA DIRETA DO FIREBASE
// ==========================================

export async function getProductsFromFirebase(): Promise<Product[]> {
  const col = collection(db, "products");
  const snap = await getDocs(col);
  const items: Product[] = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() } as Product);
  });
  return items;
}

export async function getOrdersFromFirebase(): Promise<Order[]> {
  const col = collection(db, "orders");
  const snap = await getDocs(col);
  const items: Order[] = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() } as Order);
  });
  return items;
}

export async function getSettingsFromFirebase(): Promise<AppSettings> {
  const ref = doc(db, "settings", "general");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    return {
      whatsapp: d.whatsapp || "",
      retailPercentage: Number(d.retailPercentage) || 0,
      wholesalePercentage: Number(d.wholesalePercentage) || 0,
    };
  }
  return { whatsapp: "", retailPercentage: 0, wholesalePercentage: 0 };
}

// ==========================================
// 3. LISTENERS EM TEMPO REAL (onSnapshot)
// ==========================================

export function subscribeProducts(onChange: (products: Product[]) => void): Unsubscribe {
  const col = collection(db, "products");
  return onSnapshot(col, (snap) => {
    const list: Product[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
    onChange(list);
  }, (err) => {
    console.warn("Erro ao escutar produtos do Firebase:", err);
  });
}

export function subscribeOrders(onChange: (orders: Order[]) => void): Unsubscribe {
  const col = collection(db, "orders");
  return onSnapshot(col, (snap) => {
    const list: Order[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Order));
    onChange(list);
  }, (err) => {
    console.warn("Erro ao escutar pedidos do Firebase:", err);
  });
}

export function subscribeSyncStatus(onChange: (meta: SyncMetadata) => void): Unsubscribe {
  const ref = doc(db, "metadata", "sync");
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      onChange(snap.data() as SyncMetadata);
    }
  }, () => {});
}

// ==========================================
// 4. ESCRITA & ATUALIZAÇÃO NO FIREBASE
// ==========================================

export async function saveProductToFirebase(product: Partial<Product> & { id?: string }): Promise<void> {
  const id = product.id || String(Date.now());
  const ref = doc(db, "products", id);
  await setDoc(ref, {
    ...product,
    id,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveOrderToFirebase(order: Partial<Order> & { id?: string }): Promise<void> {
  const id = order.id || `PED-${Date.now()}`;
  const ref = doc(db, "orders", id);
  await setDoc(ref, {
    ...order,
    id,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateOrderStatusInFirebase(id: string, status: "Novo" | "Entregue"): Promise<void> {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function saveSettingsToFirebase(settings: Partial<AppSettings>): Promise<void> {
  const ref = doc(db, "settings", "general");
  await setDoc(ref, {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
