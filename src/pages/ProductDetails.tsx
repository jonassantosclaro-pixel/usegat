import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice, cn } from '@/src/lib/utils';
import { 
  ShoppingBag, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FALLBACK_PRODUCTS, Product } from '@/src/lib/productsData';

// Interactive Custom Tag Selector
function TagCloud({ 
  items, 
  selected, 
  onToggle, 
  min, 
  max 
}: { 
  items: string[]; 
  selected: string[]; 
  onToggle: (item: string) => void; 
  min: number; 
  max: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#8C6A3B]">
        <span>Selecione de {min} a {max} itens</span>
        <span className={selected.length >= min && selected.length <= max ? "text-green-600 bg-green-50 px-2 py-0.5 rounded" : "text-brand-primary"}>
          {selected.length} selecionado{selected.length !== 1 && 's'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <button
              type="button"
              key={item}
              onClick={() => onToggle(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isSelected 
                  ? 'bg-[#4D1D54] text-white border-[#4D1D54] shadow-sm' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#4D1D54]/30'
              }`}
            >
              {item}
              {isSelected && <Check className="w-3.5 h-3.5 inline-block ml-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Advanced customization state matching elements perfectly
  const [elementsStyle, setElementsStyle] = useState<'colorido' | 'preto'>('colorido');
  
  // Custom Tag Categories lists
  const comidaPresets = ["Pizza", "Hambúrguer", "Hotdog", "Pipoca", "Coxinha", "Churrasco", "Macarrão", "Comida Japonesa", "Comida Mexicana", "Legumes Favoritos", "Frutas Favoritas", "Ovo", "Sanduíche"];
  const bebidaPresets = ["Água", "Refrigerante Zero", "Refrigerante Comum", "Suco", "Caipirinha", "Cerveja", "Vinho", "Gin", "Coquetéis", "Café", "Cappuccino", "Chá"];
  const entretenimentoPresets = ["Cinema", "Maratonar Séries", "Video Game", "Leitura", "Telejornal"];
  const lazerPresets = ["Praia", "Cachoeira", "Montanha", "Neve", "Trilha", "Passeio de Barco", "Surf", "Bicicleta", "Corrida", "Musculação", "Meditação", "Tênis", "Estádio de Futebol"];
  const momentosPresets = ["Viagem Inesquecível", "Um Local Marcante", "Data do Casamento", "Data do Aniversário", "Filhos", "Pais", "Avós", "Sobrinho / Afilhados", "Nome Especial"];
  const diversosPresets = ["Profissão", "Time de Futebol", "Religião", "Animais de Estimação", "Fazer as Unhas", "Cortar Cabelo", "Escrever / Diário", "Fazer Compras"];

  const [selectedComidas, setSelectedComidas] = useState<string[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<string[]>([]);
  const [selectedEntretenimento, setSelectedEntretenimento] = useState<string[]>([]);
  const [selectedLazer, setSelectedLazer] = useState<string[]>([]);
  const [selectedMomentos, setSelectedMomentos] = useState<string[]>([]);
  const [selectedDiversos, setSelectedDiversos] = useState<string[]>([]);

  // Caricatura Configs
  const [hasCaricatura, setHasCaricatura] = useState(false);
  const [caricaturasQtd, setCaricaturasQtd] = useState(1);
  const [caricaturaEstilo, setCaricaturaEstilo] = useState<'colorido' | 'preto'>('colorido');
  const [caricaturaFile, setCaricaturaFile] = useState<string | null>(null);

  // Text inputs
  const [customName, setCustomName] = useState('');
  const [customPhrase, setCustomPhrase] = useState('');

  // General error checklist
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const calculateFontSize = (text: string, category: string) => {
    const len = text.length;
    const isCaneca = category === 'canecas';
    if (isCaneca) {
      if (len <= 5) return '1.5rem';
      if (len <= 8) return '1.25rem';
      if (len <= 12) return '1.05rem';
      if (len <= 16) return '0.85rem';
      if (len <= 20) return '0.72rem';
      return '0.62rem';
    } else {
      // Bottle: much narrower print area
      if (len <= 5) return '0.95rem';
      if (len <= 8) return '0.80rem';
      if (len <= 12) return '0.65rem';
      if (len <= 16) return '0.52rem';
      if (len <= 20) return '0.42rem';
      return '0.36rem';
    }
  };

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'products', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      } else {
        // Fallback checks
        const fallbackObj = FALLBACK_PRODUCTS.find(p => p.id === id);
        if (fallbackObj) {
          setProduct(fallbackObj);
        } else {
          setProduct(null);
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore offline or fetch failed, using fallback item:", id);
      const fallbackObj = FALLBACK_PRODUCTS.find(p => p.id === id);
      setProduct(fallbackObj || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const toggleItem = (item: string, state: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (state.includes(item)) {
      setter(state.filter(x => x !== item));
    } else {
      setter([...state, item]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCaricaturaFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Caricatura adds R$ 35,00 extra per caricatura person
  const caricaturaPriceExtra = hasCaricatura ? caricaturasQtd * 35.00 : 0;
  const productFinalPrice = product ? product.price + caricaturaPriceExtra : 0;

  const handleAddToCart = () => {
    // Perform validations
    const errors: string[] = [];
    
    if (product?.isSuaHistoria) {
      if (!customName.trim()) errors.push("Por favor, preencha o campo de Nome.");
      if (selectedComidas.length < 5 || selectedComidas.length > 10) errors.push("Selecione de 5 a 10 comidas favoritas.");
      if (selectedBebidas.length < 3 || selectedBebidas.length > 5) errors.push("Selecione de 3 a 5 bebidas favoritas.");
      if (selectedEntretenimento.length < 2 || selectedEntretenimento.length > 5) errors.push("Selecione de 2 a 5 entretenimentos favoritios.");
      if (selectedLazer.length < 5 || selectedLazer.length > 10) errors.push("Selecione de 5 a 10 atividades de lazer.");
      if (selectedMomentos.length < 3 || selectedMomentos.length > 5) errors.push("Selecione de 3 a 5 momentos/pessoas inesquecíveis.");
      if (selectedDiversos.length < 2 || selectedDiversos.length > 5) errors.push("Selecione de 2 a 5 diversos.");
      if (hasCaricatura && !caricaturaFile) errors.push("Por favor, faça o upload de pelo menos uma foto para a caricatura.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      // Flow scroll top on customizer block
      const element = document.getElementById("customizer-anchor");
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);

    let customization: any = undefined;
    if (product?.isSuaHistoria) {
      customization = {
        tipo: 'sua-historia',
        nome: customName,
        frase: customPhrase,
        elementsStyle,
        comidas: selectedComidas.join(', '),
        bebidas: selectedBebidas.join(', '),
        entretenimento: selectedEntretenimento.join(', '),
        lazer: selectedLazer.join(', '),
        momentos: selectedMomentos.join(', '),
        diversos: selectedDiversos.join(', '),
        caricatura: hasCaricatura ? {
          qtd: caricaturasQtd,
          estilo: caricaturaEstilo,
          foto: caricaturaFile
        } : null
      };
    } else if (product?.customizable) {
      customization = {
        tipo: product.category === 'canecas' ? 'caneca' : 'custom',
        nome: customName,
        frase: customPhrase,
        foto: caricaturaFile
      };
    }

    addItem({
      id: product!.id,
      sku: product!.sku,
      name: product!.name,
      price: productFinalPrice,
      imageUrl: product!.imageUrl,
      quantity,
      customization
    });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-[#4D1D54]">Carregando os mimos da USE GAT...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-brand-gold">Produto não encontrado.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-black uppercase tracking-widest mb-12 hover:text-[#4D1D54] transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Voltar para a loja
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left Column: Visual product view */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/40 backdrop-blur-md rounded-[50px] p-12 aspect-square flex items-center justify-center shadow-sm border border-brand-pink-medium/30 relative overflow-hidden val-preview-box"
          >
            <div className="relative w-full h-full flex items-center justify-center garrafa-preview">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-contain relative z-10 transition-transform duration-500 hover:scale-105"
              />
              
              {/* Overlaid preview tag */}
              {product.customizable && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none">
                  {/* Position of print on the bottle: usually the center of the bottle body */}
                  <div className={cn(
                    "flex flex-col justify-center items-center text-center px-1 overflow-hidden",
                    product.category === 'canecas' 
                      ? "w-[30%] h-[25%] mt-[3%] mr-[10%]" 
                      : "w-[23%] h-[30%] mt-[22%]"
                  )}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={customName || 'placeholder'}
                        initial={{ opacity: 0, scale: 0.95, y: 3 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="texto-preview select-none overflow-hidden text-ellipsis flex flex-col items-center justify-center w-full"
                      >
                        <span 
                          className={cn(
                            "font-serif text-center font-bold tracking-widest break-all uppercase leading-tight",
                            customName.trim() ? "text-[#3D1A45]/85 font-black" : "text-[#4D1D54]/25 font-medium italic"
                          )}
                          style={{ 
                            fontSize: calculateFontSize(customName.trim() || 'Seu Nome', product.category),
                            fontFamily: '"Space Grotesk", "Cinzel", "Playfair Display", "Inter", sans-serif',
                            textShadow: customName.trim() 
                              ? '1px 1px 1px rgba(255,255,255,0.7), -0.5px -0.5px 0px rgba(0,0,0,0.15)' 
                              : 'none',
                            letterSpacing: '0.12em',
                            display: 'block',
                            width: '100%'
                          }}
                        >
                          {customName.trim() ? customName.trim() : 'Seu Nome'}
                        </span>
                        
                        {customPhrase.trim() && (
                          <span 
                            className="text-[#4D1D54]/65 font-medium italic mt-2 block w-[85%] break-words leading-tight"
                            style={{ 
                              fontSize: '0.625rem',
                              letterSpacing: '0.05em',
                              fontFamily: '"Playfair Display", serif',
                              textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.5)'
                            }}
                          >
                            {customPhrase}
                          </span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
            
            {/* Elegant Background Stamp */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-pink-medium/20 to-transparent pointer-events-none" />
          </motion.div>

          {/* Description Block */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <span className="bg-[#B48A4E]/10 border border-[#B48A4E]/20 text-[#8C6A3B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {product.category === 'garrafas-termicas' ? '♨️ Térmica de Alta Conservação' : '☕ Cerâmica Natural Boho'}
              </span>
            </div>
            
            <h2 className="text-3xl font-serif text-brand-black">Sobre este Mimo</h2>
            <p className="text-sm text-brand-gray font-medium leading-relaxed italic">
              {product.description}
            </p>

            {product.detailedDescription && (
              <div className="bg-[#FAF7F8]/80 p-6 rounded-[2rem] border border-[#B48A4E]/10 space-y-3">
                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Informações Técnicas & Cuidados</h4>
                <div className="text-xs text-brand-gray font-medium leading-loose space-y-2">
                  {product.detailedDescription.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-pink-medium/30">
              {[
                { icon: Truck, text: "Correios c/ Código" },
                { icon: ShieldCheck, text: "Gravação à Laser eterna" },
                { icon: RotateCcw, text: "Troca s/ Burocracia" }
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-3 opacity-85">
                  <badge.icon className="w-6 h-6 mb-2 text-brand-gold" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-gray leading-none">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Title info and customizer */}
        <div id="customizer-anchor" className="space-y-10">
          <div className="space-y-4">
            <span className="text-[#8C6A3B] font-serif italic text-xl">Coleção {product.subcategory || "GAT"}</span>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-black leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-6 pt-2">
              <span className="text-4xl font-serif font-black text-brand-primary">
                {formatPrice(productFinalPrice)}
              </span>
              {hasCaricatura && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded">
                  Incluindo + {caricaturasQtd} caricatura{caricaturasQtd > 1 && 's'}
                </span>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-wide text-[#8C6A3B]">
              Em até 3x de {formatPrice(productFinalPrice / 3)} sem juros no cartão
            </p>
          </div>

          {/* Validation Checklist Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl space-y-2 text-red-700">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Por favor, verifique os campos pendentes:</span>
              </div>
              <ul className="list-disc list-inside text-xs font-bold space-y-1 pl-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* DYNAMIC FORM */}
          {product.customizable ? (
            <div className="bg-[#FAF7F8]/80 p-8 rounded-[40px] border border-brand-gold/15 space-y-10">
              <h3 className="text-lg font-serif italic font-bold border-b border-brand-gold/10 pb-3 text-[#4D1D54]">
                Responda o nosso Questionário de Criação
              </h3>

              {/* SECTION: Elements style tracker */}
              {product.isSuaHistoria && (
                <div className="space-y-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]">1. Tipo dos Elementos na Garrafa</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Option 1: COLORIDO */}
                    <button
                      type="button"
                      onClick={() => setElementsStyle('colorido')}
                      className={`p-5 rounded-[2rem] border-2 text-left space-y-3 transition-all ${
                        elementsStyle === 'colorido'
                          ? 'border-[#4D1D54] bg-[#4D1D54]/5 shadow'
                          : 'border-gray-200 bg-white hover:border-brand-gold/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xl">🎨</span>
                        {elementsStyle === 'colorido' && <div className="w-5 h-5 bg-[#4D1D54] rounded-full flex items-center justify-center text-white text-[10px] font-black">✓</div>}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase text-brand-black">ELEMENTOS COLORIDOS</h4>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Exemplo: Pizza fatiada colorida nas cores originais.</p>
                      </div>
                    </button>

                    {/* Option 2: PRETO E BRANCO */}
                    <button
                      type="button"
                      onClick={() => setElementsStyle('preto')}
                      className={`p-5 rounded-[2rem] border-2 text-left space-y-3 transition-all ${
                        elementsStyle === 'preto'
                          ? 'border-[#4D1D54] bg-[#4D1D54]/5 shadow'
                          : 'border-gray-200 bg-white hover:border-brand-gold/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xl">🔲</span>
                        {elementsStyle === 'preto' && <div className="w-5 h-5 bg-[#4D1D54] rounded-full flex items-center justify-center text-white text-[10px] font-black">✓</div>}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase text-brand-black">APENAS LINHAS (PRETO)</h4>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Exemplo: Contorno fino em traço preto minimalista.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Basic custom texts (Applies to all customizable items) */}
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]">
                  {product.isSuaHistoria ? '2. Identificação Principal' : 'Nomes e Detalhes da Customização'}
                </span>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10.5px] font-bold text-gray-600 block uppercase tracking-wide">Nome Completo do Cliente ou Dono do Mimo</label>
                      <span className="text-[10px] text-gray-400 font-bold bg-[#FAF7F8] px-2 py-0.5 rounded border border-stone-100">
                        {customName.length}/24 carac.
                      </span>
                    </div>
                    <input 
                      id="nomePersonalizado"
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, 24))}
                      maxLength={24}
                      placeholder="Ex: Jonas Santos Claro"
                      className="w-full bg-white border border-gray-205 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-gray-600 block mb-1.5 uppercase tracking-wide">Pequena frase ou data especial (Opcional)</label>
                    <input 
                      type="text" 
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      placeholder="Ex: Desde 2023 ou Viva com Leveza"
                      className="w-full bg-white border border-gray-205 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SUA HISTÓRIA MULTI-TAG SELECTIONS */}
              {product.isSuaHistoria && (
                <div className="space-y-8 pt-4 border-t border-brand-gold/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] block mb-2">3. Seus Gostos, Lazer e Memórias</span>

                  {/* 1. Comidas */}
                  <div className="space-y-3 pb-4 border-b border-brand-gold/5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">🍕 Comidas Favoritas (5 a 10 itens)</label>
                    <TagCloud 
                      items={comidaPresets} 
                      selected={selectedComidas} 
                      onToggle={(item) => toggleItem(item, selectedComidas, setSelectedComidas)} 
                      min={5} 
                      max={10} 
                    />
                  </div>

                  {/* 2. Bebidas */}
                  <div className="space-y-3 pb-4 border-b border-brand-gold/5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">🍹 Bebidas Favoritas (3 a 5 itens)</label>
                    <TagCloud 
                      items={bebidaPresets} 
                      selected={selectedBebidas} 
                      onToggle={(item) => toggleItem(item, selectedBebidas, setSelectedBebidas)} 
                      min={3} 
                      max={5} 
                    />
                  </div>

                  {/* 3. Entretenimento */}
                  <div className="space-y-3 pb-4 border-b border-brand-gold/5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">🎬 Entretenimento (2 a 5 itens)</label>
                    <TagCloud 
                      items={entretenimentoPresets} 
                      selected={selectedEntretenimento} 
                      onToggle={(item) => toggleItem(item, selectedEntretenimento, setSelectedEntretenimento)} 
                      min={2} 
                      max={5} 
                    />
                  </div>

                  {/* 4. Lazer e Esporte */}
                  <div className="space-y-3 pb-4 border-b border-brand-gold/5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">🚴 Lazer e Esporte (5 a 10 itens)</label>
                    <TagCloud 
                      items={lazerPresets} 
                      selected={selectedLazer} 
                      onToggle={(item) => toggleItem(item, selectedLazer, setSelectedLazer)} 
                      min={5} 
                      max={10} 
                    />
                  </div>

                  {/* 5. Momentos inesquecíveis */}
                  <div className="space-y-3 pb-4 border-b border-brand-gold/5">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">💖 Momentos e pessoas inesquecíveis (3 a 5 itens)</label>
                    <TagCloud 
                      items={momentosPresets} 
                      selected={selectedMomentos} 
                      onToggle={(item) => toggleItem(item, selectedMomentos, setSelectedMomentos)} 
                      min={3} 
                      max={5} 
                    />
                  </div>

                  {/* 6. Diversos */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-black block">💼 Diversos (2 a 5 itens)</label>
                    <TagCloud 
                      items={diversosPresets} 
                      selected={selectedDiversos} 
                      onToggle={(item) => toggleItem(item, selectedDiversos, setSelectedDiversos)} 
                      min={2} 
                      max={5} 
                    />
                  </div>
                </div>
              )}

              {/* CARICATURA MODULE (Charges Extra fee) */}
              <div className="space-y-6 pt-6 border-t border-brand-gold/10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-black block">👩‍🎨 Adicionar Caricatura Ilustrada?</span>
                    <span className="text-[10px] text-gray-500 block font-medium">Acresce R$ 35,00 por personagem na composição</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasCaricatura(!hasCaricatura)}
                    className={`w-14 h-8 rounded-full transition-all relative ${hasCaricatura ? 'bg-[#4D1D54]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${hasCaricatura ? 'right-1' : 'left-1'} shadow`} />
                  </button>
                </div>

                {hasCaricatura && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4 pt-2 bg-white/60 p-5 rounded-2xl border border-[#B48A4E]/20"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Quantidade de Personagens (1 a 3)</span>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setCaricaturasQtd(Math.max(1, caricaturasQtd - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-sm bg-white"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm">{caricaturasQtd}</span>
                        <button 
                          type="button"
                          onClick={() => setCaricaturasQtd(Math.min(3, caricaturasQtd + 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-sm bg-white"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCaricaturaEstilo('colorido')}
                        className={`py-2 px-4 rounded-xl text-center text-[10px] font-bold border transition-all ${
                          caricaturaEstilo === 'colorido' ? 'bg-[#4D1D54] text-white' : 'bg-white text-gray-600'
                        }`}
                      >
                        Caricatura Colorida
                      </button>
                      <button
                        type="button"
                        onClick={() => setCaricaturaEstilo('preto')}
                        className={`py-2 px-4 rounded-xl text-center text-[10px] font-bold border transition-all ${
                          caricaturaEstilo === 'preto' ? 'bg-[#4D1D54] text-white' : 'bg-white text-gray-600'
                        }`}
                      >
                        Caricatura Contornos (B&W)
                      </button>
                    </div>

                    {/* Image files upload */}
                    <div className="pt-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#8C6A3B] block mb-2">Selecione uma foto nítida de rosto</label>
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white cursor-pointer hover:border-[#4D1D54]">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        />
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          {caricaturaFile ? "Deseja substituir foto?" : "Carregar Foto de Origem"}
                        </span>
                      </div>
                      
                      {caricaturaFile && (
                        <div className="mt-3 flex items-center gap-3 bg-[#FAF7F8] p-2 rounded border border-[#B48A4E]/10">
                          <img src={caricaturaFile} className="w-12 h-12 rounded object-cover border border-stone-200" />
                          <div className="flex-grow">
                            <span className="text-[9px] font-black text-green-600 block uppercase">FOTO ANEXADA COM SUCESSO</span>
                            <span className="text-[9px] text-brand-gray block">A caricatura será baseada neste rosto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : null}

          {/* Core buying container - Quantities and Add to Cart */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center border border-brand-pink-medium rounded-full overflow-hidden h-14 w-full sm:w-40 bg-[#FAF7F8]/80 backdrop-blur-sm shadow-inner">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-grow font-black text-xl hover:bg-brand-pink-medium text-brand-primary"
                >
                  -
                </button>
                <span className="font-bold text-sm w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-grow font-black text-xl hover:bg-brand-pink-medium text-brand-primary"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="flex-grow bg-brand-primary text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-primary-light hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
