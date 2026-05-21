import React, { useState } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Chrome, ArrowRight, Heart } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInEmail, signUpEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/perfil";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInEmail(email, password);
      } else {
        if (!name) throw new Error('Nome é obrigatório');
        await signUpEmail(email, password, name);
      }
      
      const lowerEmail = email.trim().toLowerCase();
      if (lowerEmail === 'usegat@x.com' || lowerEmail === 'jonassantosclaro@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message.includes('auth/invalid-credential') 
        ? 'E-mail ou senha incorretos' 
        : 'Ocorreu um erro. Verifique seus dados ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#FAF7F8] rounded-[50px] p-10 md:p-14 shadow-sm border border-brand-pink-light relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink-medium/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="text-center mb-10">
          <Heart className="w-10 h-10 text-brand-primary mx-auto mb-6 opacity-30" />
          <h1 className="text-3xl font-serif font-black text-brand-black mb-3">
            {isLogin ? 'Que bom te ver!' : 'Faça parte da família'}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary px-4">
            {isLogin ? 'Entre para continuar escolhendo seus presentes' : 'Cadastre-se para uma experiência completa'}
          </p>
        </div>

        {error && (
          <div className="bg-brand-primary/10 text-brand-primary p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary transition-colors" />
              <input 
                type="text"
                placeholder="SEU NOME"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white border border-brand-pink-light rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:border-brand-primary transition-all"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary transition-colors" />
            <input 
              type="email"
              placeholder="E-MAIL"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-brand-pink-light rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:border-brand-primary transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary transition-colors" />
            <input 
              type="password"
              placeholder="SENHA"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border border-brand-pink-light rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:border-brand-primary transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-primary text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar Agora' : 'Criar Conta')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-brand-pink-light"></div>
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest">OU</span>
          <div className="flex-1 h-px bg-brand-pink-light"></div>
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full bg-white border border-brand-pink-light text-brand-gray h-14 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-pink-light/30 transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-4 h-4 text-brand-primary" />
          Entrar com Google
        </button>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline"
          >
            {isLogin ? 'Ainda não tem conta? Clique aqui' : 'Já é cadastrado? Faça Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
