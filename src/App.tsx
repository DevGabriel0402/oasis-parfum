import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  FiArrowRight,
  FiBox,
  FiCheck,
  FiChevronRight,
  FiClipboard,
  FiCopy,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { api } from "./api";
import type { Order, Product } from "./types";
import CatalogCart from "./CatalogCart";

const Assistant = lazy(() => import("./Assistant"));

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
const date = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("pt-BR");
};
const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28 },
};

export default function App() {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    api
      .session()
      .then((r) => setStatus(r.authenticated ? "in" : "out"))
      .catch(() => setStatus("out"));
  }, []);
  if (status === "loading")
    return (
      <div className="splash">
        <Brand />
        <span className="loader" />
      </div>
    );
  return (
    <Routes>
      <Route
        path="/login"
        element={
          status === "in" ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login done={() => setStatus("in")} />
          )
        }
      />
      <Route path="/catalogo/:type" element={<PublicCatalog />} />
      <Route
        path="/*"
        element={
          status === "in" ? (
            <Shell done={() => setStatus("out")} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">O</span>
      <span>
        <b>OASIS</b>
        <small>PARFUMS</small>
      </span>
    </div>
  );
}
function Login({ done }: { done: () => void }) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      done();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Erro ao entrar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <motion.section className="login-card" {...fade}>
        <Brand />
        <div className="login-copy">
          <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Bem-vinda ao seu oásis.</h1>
          <p>Catálogo, pedidos e clientes em um só lugar.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Senha de acesso
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" disabled={busy}>
            {busy ? "Entrando..." : "Entrar no painel"}
            <FiArrowRight />
          </button>
        </form>
        <small className="secure-note">Acesso seguro e sessão protegida</small>
      </motion.section>
      <aside className="login-art">
        <div className="orb one" />
        <div className="orb two" />
        <div className="quote">
          <span>ESSÊNCIA · ELEGÂNCIA · PRESENÇA</span>
          <h2>Perfumes que transformam momentos em memórias.</h2>
        </div>
      </aside>
    </main>
  );
}

const nav = [
  ["/dashboard", "Visão geral", FiHome],
  ["/produtos", "Produtos", FiPackage],
  ["/pedidos", "Pedidos", FiClipboard],
  ["/catalogos", "Catálogos", FiGrid],
  ["/assistente", "Assistente", FiMessageCircle],
  ["/configuracoes", "Configurações", FiSettings],
] as const;
function Shell({ done }: { done: () => void }) {
  const [open, setOpen] = useState(false),
    location = useLocation(),
    navigate = useNavigate();
  async function logout() {
    await api.logout().catch(() => {});
    done();
    navigate("/login");
  }
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "open" : "")}>
        <div className="side-top">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
          >
            <FiX />
          </button>
        </div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon />
              <span>{label}</span>
              <FiChevronRight className="nav-arrow" />
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="admin-avatar">OP</div>
          <div>
            <b>Oasis Parfums</b>
            <small>Administrador</small>
          </div>
          <button className="icon-button" onClick={logout}>
            <FiLogOut />
          </button>
        </div>
      </aside>
      {open && (
        <div className="backdrop mobile-only" onClick={() => setOpen(false)} />
      )}
      <main className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </button>
          <div>
            <span className="eyebrow">OASIS PARFUMS</span>
            <b>
              {nav.find((x) => location.pathname.startsWith(x[0]))?.[1] ||
                "Painel"}
            </b>
          </div>
          <a className="button soft" href="/catalogo/varejo" target="_blank">
            Ver catálogo <FiArrowRight />
          </a>
        </header>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} className="page" {...fade}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/catalogos" element={<CatalogLinks />} />
              <Route
                path="/assistente"
                element={
                  <Suspense
                    fallback={
                      <div className="loading-row">
                        <span className="loader" /> Carregando assistente…
                      </div>
                    }
                  >
                    <Assistant />
                  </Suspense>
                }
              />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function PageHead(p: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{p.eyebrow}</span>
        <h1>{p.title}</h1>
        <p>{p.description}</p>
      </div>
      {p.action}
    </div>
  );
}
function Notice({ message }: { message: string }) {
  return (
    <div className="notice">
      <FiSettings />
      <div>
        <b>Conecte a planilha</b>
        <p>{message}</p>
      </div>
    </div>
  );
}
function Empty(p: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="empty">
      <span>{p.icon}</span>
      <b>{p.title}</b>
      <p>{p.text}</p>
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
function PanelTitle({ title }: { title: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
    </div>
  );
}
function Stat(p: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <div className={"stat-icon " + (p.tone || "green")}>{p.icon}</div>
      <div>
        <span>{p.label}</span>
        <strong>{p.value}</strong>
        <small>{p.hint}</small>
      </div>
    </div>
  );
}
function Quick(p: {
  icon: React.ReactNode;
  title: string;
  text: string;
  to: string;
}) {
  return (
    <NavLink className="quick-link" to={p.to}>
      <span>{p.icon}</span>
      <div>
        <b>{p.title}</b>
        <small>{p.text}</small>
      </div>
      <FiChevronRight />
    </NavLink>
  );
}

