import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice } from '@/src/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { collection, limit, query, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function CartSidebar() {
  const { isSidebarOpen, setIsSidebarOpen, items, updateQuantity, removeItem, total } = useCart();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSuggestions() {
      const q = query(collection(db, 'products'), limit(3));
      const snap = await getDocs(q);
      setSuggestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    if (isSidebarOpen) fetchSuggestions();
  }, [isSidebarOpen]);

  const discount = total >= 300 ? total * 0.1 : total >= 200 ? total * 0.05 : 0;
  const finalTotal = total - discount;

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-bg z-[201] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-brand-gray flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-brand-red" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Seu Carrinho</h2>
                <span className="bg-brand-yellow text-[10px] font-black px-2 py-1 rounded-full">
                  {items.length} ITENS
                </span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 bg-brand-gray rounded-full flex items-center justify-center hover:bg-brand-red hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-bold text-gray-400 italic">Seu carrinho está vazio.</p>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="mt-6 text-brand-red font-black uppercase text-xs hover:underline"
                  >
                    Começar a comprar
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-brand-gray rounded-2xl overflow-hidden shrink-0 border-2 border-transparent group-hover:border-brand-yellow transition-all">
                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-xs uppercase italic truncate max-w-[180px]">{item.name}</h4>
                      <p className="text-brand-red font-black text-sm my-1">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center border border-brand-gray rounded-full px-2 py-1 gap-3">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.customization)}><Minus className="w-3 h-3" /></button>
                          <span className="text-[10px] font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.customization)}><Plus className="w-3 h-3" /></button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id, item.customization)}
                          className="text-gray-300 hover:text-brand-red transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Suggestions */}
              {items.length > 0 && (
                <div className="pt-8 border-t border-brand-gray">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-brand-yellow" /> Sugestões para você
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {suggestions.map(s => (
                      <Link to={`/produto/${s.id}`} key={s.id} className="bg-white p-3 rounded-2xl border border-brand-gray hover:border-brand-yellow transition-all">
                        <img src={s.imageUrl} className="w-full h-20 object-cover rounded-xl mb-2" />
                        <p className="text-[9px] font-black uppercase truncate">{s.name}</p>
                        <p className="text-[10px] font-bold text-brand-red">{formatPrice(s.price)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 bg-white border-t border-brand-gray space-y-6">
                {/* Progressive Discount Info */}
                <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/20">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[10px] font-black uppercase text-green-600 mb-1">
                      <span>Desconto Progressivo</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black uppercase tracking-tighter pt-2 border-t border-brand-yellow/20 mt-2">
                    <span>Total</span>
                    <span className="text-brand-red">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => { setIsSidebarOpen(false); navigate('/carrinho'); }}
                    className="w-full bg-brand-black text-white h-14 rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-red transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-black/20"
                  >
                    Finalizar Compra
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-black"
                  >
                    Continuar Comprando
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
