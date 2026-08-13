import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { fail, method } from "./_lib/http.js";
import { newId, ORDER_HEADERS, orders } from "./_lib/models.js";
import { appendObject, ensureSheet } from "./_lib/sheets.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["GET", "POST"]) || !(await requireAuth(req, res)))
    return;
  try {
    if (req.method === "GET") return res.json({ orders: await orders() });
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
