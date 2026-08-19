import { useState } from "react";
import { Document, Image, Page, PDFDownloadLink, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type { Product } from "./types";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 10, color: "#111111", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#111111", marginBottom: 20 },
  logo: { width: 140, objectFit: "contain" },
  headerText: { textAlign: "right" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  date: { fontSize: 9, color: "#666666" },
  productCard: { flexDirection: "row", gap: 20, paddingBottom: 25, marginBottom: 25, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  imageCol: { width: "25%", flexDirection: "column", gap: 10, alignItems: "center" },
  mainImage: { width: 110, height: 110, objectFit: "cover", borderRadius: 4 },
  inspSection: { alignItems: "center", gap: 4, marginTop: 10 },
  inspImage: { width: 60, height: 60, objectFit: "contain", borderRadius: 4, backgroundColor: "#fafafa", border: "1pt solid #eaeaea" },
  inspLabel: { fontSize: 7, color: "#777", textTransform: "uppercase" },
  infoCol: { width: "75%", flexDirection: "column" },
  brand: { fontSize: 8, textTransform: "uppercase", color: "#777777", letterSpacing: 1, marginBottom: 3 },
  prodName: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  inspirationText: { fontSize: 9, color: "#444444", marginBottom: 10, fontStyle: "italic" },
  desc: { fontSize: 9, lineHeight: 1.5, color: "#333333", marginBottom: 12 },
  
  notesGrid: { flexDirection: "row", gap: 15, marginBottom: 12 },
  notesCol: { flex: 1 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 4, color: "#111" },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  badge: { backgroundColor: "#f0f0f0", paddingVertical: 3, paddingHorizontal: 6, borderRadius: 10, fontSize: 7, color: "#333" },
  
  pricesBox: { flexDirection: "row", gap: 10, marginTop: "auto", padding: 12, backgroundColor: "#f9f9f9", borderRadius: 6, border: "1pt solid #efefef" },
  priceItem: { flex: 1 },
  priceLabel: { fontSize: 7, textTransform: "uppercase", color: "#666", marginBottom: 3, letterSpacing: 0.5 },
  priceValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 8, color: "#999", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
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

        {activeProducts.map((p) => {
          const accords = toArray(p.accords);
          const topNotes = toArray(p.topNotes);
          const heartNotes = toArray(p.heartNotes);
          const baseNotes = toArray(p.baseNotes);

          return (
            <View style={styles.productCard} key={p.id} wrap={false}>
              <View style={styles.imageCol}>
                {p.image ? (
                  <Image src={p.image} style={styles.mainImage} />
                ) : (
                  <View style={[styles.mainImage, { backgroundColor: "#eee" }]} />
                )}
                
                {(p.inspiration || p.inspirationImage) && (
                  <View style={styles.inspSection}>
                    <Text style={styles.inspLabel}>Inspiração</Text>
                    {p.inspirationImage && p.inspirationImage.trim() !== "" ? (
                      <Image src={p.inspirationImage.trim()} style={styles.inspImage} />
                    ) : (
                      <View style={[styles.inspImage, { justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" }]}>
                        <Image src={`${window.location.origin}/logo-oasis.png`} style={{ width: 40, height: 20, objectFit: "contain", opacity: 0.4 }} />
                        <Text style={{ fontSize: 6, color: "#999", marginTop: 4, textTransform: "uppercase" }}>S/ Imagem</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              
              <View style={styles.infoCol}>
                <Text style={styles.brand}>{p.brand || p.category}</Text>
                <Text style={styles.prodName}>{p.name}</Text>
                {p.inspiration && (
                  <Text style={styles.inspirationText}>Inspirado em: {p.inspiration}</Text>
                )}
                
                {p.description && <Text style={styles.desc}>{p.description}</Text>}

                {accords.length > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.sectionTitle}>Principais Acordes</Text>
                    <View style={styles.badgesRow}>
                      {accords.map(a => <Text key={a} style={styles.badge}>{a}</Text>)}
                    </View>
                  </View>
                )}

                {(topNotes.length > 0 || heartNotes.length > 0 || baseNotes.length > 0) && (
                  <View style={styles.notesGrid}>
                    {topNotes.length > 0 && (
                      <View style={styles.notesCol}>
                        <Text style={styles.sectionTitle}>Notas de Topo</Text>
                        <View style={styles.badgesRow}>
                          {topNotes.map(n => <Text key={n} style={styles.badge}>{n}</Text>)}
                        </View>
                      </View>
                    )}
                    {heartNotes.length > 0 && (
                      <View style={styles.notesCol}>
                        <Text style={styles.sectionTitle}>Notas de Coração</Text>
                        <View style={styles.badgesRow}>
                          {heartNotes.map(n => <Text key={n} style={styles.badge}>{n}</Text>)}
                        </View>
                      </View>
                    )}
                    {baseNotes.length > 0 && (
                      <View style={styles.notesCol}>
                        <Text style={styles.sectionTitle}>Notas de Base</Text>
                        <View style={styles.badgesRow}>
                          {baseNotes.map(n => <Text key={n} style={styles.badge}>{n}</Text>)}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.pricesBox}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Preço de Custo</Text>
                    <Text style={styles.priceValue}>{money(p.costPrice)}</Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Preço Atacado</Text>
                    <Text style={styles.priceValue}>{money(p.wholesalePrice)}</Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Preço Varejo</Text>
                    <Text style={styles.priceValue}>{money(p.retailPrice)}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>OASIS IMPORTS • CATÁLOGO GERADO EM {today}</Text>
          <Text>Este é um documento de uso interno e gerencial.</Text>
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
