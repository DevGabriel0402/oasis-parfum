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
  tableColName: { flex: 2.5 },
  tableColBrand: { flex: 1.2 },
  tableColDynamic: { flex: 1, textAlign: "right" },
  tableCell: { fontSize: 8 },
  tableCellHeader: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", bottom: 20, left: 32, right: 32, textAlign: "center", fontSize: 7, color: "#999", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
});

export type CatalogPdfOptions = {
  cost: boolean;
  retail: boolean;
  wholesale: boolean;
  profit: boolean;
  stock: boolean;
};

function CatalogPdfDocument({ products, options }: { products: Product[]; options: CatalogPdfOptions }) {
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
            {options.cost && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCellHeader}>Custo</Text></View>}
            {options.wholesale && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCellHeader}>Atacado</Text></View>}
            {options.retail && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCellHeader}>Varejo</Text></View>}
            {options.profit && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCellHeader}>Lucro</Text></View>}
            {options.stock && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCellHeader}>Estoque</Text></View>}
          </View>
          {activeProducts.map((p) => {
            const baseForProfit = options.wholesale && !options.retail ? (p.wholesalePrice || 0) : (p.retailPrice || 0);
            const profit = baseForProfit - (p.costPrice || 0);
            return (
              <View style={styles.tableRow} key={p.id} wrap={false}>
                <View style={[styles.tableCol, styles.tableColName]}><Text style={styles.tableCell}>{p.name}</Text></View>
                <View style={[styles.tableCol, styles.tableColBrand]}><Text style={styles.tableCell}>{p.brand || p.category}</Text></View>
                {options.cost && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCell}>{money(p.costPrice)}</Text></View>}
                {options.wholesale && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCell}>{money(p.wholesalePrice)}</Text></View>}
                {options.retail && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCell}>{money(p.retailPrice)}</Text></View>}
                {options.profit && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCell}>{money(profit)}</Text></View>}
                {options.stock && <View style={[styles.tableCol, styles.tableColDynamic]}><Text style={styles.tableCell}>{p.stock} un.</Text></View>}
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
  const [downloading, setDownloading] = useState(false);
  const [options, setOptions] = useState<CatalogPdfOptions>({
    cost: true,
    retail: true,
    wholesale: false,
    profit: true,
    stock: false,
  });

  const fileName = `catalogo-oasis-${new Date().toISOString().split("T")[0]}.pdf`;

  async function preview() {
    const target = window.open("", "_blank");
    if (!target) return;
    setPreviewing(true);
    target.document.title = "Preparando catálogo...";
    try {
      const blob = await pdf(<CatalogPdfDocument products={products} options={options} />).toBlob();
      const url = URL.createObjectURL(blob);
      target.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      target.close();
    } finally {
      setPreviewing(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await pdf(<CatalogPdfDocument products={products} options={options} />).toBlob();
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
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", background: "#f9faf8", padding: "12px", borderRadius: "8px", border: "1px solid #ebede8" }}>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44" }}>
          <input type="checkbox" checked={options.cost} onChange={e => setOptions({...options, cost: e.target.checked})} style={{ width: "auto", margin: 0 }} /> Custo
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44" }}>
          <input type="checkbox" checked={options.retail} onChange={e => setOptions({...options, retail: e.target.checked})} style={{ width: "auto", margin: 0 }} /> Varejo
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44" }}>
          <input type="checkbox" checked={options.wholesale} onChange={e => setOptions({...options, wholesale: e.target.checked})} style={{ width: "auto", margin: 0 }} /> Atacado
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44" }}>
          <input type="checkbox" checked={options.profit} onChange={e => setOptions({...options, profit: e.target.checked})} style={{ width: "auto", margin: 0 }} /> Lucro
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: "6px", margin: 0, fontSize: "12px", color: "#3e4d44" }}>
          <input type="checkbox" checked={options.stock} onChange={e => setOptions({...options, stock: e.target.checked})} style={{ width: "auto", margin: 0 }} /> Estoque
        </label>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="button ghost" onClick={preview} disabled={previewing || downloading} style={{ flex: 1 }}>
          <FiPrinter />{previewing ? "Preparando..." : "Imprimir Catálogo"}
        </button>
        <button type="button" className="button soft" onClick={downloadPdf} disabled={previewing || downloading} style={{ flex: 1 }}>
          <FiDownload />{downloading ? "Gerando PDF..." : "Baixar PDF"}
        </button>
      </div>
    </div>
  );
}