function useData() {
  const [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.products(), api.orders()])
      .then(([p, o]) => {
        setProducts(p.products);
        setOrders(o.orders);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return { products, orders, loading, error };
}
function Dashboard() {
  const { products, orders, loading, error } = useData(),
    total = orders.reduce((a, b) => a + b.total, 0),
    recent = [...orders].reverse().slice(0, 5);
  return (
    <>
      <PageHead
        eyebrow="RESUMO DO NEGÓCIO"
        title="Olá, Oasis!"
        description="Aqui está o que está acontecendo com sua loja hoje."
      />
      {error && <Notice message={error} />}
      <div className="stats">
        <Stat
          icon={<FiTrendingUp />}
          label="Vendas registradas"
          value={loading ? "—" : money(total)}
          hint="total da planilha"
        />
        <Stat
          icon={<FiShoppingBag />}
          label="Pedidos"
          value={loading ? "—" : String(orders.length)}
          hint="todos os períodos"
        />
        <Stat
          icon={<FiBox />}
          label="Produtos ativos"
          value={
            loading ? "—" : String(products.filter((p) => p.active).length)
          }
          hint={products.length + " cadastrados"}
        />
        <Stat
          icon={<FiPackage />}
          label="Estoque baixo"
          value={
            loading ? "—" : String(products.filter((p) => p.stock <= 5).length)
          }
          hint="5 unidades ou menos"
          tone="sand"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <PanelTitle title="Pedidos recentes" />
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <b>{o.id}</b>
                      </td>
                      <td>{o.customer || "—"}</td>
                      <td>{date(o.date)}</td>
                      <td>{money(o.total)}</td>
                      <td>
                        <Badge>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={<FiClipboard />}
              title="Nenhum pedido ainda"
              text="Os novos pedidos aparecerão aqui."
            />
          )}
        </section>
        <section className="panel quick">
          <PanelTitle title="Acesso rápido" />
          <Quick
            icon={<FiPlus />}
            title="Novo produto"
            text="Cadastre uma nova fragrância"
            to="/produtos"
          />
          <Quick
            icon={<FiGrid />}
            title="Compartilhar catálogo"
            text="Copie os links públicos"
            to="/catalogos"
          />
          <Quick
            icon={<FiUsers />}
            title="Ver pedidos"
            text="Acompanhe as vendas"
            to="/pedidos"
          />
        </section>
      </div>
    </>
  );
}

