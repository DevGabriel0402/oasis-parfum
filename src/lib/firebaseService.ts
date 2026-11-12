import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Order } from "../types";

export type Unsubscribe = () => void;

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

// Firestore rejeita campos "undefined"; remove-os antes de gravar
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Salva múltiplos produtos em lote (WriteBatch) no Firestore.
 */
export async function saveProductsBatchToFirebase(
  products: Array<Partial<Product>>,
): Promise<number> {
  const valid = products.filter((p) => p && (p.name || p.id));
  let written = 0;

  for (let i = 0; i < valid.length; i += 450) {
    const chunk = valid.slice(i, i + 450);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const id = String(
        item.id ||
          item.slug ||
          `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      );
      const ref = doc(db, "products", id);
      batch.set(
        ref,
        {
          ...clean(item),
          id,
          active: item.active !== false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();
    written += chunk.length;
  }

  return written;
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

export async function getSyncStatus(): Promise<SyncMetadata | null> {
  try {
    const ref = doc(db, "metadata", "sync");
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as SyncMetadata) : null;
  } catch {
    return null;
  }
}

export function subscribeProducts(onChange: (products: Product[]) => void): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let active = true;
  const timer = setTimeout(() => {
    if (!active) return;
    try {
      const col = collection(db, "products");
      unsub = onSnapshot(
        col,
        (snap) => {
          if (!active) return;
          const list: Product[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
          onChange(list);
        },
        (err) => console.warn("Erro ao escutar produtos do Firebase:", err),
      );
    } catch (e) {
      console.warn("subscribeProducts error:", e);
    }
  }, 100);

  return () => {
    active = false;
    clearTimeout(timer);
    if (unsub) {
      try {
        unsub();
      } catch {}
    }
  };
}

export function subscribeOrders(onChange: (orders: Order[]) => void): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let active = true;
  const timer = setTimeout(() => {
    if (!active) return;
    try {
      const col = collection(db, "orders");
      unsub = onSnapshot(
        col,
        (snap) => {
          if (!active) return;
          const list: Order[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Order));
          onChange(list);
        },
        (err) => console.warn("Erro ao escutar pedidos do Firebase:", err),
      );
    } catch (e) {
      console.warn("subscribeOrders error:", e);
    }
  }, 100);

  return () => {
    active = false;
    clearTimeout(timer);
    if (unsub) {
      try {
        unsub();
      } catch {}
    }
  };
}

export function subscribeSyncStatus(onChange: (meta: SyncMetadata) => void): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let active = true;
  const timer = setTimeout(() => {
    if (!active) return;
    try {
      const ref = doc(db, "metadata", "sync");
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (!active) return;
          if (snap.exists()) {
            onChange(snap.data() as SyncMetadata);
          }
        },
        (err) => console.warn("Firestore sync status error:", err),
      );
    } catch (e) {
      console.warn("subscribeSyncStatus error:", e);
    }
  }, 100);

  return () => {
    active = false;
    clearTimeout(timer);
    if (unsub) {
      try {
        unsub();
      } catch {}
    }
  };
}

// ==========================================
// 4. ESCRITA & ATUALIZAÇÃO NO FIREBASE
// ==========================================

export async function saveProductToFirebase(product: Partial<Product> & { id?: string }): Promise<void> {
  const id = product.id || String(Date.now());
  const ref = doc(db, "products", id);
  await setDoc(ref, {
    ...clean(product),
    id,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteProductFromFirebase(id: string): Promise<void> {
  const ref = doc(db, "products", String(id));
  await deleteDoc(ref);
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
