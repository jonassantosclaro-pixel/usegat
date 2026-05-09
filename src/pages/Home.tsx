import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';
import { Mail, Lock, Chrome, UserPlus } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signInEmail, signInWithGoogle } = useAuth();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInEmail(email, password);
    } catch (err: any) {
      setAuthError('E-mail ou senha inválidos.');
    } finally {
      setAuthLoading(false);
    }
  };
  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, 'products'), limit(8));
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setProducts(fetchedProducts); 
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-6 sm:mt-12">
        <div className="bg-brand-gray rounded-[60px] min-h-[600px] w-full relative flex items-center overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')]"></div>
          
          <div className="pl-10 md:pl-24 w-full md:w-1/2 z-20 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="flex items-center gap-3 text-brand-red font-black uppercase tracking-[0.5em] text-[10px] mb-8">
                <span className="w-8 h-px bg-brand-red/30"></span>
                Boho Chic & Personalizado
              </span>
              
              <h1 className="relative mb-12">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="block text-[15vw] md:text-[127px] font-black leading-[0.7] text-brand-black font-serif tracking-tighter"
                >
                  SUA
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, x: 50, rotate: -3 }}
                  animate={{ opacity: 1, x: 0, rotate: -2 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="block text-[15vw] md:text-[107px] font-black leading-[0.7] text-brand-yellow italic -mt-4 sm:-mt-10 drop-shadow-2xl"
                >
                  HISTÓRIA
                </motion.span>
              </h1>

              <p className="text-xl text-gray-500 font-bold mb-14 max-w-md leading-relaxed uppercase tracking-tighter opacity-80 decoration-brand-yellow underline-offset-8 decoration-2">
                Produtos exclusivos que carregam <span className="text-brand-black">a sua essência</span> em cada detalhe.
              </p>

              <div className="flex flex-wrap gap-8 items-center">
                <Link 
                  to="/categoria/novidades" 
                  className="group relative inline-flex items-center bg-brand-black text-white px-12 py-6 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-red transition-all shadow-2xl shadow-brand-black/20 active:scale-95"
                >
                  <span className="relative z-10 flex items-center">
                    Criar Meu Presente
                    <ArrowRight className="ml-4 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Link>
                
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-brand-gray overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                    </div>
                  ))}
                  <div className="pl-6 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-brand-black uppercase tracking-widest">+2k clientes</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-brand-yellow"></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Artistic Image Overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-brand-gray via-transparent to-transparent z-10 w-48"></div>
             <motion.img 
               initial={{ scale: 1.3, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
               whileHover={{ scale: 1.05 }}
               src="https://i.postimg.cc/RF4jjF2H/Whats-App-Image-2026-05-08-at-11-49-08.jpg" 
               className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" 
               alt="Gat Custom Product"
             />
             <div className="absolute inset-0 bg-brand-yellow/10 mix-blend-multiply opacity-30 pointer-events-none"></div>
             
             {/* Badge on image */}
             <div className="absolute top-12 right-12 z-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 relative flex items-center justify-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                    <text className="text-[10px] font-black uppercase tracking-widest fill-brand-black/40">
                      <textPath xlinkHref="#circlePath">ESTILO • QUALIDADE • PERSONALIZAÇÃO •</textPath>
                    </text>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl">✨</span>
                  </div>
                </motion.div>
             </div>

             <div className="absolute bottom-12 right-12 text-right z-20">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Portfolio</p>
                <p className="text-3xl font-serif italic font-black text-white drop-shadow-md">Brasília, DF</p>
             </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-white rounded-[60px] p-12 md:p-24 border-4 border-brand-gray relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-4">
              <span className="text-brand-red font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Nossa Essência</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic mb-6">
                Feito em <br />
                <span className="text-brand-yellow">Brasília</span> <br />
                Para Você.
              </h2>
              <div className="w-20 h-2 bg-brand-black"></div>
            </div>
            <div className="md:col-span-8">
              <p className="text-xl md:text-2xl font-bold text-gray-500 leading-relaxed italic">
                "A Use Gat nasceu em Brasília com a missão de transformar itens do cotidiano em experiências inesquecíveis. Especialista em produtos premium personalizados, como garrafas térmicas e canecas de porcelana, nossa marca une estilo, funcionalidade e durabilidade. Cada detalhe, desde a estampa exclusiva até a nossa embalagem pensada para presentear, é projetado para valorizar momentos e acompanhar você no trabalho, na academia ou em momentos de lazer. Na Use Gat, não entregamos apenas produtos; entregamos carinho e personalidade em forma de presentes únicos."
              </p>
            </div>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-red/5 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-brand-red font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Destaques</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter">O que a galera está usando</h2>
          </div>
          <Link to="/categoria/novidades" className="text-sm font-black uppercase tracking-widest border-b-4 border-brand-yellow hover:border-brand-red transition-all pb-1">
            Ver Tudo
          </Link>
        </div>

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
                <div className="bg-brand-gray rounded-[40px] p-6 mb-6 aspect-square flex justify-center items-center overflow-hidden border-4 border-transparent group-hover:border-brand-red transition-all shadow-sm relative">
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
      </section>

      {/* Login / Community Section */}
      {!user && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-brand-gray rounded-[60px] overflow-hidden border-4 border-white shadow-2xl">
            <div className="p-12 md:p-20 flex flex-col justify-center">
              <span className="text-brand-red font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Comunidade GAT</span>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 italic">Vem ser <br /><span className="text-brand-yellow">ÚNICO</span></h2>
              <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-sm">
                Crie sua conta para salvar suas artes, acompanhar pedidos e ganhar mimos exclusivos.
              </p>
              <div className="flex gap-4">
                <div className="w-12 h-1 bg-brand-black"></div>
                <div className="w-4 h-1 bg-brand-red"></div>
                <div className="w-2 h-1 bg-brand-yellow"></div>
              </div>
            </div>

            <div className="bg-white p-12 md:p-20 border-l-4 border-brand-gray">
              <form onSubmit={handleLogin} className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8">Já tem conta? Entra ae!</h3>
                
                {authError && (
                  <div className="bg-brand-red/10 text-brand-red p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                    {authError}
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email"
                    placeholder="Seu e-mail"
                    className="w-full bg-brand-gray h-16 rounded-2xl pl-14 pr-6 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-brand-red/10 border-2 border-transparent focus:border-brand-red/20 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password"
                    placeholder="Sua senha"
                    className="w-full bg-brand-gray h-16 rounded-2xl pl-14 pr-6 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-brand-red/10 border-2 border-transparent focus:border-brand-red/20 transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="flex-[2] bg-brand-black text-white h-16 rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-red transition-all shadow-xl shadow-brand-black/20 flex items-center justify-center gap-3"
                  >
                    {authLoading ? 'Entrando...' : 'Fazer Login'}
                  </button>
                  
                  <Link 
                    to="/entrar"
                    className="flex-1 bg-brand-gray text-brand-black h-16 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:bg-brand-yellow transition-all gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Criar Conta
                  </Link>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-brand-gray"></div>
                  <span className="text-[10px] font-black uppercase text-gray-300">OU</span>
                  <div className="flex-1 h-px bg-brand-gray"></div>
                </div>

                <button 
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="w-full border-4 border-brand-gray h-16 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-brand-gray transition-all active:scale-95"
                >
                  <Chrome className="w-5 h-5 text-brand-red" />
                  Entrar com Google
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Instagram Hook */}
      <section className="bg-brand-yellow py-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[200px] font-black whitespace-nowrap animate-scroll">
            @USE.GAT @USE.GAT @USE.GAT @USE.GAT @USE.GAT
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-brand-black">Siga a gente no insta!</h2>
          <p className="text-xl font-bold mb-10 text-brand-black/70 max-w-2xl mx-auto">
            Fique por dentro de todos os lançamentos, bastidores e claro, muitas fotos de gatos estilosos.
          </p>
          <a 
            href="https://instagram.com/use.gat" 
            target="_blank"
            className="inline-flex items-center bg-brand-black text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:bg-brand-red transition-colors shadow-2xl"
          >
            Acompanhar @use.gat
          </a>
        </div>
      </section>
    </div>
  );
}
