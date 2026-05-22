import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Show popup after 3 seconds or based on session storage
    const hasSeenPopup = sessionStorage.getItem('hasSeenNewsletterPopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenNewsletterPopup', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would typically send the email to your backend/service
      console.log('Subscribing email:', email);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors group z-20"
              aria-label="Fecar"
            >
              <X className="w-4 h-4 text-gray-500 group-hover:text-black" />
            </button>

            <div className="p-8 md:p-12 text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-[#F9F7F2] rounded-2xl flex items-center justify-center">
                  <Mail className="w-8 h-8 text-black" strokeWidth={1.5} />
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-black uppercase tracking-tight flex items-center justify-center gap-2">
                  VOCÊ +
                  <img 
                    src="/imagens/newsletter-popup.png" 
                    alt="USE GAT" 
                    className="h-8 w-auto object-contain"
                  />
                  = <span className="text-xl">🫶</span>
                </h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-[280px] mx-auto">
                  Coloca seu e-mail aqui e receba um presente especial na primeira compra 
                  <span className="block mt-1 italic text-brand-primary">(spoiler: tem cupom 👀)</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  type="email"
                  placeholder="Digite seu email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-white border-2 border-gray-100 rounded-2xl px-6 pr-14 text-sm font-medium focus:outline-none focus:border-brand-primary/20 transition-all placeholder:text-gray-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all group/btn"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Decorative bottom bar */}
            <div className="h-1.5 w-full bg-brand-gold/30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
