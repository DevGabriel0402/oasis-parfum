import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fail, method } from "./_lib/http.js";
import { catalogPrice, products, references } from "./_lib/models.js";
import { getConfig } from "./_lib/sheets.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["GET"])) return;
  try {
    const type =
      String(req.query.type || "varejo") === "atacado" ? "atacado" : "varejo";
    const table = await products();
    const items = table.items
      .filter((item) => item.active)
      .map((product) => {
        const { raw, rowNumber, order, costPrice, ...item } = product;
        return { ...item, price: catalogPrice(product, type) };
      });
    const configuredWhatsapp = await getConfig("whatsapp_number");
    const refs = await references();
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      type,
      products: items,
      whatsapp: configuredWhatsapp || process.env.WHATSAPP_NUMBER || "",
      accordColors: refs,
    });
  } catch (error) {
    return fail(res, error);
  }
}
