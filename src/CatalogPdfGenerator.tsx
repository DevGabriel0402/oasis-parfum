import { useState, useEffect, useRef } from "react";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { FiDownload, FiPrinter, FiDatabase, FiCheckCircle, FiLoader } from "react-icons/fi";
import type { Product } from "./types";
import { getProductsFromFirebase } from "./lib/firebaseService";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export type CatalogPdfOptions = {
  cost: boolean;
  retail: boolean;
  wholesale: boolean;
  profit: boolean;
  stock: boolean;
};

// ==========================================
// ESTILOS DO CATÁLOGO DE LUXO (REVISTA / VITRINE)
// ==========================================
const styles = StyleSheet.create({
  // Capa
  coverPage: {
    backgroundColor: "#0d1412",
    color: "#ffffff",
    fontFamily: "Helvetica",
    padding: 40,
    justifyContent: "space-between",
  },
  coverBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#c5a880",
    borderRadius: 4,
    padding: 30,
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverTop: {
    alignItems: "center",
    marginTop: 30,
  },
  coverMonogram: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#c5a880",
    letterSpacing: 4,
    marginBottom: 6,
  },
  coverSubtitleTop: {
    fontSize: 8,
    color: "#a39f93",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  coverCenter: {
    alignItems: "center",
    marginVertical: 40,
  },
  coverBadge: {
    backgroundColor: "#192420",
    borderColor: "#c5a880",
    borderWidth: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  coverBadgeText: {
    fontSize: 7.5,
    color: "#c5a880",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  coverDesc: {
    fontSize: 9,
    color: "#c2bfb6",
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 1.4,
  },
  coverBottom: {
    alignItems: "center",
    borderTopWidth: 0.8,
    borderTopColor: "rgba(197, 168, 128, 0.4)",
    paddingTop: 16,
    width: "100%",
  },
  coverDate: {
    fontSize: 8,
    color: "#a39f93",
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverSource: {
    fontSize: 7,
    color: "#c5a880",
    fontFamily: "Helvetica-Bold",
  },

  // Páginas de Produtos
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    color: "#111111",
    backgroundColor: "#fcfbf9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e0d8",
    marginBottom: 14,
  },
  headerBrand: {
    flexDirection: "column",
  },
  headerLogoText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0d1412",
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 6.5,
    color: "#8c734b",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerInfo: {
    textAlign: "right",
  },
  headerDate: {
    fontSize: 7,
    color: "#777777",
  },

  // Grid de 4 produtos por página (2 colunas x 2 linhas)
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    flex: 1,
  },
  card: {
    width: "48.5%",
    height: 345,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8e5dc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  imageBox: {
    width: "100%",
    height: 140,
    backgroundColor: "#f7f6f2",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 9,
    color: "#a8a29e",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
  brandBadge: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#8c734b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  productName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    lineHeight: 1.25,
    marginBottom: 4,
  },
  inspirationText: {
    fontSize: 6.8,
    color: "#4b5563",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 3,
  },
  accordsText: {
    fontSize: 6.2,
    color: "#6b7280",
    lineHeight: 1.2,
    marginBottom: 4,
  },
  cardPrices: {
    borderTopWidth: 0.8,
    borderTopColor: "#f0ede6",
    paddingTop: 6,
    marginTop: 4,
    gap: 3,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1.5,
  },
  priceLabel: {
    fontSize: 6.8,
    color: "#52525b",
  },
  priceValueRetail: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f1715",
  },
  priceValueWholesale: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },
  priceValueCost: {
    fontSize: 7.5,
    color: "#71717a",
  },
  priceValueProfit: {
    fontSize: 7.5,
    color: "#0369a1",
    fontFamily: "Helvetica-Bold",
  },
  stockBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    marginTop: 2,
  },
  stockText: {
    fontSize: 6,
    color: "#52525b",
    fontFamily: "Helvetica-Bold",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.8,
    borderTopColor: "#e5e0d8",
    paddingTop: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 6.5,
    color: "#9ca3af",
  },
});

