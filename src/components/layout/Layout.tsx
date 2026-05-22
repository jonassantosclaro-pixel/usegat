import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';
import ChatAI from '../ChatAI';
import { NewsletterPopup } from '../ui/NewsletterPopup';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>(null);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'settings'), (q) => {
      if (!q.empty) {
        const globalDoc = q.docs.find(d => d.id === 'global') || q.docs[0];
        setSettings(globalDoc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const primColor = settings?.primary_color || '#4D1D54';
  const accColor = settings?.accent_color || '#B48A4E';
  const secColor = settings?.secondary_color || '#FAF7F8';
  const fontFam = settings?.font_family || 'Inter';

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {settings && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=${fontFam.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap');
          
          :root {
            --color-brand-primary: ${primColor};
            --color-brand-gold: ${accColor};
            --color-brand-accent: ${accColor};
            --font-sans: "${fontFam}", sans-serif;
            --color-brand-pink-light: ${secColor};
          }
          
          body, select, input, textarea, button {
            font-family: "${fontFam}", sans-serif !important;
          }
          
          /* Dynamic class replacements for #4D1D54 */
          .text-brand-primary, .text-\\[\\#4D1D54\\], [class*="text-[#4D1D54]"], .text-brand-pink-strong {
            color: ${primColor} !important;
          }
          .bg-brand-primary, .bg-\\[\\#4D1D54\\], [class*="bg-[#4D1D54]"], .bg-brand-pink-strong {
            background-color: ${primColor} !important;
          }
          .border-brand-primary, .border-\\[\\#4D1D54\\], [class*="border-[#4D1D54]"], .border-brand-pink-strong {
            border-color: ${primColor} !important;
          }
          
          /* Dynamic class replacements for #B48A4E / #8C6A3B */
          .text-brand-gold, .text-\\[\\#B48A4E\\], [class*="text-[#B48A4E]"], .text-\\[\\#8C6A3B\\], [class*="text-[#8C6A3B]"] {
            color: ${accColor} !important;
          }
          .bg-brand-gold, .bg-\\[\\#B48A4E\\], [class*="bg-[#B48A4E]"], .bg-\\[\\#8C6A3B\\], [class*="bg-[#8C6A3B]"] {
            background-color: ${accColor} !important;
          }
          .border-brand-gold, .border-\\[\\#B48A4E\\], [class*="border-[#B48A4E]"], .border-\\[\\#8C6A3B\\], [class*="border-[#8C6A3B]"] {
            border-color: ${accColor} !important;
          }

          /* Dynamic class replacements for background/neutral sections */
          .bg-brand-pink-light, .bg-brand-pink-light\\/30, .bg-\\[\\#FAF7F8\\], .bg-\\[\\#FAF7F8\\]\\/80, .bg-\\[\\#FAF7F8\\]\\/40, .bg-\\[\\#FAF7F8\\]\\/60 {
            background-color: ${secColor} !important;
          }
          
          /* Focus borders */
          .focus\\:border-brand-primary:focus {
            border-color: ${primColor} !important;
          }
        `}} />
      )}
      
      {!isAdminPage && <Header />}
      {!isAdminPage && <CartSidebar />}
      
      <main className="flex-grow relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col flex-grow"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {!isAdminPage && <Footer />}
      {!isAdminPage && <NewsletterPopup />}
      
      {!isAdminPage && <ChatAI />}


    </div>
  );
}

