import { randomUUID } from "node:crypto";
import { ensureSheet, getRows, normalize, pick } from "./sheets.js";

export const CATALOG_HEADERS = [
  "ID",
  "Produto",
  "Marca",
  "Descrição",
  "Imagem",
  "Preço Varejo",
  "Preço Atacado",
  "Estoque",
  "Categoria",
  "Ativo",
  "Destaque",
  "Quantidade Mínima Atacado",
  "Slug",
  "Atualizado em",
];
export const ORDER_HEADERS = [
  "ID",
  "Data",
  "Cliente",
  "Telefone",
  "Tipo",
  "Itens",
  "Quantidade",
  "Total",
  "Status",
  "Observações",
];
const number = (value: unknown) => {
  if (typeof value === "number") return value;
  const text = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(",", ".");
  return Number(text) || 0;
};
const bool = (value: unknown, fallback = true) =>
  value === "" || value == null
    ? fallback
    : !["false", "0", "não", "nao", "inativo"].includes(normalize(value));
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function products() {
  await ensureSheet("Catálogo", CATALOG_HEADERS);
  const table = await getRows("Catálogo");
  return {
    ...table,
    items: table.rows.map(({ data, rowNumber }, order) => {
      const name = String(
        pick(data, [
          "Produto",
          "Nome Produto",
          "Nome",
          "Perfume",
          "Descrição do Produto",
        ]),
      );
      const id = String(
        pick(data, ["ID", "Código", "Codigo"], `legacy-${rowNumber}`),
      );
      return {
        id,
        name,
        brand: String(pick(data, ["Marca", "Fornecedor"])),
        description: String(
          pick(data, ["Descrição", "Descricao", "Detalhes", "Nome Inspirado"]),
        ),
        image: String(
          pick(data, [
            "Imagem",
            "URL Image",
            "Foto",
            "URL Imagem",
            "Link da Imagem",
          ]),
        ),
        retailPrice: number(
          pick(data, [
            "Preço Varejo",
            "Preço de Venda (+35%)",
            "Preco Varejo",
            "Preço",
            "Valor",
            "Preço Unitário",
          ]),
        ),
        wholesalePrice: number(
          pick(data, ["Preço Atacado", "Preco Atacado", "Atacado"]),
        ),
        stock: number(pick(data, ["Estoque", "Quantidade", "Qtd"])),
        category: String(
          pick(data, ["Categoria", "Família Olfativa"], "Perfumes"),
        ),
        active: bool(pick(data, ["Ativo", "Status"], "true")),
        featured: bool(pick(data, ["Destaque"], "false"), false),
        wholesaleMinimum: Math.max(
          1,
          number(
            pick(
              data,
              ["Quantidade Mínima Atacado", "Qtd Mínima", "Minimo Atacado"],
              1,
            ),
          ),
        ),
        slug: String(pick(data, ["Slug"], slugify(name) || id)),
        rowNumber,
        raw: data,
        order,
      };
    }),
  };
}
export async function orders() {
  await ensureSheet("Pedidos", ORDER_HEADERS);
  const table = await getRows("Pedidos");
  return table.rows.map(({ data, rowNumber }) => ({
    id: String(pick(data, ["ID", "Pedido", "Número"], `legacy-${rowNumber}`)),
    date: String(pick(data, ["Data", "Criado em", "Data/Hora"])),
    customer: String(pick(data, ["Cliente", "Nome"])),
    phone: String(pick(data, ["Telefone", "WhatsApp", "Celular"])),
    type: String(pick(data, ["Tipo", "Tabela"], "varejo")).toLowerCase(),
    items: String(pick(data, ["Itens", "Produtos", "Pedido"])),
    quantity: number(pick(data, ["Quantidade", "Qtd"])),
    total: number(pick(data, ["Total", "Valor Total", "Valor"])),
    status: String(pick(data, ["Status", "Situação"], "Novo")),
    notes: String(pick(data, ["Observações", "Obs"])),
  }));
}
export const newId = (prefix: string) =>
  `${prefix}-${randomUUID().split("-")[0].toUpperCase()}`;
