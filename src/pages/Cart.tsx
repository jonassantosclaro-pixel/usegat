import { useCart } from '@/src/lib/CartContext';
import { useAuth } from '@/src/lib/AuthContext';
import { formatPrice } from '@/src/lib/utils';
import { ShoppingBag, X, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import { PaymentMethods } from '../components/cart/PaymentMethods';
import axios from 'axios';

export default function Cart() {
  const { items, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);

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
        valor_frete: customerData.valor_frete
      });

      // Clear cart on success
      clearCart();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const finalTotal = total + shippingCost;

  if (items.length === 0 && !showCheckout) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center">
        <div className="w-24 h-24 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto mb-8">
          <ShoppingBag className="w-10 h-10 text-brand-primary" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-6 text-brand-primary">Seu carrinho está vazio :(</h1>
        <p className="text-gray-500 font-medium mb-12 max-w-md mx-auto">
          Parece que você ainda não escolheu nada. Que tal dar uma olhadinha nos nossos lançamentos?
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center bg-brand-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl"
        >
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic text-brand-primary">
          {showCheckout ? 'Checkout' : 'Carrinho'}
        </h1>
        {showCheckout ? (
          <button 
            onClick={() => setShowCheckout(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Carrinho
          </button>
        ) : (
          <button 
            onClick={clearCart}
            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary flex items-center transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Tudo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          {showCheckout ? (
            <CheckoutForm 
              totalProducts={total} 
              onProcess={handleProcessOrder} 
              onShippingUpdate={setShippingCost} 
            />
          ) : (
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-6 bg-brand-pink-light p-6 rounded-[40px] shadow-sm group border border-brand-pink-light hover:border-brand-primary transition-all"
                  >
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={item.customization?.preview || item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-3xl" 
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-black text-xl mb-1 text-brand-black">{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                        <span>Qtd: {item.quantity}</span>
                        <span>•</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                      {item.customization && (
                        <div className="mt-1 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-brand-primary uppercase">✨ Produto Personalizado</p>
                          {item.customization.nome && (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Nome: {item.customization.nome}</p>
                          )}
                          {item.customization.sobrenome && (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sobrenome: {item.customization.sobrenome}</p>
                          )}
                          {item.customization.sobrenomeOuFrase && (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sobrenome/Frase: {item.customization.sobrenomeOuFrase}</p>
                          )}
                          {item.customization.frase && (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Frase: {item.customization.frase}</p>
                          )}
                          {item.customization.texto && (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Texto: {item.customization.texto}</p>
                          )}
                          {(item.customization.foto || item.customization.foto1) && (
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[9px] font-bold text-gray-500 uppercase">Anexo(s):</span>
                              <div className="flex gap-1">
                                {(item.customization.foto || item.customization.foto1) && <img src={item.customization.foto || item.customization.foto1} className="w-4 h-4 rounded border border-gray-200 object-cover" />}
                                {item.customization.foto2 && <img src={item.customization.foto2} className="w-4 h-4 rounded border border-gray-200 object-cover" />}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-3">
                      <span className="font-black text-xl text-brand-primary">{formatPrice(item.price * item.quantity)}</span>
                      <button 
                        onClick={() => removeItem(item.id, item.customization)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-brand-primary text-white p-10 rounded-[50px] sticky top-32 shadow-2xl overflow-hidden border border-white/20">
            <h2 className="text-3xl font-black tracking-tight mb-10 pb-6 border-b border-white/10 uppercase italic">Resumo</h2>
            <div className="space-y-6 mb-12">
              <div className="flex justify-between font-bold text-white/60 uppercase text-xs tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between font-bold text-white/60 uppercase text-xs tracking-widest">
                <span>Frete</span>
                <span className="text-white">
                  {showCheckout ? (shippingCost > 0 ? formatPrice(shippingCost) : 'Calculando...') : 'À calcular'}
                </span>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <span className="text-lg font-black uppercase italic tracking-tighter text-white/60">Total</span>
                <span className="text-4xl font-black text-white tracking-tighter">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {!showCheckout && (
              <div className="space-y-8">
                <div className="bg-white/10 p-6 rounded-[30px] border border-white/10">
                   <PaymentMethods total={total} isDark className="text-white" />
                </div>
                
                <button 
                  className="w-full bg-white text-brand-primary py-6 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform flex items-center justify-center shadow-xl"
                  onClick={() => {
                    if (!user) alert('Faça login primeiro!');
                    else setShowCheckout(true);
                  }}
                >
                  Prosseguir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
