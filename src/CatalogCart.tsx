import { useState } from "react";
import { motion } from "motion/react";
import { FiArrowRight, FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Product } from "./types";
import CheckoutDialog, { type CheckoutCustomer } from "./CheckoutDialog";

type CatalogProduct = Product & { price?: number };

type Props = {
  open: boolean;
  products: CatalogProduct[];
  cart: Record<string, number>;
  onClose: () => void;
  onQuantity: (id: string, quantity: number) => void;
  onCheckout: (customer: CheckoutCustomer) => Promise<void>;
  whatsapp: string;
  minimumQuantity?: number;
  orderType: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const price = (product: CatalogProduct) => Number(product.price || product.retailPrice);

export default function CatalogCart({
  open,
  products,
  cart,
  onClose,
  onQuantity,
  onCheckout,
  whatsapp,
  minimumQuantity = 1,
  orderType,
}: Props) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const items = products.filter((product) => cart[product.id] > 0);
  const count = items.reduce((sum, product) => sum + cart[product.id], 0);
  const total = items.reduce(
    (sum, product) => sum + cart[product.id] * price(product),
    0,
  );
  const remaining = Math.max(0, minimumQuantity - count);
  const minimumReached = remaining === 0;

  return (
    <>
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        className="cart-drawer w-full gap-0 p-0 sm:max-w-[480px]"
        aria-label="Itens selecionados"
      >
        <SheetHeader className="border-b px-7 py-6 text-left">
          <span className="eyebrow">SUA SELEÇÃO</span>
          <SheetTitle className="font-serif text-2xl">
            {count} {count === 1 ? "item" : "itens"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Revise os produtos e as quantidades selecionadas.
          </SheetDescription>
        </SheetHeader>

        <div className="cart-drawer-items">
          {items.length ? (
            items.map((product) => (
              <motion.article layout className="cart-line" key={product.id}>
                <div className="cart-line-image">
                  {product.image ? <img src={product.image} alt="" /> : <span>O</span>}
                </div>
                <div className="cart-line-info">
                  <small>{product.brand}</small>
                  <h3>{product.name}</h3>
                  <strong>{money(price(product))}</strong>

                  <div className="quantity-control">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onQuantity(product.id, cart[product.id] - 1)}
                      aria-label={"Diminuir " + product.name}
                    >
                      {cart[product.id] === 1 ? <FiTrash2 /> : <FiMinus />}
                    </Button>
                    <span>{cart[product.id]}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onQuantity(product.id, cart[product.id] + 1)}
                      aria-label={"Aumentar " + product.name}
                    >
                      <FiPlus />
                    </Button>
                  </div>
                </div>
                <b>{money(price(product) * cart[product.id])}</b>
              </motion.article>
            ))
          ) : (
            <div className="cart-empty">
              <FiShoppingBag />
              <h3>Sua seleção está vazia</h3>
              <p>Escolha uma fragrância para começar.</p>
            </div>
          )}
        </div>

        <footer>
          {minimumQuantity > 1 && items.length > 0 ? (
            <div
              className={"cart-minimum " + (minimumReached ? "reached" : "pending")}
              role="status"
            >
              <FiShoppingBag />
              <div>
                <strong>
                  {minimumReached
                    ? "Condição de atacado liberada"
                    : `Adicione mais ${remaining} ${remaining === 1 ? "peça" : "peças"}`}
                </strong>
                <span>
                  {minimumReached
                    ? "Seu pedido já atingiu o mínimo de 5 peças."
                    : "Complete 5 peças para finalizar com o valor de atacado."}
                </span>
              </div>
            </div>
          ) : null}
          <div className="cart-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <Button
            className="cart-checkout h-11 w-full"
            onClick={() => setCheckoutOpen(true)}
            disabled={!items.length || !minimumReached}
          >
            Finalizar pedido <FiArrowRight />
          </Button>
          {!whatsapp && items.length > 0 && (
            <small>O pedido será salvo no painel. Configure o WhatsApp para também receber a mensagem.</small>
          )}
        </footer>
      </SheetContent>
    </Sheet>
    <CheckoutDialog
      open={checkoutOpen}
      onOpenChange={setCheckoutOpen}
      onSubmit={onCheckout}
      orderType={orderType}
      whatsappConfigured={Boolean(whatsapp)}
    />
    </>
  );
}
