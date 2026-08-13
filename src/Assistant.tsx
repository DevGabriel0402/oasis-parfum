import { FormEvent, useState } from "react";
import { FiArrowUp, FiMessageCircle, FiTrash2 } from "react-icons/fi";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setMessages([
      ...history,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível consultar a Groq.");
      }
      if (!response.body) throw new Error("A resposta do modelo veio vazia.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: answer }
              : message,
          ),
        );
      }
    } catch (caught) {
      setMessages((current) =>
        current.filter((message) => message.id !== assistantId),
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar o assistente.",
      );
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="assistant-page">
      <div className="page-head assistant-head">
        <div>
          <span className="eyebrow">GROQ · LLAMA 3.3 70B</span>
          <h1>Assistente Oasis</h1>
          <p>Analise catálogo, estoque, pedidos e vendas em uma conversa.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={() => setMessages([])}>
            <FiTrash2 /> Limpar conversa
          </Button>
        )}
      </div>

      <section className="assistant-panel">
        <Conversation className="assistant-conversation">
          <ConversationContent className="assistant-messages">
            {!messages.length ? (
              <ConversationEmptyState>
                <div className="assistant-empty">
                  <FiMessageCircle className="assistant-empty-icon" />
                  <h2>Como posso ajudar hoje?</h2>
                  <p>Consulte os dados atuais da planilha, sem informações pessoais de clientes.</p>
                  <div className="assistant-suggestions">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        onClick={() => void send(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.content ? (
                      <MessageResponse>{message.content}</MessageResponse>
                    ) : (
                      <span className="assistant-thinking">Analisando…</span>
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="assistant-composer">
          {error && <p className="form-error" role="alert">{error}</p>}
          <form onSubmit={submit}>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim()) void send(input);
                }
              }}
              placeholder="Escreva sua mensagem…"
              rows={2}
              disabled={busy}
            />
            <Button type="submit" size="icon-lg" disabled={busy || !input.trim()} aria-label="Enviar mensagem">
              <FiArrowUp />
            </Button>
          </form>
          <small>O assistente pode cometer erros. Confirme informações importantes.</small>
        </div>
      </section>
    </div>
  );
}
