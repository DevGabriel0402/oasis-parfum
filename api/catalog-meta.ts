import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_URL = "https://oasis-parfums.vercel.app";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const wholesale = req.query.type === "atacado";
  const type = wholesale ? "atacado" : "varejo";
  const title = wholesale
    ? "Catálogo de Atacado | Oasis Imports"
    : "Catálogo de Varejo | Oasis Imports";
  const description = wholesale
    ? "Condições especiais em perfumes importados para pedidos a partir de 5 peças."
    : "Descubra perfumes importados selecionados para transformar cada momento em uma experiência inesquecível.";
  const url = `${BASE_URL}/catalogo/${type}`;
  const image = `${BASE_URL}/catalogo-${type}-thumb.png`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).send(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Oasis Imports">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="${wholesale ? 1733 : 1732}">
    <meta property="og:image:height" content="${wholesale ? 907 : 908}">
    <meta property="og:image:alt" content="Capa do ${escapeHtml(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${image}">
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${url}">Abrir catálogo</a>
    </main>
  </body>
</html>`);
}
