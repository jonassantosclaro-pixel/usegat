import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice } from '@/src/lib/utils';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Category() {
  const { id } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = id === 'novidades' 
      ? query(collection(db, 'products'), limit(20))
      : query(collection(db, 'products'), where('category', '==', id));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching category products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <Link to="/" className="inline-flex items-center text-xs font-black uppercase tracking-widest hover:text-brand-red mb-12 transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        Início
      </Link>

      <div className="mb-16">
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">{id}</h1>
        <div className="w-24 h-4 bg-brand-yellow rounded-full"></div>
      </div>

      {loading ? (
        <div className="text-center font-black py-20">CARREGANDO...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-bold text-gray-400 uppercase">Nenhum produto encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={product.customizable ? `/customizar/${product.id}` : `/produto/${product.id}`}>
                <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-6 mb-6 aspect-square flex justify-center items-center overflow-hidden border border-brand-pink-light/30 group-hover:border-brand-primary transition-all shadow-sm relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-[30px] group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.customizable && (
                    <div className="absolute top-8 right-8 bg-brand-yellow text-brand-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      🎨 Customizável
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-2 group-hover:text-brand-red transition-colors">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-red font-black text-2xl">{formatPrice(product.price)}</span>
                    <div className="w-10 h-10 bg-brand-black text-white rounded-full flex items-center justify-center group-hover:bg-brand-red transition-colors">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
