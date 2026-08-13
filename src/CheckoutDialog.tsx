import { FormEvent, useState } from "react";
import { FiArrowRight, FiCheckCircle, FiMessageCircle, FiPhone, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CheckoutCustomer = {
  customer: string;
  contact: string;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CheckoutCustomer) => Promise<void>;
  orderType: string;
  whatsappConfigured: boolean;
};

export default function CheckoutDialog({
  open,
  onOpenChange,
  onSubmit,
  orderType,
  whatsappConfigured,
}: Props) {
  const [customer, setCustomer] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (customer.trim().length < 2) {
      setError("Informe seu nome para identificar o pedido.");
      return;
    }
    if (contact.replace(/\D/g, "").length < 8) {
      setError("Informe um telefone ou WhatsApp válido.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        customer: customer.trim(),
        contact: contact.trim(),
        notes: notes.trim(),
      });
      setCustomer("");
      setContact("");
      setNotes("");
      onOpenChange(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível registrar o pedido.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="checkout-dialog sm:max-w-[520px]">
        <DialogHeader>
          <span className="eyebrow">FINALIZAR PEDIDO · {orderType.toUpperCase()}</span>
          <DialogTitle>Como podemos identificar seu pedido?</DialogTitle>
          <DialogDescription>
            {whatsappConfigured
              ? "Seus dados e todos os itens serão registrados no painel da Oasis Imports antes de abrirmos o WhatsApp."
              : "Seus dados e todos os itens serão registrados diretamente no painel da Oasis Imports."}
          </DialogDescription>
        </DialogHeader>

        <div className="checkout-security-note">
          <FiCheckCircle />
          <span>
            {whatsappConfigured
              ? "Seu pedido não será perdido mesmo que o WhatsApp seja fechado."
              : "Seu pedido ficará disponível para acompanhamento administrativo."}
          </span>
        </div>

        <form id="checkout-customer-form" className="checkout-form" onSubmit={submit}>
          <div className="checkout-field">
            <Label htmlFor="checkout-name"><FiUser /> Nome completo</Label>
            <Input
              id="checkout-name"
              autoComplete="name"
              required
              maxLength={120}
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              placeholder="Digite seu nome"
              aria-invalid={Boolean(error) && customer.trim().length < 2}
            />
          </div>
          <div className="checkout-field">
            <Label htmlFor="checkout-contact"><FiPhone /> Telefone ou WhatsApp</Label>
            <Input
              id="checkout-contact"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={80}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Ex.: (11) 99999-9999"
            />
          </div>
          <div className="checkout-field">
            <Label htmlFor="checkout-notes"><FiMessageCircle /> Observações (opcional)</Label>
            <Textarea
              id="checkout-notes"
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Preferências, dúvidas ou informações importantes"
            />
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button type="submit" form="checkout-customer-form" disabled={busy}>
            {busy ? "Registrando pedido..." : "Registrar e continuar"}
            {!busy ? <FiArrowRight /> : null}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
