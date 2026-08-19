import { useState } from "react";
import { Document, Image, Page, PDFDownloadLink, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type { Product } from "./types";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", color: "#111111", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#111111", marginBottom: 20 },
  logo: { width: 120, objectFit: "contain" },
  headerText: { textAlign: "right" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  date: { fontSize: 8, color: "#666666" },
  
  gridContainer: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "31.5%", marginBottom: 20, marginRight: "2.75%", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  
  mainImage: { width: "100%", height: 100, objectFit: "contain", marginBottom: 10 },
  
  brand: { fontSize: 7, textTransform: "uppercase", color: "#777777", letterSpacing: 1, marginBottom: 2 },
  prodName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  inspirationText: { fontSize: 7.5, color: "#444444", marginBottom: 8, fontStyle: "italic" },
  
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 10 },
  badge: { backgroundColor: "#f0f0f0", paddingVertical: 2, paddingHorizontal: 4, borderRadius: 4, fontSize: 6, color: "#333" },
  
  pricesBox: { marginTop: "auto", padding: 8, backgroundColor: "#f9f9f9", borderRadius: 4, border: "1pt solid #efefef" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  priceLabel: { fontSize: 6.5, textTransform: "uppercase", color: "#666" },
  priceValue: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 7, color: "#999", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
});

const toArray = (str?: string) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];

function CatalogPdfDocument({ products }: { products: Product[] }) {
  const activeProducts = products.filter(p => p.active);
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <Document title="Catálogo de Produtos - Oasis Imports" author="Oasis Imports">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={`${window.location.origin}/logo-oasis.png`} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Catálogo de Produtos</Text>
            <Text style={styles.date}>Atualizado em: {today} • {activeProducts.length} itens</Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {activeProducts.map((p, index) => {
            const accords = toArray(p.accords).slice(0, 4); // Limit to 4 accords to save space
            const isLastInRow = (index + 1) % 3 === 0;

            return (
              <View style={[styles.gridItem, isLastInRow ? { marginRight: 0 } : {}]} key={p.id} wrap={false}>
                {p.image ? (
                  <Image src={p.image} style={styles.mainImage} />
                ) : (
                  <View style={[styles.mainImage, { backgroundColor: "#f9f9f9", justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 8, color: "#ccc" }}>SEM FOTO</Text>
                  </View>
                )}
                
                <Text style={styles.brand}>{p.brand || p.category}</Text>
                <Text style={styles.prodName} style={{ fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                  {p.name.length > 25 ? p.name.substring(0, 25) + "..." : p.name}
                </Text>
                
                {p.inspiration ? (
                  <Text style={styles.inspirationText}>
                    Insp: {p.inspiration.length > 25 ? p.inspiration.substring(0, 25) + "..." : p.inspiration}
                  </Text>
                ) : (
                  <Text style={[styles.inspirationText, { color: "transparent" }]}>-</Text>
                )}

                <View style={styles.badgesRow}>
                  {accords.map(a => <Text key={a} style={styles.badge}>{a}</Text>)}
                </View>

                <View style={styles.pricesBox}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Custo:</Text>
                    <Text style={styles.priceValue}>{money(p.costPrice)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Atacado:</Text>
                    <Text style={styles.priceValue}>{money(p.wholesalePrice)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Varejo:</Text>
                    <Text style={styles.priceValue}>{money(p.retailPrice)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>OASIS IMPORTS • CATÁLOGO GERADO EM {today} • USO INTERNO</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function CatalogPdfActions({ products }: { products: Product[] }) {
  const [previewing, setPreviewing] = useState(false);
  const fileName = `catalogo-oasis-${new Date().toISOString().split("T")[0]}.pdf`;

  async function preview() {
    const target = window.open("", "_blank");
    if (!target) return;
    setPreviewing(true);
    target.document.title = "Preparando catálogo...";
    try {
      const blob = await pdf(<CatalogPdfDocument products={products} />).toBlob();
      const url = URL.createObjectURL(blob);
      target.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      target.close();
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <button type="button" className="button ghost" onClick={preview} disabled={previewing}>
        <FiPrinter />{previewing ? "Preparando..." : "Imprimir Catálogo"}
      </button>
      <PDFDownloadLink document={<CatalogPdfDocument products={products} />} fileName={fileName} className="button soft">
        {({ loading }) => <><FiDownload />{loading ? "Gerando PDF..." : "Baixar PDF"}</>}
      </PDFDownloadLink>
    </div>
  );
}
