import { lazy, Suspense } from "react";
import { FiCheck, FiFileText, FiPackage, FiPhone, FiUser } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import type { Order, Product } from "./types";
import { formatOrderDate, formatOrderMoney, parseOrderItems } from "./order-utils";

const OrderPdfActions = lazy(() => import("./OrderPdfActions"));

type Props = {
  order: Order | null;
  products: Product[];
  open: boolean;
  updating: boolean;
  onOpenChange: (open: boolean) => void;
  onDelivered: (order: Order) => Promise<void>;
};

export default function OrderDetailsDialog({
  order,
  products,
  open,
  updating,
  onOpenChange,
  onDelivered,
}: Props) {
  if (!order) return null;
  const delivered = order.status.toLowerCase() === "entregue";
  const items = parseOrderItems(order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="order-details-dialog sm:max-w-3xl">
        <DialogHeader className="order-details-header">
          <div className="order-details-brand">
            <img src="/logo-oasis.png" alt="Oasis Imports" />
            <span>Espelho do pedido</span>
          </div>
          <DialogTitle>Pedido {order.id}</DialogTitle>
          <DialogDescription>
            Confira as informações antes de imprimir ou salvar o documento em PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="order-details-meta">
          <div>
            <FiUser />
            <span>
              Cliente<small>{order.customer || "Não informado"}</small>
            </span>
          </div>
          <div>
            <FiPhone />
            <span>
              Contato<small>{order.phone || "Não informado"}</small>
            </span>
          </div>
          <div>
            <FiFileText />
            <span>
              Data<small>{formatOrderDate(order.date)}</small>
            </span>
          </div>
          <div>
            <FiPackage />
            <span>
              Modalidade<small>{order.type || "varejo"}</small>
            </span>
          </div>
        </div>

        <div className="order-details-items">
          <div className="order-details-row order-details-table-head">
            <span>Descrição</span>
            <span>Qtd.</span>
            <span>Valor unit.</span>
            <span>Subtotal</span>
          </div>
          {items.map((item) => {
            const searchName = item.name.trim().toLowerCase();
            const product = products.find((p) => p.name.trim().toLowerCase() === searchName) || products.find((p) => p.id === item.id);
            return (
              <div className="order-details-row" key={item.id}>
                <div className="order-details-item-with-image">
                  {product?.image ? (
                    <img src={product.image} alt="" />
                  ) : (
                    <span className="placeholder">O</span>
                  )}
                  <span>{item.name}</span>
                </div>
                <b>{item.quantity}</b>
                <span>{item.unitPrice == null ? "—" : formatOrderMoney(item.unitPrice)}</span>
                <b>{item.lineTotal == null ? "—" : formatOrderMoney(item.lineTotal)}</b>
              </div>
            );
          })}
          <div className="order-details-total">
            <span>Total do pedido</span>
            <strong>{formatOrderMoney(order.total)}</strong>
          </div>
        </div>

        {order.notes && (
          <div className="order-details-notes">
            <b>Observações</b>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="order-details-footer">
          <Suspense fallback={<span className="pdf-loading">Preparando PDF...</span>}>
            <OrderPdfActions order={order} products={products} />
          </Suspense>
          {delivered ? (
            <span className="order-done order-done-large">
              <FiCheck />
              Pedido entregue
            </span>
          ) : (
            <button
              className="button primary"
              disabled={updating}
              onClick={() => onDelivered(order)}
            >
              <FiCheck />
              {updating ? "Salvando..." : "Marcar como entregue"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
