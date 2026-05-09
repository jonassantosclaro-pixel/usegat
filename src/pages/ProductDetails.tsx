import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice } from '@/src/lib/utils';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

function CustomField({ label, hint, value, onChange }: { label: string, hint: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="w-full bg-brand-gray border border-transparent rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-yellow transition-all"
      />
    </div>
  );
}

function WhatsAppButton() {
  const [phone, setPhone] = useState('5500000000000');

  useEffect(() => {
    async function fetchSettings() {
      const q = await getDocs(collection(db, 'settings'));
      if (!q.empty) {
        setPhone(q.docs[0].data().whatsapp || '5500000000000');
      }
    }
    fetchSettings();
  }, []);

  return (
    <a 
      href={`https://wa.me/${phone}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[110] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
    >
      <MessageCircle className="w-8 h-8" />
    </a>
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
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-black uppercase tracking-tighter text-3xl">Carregando...</div>;
  if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-black uppercase tracking-tighter text-3xl">Produto não encontrado.</div>;

  const isBottle = product.category === 'garrafas-termicas' || product.category === 'garrafas';
  const isMug = product.category === 'canecas';
  const isAtacado = product.category === 'atacado';
  
  // Customization Toggles
  const isMeuJeito = product.subcategory?.toUpperCase() === 'MEU JEITO';
  const forceSuaHistoria = product.isSuaHistoria || isMeuJeito;
  const forceNameSurname = product.hasNameAndSurname || (isBottle && !forceSuaHistoria);

  const handleAddToCart = () => {
    let customization: any = undefined;

    if (product.customizable || isMug || isAtacado || isMeuJeito) {
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
      } else if (forceNameSurname) {
        customization = {
          tipo: 'nome-sobrenome',
          nome: customFields.nome,
          sobrenome: customFields.sobrenome
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
          foto2: customFields.foto2
        };
      }
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      customization
    });
    // Removed navigate to cart to use the sidebar instead
  };

  // Specific condition for Atacado caricatura + logo
  const isAtacadoDualPhoto = isAtacado && product.subcategory?.toLowerCase().includes('caricatura');

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <WhatsAppButton />
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-black uppercase tracking-widest mb-12 hover:text-brand-red transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Voltar para a loja
      </button>

      <div className={`grid grid-cols-1 ${(isBottle || isMug || isAtacado || isMeuJeito) ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-16 lg:gap-24`}>
        {/* Customization Form - Left Column */}
        {(isBottle || isMug || isAtacado || isMeuJeito) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[40px] p-8 shadow-xl border-4 border-brand-gray h-fit max-h-[80vh] overflow-y-auto custom-scrollbar"
          >
            <h3 className="text-xl font-black uppercase italic mb-6 border-b-2 border-brand-yellow inline-block">Personalizar Produto</h3>
            
            <div className="space-y-8">
              {/* Customization Form Branching */}
              {forceSuaHistoria ? (
                <div className="space-y-8 pb-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Escolha o estilo dos desenhos</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['colorido', 'preto'].map((estilo) => (
                        <button
                          key={estilo}
                          onClick={() => setCustomFields(prev => ({ ...prev, elementosEstilo: estilo as any }))}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${customFields.elementosEstilo === estilo ? 'border-brand-red bg-brand-red/5' : 'border-brand-gray'}`}
                        >
                          <div className={`w-8 h-8 rounded-full ${estilo === 'colorido' ? 'bg-gradient-to-tr from-yellow-400 to-red-500' : 'bg-gray-200 border-2 border-gray-400'}`}></div>
                          <span className="text-[9px] font-black uppercase">{estilo}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <CustomField 
                      label="Comida Favorita (5 a 10 itens)" 
                      hint="Ex: pizza, hambúrguer, pipoca..." 
                      value={customFields.comidas} 
                      onChange={(v) => setCustomFields(p => ({...p, comidas: v}))} 
                    />
                    <CustomField 
                      label="Bebida Favorita (3 a 5 itens)" 
                      hint="Ex: água, café, cerveja..." 
                      value={customFields.bebidas} 
                      onChange={(v) => setCustomFields(p => ({...p, bebidas: v}))} 
                    />
                    <CustomField 
                      label="Entretenimento (2 a 5 itens)" 
                      hint="Ex: cinema, séries, video game..." 
                      value={customFields.entretenimento} 
                      onChange={(v) => setCustomFields(p => ({...p, entretenimento: v}))} 
                    />
                    <CustomField 
                      label="Lazer e Esporte (5 a 10 itens)" 
                      hint="Ex: praia, montanha, academia..." 
                      value={customFields.lazer} 
                      onChange={(v) => setCustomFields(p => ({...p, lazer: v}))} 
                    />
                    <CustomField 
                      label="Momentos e Pessoas (3 a 5 itens)" 
                      hint="Ex: formatura, viagem, nomes..." 
                      value={customFields.momentos} 
                      onChange={(v) => setCustomFields(p => ({...p, momentos: v}))} 
                    />
                    <CustomField 
                      label="Diversos (2 a 5 itens)" 
                      hint="Ex: profissão, time de futebol..." 
                      value={customFields.diversos} 
                      onChange={(v) => setCustomFields(p => ({...p, diversos: v}))} 
                    />
                  </div>

                  <div className="p-6 bg-brand-yellow/10 rounded-3xl border-2 border-brand-yellow/20">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-red block mb-4">Adicionar Caricatura (Opcional)</label>
                    <select 
                      className="w-full bg-white rounded-xl p-3 text-xs font-bold mb-4 outline-none border border-brand-yellow/30"
                      value={customFields.caricaturasQtd}
                      onChange={(e) => setCustomFields(p => ({...p, caricaturasQtd: e.target.value}))}
                    >
                      <option value="0">Sem caricatura</option>
                      <option value="1">1 Pessoa (+ R$ 30,00)</option>
                      <option value="2">2 Pessoas (+ R$ 50,00)</option>
                      <option value="3">3 Pessoas (+ R$ 70,00)</option>
                    </select>
                    {customFields.caricaturasQtd !== '0' && (
                      <div className="grid grid-cols-2 gap-3">
                        {['colorido', 'preto'].map((estilo) => (
                          <button
                            key={estilo}
                            onClick={() => setCustomFields(prev => ({ ...prev, caricaturaEstilo: estilo as any }))}
                            className={`p-3 rounded-xl border transition-all text-[8px] font-black uppercase ${customFields.caricaturaEstilo === estilo ? 'bg-brand-red text-white' : 'bg-white border-brand-gray text-gray-400'}`}
                          >
                            Caricatura {estilo}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : forceNameSurname ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Nome</label>
                    <input 
                      type="text" 
                      value={customFields.nome}
                      onChange={(e) => setCustomFields(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: JONAS"
                      className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-brand-yellow/30 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Sobrenome</label>
                    <input 
                      type="text" 
                      value={customFields.sobrenome}
                      onChange={(e) => setCustomFields(prev => ({ ...prev, sobrenome: e.target.value }))}
                      placeholder="Ex: SANTOS"
                      className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-brand-yellow/30 uppercase"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Standard forms for Mugs / Atacado etc */}
                  {isMug && (
                    <>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Frase Especial</label>
                        <input 
                          type="text" 
                          value={customFields.frase}
                          onChange={(e) => setCustomFields(prev => ({ ...prev, frase: e.target.value }))}
                          placeholder="Sua frase aqui..."
                          className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-brand-yellow/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Sua Foto</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'foto1')}
                          className="w-full text-xs font-bold"
                        />
                        {customFields.foto1 && <div className="mt-2 w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border-2 border-brand-yellow"><img src={customFields.foto1} className="w-full h-full object-cover" /></div>}
                      </div>
                    </>
                  )}

                  {/* For Atacado */}
                  {isAtacado && (
                    <>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Texto (Opcional)</label>
                        <input 
                          type="text" 
                          value={customFields.textoAtacado}
                          onChange={(e) => setCustomFields(prev => ({ ...prev, textoAtacado: e.target.value }))}
                          placeholder="Nome da empresa, evento..."
                          className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-brand-yellow/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Logo / Imagem 1</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'foto1')}
                          className="w-full text-xs font-bold"
                        />
                        {customFields.foto1 && <div className="mt-2 w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border-2 border-brand-yellow"><img src={customFields.foto1} className="w-full h-full object-cover" /></div>}
                      </div>
                      {product.subcategory?.includes('+') && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Logo / Imagem 2</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'foto2')}
                            className="w-full text-xs font-bold"
                          />
                          {customFields.foto2 && <div className="mt-2 w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border-2 border-brand-yellow"><img src={customFields.foto2} className="w-full h-full object-cover" /></div>}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="p-4 bg-brand-gray rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase italic leading-relaxed">
                  * Verifique todos os campos antes de adicionar ao carrinho. Nossos produtos personalizados são feitos sob demanda.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gray rounded-[60px] p-8 aspect-square flex items-center justify-center shadow-lg border-4 border-brand-black/5 relative overflow-hidden"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover rounded-[40px] shadow-2xl relative z-10"
          />
          
          {/* Virtual Preview on Image */}
          {(isBottle || isMug) && (customFields.nome || customFields.frase) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-black/5 backdrop-blur-[2px] p-4 rounded-xl border border-white/20 text-center transform -rotate-12 translate-y-12">
                <p className="text-2xl font-black text-brand-black/80 uppercase tracking-tighter mix-blend-multiply">{customFields.nome}</p>
                {isBottle && <p className="text-xl font-bold text-brand-black/70 uppercase tracking-tight mix-blend-multiply mt-1">{customFields.sobrenome}</p>}
                {isMug && <p className="text-sm font-medium text-brand-black/60 italic mt-2">{customFields.frase}</p>}
              </div>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <span className="text-brand-red font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            {product.category} {product.subcategory && `• ${product.subcategory}`}
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-6 mb-8">
            <span className="text-5xl font-black text-brand-black">{formatPrice(product.price)}</span>
            <div className="bg-brand-yellow px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest self-center">
              Em até 3x s/ juros
            </div>
          </div>

          <p className="text-lg text-gray-500 font-medium mb-12 leading-relaxed">
            {product.description || 'Este item exclusivo faz parte da nossa nova coleção. Criado com materiais de alta qualidade para garantir durabilidade e estilo.'}
          </p>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
              <div className="flex items-center border-4 border-brand-black rounded-full overflow-hidden h-16 w-full sm:w-40">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 font-black text-2xl hover:bg-brand-gray transition-colors"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black text-xl">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 font-black text-2xl hover:bg-brand-gray transition-colors"
                >
                  +
                </button>
              </div>
              
              {(product.customizable || isMug || isAtacado || forceSuaHistoria) ? (
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-black text-white h-16 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-brand-red transition-all shadow-xl shadow-brand-black/10 active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isBottle ? 'Adicionar Personalizada' : 'Adicionar ao Carrinho'}
                </button>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-black text-white h-16 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-brand-red transition-all shadow-xl shadow-brand-black/10 active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Adicionar ao Carrinho
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-12">
              <div className="flex flex-col items-center text-center p-4">
                <Truck className="w-8 h-8 mb-3 text-brand-red" />
                <span className="text-[10px] font-black uppercase tracking-widest">Entrega Rápida</span>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <ShieldCheck className="w-8 h-8 mb-3 text-brand-red" />
                <span className="text-[10px] font-black uppercase tracking-widest">Site Seguro</span>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <RotateCcw className="w-8 h-8 mb-3 text-brand-red" />
                <span className="text-[10px] font-black uppercase tracking-widest">Troca Fácil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
