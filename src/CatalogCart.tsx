import { AnimatePresence, motion } from 'motion/react'
import { FiArrowRight, FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from 'react-icons/fi'
import type { Product } from './types'

type CatalogProduct = Product & { price?: number }
type Props = { open: boolean; products: CatalogProduct[]; cart: Record<string, number>; onClose: () => void; onQuantity: (id: string, quantity: number) => void; onCheckout: () => void; whatsapp: string }
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const price = (product: CatalogProduct) => Number(product.price || product.retailPrice)

export default function CatalogCart({ open, products, cart, onClose, onQuantity, onCheckout, whatsapp }: Props) {
    const items = products.filter(product => cart[product.id] > 0)
    const count = items.reduce((sum, product) => sum + cart[product.id], 0)
    const total = items.reduce((sum, product) => sum + cart[product.id] * price(product), 0)
    return <AnimatePresence>{open && <><motion.button className="cart-drawer-backdrop" aria-label="Fechar carrinho" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.aside className="cart-drawer" aria-label="Itens selecionados" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 330, damping: 34 }}><header><div><span className="eyebrow">SUA SELEÇÃO</span><h2>{count} {count === 1 ? 'item' : 'itens'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><FiX /></button></header><div className="cart-drawer-items">{items.length ? items.map(product => <motion.article layout className="cart-line" key={product.id}><div className="cart-line-image">{product.image ? <img src={product.image} alt="" /> : <span>O</span>}</div><div className="cart-line-info"><small>{product.brand}</small><h3>{product.name}</h3><strong>{money(price(product))}</strong><div className="quantity-control"><button onClick={() => onQuantity(product.id, cart[product.id] - 1)} aria-label={'Diminuir ' + product.name}>{cart[product.id] === 1 ? <FiTrash2 /> : <FiMinus />}</button><span>{cart[product.id]}</span><button onClick={() => onQuantity(product.id, cart[product.id] + 1)} aria-label={'Aumentar ' + product.name}><FiPlus /></button></div></div><b>{money(price(product) * cart[product.id])}</b></motion.article>) : <div className="cart-empty"><FiShoppingBag /><h3>Sua seleção está vazia</h3><p>Escolha uma fragrância para começar.</p></div>}</div><footer><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="button cart-checkout" onClick={onCheckout} disabled={!items.length || !whatsapp}>Finalizar pelo WhatsApp <FiArrowRight /></button>{!whatsapp && items.length > 0 && <small>Configure o WhatsApp para habilitar a finalização.</small>}</footer></motion.aside></>}</AnimatePresence>
}
