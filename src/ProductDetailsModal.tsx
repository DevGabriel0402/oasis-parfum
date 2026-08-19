import { motion } from "motion/react";
import { FiX, FiShoppingBag } from "react-icons/fi";
import type { Product } from "./types";

type Props = {
  product: Product;
  close: () => void;
  addToCart: (id: string) => void;
  price: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function ProductDetailsModal({ product, close, addToCart, price }: Props) {
  const accordsList = product.accords ? product.accords.split(",").map(s => s.trim()).filter(Boolean) : [];
  const topNotes = product.topNotes ? product.topNotes.split(",").map(s => s.trim()).filter(Boolean) : [];
  const heartNotes = product.heartNotes ? product.heartNotes.split(",").map(s => s.trim()).filter(Boolean) : [];
  const baseNotes = product.baseNotes ? product.baseNotes.split(",").map(s => s.trim()).filter(Boolean) : [];

  const ACCORD_COLORS: Record<string, { bg: string; text: string }> = {
    "doce": { bg: "#EF4444", text: "#fff" },
    "atalcado": { bg: "#E6D5C3", text: "#111" },
    "amadeirado": { bg: "#8B4513", text: "#fff" },
    "floral": { bg: "#FF69B4", text: "#fff" },
    "aromático": { bg: "#439B8E", text: "#fff" },
    "cítrico": { bg: "#FFF666", text: "#111" },
    "fresco especiado": { bg: "#84CC16", text: "#111" },
    "especiado quente": { bg: "#C2410C", text: "#fff" },
    "especiado fresco": { bg: "#84CC16", text: "#111" },
    "frutado": { bg: "#F97316", text: "#fff" },
    "baunilha": { bg: "#FBBF24", text: "#111" },
    "âmbar": { bg: "#D97706", text: "#fff" },
    "almiscarado": { bg: "#94A3B8", text: "#fff" },
    "terroso": { bg: "#4B5563", text: "#fff" },
    "verde": { bg: "#22C55E", text: "#fff" },
    "animálico": { bg: "#78350F", text: "#fff" },
    "esfumaçado": { bg: "#334155", text: "#fff" },
    "aquático": { bg: "#38BDF8", text: "#111" },
    "couro": { bg: "#451A03", text: "#fff" },
  };

  const getAccordStyle = (accord: string, index: number) => {
    const key = accord.toLowerCase().trim();
    if (ACCORD_COLORS[key]) return ACCORD_COLORS[key];
    
    const defaultColors = [
      { bg: "#8B4513", text: "#fff" },
      { bg: "#D2691E", text: "#fff" },
      { bg: "#CD3700", text: "#fff" },
      { bg: "#7A8B8B", text: "#fff" },
      { bg: "#6E8B3D", text: "#fff" },
      { bg: "#458B74", text: "#fff" },
      { bg: "#E5E7EB", text: "#111" },
      { bg: "#8B5A2B", text: "#fff" }
    ];
    return defaultColors[index % defaultColors.length];
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        className="modal product-details-modal"
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <button type="button" className="icon-button modal-close-corner" onClick={close}>
          <FiX />
        </button>

        <div className="product-details-content">
          <div className="product-details-header-section">
            <div className="product-details-image">
              {product.image ? <img src={product.image} alt={product.name} /> : <span>O</span>}
            </div>
            <div className="product-details-title-area">
              <span className="eyebrow">{product.brand || product.category}</span>
              <h2>{product.name}</h2>
              {product.inspiration && (
                <div className="inspiration-container">
                  {product.inspirationImage && (
                    <img src={product.inspirationImage} alt={product.inspiration} className="inspiration-image" />
                  )}
                  <p className="inspiration-note">Inspirado em <strong>{product.inspiration}</strong></p>
                </div>
              )}
              <p className="product-description-text">{product.description}</p>
              
              <div className="product-details-price-row">
                <strong>{price > 0 ? money(price) : "Consulte o valor"}</strong>
                <button className="button primary" onClick={() => { addToCart(product.id); close(); }}>
                  <FiShoppingBag /> Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="product-details-body">
            {accordsList.length > 0 && (
              <div className="details-section accords-section">
                <h3>PRINCIPAIS ACORDES</h3>
                <div className="accords-list">
                  {accordsList.map((accord, i) => {
                    const style = getAccordStyle(accord, i);
                    return (
                      <div 
                        key={accord} 
                        className="accord-bar" 
                        style={{ 
                          width: `${Math.max(30, 100 - (i * 12))}%`,
                          backgroundColor: style.bg,
                          color: style.text
                        }}
                      >
                        {accord}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(product.longevity || product.sillage) && (
              <div className="details-section performance-section">
                {product.longevity && (
                  <div className="performance-card">
                    <span>LONGEVIDADE</span>
                    <strong>{product.longevity}</strong>
                  </div>
                )}
                {product.sillage && (
                  <div className="performance-card">
                    <span>RASTRO</span>
                    <strong>{product.sillage}</strong>
                  </div>
                )}
              </div>
            )}

            {(topNotes.length > 0 || heartNotes.length > 0 || baseNotes.length > 0) && (
              <div className="details-section notes-section">
                <h3>NOTAS OLFATIVAS</h3>
                
                {topNotes.length > 0 && (
                  <div className="notes-group">
                    <span>Notas de topo</span>
                    <div className="notes-tags">
                      {topNotes.map(note => <span key={note} className="note-tag top-note">{note}</span>)}
                    </div>
                  </div>
                )}

                {heartNotes.length > 0 && (
                  <div className="notes-group">
                    <span>Notas de coração</span>
                    <div className="notes-tags">
                      {heartNotes.map(note => <span key={note} className="note-tag heart-note">{note}</span>)}
                    </div>
                  </div>
                )}

                {baseNotes.length > 0 && (
                  <div className="notes-group">
                    <span>Notas de base</span>
                    <div className="notes-tags">
                      {baseNotes.map(note => <span key={note} className="note-tag base-note">{note}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
