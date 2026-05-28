import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
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
import FeaturesBanner from '@/src/components/layout/FeaturesBanner';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addItem } = useCart();
  const [settings, setSettings] = useState<any>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Parallax integration
  const { scrollY } = useScroll();
  const yParallaxImage = useTransform(scrollY, [0, 800], [0, 50]);
  const yParallaxText = useTransform(scrollY, [0, 800], [0, -20]);
  const yFloat = useTransform(scrollY, [0, 800], [0, -35]);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Quick Tracking search
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingStatus, setTrackingStatus] = useState<any | null>(null);

  // Newsletter states
  const [email, setEmail] = useState('');
  const [newsletterDiscountCode, setNewsletterDiscountCode] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  // Testimonials Slider state & data
  const [currentReview, setCurrentReview] = useState(0);
  const reviews = [
    {
      name: "Juliana Mendes",
      city: "Curitiba - PR",
      phrase: "Incrível! Comprei a garrafa 'Sua História' e inclui meus gatinhos, profissão e minha paixão por vôlei. A arte ficou maravilhosa, super recomendo!",
      stars: 5,
      product: "Garrafa Sua História",
      initials: "JM"
    },
    {
      name: "Carlos Eduardo",
      city: "Rio de Janeiro - RJ",
      phrase: "Diferente de tudo. Eu sempre cansei de garrafas sem graça. A USE GAT realmente ouve a gente e cria uma composição artística impecável.",
      stars: 5,
      product: "Garrafa Profissões Premium",
      initials: "CE"
    },
    {
      name: "Mariana Costa",
      city: "Belo Horizonte - MG",
      phrase: "A caneca com rostinho ficou a coisa mais delicada do mundo. Dá pra ver que foi feita à mão e com muito carinho. Com certeza farei outros pedidos.",
      stars: 5,
      product: "Caneca Rostinho Minimalista",
      initials: "MC"
    },
    {
      name: "Arthur Nogueira",
      city: "São Paulo - SP",
      phrase: "Excelente atendimento! Tive dúvidas na montagem da estampa, me chamaram no WhatsApp e me enviaram a prévia digital. A gravação permanente brilha muito!",
      stars: 5,
      product: "Garrafa Esportiva 750ml",
      initials: "AN"
    }
  ];

  useEffect(() => {
    // Slide interval every 5 seconds
    const slideTimer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [reviews.length]);

  useEffect(() => {
    // Load wishlist
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));

    const q = query(collection(db, 'products'), limit(20));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
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

    // Load settings in real-time
    const unsubscribeSettings = onSnapshot(collection(db, 'settings'), (qSettings) => {
      if (!qSettings.empty) {
        const globalDoc = qSettings.docs.find(d => d.id === 'global') || qSettings.docs[0];
        setSettings(globalDoc.data());
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Strict email client-side regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setNewsletterError("Por favor, insira um endereço de e-mail válido com @ e domínio!");
      return;
    }

    setNewsletterLoading(true);

    try {
      const response = await fetch('/api/send-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNewsletterDiscountCode(data.coupon || "PRIMEIRAGAT10");
        setEmail('');
      } else {
        setNewsletterError(data.error || "Algo deu errado ao gerar o seu cupom. Tente novamente!");
      }
    } catch (err: any) {
      console.error("Newsletter submission error:", err);
      // Fallback
      setNewsletterDiscountCode("PRIMEIRAGAT10");
      setEmail('');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="bg-transparent overflow-hidden pb-24 lg:pb-12 pt-0">
      {/* 1. Hero Presenter */}
      <section className="relative min-h-[80vh] flex flex-col md:flex-row items-center justify-between bg-[#F4EFE7] px-6 lg:px-20 py-20 md:py-28 border-b border-brand-gold/10 overflow-hidden">
        {/* Boho aesthetic elements with Parallax motion */}
        <motion.div 
          style={{ y: yFloat }}
          className="absolute top-[-50px] right-[-50px] w-96 h-96 rounded-full bg-[#FAF7F2] opacity-60 filter blur-3xl pointer-events-none" 
        />
        <motion.div 
          style={{ y: yParallaxImage }}
          className="absolute bottom-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#EFE9DD] opacity-60 filter blur-3xl pointer-events-none" 
        />

        {/* Text Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl relative z-10 space-y-6 md:space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B48A4E]/10 rounded-full border border-[#B48A4E]/20">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[#B48A4E]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#8C6A3B]">{settings?.banner_img_1_tag || "Exclusividade 'Sua História'"}</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-serif text-brand-black tracking-tight leading-tight md:leading-[1.1]">
            {settings?.banner_title ? (
              <span>
                {settings.banner_title.replace(settings.banner_bold_text || "contamos histórias", "")}
                <br />
                <span className="font-serif italic font-bold border-b-4 border-brand-gold/30">{settings.banner_bold_text || "contamos histórias"}</span>
              </span>
            ) : (
              <span>
                Não estampamos apenas, <br />
                <span className="font-serif italic font-bold border-b-4 border-brand-gold/30">contamos histórias</span>
              </span>
            )}
          </h1>

          <p className="text-sm md:text-lg text-brand-gray font-medium leading-relaxed max-w-xl">
            {settings?.banner_desc || "Bem-vindo à USE GAT. Somos especialistas em transformar suas memórias, esportes preferidos, comidas do coração e datas marcantes em canecas premium e garrafas térmicas com gravação permanente sob medida."}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Link 
                to="/categoria/garrafas-termicas" 
                className="bg-brand-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.15em] text-xs hover:bg-brand-primary-light transition-all transform inline-block shadow-xl hover:shadow-brand-primary/20"
              >
                {settings?.banner_btn_text || "CRIAR MINHA GARRAFA"}
              </Link>
            </motion.div>
            
            <motion.a 
              href="#rastreio"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-brand-primary border border-brand-primary/15 px-10 py-5 rounded-full font-black uppercase tracking-[0.15em] text-xs hover:border-brand-primary hover:bg-brand-pink-light transition-all text-center"
            >
              RASTREAR MEU PEDIDO
            </motion.a>
          </div>
        </motion.div>

        {/* Hero Collage with Parallax Depth and Smooth Hover Effects */}
        <div className="relative mt-16 md:mt-0 w-full md:w-[480px] aspect-[4/3] md:aspect-square flex justify-center items-center">
          {/* Main frame / Forefront Card */}
          <motion.div 
            style={{ y: yParallaxText }}
            initial={{ opacity: 0, rotate: -6 }}
            animate={{ opacity: 1, rotate: -3 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="bg-white p-4 shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-stone-150 transform w-72 sm:w-[320px] relative z-10 rounded-[24px]"
          >
            <div className="overflow-hidden rounded-xl bg-stone-50 flex items-center justify-center">
              <img 
                src={settings?.banner_img_1 || "/imagens/banner-sua-historia.jpg"} 
                alt="Modelo Sua História" 
                referrerPolicy="no-referrer"
                className={`w-full hover:scale-105 transition-transform duration-700 ${settings?.banner_img_1 ? 'h-auto max-h-[380px] object-contain' : 'h-auto object-cover aspect-[4/5]'}`}
              />
            </div>
            <div className="pt-4 pb-2 text-center">
              <p className="font-handwriting text-xl text-brand-gold">{settings?.banner_img_1_name || "Garrafa Sua História"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]/60 mt-1">100% Personalizado Para Você</p>
            </div>
            
            <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur px-3.5 py-2 rounded-full border border-stone-250 text-[8px] font-black text-brand-primary uppercase tracking-widest shadow-lg rotate-[-12deg]">
              {settings?.banner_img_1_tag || "🌿 Rústico & Boho Chic"}
            </div>
          </motion.div>
          
          {/* Secondary card behind - Moves slower for depth */}
          <motion.div 
            style={{ y: yParallaxImage }}
            initial={{ opacity: 0, rotate: 12 }}
            animate={{ opacity: 1, rotate: 8 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="bg-white p-3 shadow-2xl border border-stone-150 w-48 sm:w-60 absolute right-4 bottom-2 z-0 hidden sm:block rounded-[20px]"
          >
            <div className="overflow-hidden rounded-lg bg-stone-50 flex items-center justify-center">
              <img 
                src={settings?.banner_img_2 || "/imagens/mugs-boho.jpg"} 
                alt="Canecas Boho" 
                referrerPolicy="no-referrer"
                className={`w-full hover:scale-105 transition-transform duration-700 ${settings?.banner_img_2 ? 'h-auto max-h-[240px] object-contain' : 'h-auto object-cover aspect-square'}`}
              />
            </div>
            <p className="font-handwriting text-lg text-center text-brand-black mt-2">{settings?.banner_img_2_name || "Caneca Minimalista"}</p>
          </motion.div>
        </div>
      </section>

      <FeaturesBanner />
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

          <div className="flex flex-col w-full md:w-auto">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row w-full gap-3 items-stretch">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu melhor e-mail"
                className="bg-white/80 border border-brand-gold/20 px-6 py-4 rounded-full flex-grow md:w-80 font-medium text-sm outline-none focus:border-brand-primary transition-all shadow-inner w-full"
                required
                disabled={newsletterLoading}
              />
              <button 
                type="submit"
                disabled={newsletterLoading}
                className="bg-brand-primary disabled:opacity-60 text-white px-6 sm:px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary-light transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg w-full sm:w-auto font-sans"
              >
                <Send className="w-4 h-4" />
                {newsletterLoading ? "ENVIANDO..." : "QUERO MEU CUPOM"}
              </button>
            </form>
            {newsletterError && (
              <p className="text-red-700 text-xs mt-2 font-bold font-sans text-left ml-4 bg-red-50 py-1.5 px-3 rounded-xl border border-red-200">
                ⚠️ {newsletterError}
              </p>
            )}
          </div>
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

      {/* Seção Categorias Premium - Estilo Boho / Shopify Premium */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-16 max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="text-center mb-12">
          <span className="text-brand-gold font-handwriting text-2xl block">Nossas Coleções</span>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-brand-black mt-1">Navegue por Categorias</h2>
          <div className="w-16 h-1 bg-brand-gold mx-auto mt-3 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Garrafas Térmicas",
              desc: "Isolamento a vácuo de alta performance, gravação a laser definitiva e design rústico boho exclusivo.",
              path: "/categoria/garrafas-termicas",
              icon: <Flame className="w-8 h-8 text-brand-gold group-hover:rotate-12 transition-transform duration-300" />,
              bg: "bg-[#F5E6F0]/50",
              badge: "Mais Procurado"
            },
            {
              name: "Canecas Premium",
              desc: "Cerâmica robusta, aconchego em cada gole e composições artísticas repletas de afeto.",
              path: "/categoria/canecas",
              icon: <Coffee className="w-8 h-8 text-brand-gold group-hover:scale-110 transition-transform duration-300" />,
              bg: "bg-[#FAF7F2]/80",
              badge: "Artesanal"
            },
            {
              name: "Atacado & Brindes",
              desc: "Projetos robustos para empresas, mimos de fim de ano ou comemorações memoráveis.",
              path: "/categoria/atacado-e-empresas",
              icon: <ShoppingBag className="w-8 h-8 text-brand-gold group-hover:translate-y-[-2px] transition-transform duration-300" />,
              bg: "bg-stone-50",
              badge: "Descontos de 40%"
            }
          ].map((cat, i) => (
            <Link to={cat.path} key={i}>
              <motion.div
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  boxShadow: "0 15px 35px rgba(77,29,84,0.06)",
                  borderColor: "rgba(180,138,78,0.2)"
                }}
                whileTap={{ scale: 0.98 }}
                className="group p-8 rounded-[32px] border border-brand-pink-medium/30 bg-white shadow-sm transition-all duration-300 flex flex-col justify-between h-56 relative overflow-hidden"
              >
                {/* Background glow decorator inside the card */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-gold/5 blur-xl group-hover:bg-brand-gold/10 transition-colors pointer-events-none" />
                
                <div className="space-y-4">
                  <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner transition-colors duration-300", cat.bg)}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-serif italic font-bold text-xl text-brand-black group-hover:text-brand-primary transition-colors flex items-center gap-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-brand-gray font-medium leading-relaxed mt-1">{cat.desc}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Explorar Coleção <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  {cat.badge && (
                    <span className="bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {cat.badge}
                    </span>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.section>



      {/* 3. Lançamentos GRID & Auto Carousel */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="py-24 max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
          <div className="text-center md:text-left space-y-2">
            <span className="text-brand-gold font-handwriting text-2xl">Peças sob medida</span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black mt-2 leading-tight">Destaques Criativos</h2>
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
          {products.map((product) => (
            <motion.div 
              key={product.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -12, 
                boxShadow: "0 25px 55px rgba(77,29,84,0.13)",
                borderColor: "rgba(180,138,78,0.35)"
              }}
              whileTap={{ scale: 0.99 }}
              className="group relative bg-white border border-brand-pink-medium/20 p-6 rounded-[24px] shadow-[0_5px_20px_rgba(77,29,84,0.03)] hover:bg-white transition-all duration-500 ease-out flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-[20px] bg-stone-50 overflow-hidden border border-brand-gold/5 flex items-center justify-center p-4">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-700 ease-in-out"
                  />
                  {/* Heart Toggle */}
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-primary transition-all"
                  >
                    <Heart 
                      className={cn(
                        "w-5 h-5 transition-all duration-300", 
                        wishlist.includes(product.id) ? "fill-brand-primary text-brand-primary" : "text-brand-gray"
                      )} 
                    />
                  </motion.button>
                  {product.customizable && (
                    <span className="absolute top-4 left-4 bg-[#4D1D54] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                      ✨ 100% Personalizado
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-1">
                    {product.subcategory || 'Coleção Real'}
                  </span>
                  <h3 className="font-serif italic font-bold text-xl text-brand-black group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-brand-gray font-medium mt-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Rating and Price Logic matches User Image */}
                <div className="mt-6 pt-5 border-t border-brand-pink-light/30 flex flex-col items-center text-center">
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
                {product.customizable ? (
                  <>
                    <div className="flex-grow">
                      <Link 
                        to={`/produto/${product.id}`}
                        className="w-full bg-[#4D1D54] hover:bg-[#6c2877] text-white py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-[0_4px_12px_rgba(77,29,84,0.18)] hover:shadow-[0_8px_24px_rgba(77,29,84,0.30)] hover:-translate-y-0.5 active:translate-y-0 duration-300 transition-all block"
                      >
                        Customizar
                      </Link>
                    </div>
                    <div className="flex-grow">
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
                        className="w-full bg-[#B48A4E] hover:bg-[#a3793d] text-white py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-[0_4px_12px_rgba(180,138,78,0.15)] hover:shadow-[0_8px_24px_rgba(180,138,78,0.25)] hover:-translate-y-0.5 active:translate-y-0 duration-300 transition-all font-sans"
                      >
                        Comprar
                      </button>
                    </div>
                  </>
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
                    className="flex-grow bg-[#4D1D54] text-white hover:bg-[#6c2877] py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-[0_4px_12px_rgba(77,29,84,0.18)] hover:shadow-[0_8px_24px_rgba(77,29,84,0.30)] hover:-translate-y-0.5 active:translate-y-0 duration-300 transition-all"
                  >
                    Comprar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Como Personalizar Seu Pedido Section */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="py-24 bg-[#F4EFE7]/40 border-y border-brand-gold/10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <div className="mb-16 space-y-2">
            <span className="text-brand-gold font-handwriting text-2xl">Artesanal & Sob Medida</span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-black tracking-tight">Como Personalizar seu Pedido</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto rounded-full mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                num: "01",
                title: settings?.custom_step_1_title || "Escolha o Produto",
                desc: settings?.custom_step_1_desc || "Selecione o modelo ideal de Garrafa Térmica ou Caneca Premium do nosso catálogo rústico boho."
              },
              {
                num: "02",
                title: settings?.custom_step_2_title || "Preencha a História",
                desc: settings?.custom_step_2_desc || "Preencha os dados de texto e selecione fotos/desenhos marcantes na página de customização."
              },
              {
                num: "03",
                title: settings?.custom_step_3_title || "Produção e Afeto",
                desc: settings?.custom_step_3_desc || "Nossos ilustradores montam o layout perfeito e gravamos a laser de forma permanente."
              }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -6, boxShadow: "0 15px 30px rgba(0,0,0,0.05)" }}
                className="bg-white p-8 rounded-[24px] border border-brand-gold/15 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-center space-y-4 transition-all relative"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-serif font-black text-xs md:text-sm shadow-md">
                  {step.num}
                </div>
                <h4 className="font-serif font-black text-brand-black text-xl pt-4">{step.title}</h4>
                <p className="text-xs text-brand-gray font-medium leading-relaxed uppercase tracking-wider">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>



      {/* 5. Depoimentos Slider (Review) - Automático & Afetivo */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="py-24 max-w-4xl mx-auto px-6 lg:px-10 overflow-hidden relative"
      >
        <div className="text-center mb-12">
          <span className="text-brand-gold font-handwriting text-2xl block">Carinho dos GAT Lovers</span>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-brand-black mt-1 italic">Gente Feliz, Histórias Contadas</h2>
          <div className="w-16 h-1 bg-brand-gold mx-auto mt-3 rounded-full" />
        </div>

        {/* Slider Frame */}
        <div className="relative min-h-[300px] bg-white rounded-[24px] border border-brand-pink-medium/30 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-8 md:p-14 flex flex-col justify-between">
          <span className="text-[6rem] text-brand-gold opacity-10 leading-none absolute top-4 left-6 font-serif select-none pointer-events-none">“</span>
          
          <div className="relative z-10 flex-grow flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReview}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 w-full"
              >
                <div className="flex items-center gap-1">
                  {[...Array(reviews[currentReview].stars)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                
                <p className="text-base md:text-lg font-medium leading-relaxed italic text-brand-black font-serif text-brand-gray">
                  "{reviews[currentReview].phrase}"
                </p>

                <div className="pt-6 border-t border-brand-gold/10 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* Elegant Boho Initials Badge with Golden Border */}
                    <div className="w-12 h-12 rounded-full border-2 border-brand-gold flex items-center justify-center bg-brand-pink-medium text-[#4D1D54] font-black text-sm shadow-md shrink-0">
                      {reviews[currentReview].initials}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-brand-black text-base leading-tight">{reviews[currentReview].name}</h4>
                      <p className="text-[10px] uppercase font-semibold tracking-widest text-brand-gold mt-0.5">{reviews[currentReview].city}</p>
                    </div>
                  </div>
                  
                  <span className="bg-brand-pink-light px-4 py-2 rounded-2xl border border-stone-100 font-black text-[9px] uppercase tracking-wider text-brand-primary shadow-sm">
                    💝 {reviews[currentReview].product}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8 z-10">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentReview(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentReview === idx 
                    ? "w-8 bg-brand-primary" 
                    : "w-2 bg-brand-pink-medium hover:bg-brand-gold"
                )}
                aria-label={`Ir para depoimento ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.section>

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

      {/* Video Showcase Section */}
      <section className="py-24 bg-white border-y border-brand-gold/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-brand-pink-light/30 opacity-50 filter blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10 w-full">
          <div className="space-y-2">
            <span className="text-brand-gold font-handwriting text-2xl">Nosso Canal e Produção</span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-brand-black">{settings?.video_title_1 || "Gravação a Laser Permanente"}</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest max-w-md mx-auto">{settings?.video_desc_1 || "Assista ao processo computadorizado milimétrico em nosso ateliê"}</p>
          </div>
          
          <div className="aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-brand-gold/15 relative bg-[#FAF7F2]">
            {settings?.video_url_1 ? (
              <iframe
                className="w-full h-full"
                src={settings.video_url_1.includes("watch?v=") ? settings.video_url_1.replace("watch?v=", "embed/") : settings.video_url_1}
                title={settings?.video_title_1 || "Vídeo GAT"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-brand-gray space-y-4">
                <Coffee className="w-12 h-12 text-brand-gold" />
                <p className="text-sm font-bold uppercase tracking-widest text-[#8C6A3B]">Nenhum vídeo publicado ainda</p>
                <p className="text-xs max-w-xs leading-relaxed">Insira uma URL de vídeo no painel para exibir seu trabalho aqui em tempo real!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dúvidas Frequentes FAQ Section */}
      <section className="py-24 bg-[#FAF7F8]/40 border-b border-brand-gold/10" id="duvidas-frequentes">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-2">
            <span className="text-brand-gold font-handwriting text-2xl">Atendimento & Dúvidas</span>
            <h2 className="text-4xl font-serif font-black text-brand-black">Dúvidas Frequentes</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest">Tudo o que você precisa saber sobre o seu presente afetivo</p>
            <div className="w-16 h-1 bg-brand-gold mx-auto rounded-full mt-4" />
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {(() => {
              const faqList = settings?.faqs 
                ? settings.faqs.filter((faq: any) => faq && faq.q && faq.q.trim() !== '') 
                : [];
              return (faqList.length > 0 ? faqList : [
                { q: "Qual o prazo de envio?", a: "Nosso prazo normal de produção Boho é de 5 a 7 dias úteis antes do despacho." },
                { q: "A gravação a laser é definitiva?", a: "Sim! A gravação é permanente e resistente, pois remove a pintura revelando o aço cirúrgico." },
                { q: "Como envio meus dados de personalização?", a: "Diretamente na página do produto antes de adicionar ao carrinho de forma 100% integrada e segura." },
                { q: "Posso colocar nome e sobrenome?", a: "Com certeza, adaptamos o tamanho das letras para que fique perfeitamente harmonioso." }
              ]);
            })().map((faq: any, i: number) => (
              <div 
                key={i} 
                className="bg-white rounded-3xl border border-brand-gold/15 overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left px-8 py-6 flex justify-between items-center bg-white hover:bg-brand-pink-light/30 transition-colors"
                >
                  <span className="font-serif font-black text-brand-black text-base md:text-lg">
                    {faq.q}
                  </span>
                  <span className={`text-brand-gold font-bold text-xl transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {activeFaq === i && (
                  <div className="px-8 pb-6 text-sm text-brand-gray font-medium leading-relaxed border-t border-brand-pink-medium/10 pt-4 bg-[#FAF7F8]/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
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
          {(settings?.instagram_posts || [
            {
              title: "Coleção Sua História ✨",
              img: "/imagens/home-element-1.png",
              link: "https://www.instagram.com/use.gat/reel/DHBhb5JRPHk/",
              views: "150.000+ visualizações",
              likes: "18.2k curtidas",
              desc: "O vídeo queridinho mostrando o passo a passo da nossa Gravação a Laser na Garrafa Térmica. Cada desenho é uma memória real de afeto gravada para sempre."
            },
            {
              title: "Caneca Rostinho Boho 🌸",
              img: "/imagens/home-element-2.png",
              link: "https://www.instagram.com/use.gat/reel/DI1HjHRRyPl/",
              views: "84.000+ visualizações",
              likes: "12.5k curtidas",
              desc: "Nosso xodó do feed! O processo artístico de desenhar à mão os traços do rostinho dos namorados sobre cerâmica premium. Aconchego e doçura pura."
            },
            {
              title: "Unboxing de Amor 📦",
              img: "/imagens/home-element-3.png",
              link: "https://www.instagram.com/use.gat/reel/DLBUtyAsecw/",
              views: "240.000+ visualizações",
              likes: "24.3k curtidas",
              desc: "Os bastidores da nossa embalagem rústica Boho que viralizaram: palha de trigo perfumada, raminho de flores secas e o nosso autêntico selo de cera real."
            }
          ]).map((post: any, i: number) => (
            <a 
              key={i} 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-[#FAF7F8]/40 border border-[#FAF7F8] rounded-[2.5rem] overflow-hidden hover:bg-white hover:shadow-[0_20px_50px_rgba(77,29,84,0.11)] hover:border-brand-gold/25 hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={post.img || `/imagens/home-element-${(i % 3) + 1}.png`} 
                    alt={post.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
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
