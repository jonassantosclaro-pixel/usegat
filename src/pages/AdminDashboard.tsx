import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, Package, Users, ShoppingCart as OrderIcon, Database, ArrowLeft, Check, Search, RefreshCw, Ticket, Settings as SettingsIcon, Layers, Tags, Image as ImageIcon } from 'lucide-react';
import { formatPrice } from '@/src/lib/utils';
import { FALLBACK_PRODUCTS } from '@/src/lib/productsData';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, signInWithGoogle } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'value'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState(0);

  // Databases States
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>([]);
  const [dbVariations, setDbVariations] = useState<any[]>([]);

  // Category Operations States
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Subcategory Operations States
  const [newSubId, setNewSubId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategoryId, setNewSubCategoryId] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);

  // Variation Operations States
  const [newVarId, setNewVarId] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [newVarCategoryId, setNewVarCategoryId] = useState('');
  const [newVarOptionsText, setNewVarOptionsText] = useState('');
  const [editingVariation, setEditingVariation] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'settings' | 'stock' | 'coupons' | 'categories_manager'>('products');
  const [stockSearch, setStockSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    whatsapp: '',
    instagram: '',
    facebook: '',
    email: '',
    phone: '',
    address: '',

    // Use GAT / branding / fonts & colors
    site_title: '',
    site_subtitle: '',
    font_family: 'Inter',
    primary_color: '#4D1D54',
    secondary_color: '#FAF7F8',
    accent_color: '#B48A4E',

    // Quem somos
    about_title: '',
    about_text: '',
    about_image: '',

    // Caricatura Configs
    caricatura_explaining_image: '',
    caricatura_price_1: '19.90',
    caricatura_price_2: '39.80',

    // Como personalizar seu pedido
    custom_step_1_title: '',
    custom_step_1_desc: '',
    custom_step_2_title: '',
    custom_step_2_desc: '',
    custom_step_3_title: '',
    custom_step_3_desc: '',

    // Video options
    video_url_1: '',
    video_title_1: '',
    video_desc_1: '',

    // Policies & Payments
    policy_production_days: '',
    policy_delivery_text: '',
    policy_returns_text: '',
    payment_methods_text: '',

    // Instagram linked images/posts array
    instagram_posts: [
      { title: '', img: '', link: '', views: '', likes: '', desc: '' },
      { title: '', img: '', link: '', views: '', likes: '', desc: '' },
      { title: '', img: '', link: '', views: '', likes: '', desc: '' }
    ],

    // FAQs array
    faqs: [
      { q: '', a: '' },
      { q: '', a: '' },
      { q: '', a: '' },
      { q: '', a: '' }
    ],

    // Integrations
    bling_api_key: '',
    bling_api_url: 'https://api.bling.com.br',
    melhorenvio_token: '',
    melhorenvio_sandbox: true,
    pagbank_token: '',

    // Accordions (Sanfonas do Rodapé) Overrides
    acc_use_gat_type: 'default',
    acc_use_gat_text: '',
    acc_use_gat_image: '',
    acc_atendimento_type: 'default',
    acc_atendimento_text: '',
    acc_atendimento_image: '',
    acc_quem_somos_type: 'default',
    acc_quem_somos_text: '',
    acc_quem_somos_image: '',
    acc_como_personalizar_type: 'default',
    acc_como_personalizar_text: '',
    acc_como_personalizar_image: '',
    acc_duvidas_frequentes_type: 'default',
    acc_duvidas_frequentes_text: '',
    acc_duvidas_frequentes_image: '',
    acc_politicas_termos_type: 'default',
    acc_politicas_termos_text: '',
    acc_politicas_termos_image: '',
    acc_pagamento_type: 'default',
    acc_pagamento_text: '',
    acc_pagamento_image: '',
    acc_seguro_type: 'default',
    acc_seguro_text: '',
    acc_seguro_image: '',
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrls: [] as string[],
    category: 'garrafas-termicas',
    subcategory: '',
    customizable: false,
    hasNameAndSurname: false,
    hasNameAndSurnameSemAoVivo: false,
    isSuaHistoria: false,
    allowsCaricatura: false,
    sku: '',
    detailedDescription: '',
    stock: 0,
    variations: [] as { name: string; price: number; stock: number }[]
  });
  const [newVariation, setNewVariation] = useState({ name: '', price: 0, stock: 0 });

  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);

    // Products Real-time
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Products error:", error);
    });

    // Orders Real-time
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Orders error:", error);
    });

    // Customers Real-time
    const unsubscribeCustomers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Customers error:", error);
    });

    // Coupons Real-time
    const unsubscribeCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Coupons error:", error);
    });

    // Categories Real-time with auto-seeding
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      if (snapshot.empty) {
        console.log("Seeding default categories in real-time...");
        const defaultCats = [
          { id: 'garrafas-termicas', name: 'Garrafas Térmicas', description: 'Garrafas térmicas em aço inoxidável cirúrgico com personalização "Sua História" gravada à laser permanente.' },
          { id: 'canecas', name: 'Canecas Exclusivas', description: 'Canecas em cerâmica premium e design Boho Chic natural. Desenhos minimalistas inspirados nas suas melhores lembranças.' },
          { id: 'atacado', name: 'Orçamentos Corporativos & Atacado', description: 'Soluções em escala de brindes personalizados para sua empresa, casamento ou evento corporativo com gravação de alta fidelidade.' }
        ];
        for (const cat of defaultCats) {
          try {
            await setDoc(doc(db, 'categories', cat.id), {
              name: cat.name,
              description: cat.description,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Error seeding default category:", cat.id, e);
          }
        }
      } else {
        setDbCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.error("Categories error:", error);
    });

    // Subcategories Real-time with auto-seeding
    const unsubscribeSubcategories = onSnapshot(collection(db, 'subcategories'), async (snapshot) => {
      if (snapshot.empty) {
        console.log("Seeding default subcategories in real-time...");
        const defaultSubs = [
          { id: 'meu-jeito', name: 'MEU JEITO', categoryId: 'garrafas-termicas' },
          { id: 'saude', name: 'SAÚDE', categoryId: 'garrafas-termicas' },
          { id: 'engenharia', name: 'ENGENHARIA', categoryId: 'garrafas-termicas' },
          { id: 'docencia', name: 'DOCÊNCIA', categoryId: 'garrafas-termicas' },
          { id: 'advocacia', name: 'ADVOCACIA', categoryId: 'garrafas-termicas' },
          { id: 'contador-adm', name: 'CONTADOR e ADM', categoryId: 'garrafas-termicas' },
          { id: 'militar-policia', name: 'MILITAR / POLÍCIA', categoryId: 'garrafas-termicas' },
          { id: 'ti', name: 'TI', categoryId: 'garrafas-termicas' },
          { id: 'caricaturas', name: 'CARICATURAS', categoryId: 'canecas' },
          { id: 'mesa', name: 'Para Mesa', categoryId: 'canecas' },
          { id: 'amor', name: 'Amor Por Aí', categoryId: 'canecas' },
          { id: 'corporativas-atacado', name: 'GARRAFAS TÉRMICAS', categoryId: 'atacado' },
          { id: 'n-termicas-atacado', name: 'GARRAFAS NÃO TÉRMICAS', categoryId: 'atacado' },
          { id: 'canecas-atacado', name: 'CANECAS', categoryId: 'atacado' }
        ];
        for (const sub of defaultSubs) {
          try {
            await setDoc(doc(db, 'subcategories', sub.id), {
              name: sub.name,
              categoryId: sub.categoryId,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Error seeding default subcategory:", sub.id, e);
          }
        }
      } else {
        setDbSubcategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.error("Subcategories error:", error);
    });

    // Variations Real-time with auto-seeding
    const unsubscribeVariations = onSnapshot(collection(db, 'variations'), async (snapshot) => {
      if (snapshot.empty) {
        console.log("Seeding default variations in real-time...");
        const defaultVars = [
          { id: 'capacidade-gt', name: 'Capacidade', categoryId: 'garrafas-termicas', options: ['500ml', '750ml (+ R$ 20,00)', '1L (+ R$ 40,00)'] },
          { id: 'tampa-gt', name: 'Tipo de Tampa', categoryId: 'garrafas-termicas', options: ['Tampa Hermética Convencional', 'Tampa de bico canudo premium (+ R$ 15,00)'] },
          { id: 'acabamento-cn', name: 'Acabamento Caneca', categoryId: 'canecas', options: ['Off-White Boho Chic Brilho', 'Fosco Rústico Boho (+ R$ 5,00)', 'Borda Dourada Real (+ R$ 12,00)'] }
        ];
        for (const v of defaultVars) {
          try {
            await setDoc(doc(db, 'variations', v.id), {
              name: v.name,
              categoryId: v.categoryId,
              options: v.options,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Error seeding default variation:", v.id, e);
          }
        }
      } else {
        setDbVariations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.error("Variations error:", error);
    });

     // Merge any loose settings documents into a single 'global' document and load it once
    let isMounted = true;
    getDocs(collection(db, 'settings')).then(async (snapshot) => {
      if (!snapshot.empty) {
        let globalDoc = snapshot.docs.find(d => d.id === 'global');
        if (!globalDoc) {
          // No 'global' document yet, we will write to 'global' using the first available settings doc
          const firstData = snapshot.docs[0].data();
          await setDoc(doc(db, 'settings', 'global'), firstData);
          globalDoc = { data: () => firstData } as any;
          console.log("Migrada primeira configuração para 'global'");
        }
        
        if (isMounted) {
          const data = globalDoc.data();
          setSettings((prev: any) => {
            const merged = { ...prev, ...data };
            // Replace any null/undefined with empty string to keep inputs controlled
            for (const key of Object.keys(merged)) {
              if (merged[key] === null || merged[key] === undefined) {
                merged[key] = '';
              }
            }
            if (data.faqs && data.faqs.length) {
              merged.faqs = data.faqs;
            } else {
              merged.faqs = prev.faqs;
            }
            if (data.instagram_posts && data.instagram_posts.length) {
              merged.instagram_posts = data.instagram_posts;
            } else {
              merged.instagram_posts = prev.instagram_posts;
            }
            return merged;
          });
        }

        // Clean up duplicate settings documents
        for (const docObj of snapshot.docs) {
          if (docObj.id !== 'global') {
            await deleteDoc(doc(db, 'settings', docObj.id));
            console.log(`Deletada configuração duplicada: ${docObj.id}`);
          }
        }
      } else {
        // Since snapshot is empty, save the initial defaults to 'global'
        await setDoc(doc(db, 'settings', 'global'), settings);
        console.log("Criadas configurações padrão iniciais em 'global'");
      }
    }).catch(err => {
      console.error("Erro carregando ou limpando configurações:", err);
    });

    return () => {
      isMounted = false;
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCustomers();
      unsubscribeCoupons();
      unsubscribeCategories();
      unsubscribeSubcategories();
      unsubscribeVariations();
    };
  }, [isAdmin]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponValue <= 0) {
      alert("Por favor, preencha o código do cupom e o valor do desconto!");
      return;
    }
    const codeUpper = newCouponCode.trim().toUpperCase();
    try {
      await addDoc(collection(db, 'coupons'), {
        code: codeUpper,
        type: newCouponType,
        value: Number(newCouponValue),
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewCouponCode('');
      setNewCouponValue(0);
      alert("Cupom criado com sucesso!");
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      alert("Erro ao criar cupom: " + error.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      alert("Cupom excluído com sucesso!");
    } catch (error: any) {
      console.error("Error deleting coupon:", error);
      alert("Erro ao excluir cupom: " + error.message);
    }
  };

  const handleToggleCouponActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), {
        active: !currentStatus
      });
    } catch (error: any) {
      console.error("Error updating coupon:", error);
      alert("Erro ao atualizar status do cupom: " + error.message);
    }
  };

  // --- Category Handlers ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId.trim() || !newCatName.trim()) {
      alert("Código (Slug) e Nome da Categoria são obrigatórios!");
      return;
    }
    const cleanId = newCatId.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    try {
      await setDoc(doc(db, 'categories', cleanId), {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        createdAt: new Date().toISOString()
      });
      setNewCatId('');
      setNewCatName('');
      setNewCatDesc('');
      alert("Categoria adicionada com sucesso!");
    } catch (error: any) {
      console.error("Error adding category:", error);
      alert("Erro ao adicionar categoria: " + error.message);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: editingCategory.name.trim(),
        description: editingCategory.description?.trim() || ''
      });
      setEditingCategory(null);
      alert("Categoria atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error updating category:", error);
      alert("Erro ao atualizar categoria: " + error.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Os produtos associados poderão ficar sem categoria!")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      alert("Categoria excluída com sucesso!");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert("Erro ao excluir categoria: " + error.message);
    }
  };

  // --- Subcategory Handlers ---
  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubId.trim() || !newSubName.trim() || !newSubCategoryId) {
      alert("Código, Nome e Categoria Pai são obrigatórios!");
      return;
    }
    const cleanId = newSubId.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    try {
      await setDoc(doc(db, 'subcategories', cleanId), {
        name: newSubName.trim(),
        categoryId: newSubCategoryId,
        createdAt: new Date().toISOString()
      });
      setNewSubId('');
      setNewSubName('');
      setNewSubCategoryId('');
      alert("Subcategoria adicionada com sucesso!");
    } catch (error: any) {
      console.error("Error adding subcategory:", error);
      alert("Erro ao adicionar subcategory: " + error.message);
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;
    try {
      await updateDoc(doc(db, 'subcategories', editingSubcategory.id), {
        name: editingSubcategory.name.trim(),
        categoryId: editingSubcategory.categoryId
      });
      setEditingSubcategory(null);
      alert("Subcategoria atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error updating subcategory:", error);
      alert("Erro ao atualizar subcategoria: " + error.message);
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta subcategoria?")) return;
    try {
      await deleteDoc(doc(db, 'subcategories', id));
      alert("Subcategoria excluída com sucesso!");
    } catch (error: any) {
      console.error("Error deleting subcategory:", error);
      alert("Erro ao excluir subcategoria: " + error.message);
    }
  };

  // --- Variation Handlers ---
  const handleAddVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarId.trim() || !newVarName.trim() || !newVarOptionsText.trim()) {
      alert("Código, Nome e Opções da Variação são obrigatórios!");
      return;
    }
    const cleanId = newVarId.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    const optionsArr = newVarOptionsText.split(',').map(o => o.trim()).filter(Boolean);
    try {
      await setDoc(doc(db, 'variations', cleanId), {
        name: newVarName.trim(),
        categoryId: newVarCategoryId || '',
        options: optionsArr,
        createdAt: new Date().toISOString()
      });
      setNewVarId('');
      setNewVarName('');
      setNewVarCategoryId('');
      setNewVarOptionsText('');
      alert("Variação adicionada com sucesso!");
    } catch (error: any) {
      console.error("Error adding variation:", error);
      alert("Erro ao adicionar variação: " + error.message);
    }
  };

  const handleUpdateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariation) return;
    const optionsArr = (editingVariation.optionsText || '').split(',').map((o: string) => o.trim()).filter(Boolean);
    try {
      await updateDoc(doc(db, 'variations', editingVariation.id), {
        name: editingVariation.name.trim(),
        categoryId: editingVariation.categoryId || '',
        options: optionsArr
      });
      setEditingVariation(null);
      alert("Variação atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error updating variation:", error);
      alert("Erro ao atualizar variação: " + error.message);
    }
  };

  const handleDeleteVariation = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta variação?")) return;
    try {
      await deleteDoc(doc(db, 'variations', id));
      alert("Variação excluída com sucesso!");
    } catch (error: any) {
      console.error("Error deleting variation:", error);
      alert("Erro ao excluir variação: " + error.message);
    }
  };

  if (authLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-yellow border-t-brand-red rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-12 bg-white rounded-[50px] border-4 border-brand-gray text-center shadow-2xl">
        <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-red">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Acesso Restrito</h2>
        <p className="text-gray-400 font-bold mb-8 uppercase text-xs tracking-widest leading-loose">
          {user ? 'Sua conta não tem privilégios de administrador.' : 'Você precisa entrar com uma conta de administrador para acessar este painel.'}
        </p>
        {!user ? (
          <button 
            onClick={() => signInWithGoogle()}
            className="w-full bg-brand-black text-white h-16 rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-red transition-all shadow-xl shadow-brand-black/20"
          >
            Entrar como Admin
          </button>
        ) : (
          <Link to="/" className="text-brand-red font-black uppercase tracking-widest text-xs hover:underline">
            Voltar para a Loja
          </Link>
        )}
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Helper to clean undefined values recursively to avoid Firestore invalid data errors
      const cleanPayload = (obj: any): any => {
        if (obj === undefined || obj === null) return '';
        if (Array.isArray(obj)) {
          return obj.map(item => cleanPayload(item));
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (val !== undefined && val !== null) {
              cleaned[key] = cleanPayload(val);
            } else {
              cleaned[key] = '';
            }
          }
          return cleaned;
        }
        return obj;
      };

      const sanitizedSettings = cleanPayload(settings);

      // Direct update or set to document with ID 'global'
      await setDoc(doc(db, 'settings', 'global'), sanitizedSettings);

      // Verify and remove any duplicate collection documents that aren't 'global'
      const q = await getDocs(collection(db, 'settings'));
      for (const d of q.docs) {
        if (d.id !== 'global') {
          await deleteDoc(doc(db, 'settings', d.id));
        }
      }
      alert('Configurações salvas e propagadas para todo o site em tempo real!');
    } catch (error: any) {
      console.error("Firestore settings save error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'settings');
      alert(`Erro ao salvar configurações: ${error.message || error}`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size first: warn if file is huge (over 5MB), but let's compress anyway!
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande! Escolha um arquivo menor de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      
      // Early preview/feedback
      setSettings((prev: any) => ({
        ...prev,
        [fieldName]: base64String
      }));

      // Optimize and compress the selection using a Canvas
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale to a maximum bounding box of 1200px
        const MAX_SIZE = 1200;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress beautifully as high quality JPEG (75%)
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          
          // Send to server to write to disk
          fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: optimizedBase64 }),
          })
          .then(res => {
            if (!res.ok) throw new Error("Falha no upload");
            return res.json();
          })
          .then(data => {
            setSettings((prev: any) => ({
              ...prev,
              [fieldName]: data.imageUrl
            }));
          })
          .catch(err => {
            console.error("Local upload failed, keeping base64 as fallback:", err);
            setSettings((prev: any) => ({
              ...prev,
              [fieldName]: optimizedBase64
            }));
          });
        }
      };
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Erro ao ler arquivo da imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande! Escolha um arquivo menor de 5MB.");
      return;
    }

    setUploadingProductImage(true);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;

      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_SIZE = 1200;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          
          fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: optimizedBase64 }),
          })
          .then(res => {
            if (!res.ok) throw new Error("Falha no upload");
            return res.json();
          })
          .then(data => {
            setNewProduct((prev: any) => ({
              ...prev,
              imageUrls: [...prev.imageUrls, data.imageUrl]
            }));
            setUploadingProductImage(false);
          })
          .catch(err => {
            console.error("Local upload failed, keeping base64 as fallback:", err);
            setNewProduct((prev: any) => ({
              ...prev,
              imageUrls: [...prev.imageUrls, optimizedBase64]
            }));
            setUploadingProductImage(false);
          });
        }
      };
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Erro ao ler arquivo da imagem.");
      setUploadingProductImage(false);
    };
    reader.readAsDataURL(file);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const generateNFe = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/bling/nfe/${orderId}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert(`Nota Fiscal Gerada! Nº ${data.nfeNumber}`);
        // Refresh orders to show the data
        const orderSnapshot = await getDocs(collection(db, 'orders'));
        setOrders(orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        alert('Erro ao gerar nota: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao se comunicar com o servidor.');
    }
  };

  const generateLabel = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/melhorenvio/label/${orderId}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert(`Etiqueta Gerada! Rastreio: ${data.trackingCode}`);
        // Refresh orders
        const orderSnapshot = await getDocs(collection(db, 'orders'));
        setOrders(orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        alert('Erro ao gerar etiqueta: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao se comunicar com o servidor.');
    }
  };

  const exchangeBlingCode = async () => {
    try {
      const response = await fetch('/api/admin/bling/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '8123e01c98c5fdc73f75a358325aee5cf3c0b0a9',
          clientId: 'c3871f15d9d5d281e632e86d89b2e35f96755848',
          clientSecret: 'f0fa636f7878b47f547729d3433b6d56740194dc612f84695f0cb99183b3'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Bling V3 configurado com sucesso!');
      } else {
        alert('Erro ao configurar: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao se comunicar com o servidor.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productPayload = {
        ...newProduct,
        imageUrl: newProduct.imageUrls[0] || '',
        price: Number(newProduct.price),
        variations: newProduct.variations,
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: new Date().toISOString(),
        });
      }
      setShowAddModal(false);
      setEditingProduct(null);
      // Removed hard reload, using onSnapshot for real-time
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, `products/${editingProduct?.id || ''}`);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
      category: product.category,
      subcategory: product.subcategory || '',
      customizable: product.customizable || false,
      hasNameAndSurname: product.hasNameAndSurname || false,
      hasNameAndSurnameSemAoVivo: product.hasNameAndSurnameSemAoVivo || false,
      isSuaHistoria: product.isSuaHistoria || false,
      allowsCaricatura: product.allowsCaricatura || false,
      sku: product.sku || '',
      detailedDescription: product.detailedDescription || '',
      stock: product.stock || 0,
      variations: product.variations || []
    });
    setNewVariation({ name: '', price: 0, stock: 0 });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    let proceed = false;
    try {
      proceed = window.confirm('Tem certeza que deseja excluir este produto?');
    } catch (e) {
      // confirm is blocked inside cross-origin iframe sandbox in AI Studio, safe fallback to true
      proceed = true;
    }
    if (proceed) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const stockValue = Math.max(0, newStock);
      await updateDoc(doc(db, 'products', id), {
        stock: stockValue
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const handleSyncVitrine = async () => {
    setLoading(true);
    try {
      let count = 0;
      for (const prod of FALLBACK_PRODUCTS) {
        // Check if product already exists (by SKU)
        const exists = products.some(p => p.sku === prod.sku);
        if (!exists) {
          // Add newly synchronized product
          await addDoc(collection(db, 'products'), {
            name: prod.name,
            sku: prod.sku,
            price: prod.price,
            imageUrl: prod.imageUrl,
            category: prod.category,
            subcategory: prod.subcategory || '',
            description: prod.description,
            detailedDescription: prod.detailedDescription || '',
            customizable: prod.customizable,
            isSuaHistoria: prod.isSuaHistoria || false,
            stock: 50, // Initial default stock
            createdAt: new Date().toISOString()
          });
          count++;
        }
      }
      alert(`Sincronização concluída! ${count} novos produtos da vitrine foram cadastrados e integrados com sucesso.`);
    } catch (error) {
      console.error("Error syncing vitrine:", error);
      alert('Erro ao sincronizar produtos da vitrine.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Isso irá cadastrar automaticamente todas as categorias e subcategorias solicitadas. Continuar?')) return;
    
    setLoading(true);
    try {
      const thermalDescription = "A parede dupla de isolamento mantém suas bebidas favoritas quentes ou frias por mais tempo, ideal para qualquer aventura ou rotina diária. Perfeita para os amantes de design único ou para presentear alguém especial, esta garrafa une o encanto visual à praticidade, tornando cada gole uma experiência estelar.\n\n<img src=\"/imagens/admin-detail-1.jpg\" alt=\"Detalhes da Garrafa Térmica\" />\n\n<img src=\"/imagens/admin-detail-2.jpg\" alt=\"Resistência da Garrafa Térmica\" />";
      
      const seedProducts = [
        // GARRAFAS TÉRMICAS
        { name: 'Garrafa MEU JEITO', category: 'garrafas-termicas', subcategory: 'MEU JEITO', sku: 'GT-MEU-JEITO', price: 159.90, customizable: true, isSuaHistoria: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Saúde', category: 'garrafas-termicas', subcategory: 'SAÚDE', sku: 'GT-SAUDE', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Engenharia', category: 'garrafas-termicas', subcategory: 'ENGENHARIA', sku: 'GT-ENG', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Docência', category: 'garrafas-termicas', subcategory: 'DOCÊNCIA', sku: 'GT-DOC', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Advocacia', category: 'garrafas-termicas', subcategory: 'ADVOCACIA', sku: 'GT-ADV', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Contador e ADM', category: 'garrafas-termicas', subcategory: 'CONTADOR e ADM', sku: 'GT-ADM', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa Militar / Polícia', category: 'garrafas-termicas', subcategory: 'MILITAR / POLÍCIA', sku: 'GT-MIL', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800', detailedDescription: thermalDescription },
        { name: 'Garrafa TI', category: 'garrafas-termicas', subcategory: 'TI', sku: 'GT-TI', price: 129.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800', detailedDescription: thermalDescription },
        
        // CANECAS
        { name: 'Caneca Caricatura Cartoon', category: 'canecas', subcategory: 'CARICATURAS', sku: 'CN-CART', price: 69.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura Charge', category: 'canecas', subcategory: 'CARICATURAS', sku: 'CN-CHRG', price: 69.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura em Linhas', category: 'canecas', subcategory: 'CARICATURAS', sku: 'CN-LINE', price: 59.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura em Flat', category: 'canecas', subcategory: 'CARICATURAS', sku: 'CN-FLAT', price: 64.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Logo marca', category: 'canecas', subcategory: 'CARICATURAS', sku: 'CN-LOGO', price: 49.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },

        // ATACADO - GARRAFAS TÉRMICAS
        { name: 'Atacado Logo de empresa ou evento (Térmica)', category: 'atacado', subcategory: 'GARRAFAS TÉRMICAS', price: 89.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800' },
        { name: 'Atacado Caricatura + Logo (Térmica)', category: 'atacado', subcategory: 'GARRAFAS TÉRMICAS', price: 109.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800' },

        // ATACADO - GARRAFAS NÃO TÉRMICAS
        { name: 'Atacado Logo de empresa ou evento (Não Térmica)', category: 'atacado', subcategory: 'GARRAFAS NÃO TÉRMICAS', price: 45.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Atacado Caricatura + logo (Não Térmica)', category: 'atacado', subcategory: 'GARRAFAS NÃO TÉRMICAS', price: 65.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },

        // ATACADO - CANECAS
        { name: 'Atacado Logo de empresa ou evento (Canecas)', category: 'atacado', subcategory: 'CANECAS', price: 29.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Atacado Caricatura + logo (Canecas)', category: 'atacado', subcategory: 'CANECAS', price: 49.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' }
      ];

      for (const prod of seedProducts) {
        await addDoc(collection(db, 'products'), {
          ...prod,
          description: (prod as any).description || 'Produto oficial USE.GAT pré-configurado.',
          stock: 99,
          createdAt: new Date().toISOString()
        });
      }

      alert('Dados semeados com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
      alert('Erro ao semear dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#B48A4E] hover:text-[#4D1D54] transition-colors bg-white px-5 py-2.5 rounded-full border border-brand-pink-light shadow-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para a Loja
            </Link>
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tight text-brand-black mb-2">Painel de Controle</h1>
          <div className="flex gap-4 mt-6 flex-wrap">
            {[
              { id: 'products', label: 'Produtos', icon: Package },
              { id: 'stock', label: 'Estoque & Sincronização', icon: Database },
              { id: 'orders', label: `Pedidos (${orders.length})`, icon: OrderIcon },
              { id: 'coupons', label: `Cupons (${coupons.length})`, icon: Ticket },
              { id: 'categories_manager', label: 'Categorias & Variações', icon: Layers },
              { id: 'customers', label: `Clientes (${customers.length})`, icon: Users },
              { id: 'settings', label: 'Configurações', icon: SettingsIcon },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] font-black uppercase tracking-[0.15em] px-6 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeTab === tab.id ? 'bg-black text-white shadow-lg ring-2 ring-black font-black scale-105' : 'bg-stone-100 text-stone-900 border border-stone-300 hover:bg-stone-200 font-bold'}`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'products' && (
          <div className="flex gap-4">
            <button 
              onClick={handleSyncVitrine}
              className="bg-black text-white px-6 py-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-zinc-850 hover:scale-105 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              Sincronizar Vitrine
            </button>
            <button 
              onClick={handleSeedData}
              className="bg-stone-100 text-stone-900 px-6 py-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all flex items-center gap-2 border border-stone-300 cursor-pointer"
            >
              <Database className="w-3 h-3" />
              Resetar Categorias
            </button>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setNewProduct({
                  name: '',
                  description: '',
                  price: 0,
                  imageUrl: '',
                  category: 'garrafas-termicas',
                  subcategory: '',
                  customizable: false,
                  hasNameAndSurname: false,
                  hasNameAndSurnameSemAoVivo: false,
                  isSuaHistoria: false,
                  allowsCaricatura: false,
                  sku: '',
                  detailedDescription: '',
                  stock: 0,
                  imageUrls: [] as string[],
                  variations: []
                });
                setShowAddModal(true);
              }}
              className="bg-black hover:bg-zinc-800 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform flex items-center shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-3" />
              Novo Produto
            </button>
          </div>
        )}
        {activeTab === 'stock' && (
          <div className="flex gap-4">
            <button 
              onClick={handleSyncVitrine}
              className="bg-black text-white px-6 py-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-zinc-850 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar Vitrine
            </button>
          </div>
        )}
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-zinc-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-xl font-serif font-black text-brand-black italic">Gerenciar Produtos</h2>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setNewProduct({
                  name: '',
                  description: '',
                  price: 0,
                  imageUrl: '',
                  category: 'garrafas-termicas',
                  subcategory: '',
                  customizable: false,
                  hasNameAndSurname: false,
                  hasNameAndSurnameSemAoVivo: false,
                  isSuaHistoria: false,
                  allowsCaricatura: false,
                  sku: '',
                  detailedDescription: '',
                  stock: 0,
                  imageUrls: [] as string[],
                  variations: []
                });
                setShowAddModal(true);
              }}
              className="bg-black hover:bg-zinc-800 text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-xs flex items-center shadow-lg cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 pb-4">
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Imagem</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Produto</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">SKU</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Categoria</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Estoque</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Preço</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-pink-light/30">
                {products.map((p) => (
                  <tr key={p.id} className="group hover:bg-[#FAF7F8] transition-colors">
                    <td className="py-6">
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded-xl bg-white border border-brand-pink-light" />
                    </td>
                    <td className="py-6">
                      <p className="font-bold text-sm text-brand-black">{p.name}</p>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {p.customizable && <span className="text-[7px] font-black uppercase tracking-widest text-brand-pink-strong mt-1">Personalizável</span>}
                        {p.allowsCaricatura && <span className="text-[7px] font-black uppercase tracking-widest text-[#4D1D54] mt-1 font-bold">🎨 Caricatura</span>}
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="text-[10px] font-mono font-black text-brand-primary">{p.sku || '-'}</span>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">{p.category}</span>
                        <span className="text-[8px] font-bold text-brand-gray uppercase opacity-60 tracking-wider">{p.subcategory || '-'}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className={`text-xs font-black ${p.stock <= 5 ? 'text-brand-pink-strong' : 'text-brand-gray'}`}>
                        {p.stock || 0}
                      </span>
                    </td>
                    <td className="py-6 font-black text-xs text-brand-black">{formatPrice(p.price)}</td>
                    <td className="py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(p)} className="p-2 text-brand-pink-medium hover:text-brand-gold transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-brand-pink-medium hover:text-brand-pink-strong transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'stock' ? (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-brand-pink-light">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-serif font-black text-brand-black italic">Sincronização & Controle de Estoque</h2>
              <p className="text-xs text-brand-gray font-medium mt-1">Aumente ou diminua as quantidades dos produtos. O estoque diminui automaticamente após cada venda.</p>
            </div>
            
            {/* Quick search */}
            <div className="relative w-full md:w-64 flex items-center">
              <input 
                type="text" 
                placeholder="Buscar por SKU ou Nome..." 
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-[#FAF7F8] rounded-full pl-10 pr-5 py-3 text-xs font-semibold text-brand-black border border-brand-pink-light focus:outline-none focus:border-brand-gold shadow-inner"
              />
              <Search className="w-4 h-4 text-[#B48A4E] absolute left-3.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 pb-4">
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Imagem</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Produto</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">SKU</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Categoria</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black">Status</th>
                  <th className="pb-4 text-[11px] font-black uppercase tracking-widest text-black text-center">Quantidade em Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-pink-light/30">
                {products
                  .filter(p => {
                    const term = stockSearch.toLowerCase();
                    return p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
                  })
                  .map((p) => {
                    const currentStock = p.stock !== undefined ? p.stock : 0;
                    return (
                      <tr key={p.id} className="group hover:bg-[#FAF7F8] transition-colors">
                        <td className="py-6">
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded-xl bg-white border border-brand-pink-light p-1" />
                        </td>
                        <td className="py-6">
                          <p className="font-bold text-sm text-brand-black">{p.name}</p>
                          <div className="flex gap-1.5 flex-wrap items-center">
                            {p.customizable && <span className="text-[7px] font-black uppercase tracking-widest text-[#4D1D54] mt-1">★ Personalizável</span>}
                            {p.allowsCaricatura && <span className="text-[7px] font-black uppercase tracking-widest text-[#4D1D54] mt-1 font-bold">🎨 Caricatura</span>}
                          </div>
                        </td>
                        <td className="py-6">
                          <span className="text-[10px] font-mono font-black text-brand-pink-strong">{p.sku || '-'}</span>
                        </td>
                        <td className="py-6">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">{p.category}</span>
                            <span className="text-[8px] font-bold text-brand-gray uppercase opacity-60 tracking-wider">{p.subcategory || '-'}</span>
                          </div>
                        </td>
                        <td className="py-6">
                          {currentStock === 0 ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Sem Estoque</span>
                          ) : currentStock <= 5 ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Estoque Baixo ({currentStock})</span>
                          ) : (
                            <span className="bg-[#E8F5E9] text-green-700 border border-green-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Disponível</span>
                          )}
                        </td>
                        <td className="py-6">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleUpdateStock(p.id, currentStock - 1)}
                              disabled={currentStock <= 0}
                              className="w-10 h-10 select-none border border-brand-pink-light rounded-full flex items-center justify-center font-bold text-lg bg-white active:bg-brand-pink-light hover:bg-[#FAF7F8] transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            
                            <input 
                              type="number" 
                              min="0"
                              value={currentStock}
                              onChange={(e) => handleUpdateStock(p.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center py-2 bg-[#FAF7F8] font-black text-sm text-brand-black rounded-lg border border-brand-pink-light focus:outline-none focus:border-brand-gold shadow-inner"
                            />
                            
                            <button 
                              onClick={() => handleUpdateStock(p.id, currentStock + 1)}
                              className="w-10 h-10 select-none border border-brand-pink-light rounded-full flex items-center justify-center font-bold text-lg bg-white active:bg-brand-pink-light hover:bg-[#FAF7F8] transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {products.filter(p => {
                  const term = stockSearch.toLowerCase();
                  return p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
                }).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-semibold text-brand-gray uppercase tracking-widest">
                       Nenhum produto correspondente encontrado para "{stockSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-brand-pink-light relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-pink-light/20 rounded-full -mr-12 -mt-12"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="font-serif font-black text-lg text-brand-black italic">Pedido #{order.id.slice(-6)}</h3>
                  <p className="text-[9px] font-bold text-brand-gray uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <select 
                  value={order.status || 'PENDENTE'}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="bg-brand-pink-light text-brand-pink-strong px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer border border-brand-pink-medium/20"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="PRODUÇÃO">PRODUÇÃO</option>
                  <option value="ENVIADO">ENVIADO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div className="space-y-4 mb-8">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-[#FAF7F8] p-4 rounded-3xl border border-brand-pink-light/30">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain bg-white rounded-xl border border-brand-pink-light p-2" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-brand-black">{item.name}</p>
                      <p className="text-[9px] font-bold text-brand-gray uppercase mt-1">{item.quantity}x {formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-6 border-y border-brand-pink-light/30 mb-8">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-gray">Valor Total</span>
                <span className="text-xl font-serif font-black text-brand-pink-strong">{formatPrice(order.total)}</span>
              </div>

              {/* Bling & Melhor Envio Integration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-gold">Bling (Nota Fiscal)</p>
                  {order.bling_nfe_number ? (
                    <div className="bg-[#E8F5E9] p-4 rounded-2xl border border-green-200">
                      <p className="text-[9px] font-black text-green-700 uppercase">Nota: {order.bling_nfe_number}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => generateNFe(order.id)}
                      className="w-full bg-[#FAF7F8] text-[9px] font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-brand-pink-strong hover:text-white transition-all border border-brand-pink-light"
                    >
                      Emitir Nota
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-gold">Melhor Envio (Etiqueta)</p>
                  {order.melhorenvio_label_id ? (
                    <div className="bg-[#E3F2FD] p-4 rounded-2xl border border-blue-200">
                      <p className="text-[9px] font-black text-blue-700 uppercase">Rastreio: {order.melhorenvio_tracking_code || 'Gerado'}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => generateLabel(order.id)}
                      className="w-full bg-[#FAF7F8] text-[9px] font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-brand-gold hover:text-white transition-all border border-brand-pink-light"
                    >
                      Gerar Etiqueta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'settings' ? (
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-pink-light max-w-4xl space-y-12">
          <div>
            <h2 className="text-3xl font-serif font-black text-brand-black italic">Editor do Site em Tempo Real</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest mt-2">Personalize completamente a vitrine, as cores, fontes, vídeos e integrações do seu ateliê</p>
            <div className="w-24 h-1 bg-brand-gold mt-4 rounded-full"></div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* ACCORDION 1: IDENTIDADE VISUAL */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🎨 01. Identidade Visual & Tipografia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Título do Site (Branding)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    value={settings.site_title || ''}
                    onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                    placeholder="USE GAT"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Suubtítulo do Site</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    value={settings.site_subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, site_subtitle: e.target.value })}
                    placeholder="Não estampamos apenas, contamos histórias"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Estilo de Fonte (Tipografia)</label>
                  <select
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all appearance-none"
                    value={settings.font_family || 'Inter'}
                    onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                  >
                    {['Inter', 'Space Grotesk', 'Playfair Display', 'Outfit', 'JetBrains Mono', 'Montserrat', 'Lora', 'Fredoka', 'Cinzel'].map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Cor Principal do Site (Textos/Botões)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-12 bg-white border border-brand-pink-light rounded-2xl p-1 outline-none cursor-pointer"
                      value={settings.primary_color || '#4D1D54'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    />
                    <input
                      className="flex-grow bg-white border border-brand-pink-light rounded-2xl px-4 py-3 text-xs font-mono outline-none focus:border-brand-gold"
                      value={settings.primary_color || '#4D1D54'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Cor de Destaque Boho (Dourado/Metal)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-12 bg-white border border-brand-pink-light rounded-2xl p-1 outline-none cursor-pointer"
                      value={settings.accent_color || '#B48A4E'}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    />
                    <input
                      className="flex-grow bg-white border border-brand-pink-light rounded-2xl px-4 py-3 text-xs font-mono outline-none focus:border-brand-gold"
                      value={settings.accent_color || '#B48A4E'}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Fundo Alternativo Boho (Off-white/Bege)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-12 h-12 bg-white border border-brand-pink-light rounded-2xl p-1 outline-none cursor-pointer"
                      value={settings.secondary_color || '#FAF7F8'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    />
                    <input
                      className="flex-grow bg-white border border-brand-pink-light rounded-2xl px-4 py-3 text-xs font-mono outline-none focus:border-brand-gold"
                      value={settings.secondary_color || '#FAF7F8'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACCORDION 2: BANNER PRINCIPAL HERO */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🌟 02. Banner de Entrada (Seção Hero)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Título Principal do Banner</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.banner_title || ''}
                    onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                    placeholder="Não estampamos apenas, contamos histórias"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Frase Grifada em Itálico (Ex: contamos histórias)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.banner_bold_text || ''}
                    onChange={(e) => setSettings({ ...settings, banner_bold_text: e.target.value })}
                    placeholder="contamos histórias"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Descrição Explicativa das Memórias</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold resize-none"
                    value={settings.banner_desc || ''}
                    onChange={(e) => setSettings({ ...settings, banner_desc: e.target.value })}
                    placeholder="Somos especialistas em transformar suas memórias..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Texto do Botão de Ação</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.banner_btn_text || ''}
                    onChange={(e) => setSettings({ ...settings, banner_btn_text: e.target.value })}
                    placeholder="CRIAR MINHA GARRAFA"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-pink-medium/10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]/75">Imagem 1 (Principal - Quadro de Destaque)</h4>
                    <div className="flex flex-col gap-2 bg-[#FAF7F8]/80 p-4 rounded-2xl border border-brand-pink-light">
                      <input
                        className="w-full bg-white border border-brand-pink-light rounded-xl p-3 text-xs font-mono outline-none focus:border-brand-gold"
                        value={settings.banner_img_1 || ''}
                        onChange={(e) => setSettings({ ...settings, banner_img_1: e.target.value })}
                        placeholder="URL da Imagem ou faça upload abaixo..."
                      />
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center">
                          📁 Carregar do Dispositivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'banner_img_1')} 
                          />
                        </label>
                        {settings.banner_img_1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-green-600 font-bold">✓ Carregada</span>
                            <button 
                              type="button" 
                              onClick={() => setSettings({ ...settings, banner_img_1: '' })} 
                              className="text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                      {settings.banner_img_1 && (
                        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-stone-200 bg-white shadow-sm flex items-center justify-center">
                          <img 
                            src={settings.banner_img_1} 
                            alt="Preview Banner 1" 
                            className="max-w-full max-h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                    <input
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                      value={settings.banner_img_1_name || ''}
                      onChange={(e) => setSettings({ ...settings, banner_img_1_name: e.target.value })}
                      placeholder="Nome do produto (Ex: Garrafa Sua História)"
                    />
                    <input
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                      value={settings.banner_img_1_tag || ''}
                      onChange={(e) => setSettings({ ...settings, banner_img_1_tag: e.target.value })}
                      placeholder="Etiqueta rústica (Ex: 🌿 Rústico & Boho Chic)"
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54]/75">Imagem 2 (Segunda Imagem - Atrás)</h4>
                    <div className="flex flex-col gap-2 bg-[#FAF7F8]/80 p-4 rounded-2xl border border-brand-pink-light">
                      <input
                        className="w-full bg-white border border-brand-pink-light rounded-xl p-3 text-xs font-mono outline-none focus:border-brand-gold"
                        value={settings.banner_img_2 || ''}
                        onChange={(e) => setSettings({ ...settings, banner_img_2: e.target.value })}
                        placeholder="URL da Imagem ou faça upload abaixo..."
                      />
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center">
                          📁 Carregar do Dispositivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'banner_img_2')} 
                          />
                        </label>
                        {settings.banner_img_2 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-green-600 font-bold">✓ Carregada</span>
                            <button 
                              type="button" 
                              onClick={() => setSettings({ ...settings, banner_img_2: '' })} 
                              className="text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                      {settings.banner_img_2 && (
                        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-stone-200 bg-white shadow-sm flex items-center justify-center">
                          <img 
                            src={settings.banner_img_2} 
                            alt="Preview Banner 2" 
                            className="max-w-full max-h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                    <input
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                      value={settings.banner_img_2_name || ''}
                      onChange={(e) => setSettings({ ...settings, banner_img_2_name: e.target.value })}
                      placeholder="Nome do produto (Ex: Caneca Minimalista)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACCORDION 3: QUEM SOMOS */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🌿 03. Quem Somos (Nossa Essência)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Título de Apresentação</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.about_title || ''}
                    onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                    placeholder="Nossa Essência Boho & Afeto"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Texto Institucional Teledirigido</label>
                  <textarea
                    rows={4}
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold leading-relaxed resize-none"
                    value={settings.about_text || ''}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    placeholder="A USE GAT nasceu do desejo de eternizar..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Imagem da Seção (Sobre Nós / Quem Somos)</label>
                  <div className="flex flex-col gap-2 bg-[#FAF7F8]/80 p-4 rounded-2xl border border-brand-pink-light">
                    <input
                      className="w-full bg-white border border-brand-pink-light rounded-xl p-3 text-xs font-mono outline-none focus:border-brand-gold"
                      value={settings.about_image || ''}
                      onChange={(e) => setSettings({ ...settings, about_image: e.target.value })}
                      placeholder="URL da Imagem ou faça upload abaixo..."
                    />
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center">
                        📁 Carregar do Dispositivo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'about_image')} 
                        />
                      </label>
                      {settings.about_image && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-green-600 font-bold">✓ Carregada</span>
                          <button 
                            type="button" 
                            onClick={() => setSettings({ ...settings, about_image: '' })} 
                            className="text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                    {settings.about_image && (
                      <div className="mt-2 w-32 h-24 rounded-lg overflow-hidden border border-stone-200 bg-white shadow-sm flex items-center justify-center">
                        <img 
                          src={settings.about_image} 
                          alt="Preview Quem Somos" 
                          className="max-w-full max-h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACCORDION 4: COMO PERSONALIZAR SEU PEDIDO */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                📦 04. Como Personalizar seu Pedido (Passo a Passo)
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-brand-gold/10">
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 01: Título</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_1_title || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_1_title: e.target.value })}
                      placeholder="Escolha o Produto"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 01: Descrição</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_1_desc || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_1_desc: e.target.value })}
                      placeholder="Navegue pelo nosso catálogo de Garrafas..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-brand-gold/10">
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 02: Título</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_2_title || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_2_title: e.target.value })}
                      placeholder="Preencha a História"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 02: Descrição</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_2_desc || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_2_desc: e.target.value })}
                      placeholder="Digite os nomes, profissões, fóbias..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-brand-gold/10">
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 03: Título</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_3_title || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_3_title: e.target.value })}
                      placeholder="Produção e Afeto"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-brand-gold mb-1 block">Passo 03: Descrição</label>
                    <input
                      className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                      value={settings.custom_step_3_desc || ''}
                      onChange={(e) => setSettings({ ...settings, custom_step_3_desc: e.target.value })}
                      placeholder="Nossos designers criam a arte perfeita..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACCORDION 5: VÍDEOS */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🎥 05. Integração de Vídeo (Destaque do Feed)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">URL do Vídeo (YouTube Embed/Vimeo / Reels Embed)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none focus:border-brand-gold"
                    value={settings.video_url_1 || ''}
                    onChange={(e) => setSettings({ ...settings, video_url_1: e.target.value })}
                    placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  />
                  <span className="text-[9px] text-brand-gray font-bold uppercase mt-1.5 block">Insira links de incorporação seguros em formato 'embed'</span>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Título do Vídeo</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.video_title_1 || ''}
                    onChange={(e) => setSettings({ ...settings, video_title_1: e.target.value })}
                    placeholder="Como Nossas Histórias Ganham Vida a Laser"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Descrição Secundária</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.video_desc_1 || ''}
                    onChange={(e) => setSettings({ ...settings, video_desc_1: e.target.value })}
                    placeholder="Assista ao processo autêntico de gravação computadorizada a laser..."
                  />
                </div>
              </div>
            </div>

            {/* ACCORDION 6: DÚVIDAS FREQUENTES FAQ */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🙋 06. Dúvidas Frequentes (FAQ Sanfona)
              </h3>
              <div className="space-y-6">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => {
                  const currentFaq = (settings.faqs && settings.faqs[index]) || { q: '', a: '' };
                  const handleFaqChange = (key: 'q' | 'a', val: string) => {
                    const upFaqs = [...(settings.faqs || [])];
                    while (upFaqs.length <= index) {
                      upFaqs.push({ q: '', a: '' });
                    }
                    upFaqs[index] = { ...upFaqs[index], [key]: val };
                    setSettings({ ...settings, faqs: upFaqs });
                  };

                  return (
                    <div key={index} className="bg-white p-4 rounded-2xl border border-brand-gold/10 space-y-3">
                      <span className="text-[9px] font-extrabold text-brand-gold uppercase">Pergunta {index + 1}</span>
                      <input
                        className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                        value={currentFaq.q}
                        onChange={(e) => handleFaqChange('q', e.target.value)}
                        placeholder={`Pergunta ${index + 1}`}
                      />
                      <textarea
                        rows={2}
                        className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold leading-normal resize-none"
                        value={currentFaq.a}
                        onChange={(e) => handleFaqChange('a', e.target.value)}
                        placeholder={`Resposta ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACCORDION 7: GALERIA DO INSTAGRAM */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                📸 07. Coleção de Imagens e Links do Instagram
              </h3>
              <div className="space-y-6">
                {[0, 1, 2].map((index) => {
                  const currentPost = (settings.instagram_posts && settings.instagram_posts[index]) || {
                    title: '', img: '', link: '', views: '', likes: '', desc: ''
                  };
                  
                  const handlePostChange = (key: string, val: string) => {
                    const upGrid = [...(settings.instagram_posts || [])];
                    while (upGrid.length <= index) {
                      upGrid.push({ title: '', img: '', link: '', views: '', likes: '', desc: '' });
                    }
                    upGrid[index] = { ...upGrid[index], [key]: val };
                    setSettings({ ...settings, instagram_posts: upGrid });
                  };

                  return (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-brand-gold/10 space-y-4">
                      <span className="text-[9px] font-extrabold text-[#4D1D54] uppercase block border-b pb-2">Postagem {index + 1} Instagram</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase">Título da Postagem</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                            value={currentPost.title}
                            onChange={(e) => handlePostChange('title', e.target.value)}
                            placeholder="Caneca Rostinho Boho"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase font-black">URL da Imagem</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-mono"
                            value={currentPost.img}
                            onChange={(e) => handlePostChange('img', e.target.value)}
                            placeholder="https://i.postimg.cc/..."
                          />
                          <div className="flex items-center gap-3 mt-1.5">
                            <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full text-center">
                              📁 Carregar Imagem
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert("A imagem selecionada é muito grande! Escolha um arquivo menor de 5MB.");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    const base64String = uploadEvent.target?.result as string;
                                    const img = new Image();
                                    img.src = base64String;
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      let width = img.width;
                                      let height = img.height;
                                      const MAX_SIZE = 1200;
                                      if (width > MAX_SIZE || height > MAX_SIZE) {
                                        if (width > height) {
                                          height = Math.round((height * MAX_SIZE) / width);
                                          width = MAX_SIZE;
                                        } else {
                                          width = Math.round((width * MAX_SIZE) / height);
                                          height = MAX_SIZE;
                                        }
                                      }
                                      canvas.width = width;
                                      canvas.height = height;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, width, height);
                                        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                                        fetch('/api/upload', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ image: optimizedBase64 }),
                                        })
                                        .then(res => {
                                          if (!res.ok) throw new Error("Falha no upload");
                                          return res.json();
                                        })
                                        .then(data => {
                                          handlePostChange('img', data.imageUrl);
                                        })
                                        .catch(err => {
                                          console.error("Local upload failed, keeping base64 as fallback:", err);
                                          handlePostChange('img', optimizedBase64);
                                        });
                                      }
                                    };
                                  };
                                  reader.readAsDataURL(file);
                                }} 
                              />
                            </label>
                            {currentPost.img && (
                              <span className="text-[10px] text-green-600 font-bold">✓ Carregada</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase">Link de Redirecionamento (Reel/Post)</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-mono"
                            value={currentPost.link}
                            onChange={(e) => handlePostChange('link', e.target.value)}
                            placeholder="https://www.instagram.com/p/..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase">Contador de Visualizações (Ex: 240.000+)</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                            value={currentPost.views}
                            onChange={(e) => handlePostChange('views', e.target.value)}
                            placeholder="240.000+ visualizações"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase">Contador de Likes (Ex: 24k curtidas)</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                            value={currentPost.likes}
                            onChange={(e) => handlePostChange('likes', e.target.value)}
                            placeholder="24k curtidas"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-brand-gold mb-1 block uppercase">Resumo / Legenda Curta Boho</label>
                          <input
                            className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                            value={currentPost.desc}
                            onChange={(e) => handlePostChange('desc', e.target.value)}
                            placeholder="Os bastidores da nossa embalagem rústica..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACCORDION 8: POLÍTICAS E PAGAMENTO */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                ⚖️ 08. Políticas, Prazos & Informações de Pagamento
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Dias Estimados para Produção (Ex: 5 a 7 dias úteis)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.policy_production_days || ''}
                    onChange={(e) => setSettings({ ...settings, policy_production_days: e.target.value })}
                    placeholder="5 a 7 dias úteis"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Texto explicativo de Política de Devoluções</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold resize-none"
                    value={settings.policy_returns_text || ''}
                    onChange={(e) => setSettings({ ...settings, policy_returns_text: e.target.value })}
                    placeholder="Por serem peças totalmente exclusivas e personalizadas..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Texto explicativo de Condições de Envio</label>
                  <textarea
                    rows={2}
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold resize-none"
                    value={settings.policy_delivery_text || ''}
                    onChange={(e) => setSettings({ ...settings, policy_delivery_text: e.target.value })}
                    placeholder="O prazo de entrega varia de acordo com seu CEP..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Detalhes de Formas de Pagamento Admissíveis</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold resize-none"
                    value={settings.payment_methods_text || ''}
                    onChange={(e) => setSettings({ ...settings, payment_methods_text: e.target.value })}
                    placeholder="Aceitamos Pix com 10% de desconto automático, além de todos os cartões..."
                  />
                </div>
              </div>
            </div>

            {/* ACCORDION 9: CONTATOS & ATENDIMENTO */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                📞 09. Suporte, Atendimento & Contatos Rápidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">WhatsApp Oficial (Apenas números + DDI + DDD)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none focus:border-brand-gold"
                    value={settings.whatsapp || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    placeholder="552140402224"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Username Instagram (Sem @)</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-normal outline-none focus:border-brand-gold"
                    value={settings.instagram || ''}
                    onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                    placeholder="use.gat"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Telefone de Contato Formatado</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="(21) 4040-2224"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">E-mail Comercial Oficial</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="contato@usegat.com.br"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Endereço de Retirada / Sede Física</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Brasília - DF"
                  />
                </div>
              </div>
            </div>

            {/* ACCORDION 10: INTEGRAÇÕES */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-pink-strong flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
                🔗 10. Chaves de Integrações (Bling ERP V3, Melhor Envio, PagBank)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Bling V3: API App URL</label>
                  <input
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none"
                    value={settings.bling_api_url || 'https://api.bling.com.br'}
                    onChange={(e) => setSettings({ ...settings, bling_api_url: e.target.value })}
                    placeholder="https://api.bling.com.br"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Bling V3: API Key / Client Secret</label>
                  <input
                    type="password"
                    className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none"
                    value={settings.bling_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, bling_api_key: e.target.value })}
                    placeholder="••••••••••••••••••••••••••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-brand-pink-medium/10 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Melhor Envio: Token de Acesso</label>
                    <input
                      type="password"
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none"
                      value={settings.melhorenvio_token || ''}
                      onChange={(e) => setSettings({ ...settings, melhorenvio_token: e.target.value })}
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="melhorenvio_sandbox"
                      className="w-4 h-4 text-brand-primary"
                      checked={!!settings.melhorenvio_sandbox}
                      onChange={(e) => setSettings({ ...settings, melhorenvio_sandbox: e.target.checked })}
                    />
                    <label htmlFor="melhorenvio_sandbox" className="text-[10px] font-black uppercase tracking-widest text-brand-gold cursor-pointer">Melhor Envio Modo Testes (Sandbox)</label>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-pink-medium/10 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] mb-2 block">PagBank / PIX Banco Token</label>
                    <input
                      type="password"
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-mono outline-none"
                      value={settings.pagbank_token || ''}
                      onChange={(e) => setSettings({ ...settings, pagbank_token: e.target.value })}
                      placeholder="••••••••••••••••••••••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACCORDION 11: CUSTOMIZAÇÃO DE SANFONAS (RODAPÉ) */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-8 bg-[#FAF7F8]/40 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4 mb-2">
                  ⚙️ 11. Customização das Sanfonas do Rodapé (Informações, Termos & Políticas)
                </h3>
                <p className="text-xs text-brand-gray leading-relaxed mb-6">
                  Personalize totalmente o conteúdo das 8 abas expansíveis localizadas no final do rodapé. 
                  Você pode escolher entre manter o layout padrão do sistema (padrão artesanal Boho), substituir por 
                  um texto explicativo personalizado de qualquer tamanho ou carregar uma imagem/banner completo que irá substituir 
                  inteiramente o conteúdo daquela aba para exibição imediata e em tempo real!
                </p>
              </div>

              {[
                { id: 'use_gat', label: 'Use Gat' },
                { id: 'atendimento', label: 'Atendimento' },
                { id: 'quem_somos', label: 'Quem Somos' },
                { id: 'como_personalizar', label: 'Como Personalizar' },
                { id: 'duvidas_frequentes', label: 'Dúvidas Frequentes' },
                { id: 'politicas_termos', label: 'Políticas e Prazos' },
                { id: 'pagamento', label: 'Formas de Pagamento' },
                { id: 'seguro', label: 'Ambiente Seguro' }
              ].map((item) => {
                const typeKey = `acc_${item.id}_type`;
                const textKey = `acc_${item.id}_text`;
                const imgKey = `acc_${item.id}_image`;
                const currentType = settings[typeKey] || 'default';

                return (
                  <div key={item.id} className="p-5 bg-white rounded-2xl border border-brand-pink-light space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FAF7F8] pb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                        <span className="text-[#8C6A3B]">✦</span> Sanfona: {item.label}
                      </h4>
                      <select
                        className="bg-[#FAF7F8] border border-brand-pink-light rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider outline-none text-[#4D1D54] focus:border-brand-gold cursor-pointer"
                        value={currentType}
                        onChange={(e) => setSettings({ ...settings, [typeKey]: e.target.value })}
                      >
                        <option value="default">Padrão do Sistema (Boho)</option>
                        <option value="text">Texto/Frase Personalizada</option>
                        <option value="image">Imagem/Banner Completo</option>
                      </select>
                    </div>

                    {currentType === 'text' && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-gold">Frase ou Texto da Seção {item.label}</label>
                        <textarea
                          rows={4}
                          className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3.5 text-xs font-medium outline-none focus:border-brand-gold leading-relaxed"
                          value={settings[textKey] || ''}
                          onChange={(e) => setSettings({ ...settings, [textKey]: e.target.value })}
                          placeholder={`Escreva aqui o texto explicativo ou frases personalizadas para a aba de ${item.label}...`}
                        />
                      </div>
                    )}

                    {currentType === 'image' && (
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#4D1D54]/75 block">Imagem Completa / Banner para {item.label}</label>
                        <div className="flex flex-col gap-2 bg-[#FAF7F8] p-4 rounded-xl border border-brand-pink-light">
                        <div className="flex flex-col gap-2">
                          {(Array.isArray(settings[imgKey]) ? settings[imgKey] : (settings[imgKey] ? [settings[imgKey]] : [])).map((imgUrl: string, idx: number) => (
                            <div key={idx} className="relative group w-full">
                              <input
                                className="w-full bg-white border border-brand-pink-light rounded-lg p-2.5 text-xs font-mono outline-none focus:border-brand-gold pr-16"
                                value={imgUrl}
                                onChange={(e) => {
                                    const newArray = [...(Array.isArray(settings[imgKey]) ? settings[imgKey] : (settings[imgKey] ? [settings[imgKey]] : []))];
                                    newArray[idx] = e.target.value;
                                    setSettings({ ...settings, [imgKey]: newArray });
                                }}
                                placeholder="URL da Imagem..."
                              />
                               <button 
                                  type="button" 
                                  onClick={() => {
                                      const newArray = [...(Array.isArray(settings[imgKey]) ? settings[imgKey] : (settings[imgKey] ? [settings[imgKey]] : []))];
                                      newArray.splice(idx, 1);
                                      setSettings({ ...settings, [imgKey]: newArray });
                                  }} 
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                                >
                                  Remover
                                </button>
                            </div>
                          ))}
                        </div>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center">
                              📁 Adicionar Imagem
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    if (file.size > 5 * 1024 * 1024) {
                                      alert("A imagem selecionada é muito grande! Escolha um arquivo menor de 5MB.");
                                      return;
                                    }

                                    const reader = new FileReader();
                                    reader.onload = (uploadEvent) => {
                                        const base64String = uploadEvent.target?.result as string;
                                        const current = Array.isArray(settings[imgKey]) ? settings[imgKey] : (settings[imgKey] ? [settings[imgKey]] : []);
                                        setSettings((prev: any) => ({ ...prev, [imgKey]: [...current, base64String] }));

                                        const img = new Image();
                                        img.src = base64String;
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          let width = img.width;
                                          let height = img.height;
                                          const MAX_SIZE = 1200;
                                          if (width > MAX_SIZE || height > MAX_SIZE) {
                                            if (width > height) {
                                              height = Math.round((height * MAX_SIZE) / width);
                                              width = MAX_SIZE;
                                            } else {
                                              width = Math.round((width * MAX_SIZE) / height);
                                              height = MAX_SIZE;
                                            }
                                          }
                                          canvas.width = width;
                                          canvas.height = height;
                                          const ctx = canvas.getContext('2d');
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0, width, height);
                                            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                                            
                                            fetch('/api/upload', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ image: optimizedBase64 })
                                            })
                                            .then(res => res.json())
                                            .then(data => {
                                              if (data.imageUrl) {
                                                setSettings((prev: any) => {
                                                  const currentList = Array.isArray(prev[imgKey]) ? prev[imgKey] : (prev[imgKey] ? [prev[imgKey]] : []);
                                                  const cleanList = currentList.map(url => url === base64String ? data.imageUrl : url);
                                                  return { ...prev, [imgKey]: cleanList };
                                                });
                                              }
                                            })
                                            .catch(err => {
                                              console.error("Local configuration upload failed:", err);
                                            });
                                          }
                                        };
                                    };
                                    reader.readAsDataURL(file);
                                }} 
                              />
                            </label>
                          </div>
                          {settings[imgKey] && (
                            <div className="flex flex-col gap-2 mt-2">
                              {(Array.isArray(settings[imgKey]) ? settings[imgKey] : [settings[imgKey]]).filter(Boolean).map((imgUrl, i) => (
                                <div key={i} className="max-w-xs rounded-lg overflow-hidden border border-stone-200 bg-white shadow-xs p-1 flex items-center justify-center">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Preview ${item.label} ${i + 1}`} 
                                    className="max-w-full max-h-40 object-contain rounded" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACCORDION 12: CONFIGURAÇÃO DE CARICATURAS (OPCIONAL) */}
            <div className="border border-brand-gold/15 rounded-3xl p-6 md:p-8 space-y-6 bg-[#FAF7F8]/40 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#8C6A3B] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4 mb-2">
                  🎨 12. Configuração de Caricaturas (Explicação & Preços)
                </h3>
                <p className="text-xs text-brand-gray leading-relaxed">
                  Gerencie a imagem explicativa dos estilos de caricatura (Realista, Cartoon, Charge, Flat) e os valores cobrados por cada opção no formulário opcional do produto.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-brand-gold/10">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] mb-1.5 block">
                      Imagem Explicativa de Estilos
                    </label>
                    <p className="text-[10px] text-gray-500 mb-3 leading-normal">
                      Insira uma URL ou faça upload de uma foto que mostra aos seus clientes os estilos disponíveis (Realista, Cartoon, Charge, Flat).
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-grow bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-mono outline-none"
                        value={settings.caricatura_explaining_image || ''}
                        onChange={(e) => setSettings({ ...settings, caricatura_explaining_image: e.target.value })}
                        placeholder="Ex: https://firebasestorage.googleapis.com/..."
                      />
                      <label className="bg-[#4D1D54] text-white hover:opacity-90 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center shrink-0">
                        📁 Enviar Imagem
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Escolha uma imagem menor de 5MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (uploadEvt) => {
                              const base64 = uploadEvt.target?.result as string;
                              const img = new Image();
                              img.src = base64;
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;
                                const MAX = 1200;
                                if (width > MAX || height > MAX) {
                                  if (width > height) {
                                    height = Math.round((height * MAX) / width);
                                    width = MAX;
                                  } else {
                                    width = Math.round((width * MAX) / height);
                                    height = MAX;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const optBase64 = canvas.toDataURL('image/jpeg', 0.82);
                                  fetch('/api/upload', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ image: optBase64 })
                                  })
                                  .then(res => res.json())
                                  .then(data => {
                                    setSettings(prev => ({ ...prev, caricatura_explaining_image: data.imageUrl }));
                                  })
                                  .catch(err => {
                                    console.error("Upload erro, usando base64:", err);
                                    setSettings(prev => ({ ...prev, caricatura_explaining_image: optBase64 }));
                                  });
                                }
                              };
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#8C6A3B] mb-1 block">Preço 1 Imagem (R$)</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                        value={settings.caricatura_price_1 || '19.90'}
                        onChange={(e) => setSettings({ ...settings, caricatura_price_1: e.target.value })}
                        placeholder="19.90"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#8C6A3B] mb-1 block">Preço 2 Imagens (R$)</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-xl p-3 text-xs font-bold"
                        value={settings.caricatura_price_2 || '39.80'}
                        onChange={(e) => setSettings({ ...settings, caricatura_price_2: e.target.value })}
                        placeholder="39.80"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-dashed border-[#4D1D54]/20 p-4 rounded-xl flex flex-col justify-center items-center bg-white">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6A3B] mb-3">Prévia da Explicação</span>
                  {settings.caricatura_explaining_image ? (
                    <div className="max-w-full max-h-56 overflow-hidden rounded-lg border border-stone-200 shadow-sm bg-white p-1">
                      <img
                        src={settings.caricatura_explaining_image}
                        alt="Prévia de Caricaturas"
                        className="max-w-full max-h-48 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-6 text-stone-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-semibold">Nenhuma imagem carregada. Será usado o infográfico ou layout padrão do site.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-zinc-800 text-white py-6 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-white" />
              SALVAR CONFIGURAÇÕES DO PAINEL
            </button>
          </form>

          <div className="mt-16 pt-12 border-t border-brand-pink-light">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-brand-pink-strong">
              <Database className="w-4 h-4" />
              Banco de Dados & Autenticação de Bling ERP
            </h3>
            <div className="bg-[#FAF7F8] p-8 rounded-[30px] border border-brand-pink-light">
              <p className="text-[10px] font-bold text-brand-gray uppercase mb-6 leading-relaxed">
                Utilize os dados de acesso fornecidos para ativar o envio automático de notas fiscais.
                Configure o Redirect URI como <code className="bg-white px-2 py-1 rounded select-all font-mono">https://usegat.com</code> no painel do Bling.
              </p>
              <button 
                type="button"
                onClick={exchangeBlingCode}
                className="bg-white text-brand-pink-strong border border-brand-pink-medium px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-brand-pink-strong hover:text-white transition-all shadow-sm"
              >
                Vincular Conta Bling V3
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'coupons' ? (
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-pink-light space-y-12">
          <div>
            <h2 className="text-3xl font-serif font-black text-brand-black italic">Gerenciador de Cupons</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest mt-2">Crie e desative cupons de desconto por valor fixo ou percentual aplicado em tempo real no site</p>
            <div className="w-24 h-1 bg-[#B48A4E] mt-4 rounded-full"></div>
          </div>

          <form onSubmit={handleAddCoupon} className="bg-[#FAF7F8]/40 border border-brand-pink-medium/20 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#4D1D54] flex items-center gap-2 border-b border-brand-pink-medium/10 pb-4">
              🎟️ Criar Novo Cupom
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Código do Cupom</label>
                <input
                  required
                  type="text"
                  placeholder="EX: COMPRA10"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Tipo de Desconto</label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as any)}
                  className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all appearance-none"
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="value">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2 block">Valor do Desconto</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="0.00"
                  value={newCouponValue || ''}
                  onChange={(e) => setNewCouponValue(Number(e.target.value))}
                  className="w-full bg-white border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[#4D1D54] text-white py-4 rounded-full font-black uppercase tracking-widest text-[9px] shadow-md hover:bg-[#6c2877] transition-all"
            >
              Criar Cupom de Desconto
            </button>
          </form>

          <div className="bg-white rounded-[40px] p-2 shadow-sm border border-brand-pink-light">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic p-6">Cupons Ativos & Histórico</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-pink-light pb-4">
                    <th className="pb-4 pl-6 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Código</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Tipo</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Desconto</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Status</th>
                    <th className="pb-4 pr-6 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink-light/30">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="group hover:bg-[#FAF7F8] transition-colors">
                      <td className="py-6 pl-6 font-bold text-sm text-brand-primary tracking-wider uppercase">{coupon.code}</td>
                      <td className="py-6 text-xs text-brand-gray font-medium uppercase">
                        {coupon.type === 'percentage' ? 'Porcentagem' : 'Valor Fixo'}
                      </td>
                      <td className="py-6 text-xs font-black text-brand-black">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                      </td>
                      <td className="py-6">
                        <button
                          onClick={() => handleToggleCouponActive(coupon.id, coupon.active)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                            coupon.active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {coupon.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-6 pr-6 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-500 hover:text-red-700 p-2 transition-colors inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs font-bold text-brand-gray uppercase tracking-widest">
                        Nenhum cupom cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'categories_manager' ? (
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-brand-pink-light space-y-12">
          <div>
            <h2 className="text-3xl font-serif font-black text-brand-black italic">Categorias, Subcategorias e Variações</h2>
            <p className="text-xs text-brand-gray font-medium uppercase tracking-widest mt-2">Gerencie toda a estrutura do catálogo do site em tempo real, sincronizado diretamente com o banco de dados</p>
            <div className="w-24 h-1 bg-[#B48A4E] mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* COLUMN 1: CATEGORIES */}
            <div className="space-y-6">
              <div className="border border-brand-pink-medium/20 bg-[#FAF7F8]/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b border-brand-pink-medium/10 pb-2">
                  📁 {editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
                </h3>
                <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Código / Slug (Fixo)</label>
                    <input
                      required
                      type="text"
                      disabled={!!editingCategory}
                      placeholder="Ex: canecas"
                      value={editingCategory ? editingCategory.id : newCatId}
                      onChange={(e) => editingCategory ? null : setNewCatId(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Nome da Categoria</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Canecas Exclusivas"
                      value={editingCategory ? editingCategory.name : newCatName}
                      onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCatName(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Descrição</label>
                    <textarea
                      placeholder="Ex: Canecas feitas à mão..."
                      value={editingCategory ? editingCategory.description : newCatDesc}
                      onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, description: e.target.value }) : setNewCatDesc(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-800 transition-all cursor-pointer"
                    >
                      {editingCategory ? 'Salvar' : 'Adicionar'}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="bg-stone-100 text-stone-600 border border-stone-200 px-4 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gray mb-2">Categorias Ativas ({dbCategories.length})</h4>
                <div className="space-y-3">
                  {dbCategories.map((cat) => (
                    <div key={cat.id} className="bg-white border border-brand-pink-light/60 hover:border-brand-gold/60 rounded-2xl p-4 flex justify-between items-start transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-black">{cat.name}</span>
                          <span className="text-[8px] font-mono bg-stone-100 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md uppercase text-[7px]">{cat.id}</span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-brand-gray font-medium mt-1 line-clamp-2">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => setEditingCategory({ id: cat.id, name: cat.name, description: cat.description || '' })}
                          className="text-[#4D1D54] hover:text-[#2d1131] p-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: SUBCATEGORIES */}
            <div className="space-y-6">
              <div className="border border-brand-pink-medium/20 bg-[#FAF7F8]/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b border-brand-pink-medium/10 pb-2">
                  🏷️ {editingSubcategory ? 'Editar Subcategoria' : 'Adicionar Subcategoria'}
                </h3>
                <form onSubmit={editingSubcategory ? handleUpdateSubcategory : handleAddSubcategory} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Código / ID (Fixo)</label>
                    <input
                      required
                      type="text"
                      disabled={!!editingSubcategory}
                      placeholder="Ex: meu-jeito"
                      value={editingSubcategory ? editingSubcategory.id : newSubId}
                      onChange={(e) => editingSubcategory ? null : setNewSubId(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Nome da Subcategoria</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: MEU JEITO"
                      value={editingSubcategory ? editingSubcategory.name : newSubName}
                      onChange={(e) => editingSubcategory ? setEditingSubcategory({ ...editingSubcategory, name: e.target.value }) : setNewSubName(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Categoria Pai</label>
                    <select
                      required
                      value={editingSubcategory ? editingSubcategory.categoryId : newSubCategoryId}
                      onChange={(e) => editingSubcategory ? setEditingSubcategory({ ...editingSubcategory, categoryId: e.target.value }) : setNewSubCategoryId(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all appearance-none"
                    >
                      <option value="">Selecione a Categoria</option>
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-800 transition-all cursor-pointer"
                    >
                      {editingSubcategory ? 'Salvar' : 'Adicionar'}
                    </button>
                    {editingSubcategory && (
                      <button
                        type="button"
                        onClick={() => setEditingSubcategory(null)}
                        className="bg-stone-100 text-stone-600 border border-stone-200 px-4 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gray mb-2">Subcategorias Ativas ({dbSubcategories.length})</h4>
                <div className="space-y-3">
                  {dbSubcategories.map((sub) => (
                    <div key={sub.id} className="bg-white border border-brand-pink-light/60 hover:border-brand-gold/60 rounded-2xl p-4 flex justify-between items-start transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-black">{sub.name}</span>
                          <span className="text-[8px] font-mono bg-stone-100 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md uppercase text-[7px]">{sub.id}</span>
                        </div>
                        <div className="text-[10px] text-brand-gold font-bold mt-1 uppercase tracking-wider">
                          Pai: {dbCategories.find(c => c.id === sub.categoryId)?.name || sub.categoryId}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => setEditingSubcategory({ id: sub.id, name: sub.name, categoryId: sub.categoryId })}
                          className="text-[#4D1D54] hover:text-[#2d1131] p-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubcategory(sub.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: VARIATIONS */}
            <div className="space-y-6">
              <div className="border border-brand-pink-medium/20 bg-[#FAF7F8]/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b border-brand-pink-medium/10 pb-2">
                  🎨 {editingVariation ? 'Editar Variação' : 'Adicionar Variação'}
                </h3>
                <form onSubmit={editingVariation ? handleUpdateVariation : handleAddVariation} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Código / ID (Fixo)</label>
                    <input
                      required
                      type="text"
                      disabled={!!editingVariation}
                      placeholder="Ex: capacidade-gt"
                      value={editingVariation ? editingVariation.id : newVarId}
                      onChange={(e) => editingVariation ? null : setNewVarId(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Nome da Variação (Ex: Cor, Tamanho)</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Capacidade, Cor, Acabamento"
                      value={editingVariation ? editingVariation.name : newVarName}
                      onChange={(e) => editingVariation ? setNewVarName(e.target.value) : setNewVarName(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Categoria Associada (Opcional)</label>
                    <select
                      value={editingVariation ? editingVariation.categoryId : newVarCategoryId}
                      onChange={(e) => editingVariation ? setEditingVariation({ ...editingVariation, categoryId: e.target.value }) : setNewVarCategoryId(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all appearance-none"
                    >
                      <option value="">Todas as Categorias</option>
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1 block">Opções (Separadas por Vírgula)</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: 500ml, 750ml (+ R$ 20,00)"
                      value={editingVariation ? editingVariation.optionsText : newVarOptionsText}
                      onChange={(e) => editingVariation ? setEditingVariation({ ...editingVariation, optionsText: e.target.value }) : setNewVarOptionsText(e.target.value)}
                      className="w-full bg-white border border-brand-pink-light rounded-2xl p-3 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    />
                    <p className="text-[9px] text-brand-gray mt-1 leading-normal">Coloque os acréscimos de valores entre parênteses para exibir corretamente, ex: "750ml (+ R$ 20,00)".</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-800 transition-all cursor-pointer"
                    >
                      {editingVariation ? 'Salvar' : 'Adicionar'}
                    </button>
                    {editingVariation && (
                      <button
                        type="button"
                        onClick={() => setEditingVariation(null)}
                        className="bg-stone-100 text-[#4D1D54] border border-stone-200 px-4 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-gray mb-2">Variações Ativas ({dbVariations.length})</h4>
                <div className="space-y-3">
                  {dbVariations.map((v) => (
                    <div key={v.id} className="bg-white border border-brand-pink-light/60 hover:border-brand-gold/60 rounded-2xl p-4 flex justify-between items-start transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-black">{v.name}</span>
                          <span className="text-[8px] font-mono bg-stone-100 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md uppercase text-[7px]">{v.id}</span>
                        </div>
                        <div className="text-[9px] text-brand-gold font-bold uppercase">
                          Filtro: {v.categoryId ? (dbCategories.find(c => c.id === v.categoryId)?.name || v.categoryId) : 'Todas as Categorias'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(v.options || []).map((opt: string, idx: number) => (
                            <span key={idx} className="text-[9px] font-bold bg-stone-50 border border-stone-200/60 rounded-md px-1.5 py-0.5 text-brand-black">
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => setEditingVariation({ id: v.id, name: v.name, categoryId: v.categoryId || '', optionsText: (v.options || []).join(', ') })}
                          className="text-[#4D1D54] hover:text-[#2d1131] p-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVariation(v.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Customers Tab */
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-brand-pink-light">
          <h2 className="text-xl font-serif font-black mb-8 text-brand-black italic">Nossa Família (Clientes)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-pink-light pb-4">
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Perfil</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Nome</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">E-mail</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Registrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-pink-light/30">
                {customers.map((c) => (
                  <tr key={c.id} className="group hover:bg-[#FAF7F8] transition-colors">
                    <td className="py-6">
                      <div className="w-10 h-10 rounded-full border border-brand-pink-light flex items-center justify-center bg-[#FAF7F8] overflow-hidden">
                        {c.photoURL ? <img src={c.photoURL} alt="" /> : <Users className="w-4 h-4 text-brand-pink-medium" />}
                      </div>
                    </td>
                    <td className="py-6 font-bold text-sm text-brand-black uppercase tracking-tight">{c.name}</td>
                    <td className="py-6 text-xs text-brand-gray font-medium">{c.email}</td>
                    <td className="py-6 text-[9px] font-black uppercase tracking-widest text-brand-gold">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recentemente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customization Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-brand-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] p-12 max-w-2xl w-full shadow-2xl relative">
             <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 font-black uppercase text-gray-400 hover:text-brand-red">Fechar</button>
             <h2 className="text-4xl font-black mb-8 tracking-tighter">Detalhes da Customização</h2>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  {selectedOrder.currentItem.customization.preview ? (
                    <img 
                      src={selectedOrder.currentItem.customization.preview} 
                      className="w-full aspect-square object-contain bg-brand-gray rounded-[40px] border-4 border-brand-yellow p-4" 
                      alt="Preview"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-brand-gray rounded-[40px] border-4 border-brand-yellow p-8 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4">Gravação a Laser</p>
                      <p className="text-4xl font-black text-brand-black uppercase tracking-tighter">{selectedOrder.currentItem.customization.nome}</p>
                      <p className="text-2xl font-bold text-brand-black/60 uppercase tracking-tight mt-2">{selectedOrder.currentItem.customization.sobrenome}</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Produto Base</p>
                    <p className="font-bold">{selectedOrder.currentItem.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Personalização</p>
                    <div className="space-y-2">
                       {Object.entries(selectedOrder.currentItem.customization).map(([key, val]) => {
                         if (!val || key === 'preview' || key === 'tipo') return null;
                         if (typeof val === 'string' && val.startsWith('data:image')) {
                           return (
                             <div key={key}>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">{key}</p>
                               <img src={val} className="w-20 h-20 object-cover rounded-xl border-2 border-brand-yellow mt-1" />
                             </div>
                           );
                         }
                         return (
                           <div key={key}>
                             <p className="text-[10px] font-bold text-gray-400 uppercase">{key}:</p>
                             <p className="font-bold text-brand-red uppercase">{String(val)}</p>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                  {selectedOrder.currentItem.customization.json && (
                    <div className="bg-brand-gray p-6 rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-4">JSON da Arte</p>
                      <pre className="text-[8px] overflow-auto max-h-40 bg-white p-2 rounded-lg">
                        {JSON.stringify(selectedOrder.currentItem.customization.json, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] p-12 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-4xl font-black mb-8 tracking-tighter">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Nome</label>
                <input 
                  required
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">SKU (Stock Keeping Unit) - Obrigatório para Bling</label>
                <input 
                  required
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                  placeholder="Ex: GAT-TERM-001"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Descrição Curta</label>
                <textarea 
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none h-24 resize-none"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Descrição Detalhada do Produto (Pode conter links de imagem)</label>
                <textarea 
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none h-32 resize-none"
                  placeholder="Descreva o produto em detalhes aqui..."
                  value={newProduct.detailedDescription}
                  onChange={(e) => setNewProduct({...newProduct, detailedDescription: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Categoria</label>
                  <select 
                    className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none appearance-none"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    {dbCategories.length === 0 && (
                      <>
                        <option value="garrafas-termicas">Garrafas Térmicas</option>
                        <option value="canecas">Canecas</option>
                        <option value="atacado">Atacado</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Subcategoria</label>
                   <select 
                     className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none appearance-none"
                     value={newProduct.subcategory}
                     onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                   >
                     <option value="">Nenhuma</option>
                     {dbSubcategories
                       .filter(sub => sub.categoryId === newProduct.category)
                       .map(sub => (
                         <option key={sub.id} value={sub.name}>{sub.name}</option>
                       ))}
                     {dbSubcategories.filter(sub => sub.categoryId === newProduct.category).length === 0 && (
                       <>
                         <option value="MEU JEITO">MEU JEITO</option>
                         <option value="SAÚDE">SAÚDE</option>
                         <option value="ENGENHARIA">ENGENHARIA</option>
                         <option value="DOCÊNCIA">DOCÊNCIA</option>
                         <option value="ADVOCACIA">ADVOCACIA</option>
                         <option value="CONTADOR e ADM">CONTADOR e ADM</option>
                         <option value="MILITAR / POLÍCIA">MILITAR / POLÍCIA</option>
                         <option value="TI">TI</option>
                         <option value="CARICATURAS">CARICATURAS</option>
                       </>
                     )}
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Preço (R$)</label>
                  <input 
                    required type="number" step="0.01"
                    className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Estoque Inicial</label>
                  <input 
                    required type="number"
                    className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="bg-brand-gray p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Variações</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Nome da Variação"
                    value={newVariation.name}
                    onChange={(e) => setNewVariation(prev => ({...prev, name: e.target.value}))}
                    className="w-full bg-white rounded-xl p-3 text-sm outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Preço R$"
                    value={newVariation.price || ''}
                    onChange={(e) => setNewVariation(prev => ({...prev, price: Number(e.target.value)}))}
                    className="w-20 bg-white rounded-xl p-3 text-sm outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Estoque"
                    value={newVariation.stock || ''}
                    onChange={(e) => setNewVariation(prev => ({...prev, stock: Number(e.target.value)}))}
                    className="w-20 bg-white rounded-xl p-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                       if (!newVariation.name || !newVariation.price) return;
                       setNewProduct(prev => ({...prev, variations: [...prev.variations, newVariation]}));
                       setNewVariation({ name: '', price: 0, stock: 0 });
                    }}
                    className="bg-brand-black text-white px-4 rounded-xl"
                  >+</button>
                </div>
                <div className="mt-4 space-y-2">
                  {newProduct.variations.map((v, i) => (
                    <div key={i} className="flex justify-between bg-white p-2 rounded-lg text-sm">
                      <span>{v.name} - R${v.price.toFixed(2)} ({v.stock} em estoque)</span>
                      <button type="button" onClick={() => setNewProduct(prev => ({...prev, variations: prev.variations.filter((_, idx) => idx !== i)}))}>X</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 p-4 bg-brand-gray/50 rounded-3xl">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="customizable"
                    checked={newProduct.customizable}
                    onChange={(e) => setNewProduct({...newProduct, customizable: e.target.checked})}
                    className="w-5 h-5 accent-brand-red"
                  />
                  <label htmlFor="customizable" className="text-[10px] font-black uppercase tracking-widest">Personalizável</label>
                </div>
                
                {newProduct.customizable && (
                  <>
                    <div className="flex items-center gap-2 border-l-2 border-brand-gray pl-4">
                      <input 
                        type="checkbox" 
                        id="hasNameAndSurname"
                        checked={newProduct.hasNameAndSurname}
                        onChange={(e) => setNewProduct({...newProduct, hasNameAndSurname: e.target.checked})}
                        className="w-5 h-5 accent-brand-red"
                      />
                      <label htmlFor="hasNameAndSurname" className="text-[10px] font-black uppercase tracking-widest animate-pulse">Nome + Sobrenome (Ao Vivo)</label>
                    </div>

                    <div className="flex items-center gap-2 border-l-2 border-brand-gray pl-4">
                      <input 
                        type="checkbox" 
                        id="hasNameAndSurnameSemAoVivo"
                        checked={(newProduct as any).hasNameAndSurnameSemAoVivo || false}
                        onChange={(e) => setNewProduct({...newProduct, hasNameAndSurnameSemAoVivo: e.target.checked})}
                        className="w-5 h-5 accent-brand-red"
                      />
                      <label htmlFor="hasNameAndSurnameSemAoVivo" className="text-[10px] font-black uppercase tracking-widest">Nome + Sobrenome (Sem Ao Vivo)</label>
                    </div>
                    
                    <div className="flex items-center gap-2 border-l-2 border-brand-gray pl-4">
                      <input 
                        type="checkbox" 
                        id="isSuaHistoria"
                        checked={newProduct.isSuaHistoria}
                        onChange={(e) => setNewProduct({...newProduct, isSuaHistoria: e.target.checked})}
                        className="w-5 h-5 accent-brand-red"
                      />
                      <label htmlFor="isSuaHistoria" className="text-[10px] font-black uppercase tracking-widest">Sua História</label>
                    </div>

                    <div className="flex items-center gap-2 border-l-2 border-brand-gray pl-4">
                      <input 
                        type="checkbox" 
                        id="allowsCaricatura"
                        checked={(newProduct as any).allowsCaricatura || false}
                        onChange={(e) => setNewProduct({...newProduct, allowsCaricatura: e.target.checked})}
                        className="w-5 h-5 accent-brand-red"
                      />
                      <label htmlFor="allowsCaricatura" className="text-[10px] font-black uppercase tracking-widest text-[#4D1D54] font-black">Caricatura</label>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Imagens do Produto</label>
                <div className="flex flex-col gap-3 bg-brand-gray/30 p-4 rounded-3xl border border-brand-pink-light/30">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-[#4D1D54] hover:bg-opacity-90 active:scale-95 transition-all text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center">
                      📁 Adicionar Imagens do Dispositivo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProductImageUpload} 
                      />
                    </label>
                    {uploadingProductImage && (
                      <span className="text-[10px] text-brand-gold animate-pulse font-bold">Enviando...</span>
                    )}
                  </div>
                  
                  {newProduct.imageUrls.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {newProduct.imageUrls.map((imageUrl, idx) => (
                        <div key={idx} className="relative w-full rounded-2xl overflow-hidden border border-brand-pink-medium/20 bg-white shadow-sm flex items-center justify-center p-2">
                          <img 
                            src={imageUrl} 
                            alt={`Preview ${idx + 1}`} 
                            className="max-w-full max-h-48 object-contain" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={() => setNewProduct({...newProduct, imageUrls: newProduct.imageUrls.filter((_, i) => i !== idx)})}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingProduct(null); }} 
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 py-4 rounded-full font-black uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-black hover:bg-zinc-800 text-white py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-white" />
                  {editingProduct ? 'SALVAR ALTERAÇÕES' : 'SALVAR NOVO PRODUTO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
