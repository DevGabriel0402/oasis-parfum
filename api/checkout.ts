import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method } from "./_lib/http.js";
import {
  catalogPrice,
  newId,
  ORDER_HEADERS,
  products,
} from "./_lib/models.js";
import { appendObject, ensureSheet } from "./_lib/sheets.js";

type CheckoutItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = req.body || {},
      type = body.type === "atacado" ? "atacado" : "varejo",
      requested = Array.isArray(body.items) ? body.items : [],
      customer = String(body.customer || "").trim().slice(0, 120),
      phone = String(body.phone || "").trim().slice(0, 80),
      notes = String(body.notes || "").trim().slice(0, 500);
    if (customer.length < 2)
      return res.status(400).json({ error: "Informe o nome do cliente." });
    if (phone.length < 8)
      return res.status(400).json({ error: "Informe um contato válido." });
    if (!requested.length)
      return res.status(400).json({ error: "O pedido está vazio." });
    const catalog = await products(),
      byId = new Map(
        catalog.items.filter((p) => p.active).map((p) => [p.id, p]),
      );
    const items: CheckoutItem[] = requested.map((entry: any) => {
      const product = byId.get(String(entry.id));
      const quantity = Math.max(
        1,
        Math.min(999, Math.floor(Number(entry.quantity) || 0)),
      );
      if (!product)
        throw new Error("Um produto do pedido não está mais disponível.");
      const unitPrice = catalogPrice(product, type);
      return { id: product.id, name: product.name, quantity, unitPrice };
    });
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (type === "atacado" && quantity < 5)
      return res.status(400).json({
        error: "O pedido de atacado exige no mínimo 5 peças.",
      });
    const total = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
      id = newId("PED");
    const data = {
      ID: id,
      Data: new Date().toISOString(),
      Cliente: customer,
      Telefone: phone,
      Tipo: type,
      Itens: items.map((item) => item.quantity + "x " + item.name).join(" | "),
      "Detalhes dos Itens": JSON.stringify(items),
      Quantidade: quantity,
      Total: total,
      Status: "Novo",
      Observações: notes || "Pedido realizado pelo catálogo público",
    };
    await appendObject(
      "Pedidos",
      await ensureSheet("Pedidos", ORDER_HEADERS),
      data,
    );
    return res.status(201).json({ id, total });
  } catch (error) {
    return fail(res, error);
  }
}
