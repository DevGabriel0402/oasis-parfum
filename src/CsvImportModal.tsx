import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiCheck,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { api } from "./api";
import type { Product } from "./types";

interface CsvImportModalProps {
  close: () => void;
  onSuccess: () => void;
}

export default function CsvImportModal({ close, onSuccess }: CsvImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"excel" | "csv" | "">("");
  const [preview, setPreview] = useState<Partial<Product>[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const ext = file.name.toLowerCase();
    const isExcel = ext.endsWith(".xlsx") || ext.endsWith(".xls");
    const isCsv = ext.endsWith(".csv");

    if (!isExcel && !isCsv) {
      setError("Por favor, selecione uma planilha Excel (.xlsx, .xls) ou arquivo .csv.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setFileName(file.name);
    setFileType(isExcel ? "excel" : "csv");
    setSelectedFile(file);
    setBusy(true);

    try {
      const parsed = await api.parseSpreadsheetFile(file);
      if (!parsed.length) {
        setError("Nenhum produto válido foi identificado na planilha. Verifique se as colunas estão preenchidas.");
        setPreview([]);
      } else {
        setPreview(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar a planilha.");
      setPreview([]);
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0]);
    }
  }

  function downloadCsv() {
    const template = api.generateCsvTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_produtos_oasis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function downloadExcel() {
    try {
      await api.downloadExcelTemplate();
    } catch (err) {
      setError("Não foi possível gerar o modelo Excel. Baixe o modelo CSV.");
    }
  }

  async function handleImport() {
    if (!selectedFile || !preview.length) return;
    setBusy(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.importSpreadsheetFile(selectedFile);
      setSuccessMsg(`Sucesso! ${res.count} produtos foram gravados no Firebase Firestore.`);
      setTimeout(() => {
        onSuccess();
        close();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar dados para o Firebase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{ maxWidth: "680px" }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">FIREBASE SAAS</span>
            <h2>Importar Produtos (Excel ou CSV)</h2>
          </div>
          <button type="button" className="icon-button" onClick={close}>
            <FiX />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#ffffff",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <b style={{ fontSize: "14px" }}>Baixar modelo de planilha pronto:</b>
              <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.8 }}>
                Preencha seus produtos diretamente no Microsoft Excel ou Google Planilhas.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="button primary"
                onClick={downloadExcel}
                style={{ fontSize: "12px", padding: "6px 12px", height: "34px", background: "#15803d", borderColor: "#15803d" }}
                title="Baixar planilha oficial .xlsx"
              >
                <FiDownload /> Modelo Excel (.xlsx)
              </button>
              <button
                type="button"
                className="button soft"
                onClick={downloadCsv}
                style={{ fontSize: "12px", padding: "6px 12px", height: "34px" }}
                title="Baixar arquivo separado por ponto e vírgula"
              >
                <FiDownload /> Modelo CSV
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "26px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: preview.length ? "rgba(16, 185, 129, 0.04)" : "#ffffff",
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = (e.target.files && e.target.files[0]) || null;
                if (f) void handleFile(f);
              }}
            />
            <FiUploadCloud style={{ fontSize: "36px", color: "#18181b", marginBottom: "8px" }} />
            {fileName ? (
              <div>
                <p style={{ margin: "0", fontWeight: 600 }}>
                  {fileName} {fileType === "excel" ? "📊 (Excel)" : "📄 (CSV)"}
                </p>
                <small style={{ color: "#15803d", fontWeight: 600 }}>
                  <FiCheck style={{ display: "inline", verticalAlign: "middle" }} /> {preview.length} produtos identificados
                </small>
              </div>
            ) : (
              <div>
                <p style={{ margin: "0", fontWeight: 600 }}>
                  Arraste sua planilha Excel (.xlsx, .xls) ou arquivo .csv aqui
                </p>
                <small style={{ opacity: 0.7 }}>
                  Compatível com pastas de trabalho do Excel e arquivos CSV brasileiros
                </small>
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <div>
              <span className="eyebrow" style={{ fontSize: "11px" }}>
                PRÉVIA DA PLANILHA ({preview.length} PRODUTOS ENCONTRADOS)
              </span>
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginTop: "6px",
                  background: "#ffffff",
                }}
              >
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "6px 10px" }}>Produto</th>
                      <th style={{ padding: "6px 10px" }}>Marca</th>
                      <th style={{ padding: "6px 10px" }}>Custo</th>
                      <th style={{ padding: "6px 10px" }}>Varejo</th>
                      <th style={{ padding: "6px 10px" }}>Atacado</th>
                      <th style={{ padding: "6px 10px" }}>Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "6px 10px", fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: "6px 10px", opacity: 0.8 }}>{p.brand || "—"}</td>
                        <td style={{ padding: "6px 10px", color: "#6b7280" }}>R$ {(p.costPrice || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 10px", fontWeight: 600 }}>R$ {(p.retailPrice || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 10px", color: "#15803d", fontWeight: 600 }}>R$ {(p.wholesalePrice || 0).toFixed(2)}</td>
                        <td style={{ padding: "6px 10px" }}>{p.stock ?? 0} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && (
                <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.7, textAlign: "right" }}>
                  E mais {preview.length - 5} outros produtos prontos para salvar no Firebase...
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="form-error" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <FiAlertCircle /> {error}
            </p>
          )}

          {successMsg && (
            <p className="form-success" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
              <FiCheck /> {successMsg}
            </p>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="button ghost" onClick={close} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => void handleImport()}
            disabled={busy || !preview.length}
          >
            {busy ? (
              <>
                <FiRefreshCw className="spin" /> Gravando no Firebase...
              </>
            ) : (
              <>
                <FiFileText /> Confirmar Importação ({preview.length} Produtos)
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
