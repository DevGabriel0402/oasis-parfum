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

  const accordColors = ["#8B4513", "#D2691E", "#CD3700", "#7A8B8B", "#6E8B3D", "#458B74", "#FFFAFA", "#8B5A2B"];

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
                  {accordsList.map((accord, i) => (
                    <div 
                      key={accord} 
                      className="accord-bar" 
                      style={{ 
                        width: `${Math.max(30, 100 - (i * 12))}%`,
                        backgroundColor: accordColors[i % accordColors.length],
                        color: accordColors[i % accordColors.length] === "#FFFAFA" ? "#111" : "#fff"
                      }}
                    >
                      {accord}
                    </div>
                  ))}
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
