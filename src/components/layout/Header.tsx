import { ShoppingCart, User as UserIcon, Search, ChevronDown, MessageCircle, Mail, Clock, AlignJustify } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { user } = useAuth();
  const { items, setIsSidebarOpen } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="bg-[#6b5b50] text-white text-[10px] text-center py-1 tracking-widest uppercase">
        💎 Tem desconto no pagamento via PIX!
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Digite o que você procura"
            className="w-full bg-gray-100 rounded-full py-2 px-6 outline-none text-sm placeholder:text-gray-400"
          />
        </div>

        <Link to="/" className="text-xl md:text-2xl font-bold italic tracking-tighter order-first md:order-none">
          <img src="/imagens/logo-gat-purple.png" alt="USE.GAT" className="h-8 md:h-10" />
        </Link>
        
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-gray-700 uppercase tracking-widest">
          <div className="relative group cursor-pointer flex items-center gap-1 md:gap-2">
            <MessageCircle className="w-4 h-4 text-[#6b5b50]" />
            <span className="hidden md:inline">Central de Atendimento</span> <ChevronDown className="w-3 h-3" />
            
            <div className="absolute top-full right-0 pt-2 p-5 bg-white border border-gray-100 shadow-2xl rounded-lg w-64 hidden group-hover:block z-50 text-[11px] font-normal normal-case">
              <p className="font-bold border-b pb-2 mb-3">Fale com a gente</p>
              <p className="flex items-center gap-2 mb-2 font-bold">(21) 966539999</p>
              <p className="flex items-center gap-2 mb-2 text-gray-600"><Mail className="w-4 h-4" /> meupedido@aquitemcaneca.com</p>
              <p className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /> Seg a sex, das 8:30 às 17:00</p>
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 md:gap-2">
            <UserIcon className="w-4 h-4 text-[#6b5b50]" />
            <span className="hidden md:inline">{user ? 'Minha Conta' : 'Cadastrar'}</span> <ChevronDown className="w-3 h-3" />
            
            <div className="absolute top-full right-0 pt-2 py-4 bg-white border border-gray-100 shadow-2xl rounded-lg w-48 hidden group-hover:block z-50 text-[11px] font-normal normal-case space-y-3 px-4">
              {user ? (
                <>
                  <Link to="/perfil" className="block hover:text-[#6b5b50]">Minha Conta</Link>
                  <Link to="/pedidos" className="block hover:text-[#6b5b50]">Meus Pedidos</Link>
                  <Link to="/amei" className="block hover:text-[#6b5b50]">Amei</Link>
                  <Link to="/pedidos" className="block hover:text-[#6b5b50]">Rastrear Pedido</Link>
                </>
              ) : (
                <>
                  <Link to="/entrar" className="block hover:text-[#6b5b50]">Entrar</Link>
                  <Link to="/entrar" className="block hover:text-[#6b5b50]">Cadastrar</Link>
                </>
              )}
            </div>
          </div>

          <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#6b5b50]" /> <span className="hidden md:inline">{cartCount}</span>
          </button>
        </div>
      </div>

      <nav className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 py-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">
          <div className="relative group cursor-pointer flex items-center gap-2 py-2 pr-6 border-r border-gray-200">
            <AlignJustify className="w-4 h-4" />
            <span>Todas as categorias</span> <ChevronDown className="w-3 h-3" />

            <div className="absolute top-full left-0 mt-0 bg-white border border-gray-100 shadow-xl w-screen md:w-[600px] hidden group-hover:flex z-50 py-4 font-normal normal-case tracking-normal flex-col md:flex-row">
                <div className="w-full md:w-1/3 border-b md:border-r border-gray-100">
                    {menuCategories.map(cat => (
                        <div key={cat.name} className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-sm md:text-xs">
                            {cat.name} <span className="md:hidden text-gray-400 font-bold">&gt;</span>
                        </div>
                    ))}
                </div>
                <div className="w-full md:w-2/3 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuCategories[0].subs.map(sub => (
                            <div key={sub} className="text-sm text-gray-600 hover:text-black hover:font-bold cursor-pointer">{sub}</div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
          
          {menuCategories.map(cat => (
            <Link key={cat.name} to="#" className="hidden md:block hover:text-gray-900 py-2">{cat.name}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
