import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Heart, Star, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice, cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const q = query(collection(db, 'products'), limit(12));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-transparent overflow-hidden">
      {/* 1. Hero Banner */}
      <section className="relative h-[250px] sm:h-[400px] md:h-[85vh] flex items-center bg-white overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <img 
            src="https://i.postimg.cc/C54tQ3Kg/Banner.png" 
            alt="Hero banner" 
            className="w-full h-full object-contain md:object-cover lg:object-contain"
          />
        </div>
        
        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <Link 
              to="/categoria/garrafas-termicas" 
              className="inline-flex items-center bg-brand-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all transform shadow-xl"
            >
              Conhecer Coleção
              <ArrowRight className="ml-3 w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Newsletter / Coupon Faixa */}
      <section className="bg-white/40 backdrop-blur-md py-10 border-y border-brand-pink-light/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-serif font-black italic text-brand-black whitespace-nowrap">VOCE +</h3>
                <img 
                  src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
                  alt="USE GAT" 
                  className="h-10 w-auto object-contain"
                />
                <h3 className="text-lg font-serif font-black italic text-brand-black">= 💌</h3>
              </div>
              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">Ganhe 10% OFF na primeira compra</p>
            </div>
          </div>
          
          <form className="flex w-full md:w-auto gap-4">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail aqui"
              className="bg-white px-6 py-4 rounded-full flex-grow md:w-80 font-medium text-sm outline-none border-2 border-transparent focus:border-brand-primary transition-all"
            />
            <button className="bg-brand-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-md flex items-center gap-2">
              <Send className="w-4 h-4" />
              QUERO MEU CUPOM
            </button>
          </form>
        </div>
      </section>

      {/* 3. Lançamentos GRID */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span className="text-brand-pink-strong font-handwriting text-2xl">Novidades fresquinhas</span>
          <h2 className="text-4xl font-serif font-black text-brand-black mt-2">Lançamentos da Semana</h2>
          <div className="w-24 h-1 bg-brand-gold mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.slice(0, 4).map((product, i) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Mais Vendidos */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-end mb-16 border-b border-brand-pink-light pb-6">
          <div>
            <span className="text-brand-gold font-handwriting text-2xl italic">Os queridinhos</span>
            <h2 className="text-4xl font-serif font-black text-brand-black mt-2">Destaques da Loja</h2>
          </div>
          <Link to="/categoria/canecas" className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary hover:opacity-80 transition-opacity flex items-center gap-2">
            Ver Todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {products.slice(4, 9).map((product, i) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      </section>

      {/* 6. Benefícios / Diferenciais */}
      <section className="bg-white/40 backdrop-blur-md py-20 border-y border-brand-pink-light/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { icon: "🎁", title: "Embalagem Pronta", desc: "Já enviamos para presente" },
            { icon: "✨", title: "Premium", desc: "Produtos de alta qualidade" },
            { icon: "🛡️", title: "Compra Segura", desc: "Garantia total de entrega" },
            { icon: "📦", title: "Envio Rápido", desc: "Produção agilizada" },
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <span className="text-4xl block mb-2">{item.icon}</span>
              <h4 className="font-serif font-black text-brand-black">{item.title}</h4>
              <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, compact = false }: { product: any, compact?: boolean, key?: any }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={product.customizable ? `/customizar/${product.id}` : `/produto/${product.id}`}>
        <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-6 mb-6 aspect-square flex justify-center items-center overflow-hidden border border-brand-pink-light/30 group-hover:border-brand-pink-medium transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-md hover:bg-brand-primary hover:text-white transition-all">
              <Heart className="w-5 h-5" />
            </button>
          </div>
          {product.customizable && (
            <div className="absolute top-6 left-6 bg-white text-brand-primary px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
              ✨ Personalizado
            </div>
          )}
        </div>
        <div className="text-center px-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-brand-primary/20 text-brand-primary" />)}
          </div>
          <h3 className={cn("font-serif italic font-bold text-brand-black mb-2 group-hover:text-brand-primary transition-colors", compact ? "text-sm" : "text-lg")}>
            {product.name}
          </h3>
          <div className="flex flex-col items-center gap-1">
            <span className="text-brand-primary font-black text-xl">{formatPrice(product.price)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ou 3x de {formatPrice(product.price/3)}</span>
          </div>
          <button className="mt-4 w-full bg-brand-primary text-white py-3 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            Ver Detalhes
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
