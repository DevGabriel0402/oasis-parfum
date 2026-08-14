import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { fail, method } from "./_lib/http.js";
import { getConfig, setConfig } from "./_lib/sheets.js";

const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const toNum = (value: unknown) => {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["GET", "PUT"]) || !(await requireAuth(req, res)))
    return;

  try {
    if (req.method === "GET") {
      const whatsapp =
        (await getConfig("whatsapp_number")) ||
        digits(process.env.WHATSAPP_NUMBER);
      const retailPercentage = toNum(await getConfig("retail_percentage"));
      const wholesalePercentage = toNum(await getConfig("wholesale_percentage"));
      return res.json({ whatsapp, retailPercentage, wholesalePercentage });
    }

    const whatsapp = digits(req.body?.whatsapp);
    if (req.body?.whatsapp !== undefined && (whatsapp.length < 10 || whatsapp.length > 15))
      return res.status(400).json({
        error: "Informe um WhatsApp válido com DDD e código do país.",
      });

    if (req.body?.whatsapp !== undefined) await setConfig("whatsapp_number", whatsapp);
    
    if (req.body?.retailPercentage !== undefined) {
      await setConfig("retail_percentage", String(req.body.retailPercentage));
    }
    if (req.body?.wholesalePercentage !== undefined) {
      await setConfig("wholesale_percentage", String(req.body.wholesalePercentage));
    }
    
    return res.json({ ok: true, whatsapp, retailPercentage: req.body.retailPercentage, wholesalePercentage: req.body.wholesalePercentage });
  } catch (error) {
    return fail(res, error);
  }
}
