import { FormEvent, useState } from "react";
import { FiArrowUp, FiMessageCircle, FiTrash2, FiX } from "react-icons/fi";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "./api";
import "./assistant.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Quais produtos estão com estoque baixo?",
  "Faça um resumo das vendas e dos pedidos.",
  "Sugira ações para melhorar o catálogo atual.",
];

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generateAnswer(question: string): Promise<string> {
    const q = question.toLowerCase();
    const [pRes, oRes] = await Promise.all([
      api.products().catch(() => ({ products: [] })),
      api.orders().catch(() => ({ orders: [] })),
    ]);
    const products = pRes.products || [];
    const orders = oRes.orders || [];

    if (q.includes("estoque") || q.includes("baixo")) {
      const low = products.filter((p) => (p.stock ?? 0) <= 5);
      if (!low.length) {
        return `✅ **Excelente!** Todos os ${products.length} produtos cadastrados estão com estoque acima de 5 unidades.`;
      }
      const list = low
        .map((p) => `• **${p.name}** (${p.brand || "Sem marca"}): apenas **${p.stock} un.** em estoque.`)
        .join("\n");
      return `⚠️ **Atenção ao estoque!** Encontrei ${low.length} produto(s) com 5 ou menos unidades:\n\n${list}\n\n*Recomendação: providencie reposição com fornecedores para não perder vendas.*`;
    }

    if (q.includes("resumo") || q.includes("venda") || q.includes("pedido")) {
      const total = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      const pending = orders.filter((o) => o.status?.toLowerCase() !== "entregue").length;
      const delivered = orders.filter((o) => o.status?.toLowerCase() === "entregue").length;
      return `📊 **Resumo Comercial do Oásis:**\n\n` +
        `• **Faturamento total:** R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
        `• **Total de pedidos:** ${orders.length}\n` +
        `• **Pedidos entregues:** ${delivered}\n` +
        `• **Pedidos em aberto:** ${pending}\n\n` +
        (pending > 0
          ? `*Dica: Você possui ${pending} pedido(s) pendente(s) aguardando entrega.*`
          : `*Todos os pedidos registrados já foram entregues com sucesso!*`);
    }

    if (q.includes("catálogo") || q.includes("catalogo") || q.includes("melhorar") || q.includes("acao") || q.includes("ação")) {
      const semFoto = products.filter((p) => !p.image);
      const inativos = products.filter((p) => p.active === false);
      const destaques = products.filter((p) => p.featured);

      let tips = `✨ **Diagnóstico do Catálogo:**\n\n` +
        `• **Total de produtos:** ${products.length}\n` +
        `• **Destaques na vitrine:** ${destaques.length}\n`;

      if (semFoto.length) {
        tips += `• 📸 **Fotos pendentes:** ${semFoto.length} produto(s) estão sem imagem cadastrada. Adicionar fotos atrativas aumenta a conversão em até 70%!\n`;
      }
      if (inativos.length) {
        tips += `• ⏸️ **Inativos:** ${inativos.length} produto(s) pausados.\n`;
      }
      tips += `\n**Sugestões estratégicas:**\n` +
        `1. Mantenha os 5 perfumes mais vendidos como "Destaque" para o cliente ver logo na entrada do catálogo.\n` +
        `2. Use o botão **Importar CSV** na tela de Produtos para cadastrar ou atualizar coleções inteiras com agilidade.\n` +
        `3. Compartilhe o link do **Catálogo de Atacado** diretamente no WhatsApp com revendedores e lojistas parceiros.`;
      return tips;
    }

    return `Olá! Sou a assistente inteligente do **Oasis Imports**.\n\n` +
      `Estou conectada ao seu banco de dados Firebase em tempo real. Você pode me perguntar sobre:\n` +
      `• *Estoque baixo e reposições*\n` +
      `• *Resumo de vendas e pedidos*\n` +
      `• *Dicas e diagnósticos para o catálogo de fragrâncias*`;
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMessage];
    setMessages([...history, { id: assistantId, role: "assistant", content: "Analisando dados do catálogo..." }]);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const answer = await generateAnswer(content);
      setMessages((current) =>
        current.map((m) => (m.id === assistantId ? { ...m, content: answer } : m)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao responder.");
      setMessages((current) => current.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <>
      <button
        type="button"
        className="assistant-fab"
        onClick={() => setOpen(!open)}
        aria-label="Abrir assistente inteligente"
        title="Assistente Oasis"
      >
        {open ? <FiX /> : <FiMessageCircle />}
      </button>

      {open && (
        <aside className="assistant-card" aria-label="Painel da assistente inteligente">
          <header className="assistant-card-header">
            <div>
              <span className="assistant-kicker">OASIS IMPORTS</span>
              <h2>Assistente Inteligente</h2>
            </div>
            <div className="assistant-header-actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="assistant-header-btn"
                  onClick={() => setMessages([])}
                  title="Limpar conversa"
                  aria-label="Limpar conversa"
                >
                  <FiTrash2 />
                </button>
              )}
              <button
                type="button"
                className="assistant-header-btn"
                onClick={() => setOpen(false)}
                title="Fechar assistente"
                aria-label="Fechar assistente"
              >
                <FiX />
              </button>
            </div>
          </header>

          <Conversation className="assistant-conversation">
            <ConversationContent className="assistant-conversation-content">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Como posso ajudar hoje?"
                  description="Pergunte sobre estoque, pedidos ou desempenho dos catálogos."
                  suggestions={suggestions}
                  onSelectSuggestion={(s) => void send(s)}
                  className="assistant-empty-state"
                />
              ) : (
                messages.map((message) => (
                  <Message
                    key={message.id}
                    from={message.role}
                    className={`assistant-bubble assistant-bubble-${message.role}`}
                  >
                    <MessageContent className="assistant-bubble-content">
                      <MessageResponse>{message.content}</MessageResponse>
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton className="assistant-scroll-btn" />
          </Conversation>

          <footer className="assistant-footer">
            {error && <p className="assistant-error">{error}</p>}
            <form onSubmit={submit} className="assistant-form">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Pergunte algo sobre seus produtos ou pedidos..."
                rows={1}
                disabled={busy}
                className="assistant-input"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="assistant-submit"
                aria-label="Enviar mensagem"
              >
                <FiArrowUp />
              </Button>
            </form>
          </footer>
        </aside>
      )}
    </>
  );
}
