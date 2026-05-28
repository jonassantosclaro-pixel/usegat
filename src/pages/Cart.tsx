import { useCart } from '@/src/lib/CartContext';
import { useAuth } from '@/src/lib/AuthContext';
import { formatPrice } from '@/src/lib/utils';
import { ShoppingBag, X, Trash2, ArrowLeft, CheckSquare, Gift, Heart, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import { PaymentMethods } from '../components/cart/PaymentMethods';
import axios from 'axios';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function Cart() {
  const { items, removeItem, total, clearCart, subtotal, discountAmount, appliedCoupon, applyCoupon, addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Custom Gift wraps state (+R$ 9,90)
  const [addGiftWrap, setAddGiftWrap] = useState(false);

  // Leve + Pague Menos Promo Products
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);

  useEffect(() => {
    const fetchPromoProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPromoProducts(list);
      } catch (err) {
        console.error("Error fetching promotional products:", err);
      } finally {
        setPromoLoading(false);
      }
    };
    fetchPromoProducts();
  }, []);

  const handleProcessOrder = async (customerData: any) => {
    try {
      const response = await axios.post('/api/checkout', {
        cliente: {
          nome: customerData.nome,
          cpf_cnpj: customerData.cpf_cnpj,
          email: customerData.email,
          telefone: customerData.telefone
        },
        endereco: {
          cep: customerData.cep,
          rua: customerData.rua,
          numero: customerData.numero,
          cidade: customerData.cidade,
          estado: customerData.estado
        },
        produtos: items.map(i => ({
          nome: i.name,
          sku: i.sku || i.id.toUpperCase(),
          quantidade: i.quantity,
          valor_unitario: i.price,
          personalizacao: i.customization
        })),
        valor_frete: customerData.valor_frete,
        giftWrapChecked: addGiftWrap
      });

      // Clear cart on success
      clearCart();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Advanced Progressive discounts
  const progressiveDiscount = subtotal >= 300 ? subtotal * 0.1 : subtotal >= 200 ? subtotal * 0.05 : 0;
  const giftWrapTotal = addGiftWrap ? items.reduce((acc, item) => acc + (item.customization ? 9.90 * item.quantity : 0), 0) : 0;

  // Free shipping guide
  const FREE_SHIPPING_LIMIT = 150;
  const differenceToFreeShipping = FREE_SHIPPING_LIMIT - subtotal;
  const isFreeShipping = subtotal >= FREE_SHIPPING_LIMIT;
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_LIMIT) * 100, 100);

  const activeShippingCost = isFreeShipping ? 0 : (showCheckout ? shippingCost : 18.00);
  const finalSubtotal = Math.max(0, subtotal - progressiveDiscount - discountAmount + giftWrapTotal);
  const finalTotal = finalSubtotal + activeShippingCost;

  const suggestedProducts = promoProducts
    .filter(p => !items.some(item => item.id === p.id))
    .slice(0, 4);
  
  const displayPromoProducts = suggestedProducts.length > 0 
    ? suggestedProducts 
    : promoProducts.slice(0, 4);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', couponInput.trim().toUpperCase()), 
        where('active', '==', true)
      );
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        alert("Cupom inválido ou expirado.");
        applyCoupon(null);
      } else {
        const docData = querySnap.docs[0].data();
        applyCoupon({
          code: docData.code,
          type: docData.type,
          value: docData.value
        });
        alert("Cupom aplicado com sucesso!");
        setCouponInput('');
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao validar cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0 && !showCheckout) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center space-y-8">
        <div className="w-24 h-24 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10 text-brand-primary" />
        </div>
        <h1 className="text-5xl font-serif text-brand-black leading-none">Seu carrinho está vazio</h1>
        <p className="text-brand-gray font-medium max-w-sm mx-auto leading-relaxed italic text-sm">
          Parece que você ainda não adicionou nenhum mimo. Que tal começar a personalizar?
        </p>
        <Link 
          to="/" 
          className="inline-flex bg-brand-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-[#FAF7F8] hover:bg-brand-primary-light transition-colors shadow-lg"
        >
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex justify-between items-center mb-16 border-b border-brand-gold/10 pb-6">
        <div>
          <span className="text-brand-gold font-handwriting text-2xl">Revisão de mimos</span>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase leading-none mt-1 text-brand-black">
            {showCheckout ? 'Preencher Cadastro' : 'Carrinho de Goles'}
          </h1>
        </div>
        {showCheckout ? (
          <button 
            onClick={() => setShowCheckout(false)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-gray hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Carrinho
          </button>
        ) : (
          <button 
            onClick={clearCart}
            className="text-xs font-black uppercase tracking-widest text-brand-gray hover:text-brand-primary flex items-center transition-colors border border-stone-200 px-4 py-2 rounded-full hover:bg-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Carrinho
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Left Column: Cart items / Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* FREE SHIPPING PROGRESS BAR */}
          {!showCheckout && (
            <div className="bg-[#FAF7F8]/80 border border-brand-gold/10 p-6 rounded-[2.5rem] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-serif italic font-bold text-brand-black">
                  {isFreeShipping 
                    ? "✨ Parabéns! Você ganhou Frete Grátis!" 
                    : `Faltam apenas ${formatPrice(differenceToFreeShipping)} para ganhar Frete Grátis!`}
                </span>
                <span className="font-black text-brand-primary">{isFreeShipping ? "100%" : `${Math.round(freeShippingProgress)}%`}</span>
              </div>
              <div className="w-full bg-stone-150 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-gold h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Promoção especial USE GAT para todo o Brasil em compras acima de R$ 150.</p>
            </div>
          )}

          {showCheckout ? (
            <CheckoutForm 
              totalProducts={finalSubtotal} 
              onProcess={handleProcessOrder} 
              onShippingUpdate={setShippingCost} 
            />
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white p-6 rounded-[3rem] shadow-sm border border-stone-150/40 hover:border-brand-gold/20 transition-all"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#FAF7F8] rounded-[2rem] overflow-hidden flex-shrink-0 p-2 flex items-center justify-center border border-stone-100">
                      <img 
                        src={item.imageUrl || "/imagens/mugs-boho.jpg"} 
                        alt={item.name} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAF7F8] border border-stone-100 text-[9px] font-black uppercase text-[#8C6A3B] px-2 py-0.5 rounded">
                          {item.sku || 'E-GAT'}
                        </span>
                        {item.customization && (
                          <span className="text-[8px] font-black text-brand-primary bg-brand-pink-light px-2 py-0.5 rounded uppercase">
                            ✨ Customizado
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-serif italic font-bold text-xl text-brand-black">{item.name}</h3>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-brand-gray">
                        <span>Quantidade: {item.quantity}</span>
                        <span>•</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>

                      {/* Display complex story configs */}
                      {item.customization && (
                        <div className="bg-[#FAF7F8] p-4 rounded-2xl space-y-1.5 text-[11px] font-medium text-brand-black border border-stone-100">
                          {item.customization.nome && <p><strong>Nome:</strong> {item.customization.nome}</p>}
                          {item.customization.frase && <p><strong>Frase/Data:</strong> {item.customization.frase}</p>}
                          {item.customization.fonte && (
                            <p>
                              <strong>Fonte de Letra:</strong>{" "}
                              <span 
                                className="text-xs text-[#4D1D54] font-bold"
                                style={{ 
                                  fontFamily: (item.customization.fonte === 'Hello Valentica' || item.customization.fonte === 'Hello Valentina')
                                    ? '"Hello Valentina", sans-serif'
                                    : item.customization.fonte === 'Cream Cake'
                                    ? '"Cream Cake", sans-serif'
                                    : item.customization.fonte === 'Billion Miracles'
                                    ? '"Billion Miracles", sans-serif'
                                    : '"Quicksand", sans-serif'
                                }}
                              >
                                {item.customization.fonte}
                              </span>
                            </p>
                          )}
                          {item.customization.elementsStyle && (
                            <p><strong>Estilo dos Itens:</strong> {item.customization.elementsStyle === 'colorido' ? '🎨 Colorido' : '🔲 Contornos em Preto'}</p>
                          )}
                          {item.customization.comidas && <p><strong>Comidas:</strong> <span className="text-brand-primary">{item.customization.comidas}</span></p>}
                          {item.customization.bebidas && <p><strong>Bebidas:</strong> <span className="text-brand-primary">{item.customization.bebidas}</span></p>}
                          {item.customization.lazer && <p><strong>Lazer/Esportes:</strong> <span className="text-brand-primary">{item.customization.lazer}</span></p>}
                          {item.customization.momentos && <p><strong>Momentos/Pessoas:</strong> <span className="text-brand-primary">{item.customization.momentos}</span></p>}
                          {item.customization.caricatura && (
                            <div className="pt-1.5 mt-1.5 border-t border-dashed border-stone-200 text-[10px] text-[#8C6A3B] font-bold">
                              🎨 Caricatura Adicional Adicionada! ({item.customization.caricatura.qtd} personagem{item.customization.caricatura.qtd > 1 && 's'} - {item.customization.caricatura.estilo})
                            </div>
                          )}
                          {item.customization.formaPagamento && (
                            <div className="pt-1.5 mt-1.5 border-t border-dashed border-stone-200 text-[10px] text-green-700 font-extrabold flex items-center gap-1 flex-wrap">
                              <span>✓ Pagamento Escolhido:</span>
                              <span className="text-stone-700 font-bold">{item.customization.formaPagamento}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-0 border-stone-100">
                      <div className="space-y-1">
                        <span className="font-serif font-black text-2xl text-brand-primary block">{formatPrice(item.price * item.quantity)}</span>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Subtotal</span>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.customization)}
                        className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Promo section "Leve + Pague Menos" */}
              {!showCheckout && displayPromoProducts.length > 0 && (
                <div id="leve-mais-pague-menos" className="bg-[#FAF7F8] border border-brand-gold/20 p-6 sm:p-8 rounded-[2.5rem] mt-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between border-b border-brand-gold/10 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                        <Gift className="w-6 h-6 text-[#8C6A3B] animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-serif font-black text-brand-black text-lg md:text-xl">Leve + Pague Menos! 🔥</h4>
                        <p className="text-xs text-brand-gray font-semibold leading-normal">
                          Adicione um desses queridinhos ao carrinho com <span className="text-[#8C6A3B] font-bold">15% de DESCONTO</span> exclusivo neste item!
                        </p>
                      </div>
                    </div>
                    <span className="bg-[#8C6A3B] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                      Desconto automático!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayPromoProducts.map((p) => {
                      const promoPrice = p.price * 0.85;
                      return (
                        <div 
                          key={p.id} 
                          className="flex items-center gap-3 bg-white p-3.5 rounded-[2rem] border border-stone-150 hover:border-brand-gold/30 hover:shadow-md transition-all group"
                        >
                          <div className="w-14 h-14 bg-[#FAF7F8] rounded-2xl overflow-hidden p-1 flex-shrink-0 flex items-center justify-center border border-stone-100 group-hover:scale-105 transition-transform">
                            <img 
                              src={p.imageUrl || "/imagens/mugs-boho.jpg"} 
                              alt={p.name} 
                              className="w-full h-full object-contain" 
                            />
                          </div>
                          <div className="flex-grow space-y-1 min-w-0">
                            <h5 className="font-serif italic font-bold text-xs text-brand-black truncate">{p.name}</h5>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-gray-400 line-through font-medium">
                                {formatPrice(p.price)}
                              </span>
                              <span className="text-xs font-black text-brand-primary">
                                {formatPrice(promoPrice)}
                              </span>
                              <span className="text-[8px] font-extrabold text-green-700 bg-green-50 px-1 py-0.5 rounded uppercase tracking-wider">
                                15% OFF
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            id={`add-promo-${p.id}`}
                            onClick={() => {
                              addItem({
                                id: p.id,
                                name: `${p.name} (Leve + Pague Menos)`,
                                price: parseFloat(promoPrice.toFixed(2)),
                                imageUrl: p.imageUrl || "/imagens/mugs-boho.jpg",
                                quantity: 1,
                                sku: p.sku || p.id.toUpperCase()
                              });
                            }}
                            className="bg-brand-primary text-white hover:bg-brand-primary-light active:scale-95 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full transition-all shadow-sm shrink-0 whitespace-nowrap"
                          >
                            + Levar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gift Wrapping Box surcharge selector */}
              {items.some(i => i.customization) && (
                <div className="bg-[#FAF7F8]/80 border border-brand-gold/15 p-6 rounded-[2.5rem] flex items-center justify-between gap-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-brand-black text-md">Embalagem Rústica Boho Especial</h4>
                      <p className="text-xs text-brand-gray font-medium leading-normal italic">
                        Quer enviar como presente? Embrulhamos suas garrafas/canecas com palha de trigo perfumada e selo de cera real por apenas R$ 9,90 cada item personalizado.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddGiftWrap(!addGiftWrap)}
                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                      addGiftWrap 
                        ? 'bg-[#4D1D54] text-white border-[#4D1D54]' 
                        : 'bg-white text-gray-600 border-stone-200 hover:border-brand-gold/30'
                    }`}
                  >
                    {addGiftWrap ? "✓ Adicionado" : "Adicionar"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Calculations and Checkout options */}
        <div className="lg:col-span-1">
          <div className="bg-brand-primary text-white p-10 rounded-[45px] sticky top-32 shadow-2xl overflow-hidden border border-white/10 space-y-8">
            <h2 className="text-2xl font-serif font-black pb-4 border-b border-white/10 uppercase tracking-wide">Resumo do Pedido</h2>
            
            <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-white/75">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              
              {progressiveDiscount > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Desconto Progressivo</span>
                  <span>-{formatPrice(progressiveDiscount)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Cupom ({appliedCoupon?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              {addGiftWrap && (
                <div className="flex justify-between">
                  <span>Embalagem Presente GAT</span>
                  <span className="text-white">{formatPrice(giftWrapTotal)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Frete</span>
                <span className="text-white">
                  {isFreeShipping ? "Grátis!" : (showCheckout ? formatPrice(shippingCost) : "A calcular")}
                </span>
              </div>

              {/* Coupon Applicator */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block">Cupom de Desconto</span>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20">
                    <div>
                      <span className="font-extrabold text-xs text-green-300 block uppercase tracking-wider">{appliedCoupon.code}</span>
                      <span className="text-[9px] font-medium text-white/70">
                        {appliedCoupon.type === 'percentage' 
                          ? `${appliedCoupon.value}% de desconto` 
                          : `${formatPrice(appliedCoupon.value)} de desconto`}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => applyCoupon(null)}
                      className="text-white/60 hover:text-white transition-colors hover:scale-110 p-1 bg-white/5 hover:bg-white/10 rounded-full"
                      title="Remover cupom"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="DIGITE SEU CUPOM"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-4 py-3 placeholder-white/40 text-xs font-black uppercase tracking-widest outline-none focus:border-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="bg-[#B48A4E] hover:bg-[#c99d5c] disabled:opacity-50 text-white px-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      {couponLoading ? '...' : 'APLICAR'}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-md font-serif italic text-white/80">Total Geral</span>
                <span className="text-3xl font-serif font-black text-white tracking-tight">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {!showCheckout && (
              <div className="pt-4">
                {/* Traditional Checkout */}
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-brand-primary hover:bg-brand-primary-light text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4" />
                  PAGAR NO SITE (PIX/CARTÃO)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
