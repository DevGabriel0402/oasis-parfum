import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";
import { requireAuth } from "./_lib/auth.js";
import { fail, method } from "./_lib/http.js";
import { catalogPrice, orders, products } from "./_lib/models.js";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type SafeMessage = {
  role: "user" | "assistant";
  content: string;
};

function safeMessages(value: unknown): SafeMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is SafeMessage =>
        Boolean(item) &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-12)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 3000),
    }))
    .filter((item) => item.content.length > 0);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (!method(req, res, ["POST"]) || !(await requireAuth(req, res))) return;

  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  if (!apiKey) {
    return res.status(503).json({
      error: "O Assistente Oasis ainda não possui uma chave Groq configurada.",
    });
  }

  const messages = safeMessages(req.body?.messages);
  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return res.status(400).json({ error: "Envie uma mensagem válida." });
  }

  try {
    const [catalog, orderList] = await Promise.all([products(), orders()]);
    const activeProducts = catalog.items.filter((product) => product.active);
    const lowStock = activeProducts.filter((product) => product.stock <= 5);
    const totalSales = orderList.reduce((sum, order) => sum + order.total, 0);
    const businessContext = {
      updatedAt: new Date().toISOString(),
      summary: {
        registeredProducts: catalog.items.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStock.length,
        registeredOrders: orderList.length,
        totalSalesBRL: totalSales,
      },
      productFields: [
        "name",
        "brand",
        "category",
        "stock",
        "retailPriceBRL",
        "wholesalePriceBRL",
        "active",
      ],
      products: catalog.items.slice(0, 150).map((product) => [
        product.name,
        product.brand,
        product.category,
        product.stock,
        catalogPrice(product, "varejo"),
        catalogPrice(product, "atacado"),
        product.active,
      ]),
      orderFields: ["id", "date", "type", "quantity", "totalBRL", "status"],
      recentOrders: orderList.slice(-40).map((order) => [
        order.id,
        order.date,
        order.type,
        order.quantity,
        order.total,
        order.status,
      ]),
    };
    const client = new Groq({ apiKey });
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Você é o Assistente Oasis, consultor da Oasis Parfums. " +
            "Responda sempre em português do Brasil, de forma objetiva e elegante. " +
            "Use somente os dados comerciais fornecidos para responder sobre catálogo, preços, estoque, pedidos e vendas. " +
            "Nunca invente dados, não revele credenciais e não afirme que alterou a planilha. " +
            `Dados atuais do negócio, sem informações pessoais de clientes: ${JSON.stringify(businessContext)}`,
        },
        ...messages,
      ],
    });

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-AI-Provider", "groq");
    res.setHeader("X-AI-Model", model);
    res.flushHeaders();
    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content;
      if (content) res.write(content);
    }
    return res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status;
    if (status === 429) {
      return res.status(429).json({
        error: "O limite gratuito da Groq foi atingido. Tente novamente mais tarde.",
      });
    }
    if (status === 401 || /invalid api key/i.test(message)) {
      return res.status(503).json({
        error: "A chave Groq configurada é inválida ou foi revogada.",
      });
    }
    return fail(res, error);
  }
}