const blank = {
  name: "",
  brand: "",
  description: "",
  image: "",
  retailPrice: 0,
  wholesalePrice: 0,
  stock: 0,
  category: "Perfumes",
  active: true,
  featured: false,
  wholesaleMinimum: 1,
  slug: "",
};
function Products() {
  const [products, setProducts] = useState<Product[]>([]),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<Partial<Product> | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  function load() {
    setLoading(true);
    api
      .products()
      .then((r) => {
        setProducts(r.products);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  const shown = products.filter((p) =>
    (p.name + " " + p.brand + " " + p.category)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow="GESTÃO DE CATÁLOGO"
        title="Produtos"
        description="Gerencie fragrâncias, preços e disponibilidade."
        action={
          <button className="button primary" onClick={() => setEditing(blank)}>
            <FiPlus /> Novo produto
          </button>
        }
      />
      {error && <Notice message={error} />}
      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <FiSearch />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto, marca ou categoria..."
            />
          </label>
          <span>{shown.length} produtos</span>
        </div>
        {loading ? (
          <div className="loading-row">
            <span className="loader" />
            Carregando...
          </div>
        ) : shown.length ? (
          <div className="product-grid">
            {shown.map((p) => (
              <button
                className="product-card"
                key={p.id}
                onClick={() => setEditing(p)}
              >
                <div className="product-image">
                  {p.image ? <img src={p.image} alt="" /> : <span>O</span>}
                  {p.featured && <em>Destaque</em>}
                </div>
                <div className="product-info">
                  <small>{p.brand || p.category}</small>
                  <h3>{p.name || "Produto sem nome"}</h3>
                  <div>
                    <strong>{money(p.retailPrice)}</strong>
                    <span>{p.stock} un.</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            icon={<FiPackage />}
            title="Nenhum produto"
            text="Cadastre sua primeira fragrância."
          />
        )}
      </section>
      <AnimatePresence>
        {editing && (
          <ProductModal
            product={editing}
            close={() => setEditing(null)}
            saved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
function ProductModal({
  product,
  close,
  saved,
}: {
  product: Partial<Product>;
  close: () => void;
  saved: () => void;
}) {
  const [form, setForm] = useState({ ...blank, ...product }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const field =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({
        ...form,
        [key]:
          e.target.type === "number" ? Number(e.target.value) : e.target.value,
      });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveProduct(form, Boolean(product.id));
      saved();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Erro ao salvar.");
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
      <motion.form
        className="modal"
        onSubmit={submit}
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2>{product.id ? "Editar produto" : "Novo produto"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={close}>
            <FiX />
          </button>
        </div>
        <div className="form-grid">
          <label className="wide">
            Nome
            <input required value={form.name} onChange={field("name")} />
          </label>
          <label>
            Marca
            <input value={form.brand} onChange={field("brand")} />
          </label>
          <label>
            Categoria
            <input value={form.category} onChange={field("category")} />
          </label>
          <label>
            Preço varejo
            <input
              type="number"
              step=".01"
              value={form.retailPrice}
              onChange={field("retailPrice")}
            />
          </label>
          <label>
            Preço atacado
            <input
              type="number"
              step=".01"
              value={form.wholesalePrice}
              onChange={field("wholesalePrice")}
            />
          </label>
          <label>
            Estoque
            <input type="number" value={form.stock} onChange={field("stock")} />
          </label>
          <label>
            Mínimo atacado
            <input
              type="number"
              value={form.wholesaleMinimum}
              onChange={field("wholesaleMinimum")}
            />
          </label>
          <label className="wide">
            URL da imagem
            <input value={form.image} onChange={field("image")} />
          </label>
          <label className="wide">
            Descrição
            <textarea
              rows={3}
              value={form.description}
              onChange={field("description")}
            />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={close}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Salvando..." : "Salvar produto"}
            <FiCheck />
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .orders()
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageHead
        eyebrow="ACOMPANHAMENTO"
        title="Pedidos"
        description="Histórico sincronizado com a aba Pedidos da planilha."
      />
      {error && <Notice message={error} />}
      <section className="panel">
        {orders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Itens</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].reverse().map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b>{o.id}</b>
                    </td>
                    <td>
                      {o.customer || "—"}
                      <small className="cell-sub">{o.phone}</small>
                    </td>
                    <td>{o.type}</td>
                    <td>{o.quantity || "—"}</td>
                    <td>{date(o.date)}</td>
                    <td>
                      <b>{money(o.total)}</b>
                    </td>
                    <td>
                      <Badge>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<FiShoppingBag />}
            title="Ainda não há pedidos"
            text="Os pedidos registrados serão exibidos aqui."
          />
        )}
      </section>
    </>
  );
}
function CatalogLinks() {
  const origin = window.location.origin,
    [done, setDone] = useState("");
  const links = [
    ["varejo", "Catálogo de varejo", "Preços para o consumidor final."],
    [
      "atacado",
      "Catálogo de atacado",
      "Valores e quantidades para revendedores.",
    ],
  ];
  async function copy(type: string) {
    await navigator.clipboard.writeText(origin + "/catalogo/" + type);
    setDone(type);
    setTimeout(() => setDone(""), 1800);
  }
  return (
    <>
      <PageHead
        eyebrow="LINKS PÚBLICOS"
        title="Catálogos"
        description="Compartilhe a coleção certa para cada cliente."
      />
      <div className="link-grid">
        {links.map(([type, title, text]) => (
          <section className="catalog-link" key={type}>
            <div className={"catalog-visual " + type}>
              <Brand />
              <span>{type.toUpperCase()}</span>
            </div>
            <div className="catalog-link-body">
              <h2>{title}</h2>
              <p>{text}</p>
              <div className="copy-field">
                <span>
                  {origin.replace(/^https?:\/\//, "") + "/catalogo/" + type}
                </span>
                <button onClick={() => copy(type)}>
                  {done === type ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
              <a
                className="button soft full"
                href={"/catalogo/" + type}
                target="_blank"
              >
                Abrir catálogo <FiArrowRight />
              </a>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
function Settings() {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (next.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }
    if (current === next) {
      setError("Escolha uma senha diferente da atual.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(
        "Senha alterada com sucesso. Use a nova senha no próximo acesso.",
      );
    } catch (x) {
      setError(
        x instanceof Error ? x.message : "Não foi possível alterar a senha.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="PREFERÊNCIAS"
        title="Configurações"
        description="Dados sensíveis permanecem protegidos no servidor."
      />
      <div className="settings-grid">
        <section className="panel">
          <PanelTitle title="Alterar senha" />
          <form className="password-form" onSubmit={submit}>
            <label>
              Senha atual
              <input
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </label>
            <label>
              Nova senha
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
              />
            </label>
            <label>
              Confirmar nova senha
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Digite novamente"
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="form-success" role="status">
                <FiCheck />
                {success}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? "Alterando..." : "Alterar senha"}
              <FiArrowRight />
            </button>
          </form>
        </section>
        <section className="panel">
          <PanelTitle title="Segurança" />
          <div className="setting-row">
            <FiCheck />
            <div>
              <b>Sessão persistente</b>
              <p>Cookie seguro e inacessível por JavaScript.</p>
            </div>
          </div>
          <div className="setting-row">
            <FiCheck />
            <div>
              <b>Senha protegida</b>
              <p>Somente o hash bcrypt é armazenado na planilha.</p>
            </div>
          </div>
          <div className="setting-row">
            <span className="status-dot" />
            <div>
              <b>Google Sheets conectado</b>
              <p>Autenticação federada sem chave privada.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function PublicCatalog() {
  const { type = "varejo" } = useParams(),
    [products, setProducts] = useState<Product[]>([]),
    [whatsapp, setWhatsapp] = useState(""),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [cart, setCart] = useState<Record<string, number>>({}),
    [cartOpen, setCartOpen] = useState(false);
  const isWholesale = type === "atacado";
  useEffect(() => {
    api
      .catalog(type)
      .then((r) => {
        setProducts(r.products);
        setWhatsapp(r.whatsapp);
      })
      .finally(() => setLoading(false));
  }, [type]);
  const shown = products.filter((p) =>
      (p.name + " " + p.brand + " " + p.category)
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    count = Object.values(cart).reduce((a, b) => a + b, 0),
    price = (p: Product) =>
      Number((p as Product & { price: number }).price || p.retailPrice);
  async function updateQuantity(id: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }
  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setCartOpen(true);
  }
  async function checkout() {
    if (isWholesale && count < 5) {
      setCartOpen(true);
      return;
    }
    const selected = products.filter((p) => cart[p.id]),
      lines = selected.map(
        (p) =>
          "• " +
          cart[p.id] +
          "x " +
          p.name +
          " — " +
          money(cart[p.id] * price(p)),
      );
    const order = await api.checkout({
      type,
      items: selected.map((p) => ({ id: p.id, quantity: cart[p.id] })),
    });
    const message =
      "Olá! Gostaria de fazer este pedido no catálogo de " +
      type +
      ":\n\n" +
      lines.join("\n") +
      "\n\nPedido: " +
      order.id +
      "\nTotal: " +
      money(order.total);
    window.open(
      "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message),
      "_blank",
    );
  }
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <nav>
          <a href="#colecao">Coleção</a>
          <a href="#sobre">Sobre a Oasis</a>
        </nav>
        <div className="public-header-actions">
          <div className="catalog-type">
            Catálogo <b>{type}</b>
          </div>
          <button
            className="catalog-cart-button"
            onClick={() => setCartOpen(true)}
          >
            <FiShoppingBag />
            <span>Seleção</span>
            {count > 0 && <b>{count}</b>}
          </button>
        </div>
      </header>
      <section className="hero">
        <motion.div {...fade}>
          <span className="eyebrow">
            {isWholesale
              ? "CONDIÇÃO ESPECIAL PARA REVENDEDORES"
              : "UMA FRAGRÂNCIA PARA SER LEMBRADA"}
          </span>
          <h1>
            {isWholesale ? "Mais margem para" : "Sua presença começa"}
            <br />
            {isWholesale ? "o seu negócio." : "antes das palavras."}
          </h1>
          <p>
            {isWholesale
              ? "Monte seu pedido com 5 peças ou mais e aproveite os valores especiais de atacado da Oasis Parfums."
              : "Escolha a fragrância que traduz sua personalidade e transforme cada chegada em uma impressão inesquecível."}
          </p>
          <div className="hero-benefits" aria-label="Vantagens do catálogo">
            <span><FiCheck /> {isWholesale ? "A partir de 5 peças" : "Curadoria selecionada"}</span>
            <span><FiCheck /> {isWholesale ? "Mix livre de fragrâncias" : "Escolha com personalidade"}</span>
          </div>
          <a className="button light" href="#colecao">
            {isWholesale ? "Montar pedido de atacado" : "Encontrar minha fragrância"} <FiArrowRight />
          </a>
        </motion.div>
        <div className="hero-bottle">
          <span>O</span>
          <small>
            OASIS
            <br />
            PARFUMS
          </small>
        </div>
      </section>
      <section className="collection" id="colecao">
        <motion.aside className="catalog-notice" {...fade}>
          <div className="catalog-notice-icon"><FiCheck /></div>
          <div>
            <strong>
              {isWholesale
                ? "Atacado liberado a partir de 5 peças"
                : "Escolha uma fragrância que fale por você"}
            </strong>
            <p>
              {isWholesale
                ? "Combine fragrâncias diferentes no mesmo pedido. Ao completar 5 peças, sua condição especial de atacado é liberada."
                : "Descubra aromas marcantes e encontre aquele que transforma presença em assinatura."}
            </p>
          </div>
          <span>{isWholesale ? "MÍNIMO 5 PEÇAS" : "SUA ESSÊNCIA, SUA MARCA"}</span>
        </motion.aside>
        <div className="collection-head">
          <div>
            <span className="eyebrow">NOSSA CURADORIA</span>
            <h2>Fragrâncias em destaque</h2>
          </div>
          <label className="search">
            <FiSearch />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar fragrância..."
            />
          </label>
        </div>
        {loading ? (
          <div className="loading-row">
            <span className="loader" />
            Preparando o catálogo...
          </div>
        ) : (
          <div className="shop-grid">
            {shown.map((p) => (
              <article className="shop-card" key={p.id}>
                <div className="shop-image">
                  {p.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <span>O</span>
                  )}
                  {p.featured && <em>DESTAQUE</em>}
                </div>
                <small>{p.brand || p.category}</small>
                <h3>{p.name}</h3>
                <p>
                  {p.description ||
                    "Uma fragrância especial da curadoria Oasis."}
                </p>
                <div className="shop-action">
                  <strong>{money(price(p))}</strong>
                  <button
                    onClick={() => addToCart(p.id)}
                    aria-label={"Adicionar " + p.name}
                  >
                    <FiPlus />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <CatalogCart
        open={cartOpen}
        products={products}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onQuantity={updateQuantity}
        onCheckout={checkout}
        whatsapp={whatsapp}
        minimumQuantity={isWholesale ? 5 : 1}
      />
      <footer id="sobre">
        <Brand />
        <p>Essências que contam histórias.</p>
        <small>© {new Date().getFullYear()} Oasis Parfums</small>
      </footer>
    </div>
  );
}
