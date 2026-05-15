import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, Package, Users, ShoppingCart as OrderIcon, Database } from 'lucide-react';
import { formatPrice } from '@/src/lib/utils';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, signInWithGoogle } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'settings'>('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [settings, setSettings] = useState({
    whatsapp: '',
    instagram: '',
    facebook: '',
    email: '',
    address: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: 'garrafas-termicas',
    subcategory: '',
    customizable: false,
    hasNameAndSurname: false,
    isSuaHistoria: false,
    sku: '',
    detailedDescription: '',
    stock: 0
  });

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

    // Settings Real-time
    const unsubscribeSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) {
        setSettings(snapshot.docs[0].data() as any);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCustomers();
      unsubscribeSettings();
    };
  }, [isAdmin]);

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
      const q = await getDocs(collection(db, 'settings'));
      if (q.empty) {
        await addDoc(collection(db, 'settings'), settings);
      } else {
        await updateDoc(doc(db, 'settings', q.docs[0].id), settings);
      }
      alert('Configurações salvas!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
      alert('Erro ao salvar configurações');
    }
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
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...newProduct,
          price: Number(newProduct.price),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          price: Number(newProduct.price),
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
      imageUrl: product.imageUrl,
      category: product.category,
      subcategory: product.subcategory || '',
      customizable: product.customizable || false,
      hasNameAndSurname: product.hasNameAndSurname || false,
      isSuaHistoria: product.isSuaHistoria || false,
      sku: product.sku || '',
      detailedDescription: product.detailedDescription || '',
      stock: product.stock || 0
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Isso irá cadastrar automaticamente todas as categorias e subcategorias solicitadas. Continuar?')) return;
    
    setLoading(true);
    try {
      const thermalDescription = "A parede dupla de isolamento mantém suas bebidas favoritas quentes ou frias por mais tempo, ideal para qualquer aventura ou rotina diária. Perfeita para os amantes de design único ou para presentear alguém especial, esta garrafa une o encanto visual à praticidade, tornando cada gole uma experiência estelar.\n\n<img src=\"https://i.postimg.cc/pTMMv8nk/Whats-App-Image-2026-05-15-at-11-51-00.jpg\" alt=\"Detalhes da Garrafa Térmica\" />\n\n<img src=\"https://i.postimg.cc/yYZhgZJg/Whats-App-Image-2026-05-15-at-11-53-27.jpg\" alt=\"Resistência da Garrafa Térmica\" />";
      
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
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black tracking-tight text-brand-black mb-2">Painel de Controle</h1>
          <div className="flex gap-4 mt-6">
            {[
              { id: 'products', label: 'Produtos', icon: Package },
              { id: 'orders', label: `Pedidos (${orders.length})`, icon: OrderIcon },
              { id: 'customers', label: `Clientes (${customers.length})`, icon: Users },
              { id: 'settings', label: 'Configurações', icon: Database },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand-pink-strong text-white shadow-md' : 'bg-white text-brand-gray border border-brand-pink-light hover:bg-[#FAF7F8]'}`}
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
              onClick={handleSeedData}
              className="bg-white text-brand-gray px-6 py-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-[#FAF7F8] transition-all flex items-center gap-2 border border-brand-pink-light"
            >
              <Database className="w-3 h-3" />
              Resetar Categorias
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-gold text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform flex items-center shadow-lg"
            >
              <Plus className="w-4 h-4 mr-3" />
              Novo Produto
            </button>
          </div>
        )}
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-brand-pink-light">
          <h2 className="text-xl font-serif font-black mb-8 text-brand-black italic">Gerenciar Produtos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-pink-light pb-4">
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Imagem</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Produto</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">SKU</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Categoria</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Estoque</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium">Preço</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-brand-pink-medium text-right">Ações</th>
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
                      {p.customizable && <span className="text-[7px] font-black uppercase tracking-widest text-brand-pink-strong mt-1 block">Personalizável</span>}
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
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-brand-pink-light max-w-2xl">
          <h2 className="text-xl font-serif font-black mb-8 text-brand-black italic">Configurações Gerais</h2>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'WhatsApp', field: 'whatsapp', placeholder: '5511999999999' },
                { label: 'Instagram', field: 'instagram', placeholder: 'use.gat' },
                { label: 'Telefone', field: 'phone', placeholder: '(11) 99999-9999' },
                { label: 'E-mail', field: 'email', placeholder: 'contato@usegat.com.br' },
              ].map((item) => (
                <div key={item.field}>
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-gold mb-2 block">{item.label}</label>
                  <input 
                    className="w-full bg-[#FAF7F8] border border-brand-pink-light rounded-2xl p-4 text-xs font-bold outline-none focus:border-brand-gold transition-all"
                    value={(settings as any)[item.field] || ''}
                    onChange={(e) => setSettings({...settings, [item.field]: e.target.value})}
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="w-full bg-brand-gold text-white py-5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-brand-gold-dark transition-all">Salvar Alterações</button>
          </form>

          <div className="mt-16 pt-12 border-t border-brand-pink-light">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-brand-pink-strong">
              <Database className="w-4 h-4" />
              Integrações (Bling V3)
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
                    <option value="garrafas-termicas">Garrafas Térmicas</option>
                    <option value="canecas">Canecas</option>
                    <option value="atacado">Atacado</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Subcategoria</label>
                   <input 
                     className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                     placeholder="Ex: Saúde, Engenharia, Atacado"
                     value={newProduct.subcategory}
                     onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                   />
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
                      <label htmlFor="hasNameAndSurname" className="text-[10px] font-black uppercase tracking-widest">Nome + Sobrenome</label>
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
                  </>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">URL da Imagem</label>
                <input 
                  required
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="flex-1 bg-brand-gray py-4 rounded-full font-black uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 bg-brand-red text-white py-4 rounded-full font-black uppercase tracking-widest shadow-xl shadow-brand-red/20">
                  {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
