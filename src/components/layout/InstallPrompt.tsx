import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share, PlusSquare, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // 1. Check if already running in standalone mode (i.e. installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Already installed, no need to show the prompt
    }

    // 2. Check if the user has dismissed it recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return; 
    }

    // 3. Detect Platform
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);

    // Only prompt active mobile sessions as explicitly requested by user:
    // "quando entrar via mobile , seja qual for o celular , preciso que ele coloque 'instalar' para adiconar o atalho"
    if (!isMobile) {
      return;
    }

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // 4. Capture native beforeinstallprompt event (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS Safari or browsers where beforeinstallprompt doesn't fire, 
    // we want to show our simulated instructions after a short delay (e.g., 3s)
    let iosTimer: NodeJS.Timeout;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
    } else {
      // For general mobile devices, if event doesn't fire but we are mobile, 
      // let's show fallback guidance after 5 seconds to guarantee everyone has the option
      iosTimer = setTimeout(() => {
        if (!deferredPrompt && !isStandalone) {
          setShowPrompt(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // General fallbacks or manual prompt info:
      alert('Para instalar o aplicativo no seu dispositivo Android:\n1. Clique nos três pontinhos no canto superior da tela.\n2. Escolha "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 md:hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-brand-gold/25 p-5 shadow-2xl pointer-events-auto flex flex-col gap-3.5 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <img 
                  src="/imagens/logo-gat-purple.png" 
                  alt="USE.GAT" 
                  className="w-10 h-10 object-contain brightness-0 invert" 
                />
              </div>
              <div>
                <h4 className="text-[12px] font-black uppercase tracking-wider text-brand-primary">Instale o Aplicativo USE.GAT</h4>
                <p className="text-[10px] text-stone-500 font-medium">Acesso super rápido na tela inicial!</p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description for standard install button vs iOS/Safari manual directions */}
          {platform === 'ios' ? (
            <div className="bg-brand-pink-light/30 border border-brand-gold/10 rounded-2xl p-3.5 text-[11px] text-stone-700 leading-relaxed space-y-2">
              <p className="font-bold text-center text-brand-primary">Adicione o atalho no seu iPhone:</p>
              <div className="flex items-start gap-2">
                <Share className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <p>1. Toque no botão de <strong>Compartilhar</strong> na barra do navegador Safari.</p>
              </div>
              <div className="flex items-start gap-2">
                <PlusSquare className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <p>2. Desça as opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] text-stone-600 font-medium">
                Adicione o nosso aplicativo exclusivo no seu celular para um carregamento instantâneo, cupons de desconto exclusivos e navegação offline fluida!
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" /> Instalar Aplicativo
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3.5 py-3 text-[9px] font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider transition-colors"
                >
                  Mais Tarde
                </button>
              </div>
            </div>
          )}

          {/* Sparkles accent style */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-gold/10 to-transparent rounded-full -mr-6 -mt-6 pointer-events-none"></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
