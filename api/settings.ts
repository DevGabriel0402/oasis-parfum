import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./_lib/auth.js";
import { fail, method } from "./_lib/http.js";
import { getConfig, setConfig } from "./_lib/sheets.js";

const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ["GET", "PUT"]) || !(await requireAuth(req, res)))
    return;

  try {
    if (req.method === "GET") {
      const whatsapp =
        (await getConfig("whatsapp_number")) ||
        digits(process.env.WHATSAPP_NUMBER);
      return res.json({ whatsapp });
    }

    const whatsapp = digits(req.body?.whatsapp);
    if (whatsapp.length < 10 || whatsapp.length > 15)
      return res.status(400).json({
        error: "Informe um WhatsApp válido com DDD e código do país.",
      });

    await setConfig("whatsapp_number", whatsapp);
    return res.json({ ok: true, whatsapp });
  } catch (error) {
    return fail(res, error);
  }
}
