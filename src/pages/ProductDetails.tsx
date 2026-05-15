import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice } from '@/src/lib/utils';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

function CustomField({ label, hint, value, onChange }: { label: string, hint: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary block mb-2">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all"
      />
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customFields, setCustomFields] = useState({
    nome: '',
    sobrenome: '',
    frase: '',
    foto1: '',
    foto2: '',
    textoAtacado: '',
    elementosEstilo: 'colorido',
    comidas: '',
    bebidas: '',
    entretenimento: '',
    lazer: '',
    momentos: '',
    diversos: '',
    caricaturaEstilo: 'colorido',
    caricaturasQtd: '0'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'foto1' | 'foto2') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomFields(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'products', id), (docSnap) => {
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching product:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-brand-pink-strong">Carregando mimos...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-serif italic text-3xl text-brand-gold">Mimo não encontrado.</div>;

  const isBottle = product.category === 'garrafas-termicas' || product.category === 'garrafas';
  const isMug = product.category === 'canecas';
  const isAtacado = product.category === 'atacado';
  const isMeuJeito = product.subcategory?.toUpperCase() === 'MEU JEITO';
  const isCaricaturaLogo = product.name?.toLowerCase().includes('caricatura + logo');
  
  const forceSuaHistoria = product.isSuaHistoria || isMeuJeito;
  const isProfessionalBottle = product.category === 'garrafas-termicas' && !isMeuJeito;
  const isThermalBottle = product.category === 'garrafas-termicas';
  
  const handleAddToCart = () => {
    let customization: any = undefined;

    if (product.customizable) {
      if (forceSuaHistoria) {
        customization = {
          tipo: 'sua-historia',
          nome: customFields.nome,
          sobrenome: customFields.sobrenome,
          estilo: customFields.elementosEstilo,
          comidas: customFields.comidas,
          bebidas: customFields.bebidas,
          entretenimento: customFields.entretenimento,
          lazer: customFields.lazer,
          momentos: customFields.momentos,
          diversos: customFields.diversos,
          caricatura: customFields.caricaturasQtd !== '0' ? {
            qtd: customFields.caricaturasQtd,
            estilo: customFields.caricaturaEstilo
          } : null
        };
      } else if (isThermalBottle) {
        customization = {
          tipo: 'garrafa-termica',
          nome: customFields.nome,
          sobrenomeOuFrase: customFields.sobrenome
        };
      } else if (isProfessionalBottle) {
        customization = {
          tipo: 'garrafa-profissional',
          nome: customFields.nome
        };
      } else if (isMug) {
        customization = {
          tipo: 'caneca',
          nome: customFields.nome,
          frase: customFields.frase,
          foto: customFields.foto1
        };
      } else if (isAtacado) {
        customization = {
          tipo: 'atacado',
          texto: customFields.textoAtacado,
          foto1: customFields.foto1,
          foto2: isCaricaturaLogo ? customFields.foto2 : null
        };
      }
    }

    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customization
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-[10px] font-black uppercase tracking-widest mb-12 hover:text-brand-primary transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Voltar para a loja
      </button>

      <div className={`grid grid-cols-1 ${(isBottle || isMug || isAtacado || isMeuJeito) ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-16 lg:gap-24`}>
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-md rounded-[60px] p-8 aspect-square flex items-center justify-center shadow-sm border border-brand-pink-light/30 relative overflow-hidden"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain relative z-10"
          />
        </motion.div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <span className="text-brand-primary font-handwriting text-2xl mb-4 block italic">
            {product.category} {product.subcategory && `• ${product.subcategory}`}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-black mb-6 leading-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-6 mb-8">
            <span className="text-4xl font-serif font-black text-brand-primary">{formatPrice(product.price)}</span>
            <div className="bg-brand-primary/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-primary">
              Em até 3x s/ juros
            </div>
          </div>

          <p className="text-sm text-brand-gray font-medium mb-12 leading-relaxed italic">
            {product.description || 'Este item exclusivo faz parte da nossa nova coleção. Criado com materiais de alta qualidade para garantir durabilidade e estilo.'}
          </p>

          {product.detailedDescription && (
            <div className="mb-12 p-6 bg-white/30 backdrop-blur-sm rounded-3xl border border-brand-pink-light/30">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Sobre o Produto</h4>
               <div 
                 className="text-xs text-brand-gray leading-loose prose-img:rounded-2xl prose-img:shadow-md prose-img:my-6 prose-img:mx-auto prose-img:block" 
                 dangerouslySetInnerHTML={{ __html: product.detailedDescription.replace(/\n/g, '<br/>') }} 
               />
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
              <div className="flex items-center border border-brand-pink-light/30 rounded-full overflow-hidden h-14 w-full sm:w-40 bg-white/60 backdrop-blur-sm">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 font-black text-xl hover:bg-brand-pink-light transition-colors text-brand-primary"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 font-black text-xl hover:bg-brand-pink-light transition-colors text-brand-primary"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-brand-primary text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-12">
              {[
                { icon: Truck, text: "Entrega Rápida" },
                { icon: ShieldCheck, text: "Compra Segura" },
                { icon: RotateCcw, text: "Troca Fácil" }
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-2 opacity-60">
                  <badge.icon className="w-6 h-6 mb-2 text-brand-pink-strong" />
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customization Form - Right Column or Conditional */}
        {(isBottle || isMug || isAtacado || isMeuJeito) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-xl rounded-[40px] p-8 shadow-xl border border-white/40 h-fit max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-serif font-black italic mb-6 text-brand-black border-b border-brand-pink-light pb-2">Personalize do seu jeito</h3>
            
            <div className="space-y-8">
              {forceSuaHistoria ? (
                <div className="space-y-8 pb-4">
                  {/* Sua Historia Fields */}
                  <div className="space-y-4">
                    <CustomField 
                      label="Nome" 
                      hint="Nome para a arte" 
                      value={customFields.nome} 
                      onChange={(v) => setCustomFields(p => ({...p, nome: v}))} 
                    />
                    <CustomField 
                      label="Comidas Favoritas" 
                      hint="Ex: pizza, sushi..." 
                      value={customFields.comidas} 
                      onChange={(v) => setCustomFields(p => ({...p, comidas: v}))} 
                    />
                    <CustomField 
                      label="Lazer e Esportes" 
                      hint="Ex: praia, musculação..." 
                      value={customFields.lazer} 
                      onChange={(v) => setCustomFields(p => ({...p, lazer: v}))} 
                    />
                  </div>
                </div>
              ) : isThermalBottle ? (
                <div className="space-y-6">
                  <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-brand-primary text-center">COMO DESEJA PERSONALIZAR:</p>
                  </div>
                  <CustomField 
                    label="Nome" 
                    hint="Informe o nome desejado" 
                    value={customFields.nome} 
                    onChange={(v) => setCustomFields(p => ({...p, nome: v}))} 
                  />
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary block mb-2">Sobrenome ou Frase</label>
                    <textarea 
                      value={customFields.sobrenome}
                      onChange={(e) => setCustomFields(p => ({...p, sobrenome: e.target.value}))}
                      placeholder="Informe o sobrenome, ou uma pequena frase de até 10 palavras"
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-primary transition-all h-24 resize-none"
                    />
                  </div>
                  <div className="p-5 bg-brand-gold/10 border-l-4 border-brand-gold rounded-sm">
                    <p className="text-[11px] font-bold text-brand-black leading-relaxed italic">
                      <span className="text-brand-primary font-black block not-italic mb-1 uppercase tracking-tighter">Hey! Aqui vai um lembretezinho:</span>
                      É possível alterar a fonte e as cores das letras.
                    </p>
                  </div>
                </div>
              ) : isProfessionalBottle ? (
                <div className="space-y-4">
                  <CustomField label="Seu Nome" hint="Ex: Dr. Jonas Santos" value={customFields.nome} onChange={(v) => setCustomFields(p => ({...p, nome: v}))} />
                </div>
              ) : isMug ? (
                <div className="space-y-4">
                  <CustomField label="Nome para a Caneca" hint="Ex: Jonas" value={customFields.nome} onChange={(v) => setCustomFields(p => ({...p, nome: v}))} />
                  <CustomField label="Sua Frase" hint="Uma frase especial..." value={customFields.frase} onChange={(v) => setCustomFields(p => ({...p, frase: v}))} />
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-2">Envie sua Foto</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'foto1')} className="text-[10px] w-full" />
                  </div>
                </div>
              ) : isAtacado ? (
                <div className="space-y-4">
                  <CustomField label="Texto / Observação" hint="Ex: Logo na frente, site atrás" value={customFields.textoAtacado} onChange={(v) => setCustomFields(p => ({...p, textoAtacado: v}))} />
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-2">Carregar {isCaricaturaLogo ? 'Foto para Caricatura' : 'Logo'}</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'foto1')} className="text-[10px] w-full" />
                  </div>
                  {isCaricaturaLogo && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-2">Carregar Logo da Empresa</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'foto2')} className="text-[10px] w-full" />
                    </div>
                  )}
                </div>
              ) : null}

              <div className="p-4 bg-brand-pink-light/20 rounded-2xl">
                <p className="text-[9px] text-brand-pink-strong font-bold uppercase italic leading-relaxed text-center">
                  * Nossos produtos são personalizados à mão com muito carinho.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
