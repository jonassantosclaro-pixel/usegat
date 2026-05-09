import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
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
    stock: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const prodSnapshot = await getDocs(collection(db, 'products'));
        setProducts(prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const orderSnapshot = await getDocs(collection(db, 'orders'));
        setOrders(orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const userSnapshot = await getDocs(collection(db, 'users'));
        setCustomers(userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Settings
        const settingsSnap = await getDocs(collection(db, 'settings'));
        if (!settingsSnap.empty) {
          setSettings(settingsSnap.docs[0].data() as any);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (isAdmin) fetchData();
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
      console.error(error);
      alert('Erro ao salvar configurações');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error(error);
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
      window.location.reload();
    } catch (error) {
      console.error("Error saving product:", error);
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
      stock: product.stock || 0
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Isso irá cadastrar automaticamente todas as categorias e subcategorias solicitadas. Continuar?')) return;
    
    setLoading(true);
    try {
      const seedProducts = [
        // GARRAFAS TÉRMICAS
        { name: 'Garrafa MEU JEITO', category: 'garrafas-termicas', subcategory: 'MEU JEITO', price: 159.90, customizable: true, isSuaHistoria: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800' },
        { name: 'Garrafa Saúde', category: 'garrafas-termicas', subcategory: 'SAÚDE', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800' },
        { name: 'Garrafa Engenharia', category: 'garrafas-termicas', subcategory: 'ENGENHARIA', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800' },
        { name: 'Garrafa Docência', category: 'garrafas-termicas', subcategory: 'DOCÊNCIA', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800' },
        { name: 'Garrafa Advocacia', category: 'garrafas-termicas', subcategory: 'ADVOCACIA', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800' },
        { name: 'Garrafa Contador e ADM', category: 'garrafas-termicas', subcategory: 'CONTADOR e ADM', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800' },
        { name: 'Garrafa Militar / Polícia', category: 'garrafas-termicas', subcategory: 'MILITAR / POLÍCIA', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800' },
        { name: 'Garrafa TI', category: 'garrafas-termicas', subcategory: 'TI', price: 129.90, customizable: true, hasNameAndSurname: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800' },
        
        // CANECAS
        { name: 'Caneca Caricatura Cartoon', category: 'canecas', subcategory: 'CARICATURAS', price: 69.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura Charge', category: 'canecas', subcategory: 'CARICATURAS', price: 69.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura em Linhas', category: 'canecas', subcategory: 'CARICATURAS', price: 59.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Caricatura em Flat', category: 'canecas', subcategory: 'CARICATURAS', price: 64.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Caneca Logomarca', category: 'canecas', subcategory: 'CARICATURAS', price: 49.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },

        // ATACADO
        { name: 'Atacado Logo (Térmica)', category: 'atacado', subcategory: 'GARRAFAS TÉRMICAS', price: 89.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1602143393494-721d0030e162?w=800', description: 'Mínimo 10 unidades' },
        { name: 'Atacado Caricatura + Logo (Térmica)', category: 'atacado', subcategory: 'GARRAFAS TÉRMICAS', price: 109.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1590600156903-882269a83533?w=800', description: 'Mínimo 10 unidades' },
        { name: 'Atacado Logo (Não Térmica)', category: 'atacado', subcategory: 'GARRAFAS NÃO TÉRMICAS', price: 45.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Atacado Caricatura + Logo (Não Térmica)', category: 'atacado', subcategory: 'GARRAFAS NÃO TÉRMICAS', price: 65.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Atacado Logo (Canecas)', category: 'atacado', subcategory: 'CANECAS', price: 29.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' },
        { name: 'Atacado Caricatura + Logo (Canecas)', category: 'atacado', subcategory: 'CANECAS', price: 49.90, customizable: true, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800' }
      ];

      for (const prod of seedProducts) {
        await addDoc(collection(db, 'products'), {
          ...prod,
          description: prod.description || 'Produto oficial USE GAT pre-configurado.',
          stock: 99,
          createdAt: new Date().toISOString()
        });
      }

      alert('Dados semeados com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Erro ao semear dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Painel de Controle</h1>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setActiveTab('products')}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'products' ? 'bg-brand-black text-white' : 'bg-brand-gray text-gray-400 hover:text-brand-black'}`}
            >
              Produtos
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'orders' ? 'bg-brand-black text-white' : 'bg-brand-gray text-gray-400 hover:text-brand-black'}`}
            >
              Pedidos ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'customers' ? 'bg-brand-black text-white' : 'bg-brand-gray text-gray-400 hover:text-brand-black'}`}
            >
              Clientes ({customers.length})
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'settings' ? 'bg-brand-black text-white' : 'bg-brand-gray text-gray-400 hover:text-brand-black'}`}
            >
              Configurações
            </button>
          </div>
        </div>
        {activeTab === 'products' && (
          <div className="flex gap-4">
            <button 
              onClick={handleSeedData}
              className="bg-brand-gray text-brand-black px-6 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-yellow transition-all flex items-center gap-2 border-2 border-brand-black/5"
            >
              <Database className="w-4 h-4" />
              Resetar Categorias
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-red text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform flex items-center shadow-xl shadow-brand-red/20"
            >
              <Plus className="w-5 h-5 mr-3" />
              Novo Produto
            </button>
          </div>
        )}
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border-4 border-brand-gray">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Gerenciar Produtos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-4 border-brand-gray pb-4">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Imagem</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Produto</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cat/Sub</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estoque</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Preço</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-brand-gray">
                {products.map((p) => (
                  <tr key={p.id} className="group hover:bg-brand-bg transition-colors">
                    <td className="py-4">
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                    </td>
                    <td className="py-4">
                      <p className="font-extrabold">{p.name}</p>
                      {p.customizable && <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Custom</span>}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">{p.category}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{p.subcategory || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${p.stock <= 5 ? 'text-brand-red' : 'text-brand-black'}`}>
                          {p.stock || 0}
                        </span>
                        {p.stock <= 5 && <span className="text-[8px] font-bold text-brand-red uppercase animate-pulse">Baixo</span>}
                      </div>
                    </td>
                    <td className="py-4 font-black text-brand-black">{formatPrice(p.price)}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-2 hover:text-brand-yellow transition-colors"><Edit3 className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:text-brand-red transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[40px] p-8 shadow-sm border-4 border-brand-gray">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter">Pedido #{order.id.slice(-6)}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <select 
                  value={order.status || 'PENDENTE'}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="bg-brand-yellow px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="PRODUÇÃO">PRODUÇÃO</option>
                  <option value="ENVIADO">ENVIADO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div className="space-y-4 mb-6">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-brand-gray/30 p-4 rounded-3xl">
                    {item.customization?.preview ? (
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border-2 border-brand-yellow">
                        <img src={item.customization.preview} alt="Custom" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                    )}
                    <div>
                      <p className="font-black text-sm">{item.name}</p>
                      <p className="text-xs font-bold text-gray-400">{item.quantity}x {formatPrice(item.price)}</p>
                      {item.customization && (
                        <div className="mt-1 space-y-0.5">
                          {item.customization.nome && (
                            <p className="text-[10px] font-black uppercase text-brand-red">Nome: {item.customization.nome}</p>
                          )}
                          {item.customization.sobrenome && (
                            <p className="text-[10px] font-black uppercase text-brand-red">Sobrenome: {item.customization.sobrenome}</p>
                          )}
                          {item.customization.preview && (
                            <button 
                              onClick={() => setSelectedOrder({ ...order, currentItem: item })}
                              className="text-[8px] font-black uppercase text-gray-400 hover:underline"
                            >
                              Ver Preview Completo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-brand-gray mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                <span className="text-2xl font-black">{formatPrice(order.total)}</span>
              </div>

              {/* Bling & Melhor Envio Integration */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-brand-gray">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bling (ERP/Nota)</p>
                  {order.bling_nfe_number ? (
                    <div className="bg-green-50 p-3 rounded-2xl border-2 border-green-100">
                      <p className="text-[10px] font-black text-green-700 uppercase">Nota Emitida: {order.bling_nfe_number}</p>
                      <button className="text-[8px] font-bold text-green-600 underline uppercase mt-1">Ver XML/PDF</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => generateNFe(order.id)}
                      className="w-full bg-brand-gray text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-brand-black hover:text-white transition-all"
                    >
                      Gerar Nota Fiscal
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Melhor Envio (Frete)</p>
                  {order.melhorenvio_label_id ? (
                    <div className="bg-blue-50 p-3 rounded-2xl border-2 border-blue-100">
                      <p className="text-[10px] font-black text-blue-700 uppercase">Rastreio: {order.melhorenvio_tracking_code}</p>
                      <button className="text-[8px] font-bold text-blue-600 underline uppercase mt-1">Imprimir Etiqueta</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => generateLabel(order.id)}
                      className="w-full bg-brand-gray text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-brand-black hover:text-white transition-all"
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
        <div className="bg-white rounded-[40px] p-8 shadow-sm border-4 border-brand-gray max-w-2xl">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Configurações da Loja</h2>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">WhatsApp (com DDD)</label>
              <input 
                className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                value={settings.whatsapp}
                onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                placeholder="Ex: 5511999999999"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Instagram (@)</label>
              <input 
                className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                value={settings.instagram}
                onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                placeholder="Ex: use.gat"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">E-mail de Contato</label>
              <input 
                className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                placeholder="Ex: contato@usegat.com.br"
              />
            </div>
            <button type="submit" className="w-full bg-brand-black text-white py-4 rounded-full font-black uppercase tracking-widest shadow-xl">Salvar Alterações</button>
          </form>

          {/* Bling Integration Section */}
          <div className="mt-12 pt-8 border-t-4 border-brand-gray">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Integração Bling V3 (OAuth)
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 leading-relaxed">
              O Bling mudou para o protocolo OAuth2 (v3). Use o botão abaixo para finalizar a vinculação com a conta Use GAT utilizando os códigos fornecidos.
            </p>
            <button 
              type="button"
              onClick={exchangeBlingCode}
              className="bg-brand-yellow text-brand-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-black hover:text-white transition-all shadow-lg"
            >
              Ativar Integração Bling v3
            </button>
            <div className="mt-4 p-4 bg-brand-gray/30 rounded-2xl">
               <p className="text-[8px] font-bold text-gray-400 uppercase">Status do Token</p>
               <p className="text-[10px] font-black text-brand-red uppercase mt-1">Vínculo Pendente / Manual</p>
            </div>
          </div>
        </div>
      ) : (
        /* Customers Tab */
        <div className="bg-white rounded-[40px] p-8 shadow-sm border-4 border-brand-gray">
          <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Base de Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-4 border-brand-gray pb-4">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Avatar</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">E-mail</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-brand-gray">
                {customers.map((c) => (
                  <tr key={c.id} className="group hover:bg-brand-bg transition-colors">
                    <td className="py-4">
                      <img src={c.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-brand-yellow" alt="" />
                    </td>
                    <td className="py-4 font-extrabold uppercase italic">{c.name}</td>
                    <td className="py-4 font-bold text-gray-500">{c.email}</td>
                    <td className="py-4 font-black text-[10px] uppercase text-brand-red">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'Sem data'}
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
                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Descrição</label>
                <textarea 
                  className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none h-24 resize-none"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
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
