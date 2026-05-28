import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useCart } from '@/src/lib/CartContext';
import axios from 'axios';
import { formatPrice, cn } from '@/src/lib/utils';
import { 
  ShoppingBag, 
  ChevronLeft, 
  Truck, 
  Plus, 
  Minus, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle,
  CreditCard,
  QrCode,
  X
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
  const comidaPresets = ["Pizza", "Hambúrguer", "Hotdog", "Pipoca", "Coxinha", "Churrasco", "Macarrão", "Comida Japonesa", "Comida Mexicana", "Legumes Favoritos", "Frutas Favoritas", "Ovo", "Sanduíche", "Outros"];
  const bebidaPresets = ["Água", "Refrigerante Zero", "Refrigerante Comum", "Suco", "Caipirinha", "Cerveja", "Vinho", "Gin", "Coquetéis", "Café", "Cappuccino", "Chá", "Outros"];
  const entretenimentoPresets = ["Cinema", "Maratonar Séries", "Video Game", "Leitura", "Telejornal", "Outros"];
  const lazerPresets = ["Praia", "Cachoeira", "Montanha", "Neve", "Trilha", "Passeio de Barco", "Surf", "Bicicleta", "Corrida", "Musculação", "Meditação", "Tênis", "Estádio de Futebol", "Outros"];
  const momentosPresets = ["Viagem Inesquecível", "Um Local Marcante", "Data do Casamento", "Data do Aniversário", "Filhos", "Pais", "Avós", "Sobrinho / Afilhados", "Nome Especial", "Outros"];
  const diversosPresets = ["Profissão", "Time de Futebol", "Religião", "Animais de Estimação", "Fazer as Unhas", "Cortar Cabelo", "Escrever / Diário", "Fazer Compras", "Outros"];

  const [selectedComidas, setSelectedComidas] = useState<string[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<string[]>([]);
  const [selectedEntretenimento, setSelectedEntretenimento] = useState<string[]>([]);
  const [selectedLazer, setSelectedLazer] = useState<string[]>([]);
  const [selectedMomentos, setSelectedMomentos] = useState<string[]>([]);
  const [selectedDiversos, setSelectedDiversos] = useState<string[]>([]);

  // Individual item typed detailed custom specifications requested by user
  const [itemCustomTexts, setItemCustomTexts] = useState<Record<string, string>>({});

  // State for 'Outros' text fields
  const [comidasOutros, setComidasOutros] = useState('');
  const [bebidasOutros, setBebidasOutros] = useState('');
  const [entretenimentoOutros, setEntretenimentoOutros] = useState('');
  const [lazerOutros, setLazerOutros] = useState('');
  const [momentosOutros, setMomentosOutros] = useState('');
  const [diversosOutros, setDiversosOutros] = useState('');

  // Caricatura Configs
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [hasCaricatura, setHasCaricatura] = useState(false);
  const [caricaturasQtd, setCaricaturasQtd] = useState(1);
  const [caricaturaEstilo, setCaricaturaEstilo] = useState<string>('Realista');
  const [caricaturaFile, setCaricaturaFile] = useState<string | null>(null);
  const [caricaturaFile2, setCaricaturaFile2] = useState<string | null>(null); // For 2 caricaturas image uploads

  // Text inputs
  const [customName, setCustomName] = useState('');
  const [customSurname, setCustomSurname] = useState('');
  const [customPhrase, setCustomPhrase] = useState('');
  const [selectedFont, setSelectedFont] = useState('Quicksand');
  
  const availableFonts = [
    { name: 'Quicksand', family: 'Quicksand' },
    { name: 'Hello Valentina', family: 'Hello Valentina' },
    { name: 'Cream Cake', family: 'Cream Cake' },
    { name: 'Billion Miracles', family: 'Billion Miracles' }
  ];

  // General error checklist
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    method: 'pix' | 'cartao';
    installments: number;
    text: string;
    price: number;
  } | null>(null);

  // CEP Shipping Calculator
  const [cep, setCep] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingResult, setShippingResult] = useState<{ cost: number; address: any } | null>(null);
  const [shippingError, setShippingError] = useState('');

  // Image Magnifier zoom lenses (lupa) state with HTML cloning
  const [magnifier, setMagnifier] = useState<{
    show: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ show: false, x: 0, y: 0, width: 0, height: 0 });

  // Dynamic product variations loaded from Firestore in real-time
  const [variationsList, setVariationsList] = useState<any[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    // If the cursor is slightly outside, hide the magnifier lens
    if (x < 0 || y < 0 || x > width || y > height) {
      setMagnifier(prev => ({ ...prev, show: false }));
      return;
    }

    setMagnifier({
      show: true,
      x,
      y,
      width,
      height
    });
  };

  const handleMouseLeave = () => {
    setMagnifier(prev => ({ ...prev, show: false }));
  };

  const handleCalculateShipping = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setShippingError('Por favor, informe um CEP válido com 8 dígitos.');
      setShippingResult(null);
      return;
    }

    setShippingLoading(true);
    setShippingError('');
    setShippingResult(null);

    try {
      const response = await axios.get(`/api/shipping/${cleanCep}`);
      const { cost, address } = response.data;
      setShippingResult({ cost, address });
    } catch (error) {
      console.warn("Erro ao buscar CEP via backend, usando fallback ViaCEP direto:", error);
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (viaCepRes.ok) {
          const data = await viaCepRes.json();
          if (!data.erro) {
            const fallbackCost = 18.00;
            setShippingResult({
              cost: fallbackCost,
              address: {
                rua: data.logradouro || '',
                cidade: data.localidade || '',
                estado: data.uf || '',
                bairro: data.bairro || ''
              }
            });
          } else {
            setShippingError('CEP não encontrado.');
          }
        } else {
          setShippingError('Erro ao buscar o CEP.');
        }
      } catch (fallbackError) {
        console.error("Erro no fallback do CEP:", fallbackError);
        setShippingError('Não foi possível calcular o frete para este CEP.');
      }
    } finally {
      setShippingLoading(false);
    }
  };

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

  useEffect(() => {
    if (!product) return;
    const variationsRef = collection(db, 'variations');
    const unsubscribe = onSnapshot(variationsRef, (snapshot) => {
      const allVars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      // Filter variations where categoryId is empty/undefined or matches product category
      const filtered = allVars.filter((v: any) => !v.categoryId || v.categoryId === product.category) as any[];
      setVariationsList(filtered);
      
      // Select default option for each loaded variation in state
      setSelectedVariations(prev => {
        const next = { ...prev };
        for (const v of filtered) {
          if (!next[v.name] && v.options && v.options.length > 0) {
            next[v.name] = v.options[0];
          }
        }
        return next;
      });
    }, (error) => {
      console.warn("Variations snapshot failed/offline, using local static values in ProductDetails:", error);
    });
    return () => unsubscribe();
  }, [product]);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data());
      }
    }, (error) => {
      console.warn("Could not load global settings in ProductDetails:", error);
    });
    return () => unsubscribe();
  }, []);

  const getSelectedVariationsSurcharge = () => {
    let extra = 0;
    for (const [vName, vVal] of Object.entries(selectedVariations)) {
      const valStr = vVal as string;
      const match = valStr.match(/\(\+\s*R\$\s*([\d,.]+)\)/i);
      if (match) {
        const valueNum = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(valueNum)) {
          extra += valueNum;
        }
      }
    }
    return extra;
  };

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
      if (file.size > 5 * 1024 * 1024) {
        alert("Escolha um arquivo menor de 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCaricaturaFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Escolha um arquivo menor de 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCaricaturaFile2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Caricatura dynamic pricing from database settings
  const price1image = globalSettings?.caricatura_price_1 ? parseFloat(globalSettings.caricatura_price_1) : 19.90;
  const price2images = globalSettings?.caricatura_price_2 ? parseFloat(globalSettings.caricatura_price_2) : 39.80;

  const caricaturaPriceExtra = hasCaricatura 
    ? (caricaturasQtd === 2 ? price2images : price1image) 
    : 0;
  const variationsPriceExtra = getSelectedVariationsSurcharge();
  const productFinalPrice = product ? product.price + caricaturaPriceExtra + variationsPriceExtra : 0;

  const handleAddToCart = () => {
    // Perform validations
    const errors: string[] = [];

    if (product?.stock !== undefined && product.stock <= 0) {
      alert("Desculpe, este produto está temporariamente fora de estoque.");
      return;
    }
    
    if (product?.isSuaHistoria) {
      if (!customName.trim()) errors.push("Por favor, preencha o campo de Nome.");
      if (selectedComidas.length < 5 || selectedComidas.length > 10) errors.push("Selecione de 5 a 10 comidas favoritas.");
      if (selectedComidas.includes("Outros") && !comidasOutros.trim()) errors.push("Por favor, especifique qual outra comida você gostaria de incluir.");
      if (selectedBebidas.length < 3 || selectedBebidas.length > 5) errors.push("Selecione de 3 a 5 bebidas favoritas.");
      if (selectedBebidas.includes("Outros") && !bebidasOutros.trim()) errors.push("Por favor, especifique qual outra bebida você gostaria de incluir.");
      if (selectedEntretenimento.length < 2 || selectedEntretenimento.length > 5) errors.push("Selecione de 2 a 5 entretenimentos favoritios.");
      if (selectedEntretenimento.includes("Outros") && !entretenimentoOutros.trim()) errors.push("Por favor, especifique qual outro entretenimento você gostaria de incluir.");
      if (selectedLazer.length < 5 || selectedLazer.length > 10) errors.push("Selecione de 5 a 10 atividades de lazer.");
      if (selectedLazer.includes("Outros") && !lazerOutros.trim()) errors.push("Por favor, especifique qual outro lazer ou esporte você gostaria de incluir.");
      if (selectedMomentos.length < 3 || selectedMomentos.length > 5) errors.push("Selecione de 3 a 5 momentos/pessoas inesquecíveis.");
      if (selectedMomentos.includes("Outros") && !momentosOutros.trim()) errors.push("Por favor, especifique qual outro momento ou pessoa marcante você gostaria de incluir.");
      if (selectedDiversos.length < 2 || selectedDiversos.length > 5) errors.push("Selecione de 2 a 5 diversos.");
      if (selectedDiversos.includes("Outros") && !diversosOutros.trim()) errors.push("Por favor, especifique qual outro item diverso você gostaria de incluir.");
    } else if (product?.customizable) {
      if (product.hasNameAndSurname || product.hasNameAndSurnameSemAoVivo) {
        if (!customName.trim()) errors.push("Por favor, preencha o campo de Nome.");
        if (!customSurname.trim()) errors.push("Por favor, preencha o campo de Sobrenome.");
      } else {
        if (!customName.trim()) errors.push("Por favor, preencha o campo de Nome Completo.");
      }
    }

    // Caricature validation applies to all customizable products if hasCaricatura is toggled
    if (hasCaricatura) {
      if (!caricaturaFile) {
        errors.push("Por favor, faça o upload da primeira foto para a caricatura.");
      }
      if (caricaturasQtd === 2 && !caricaturaFile2) {
        errors.push("Por favor, faça o upload da segunda foto para a caricatura.");
      }
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
        fonte: selectedFont,
        elementsStyle,
        comidas: selectedComidas.map(x => {
          const detail = x === 'Outros' ? comidasOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        bebidas: selectedBebidas.map(x => {
          const detail = x === 'Outros' ? bebidasOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        entretenimento: selectedEntretenimento.map(x => {
          const detail = x === 'Outros' ? entretenimentoOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        lazer: selectedLazer.map(x => {
          const detail = x === 'Outros' ? lazerOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        momentos: selectedMomentos.map(x => {
          const detail = x === 'Outros' ? momentosOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        diversos: selectedDiversos.map(x => {
          const detail = x === 'Outros' ? diversosOutros : itemCustomTexts[x];
          return detail?.trim() ? `${x} (${detail.trim()})` : x;
        }).join(', '),
        caricatura: hasCaricatura ? {
          qtd: caricaturasQtd,
          estilo: caricaturaEstilo,
          foto: caricaturaFile,
          foto2: caricaturaFile2
        } : null
      };
    } else if (product?.customizable) {
      customization = {
        tipo: product.category === 'canecas' ? 'caneca' : 'custom',
        nome: customName,
        sobrenome: (product.hasNameAndSurname || product.hasNameAndSurnameSemAoVivo) ? customSurname : '',
        frase: customPhrase,
        fonte: selectedFont,
        caricatura: hasCaricatura ? {
          qtd: caricaturasQtd,
          estilo: caricaturaEstilo,
          foto: caricaturaFile,
          foto2: caricaturaFile2
        } : null
      };
    }

    if (Object.keys(selectedVariations).length > 0) {
      if (!customization) {
        customization = { tipo: 'padrao' };
      }
      customization.variations = selectedVariations;
    }

    if (selectedPayment) {
      if (!customization) {
        customization = { tipo: 'padrao' };
      }
      customization.formaPagamento = selectedPayment.text;
    }

    addItem({
      id: product!.id,
      sku: product!.sku,
      name: product!.name,
      price: selectedPayment ? selectedPayment.price : productFinalPrice,
      imageUrl: product!.imageUrl,
      quantity,
      customization
    });
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-[#4D1D54]">Carregando os mimos da USE GAT...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-brand-gold">Produto não encontrado.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-16">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-black uppercase tracking-widest mb-6 sm:mb-12 hover:text-[#4D1D54] transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Voltar para a loja
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24">
        {/* Left Column: Visual product view */}
        <div className="space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/40 backdrop-blur-md rounded-[24px] sm:rounded-[50px] p-4 sm:p-12 aspect-square flex items-center justify-center shadow-sm border border-brand-pink-medium/30 relative overflow-hidden val-preview-box"
          >
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full h-full flex items-center justify-center garrafa-preview cursor-zoom-in group/preview"
            >
              <img 
                src={product.imageUrl || "/imagens/mugs-boho.jpg"} 
                alt={product.name}
                className="w-full h-full object-contain relative z-10 select-none transition-all duration-300 group-hover/preview:opacity-90"
              />
              
              {/* Lupa / Magnifier Lens Element with Live Cloned HTML Layout */}
              {magnifier.show && (
                <div 
                  style={{
                    position: 'absolute',
                    left: `${magnifier.x - 70}px`,
                    top: `${magnifier.y - 70}px`,
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    border: '4px solid #4D1D54',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 100,
                    backgroundColor: 'white',
                  }}
                  className="pointer-events-none absolute"
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: `${magnifier.width}px`,
                      height: `${magnifier.height}px`,
                      transformOrigin: '0 0',
                      transform: `translate(${70 - magnifier.x * 2.2}px, ${70 - magnifier.y * 2.2}px) scale(2.2)`,
                      pointerEvents: 'none',
                    }}
                    className="flex items-center justify-center select-none"
                  >
                    <img 
                      src={product.imageUrl || "/imagens/mugs-boho.jpg"} 
                      alt={product.name}
                      className="w-full h-full object-contain relative z-10 select-none"
                    />
                    
                    {product.customizable && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none">
                        <div className={cn(
                          "flex flex-col justify-center items-center text-center px-1 overflow-hidden",
                          product.category === 'canecas' 
                            ? "w-[30%] h-[25%] mt-[3%] mr-[10%]" 
                            : "w-[23%] h-[30%] mt-[22%]"
                        )}>
                          <div className="texto-preview select-none overflow-hidden text-ellipsis flex flex-col items-center justify-center w-full">
                            <span 
                              className={cn(
                                "text-center break-all leading-tight transition-all",
                                selectedFont === 'Quicksand'
                                  ? (customName.trim() ? "text-[#3D1A45]/85 font-black uppercase tracking-widest" : "text-[#4D1D54]/25 font-medium italic")
                                  : (customName.trim() ? "text-[#3D1A45]/95 font-medium" : "text-[#4D1D54]/25 font-medium italic")
                              )}
                              style={{ 
                                fontSize: calculateFontSize(customName.trim() || 'Seu Nome', product.category),
                                fontFamily: selectedFont === 'Quicksand' 
                                  ? 'Quicksand, sans-serif' 
                                  : `${selectedFont}, Quicksand, sans-serif`,
                                textShadow: customName.trim() 
                                  ? '1px 1px 1px rgba(255,255,255,0.7), -0.5px -0.5px 0px rgba(0,0,0,0.15)' 
                                  : 'none',
                                letterSpacing: selectedFont === 'Quicksand' ? '0.12em' : 'normal',
                                textTransform: selectedFont === 'Quicksand' ? 'uppercase' : 'none',
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
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
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
                            "text-center break-all leading-tight transition-all",
                            selectedFont === 'Quicksand'
                              ? (customName.trim() ? "text-[#3D1A45]/85 font-black uppercase tracking-widest" : "text-[#4D1D54]/25 font-medium italic")
                              : (customName.trim() ? "text-[#3D1A45]/95 font-medium" : "text-[#4D1D54]/25 font-medium italic")
                          )}
                          style={{ 
                            fontSize: calculateFontSize(customName.trim() || 'Seu Nome', product.category),
                            fontFamily: selectedFont === 'Quicksand' 
                              ? 'Quicksand, sans-serif' 
                              : `${selectedFont}, Quicksand, sans-serif`,
                            textShadow: customName.trim() 
                              ? '1px 1px 1px rgba(255,255,255,0.7), -0.5px -0.5px 0px rgba(0,0,0,0.15)' 
                              : 'none',
                            letterSpacing: selectedFont === 'Quicksand' ? '0.12em' : 'normal',
                            textTransform: selectedFont === 'Quicksand' ? 'uppercase' : 'none',
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
            <button
              type="button"
              id="btn-mais-formas-pagamento"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-[11px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary-light transition-all flex items-center gap-1.5 underline decoration-2 decoration-brand-pink-medium cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-brand-gold" />
              Mais formas de pagamento
            </button>

            {selectedPayment && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center justify-between shadow-sm gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700 block select-none">Opção de Pagamento Selecionada</span>
                    <p className="text-xs font-black text-brand-black">{selectedPayment.text}</p>
                    <span className="text-[9px] text-gray-500 block">Total atualizado no carrinho: {formatPrice(selectedPayment.price)}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(true)} 
                  className="text-gray-400 hover:text-red-500 transition-colors text-xs font-bold underline cursor-pointer"
                >
                  Alterar
                </button>
              </motion.div>
            )}
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
            <div className="bg-[#FAF7F8]/80 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border border-brand-gold/15 space-y-6 sm:space-y-10">
              <h3 className="text-base sm:text-lg font-serif italic font-bold border-b border-brand-gold/10 pb-3 text-[#4D1D54]">
                Responda o nosso Questionário de Criação
              </h3>

              {/* SECTION: Elements style tracker */}
              {product.isSuaHistoria && (
                <div className="space-y-6">
                  {/* Title and subtitle description */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] block">
                      1. Tipo dos Elementos na Garrafa
                    </span>
                    <div className="bg-[#4D1D54]/5 p-4 rounded-xl border border-brand-gold/10 space-y-1">
                      <p className="text-[11.5px] font-black text-[#4D1D54] uppercase tracking-wide">
                        Vamos personalizar a sua garrafa
                      </p>
                      <p className="text-[10px] text-stone-600 font-medium leading-relaxed">
                        Antes de escolhermos os elementos, defina como você deseja que ele seja estampado.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    {/* Option 1: COLORIDO */}
                    <button
                      type="button"
                      onClick={() => setElementsStyle('colorido')}
                      className={`p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 text-center space-y-2 sm:space-y-4 transition-all relative cursor-pointer flex flex-col items-center justify-between h-full ${
                        elementsStyle === 'colorido'
                          ? 'border-[#4D1D54] bg-[#4D1D54]/5 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-brand-gold/30 hover:shadow-sm'
                      }`}
                    >
                      {/* Selection indicator checkmark */}
                      <div className="absolute top-2 sm:top-3 right-3 sm:right-4">
                        {elementsStyle === 'colorido' ? (
                          <div className="w-5 h-5 bg-[#4D1D54] rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">✓</div>
                        ) : (
                          <div className="w-5 h-5 border border-stone-200 bg-white rounded-full" />
                        )}
                      </div>

                      {/* Image container mimicking prompt screenshot layout */}
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#4D1D54] flex items-center justify-center p-2 sm:p-3.5 shadow-sm mt-3">
                        <img 
                          src="/imagens/elementos-coloridos.svg" 
                          alt="Elementos Coloridos" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center space-y-1 sm:space-y-1.5 w-full">
                        <h4 className="font-black text-[9px] sm:text-[11px] uppercase tracking-wider text-brand-black">ELEMENTOS COLORIDOS</h4>
                        <div className="space-y-1">
                          <p className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-medium leading-normal">Cores vibrantes, dando destaque à garrafa.</p>
                          <span className="inline-block text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-[#4D1D54] bg-brand-pink-medium/40 px-2 sm:px-2.5 py-0.5 rounded-full">
                            (Mais escolhido)
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Option 2: PRETO E BRANCO */}
                    <button
                      type="button"
                      onClick={() => setElementsStyle('preto')}
                      className={`p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 text-center space-y-2 sm:space-y-4 transition-all relative cursor-pointer flex flex-col items-center justify-between h-full ${
                        elementsStyle === 'preto'
                          ? 'border-[#4D1D54] bg-[#4D1D54]/5 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-brand-gold/30 hover:shadow-sm'
                      }`}
                    >
                      {/* Selection indicator checkmark */}
                      <div className="absolute top-2 sm:top-3 right-3 sm:right-4">
                        {elementsStyle === 'preto' ? (
                          <div className="w-5 h-5 bg-[#4D1D54] rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">✓</div>
                        ) : (
                          <div className="w-5 h-5 border border-stone-200 bg-white rounded-full" />
                        )}
                      </div>

                      {/* Image container mimicking prompt screenshot layout */}
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white border border-stone-100 flex items-center justify-center p-2 sm:p-3.5 shadow-xs mt-3 text-brand-black">
                        <img 
                          src="/imagens/elementos-linhas.svg" 
                          alt="Em Linhas" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center space-y-1 sm:space-y-1.5 w-full">
                        <h4 className="font-black text-[9px] sm:text-[11px] uppercase tracking-wider text-brand-black">EM LINHAS</h4>
                        <p className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-medium leading-normal">Sem destaque, sutil e minimalista.</p>
                      </div>
                    </button>
                  </div>

                  {/* Informative advice note regarding black or white strokes */}
                  <div className="bg-[#FAF7F8]/60 p-4 rounded-2xl border border-[#4D1D54]/5 text-center text-[10.5px] text-stone-600 font-medium space-y-1.5">
                    <p>💡 <span className="font-bold text-[#4D1D54]">Em garrafas brancas</span>, as linhas serão na cor preta.</p>
                    <p>💡 <span className="font-bold text-[#4D1D54]">Em garrafas escuras</span>, as linhas serão na cor branca.</p>
                  </div>
                </div>
              )}

              {/* Basic custom texts (Applies to all customizable items) */}
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] block mb-2">
                  {product.isSuaHistoria ? '2. Identificação Principal' : '2. Detalhes da Customização'}
                </span>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10.5px] font-bold text-gray-600 block uppercase tracking-wide">Informe os Nomes/Frases (uma por linha usando Enter)</label>
                      <span className="text-[10px] text-gray-400 font-bold bg-[#FAF7F8] px-2 py-0.5 rounded border border-stone-100">
                        {customName.length}/500 carac.
                      </span>
                    </div>
                    <textarea 
                      id="nomePersonalizado"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, 500))}
                      maxLength={500}
                      rows={5}
                      placeholder='Ex:&#10;Copo 1: Andreza / "Seja forte..."&#10;Copo 2: Claudia / "Seja corajosa!"&#10;Copo 3: Luana / "Linda de si"'
                      className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm resize-y whitespace-pre-wrap"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-gray-600 block mb-1.5 uppercase tracking-wide">Pequena frase ou data especial (Opcional)</label>
                    <input 
                      type="text" 
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      placeholder="Ex: Desde 2023 ou Viva com Leveza"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all"
                    />
                  </div>

                  {/* Font Selection */}
                  <div className="pt-2">
                    <label className="text-[10.5px] font-bold text-gray-600 block mb-3 uppercase tracking-wide">📐 Escolha o Estilo de Fonte da Letra</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableFonts.map((font) => {
                        const isActive = selectedFont === font.family;
                        return (
                          <button
                            key={font.family}
                            type="button"
                            onClick={() => setSelectedFont(font.family)}
                            className={cn(
                              "relative px-4 py-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col justify-center items-center select-none shadow-sm gap-1.5",
                              isActive
                                ? "border-[#4D1D54] bg-[#4D1D54] text-white ring-1 ring-[#4D1D54] shadow-md transform scale-[1.02]"
                                : "border-gray-200 bg-white text-brand-black hover:border-brand-gold/40 hover:bg-stone-50"
                            )}
                          >
                            <span 
                              className="text-3xl font-normal block tracking-normal h-12 flex items-center justify-center overflow-visible w-full py-1"
                              style={{ 
                                fontFamily: font.family === 'Quicksand' ? 'Quicksand, sans-serif' : `${font.family}, Quicksand, sans-serif`,
                                textTransform: font.family === 'Quicksand' ? 'uppercase' : 'none'
                              }}
                            >
                              Amor
                            </span>
                            <span className={cn(
                              "text-[9px] font-black tracking-wider uppercase",
                              isActive ? "text-white/80" : "text-gray-400"
                            )}>
                              {font.name}
                            </span>
                            {isActive && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-white text-[#4D1D54] rounded-full flex items-center justify-center text-[9px] font-black shadow-sm">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedComidas.filter(x => x !== 'Outros' && (x === 'Legumes Favoritos' || x === 'Frutas Favoritas')).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedComidas.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={comidasOutros}
                          onChange={(e) => setComidasOutros(e.target.value)}
                          placeholder="Quais outras comidas você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedBebidas.filter(x => x !== 'Outros' && false).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedBebidas.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={bebidasOutros}
                          onChange={(e) => setBebidasOutros(e.target.value)}
                          placeholder="Quais outras bebidas você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedEntretenimento.filter(x => x !== 'Outros' && false).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedEntretenimento.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={entretenimentoOutros}
                          onChange={(e) => setEntretenimentoOutros(e.target.value)}
                          placeholder="Quais outros entretenimentos você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedLazer.filter(x => x !== 'Outros' && false).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedLazer.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={lazerOutros}
                          onChange={(e) => setLazerOutros(e.target.value)}
                          placeholder="Quais outros lazeres ou esportes você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedMomentos.filter(x => x !== 'Outros' && (x === 'Data do Casamento' || x === 'Data do Aniversário' || x === 'Filhos' || x === 'Nome Especial')).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedMomentos.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={momentosOutros}
                          onChange={(e) => setMomentosOutros(e.target.value)}
                          placeholder="Quais outros momentos ou pessoas queridas você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
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
                    <div className="space-y-2 mt-2">
                      <AnimatePresence>
                        {selectedDiversos.filter(x => x !== 'Outros' && (x === 'Profissão' || x === 'Time de Futebol' || x === 'Religião' || x === 'Animais de Estimação')).map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-3 border-l-2 border-brand-gold/50 py-1"
                          >
                            <label className="text-[10px] font-black uppercase text-brand-gold tracking-wider block mb-1">✍ Detalhes para "{item}"</label>
                            <input
                              type="text"
                              value={itemCustomTexts[item] || ''}
                              onChange={(e) => setItemCustomTexts(prev => ({ ...prev, [item]: e.target.value }))}
                              placeholder={`Especificações de preferência para ${item}...`}
                              className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {selectedDiversos.includes("Outros") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          value={diversosOutros}
                          onChange={(e) => setDiversosOutros(e.target.value)}
                          placeholder="Quais outros itens diversos você gostaria de incluir? Escreva aqui..."
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-[#4D1D54] transition-all shadow-sm"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* SEÇÃO CARICATURA (OPCIONAL) */}
              {(product.allowsCaricatura || product.category === 'canecas' || product.subcategory?.toUpperCase().includes('CARICATURA') || product.category === 'copos') && (
                <div className="pt-8 border-t border-brand-gold/10 mt-6 space-y-6">
                <div className="flex justify-center">
                  <span className="bg-[#4D1D54] text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-md">
                    🎨 CARICATURA (opcional)
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Deseja adicionar uma caricatura?
                  </p>
                  <p className="text-stone-500 text-[10.5px] leading-relaxed max-w-sm mx-auto">
                    Faça o upload da foto de uma pessoa ou pet que transformamos para você.
                  </p>
                  <div className="inline-block bg-brand-gold/10 text-[#8C6A3B] px-3 py-1 rounded-full text-xs font-black mt-1">
                    💰 {hasCaricatura ? (caricaturasQtd === 2 ? formatPrice(price2images) : formatPrice(price1image)) : `A partir de ${formatPrice(price1image)}`}
                  </div>
                </div>

                {/* Radio Options: Sim/Não */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasCaricatura(false);
                    }}
                    className={cn(
                      "px-4 py-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all border cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-sm",
                      !hasCaricatura
                        ? "bg-[#4D1D54] text-white border-[#4D1D54] shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-brand-gold/30"
                    )}
                  >
                    <span>❌</span>
                    <span>Não Adicionar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasCaricatura(true);
                      setCaricaturasQtd(1);
                    }}
                    className={cn(
                      "px-4 py-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all border cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-sm",
                      hasCaricatura && caricaturasQtd === 1
                        ? "bg-[#4D1D54] text-white border-[#4D1D54] shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-brand-gold/30"
                    )}
                  >
                    <span>🕵️‍♂️ 1 IMAGEM</span>
                    <span className="text-[9.5px] opacity-90">{formatPrice(price1image)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasCaricatura(true);
                      setCaricaturasQtd(2);
                    }}
                    className={cn(
                      "px-4 py-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all border cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-sm",
                      hasCaricatura && caricaturasQtd === 2
                        ? "bg-[#4D1D54] text-white border-[#4D1D54] shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-brand-gold/30"
                    )}
                  >
                    <span>🕵️‍♀️ 2 IMAGENS</span>
                    <span className="text-[9.5px] opacity-90">{formatPrice(price2images)}</span>
                  </button>
                </div>

                {hasCaricatura && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-4 border-t border-dashed border-brand-gold/15"
                  >
                    {/* Estilo Options */}
                    <div className="space-y-3">
                      <div className="flex justify-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] bg-[#FAF7F8] px-4 py-1.5 rounded-full border border-brand-gold/15 shadow-xs text-center">
                          Escolha um estilo clicando em uma das opções abaixo:
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Realista', 'Desenho Cartoon', 'Charge', 'Flat'].map((style) => {
                          const isStyleSelected = caricaturaEstilo === style;
                          return (
                            <button
                              key={style}
                              type="button"
                              onClick={() => setCaricaturaEstilo(style)}
                              className={cn(
                                "py-3 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer shadow-xs",
                                isStyleSelected
                                  ? "bg-brand-gold text-white border-brand-gold shadow"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-brand-gold/20"
                              )}
                            >
                              🔘 {style}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explaining Image Card */}
                    <div className="bg-white p-4 rounded-2xl border border-brand-gold/15 shadow-sm space-y-4">
                      <div className="text-center font-black text-[10px] uppercase tracking-widest text-[#8C6A3B]">
                        Guia de Estilos Ilustrativo
                      </div>
                      
                      {globalSettings?.caricatura_explaining_image ? (
                        <div className="rounded-xl overflow-hidden border border-gray-100 flex justify-center bg-stone-50">
                          <img
                            src={globalSettings.caricatura_explaining_image}
                            alt="Estilos de Caricatura"
                            className="max-h-96 object-contain w-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        /* Premium fallback illustrative boxes styled like a magazine */
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-[#FAF7F8] rounded-xl border border-stone-100 text-center space-y-1.5">
                            <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mx-auto flex items-center justify-center text-lg">👩‍🎨</div>
                            <h5 className="font-black text-[10px] uppercase text-[#4D1D54]">Realista</h5>
                            <p className="text-[9.5px] text-gray-500 leading-normal font-medium">Traços suaves e detalhados, mantendo a aparência natural com um toque artístico.</p>
                          </div>
                          <div className="p-3 bg-[#FAF7F8] rounded-xl border border-stone-100 text-center space-y-1.5">
                            <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mx-auto flex items-center justify-center text-lg">🌸</div>
                            <h5 className="font-black text-[10px] uppercase text-[#4D1D54]">Desenho Cartoon</h5>
                            <p className="text-[9.5px] text-gray-500 leading-normal font-medium">Visual divertido, colorido e inspirado em desenhos animados modernos.</p>
                          </div>
                          <div className="p-3 bg-[#FAF7F8] rounded-xl border border-stone-100 text-center space-y-1.5">
                            <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mx-auto flex items-center justify-center text-lg">🎭</div>
                            <h5 className="font-black text-[10px] uppercase text-[#4D1D54]">Charge</h5>
                            <p className="text-[9.5px] text-gray-500 leading-normal font-medium">Estilo humorístico com expressões e características do rosto mais exageradas.</p>
                          </div>
                          <div className="p-3 bg-[#FAF7F8] rounded-xl border border-stone-100 text-center space-y-1.5">
                            <div className="w-12 h-12 rounded-full bg-[#4D1D54]/5 text-[#4D1D54] mx-auto flex items-center justify-center text-lg">🐈</div>
                            <h5 className="font-black text-[10px] uppercase text-[#4D1D54]">Flat</h5>
                            <p className="text-[9.5px] text-gray-500 leading-normal font-medium">Arte minimalista, com cores chapadas, sem contornos faciais, romântica e elegante.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Upload Files inputs */}
                    <div className="space-y-4">
                      {/* FILE 1 */}
                      <div className="bg-[#FAF7F8]/40 p-4 rounded-2xl border border-brand-gold/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-black uppercase text-[#8C6A3B] block">Foto da Caricatura 01</label>
                          <p className="text-[9.5px] text-gray-400 font-medium">Faça o upload da foto do rosto do primeiro personagem ou pet.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="bg-brand-primary text-white hover:opacity-90 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0">
                            UPLOAD
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          {caricaturaFile ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[9.5px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 border border-green-100">
                                ENVIADO ✓
                              </span>
                              <button
                                type="button"
                                onClick={() => setCaricaturaFile(null)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold font-mono transition-colors"
                                title="Remover"
                              >
                                [x]
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9.5px] text-[#4D1D54] font-bold bg-[#FAF7F8] px-2.5 py-1 rounded border border-brand-pink-light">
                              PENDENTE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* FILE 2 (Only if 2 caricatures selected) */}
                      {caricaturasQtd === 2 && (
                        <div className="bg-[#FAF7F8]/40 p-4 rounded-2xl border border-brand-gold/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-black uppercase text-[#8C6A3B] block">Foto da Caricatura 02</label>
                            <p className="text-[9.5px] text-gray-400 font-medium">Faça o upload da foto do rosto do segundo personagem ou pet.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="bg-brand-primary text-white hover:opacity-90 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0">
                              UPLOAD
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload2}
                                className="hidden"
                              />
                            </label>
                            {caricaturaFile2 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[9.5px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 border border-green-100">
                                  ENVIADO ✓
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCaricaturaFile2(null)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold font-mono transition-colors"
                                  title="Remover"
                                >
                                  [x]
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9.5px] text-[#4D1D54] font-bold bg-[#FAF7F8] px-2.5 py-1 rounded border border-brand-pink-light">
                                PENDENTE
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Previews of uploaded images */}
                    {(caricaturaFile || caricaturaFile2) && (
                      <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                        {caricaturaFile && (
                          <div className="text-center space-y-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Foto 1</span>
                            <div className="h-28 w-full rounded-lg overflow-hidden border border-zinc-200 bg-white p-1 flex items-center justify-center shadow-xs">
                              <img src={caricaturaFile} alt="Preview 1" className="max-h-full max-w-full object-contain rounded animate-fade-in" />
                            </div>
                          </div>
                        )}
                        {caricaturaFile2 && (
                          <div className="text-center space-y-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Foto 2</span>
                            <div className="h-28 w-full rounded-lg overflow-hidden border border-zinc-200 bg-white p-1 flex items-center justify-center shadow-xs">
                              <img src={caricaturaFile2} alt="Preview 2" className="max-h-full max-w-full object-contain rounded animate-fade-in" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Observações Section */}
                    <div className="p-4 bg-brand-pink-medium/30 rounded-2xl border border-brand-primary/10 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#4D1D54] flex items-center gap-1.5">
                        ⚠️ Observação importante:
                      </span>
                      <ul className="text-[10px] text-stone-600 font-medium space-y-1 pl-4 list-disc leading-relaxed">
                        <li>Não alteramos cor de roupa, cor de cabelo, corpo, pose, postura ou realizamos reconstrução da imagem.</li>
                        <li>A caricatura é feita exatamente como na foto enviada.</li>
                        <li>Por isso, envie uma imagem com boa qualidade, sem objetos cobrindo o rosto e sem cortes na foto.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </div>
              )}
            </div>
          ) : null}

          {/* Dynamic Product Variations Section */}
          {variationsList.length > 0 && (
            <div className="bg-[#FAF7F8]/80 backdrop-blur-sm p-6 rounded-[2rem] border border-brand-pink-medium/20 space-y-6">
              <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest border-b border-brand-pink-medium/10 pb-2">📂 Opções Disponíveis</h4>
              <div className="space-y-4">
                {variationsList.map((variation) => (
                  <div key={variation.id} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8C6A3B] block">
                      {variation.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(variation.options || []).map((option: string) => {
                        const isSelected = selectedVariations[variation.name] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSelectedVariations(prev => ({
                              ...prev,
                              [variation.name]: option
                            }))}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                              isSelected
                                ? "bg-[#4D1D54] text-white border-[#4D1D54] shadow-md scale-[1.02]"
                                : "bg-white text-gray-700 border-gray-200 hover:border-[#4D1D54]/30"
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core buying container - Quantities and Add to Cart */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center border border-brand-pink-medium rounded-full overflow-hidden h-14 w-full sm:w-40 bg-[#FAF7F8]/80 backdrop-blur-sm shadow-inner">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product?.stock !== undefined && product.stock <= 0}
                  className="flex-grow font-black text-xl hover:bg-brand-pink-medium text-brand-primary disabled:opacity-40"
                >
                  -
                </button>
                <span className="font-bold text-sm w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product?.stock !== undefined && product.stock <= 0}
                  className="flex-grow font-black text-xl hover:bg-brand-pink-medium text-brand-primary disabled:opacity-40"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={product?.stock !== undefined && product.stock <= 0}
                className="flex-grow bg-brand-primary text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-primary-light hover:scale-105 active:scale-95 transition-all shadow-xl disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:scale-100 disabled:shadow-none"
              >
                <ShoppingBag className="w-5 h-5" />
                {product?.stock !== undefined && product.stock <= 0 ? "Esgotado / Sem Estoque" : "Adicionar ao Carrinho"}
              </button>
            </div>
          </div>

          {/* Shipping Calculator Block */}
          <div className="mt-8 pt-8 border-t border-brand-pink-medium/20 space-y-4">
            <div className="flex items-center gap-2 text-[#4D1D54]">
              <Truck className="w-5 h-5 animate-pulse" />
              <h4 className="font-serif italic font-black text-lg">Calcular Frete</h4>
            </div>
            
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest leading-normal">
              Insira o seu CEP para calcular o prazo e valor de entrega estimado para sua região:
            </p>

            <form onSubmit={handleCalculateShipping} className="flex gap-2">
              <input
                type="text"
                placeholder="DIGITE SEU CEP (Ex: 01311-200)"
                maxLength={9}
                value={cep}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 5) {
                    val = `${val.slice(0, 5)}-${val.slice(5, 8)}`;
                  }
                  setCep(val);
                }}
                className="flex-grow bg-[#FAF7F8]/80 border border-brand-pink-medium/20 rounded-2xl px-4 py-3 placeholder-[#4D1D54]/30 text-xs font-black uppercase tracking-widest text-[#4D1D54] outline-none focus:border-[#4D1D54] focus:bg-white transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={shippingLoading}
                className="bg-[#4D1D54] hover:bg-[#6c2877] text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50 shrink-0"
              >
                {shippingLoading ? '...' : 'CALCULAR'}
              </button>
            </form>

            {shippingError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-2xl text-[11px] font-bold uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{shippingError}</span>
              </div>
            )}

            {shippingResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FAF7F8]/90 border border-brand-pink-medium/10 rounded-2xl p-4 space-y-2.5 shadow-sm"
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black text-[#8C6A3B] uppercase tracking-wider">Valor do Frete:</span>
                  <span className="text-lg font-black text-[#4D1D54]">{shippingResult.cost === 0 ? 'Grátis!' : formatPrice(shippingResult.cost)}</span>
                </div>
                
                {shippingResult.address && (
                  <div className="text-[11px] text-stone-600 leading-normal font-medium border-t border-dashed border-stone-200/60 pt-2 space-y-0.5">
                    <p className="font-extrabold text-[#4D1D54] uppercase tracking-wide text-[9px] mb-1">📍 Endereço de Entrega:</p>
                    {shippingResult.address.rua && <p>{shippingResult.address.rua}</p>}
                    <p>
                      {shippingResult.address.bairro && `${shippingResult.address.bairro} - `}
                      {shippingResult.address.cidade} / {shippingResult.address.estado}
                    </p>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      <span>✓ Prazo de produção: 5 a 7 dias úteis + envio</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Infográfico: Como pedir mais de um item */}
          <div className="mt-8 pt-8 border-t border-brand-pink-medium/20 space-y-6">
            <div className="bg-[#FAF7F8]/90 border border-brand-pink-medium/25 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink-medium/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6A3B] block">Dicas de Personalização</span>
                <h4 className="text-xl font-serif font-black text-[#4D1D54] italic leading-tight">
                  Deseja mais de um item do mesmo modelo?
                </h4>
                <p className="text-[11px] font-medium text-stone-600 leading-relaxed max-w-md mx-auto">
                  O campo de personalização deve ser preenchido apenas uma vez. Caso queira mais de um item do mesmo modelo, deixamos a sugestão abaixo :)
                </p>
              </div>

              {/* Step 1 & Step 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Passo 1 Card */}
                <div className="bg-white rounded-3xl p-5 border border-brand-pink-medium/10 space-y-3 relative shadow-inner">
                  <div className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-[#8C6A3B] text-white flex items-center justify-center font-black text-xs shadow-md">
                    1
                  </div>
                  <h5 className="text-[11px] font-black uppercase text-[#8C6A3B] pl-4">Adicione a quantidade desejada</h5>
                  <p className="text-[10px] text-stone-500 font-medium leading-normal">
                    Selecione no contador a quantidade total de mimos correspondente.
                  </p>
                  
                  {/* Visual Simulation of the counter */}
                  <div className="flex justify-center pt-2">
                    <div className="flex items-center gap-4 bg-[#FAF7F8] px-4 py-1.5 rounded-full border border-stone-200 select-none">
                      <span className="text-stone-400 font-mono text-xs">-</span>
                      <span className="font-serif italic font-black text-stone-900 text-sm">3</span>
                      <span className="text-stone-400 font-mono text-xs">+</span>
                    </div>
                  </div>
                </div>

                {/* Passo 2 Card */}
                <div className="bg-white rounded-3xl p-5 border border-brand-pink-medium/10 space-y-3 relative shadow-inner">
                  <div className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-[#8C6A3B] text-white flex items-center justify-center font-black text-xs shadow-md">
                    2
                  </div>
                  <h5 className="text-[11px] font-black uppercase text-[#8C6A3B] pl-4">Informe os nomes/frases</h5>
                  <p className="text-[10px] text-stone-500 font-medium leading-normal">
                    Separe no campo de texto de acordo com cada item de sua preferência.
                  </p>
                  
                  {/* Simulated Form Field */}
                  <div className="bg-[#FAF7F8] p-3 rounded-2xl border border-dashed border-brand-pink-medium/30 text-[9px] font-mono text-stone-500 leading-tight">
                    <p className="font-bold text-[#4D1D54] mb-1 text-[10px]">Frente e Verso:</p>
                    <p><span className="font-extrabold text-stone-700">Copo 1:</span> Andreza / "Seja forte..."</p>
                    <p><span className="font-extrabold text-stone-700">Copo 2:</span> Claudia / "Seja corajosa!"</p>
                    <p><span className="font-extrabold text-stone-700">Copo 3:</span> Luana / "Linda de si"</p>
                  </div>
                </div>

              </div>

              {/* Step 3 & Step 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Passo 3 Card */}
                <div className="bg-white rounded-3xl p-5 border border-brand-pink-medium/10 space-y-3 relative shadow-inner">
                  <div className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-[#8C6A3B] text-white flex items-center justify-center font-black text-xs shadow-md">
                    3
                  </div>
                  <h5 className="text-[11px] font-black uppercase text-[#8C6A3B] pl-4">Adicione à sacola</h5>
                  <p className="text-[10px] text-stone-500 font-medium leading-normal">
                    Envie todos os mimos personalizados juntos para a sua sacola de uma só vez!
                  </p>
                  
                  {/* Simulated Button Action */}
                  <div className="flex justify-center pt-2">
                    <div className="bg-[#B48A4E] text-white rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 select-none">
                      <ShoppingBag className="w-3 h-3" />
                      Adicionar ao carrinho
                    </div>
                  </div>
                </div>

                {/* Passo 4 Card */}
                <div className="bg-white rounded-3xl p-5 border border-brand-pink-medium/10 space-y-3 relative shadow-inner">
                  <div className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-[#8C6A3B] text-white flex items-center justify-center font-black text-xs shadow-md">
                    4
                  </div>
                  <h5 className="text-[11px] font-black uppercase text-[#8C6A3B] pl-4">Confirme e Finalize</h5>
                  <p className="text-[10px] text-stone-500 font-medium leading-normal">
                    Confira atenciosamente os mimos no carrinho antes de ir ao pagamento.
                  </p>
                  
                  {/* Simulated Cart Item */}
                  <div className="bg-[#FAF7F8] p-3 rounded-2xl border border-stone-100 text-[9px] leading-tight space-y-1">
                    <p className="font-bold text-stone-700 truncate">Garrafa Térmica Classic Amplo Vácuo</p>
                    <div className="flex justify-between font-mono text-[8px] text-stone-400">
                      <span>Quantidade: 3</span>
                      <span className="font-extrabold text-[#4D1D54]">R$ 417,00</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Heart and End Line */}
              <div className="pt-4 border-t border-brand-pink-medium/15 text-center flex flex-col items-center gap-1">
                <p className="font-serif italic font-bold text-xs text-[#4D1D54] uppercase tracking-wide">
                  Tudo será feito com muito amor!
                </p>
                <div className="flex gap-2 text-red-500 text-xs mt-1">
                  <span>♥️</span>
                  <span>♥️</span>
                  <span>♥️</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 5. Payment Methods Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
            {/* Backdrop wrapper */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg bg-[#FAF7F8] rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-[#B48A4E]/20 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Header */}
              <div className="bg-[#4D1D54] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-brand-gold" />
                  <div>
                    <h3 className="font-serif font-black text-lg tracking-wide">Formas de Pagamento</h3>
                    <p className="text-[10px] text-brand-pink-light/85 font-mono uppercase tracking-widest">{product.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Panel */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Pix Highlight banner (Selectable Button) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment({
                      method: 'pix',
                      installments: 1,
                      text: `Pix à Vista (10% de Desconto)`,
                      price: productFinalPrice * 0.90
                    });
                    setIsPaymentModalOpen(false);
                  }}
                  className={cn(
                    "w-full text-left bg-gradient-to-r from-[#FAF5EF] to-white border-2 p-5 rounded-2xl relative overflow-hidden transition-all hover:shadow-md cursor-pointer block",
                    selectedPayment?.method === 'pix'
                      ? "border-green-600 ring-2 ring-green-600/30"
                      : "border-[#B48A4E]/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#B48A4E]/10 rounded-xl flex items-center justify-center text-[#8C6A3B] shrink-0 border border-[#B48A4E]/20">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FAF7F8] bg-[#B48A4E] px-2 py-0.5 rounded-full font-mono">
                          10% de DESCONTO
                        </span>
                        {selectedPayment?.method === 'pix' && (
                          <span className="text-[9px] font-black uppercase bg-green-600 text-white px-2 py-0.5 rounded-full select-none">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-black text-lg text-brand-black">Pagar via PIX</h4>
                      <p className="text-2xl font-serif font-black text-[#8C6A3B]">
                        {formatPrice(productFinalPrice * 0.90)}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Aprovação instantânea e seu pedido já vai direto para o setor de produção e design.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Credit Card installment breakdown */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] border-b border-brand-pink-medium/20 pb-2">
                    💳 Parcelamento no Cartão de Crédito
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold font-sans">
                    {/* Render standard 12 installments as individual checkout selectors */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const num = i + 1;
                      const isNoInterest = num <= 3;
                      let installmentPrice = productFinalPrice / num;
                      
                      // if over 3 interest free, apply standard credit card slight compound interest rate
                      if (!isNoInterest) {
                        const interestRate = 1 + (num * 0.015);
                        installmentPrice = (productFinalPrice * interestRate) / num;
                      }

                      const isSelected = selectedPayment?.method === 'cartao' && selectedPayment?.installments === num;

                      return (
                        <button
                          type="button"
                          key={num}
                          onClick={() => {
                            setSelectedPayment({
                              method: 'cartao',
                              installments: num,
                              text: `${num}x de ${formatPrice(installmentPrice)} ${isNoInterest ? 'sem juros' : 'no cartão'} (${formatPrice(installmentPrice * num)} total)`,
                              price: installmentPrice * num
                            });
                            setIsPaymentModalOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all text-left w-full hover:shadow-sm cursor-pointer",
                            isSelected
                              ? "bg-white border-green-600 ring-2 ring-green-600/35 text-brand-black shadow-md"
                              : isNoInterest
                                ? "bg-white border-brand-pink-medium/30 text-brand-black shadow-none"
                                : "bg-[#FAF7F8]/50 border-stone-150 text-gray-600"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-extrabold">{num}x de</span>
                            <span className="text-xs text-brand-gray font-mono font-medium">{formatPrice(installmentPrice)}</span>
                          </div>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                            isSelected
                              ? "bg-green-600 text-white"
                              : isNoInterest
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : "bg-stone-100 text-stone-500"
                          )}>
                            {isSelected ? 'Selecionado ✓' : isNoInterest ? 'Sem Juros' : 'c/ Juros'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Safe info note */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-[10px] text-gray-500 font-medium leading-relaxed">
                  🔒 <strong className="text-brand-black">Compra 100% Protegida:</strong> Utilizamos criptografia SSL de ponta a ponta. Sua compra conta com garantia de entrega total e suporte personalizado por WhatsApp de segunda a sábado.
                </div>

              </div>

              {/* Footer action */}
              <div className="bg-white p-5 border-t border-brand-pink-medium/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="bg-[#4D1D54] hover:bg-[#6c2877] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer"
                >
                  Fechar janela
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
