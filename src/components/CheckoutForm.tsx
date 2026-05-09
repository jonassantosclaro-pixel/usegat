import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/src/lib/utils';
import { Loader2, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import axios from 'axios';

interface CheckoutFormProps {
  onProcess: (data: any) => Promise<any>;
  totalProducts: number;
  onShippingUpdate: (cost: number) => void;
}

export default function CheckoutForm({ onProcess, totalProducts, onShippingUpdate }: CheckoutFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    cidade: '',
    estado: '',
    card_number: '',
    card_name: '',
    card_expiry: '',
    card_cvv: '',
    card_type: 'credit' as 'credit' | 'debit',
    installments: '1'
  });

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData(prev => ({
            ...prev,
            nome: data.name || prev.nome,
            email: data.email || prev.email,
            ...(data.address || {})
          }));

          if (data.address?.cep) {
            handleCepChange(data.address.cep);
          }
        }
      } catch (error) {
        console.error("Error loading user data for checkout:", error);
      }
    }
    loadUserData();
  }, [user]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: cleanCep }));

    if (cleanCep.length === 8) {
      setCalculatingShipping(true);
      try {
        const response = await axios.get(`/api/shipping/${cleanCep}`);
        const { cost, address } = response.data;
        
        setShippingCost(cost);
        onShippingUpdate(cost);
        setFormData(prev => ({
          ...prev,
          rua: address.rua || '',
          cidade: address.cidade || '',
          estado: address.estado || ''
        }));
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setCalculatingShipping(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cep') {
      handleCepChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await onProcess({ 
        ...formData, 
        metodo_pagamento: method,
        valor_frete: shippingCost 
      });
      
      if (method === 'pix') {
        setPixData(response.pix);
        setStep('payment');
      } else {
        setSuccess(true);
        setStep('payment');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const finalTotal = totalProducts + shippingCost;

  const copyPix = () => {
    navigator.clipboard.writeText(pixData.copia_e_cola);
    alert('Código PIX copiado!');
  };

  if (step === 'payment') {
    if (method === 'pix' && pixData) {
      return (
        <div className="bg-white p-8 rounded-[40px] text-brand-black shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-brand-yellow" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-center mb-2 uppercase italic">Pedido Criado!</h3>
          <p className="text-gray-500 text-center text-sm font-medium mb-8">Agora é só pagar via PIX para começarmos a produzir.</p>
          
          <div className="flex justify-center mb-8 bg-brand-gray p-4 rounded-3xl">
            <img src={pixData.qrcode_url} alt="QR Code PIX" className="w-48 h-48" />
          </div>

          <button 
            type="button"
            onClick={copyPix}
            className="w-full bg-brand-black text-white py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Copy className="w-4 h-4 mr-3" />
            Copiar Código PIX
          </button>

          <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase text-center leading-relaxed">
            Após o pagamento você receberá a confirmação em seu e-mail e a nota fiscal será emitida automaticamente pelo Bling.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white p-8 rounded-[40px] text-brand-black shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-black mb-2 uppercase italic">Pagamento Confirmado!</h3>
        <p className="text-gray-500 text-sm font-medium mb-8">Seu pedido já foi enviado para produção. Você receberá a nota fiscal em seu e-mail em instantes.</p>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-brand-black text-white py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:scale-105 transition-transform"
        >
          Voltar para a Loja
        </button>

        <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
          Obrigado por comprar conosco! A nota fiscal (XML + DANFE) será gerada automaticamente pelo Bling ERP.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] text-brand-black shadow-2xl space-y-6">
      <div className="flex gap-2 p-1 bg-brand-gray rounded-full mb-8">
        <button 
          type="button"
          onClick={() => setMethod('pix')}
          className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${method === 'pix' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
        >
          Pagar com PIX
        </button>
        <button 
          type="button"
          onClick={() => setMethod('card')}
          className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${method === 'card' ? 'bg-brand-black text-white shadow-lg' : 'text-gray-400 hover:text-brand-black'}`}
        >
          Cartão de Débito/Crédito
        </button>
      </div>

      <h3 className="text-xl font-black uppercase italic mb-6 border-b-2 border-brand-yellow inline-block">Dados de Entrega e Fiscal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Nome Completo</label>
          <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">CPF ou CNPJ</label>
          <input required name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Telefone</label>
          <input required name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">E-mail</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">CEP</label>
          <input required name="cep" value={formData.cep} onChange={handleChange} placeholder="00000000" className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
          {calculatingShipping && (
            <div className="absolute right-4 bottom-4">
              <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Rua</label>
          <input required name="rua" value={formData.rua} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Número</label>
          <input required name="numero" value={formData.numero} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Cidade</label>
          <input required name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Estado (UF)</label>
          <input required name="estado" value={formData.estado} onChange={handleChange} maxLength={2} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-brand-yellow uppercase" />
        </div>
      </div>

      {method === 'card' && (
        <div className="space-y-6 pt-6 border-t-2 border-brand-gray animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-black uppercase italic mb-2 border-b-2 border-brand-red inline-block">Dados do Cartão</h3>
          
          <div className="flex gap-4 mb-4">
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="card_type" value="credit" checked={formData.card_type === 'credit'} onChange={handleChange} className="hidden peer" />
              <div className="text-center py-3 rounded-2xl bg-brand-gray peer-checked:bg-brand-red peer-checked:text-white font-black uppercase text-[10px] tracking-widest transition-all">Crédito</div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="card_type" value="debit" checked={formData.card_type === 'debit'} onChange={handleChange} className="hidden peer" />
              <div className="text-center py-3 rounded-2xl bg-brand-gray peer-checked:bg-brand-red peer-checked:text-white font-black uppercase text-[10px] tracking-widest transition-all">Débito</div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Número do Cartão</label>
              <input required name="card_number" value={formData.card_number} onChange={handleChange} placeholder="0000 0000 0000 0000" className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Nome Impresso no Cartão</label>
              <input required name="card_name" value={formData.card_name} onChange={handleChange} placeholder="NOME COMO NO CARTÃO" className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Validade</label>
                <input required name="card_expiry" value={formData.card_expiry} onChange={handleChange} placeholder="MM/AA" className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">CVV</label>
                <input required name="card_cvv" value={formData.card_cvv} onChange={handleChange} placeholder="123" maxLength={4} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none" />
              </div>
            </div>

            {formData.card_type === 'credit' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Parcelas</label>
                <select name="installments" value={formData.installments} onChange={handleChange} className="w-full bg-brand-gray rounded-2xl p-4 font-bold outline-none appearance-none">
                  {[1,2,3,4,5,6,10,12].map(i => (
                    <option key={i} value={i}>{i}x de {formatPrice(finalTotal / i)} {i === 1 ? 'à vista' : 'sem juros'}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {shippingCost > 0 && (
        <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/20 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-black">Total com Frete:</span>
          <span className="font-black text-brand-red">{formatPrice(finalTotal)}</span>
        </div>
      )}

      <button 
        type="submit"
        disabled={loading || calculatingShipping}
        className="w-full bg-brand-red text-white py-6 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
          method === 'pix' ? `GERAR PIX DE ${formatPrice(finalTotal)}` : `PAGAR ${formatPrice(finalTotal)}`
        }
      </button>
    </form>
  );
}