// ==========================================
// DOCUMENTO COMPLETO DO CATÁLOGO DE LUXO
// ==========================================
function CatalogPdfDocument({
  products,
  options,
  source = "Firebase",
}: {
  products: Product[];
  options: CatalogPdfOptions;
  source?: string;
}) {
  const activeProducts = products.filter((p) => p.active);
  const today = new Date().toLocaleDateString("pt-BR");
  // Divide em páginas de 4 produtos cada (2x2)
  const productChunks = chunkArray(activeProducts, 4);

  return (
    <Document title="Catálogo Oficial de Produtos - Oasis Imports" author="Oasis Imports">
      {/* CAPA DE LUXO */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverBorder}>
          <View style={styles.coverTop}>
            <Text style={styles.coverMonogram}>OASIS IMPORTS</Text>
            <Text style={styles.coverSubtitleTop}>HAUTE PARFUMERIE • IMPORTADOS</Text>
          </View>

          <View style={styles.coverCenter}>
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>EDIÇÃO EXCLUSIVA</Text>
            </View>
            <Text style={styles.coverTitle}>Catálogo Geral de Fragrâncias</Text>
            <Text style={styles.coverDesc}>
              Seleção refinada de perfumes árabes, designers e de nicho com alta fixação e projeção impecável.
            </Text>
          </View>

          <View style={styles.coverBottom}>
            <Text style={styles.coverDate}>
              Atualizado em: {today} • {activeProducts.length} itens catalogados
            </Text>
            <Text style={styles.coverSource}>
              Base Centralizada: {source}
            </Text>
          </View>
        </View>
      </Page>

      {/* PÁGINAS DE PRODUTOS (VITRINE 2x2) */}
      {productChunks.map((chunk, pageIndex) => (
        <Page size="A4" style={styles.page} key={`page-${pageIndex}`}>
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <Text style={styles.headerLogoText}>OASIS IMPORTS</Text>
              <Text style={styles.headerSub}>Catálogo de Produtos</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerDate}>{today}</Text>
              <Text style={styles.headerDate}>Página {pageIndex + 1} de {productChunks.length}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {chunk.map((p) => {
              const baseForProfit =
                options.wholesale && !options.retail ? p.wholesalePrice || 0 : p.retailPrice || 0;
              const profit = baseForProfit - (p.costPrice || 0);
              const hasValidImage = p.image && typeof p.image === "string" && p.image.startsWith("http");

              return (
                <View style={styles.card} key={p.id} wrap={false}>
                  {/* IMAGEM DO PRODUTO */}
                  <View style={styles.imageBox}>
                    {hasValidImage ? (
                      <Image style={styles.productImage} src={p.image} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderText}>OASIS</Text>
                      </View>
                    )}
                  </View>

                  {/* INFORMAÇÕES DO PRODUTO */}
                  <View style={styles.cardContent}>
                    <Text style={styles.brandBadge}>{p.brand || p.category || "FRAGRÂNCIA"}</Text>
                    <Text style={styles.productName}>{p.name}</Text>
                    {p.inspiration ? (
                      <Text style={styles.inspirationText}>Ref.: {p.inspiration}</Text>
                    ) : null}
                    {p.accords ? (
                      <Text style={styles.accordsText}>Notas: {p.accords}</Text>
                    ) : null}
                  </View>

                  {/* PREÇOS & CONDIÇÕES */}
                  <View style={styles.cardPrices}>
                    {options.retail && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Preço Varejo:</Text>
                        <Text style={styles.priceValueRetail}>{money(p.retailPrice)}</Text>
                      </View>
                    )}
                    {options.wholesale && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Preço Atacado:</Text>
                        <Text style={styles.priceValueWholesale}>{money(p.wholesalePrice)}</Text>
                      </View>
                    )}
                    {options.cost && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Custo:</Text>
                        <Text style={styles.priceValueCost}>{money(p.costPrice)}</Text>
                      </View>
                    )}
                    {options.profit && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Margem:</Text>
                        <Text style={styles.priceValueProfit}>+{money(profit)}</Text>
                      </View>
                    )}
                    {options.stock && (
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockText}>Disponível: {p.stock} un.</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>OASIS IMPORTS • Todos os direitos reservados</Text>
            <Text style={styles.footerText}>
              Documento gerado com dados atualizados do Firebase
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}

// ==========================================
// COMPONENTE COM PRÉ-PROCESSAMENTO EM BACKGROUND
// ==========================================
export default function CatalogPdfActions({ products: initialProducts }: { products: Product[] }) {
  const [useFirebase, setUseFirebase] = useState(true);
  const [resolvedProducts, setResolvedProducts] = useState<Product[]>(initialProducts);
  const [sourceName, setSourceName] = useState("API Local");

  // Opções de exibição de colunas/preços
  const [options, setOptions] = useState<CatalogPdfOptions>({
    cost: false,
    retail: true,
    wholesale: true,
    profit: false,
    stock: true,
  });

  // Estados de Pré-Renderização (Background Processing)
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string | null>(null);
  const currentBlobRef = useRef<string | null>(null);

  const fileName = `catalogo-oasis-${new Date().toISOString().split("T")[0]}.pdf`;

  // 1. Carrega produtos atualizados do Firebase ou props
  useEffect(() => {
    let active = true;
    async function fetchProducts() {
      if (useFirebase) {
        try {
          const fbProducts = await getProductsFromFirebase();
          if (active && fbProducts && fbProducts.length > 0) {
            setResolvedProducts(fbProducts);
            setSourceName("Firebase Firestore");
            return;
          }
        } catch {
          // fallback
        }
      }
      if (active) {
        setResolvedProducts(initialProducts);
        setSourceName("API Local");
      }
    }
    fetchProducts();
    return () => {
      active = false;
    };
  }, [useFirebase, initialProducts]);

  // 2. PRÉ-PROCESSAMENTO EM SEGUNDO PLANO (Ao carregar ou ao alterar filtros)
  useEffect(() => {
    let isCancelled = false;
    if (!resolvedProducts.length) return;

    async function preRenderPdf() {
      setIsProcessing(true);
      setIsPreloaded(false);

      try {
        const doc = (
          <CatalogPdfDocument
            products={resolvedProducts}
            options={options}
            source={sourceName}
          />
        );
        const blob = await pdf(doc).toBlob();

        if (!isCancelled) {
          // Revoga URL anterior para liberar memória
          if (currentBlobRef.current) {
            URL.revokeObjectURL(currentBlobRef.current);
          }
          const url = URL.createObjectURL(blob);
          currentBlobRef.current = url;
          setCachedBlobUrl(url);
          setIsPreloaded(true);
        }
      } catch (err) {
        console.warn("Erro no pré-processamento do PDF:", err);
      } finally {
        if (!isCancelled) {
          setIsProcessing(false);
        }
      }
    }

    // Debounce leve para evitar compilações excessivas se o usuário clicar rápido nas opções
    const timer = setTimeout(preRenderPdf, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [resolvedProducts, options, sourceName]);

  // Limpeza de Blob ao desmontar o componente
  useEffect(() => {
    return () => {
      if (currentBlobRef.current) {
        URL.revokeObjectURL(currentBlobRef.current);
      }
    };
  }, []);

  // 3. Ações Instantâneas utilizando o Blob Pré-carregado
  function downloadInstant() {
    if (cachedBlobUrl) {
      const a = document.createElement("a");
      a.href = cachedBlobUrl;
      a.download = fileName;
      a.click();
    }
  }

  function previewInstant() {
    if (cachedBlobUrl) {
      window.open(cachedBlobUrl, "_blank");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Filtros de exibição */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          background: "#f9faf8",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #ebede8",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44", cursor: "pointer" }}>
          <input
            className="checkbox"
            type="checkbox"
            checked={options.retail}
            onChange={(e) => setOptions({ ...options, retail: e.target.checked })}
            style={{ width: "auto", margin: 0, accentColor: "#000000" }}
          />{" "}
          Varejo
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44", cursor: "pointer" }}>
          <input
            className="checkbox"
            type="checkbox"
            checked={options.wholesale}
            onChange={(e) => setOptions({ ...options, wholesale: e.target.checked })}
            style={{ width: "auto", margin: 0, accentColor: "#000000" }}
          />{" "}
          Atacado
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44", cursor: "pointer" }}>
          <input
            className="checkbox"
            type="checkbox"
            checked={options.cost}
            onChange={(e) => setOptions({ ...options, cost: e.target.checked })}
            style={{ width: "auto", margin: 0, accentColor: "#000000" }}
          />{" "}
          Custo
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44", cursor: "pointer" }}>
          <input
            className="checkbox"
            type="checkbox"
            checked={options.profit}
            onChange={(e) => setOptions({ ...options, profit: e.target.checked })}
            style={{ width: "auto", margin: 0, accentColor: "#000000" }}
          />{" "}
          Margem
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44", cursor: "pointer" }}>
          <input
            className="checkbox"
            type="checkbox"
            checked={options.stock}
            onChange={(e) => setOptions({ ...options, stock: e.target.checked })}
            style={{ width: "auto", margin: 0, accentColor: "#000000" }}
          />{" "}
          Estoque
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: 0,
            fontSize: "12px",
            color: "#0969da",
            fontWeight: 600,
            marginLeft: "auto",
            cursor: "pointer",
          }}
        >
          <input
            className="checkbox"
            type="checkbox"
            checked={useFirebase}
            onChange={(e) => setUseFirebase(e.target.checked)}
            style={{ width: "auto", margin: 0, accentColor: "#0969da" }}
          />
          <FiDatabase style={{ marginRight: 2 }} /> Dados do Firebase
        </label>
      </div>

      {/* Indicador de Status do Pré-carregamento */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isProcessing ? (
            <>
              <FiLoader className="spin" style={{ color: "#d97706" }} />
              <span style={{ color: "#b45309", fontWeight: 500 }}>
                Processando PDF em segundo plano com fotos e dados...
              </span>
            </>
          ) : isPreloaded ? (
            <>
              <FiCheckCircle style={{ color: "#16a34a" }} />
              <span style={{ color: "#15803d", fontWeight: 500 }}>
                Catálogo pronto para download instantâneo ({resolvedProducts.filter((p) => p.active).length} itens)
              </span>
            </>
          ) : (
            <span style={{ color: "#71717a" }}>Aguardando itens para compilação...</span>
          )}
        </div>
      </div>

      {/* Botões de Ação Instantânea */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          className="button ghost"
          onClick={previewInstant}
          disabled={!isPreloaded}
          style={{ flex: 1 }}
          title={isPreloaded ? "Visualizar catálogo imediatamente" : "Aguarde o processamento em background"}
        >
          <FiPrinter /> Visualizar Catálogo
        </button>
        <button
          type="button"
          className="button primary"
          onClick={downloadInstant}
          disabled={!isPreloaded}
          style={{ flex: 1 }}
          title={isPreloaded ? "Baixar catálogo instantaneamente" : "Aguarde o processamento em background"}
        >
          <FiDownload /> Baixar PDF Instantâneo
        </button>
      </div>
    </div>
  );
}
