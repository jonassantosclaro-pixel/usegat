import { ShoppingCart, User as UserIcon, Search, Menu, X, Instagram, Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { items, setIsSidebarOpen } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const categories: { name: string; path: string; highlight?: boolean }[] = [
    { name: 'Garrafas Térmicas', path: '/categoria/garrafas-termicas' },
    { name: 'Canecas', path: '/categoria/canecas' },
    { name: 'Atacado', path: '/categoria/atacado' },
  ];

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-brand-pink-light">
      {/* Top Bar - Urgent or promo info */}
      <div className="bg-brand-primary text-white text-[10px] py-2 text-center font-bold uppercase tracking-[0.2em] px-4">
        <span>💘 Use o cupom <span className="font-black text-white px-2 py-0.5 bg-white/20 rounded-md">GATLOVE</span> e ganhe 10% OFF</span> 
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-center h-16 sm:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center group relative z-10">
            <img 
              src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
              alt="USE.GAT Logo" 
              className="h-10 sm:h-20 w-auto object-contain"
            />
          </Link>

          {/* Nav - Desktop */}
          <nav className="hidden lg:flex gap-8 font-medium text-[11px] uppercase tracking-widest text-brand-gray">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                to={cat.path} 
                className={cn(
                  "hover:text-brand-primary transition-all relative group py-2",
                  cat.highlight && "text-brand-primary font-black"
                )}
              >
                {cat.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <button className="text-brand-gray hover:text-brand-primary transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            
            <Link to={user ? "/perfil" : "/entrar"} className="text-brand-gray hover:text-brand-primary transition-colors">
              <UserIcon className="w-5 h-5" />
            </Link>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="relative text-brand-gray hover:text-brand-primary transition-all group"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-primary text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              className="lg:hidden text-brand-gray"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
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
              className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="text-xl font-serif italic font-bold">Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 bg-brand-pink-light rounded-full flex items-center justify-center text-brand-pink-strong"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="space-y-6 flex-grow">
                {categories.map((cat) => (
                  <li key={cat.name}>
                    <Link 
                      to={cat.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "text-lg font-medium tracking-tight block hover:text-brand-pink-strong transition-colors",
                        cat.highlight && "text-brand-pink-strong font-black"
                      )}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8 border-t border-brand-pink-light space-y-4">
                <Link to="https://instagram.com" target="_blank" className="flex items-center gap-3 text-brand-gray">
                  <Instagram className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Siga no Instagram</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
