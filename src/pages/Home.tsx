import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowRight, 
  Heart, 
  Star, 
  Send, 
  Search, 
  Truck, 
  Gift, 
  Compass, 
  CheckCircle2, 
  MessageCircle, 
  Calendar,
  X,
  PhoneCall,
  User,
  Coffee,
  HeartCrack,
  Flame,
  ArrowUpDown,
  Instagram
} from 'lucide-react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice, cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';
import { FALLBACK_PRODUCTS, Product } from '@/src/lib/productsData';
import { useCart } from '@/src/lib/CartContext';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addItem } = useCart();

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Quick Tracking search
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingStatus, setTrackingStatus] = useState<any | null>(null);

  // Newsletter states
  const [email, setEmail] = useState('');
  const [newsletterDiscountCode, setNewsletterDiscountCode] = useState<string | null>(null);

  useEffect(() => {
    // Load wishlist
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));

    const q = query(collection(db, 'products'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (fetched.length === 0) {
        setProducts(FALLBACK_PRODUCTS);
      } else {
        setProducts(fetched);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore collection empty or offline, using fallback products instead. Error:", error);
      setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (wishlist.includes(id)) {
      updated = wishlist.filter(item => item !== id);
    } else {
      updated = [...wishlist, id];
    }
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    
    // Simulate complex pipeline tracking
    const statuses = [
      { step: 1, title: "Pedido Confirmado", date: "Ontem às 14:32", desc: "Seu pagamento foi aprovado e o pedido entrou no nosso ateliê.", completed: true },
      { step: 2, title: "Análise do Formulário", date: "Ontem às 16:50", desc: "Nossos designers analisaram suas respostas de comidas, bebidas e esporte.", completed: true },
      { step: 3, title: "Criação da Ilustração", date: "Hoje às 09:15", desc: "A arte 'Sua História' está sendo desenhada individualmente pelo ilustrador.", completed: true, active: true },
      { step: 4, title: "Gravação à Laser Premium", date: "Previsto para Amanhã", desc: "Gravação permanente sobre o aço inoxidável da garrafa.", completed: false },
      { step: 5, title: "Envio Concluído", date: "Previsto para Segunda-feira", desc: "Será postado via Correios com proteção anti-impacto ecológica.", completed: false }
    ];
    setTrackingStatus({
      code: trackingCode.toUpperCase(),
      steps: statuses
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Simulate automatic custom cupom generation
    setNewsletterDiscountCode("PRIMEIRAGAT10");
    setEmail('');
  };

  return (
    <div className="bg-transparent overflow-hidden pb-12">
      {/* 1. Hero Presenter */}
      <section className="relative min-h-[70vh] flex flex-col md:flex-row items-center justify-between bg-[#F4EFE7] px-6 lg:px-20 py-12 md:py-20 border-b border-brand-gold/10 overflow-hidden">
        {/* Boho aesthetic elements */}
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 rounded-full bg-[#FAF7F2] opacity-60 filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#EFE9DD] opacity-60 filter blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10 space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B48A4E]/10 rounded-full border border-[#B48A4E]/20">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[#B48A4E]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8C6A3B]">Exclusividade 'Sua História'</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-serif text-brand-black tracking-tight leading-tight md:leading-[1.1]">
            Não estampamos apenas, <br />
            <span className="font-serif italic font-bold border-b-4 border-brand-gold/30">contamos histórias</span>
          </h1>

          <p className="text-sm md:text-lg text-brand-gray font-medium leading-relaxed max-w-xl">
            Bem-vindo à <span className="font-bold text-brand-primary">USE GAT</span>. Somos especialistas em transformar suas memórias,
            esportes preferidos, comidas do coração e datas marcantes em canecas premium e garrafas térmicas com gravação permanente sob medida.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/categoria/garrafas-termicas" 
              className="bg-brand-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.15em] text-xs hover:bg-brand-primary-light transition-all transform hover:scale-105 shadow-xl hover:shadow-brand-primary/20"
            >
              CRIAR MINHA GARRAFA
            </Link>
            <a 
              href="#rastreio"
              className="bg-white text-brand-primary border-2 border-brand-primary/15 px-10 py-5 rounded-full font-black uppercase tracking-[0.15em] text-xs hover:border-brand-primary hover:bg-brand-pink-light transition-all text-center"
            >
              RASTREAR MEU PEDIDO
            </a>
          </div>
        </div>

        {/* Hero Collage */}
        <div className="relative mt-12 md:mt-0 w-full md:w-[480px] aspect-[4/3] md:aspect-square flex justify-center items-center">
          {/* Main frame */}
          <div className="bg-white p-4 shadow-2xl border border-stone-150 transform rotate-[-3deg] w-72 sm:w-[320px] relative z-10 transition-transform hover:rotate-0 duration-500">
            <img 
              src="https://i.postimg.cc/hv2SWwmj/704945826-1785809935732333-1325427837227963059-n.jpg" 
              alt="Modelo Sua História" 
              className="w-full h-auto object-cover aspect-[4/5] rounded"
            />
            <div className="pt-4 pb-2 text-center">
              <p className="font-handwriting text-xl text-brand-gold">Garrafa Sua História</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]/60 mt-1">100% Personalizado Para Você</p>
            </div>
            
            <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-stone-250 text-[8px] font-black text-brand-primary uppercase tracking-widest shadow rotate-[-12deg]">
              🌿 Rústico & Boho Chic
            </div>
          </div>
          
          {/* Secondary element behind */}
          <div className="bg-white p-3 shadow-xl border border-stone-150 transform rotate-[8deg] w-48 sm:w-60 absolute right-4 bottom-2 z-0 opacity-80 hidden sm:block hover:opacity-100 transition-opacity">
            <img 
              src="https://i.postimg.cc/bv3TD1vJ/Whats-App-Image-2026-05-15-at-16-10-17-(1).jpg" 
              alt="Canecas Boho" 
              className="w-full h-auto object-cover aspect-square rounded"
            />
            <p className="font-handwriting text-lg text-center text-brand-black mt-2">Caneca Minimalista</p>
          </div>
        </div>
      </section>

      {/* 2. Newsletter Discount Modal/Box (Cupom Automático no Site) */}
      <section className="bg-white/50 backdrop-blur-md py-10 border-y border-brand-golden/10 relative z-15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shadow-sm">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-widest bg-brand-gold/20 text-brand-gold-dark px-2.5 py-0.5 rounded">GANHE 10% OFF</span>
                <span className="text-xs font-bold text-brand-gray">no seu primeiro pedido completo</span>
              </div>
              <h3 className="text-xl font-serif font-black text-brand-black mt-1">Quer receber novidades Boho & inspirações de presente?</h3>
            </div>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto gap-3 items-stretch">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail"
              className="bg-white/80 border border-brand-gold/20 px-6 py-4 rounded-full flex-grow md:w-80 font-medium text-sm outline-none focus:border-brand-primary transition-all shadow-inner"
              required
            />
            <button 
              type="submit"
              className="bg-brand-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary-light transition-all flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Send className="w-4 h-4" />
              QUERO MEU CUPOM
            </button>
          </form>
        </div>

        {/* Automatic Modal popup for new subscriber */}
        {newsletterDiscountCode && (
          <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-6 bg-stone-900/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] p-8 md:p-12 max-w-md w-full relative border border-brand-gold/20 shadow-2xl text-center"
            >
              <button 
                onClick={() => setNewsletterDiscountCode(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-brand-pink-light rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[3rem] block mb-4">🎉</span>
              <h4 className="text-2xl font-serif font-black text-brand-black mb-2">Seja bem-vindo(a) à Família GAT!</h4>
              <p className="text-brand-gray font-medium text-sm leading-relaxed mb-6">
                Coletamos seu e-mail com sucesso. Use o cupom abaixo diretamente no seu carrinho e ganhe R$ 10,00 adicionais ou 10% de desconto!
              </p>
              <div className="bg-[#FAF7F8] border-2 border-dashed border-brand-gold p-4 rounded-2xl">
                <span className="text-xl font-bold uppercase tracking-widest text-brand-primary block mb-1 font-mono">
                  {newsletterDiscountCode}
                </span>
                <span className="text-[9px] font-black text-[#8C6A3B] uppercase tracking-wider block">Cupom pronto para copiar</span>
              </div>
              <button 
                onClick={() => setNewsletterDiscountCode(null)}
                className="mt-8 w-full bg-brand-primary text-white py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-primary-light shadow-lg"
              >
                VAMOS ÀS COMPRAS!
              </button>
            </motion.div>
          </div>
        )}
      </section>

      {/* 3. Lançamentos GRID & Auto Carousel */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
          <div className="text-center md:text-left">
            <span className="text-brand-gold font-handwriting text-2xl">Peças sob medida</span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black mt-2">Destaques Criativos</h2>
            <div className="w-24 h-1 bg-brand-gold mt-4 rounded-full mx-auto md:mx-0"></div>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/categoria/garrafas-termicas" 
              className="bg-[#FAF7F8] hover:bg-brand-primary hover:text-white border border-brand-gold/15 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              Ver Garrafas
            </Link>
            <Link 
              to="/categoria/canecas" 
              className="bg-[#FAF7F8] hover:bg-brand-primary hover:text-white border border-brand-gold/15 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              Ver Canecas
            </Link>
          </div>
        </div>

        {/* Dynamic products mapping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="group relative bg-[#FAF7F8]/40 border border-[#FAF7F8] p-6 rounded-[3rem] transition-all hover:bg-white hover:shadow-xl hover:border-brand-gold/20 flex flex-col justify-between">
              <div>
                <div className="relative aspect-square rounded-[2rem] bg-white overflow-hidden border border-brand-gold/5 flex items-center justify-center p-4">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
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
                    <span className="absolute top-4 left-4 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                      ✨ 100% Personalizado
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-1">
                        {product.subcategory || 'Coleção Real'}
                      </span>
                      <h3 className="font-serif italic font-bold text-xl text-brand-black group-hover:text-brand-primary transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-brand-primary font-black text-2xl block">{formatPrice(product.price)}</span>
                      <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">ou 3x s/ juros</span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-gray font-medium mt-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {product.customizable ? (
                  <Link 
                    to={`/produto/${product.id}`}
                    className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-light py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:shadow-brand-primary/20 transition-all"
                  >
                    Customizar Agora
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        quantity: 1
                      });
                    }}
                    className="flex-1 bg-white border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center transition-all shadow-md"
                  >
                    Comprar Direto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Tabela de Medidas Inteligente & Linha de Produtos */}
      <section className="bg-[#FAF7F8]/80 py-24 border-y border-brand-gold/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="text-brand-primary font-handwriting text-2xl">Compare suas dimensões</span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black mt-2">Guia de Tamanhos Únicos</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest mt-2">Encontre o recipiente perfeito para os seus goles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { vol: "GARRAFA 500ML", temp: "24h Gelo • 12h Quente", med: "Altura: 24,5cm • Diâmetro: 7cm", peso: "Vazia: 330g", icon: "💧" },
              { vol: "GARRAFA 750ML", temp: "24h Gelo • 12h Quente", med: "Altura: 28,5cm • Diâmetro: 8cm", peso: "Vazia: 390g", icon: "⚡" },
              { vol: "CANECA 325ML", temp: "Excelente Conservação Cerâmica", med: "Altura: 11cm • Diâmetro: 8,5cm", peso: "Vazia: 210g", icon: "☕" }
            ].map((measure, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-brand-gold/15 shadow-sm text-center space-y-4 hover:shadow-md transition-shadow">
                <span className="text-4xl block">{measure.icon}</span>
                <h4 className="font-serif font-black text-brand-black text-xl">{measure.vol}</h4>
                <div className="w-12 h-1 bg-brand-gold mx-auto rounded-full" />
                <div className="space-y-2 text-xs font-bold uppercase tracking-widest text-brand-gray">
                  <p className="text-brand-primary font-black">{measure.temp}</p>
                  <p>{measure.med}</p>
                  <p>{measure.peso}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Depoimentos Grid (Review) */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span className="text-brand-gold font-handwriting text-2xl">Carinho dos GAT Lovers</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black mt-2">Gente Feliz, Histórias Contadas</h2>
          <div className="w-24 h-1 bg-brand-gold mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Juliana Mendes",
              city: "Curitiba - PR",
              phrase: "Incrível! Comprei a garrafa 'Sua História' e inclui meus gatinhos, profissão e minha paixão por vôlei. A arte ficou maravilhosa, super recomendo!",
              stars: 5,
              product: "Garrafa Sua História"
            },
            {
              name: "Carlos Eduardo",
              city: "Rio de Janeiro - RJ",
              phrase: "Diferente de tudo. Eu sempre cansei de garrafas sem graça. A USE GAT realmente ouve a gente e cria uma composição artística impecável.",
              stars: 5,
              product: "Garrafa Profissões Premium"
            },
            {
              name: "Mariana Costa",
              city: "Belo Horizonte - MG",
              phrase: "A caneca com rostinho ficou a coisa mais delicada do mundo. Dá pra ver que foi feita à mão e com muito carinho. Com certeza farei outros pedidos.",
              stars: 5,
              product: "Caneca Rostinho Minimalista"
            }
          ].map((dw, i) => (
            <div key={i} className="bg-[#FAF7F8] p-8 rounded-[2.5rem] border border-white relative flex flex-col justify-between">
              <span className="text-[4rem] text-brand-gold opacity-10 leading-none absolute top-4 left-4 font-serif">“</span>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(dw.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="text-sm font-medium leading-relaxed italic text-brand-gray">
                  "{dw.phrase}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-gold/10 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-serif font-bold text-brand-black">{dw.name}</h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#8C6A3B]">{dw.city}</p>
                </div>
                <span className="bg-white px-3 py-1.5 rounded-full border border-stone-100 font-black text-[8px] uppercase tracking-wider text-brand-primary">
                  {dw.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Rastreio Rápido Avançado */}
      <section id="rastreio" className="py-20 bg-brand-primary text-white border-y border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-10 w-96 h-96 rounded-full bg-brand-primary-light opacity-30 filter blur-3xl pointer-events-none transform -translate-y-1/2" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-10">
          <div className="space-y-4">
            <span className="text-brand-gold font-handwriting text-2xl">Acompanhe seu Ateliê</span>
            <h2 className="text-4xl font-serif font-black tracking-tight">Rastreie o Processo de Criação do Seu Pedido</h2>
            <p className="text-xs text-white/70 max-w-lg mx-auto leading-relaxed">
              Como cada produto é feito do absoluto zero, aqui você acompanha desde a análise das suas memórias até a gravação final a laser.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} className="max-w-md mx-auto flex gap-3 items-stretch">
            <input 
              type="text" 
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Digite o código (Ex: GAT-12345)"
              className="bg-white/10 border border-white/20 text-white placeholder-white/40 px-6 py-4 rounded-full flex-grow font-mono outline-none focus:bg-white/20 transition-all tracking-widest text-center uppercase"
            />
            <button 
              type="submit"
              className="bg-brand-gold text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-gold-dark transition-all shrink-0"
            >
              RASTREAR Agora
            </button>
          </form>

          {/* Render real pipeline if tracked */}
          {trackingStatus && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white text-brand-black p-8 md:p-12 rounded-[2.5rem] text-left max-w-2xl mx-auto shadow-2xl space-y-8"
            >
              <div className="flex justify-between items-center border-b border-brand-pink-medium pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-brand-primary">CÓDIGO: {trackingStatus.code}</span>
                <span className="bg-brand-gold/10 text-brand-gold-dark px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider">PRODUÇÃO ATIVA</span>
              </div>

              <div className="space-y-6">
                {trackingStatus.steps.map((st: any) => (
                  <div key={st.step} className="flex gap-4 relative group">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2",
                        st.active ? "bg-brand-primary text-white border-brand-primary" : 
                        st.completed ? "bg-green-150 text-green-700 border-green-500 font-sans" : "bg-neutral-100 text-neutral-400 border-neutral-200"
                      )}>
                        {st.completed ? "✓" : st.step}
                      </div>
                      {st.step < 5 && (
                        <div className={cn(
                          "w-0.5 h-12 my-1",
                          st.completed ? "bg-green-500" : "bg-neutral-200"
                        )} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className={cn("font-serif font-black text-base", st.active && "text-brand-primary")}>
                          {st.title}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">{st.date}</span>
                      </div>
                      <p className="text-xs text-brand-gray font-medium leading-relaxed mt-1">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 7. Instagram Highlights Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-10" id="instagram-section">
        <div className="text-center mb-16">
          <span className="text-brand-primary font-handwriting text-2xl">Mimos, Chás e Histórias</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black mt-2">Bombando no @use.gat</h2>
          <p className="text-sm text-brand-gray max-w-md mx-auto mt-3 font-medium">As postagens que ganharam corações e viralizaram no nosso Instagram com histórias reais.</p>
          <div className="w-24 h-1 bg-brand-gold mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              title: "Coleção Sua História ✨",
              img: "https://i.postimg.cc/CxNgn95b/702751295-868314862239637-7807271768424170538-n.png",
              link: "https://www.instagram.com/use.gat/reel/DHBhb5JRPHk/",
              views: "150.000+ visualizações",
              likes: "18.2k curtidas",
              desc: "O vídeo queridinho mostrando o passo a passo da nossa Gravação a Laser na Garrafa Térmica. Cada desenho é uma memória real de afeto gravada para sempre."
            },
            {
              title: "Caneca Rostinho Boho 🌸",
              img: "https://i.postimg.cc/L8RSXm9P/690477967-977775425172646-5611639360537964569-n.png",
              link: "https://www.instagram.com/use.gat/reel/DI1HjHRRyPl/",
              views: "84.000+ visualizações",
              likes: "12.5k curtidas",
              desc: "Nosso xodó do feed! O processo artístico de desenhar à mão os traços do rostinho dos namorados sobre cerâmica premium. Aconchego e doçura pura."
            },
            {
              title: "Unboxing de Amor 📦",
              img: "https://i.postimg.cc/wjVpRnMh/682419343-1332218678885809-7430651600569544797-n.png",
              link: "https://www.instagram.com/use.gat/reel/DLBUtyAsecw/",
              views: "240.000+ visualizações",
              likes: "24.3k curtidas",
              desc: "Os bastidores da nossa embalagem rústica Boho que viralizaram: palha de trigo perfumada, raminho de flores secas e o nosso autêntico selo de cera real."
            }
          ].map((post, i) => (
            <a 
              key={i} 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-[#FAF7F8]/40 border border-[#FAF7F8] rounded-[2.5rem] overflow-hidden hover:bg-white hover:shadow-2xl hover:border-brand-gold/25 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={post.img} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle Instagram hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 text-sm">
                    <Instagram className="w-6 h-6 animate-pulse" />
                    <span>Ver no Instagram</span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-[10px] font-black text-brand-primary">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>@use.gat</span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-gold">
                    <span>{post.views}</span>
                    <span className="text-[#8C6A3B]">{post.likes}</span>
                  </div>
                  <h3 className="font-serif italic font-bold text-xl text-brand-black leading-snug group-hover:text-brand-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-brand-gray font-medium leading-relaxed">
                    {post.desc}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-brand-pink-medium/10 mt-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[#8C6A3B] group-hover:text-brand-primary transition-colors flex items-center gap-2">
                  Ver Postagem <ArrowRight className="w-4 h-4 text-brand-gold" />
                </span>
                <span className="text-xs text-gray-400 font-medium">Instagram</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Mobile Sticky Quick Menu (Mobile-only bottom bar) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur border-t border-brand-pink-medium z-[100] flex justify-around items-center lg:hidden shadow-lg px-4">
        <Link to="/" className="flex flex-col items-center gap-1 text-brand-primary">
          <Compass className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-wider">Início</span>
        </Link>
        <Link to="/categoria/garrafas-termicas" className="flex flex-col items-center gap-1 text-brand-gray hover:text-brand-primary transition-colors">
          <Flame className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-wider">Garrafas</span>
        </Link>
        <a 
          href="https://wa.me/552140402224" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-brand-gray hover:text-brand-primary transition-colors"
        >
          <PhoneCall className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-wider">Suporte</span>
        </a>
        <Link to="/carrinho" className="flex flex-col items-center gap-1 text-brand-gray hover:text-brand-primary transition-colors relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-wider">Carrinho</span>
        </Link>
      </div>
    </div>
  );
}
