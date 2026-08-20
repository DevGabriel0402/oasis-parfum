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

  table: { width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#eeeeee", borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableRowHeader: { backgroundColor: "#f9f9f9", fontFamily: "Helvetica-Bold" },
  tableCol: { borderStyle: "solid", borderWidth: 1, borderColor: "#eeeeee", borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColName: { width: "40%" },
  tableColBrand: { width: "15%" },
  tableColPrice: { width: "15%", textAlign: "right" },
  tableCell: { fontSize: 8 },
  tableCellHeader: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 7, color: "#999", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
});

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

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableRowHeader]} fixed>
            <View style={[styles.tableCol, styles.tableColName]}><Text style={styles.tableCellHeader}>Nome</Text></View>
            <View style={[styles.tableCol, styles.tableColBrand]}><Text style={styles.tableCellHeader}>Marca</Text></View>
            <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCellHeader}>Custo</Text></View>
            <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCellHeader}>Varejo</Text></View>
            <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCellHeader}>Lucro</Text></View>
          </View>
          {activeProducts.map((p) => {
            const profit = (p.retailPrice || 0) - (p.costPrice || 0);
            return (
              <View style={styles.tableRow} key={p.id} wrap={false}>
                <View style={[styles.tableCol, styles.tableColName]}><Text style={styles.tableCell}>{p.name}</Text></View>
                <View style={[styles.tableCol, styles.tableColBrand]}><Text style={styles.tableCell}>{p.brand || p.category}</Text></View>
                <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCell}>{money(p.costPrice)}</Text></View>
                <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCell}>{money(p.retailPrice)}</Text></View>
                <View style={[styles.tableCol, styles.tableColPrice]}><Text style={styles.tableCell}>{money(profit)}</Text></View>
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

  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await pdf(<CatalogPdfDocument products={products} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <button type="button" className="button ghost" onClick={preview} disabled={previewing || downloading}>
        <FiPrinter />{previewing ? "Preparando..." : "Imprimir Catálogo"}
      </button>
      <button type="button" className="button soft" onClick={downloadPdf} disabled={previewing || downloading}>
        <FiDownload />{downloading ? "Gerando PDF..." : "Baixar PDF"}
      </button>
    </div>
  );
}
