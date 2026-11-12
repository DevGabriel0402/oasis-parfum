import type { Product } from "../types";

/**
 * Corrige problemas comuns de encoding (Mojibake) como 'Ã§' no lugar de 'ç'.
 */
function fixEncoding(str: string): string {
  try {
    return str
      .replace(/Ã£/g, "ã")
      .replace(/Ã¡/g, "á")
      .replace(/Ã /g, "à")
      .replace(/Ã¢/g, "â")
      .replace(/Ã©/g, "é")
      .replace(/Ãª/g, "ê")
      .replace(/Ã­/g, "í")
      .replace(/Ã³/g, "ó")
      .replace(/Ã´/g, "ô")
      .replace(/Ãµ/g, "õ")
      .replace(/Ãº/g, "ú")
      .replace(/Ã§/g, "ç")
      .replace(/Ã‰/g, "É")
      .replace(/Ã“/g, "Ó")
      .replace(/Ã‡/g, "Ç")
      .replace(/â€“/g, "-")
      .replace(/â€”/g, "-");
  } catch {
    return str;
  }
}

/**
 * Normaliza e converte URLs de imagens (Google Drive, Dropbox, etc.) para links diretos de imagem.
 */
export function normalizeImageUrl(url: unknown): string {
  if (!url) return "";
  let clean = String(url).trim().replace(/^["']|["']$/g, "").trim();
  if (
    !clean ||
    clean.toLowerCase() === "null" ||
    clean.toLowerCase() === "undefined" ||
    clean === "-" ||
    clean === "—"
  ) {
    return "";
  }

  // Google Drive: links de visualização / compartilhamento -> link direto no Google CDN
  // Ex: https://drive.google.com/file/d/1aB2c3D4.../view?usp=sharing
  // Ex: https://drive.google.com/open?id=1aB2c3D4...
  const driveMatch = clean.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i,
  );
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Dropbox: converte para link direto com raw=1
  if (clean.includes("dropbox.com")) {
    clean = clean.replace(/[?&]dl=[01]/g, "");
    return clean.includes("?") ? `${clean}&raw=1` : `${clean}?raw=1`;
  }

  // OneDrive: converte links compartilhados
  if (clean.includes("1drv.ms") || clean.includes("onedrive.live.com")) {
    clean = clean.replace("redir?", "download?");
  }

  // Corrige links sem protocolo (//example.com)
  if (clean.startsWith("//")) {
    clean = "https:" + clean;
  }

  return clean;
}

/**
 * Converte valor numérico ou monetário (ex: "R$ 1.250,50", "150,00", "89.90", "R$ 45") em número preciso.
 */
export function parseNumber(value: unknown): number {
  if (typeof value === "number") return isNaN(value) ? 0 : Math.round(value * 100) / 100;
  if (!value) return 0;
  let str = String(value)
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
    .trim();
  if (!str) return 0;

  const lastDot = str.lastIndexOf(".");
  const lastComma = str.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // Padrão brasileiro: 1.250,50 -> 1250.50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Padrão americano: 1,250.50 -> 1250.50
      str = str.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Apenas vírgula: "149,90" -> "149.90"
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function parseBool(value: unknown, defaultValue = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null || value === "") return defaultValue;
  const str = String(value).trim().toLowerCase();
  if (["sim", "s", "true", "1", "ativo", "yes", "y", "v"].includes(str)) return true;
  if (["nao", "não", "n", "false", "0", "inativo", "no", "f"].includes(str)) return false;
  return defaultValue;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(fixEncoding(current.trim().replace(/^["']|["']$/g, "").trim()));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(fixEncoding(current.trim().replace(/^["']|["']$/g, "").trim()));
  return result;
}

/**
 * Normaliza qualquer variação de cabeçalho vinda de planilhas.
 * Aceita emojis, acentos, abreviações e termos em português e inglês.
 */
function normalizeHeader(raw: string): string {
  if (!raw) return "";
  const fixed = fixEncoding(String(raw).trim());
  const rawLower = fixed.toLowerCase();

  const h = rawLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  // Preço de Custo (reconhece qualquer coluna com custo, cost ou curto com emojis/símbolos)
  if (
    rawLower.includes("custo") ||
    rawLower.includes("cost") ||
    rawLower.includes("curto") ||
    rawLower.includes("cust") ||
    h.includes("custo") ||
    h.includes("cost") ||
    h.includes("curto") ||
    h.includes("cust") ||
    [
      "custo",
      "precocusto",
      "precodecusto",
      "precodecustors",
      "precocustors",
      "costprice",
      "valordecusto",
      "valordecustors",
      "custors",
      "custounitario",
      "pcusto",
      "precodecurto",
      "precodecurtors",
    ].includes(h)
  ) {
    return "costPrice";
  }

  // Preço de Varejo
  if (
    rawLower.includes("varejo") ||
    rawLower.includes("retail") ||
    h.includes("varejo") ||
    h.includes("retail") ||
    [
      "varejo",
      "precovarejo",
      "precodevarejo",
      "precovendavarejo",
      "precodevendavarejo",
      "retailprice",
      "preco",
      "valor",
      "precovenda",
      "precodevenda",
      "precovendars",
      "precodevendars",
      "valordevenda",
      "valorvenda",
      "pvarejo",
      "precounitario",
      "venda",
    ].includes(h)
  ) {
    return "retailPrice";
  }

  // Preço de Atacado
  if (
    rawLower.includes("venda") ||
    rawLower.includes("wholesale") ||
    rawLower.includes("revenda") ||
    h.includes("venda") ||
    h.includes("wholesale") ||
    h.includes("revenda") ||
    [
      "precodevenda",
      "precoatacado",
      "precodeatacado",
      "precovendaatacado",
      "precodevendaatacado",
      "wholesaleprice",
      "valoratacado",
      "valordeatacado",
      "patacado",
      "revenda",
      "precorevenda",
    ].includes(h)
  ) {
    return "wholesalePrice";
  }

  // Nome do produto
  if (
    [
      "nome",
      "name",
      "produto",
      "product",
      "fragrancia",
      "nomeproduto",
      "nomedoproduto",
      "descricaodoproduto",
      "perfume",
      "item",
      "titulo",
    ].includes(h) ||
    h.includes("produto") ||
    h === "nome"
  ) {
    return "name";
  }

  // Marca
  if (
    ["marca", "brand", "fabricante", "fornecedor", "grife", "casa"].includes(h) ||
    h.includes("marca") ||
    h.includes("fabricante")
  ) {
    return "brand";
  }

  // Categoria
  if (
    ["categoria", "category", "tipo", "linha", "genero"].includes(h) ||
    h.includes("categoria")
  ) {
    return "category";
  }

  // Estoque
  if (
    ["estoque", "stock", "quantidade", "qtd", "quant", "unidades", "saldo"].includes(h) ||
    h.includes("estoque") ||
    h.includes("quantidade") ||
    h === "qtd" ||
    h === "saldo"
  ) {
    return "stock";
  }

  // Mínimo de Atacado
  if (
    [
      "minimoatacado",
      "minatacado",
      "wholesaleminimum",
      "qtdminima",
      "quantidademinimaatacado",
    ].includes(h) ||
    h.includes("minimo")
  ) {
    return "wholesaleMinimum";
  }

  // Imagem
  if (
    [
      "imagem",
      "image",
      "foto",
      "urlimagem",
      "linkimagem",
      "img",
      "linkdaimagem",
      "urlimage",
      "fotodoproduto",
      "fotourl",
      "link",
      "url",
      "fotos",
      "imagens",
    ].includes(h) ||
    ((h.includes("imagem") || h.includes("foto") || h.includes("image")) && !h.includes("inspir"))
  ) {
    return "image";
  }

  // Descrição
  if (
    ["descricao", "description", "detalhes", "sobre", "observacao", "obs"].includes(h) ||
    h.includes("descricao")
  ) {
    return "description";
  }

  // Inspiração olfativa
  if (
    [
      "inspiradoem",
      "inspiracao",
      "inspiration",
      "contratipo",
      "referencia",
      "referenciaolfativa",
      "nomeinspirado",
    ].includes(h) ||
    h.includes("inspir") ||
    h.includes("contratipo")
  ) {
    return "inspiration";
  }

  // Imagem da Inspiração
  if (
    [
      "imageminspiracao",
      "inspirationimage",
      "fotoinspiracao",
      "linkinspiracao",
      "urlinspiracao",
      "imagemdainspiracao",
    ].includes(h) ||
    (h.includes("inspir") && (h.includes("foto") || h.includes("imagem") || h.includes("img")))
  ) {
    return "inspirationImage";
  }

  // Notas e pirâmide olfativa
  if (["acordes", "accords", "acordesprincipais", "familias"].includes(h) || h.includes("acorde")) {
    return "accords";
  }
  if (
    ["notastopo", "topnotes", "notasdesaida", "saida", "topo", "notasdetopo"].includes(h) ||
    h.includes("topo") ||
    h.includes("saida")
  ) {
    return "topNotes";
  }
  if (
    ["notascoracao", "heartnotes", "coracao", "corpo", "notasdecoracao", "notasdecorpo"].includes(h) ||
    h.includes("coracao") ||
    h.includes("corpo")
  ) {
    return "heartNotes";
  }
  if (
    ["notasbase", "basenotes", "fundo", "base", "notasdebase", "notasdefundo"].includes(h) ||
    h.includes("fundo") ||
    h.includes("base")
  ) {
    return "baseNotes";
  }

  // Performance
  if (["longevidade", "longevity", "fixacao", "durabilidade"].includes(h) || h.includes("fixac")) {
    return "longevity";
  }
  if (
    ["rastro", "sillage", "projecao", "intensidade"].includes(h) ||
    h.includes("projec") ||
    h.includes("rastro") ||
    h.includes("sillage")
  ) {
    return "sillage";
  }

  // Status
  if (["destaque", "featured", "vitrine", "principal"].includes(h) || h.includes("destaque")) {
    return "featured";
  }
  if (
    ["ativo", "active", "disponivel", "publicado"].includes(h) ||
    h.includes("ativo") ||
    h.includes("disponivel")
  ) {
    return "active";
  }
  if (["slug", "identificador"].includes(h)) return "slug";
  if (["id", "codigo", "cod"].includes(h) || h === "codigo" || h === "cod") return "id";

  return h;
}

/**
 * Converte uma matriz bidimensional (linhas e colunas) em lista de objetos Product completos.
 * Aplica as porcentagens de markup salvas nas Configurações se apenas o custo for informado.
 */
export function parseProductsMatrix(
  matrix: any[][],
  settings?: { retailPercentage?: number; wholesalePercentage?: number },
): Partial<Product>[] {
  if (!matrix || matrix.length < 2) return [];

  // Identifica a linha de cabeçalho (caso haja títulos decorativos ou linhas em branco antes)
  let headerIndex = 0;
  let maxKeywords = 0;

  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const rawRow = matrix[i] || [];
    let count = 0;
    for (const cell of rawRow) {
      const h = String(cell || "").trim();
      if (!h) continue;
      const normalized = normalizeHeader(h);
      if (
        [
          "name",
          "brand",
          "costPrice",
          "retailPrice",
          "wholesalePrice",
          "stock",
          "category",
          "image",
          "inspiration",
          "accords",
        ].includes(normalized)
      ) {
        count++;
      }
    }
    if (count > maxKeywords) {
      maxKeywords = count;
      headerIndex = i;
    }
  }

  const rawHeaders = (matrix[headerIndex] || []).map((c) => String(c ?? "").trim());
  const headers = rawHeaders.map(normalizeHeader);

  const products: Partial<Product>[] = [];
  const retailMargin =
    Number(settings?.retailPercentage || 0) > 0 ? Number(settings!.retailPercentage) : 30;
  const wholesaleMargin =
    Number(settings?.wholesalePercentage || 0) > 0 ? Number(settings!.wholesalePercentage) : 15;

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const rowValues = matrix[i];
    if (!rowValues || !rowValues.some((v) => String(v ?? "").trim().length > 0)) continue;

    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      if (h) {
        row[h] = rowValues[idx] ?? "";
      }
    });

    const name = String(row.name || "").trim();
    const brand = String(row.brand || "").trim();

    // Se a linha não tiver nome nem marca, ignora
    if (!name && !brand) continue;

    const costPrice = parseNumber(row.costPrice);
    let retailPrice = parseNumber(row.retailPrice);
    let wholesalePrice = parseNumber(row.wholesalePrice);

    // Se tiver custo e não tiver varejo (ou se a margem de varejo foi configurada):
    if (costPrice > 0 && retailPrice <= 0) {
      retailPrice = Math.round(costPrice * (1 + retailMargin / 100) * 100) / 100;
    }

    // Se tiver custo e não tiver atacado (ou se a margem de atacado foi configurada):
    if (costPrice > 0 && wholesalePrice <= 0) {
      wholesalePrice = Math.round(costPrice * (1 + wholesaleMargin / 100) * 100) / 100;
    }

    // Se não tiver custo mas tiver varejo:
    if (retailPrice > 0 && wholesalePrice <= 0) {
      wholesalePrice = Math.round(retailPrice * 0.85 * 100) / 100;
    }
    // Se não tiver custo mas tiver atacado:
    if (wholesalePrice > 0 && retailPrice <= 0) {
      retailPrice = Math.round(wholesalePrice * 1.20 * 100) / 100;
    }

    const slug =
      String(row.slug || "").trim() ||
      `${name}-${brand}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const id = String(row.id || "").trim() || slug || `prod_${Date.now()}_${i}`;

    const image = normalizeImageUrl(row.image);
    const inspirationImage = normalizeImageUrl(row.inspirationImage);

    const product: Partial<Product> = {
      id,
      name: name || "Fragrância Sem Nome",
      brand,
      category: String(row.category || "").trim() || "Perfumes",
      description: String(row.description || "").trim(),
      costPrice,
      retailPrice,
      wholesalePrice,
      stock: Math.floor(parseNumber(row.stock || 0)),
      wholesaleMinimum: Math.max(1, Math.floor(parseNumber(row.wholesaleMinimum || 1))),
      image,
      active: parseBool(row.active, true),
      featured: parseBool(row.featured, false),
      slug,
      inspiration: String(row.inspiration || "").trim(),
      inspirationImage,
      accords: String(row.accords || "").trim(),
      topNotes: String(row.topNotes || "").trim(),
      heartNotes: String(row.heartNotes || "").trim(),
      baseNotes: String(row.baseNotes || "").trim(),
      longevity: String(row.longevity || "").trim(),
      sillage: String(row.sillage || "").trim(),
    };

    products.push(product);
  }

  return products;
}

/**
 * Converte o texto de um arquivo .csv em lista de objetos Product completos.
 * Aplica as porcentagens de markup salvas nas Configurações se apenas o custo for informado.
 */
export function parseProductsCsv(
  csvText: string,
  settings?: { retailPercentage?: number; wholesalePercentage?: number },
): Partial<Product>[] {
  const cleanText = fixEncoding(csvText).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!cleanText) return [];

  const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detecta o delimitador da linha
  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = ",";
  if (semicolonCount >= commaCount && semicolonCount >= tabCount) delimiter = ";";
  else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";

  const matrix = lines.map((line) => parseCsvLine(line, delimiter));
  return parseProductsMatrix(matrix, settings);
}

/**
 * Gera um arquivo CSV modelo para download com cabeçalhos e exemplos reais.
 */
export function generateCsvTemplate(): string {
  const headers = [
    "Nome",
    "Marca",
    "Categoria",
    "Preco Custo",
    "Preco Varejo",
    "Preco Atacado",
    "Estoque",
    "URL Imagem",
    "Descricao",
    "Inspirado Em",
    "Acordes Principais",
    "Notas Topo",
    "Notas Coracao",
    "Notas Base",
    "Destaque",
    "Ativo",
  ];

  const exampleRows = [
    [
      "Baccarat Rouge 540",
      "Maison Francis Kurkdjian",
      "Eau de Parfum",
      "450,00",
      "780,00",
      "620,00",
      "12",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600",
      "Fragrância ambarada floral icônica com notas sofisticadas.",
      "Original MFK",
      "Âmbar, Amadeirado, Especiado quente",
      "Açafrão, Jasmim",
      "Amberwood, Âmbar Cinzento",
      "Resina de Abeto, Cedro",
      "Sim",
      "Sim",
    ],
    [
      "Sauvage Elixir",
      "Dior",
      "Parfum Concentrado",
      "380,00",
      "650,00",
      "510,00",
      "8",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600",
      "Fragrância masculina intensa com notas licorosas e especiadas.",
      "Original Dior",
      "Especiado quente, Lavanda, Amadeirado",
      "Canela, Noz-moscada, Cardamomo",
      "Lavanda",
      "Alcaçuz, Sândalo, Âmbar",
      "Sim",
      "Sim",
    ],
  ];

  const lines = [
    headers.join(";"),
    ...exampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")),
  ];

  return "\uFEFF" + lines.join("\n");
}

/**
 * Carrega a biblioteca SheetJS (XLSX) globalmente ou sob demanda.
 */
async function getXLSX(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).XLSX) {
    return (window as any).XLSX;
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="xlsx"]');
    if (existing) {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      existing.addEventListener("load", () => resolve((window as any).XLSX));
      existing.addEventListener("error", () =>
        reject(new Error("Erro ao carregar suporte ao Excel.")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () =>
      reject(new Error("Erro ao carregar suporte ao Excel. Verifique sua conexão."));
    document.head.appendChild(script);
  });
}

/**
 * Lê qualquer arquivo de planilha (.xlsx, .xls ou .csv) e devolve a lista de produtos parseada.
 */
export async function parseUploadedSpreadsheet(
  file: File,
  settings?: { retailPercentage?: number; wholesalePercentage?: number },
): Promise<Partial<Product>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await getXLSX();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Encontra inteligentemente a melhor aba avaliando quais abas possuem colunas de produtos
    let targetSheetName = workbook.SheetNames[0];
    let highestScore = -1;

    for (const sName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sName];
      if (!sheet || !sheet["!ref"]) continue;

      const sampleRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        range: 0,
      });
      if (!sampleRows || sampleRows.length === 0) continue;

      let score = 0;
      for (let r = 0; r < Math.min(sampleRows.length, 12); r++) {
        const row = sampleRows[r] || [];
        for (const cell of row) {
          const rawCell = String(cell || "").trim();
          if (!rawCell) continue;
          const norm = normalizeHeader(rawCell);
          if (
            [
              "name",
              "costPrice",
              "retailPrice",
              "wholesalePrice",
              "brand",
              "category",
              "stock",
              "image",
              "inspiration",
              "accords",
            ].includes(norm)
          ) {
            score += 3;
          }
        }
      }

      const lowerName = sName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (
        ["catalogo", "produtos", "perfumes", "estoque", "precos", "planilha", "folha"].some((k) =>
          lowerName.includes(k),
        )
      ) {
        score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        targetSheetName = sName;
      }
    }

    if (!targetSheetName || !workbook.Sheets[targetSheetName]) {
      throw new Error("A planilha do Excel está vazia ou sem abas válidas.");
    }

    const worksheet = workbook.Sheets[targetSheetName];
    // Converte diretamente a aba selecionada em matriz de linhas/células
    const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    return parseProductsMatrix(matrix, settings);
  }

  // Arquivo .csv tradicional
  const text = await file.text();
  return parseProductsCsv(text, settings);
}

/**
 * Gera e faz o download direto de um modelo oficial em formato Excel (.xlsx).
 */
export async function downloadExcelTemplate(): Promise<void> {
  const XLSX = await getXLSX();
  const headers = [
    "Nome",
    "Marca",
    "Categoria",
    "Preco Custo",
    "Preco Varejo",
    "Preco Atacado",
    "Estoque",
    "URL Imagem",
    "Descricao",
    "Inspirado Em",
    "Acordes Principais",
    "Notas Topo",
    "Notas Coracao",
    "Notas Base",
    "Destaque",
    "Ativo",
  ];

  const exampleRows = [
    [
      "Baccarat Rouge 540",
      "Maison Francis Kurkdjian",
      "Eau de Parfum",
      450.0,
      780.0,
      620.0,
      12,
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600",
      "Fragrância ambarada floral icônica com notas sofisticadas.",
      "Original MFK",
      "Âmbar, Amadeirado, Especiado quente",
      "Açafrão, Jasmim",
      "Amberwood, Âmbar Cinzento",
      "Resina de Abeto, Cedro",
      "Sim",
      "Sim",
    ],
    [
      "Sauvage Elixir",
      "Dior",
      "Parfum Concentrado",
      380.0,
      650.0,
      510.0,
      8,
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600",
      "Fragrância masculina intensa com notas licorosas e especiadas.",
      "Original Dior",
      "Especiado quente, Lavanda, Amadeirado",
      "Canela, Noz-moscada, Cardamomo",
      "Lavanda",
      "Alcaçuz, Sândalo, Âmbar",
      "Sim",
      "Sim",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "modelo_produtos_oasis.xlsx");
}
