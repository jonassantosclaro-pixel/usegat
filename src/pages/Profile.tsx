import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { formatPrice } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { Package, MapPin, User as UserIcon, Loader2, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: {
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    }
  });

  useEffect(() => {
    if (!user) return;

    if (userData) {
      setEditForm({
        phone: userData.phone || '',
        address: {
          cep: userData.address?.cep || '',
          rua: userData.address?.rua || '',
          numero: userData.address?.numero || '',
          complemento: userData.address?.complemento || '',
          bairro: userData.address?.bairro || '',
          cidade: userData.address?.cidade || '',
          estado: userData.address?.estado || ''
        }
      });
    }

    async function fetchData() {
      try {
        // Fetch Orders
        const q = query(
          collection(db, 'orders'), 
          where('userId', '==', user!.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data()
        }));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching profile info:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), editForm);
      setIsEditingAddress(false);
      alert('Perfil atualizado!');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar endereço');
    }
  };

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <UserIcon className="w-16 h-16 text-gray-200" />
      <h2 className="text-2xl font-black uppercase italic">Entre para ver seu perfil</h2>
    </div>
  );

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand-red" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Left Side: User Info & Address */}
        <div className="lg:w-1/3 space-y-8">
          <div className="bg-white rounded-[40px] p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <img src={user.photoURL || ''} className="w-16 h-16 rounded-full border-4 border-brand-yellow" alt="Avatar" />
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">{user.displayName}</h2>
                <p className="text-xs font-bold text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-red" />
                  Endereço de Entrega
                </h3>
                <button 
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-[10px] font-black uppercase text-brand-red hover:underline"
                >
                  {isEditingAddress ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <input placeholder="TELEFONE" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  <input placeholder="CEP" value={editForm.address.cep} onChange={e => setEditForm({...editForm, address: {...editForm.address, cep: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  <input placeholder="RUA / AVENIDA" value={editForm.address.rua} onChange={e => setEditForm({...editForm, address: {...editForm.address, rua: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Nº" value={editForm.address.numero} onChange={e => setEditForm({...editForm, address: {...editForm.address, numero: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                    <input placeholder="COMPLEMENTO" value={editForm.address.complemento} onChange={e => setEditForm({...editForm, address: {...editForm.address, complemento: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  </div>
                  <input placeholder="BAIRRO" value={editForm.address.bairro} onChange={e => setEditForm({...editForm, address: {...editForm.address, bairro: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="CIDADE" value={editForm.address.cidade} onChange={e => setEditForm({...editForm, address: {...editForm.address, cidade: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                    <input placeholder="ESTADO (UF)" value={editForm.address.estado} onChange={e => setEditForm({...editForm, address: {...editForm.address, estado: e.target.value}})} className="w-full bg-brand-gray rounded-xl p-3 text-xs font-bold" />
                  </div>
                  <button type="submit" className="w-full bg-brand-black text-white py-3 rounded-xl text-[10px] font-black uppercase">Salvar Perfil</button>
                </form>
              ) : (
                <div className="bg-brand-gray p-4 rounded-2xl">
                  {userData?.phone && <p className="text-[10px] font-black text-brand-red mb-2 uppercase tracking-tighter">{userData.phone}</p>}
                  {userData?.address?.cep ? (
                    <div className="text-sm font-bold text-gray-600">
                      <p>{userData.address.rua}, {userData.address.numero}</p>
                      {userData.address.complemento && <p className="text-xs">{userData.address.complemento}</p>}
                      <p>{userData.address.bairro}</p>
                      <p>{userData.address.cidade} - {userData.address.estado}</p>
                      <p className="mt-2 text-xs text-brand-red font-black">{userData.address.cep}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-gray-400 italic">Preencha seu endereço para agilizar sua entrega.</p>
                  )}
                </div>
              )}
              
              <div className="pt-6 border-t border-brand-gray">
                <button 
                  onClick={() => signOut()}
                  className="w-full text-[10px] font-black uppercase text-gray-400 hover:text-brand-red tracking-widest transition-colors"
                >
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order History */}
        <div className="lg:w-2/3">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-4">
            <Package className="w-8 h-8 text-brand-red" />
            Meus Pedidos
          </h2>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-12 rounded-[40px] text-center shadow-xl">
                <Clock className="w-12 h-12 text-brand-gray mx-auto mb-4" />
                <p className="font-bold text-gray-400">Você ainda não realizou nenhum pedido.</p>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id} 
                  className="bg-white rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-brand-yellow transition-all flex flex-col md:flex-row justify-between items-center gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-brand-gray rounded-full flex items-center justify-center font-black text-xs">
                      #{order.id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                      <p className="font-black text-brand-black uppercase italic">
                        {order.items.length} {order.items.length === 1 ? 'Produto' : 'Produtos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        order.status === 'enviado' ? 'bg-green-100 text-green-600' : 
                        order.status === 'producao' ? 'bg-brand-yellow/20 text-brand-yellow' : 
                        'bg-brand-gray text-gray-400'
                      }`}>
                        {order.status || 'Pendente'}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="font-black text-brand-red">{formatPrice(order.total)}</p>
                    </div>

                    <ChevronRight className="w-6 h-6 text-gray-300" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {isAdmin && (
            <div className="bg-brand-black rounded-[40px] p-10 shadow-xl text-white mt-8 border-4 border-brand-yellow">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-brand-yellow">Painel VIP Admin</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">Gerencie produtos, pedidos e configurações da loja oficialmente.</p>
              <Link 
                to="/admin"
                className="flex items-center justify-between w-full bg-brand-red text-white p-5 rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-white hover:text-brand-black transition-all group"
              >
                Abrir Painel Admin
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
