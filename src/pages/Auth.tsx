import React, { useState } from 'react';
import { useAuth } from '@/src/lib/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Chrome, ArrowRight, UserPlus } from 'lucide-react';

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
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Firebase: Error (auth/invalid-credential).' 
        ? 'E-mail ou senha incorretos' 
        : 'Ocorreu um erro. Verifique seus dados.');
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
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[50px] p-10 md:p-14 shadow-2xl border-4 border-brand-gray relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-3">
            {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            {isLogin ? 'Entre para continuar suas comprasna USE GAT' : 'Junte-se à nossa comunidade de estilo'}
          </p>
        </div>

        {error && (
          <div className="bg-brand-red/10 text-brand-red p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
              <input 
                type="text"
                placeholder="NOME COMPLETO"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-brand-gray rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-brand-red/10 transition-all border-2 border-transparent focus:border-brand-red/20"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
            <input 
              type="email"
              placeholder="E-MAIL"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-brand-gray rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-brand-red/10 transition-all border-2 border-transparent focus:border-brand-red/20"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
            <input 
              type="password"
              placeholder="SENHA"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-brand-gray rounded-2xl h-14 pl-14 pr-6 font-bold text-xs uppercase outline-none focus:ring-4 focus:ring-brand-red/10 transition-all border-2 border-transparent focus:border-brand-red/20"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-black text-white h-14 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-red transition-all shadow-xl shadow-brand-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-brand-gray"></div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">OU</span>
          <div className="flex-1 h-px bg-brand-gray"></div>
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full bg-white border-2 border-brand-gray text-brand-black h-14 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-gray transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-4 h-4 text-brand-red" />
          Continuar com Google
        </button>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline"
          >
            {isLogin ? 'Não tem conta? Crie agora' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
