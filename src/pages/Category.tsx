import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice, cn } from '@/src/lib/utils';
import { ShoppingBag, ChevronLeft, Heart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { FALLBACK_PRODUCTS, Product } from '@/src/lib/productsData';
import { useCart } from '@/src/lib/CartContext';

export default function Category() {
  const { id } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    // Load wishlist
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));

    setLoading(true);
    const q = id === 'novidades' 
      ? query(collection(db, 'products'), limit(20))
      : query(collection(db, 'products'), where('category', '==', id));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Category fallback filtering
      const filteredFallback = id === 'novidades' 
        ? FALLBACK_PRODUCTS 
        : FALLBACK_PRODUCTS.filter(p => p.category === id);

      if (fetched.length === 0) {
        setProducts(filteredFallback);
      } else {
        setProducts(fetched);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore collection empty or offline. Falling back to static data for category:", id);
      const filteredFallback = id === 'novidades' 
        ? FALLBACK_PRODUCTS 
        : FALLBACK_PRODUCTS.filter(p => p.category === id);
      setProducts(filteredFallback);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const toggleWishlist = (pid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (wishlist.includes(pid)) {
      updated = wishlist.filter(item => item !== pid);
    } else {
      updated = [...wishlist, pid];
    }
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const getCategoryTitle = () => {
    switch(id) {
      case 'garrafas-termicas': return 'Garrafas Térmicas';
      case 'canecas': return 'Canecas Exclusivas';
      case 'atacado': return 'Orçamentos Corporativos & Atacado';
      default: return id ? id.toUpperCase() : 'Categoria';
    }
  };

  const getCategoryDescription = () => {
    switch(id) {
      case 'garrafas-termicas': 
        return 'Garrafas térmicas em aço inoxidável cirúrgico com personalização "Sua História" gravada à laser permanente.';
      case 'canecas': 
        return 'Canecas em cerâmica premium e design Boho Chic natural. Desenhos minimalistas inspirados nas suas melhores lembranças.';
      case 'atacado': 
        return 'Presentes corporativos, brindes requintados para casamentos e campanhas exclusivas com preços de atacado.';
      default: 
        return 'Encontre os mimos personalizados perfeitos baseados na sua história.';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <Link 
        to="/" 
        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-brand-gray hover:text-brand-primary mb-12 transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Voltar para o início
      </Link>

      <div className="mb-16 border-b border-brand-gold/10 pb-8 text-center md:text-left">
        <span className="text-brand-gold font-handwriting text-2xl">Artesanal & Natural</span>
        <h1 className="text-4xl md:text-6xl font-serif font-black text-brand-black tracking-tight uppercase leading-none mt-2">
          {getCategoryTitle()}
        </h1>
        <p className="text-sm text-brand-gray font-medium mt-4 max-w-xl leading-relaxed italic">
          {getCategoryDescription()}
        </p>
      </div>

      {loading ? (
        <div className="text-center font-serif italic text-3xl py-32 text-brand-primary">Carregando mimos...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-[#FAF7F8]/60 rounded-[3rem] p-12 border border-brand-gold/10 max-w-xl mx-auto">
          <p className="font-serif italic text-lg text-brand-gray mb-6">Ops! Nenhum item cadastrado nesta categoria por aqui ainda.</p>
          <Link to="/" className="bg-brand-primary text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">
            Explorar Loja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-[#FAF7F8]/40 border border-[#FAF7F8] p-6 rounded-[3rem] transition-all hover:bg-white hover:shadow-xl hover:border-brand-gold/20 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-[2rem] bg-white overflow-hidden border border-brand-gold/5 flex items-center justify-center p-4">
                  <img 
                    src={product.imageUrl || "/imagens/mugs-boho.jpg"} 
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 animate-in fade-in"
                  />
                  
                  {/* Heart Toggle */}
                  <button 
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-brand-primary hover:scale-110 active:scale-95 transition-all"
                  >
                    <Heart 
                      className={cn(
                        "w-5 h-5 transition-all duration-300", 
                        wishlist.includes(product.id) ? "fill-brand-primary text-brand-primary" : "text-brand-gray"
                      )} 
                    />
                  </button>

                  {product.customizable && (
                    <div className="absolute top-4 left-4 bg-brand-primary text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      ✨ Customizável
                    </div>
                  )}
                </div>

                 <div className="mt-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-1">
                    {product.subcategory || getCategoryTitle()}
                  </span>
                  <h3 className="font-serif italic font-bold text-xl text-brand-black group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-brand-gray font-medium mt-4 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Rating and Price Logic matches User Image */}
                <div className="mt-6 pt-5 border-t border-[#FAF7F8]/80 flex flex-col items-center text-center">
                  {/* 5-Star Rating with Count (1) */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="flex">
                      <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                      <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                    </div>
                    <span className="text-[11px] font-black text-brand-gold/80 font-mono">(1)</span>
                  </div>

                  {/* Pix Price Row with 10% off */}
                  <div className="flex items-baseline justify-center gap-1 bg-[#FAF7F8]/80 px-4 py-1.5 rounded-full border border-brand-pink-medium/10">
                    <span className="font-serif font-black text-2xl text-[#8C6A3B]">
                      {formatPrice(product.price * 0.9)}
                    </span>
                    <span className="text-xs font-bold text-stone-500 lowercase">no pix</span>
                  </div>

                  {/* Promo Text */}
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mt-1">
                    com 10% de desconto
                  </span>

                  {/* Card Installments Row */}
                  <div className="text-[11px] text-stone-600 mt-2 font-medium tracking-tight">
                    até <span className="font-black text-stone-900">3x</span> de <span className="font-black text-stone-900">{formatPrice(product.price / 3)}</span> sem juros
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Link 
                  to={product.customizable ? `/produto/${product.id}` : `/produto/${product.id}`}
                  className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-light py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:shadow-brand-primary/10 transition-all"
                >
                  {product.customizable ? 'Personalizar e Comprar' : 'Ver Detalhes'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
