import { ShoppingCart, User as UserIcon, Search, Menu, X, Instagram } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth();
  const { items, setIsSidebarOpen } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const categories = [
    { name: 'Garrafas Térmicas', path: '/categoria/garrafas-termicas' },
    { name: 'Canecas', path: '/categoria/canecas' },
    { name: 'Atacado', path: '/categoria/atacado' },
    { name: 'Novidades', path: '/categoria/novidades' },
  ];

  return (
    <header className="bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-gray/50">
      {/* Top Bar - Elegant and functional */}
      <div className="bg-brand-black text-white text-[9px] py-2 text-center font-black uppercase tracking-[0.3em]">
        <span className="opacity-80">FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 250</span> 
        <span className="mx-4 text-brand-yellow">•</span>
        <span className="text-brand-yellow hover:text-white transition-colors cursor-pointer">@USE.GAT</span>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-center h-20 sm:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-10">
            <img 
              src="https://i.postimg.cc/kgByjm40/Whats-App-Image-2026-05-08-at-11-11-29.jpg" 
              alt="USE GAT Logo" 
              className="h-12 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Nav - Desktop - Spaced and clean */}
          <nav className="hidden lg:flex gap-12 font-black text-[10px] uppercase tracking-[0.2em] text-brand-black/60">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                to={cat.path} 
                className="hover:text-brand-red hover:tracking-[0.25em] transition-all relative group py-2"
              >
                {cat.name}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-red transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-5 relative z-10">
            <div className="hidden md:flex items-center gap-5">
              {user ? (
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link to="/admin" className="text-[9px] font-black uppercase tracking-widest bg-brand-black text-white px-4 py-2 rounded-full hover:bg-brand-red transition-colors shadow-lg shadow-brand-black/10">
                      Admin
                    </Link>
                  )}
                  <div className="flex flex-col items-end">
                    <Link to="/perfil" className="w-10 h-10 border-2 border-brand-yellow rounded-full overflow-hidden hover:scale-110 transition-transform flex items-center justify-center bg-brand-gray shadow-inner">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-brand-black" />
                      )}
                    </Link>
                    <button 
                      onClick={() => signOut()}
                      className="text-[8px] font-black uppercase text-brand-red/60 hover:text-brand-red hover:underline tracking-widest mt-1 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/entrar"
                  className="bg-brand-black text-white px-7 py-3.5 rounded-full font-black uppercase text-[10px] tracking-[0.15em] hover:bg-brand-red hover:shadow-xl hover:shadow-brand-red/20 transition-all flex items-center gap-3 active:scale-95"
                >
                  <UserIcon className="w-4 h-4" />
                  Entrar
                </Link>
              )}
            </div>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="relative w-11 h-11 bg-brand-gray/50 rounded-full flex items-center justify-center text-brand-black hover:bg-brand-red hover:text-white transition-all shadow-sm group active:scale-90"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-yellow text-brand-black text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-bounce-subtle">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              className="md:hidden w-10 h-10 bg-brand-gray rounded-full flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-brand-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-brand-bg z-50 md:hidden p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-2xl font-black tracking-tighter">MENU</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 bg-brand-gray rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="space-y-6">
                {categories.map((cat) => (
                  <li key={cat.name}>
                    <Link 
                      to={cat.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-2xl font-black tracking-tight block hover:text-brand-red transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-12 pt-8 border-t border-brand-gray space-y-6">
                {user ? (
                  <>
                    {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block text-lg font-black text-brand-red">PAINEL ADMIN</Link>}
                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="block text-lg font-bold">SAIR</button>
                  </>
                ) : (
                  <button onClick={() => { signInWithGoogle(); setIsMenuOpen(false); }} className="flex items-center text-lg font-bold">
                    <UserIcon className="w-5 h-5 mr-3" />
                    ENTRAR
                  </button>
                )}
                <Link 
                  to="https://www.instagram.com/use.gat" 
                  target="_blank"
                  className="flex items-center text-lg font-black text-brand-red"
                >
                  <Instagram className="w-5 h-5 mr-3" />
                  INSTAGRAM
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
