import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice } from '@/src/lib/utils';
import { 
  Type, 
  Image as ImageIcon, 
  Smile, 
  Trash2, 
  Save, 
  ChevronLeft,
  Upload,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Customizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'stickers' | 'upload' | 'elements'>('elements');
  const [activeCategory, setActiveCategory] = useState<'comidas' | 'futebol' | 'animais'>('comidas');
  const [selectedFont, setSelectedFont] = useState('Plus Jakarta Sans');
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedModel, setSelectedModel] = useState('iPhone 15 Pro Max');
  const [name, setName] = useState('');

  const phoneModelsData: Record<string, { frame: string, mask: { x: number, y: number, w: number, h: number } }> = {
    'iPhone 16 Pro Max': { 
      frame: 'https://images.unsplash.com/photo-1603313011101-31c726a54481?q=80&w=800&auto=format&fit=crop', 
      mask: { x: 20, y: 20, w: 340, h: 510 } 
    },
    'iPhone 16 Pro': { 
      frame: 'https://images.unsplash.com/photo-1603313011101-31c726a54481?q=80&w=800&auto=format&fit=crop', 
      mask: { x: 20, y: 20, w: 340, h: 510 } 
    },
    'iPhone 15 Pro Max': { 
      frame: 'https://images.unsplash.com/photo-1603313011101-31c726a54481?q=80&w=800&auto=format&fit=crop', 
      mask: { x: 20, y: 20, w: 340, h: 510 } 
    },
    'Galaxy S24 Ultra': { 
      frame: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?q=80&w=800&auto=format&fit=crop', 
      mask: { x: 15, y: 15, w: 350, h: 520 } 
    },
    'Redmi Note 13 Pro': { 
      frame: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=800&auto=format&fit=crop', 
      mask: { x: 15, y: 15, w: 350, h: 520 } 
    },
  };

  const phoneBrands = [
    { name: 'Apple', models: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14', 'iPhone 13'] },
    { name: 'Samsung', models: ['Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy A55', 'Galaxy A54'] },
    { name: 'Motorola', models: ['Edge 50 Ultra', 'Edge 50 Fusion', 'Moto G84'] },
    { name: 'Xiaomi', models: ['14T Pro', 'Redmi Note 13 Pro'] }
  ];

  const fonts = [
    { name: 'Padrão', value: 'Plus Jakarta Sans' },
    { name: 'Impacto', value: 'Bebas Neue' },
    { name: 'Curvada', value: 'Pacifico' },
    { name: 'Moderna', value: 'Inter' }
  ];

  const iconCategories = {
    comidas: [
      'https://cdn-icons-png.flaticon.com/512/1048/1048911.png', // Pizza
      'https://cdn-icons-png.flaticon.com/512/1048/1048917.png', // Burger
      'https://cdn-icons-png.flaticon.com/512/1041/1041341.png', // Ice cream
      'https://cdn-icons-png.flaticon.com/512/1041/1041355.png', // Donut
      'https://cdn-icons-png.flaticon.com/512/2722/2722510.png', // Coffee
    ],
    futebol: [
      'https://cdn-icons-png.flaticon.com/512/3306/3306613.png', // Soccer ball
      'https://cdn-icons-png.flaticon.com/512/3306/3306612.png', // Trophy
      'https://cdn-icons-png.flaticon.com/512/53/53239.png', // Goal
      'https://cdn-icons-png.flaticon.com/512/2857/2857416.png', // Jersey
    ],
    animais: [
      'https://cdn-icons-png.flaticon.com/512/1048/1048953.png', // Cat
      'https://cdn-icons-png.flaticon.com/512/1048/1048944.png', // Dog
      'https://cdn-icons-png.flaticon.com/512/1048/1048961.png', // Paw
      'https://cdn-icons-png.flaticon.com/512/1048/1048981.png', // Fish
    ]
  };

  const stickers = [
    '🐈', '🐾', '🔥', '✨', '🌈', '💖', '🍀', '🍎', '🚀', '🎸', '🎨', '🍕'
  ];

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
          navigate('/'); // Redirect to home if product not found
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!loading && canvasRef.current && product) {
      const isCase = product.category === 'capas';
      
      // Destroy old canvas if exists
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }

      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: isCase ? 380 : 300,
        height: isCase ? 550 : 500,
        backgroundColor: 'transparent'
      });

      return () => {
        fabricCanvas.current?.dispose();
        fabricCanvas.current = null;
      };
    }
  }, [loading, product]);

  const addSticker = (emoji: string) => {
    const text = new fabric.FabricText(emoji, {
      left: 100,
      top: 100,
      fontSize: 50,
    });
    fabricCanvas.current?.add(text);
    fabricCanvas.current?.setActiveObject(text);
  };

  const addElement = async (url: string) => {
    try {
      const img = await fabric.FabricImage.fromURL(url);
      img.scaleToWidth(100);
      img.set({ left: 100, top: 100 });
      fabricCanvas.current?.add(img);
      fabricCanvas.current?.setActiveObject(img);
    } catch (err) {
      console.error("Error adding element:", err);
    }
  };

  const addText = () => {
    if (!name.trim()) return;
    const text = new fabric.FabricText(name, {
      left: 80,
      top: 80,
      fontSize: 35,
      fontFamily: selectedFont,
      fontWeight: 'bold',
      fill: '#1A1A1A'
    });
    fabricCanvas.current?.add(text);
    fabricCanvas.current?.setActiveObject(text);
    setName('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgData = event.target?.result as string;
      try {
        const img = await fabric.FabricImage.fromURL(imgData);
        
        const isCase = product?.category === 'capas';
        const canvasWidth = fabricCanvas.current?.getWidth() || 380;
        const canvasHeight = fabricCanvas.current?.getHeight() || 550;

        if (isCase) {
          // SMART AUTO-FIT (Object-fit: COVER logic)
          const scaleX = canvasWidth / img.width!;
          const scaleY = canvasHeight / img.height!;
          const scaleToUse = Math.max(scaleX, scaleY);
          
          img.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            scaleX: scaleToUse,
            scaleY: scaleToUse,
            selectable: true,
            hasControls: true,
            cornerStyle: 'circle',
            cornerColor: '#FF5C5C',
            transparentCorners: false
          });
          
          // Place photo BEHIND the case frame
          fabricCanvas.current?.add(img);
          fabricCanvas.current?.sendObjectToBack(img);
        } else {
          img.scaleToWidth(150);
          img.set({ left: 100, top: 100 });
          fabricCanvas.current?.add(img);
        }
        
        fabricCanvas.current?.setActiveObject(img);
        fabricCanvas.current?.renderAll();
      } catch (err) {
        console.error("Error loading image:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSelected = () => {
    const active = fabricCanvas.current?.getActiveObjects();
    if (active) {
      active.forEach((obj) => fabricCanvas.current?.remove(obj));
      fabricCanvas.current?.discardActiveObject();
      fabricCanvas.current?.renderAll();
    }
  };

  const handleSaveAndAdd = () => {
    if (!fabricCanvas.current || !product) return;

    if (product.category === 'capas' && (!selectedBrand || !selectedModel)) {
      alert('Por favor, selecione a marca e o modelo do seu celular.');
      return;
    }
    
    // Get JSON represention for admin storage
    const designJSON = fabricCanvas.current.toJSON();
    // Get a screenshot of the customized design
    const designPreview = fabricCanvas.current.toDataURL();

    addItem({
      id: product.id,
      name: `Personalizado: ${product.name}${selectedModel ? ` (${selectedBrand} ${selectedModel})` : ''}`,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      customization: {
        json: designJSON,
        preview: designPreview,
        device: selectedModel ? { brand: selectedBrand, model: selectedModel } : undefined
      }
    });

    navigate('/carrinho');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black">CARREGANDO...</div>;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col pt-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full mb-8 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-xs font-black uppercase tracking-widest hover:text-brand-red transition-all"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Customizar {product.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red italic">Sua arte, seu estilo</p>
        </div>
        <div className="font-black text-xl">{formatPrice(product.price)}</div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto px-6 lg:px-10 w-full pb-12">
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-white rounded-[40px] p-8 shadow-xl flex flex-col border-4 border-brand-gray h-fit">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center mb-6 text-brand-red">Monte sua Arte</p>
          
          {product?.category === 'capas' && (
            <div className="mb-6 space-y-3">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Seu Aparelho</p>
              <select 
                value={selectedBrand} 
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                }}
                className="w-full bg-brand-gray rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="">Marca</option>
                {phoneBrands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedBrand}
                className="w-full bg-brand-gray rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-brand-yellow disabled:opacity-50"
              >
                <option value="">Modelo</option>
                {selectedBrand && phoneBrands.find(b => b.name === selectedBrand)?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-full overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('elements')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all min-w-[50px] ${activeTab === 'elements' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
              title="Elementos"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('stickers')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all min-w-[50px] ${activeTab === 'stickers' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all min-w-[50px] ${activeTab === 'text' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
              title="Texto"
            >
              <Type className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all min-w-[50px] ${activeTab === 'upload' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
              title="Enviar Foto"
            >
              <Upload className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[350px]">
            {activeTab === 'elements' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {Object.keys(iconCategories).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat as any)}
                      className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brand-yellow text-brand-black shadow-md' : 'bg-brand-gray text-gray-500 hover:text-brand-black'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {iconCategories[activeCategory].map((url, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => addElement(url)}
                      className="aspect-square bg-brand-gray rounded-2xl flex items-center justify-center p-2 hover:scale-110 active:scale-95 transition-all hover:bg-brand-yellow/50"
                    >
                      <img src={url} alt="Element" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'stickers' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Coleção de Emojis</p>
                <div className="grid grid-cols-4 gap-4 text-center">
                  {stickers.map((emoji) => (
                    <button 
                      key={emoji} 
                      onClick={() => addSticker(emoji)}
                      className="aspect-square bg-brand-gray rounded-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all hover:bg-brand-yellow/50"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-3">Escolha a Fonte</p>
                  <div className="grid grid-cols-2 gap-2">
                    {fonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setSelectedFont(f.value)}
                        style={{ fontFamily: f.value }}
                        className={`p-3 rounded-xl text-xs transition-all border-2 ${selectedFont === f.value ? 'bg-brand-black text-white border-brand-black shadow-lg scale-105' : 'bg-brand-gray text-brand-black border-transparent hover:border-brand-yellow'}`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-3">Escreva o Nome ou Frase</p>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria"
                    className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-brand-yellow/30"
                  />
                  <button 
                    onClick={addText}
                    className="w-full mt-4 bg-brand-black text-white py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-red transition-all shadow-xl"
                  >
                    Personalizar Nome
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="w-full aspect-video border-4 border-dashed border-brand-gray rounded-[30px] flex flex-col items-center justify-center p-6 bg-brand-bg hover:border-brand-yellow transition-colors relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-10 h-10 text-gray-300 mb-2 group-hover:text-brand-yellow transition-colors" />
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Enviar sua Foto</p>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase italic leading-relaxed">
                  Coloque logos ou fotos pessoais diretamente no item.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-brand-gray flex flex-wrap gap-4">
            <button 
              onClick={removeSelected}
              className="w-12 h-12 bg-red-50 text-brand-red rounded-full flex items-center justify-center hover:bg-brand-red hover:text-white transition-all border-2 border-brand-red/10"
              title="Remover Selecionado"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                fabricCanvas.current?.clear();
                if (fabricCanvas.current) {
                  fabricCanvas.current.backgroundColor = 'transparent';
                  fabricCanvas.current.renderAll();
                }
              }}
              className="w-12 h-12 bg-brand-gray text-brand-black rounded-full flex items-center justify-center hover:bg-brand-black hover:text-white transition-all"
              title="Limpar Tudo"
            >
               <Download className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={handleSaveAndAdd}
              className="flex-1 bg-brand-yellow text-brand-black py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-brand-yellow/20"
            >
              <Save className="w-4 h-4" />
              Finalizar Atendimento
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[60px] shadow-inner border-8 border-brand-gray p-12 overflow-hidden relative min-h-[600px]">
          <div className="mb-6 flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-gray rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               Modo Edição Ativo
            </div>
          </div>

          <div className="relative">
            {/* The base product image - Pure canvas look */}
            <div className={`relative ${product?.category === 'capas' ? 'w-[320px] h-[600px] rounded-[50px] overflow-hidden border-[12px] border-brand-black shadow-2xl' : 'w-[380px] h-[550px] bg-brand-gray/5 rounded-[40px] flex items-center justify-center p-12 ring-4 ring-brand-gray/20'}`}>
              <img 
                src={product.imageUrl} 
                alt="Base" 
                className={`max-w-full max-h-full object-contain transition-opacity grayscale ${product?.category === 'capas' ? 'absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay' : 'opacity-20 mix-blend-multiply group-hover:opacity-10'}`}
              />
              {product?.category === 'capas' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none z-10"></div>
              )}
              {/* The Fabric Canvas */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-0">
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 flex flex-col items-center gap-2">
            <span>Área de Impressão Garantida</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
