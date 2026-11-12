import {
  saveProductToFirebase,
  saveProductsBatchToFirebase,
  deleteProductFromFirebase,
  saveOrderToFirebase,
  updateOrderStatusInFirebase,
  saveSettingsToFirebase,
  getProductsFromFirebase,
  getOrdersFromFirebase,
  getSettingsFromFirebase,
  subscribeProducts,
  subscribeOrders,
} from "./lib/firebaseService";
import {
  firebaseChangePassword,
  firebaseSignIn,
  firebaseSignOut,
  currentUserEmail,
} from "./lib/firebaseAuth";
import { auth } from "./lib/firebase";
import {
  parseProductsCsv,
  generateCsvTemplate,
  parseUploadedSpreadsheet,
  downloadExcelTemplate,
} from "./lib/csvParser";

export const api = {
  // Autenticação Firebase pura
  session: async () => {
    try {
      await auth.authStateReady();
      if (auth.currentUser) return { authenticated: true, email: auth.currentUser.email };
    } catch {}
    return { authenticated: false };
  },
  login: async (email: string, password: string) => {
    const idToken = await firebaseSignIn(email, password);
    return { ok: true, email, idToken };
  },
  logout: async () => {
    await firebaseSignOut();
    return { ok: true };
  },
  changePassword: async (current: string, next: string) => {
    await firebaseChangePassword(current, next);
    return { ok: true };
  },
  currentEmail: currentUserEmail,

  // Configurações (WhatsApp, porcentagens de precificação)
  settings: async () => {
    try {
      return await getSettingsFromFirebase();
    } catch (e) {
      console.warn("Erro ao ler configurações do Firebase:", e);
      return { whatsapp: "", retailPercentage: 0, wholesalePercentage: 0 };
    }
  },
  saveSettings: async (data: {
    whatsapp?: string;
    retailPercentage?: number;
    wholesalePercentage?: number;
  }) => {
    await saveSettingsToFirebase(data);
    return {
      ok: true,
      whatsapp: data.whatsapp || "",
      retailPercentage: data.retailPercentage || 0,
      wholesalePercentage: data.wholesalePercentage || 0,
    };
  },

  // Produtos (CRUD direto no Firestore)
  products: async () => {
    try {
      const products = await getProductsFromFirebase();
      return { products };
    } catch (e) {
      console.warn("Erro ao buscar produtos do Firebase:", e);
      return { products: [] };
    }
  },
  saveProduct: async (product: Record<string, unknown>, editing: boolean) => {
    await saveProductToFirebase(product as any);
    return { ok: true, product };
  },
  deleteProduct: async (id: string) => {
    await deleteProductFromFirebase(id);
    return { ok: true };
  },

  // Pedidos (Firestore)
  orders: async () => {
    try {
      const orders = await getOrdersFromFirebase();
      return { orders };
    } catch (e) {
      console.warn("Erro ao buscar pedidos do Firebase:", e);
      return { orders: [] };
    }
  },
  updateOrderStatus: async (id: string, status: "Novo" | "Entregue") => {
    await updateOrderStatusInFirebase(id, status);
    return { ok: true, id, status };
  },

  // Catálogo Público (Firestore com precificação inteligente)
  catalog: async (type: string) => {
    const [products, settings] = await Promise.all([
      getProductsFromFirebase().catch(() => []),
      getSettingsFromFirebase().catch(() => ({
        whatsapp: "",
        retailPercentage: 0,
        wholesalePercentage: 0,
      })),
    ]);

    const isWholesale = type === "atacado";
    const mapped = products
      .filter((p) => p.active !== false)
      .map((p) => {
        let price = isWholesale ? p.wholesalePrice || p.retailPrice : p.retailPrice;
        if (!price && p.costPrice) {
          const markup = isWholesale
            ? settings.wholesalePercentage || 15
            : settings.retailPercentage || 30;
          price = p.costPrice * (1 + markup / 100);
        }
        return {
          ...p,
          price: Math.round((price || 0) * 100) / 100,
        };
      });

    return {
      type,
      products: mapped,
      whatsapp: settings.whatsapp || "",
      accordColors: [],
    };
  },

  // Checkout (cliente anônimo gravando pedido no Firestore)
  checkout: async (data: Record<string, unknown>) => {
    const id = (data.id as string) || `PED-${Date.now().toString(36).toUpperCase()}`;
    const orderData = {
      ...data,
      id,
      date: new Date().toISOString(),
      status: "Novo",
    };
    await saveOrderToFirebase(orderData as any);
    return { id, total: (data.total as number) || 0 };
  },

  // Importação e gestão de planilhas (Excel .xlsx, .xls e CSV)
  importSpreadsheetFile: async (file: File) => {
    const settings = await getSettingsFromFirebase().catch(() => ({
      whatsapp: "",
      retailPercentage: 30,
      wholesalePercentage: 15,
    }));
    const products = await parseUploadedSpreadsheet(file, settings);
    if (!products.length)
      throw new Error("Nenhum produto válido foi identificado na planilha.");
    const count = await saveProductsBatchToFirebase(products);
    return { count, total: products.length, products };
  },
  parseSpreadsheetFile: async (file: File) => {
    const settings = await getSettingsFromFirebase().catch(() => ({
      whatsapp: "",
      retailPercentage: 30,
      wholesalePercentage: 15,
    }));
    return parseUploadedSpreadsheet(file, settings);
  },
  importCsv: async (csvText: string) => {
    const settings = await getSettingsFromFirebase().catch(() => ({
      whatsapp: "",
      retailPercentage: 30,
      wholesalePercentage: 15,
    }));
    const products = parseProductsCsv(csvText, settings);
    if (!products.length) throw new Error("Nenhum produto válido encontrado no arquivo CSV.");
    const count = await saveProductsBatchToFirebase(products);
    return { count, total: products.length, products };
  },
  parseCsv: async (csvText: string) => {
    const settings = await getSettingsFromFirebase().catch(() => ({
      whatsapp: "",
      retailPercentage: 30,
      wholesalePercentage: 15,
    }));
    return parseProductsCsv(csvText, settings);
  },
  generateCsvTemplate: () => generateCsvTemplate(),
  downloadExcelTemplate: () => downloadExcelTemplate(),

  // Subscrições opcionais em tempo real
  subscribeProducts,
  subscribeOrders,
};
