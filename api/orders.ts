import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { fail, method } from "./_lib/http.js";
import { newId, ORDER_HEADERS, orders } from "./_lib/models.js";
import {
  appendObject,
  ensureSheet,
  getRows,
  pick,
  updateObject,
} from "./_lib/sheets.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["GET", "POST", "PUT"]) || !(await requireAuth(req, res)))
    return;
  try {
    if (req.method === "GET") return res.json({ orders: await orders() });
    if (req.method === "PUT") {
      const id = String(req.body?.id || "").trim();
      const status = String(req.body?.status || "").trim();
      if (!id) return res.status(400).json({ error: "Informe o pedido." });
      if (!['Novo', 'Entregue'].includes(status))
        return res.status(400).json({ error: "Status inválido." });

      const headers = await ensureSheet("Pedidos", ORDER_HEADERS);
      const table = await getRows("Pedidos");
      const row = table.rows.find(
        ({ data }) => String(pick(data, ["ID", "Pedido", "Número"])) === id,
      );
      if (!row) return res.status(404).json({ error: "Pedido não encontrado." });

      await updateObject("Pedidos", row.rowNumber, headers, row.data, { Status: status });
      return res.json({ ok: true, id, status });
    }
    const body = req.body || {},
      items = Array.isArray(body.items) ? body.items : [];
    const data = {
      ID: newId("PED"),
      Data: new Date().toISOString(),
      Cliente: body.customer,
      Telefone: body.phone,
      Tipo: body.type || "varejo",
      Itens: items
        .map((item: any) => `${item.quantity}x ${item.name}`)
        .join(" | "),
      "Detalhes dos Itens": JSON.stringify(
        items.map((item: any) => ({
          id: String(item.id || ""),
          name: String(item.name || ""),
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        })),
      ),
      Quantidade: items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      ),
      Total: body.total,
      Status: "Novo",
      Observações: body.notes,
    };
    await appendObject(
      "Pedidos",
      await ensureSheet("Pedidos", ORDER_HEADERS),
      data,
    );
    return res.status(201).json({ order: data });
  } catch (error) {
    return fail(res, error);
  }
}
