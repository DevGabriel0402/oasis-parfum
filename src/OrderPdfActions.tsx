import { useState } from "react";
import { Document, Image, Page, PDFDownloadLink, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type { Order, Product } from "./types";
import { formatOrderDate, formatOrderMoney, parseOrderItems } from "./order-utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 9, color: "#111111", backgroundColor: "#ffffff" },
  topRule: { height: 5, backgroundColor: "#111111", marginBottom: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#111111" },
  logo: { width: 150, height: 55, objectFit: "contain", objectPosition: "left center" },
  documentMeta: { alignItems: "flex-end" },
  eyebrow: { fontSize: 7, letterSpacing: 1.8, textTransform: "uppercase", color: "#666666", marginBottom: 5 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  status: { fontSize: 8, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: "#111111", textTransform: "uppercase" },
  infoGrid: { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 20 },
  infoBox: { flexGrow: 1, width: "25%", padding: 10, borderWidth: 1, borderColor: "#d7d7d7" },
  label: { fontSize: 6.5, color: "#777777", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#111111" },
  tableHeader: { flexDirection: "row", backgroundColor: "#111111", color: "#ffffff", paddingVertical: 8, paddingHorizontal: 9 },
  row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 9, borderBottomWidth: 1, borderBottomColor: "#dddddd" },
  sequence: { width: "8%" },
  description: { width: "47%" },
  quantity: { width: "10%", textAlign: "right" },
  unitPrice: { width: "18%", textAlign: "right" },
  lineTotal: { width: "17%", textAlign: "right" },
  summary: { marginTop: 14, marginLeft: "55%", borderTopWidth: 2, borderTopColor: "#111111", paddingTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 8, letterSpacing: 1, textTransform: "uppercase" },
  total: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 20, padding: 12, backgroundColor: "#f4f4f4", lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 28, left: 32, right: 32, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#cfcfcf", flexDirection: "row", justifyContent: "space-between", color: "#707070", fontSize: 6.5 },
});

function OrderPdfDocument({ order, products }: { order: Order; products: Product[] }) {
  const items = parseOrderItems(order);
  return (
    <Document title={`Pedido ${order.id} - Oasis Imports`} author="Oasis Imports" subject="Espelho de pedido">
      <Page size="A4" style={styles.page}>
        <View style={styles.topRule} />
        <View style={styles.header}>
          <Image style={styles.logo} src={`${window.location.origin}/logo-oasis.png`} />
          <View style={styles.documentMeta}>
            <Text style={styles.eyebrow}>Documento comercial</Text>
            <Text style={styles.title}>PEDIDO {order.id}</Text>
            <Text style={styles.status}>{order.status || "Novo"}</Text>
          </View>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}><Text style={styles.label}>Cliente</Text><Text style={styles.value}>{order.customer || "Não informado"}</Text></View>
          <View style={styles.infoBox}><Text style={styles.label}>Contato</Text><Text style={styles.value}>{order.phone || "Não informado"}</Text></View>
          <View style={styles.infoBox}><Text style={styles.label}>Data</Text><Text style={styles.value}>{formatOrderDate(order.date)}</Text></View>
          <View style={styles.infoBox}><Text style={styles.label}>Modalidade</Text><Text style={styles.value}>{order.type || "varejo"}</Text></View>
        </View>
        <Text style={styles.sectionTitle}>Itens do pedido</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.sequence}>ITEM</Text>
            <Text style={styles.description}>DESCRIÇÃO</Text>
            <Text style={styles.quantity}>QTD.</Text>
            <Text style={styles.unitPrice}>VALOR UNIT.</Text>
            <Text style={styles.lineTotal}>SUBTOTAL</Text>
          </View>
          {items.map((item, index) => {
            const searchName = item.name.trim().toLowerCase();
            const product = products.find((p) => p.name.trim().toLowerCase() === searchName) || products.find((p) => p.id === item.id);
            return (
            <View style={styles.row} key={item.id} wrap={false}>
              <Text style={styles.sequence}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={[styles.description, { flexDirection: "row", alignItems: "center", gap: 5 }]}>
                {product?.image ? (
                  <Image src={product.image} style={{ width: 14, height: 14, borderRadius: 2, objectFit: "cover" }} />
                ) : null}
                <Text>{item.name}</Text>
              </View>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.unitPrice}>{item.unitPrice == null ? "—" : formatOrderMoney(item.unitPrice)}</Text>
              <Text style={styles.lineTotal}>{item.lineTotal == null ? "—" : formatOrderMoney(item.lineTotal)}</Text>
            </View>
          )})}
        </View>
        <View style={styles.summary}><Text style={styles.totalLabel}>Total do pedido</Text><Text style={styles.total}>{formatOrderMoney(order.total)}</Text></View>
        {order.notes ? <Text style={styles.notes}>OBSERVAÇÕES: {order.notes}</Text> : null}
        <View style={styles.footer} fixed>
          <Text>OASIS IMPORTS • ESPELHO DO PEDIDO {order.id}</Text>
          <Text>Documento para conferência. Não substitui NF-e ou NFC-e.</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function OrderPdfActions({ order, products }: { order: Order; products: Product[] }) {
  const [previewing, setPreviewing] = useState(false);
  const fileName = `pedido-${order.id.toLowerCase()}.pdf`;

  async function preview() {
    const target = window.open("", "_blank");
    if (!target) return;
    setPreviewing(true);
    target.document.title = "Preparando pedido...";
    try {
      const blob = await pdf(<OrderPdfDocument order={order} products={products} />).toBlob();
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
    <div className="order-pdf-actions">
      <button type="button" className="button ghost" onClick={preview} disabled={previewing}>
        <FiPrinter />{previewing ? "Preparando..." : "Visualizar e imprimir"}
      </button>
      <PDFDownloadLink document={<OrderPdfDocument order={order} products={products} />} fileName={fileName} className="button soft">
        {({ loading }) => <><FiDownload />{loading ? "Gerando PDF..." : "Salvar em PDF"}</>}
      </PDFDownloadLink>
    </div>
  );
}
