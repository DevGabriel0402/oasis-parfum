import type { Order } from "./types";

export const formatOrderMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const formatOrderDate = (value: string) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed)
    : value || "—";
};

export const parseOrderItems = (order: Order) => {
  if (order.lines?.length)
    return order.lines.map((line, index) => ({
      id: line.id || `${order.id}-${index}`,
      quantity: line.quantity,
      name: line.name,
      unitPrice: line.unitPrice,
      lineTotal: line.quantity * line.unitPrice,
    }));

  const items = String(order.items || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const match = item.match(/^(\d+(?:[.,]\d+)?)x\s+(.+)$/i);
      return {
        id: `${order.id}-${index}`,
        quantity: match ? Number(match[1].replace(",", ".")) : 0,
        name: match ? match[2] : item,
        unitPrice: null as number | null,
        lineTotal: null as number | null,
      };
    });
  const result = items.length
    ? items
    : [{ id: `${order.id}-empty`, quantity: order.quantity || 0, name: "Itens não detalhados", unitPrice: null as number | null, lineTotal: null as number | null }];
  if (result.length === 1 && result[0].quantity > 0) {
    result[0].unitPrice = order.total / result[0].quantity;
    result[0].lineTotal = order.total;
  }
  return result;
};
