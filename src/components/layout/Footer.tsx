import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function Footer() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchSettings() {
      const q = await getDocs(collection(db, 'settings'));
      if (!q.empty) {
        setSettings(q.docs[0].data());
      }
    }
    fetchSettings();
  }, []);

  const instagramUser = settings?.instagram || 'use.gat';
  const whatsappNumber = settings?.whatsapp || '55011999999999';
  const email = settings?.email || 'oi@usegat.app';

  return (
    <footer className="bg-brand-black text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* Brand Info */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://i.postimg.cc/kgByjm40/Whats-App-Image-2026-05-08-at-11-11-29.jpg" 
              alt="USE GAT Logo" 
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-xs">
            A USE GAT é uma marca especializada em personalizados em garrafas térmicas e canecas, criada para ir além do comum.
          </p>
          <div className="flex gap-4">
            <a href={`https://instagram.com/${instagramUser}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-red transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-red transition-all">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links Quick */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-brand-yellow">Menu</h3>
          <ul className="space-y-4">
            <li><Link to="/categoria/garrafas" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Garrafas</Link></li>
            <li><Link to="/categoria/canecas" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Canecas</Link></li>
            <li><Link to="/categoria/atacado" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Atacado</Link></li>
            <li><Link to="/novidades" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Novidades</Link></li>
            <li><Link to="/admin" className="text-[10px] font-black text-brand-red hover:text-white transition-colors uppercase opacity-50 hover:opacity-100">Painel Administrativo</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-brand-yellow">Suporte</h3>
          <ul className="space-y-4">
            <li><Link to="/trocas" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Trocas</Link></li>
            <li><Link to="/privacidade" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Privacidade</Link></li>
            <li><Link to="/termos" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Termos</Link></li>
            <li><Link to="/contato" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Contato</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-brand-yellow">Contatos</h3>
          <ul className="space-y-5">
            <li className="flex items-start text-sm font-bold text-gray-400">
              <Phone className="w-4 h-4 mr-3 mt-0.5 text-brand-red" />
              <span>{whatsappNumber}</span>
            </li>
            <li className="flex items-start text-sm font-bold text-gray-400">
              <Mail className="w-4 h-4 mr-3 mt-0.5 text-brand-red" />
              <span>{email}</span>
            </li>
            <li className="flex items-start text-sm font-bold text-gray-400">
              <MapPin className="w-4 h-4 mr-3 mt-0.5 text-brand-red" />
              <span>Personalizados em Todo Brasil</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-24 pt-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 text-center md:text-left">
            © 2026 USE GAT • 100% SEGURO • MODA URBANA
          </p>
          <div className="flex gap-8 items-center">
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-white/5 px-6 py-2 rounded-full border border-white/10 hover:bg-brand-red hover:text-white transition-all">
              Acesso Restrito Admin
            </Link>
          </div>
          <div className="flex items-center gap-6 opacity-30 grayscale invert">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
