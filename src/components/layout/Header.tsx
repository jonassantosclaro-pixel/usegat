import { ShoppingCart, User as UserIcon, Search, ChevronDown, MessageCircle, Mail, Clock, AlignJustify } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { user } = useAuth();
  const { items, setIsSidebarOpen } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const navigate = useNavigate();

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [activeMobileCategory, setActiveMobileCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const helpRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const menuCategories = [
    { 
      name: 'Canecas', 
      subs: ['Estilo Único', 'Para Mesa', 'Amor Por Aí'] 
    },
    { 
      name: 'Garrafas Térmicas', 
      subs: ['Meu Jeito', 'Corporativo', 'Essencial'] 
    },
    { 
      name: 'Atacado', 
      subs: ['Especiais'] 
    },
  ];

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="bg-[#6b5b50] text-white text-[10px] text-center py-1 tracking-widest uppercase">
        💎 Tem desconto no pagamento via PIX!
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Digite o que você procura"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-full py-2 px-6 outline-none text-sm placeholder:text-gray-400"
          />
        </form>

        <Link to="/" className="text-xl md:text-2xl font-bold italic tracking-tighter order-first md:order-none">
          <img src="/imagens/logo-gat-purple.png" alt="USE.GAT" className="h-8 md:h-10" />
        </Link>
        
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-gray-700 uppercase tracking-widest">
          <div 
            ref={helpRef}
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="relative group cursor-pointer flex items-center gap-1 md:gap-2 py-1"
          >
            <MessageCircle className="w-4 h-4 text-[#6b5b50]" />
            <span className="hidden md:inline">Central de Atendimento</span> <ChevronDown className="w-3 h-3" />
            
            <div className={`absolute top-full right-0 pt-2 p-5 bg-white border border-gray-100 shadow-2xl rounded-lg w-64 ${isHelpOpen ? 'block' : 'hidden md:group-hover:block'} z-50 text-[11px] font-normal normal-case`}>
              <p className="font-bold border-b pb-2 mb-3">Fale com a gente</p>
              <p className="flex items-center gap-2 mb-2 font-bold">(21) 966539999</p>
              <p className="flex items-center gap-2 mb-2 text-gray-600"><Mail className="w-4 h-4" /> meupedido@aquitemcaneca.com</p>
              <p className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /> Seg a sex, das 8:30 às 17:00</p>
            </div>
          </div>

          <div 
            ref={userRef}
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="relative group cursor-pointer flex items-center gap-1 md:gap-2 py-1"
          >
            <UserIcon className="w-4 h-4 text-[#6b5b50]" />
            <span className="hidden md:inline">{user ? 'Minha Conta' : 'Cadastrar'}</span> <ChevronDown className="w-3 h-3" />
            
            <div className={`absolute top-full right-0 pt-2 py-4 bg-white border border-gray-100 shadow-2xl rounded-lg w-48 ${isUserOpen ? 'block' : 'hidden md:group-hover:block'} z-50 text-[11px] font-normal normal-case space-y-3 px-4`}>
              {user ? (
                <>
                  <Link to="/perfil" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Minha Conta</Link>
                  <Link to="/pedidos" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Meus Pedidos</Link>
                  <Link to="/amei" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Amei</Link>
                  <Link to="/pedidos" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Rastrear Pedido</Link>
                </>
              ) : (
                <>
                  <Link to="/entrar" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Entrar</Link>
                  <Link to="/entrar" className="block hover:text-[#6b5b50]" onClick={() => setIsUserOpen(false)}>Cadastrar</Link>
                </>
              )}
            </div>
          </div>

          <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#6b5b50]" /> <span className="hidden md:inline">{cartCount}</span>
          </button>
        </div>
      </div>

      <nav className="border-t border-gray-100 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 py-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">
          <div 
            ref={categoriesRef}
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="md:relative group cursor-pointer flex items-center gap-2 py-2 pr-6 border-r border-gray-200"
          >
            <AlignJustify className="w-4 h-4" />
            <span>Todas as categorias</span> <ChevronDown className="w-3 h-3" />

            <div 
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-full left-4 right-4 mt-2 md:mt-0 bg-white border border-gray-100 shadow-2xl rounded-2xl md:rounded-none w-auto md:w-[600px] md:left-0 md:right-auto ${isCategoriesOpen ? 'flex' : 'hidden md:group-hover:flex'} z-50 py-4 font-normal normal-case tracking-normal flex-col md:flex-row`}
            >
              {/* MOBILE ACCORDION LAYOUT */}
              <div className="block md:hidden w-full divide-y divide-gray-100 px-2">
                {menuCategories.map((cat, idx) => {
                  const isExpanded = activeMobileCategory === idx;
                  return (
                    <div key={cat.name} className="py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileCategory(isExpanded ? null : idx);
                        }}
                        className="w-full py-3 px-4 flex justify-between items-center text-left text-sm font-black uppercase tracking-wider text-[#4D1D54] border-none bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          {cat.name === 'Canecas' ? '☕' : cat.name === 'Garrafas Térmicas' ? '🥤' : '📦'} {cat.name}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-250 ${isExpanded ? 'rotate-180 text-brand-primary' : 'text-gray-400'}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="pl-8 pr-4 pb-4 pt-1.5 space-y-3 animate-fade-in flex flex-col">
                          {/* Direct quick link to full category */}
                          <Link
                            to={cat.name === 'Canecas' ? '/?category=canecas' : cat.name === 'Garrafas Térmicas' ? '/?category=garrafas-termicas' : '/'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCategoriesOpen(false);
                            }}
                            className="text-xs text-brand-pink-strong font-black uppercase tracking-widest hover:underline py-1"
                          >
                            ✨ Ver todas as opções
                          </Link>
                          
                          {/* Subcategories list */}
                          {cat.subs.map(sub => (
                            <Link
                              key={sub}
                              to={cat.name === 'Canecas' ? '/?category=canecas' : cat.name === 'Garrafas Térmicas' ? '/?category=garrafas-termicas' : '/'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCategoriesOpen(false);
                              }}
                              className="text-sm text-stone-600 hover:text-black font-semibold block py-1"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP COLUMN LAYOUT */}
              <div className="hidden md:flex w-full">
                <div className="w-1/3 border-r border-gray-100">
                    {menuCategories.map((cat, idx) => (
                        <div 
                          key={cat.name} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryIndex(idx);
                          }}
                          onMouseEnter={() => setSelectedCategoryIndex(idx)}
                          className={`px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-sm md:text-xs ${selectedCategoryIndex === idx ? 'bg-gray-50 text-brand-primary font-bold' : ''}`}
                        >
                            {cat.name} <span className="text-gray-400 font-bold">&gt;</span>
                        </div>
                    ))}
                </div>
                <div className="w-2/3 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuCategories[selectedCategoryIndex].subs.map(sub => (
                            <Link 
                              key={sub} 
                              to={menuCategories[selectedCategoryIndex].name === 'Canecas' ? '/?category=canecas' : menuCategories[selectedCategoryIndex].name === 'Garrafas Térmicas' ? '/?category=garrafas-termicas' : '/'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCategoriesOpen(false);
                              }}
                              className="text-sm text-gray-600 hover:text-black hover:font-bold cursor-pointer block py-1"
                            >
                              {sub}
                            </Link>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          {menuCategories.map(cat => (
            <Link 
              key={cat.name} 
              to={cat.name === 'Canecas' ? '/?category=canecas' : cat.name === 'Garrafas Térmicas' ? '/?category=garrafas-termicas' : '/'} 
              className="hidden md:block hover:text-gray-900 py-2"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
