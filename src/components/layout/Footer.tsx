import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, Mail, Phone, MapPin, Heart, ChevronDown, ShieldCheck, Megaphone, Paperclip, Pin, Settings } from 'lucide-react';
import { WhatsAppIcon } from '../ui/Icons';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';

export default function Footer() {
  const [settings, setSettings] = useState<any>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'settings'), (q) => {
      if (!q.empty) {
        setSettings(q.docs[0].data());
      }
    });
    return () => unsubscribe();
  }, []);

  const instagramUser = settings?.instagram || 'use.gat';
  const whatsappNumber = settings?.whatsapp || '55011999999999';
  const email = settings?.email || 'contato@usegat.com.br';

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections = [
    {
      id: 'use-gat',
      title: 'Use Gat',
      content: (
        <div className="py-8">
          <div className="relative bg-[#F5F1E9] p-8 md:p-10 rounded-sm shadow-sm border border-stone-100 overflow-hidden">
            {/* Decorative Tape Corners */}
            <div className="absolute top-2 -right-10 w-32 h-6 bg-[#B09A82] rotate-[35deg] opacity-60 shadow-sm" />
            <div className="absolute bottom-6 -left-12 w-32 h-6 bg-[#B09A82] rotate-[35deg] opacity-60 shadow-sm" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Top Logo */}
              <div className="mb-8 flex items-center justify-center">
                <img 
                  src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
                  alt="USE GAT Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>

              {/* Text Content */}
              <div className="space-y-6 text-[#4A1E59] font-medium leading-relaxed max-w-md">
                <p className="text-sm md:text-base">
                  A <span className="font-bold">USE GAT®</span> é uma marca registrada, especializada em presentes personalizados criativos.
                </p>
                <p className="text-sm md:text-base">
                  Produzimos canecas, garrafas térmicas personalizadas e lembranças especiais para transformar momentos em memórias cheias de significado.
                </p>
                <p className="text-sm md:text-base">
                  Cada peça é criada com carinho para que o seu presente carregue emoção, história e afeto.
                </p>
              </div>

              {/* Decorative Flourish */}
              <div className="mt-8 flex items-center gap-4 text-[#4A1E59]/40">
                <div className="h-[1px] w-8 bg-current opacity-30" />
                <Heart className="w-4 h-4 fill-current" />
                <div className="h-[1px] w-8 bg-current opacity-30" />
              </div>

              {/* Circular Bottom Icon */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-[#4A1E59] transform translate-x-2 translate-y-2">
                 <div className="w-8 h-8 text-[#4A1E59]">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M17,13c0,0.55-0.45,1-1,1s-1-0.45-1-1s0.45-1,1-1 S17,12.45,17,13z M11,11c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S11.55,11,11,11z M15,9c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1 S15.55,9,15,9z M8,13c0,0.55-0.45,1-1,1s-1-0.45-1-1s0.45-1,1-1S8,12.45,8,13z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2 S13.1,17,12,17z"/></svg>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'atendimento',
      title: 'Atendimento',
      content: (
        <div className="py-8">
          <div className="relative bg-[#F5F1E9] p-8 md:p-10 rounded-sm shadow-sm border border-stone-100 overflow-hidden">
            {/* Mega Phone Icon (Positioned top left) */}
            <div className="absolute top-0 left-4 transform -translate-y-4">
              <div className="bg-white p-3 rounded-2xl shadow-md border border-[#4A1E59]/10 rotate-[-15deg]">
                <Megaphone className="w-8 h-8 text-[#4A1E59]" />
              </div>
            </div>

            <div className="relative z-10 flex flex-col pt-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-8 border-b-2 border-[#4A1E59] pb-2 w-fit">
                <h3 className="text-xl font-bold text-[#4A1E59]">Fale com a gente</h3>
                <Heart className="w-4 h-4 text-[#4A1E59]" />
              </div>

              {/* Sections */}
              <div className="space-y-8 text-[#4A1E59]">
                {/* PJ & Atacado */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider border-b border-[#4A1E59]/20 pb-1 mb-3">ATENDIMENTO PESSOA JURÍDICA e ATACADO</h4>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <WhatsAppIcon className="w-5 h-5 fill-current" />
                      <span className="font-bold">(21) 4040-2224</span>
                    </div>
                    <span className="text-[10px] opacity-60">Dúvidas & orçamentos</span>
                  </div>
                </div>

                {/* PF */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider border-b border-[#4A1E59]/20 pb-1 mb-3">ATENDIMENTO PESSOA FÍSICA</h4>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      <span className="font-bold">meupedido@usegat.com</span>
                    </div>
                    <span className="text-[10px] opacity-60">Dúvidas com o seu pedido</span>
                  </div>
                </div>

                {/* SAC */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider border-b border-[#4A1E59]/20 pb-1 mb-3">APOIO AO CLIENTE USE GAT</h4>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      <span className="font-bold">atendimenot@usegat.com</span>
                    </div>
                    <span className="text-[10px] opacity-60">SAC</span>
                  </div>
                </div>
              </div>

              {/* Circular Bottom Icon */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-[#4A1E59] transform translate-x-2 translate-y-2">
                 <div className="w-8 h-8 text-[#4A1E59]">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M17,13c0,0.55-0.45,1-1,1s-1-0.45-1-1s0.45-1,1-1 S17,12.45,17,13z M11,11c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S11.55,11,11,11z M15,9c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1 S15.55,9,15,9z M8,13c0,0.55-0.45,1-1,1s-1-0.45-1-1s0.45-1,1-1S8,12.45,8,13z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2 S13.1,17,12,17z"/></svg>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quem-somos',
      title: 'Quem somos',
      content: (
        <div className="py-8">
          {/* Container Principal que simula a imagem "Nossa História" */}
          <div className="relative bg-[#F9F7F2] p-6 md:p-14 rounded-sm shadow-sm border border-stone-100 overflow-hidden min-h-[900px] flex flex-col font-sans text-[#4A1E59]">
            
            {/* Elementos Decorativos de Fundo (Fitas Adesivas) */}
            <div className="absolute top-10 left-10 w-24 h-6 bg-[#B09A82]/30 -rotate-12 z-0" />
            <div className="absolute bottom-40 right-0 w-32 h-8 bg-[#B09A82]/20 rotate-45 z-0" />

            {/* Colagem de Fotos à Direita (Simulando a imagem original) */}
            <div className="absolute top-10 right-4 md:right-10 flex flex-col gap-10 z-20 pointer-events-none md:w-64">
              {/* Foto 1: Oficina/Lavanderia */}
              <div className="bg-white p-2 shadow-xl border border-gray-100 transform rotate-3 relative group">
                <div className="aspect-[4/5] bg-gray-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1517210122415-b0c70b2a09bf?q=80&w=400&auto=format&fit=crop" alt="Oficina 2023" className="w-full h-full object-cover" />
                </div>
                <Paperclip className="absolute -top-4 -right-4 w-8 h-8 text-[#4A1E59] -rotate-45 drop-shadow-md" />
                <div className="absolute top-0 left-1/4 -translate-y-2 w-12 h-4 bg-stone-300/40 rotate-[-5deg]" />
              </div>

              {/* Foto 2: Canecas */}
              <div className="bg-white p-2 shadow-xl border border-gray-100 transform -rotate-6 relative self-end mr-6">
                <div className="aspect-[1/1] w-32 md:w-48 bg-gray-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop" alt="Produtos" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#B09A82]/20 rounded-sm" />
              </div>

              {/* Foto 3: Garrafas */}
              <div className="bg-white p-2 shadow-2xl border border-gray-100 transform rotate-2 relative">
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1581672472448-43d8c117b96e?q=80&w=400&auto=format&fit=crop" alt="Lembranças" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#4A1E59]/5 rounded-full" />
              </div>
            </div>

            {/* Conteúdo de Texto à Esquerda */}
            <div className="relative z-10 max-w-[340px] md:max-w-[480px]">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] opacity-80 mb-2 block">NOSSA HISTÓRIA COMEÇOU ASSIM:</span>
              <div className="flex items-baseline gap-4 mb-10">
                <span className="text-sm font-black text-gray-400 tracking-widest">EM</span>
                <span className="text-9xl font-black tracking-tighter text-[#4A1E59] leading-none drop-shadow-sm">2023</span>
              </div>

              <div className="space-y-10">
                <p className="text-xl md:text-2xl font-medium leading-snug tracking-tight text-[#4A1E59]">
                  Começamos em uma lavanderia de <span className="font-black border-b-8 border-brand-gold/20">menos de 2m²</span>, dentro do nosso próprio apartamento, com muito trabalho, fé e propósito.
                </p>

                <div className="relative inline-block">
                  <div className="bg-[#E9DFF5] px-10 py-5 rounded-sm transform rotate-[-1.5deg] shadow-md border border-[#D1C4E9]">
                    <span className="text-[14px] font-black uppercase tracking-widest leading-tight block">COMEÇAMOS COM O QUE TÍNHAMOS</span>
                  </div>
                  <Paperclip className="absolute -left-6 -top-6 w-12 h-12 text-brand-gold -rotate-12 drop-shadow-sm" />
                </div>

                <div className="pt-6 relative">
                   <div className="absolute -top-6 right-0 md:-right-6">
                      <Heart className="w-10 h-10 text-brand-gold fill-current drop-shadow-sm" />
                   </div>
                   <div className="border-[3px] border-dashed border-[#4A1E59]/15 p-10 md:p-12 rounded-[2.5rem] bg-white/30 backdrop-blur-sm shadow-inner">
                     <p className="text-xs md:text-sm font-black uppercase tracking-[0.15em] text-[#4A1E59] leading-relaxed text-center italic">
                       "DE UMA PEQUENA LAVANDERIA, NASCERAM GRANDES HISTÓRIAS E MILHARES DE CANECAS E GARRAFAS QUE LEVARAM E LEVAM <span className="text-brand-primary">AMOR</span> POR AI."
                     </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Seção Paixão (Sticker Roxo Inferior) - Estilo papel rasgado/post-it */}
            <div className="mt-auto pt-24 relative z-30">
              {/* Megafone Flutuante com sombra profunda */}
              <div className="absolute -top-24 left-6 transform -rotate-12 z-50">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-50">
                  <Megaphone className="w-16 h-16 text-[#4A1E59]" />
                </div>
              </div>

              <div className="bg-[#4A1E59] text-white p-12 md:p-20 rounded-b-sm rounded-tr-[120px] shadow-2xl transform rotate-[0.3deg] relative">
                {/* Tachinha (Pin) bem destacada */}
                <Pin className="absolute -top-10 right-20 w-16 h-16 text-brand-gold drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] rotate-12 z-50 fill-current" />
                
                <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic mb-10 border-b-4 border-white/10 pb-6 flex items-center gap-8">
                  PAIXÃO
                  <div className="h-2 w-32 bg-white/10 rounded-full" />
                </h3>

                <div className="space-y-12 text-lg md:text-2xl font-medium leading-relaxed italic opacity-95">
                  <p className="drop-shadow-sm">Apaixonada por arte, sempre gostei de criar peças com personalidade, pensando em detalhes que fogem do comum.</p>
                  <div className="flex gap-6">
                    <div className="w-2 h-auto bg-brand-gold/60 rounded-full" />
                    <p className="italic">O que todo mundo já fazia nunca foi suficiente para mim. Desde o início, a intenção era entregar algo além do óbvio.</p>
                  </div>
                </div>

                {/* Ícones de conversa e carimbo final simulando a imagem */}
                <div className="mt-16 flex items-end justify-between">
                  <div className="flex gap-6 opacity-30">
                    <div className="w-14 h-12 bg-white/20 rounded-[1.2rem] relative">
                      <div className="absolute -bottom-2 left-5 w-5 h-5 bg-white/20 rotate-45" />
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full" />
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Carimbo Circular Logo */}
                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center p-4 border-[6px] border-brand-gold rotate-[-15deg] shadow-2xl transform hover:scale-110 transition-transform overflow-hidden">
                      <img 
                        src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
                        alt="Logo Stamp" 
                        className="w-full h-auto object-contain scale-150"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enfeite central final (Coração entre traços) */}
            <div className="mt-20 mx-auto flex items-center gap-8 opacity-25">
              <div className="h-[2px] w-24 bg-current" />
            </div>
          </div>

          {/* Nova Seção: Por que o Nome GAT? e O que cresceu junto com a marca */}
          <div className="mt-16 space-y-20 max-w-[550px] mx-auto text-center px-4 relative">
             {/* Por que o Nome GAT? */}
             <div className="flex flex-col items-center gap-8">
                <div className="relative inline-block">
                   <h3 className="text-3xl md:text-4xl font-black text-[#4A1E59] uppercase tracking-tighter italic">POR QUE O NOME GAT?</h3>
                   <div className="absolute -right-14 -top-4 opacity-50 hidden md:block">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-[150deg] text-[#4A1E59]"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                   </div>
                </div>

                <div className="space-y-6 text-[#4A1E59] font-medium text-base md:text-lg leading-relaxed">
                   <p className="font-black text-xl italic text-brand-primary">GAT significa "gato" em catalão.</p>
                   <p>Meu pai me ensinava algumas palavras quando eu era criança, e uma delas foi a palavra <span className="font-black">GAT</span>.</p>
                   <p>Além da sonoridade marcante e da minha paixão por animais, esse nome carrega uma <span className="font-black underline decoration-brand-gold decoration-4 underline-offset-4">lembrança muito especial da minha infância.</span></p>
                   <p>Por isso, escolhi trazê-la para a marca: como uma homenagem ao meu pai e às memórias afetivas que ficaram para sempre comigo.</p>
                </div>

                {/* Box de Missão Highlighted (Essência) */}
                <div className="bg-[#E9DFF5]/60 p-10 md:p-14 rounded-[2rem] border-2 border-brand-primary/10 shadow-sm relative overflow-hidden text-center">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-primary/20" />
                   <p className="text-[#4A1E59] font-bold italic leading-relaxed text-sm md:text-lg">
                     "E essa essência também se conecta diretamente à missão da marca: <span className="text-brand-primary">transformar lindas lembranças em algo físico, eterno e cheio de significado.</span>"
                   </p>
                </div>
             </div>

             {/* O Que Cresceu Junto com a Marca */}
             <div className="pt-8 flex flex-col items-center gap-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="bg-brand-gold p-4 rounded-2xl rotate-12 shadow-xl border-2 border-white">
                      <div className="text-white font-black text-3xl leading-none">!</div>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-[#4A1E59] uppercase tracking-tighter text-center md:text-left">O QUE CRESCEU JUNTO COM A MARCA</h3>
                </div>

                {/* Papel Rasgado Layout */}
                <div className="relative w-full">
                   <div className="bg-[#F9F7F2] p-10 md:p-16 relative shadow-inner border-t-[1px] border-stone-200/50 rounded-sm">
                      {/* Efeito de textura de papel */}
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
                      
                      <div className="relative z-10 space-y-8 text-[#4A1E59]/90 font-medium leading-relaxed text-base md:text-lg text-center md:text-justify italic">
                         <p className="drop-shadow-sm font-semibold"><span className="font-black text-brand-primary not-italic">O que começou pequeno ganhou força, estrutura e propósito.</span> Com o tempo, vieram novos produtos, investimentos em organização, melhorias nos processos e a expansão do atendimento para todo o Brasil.</p>
                      </div>
                      
                      {/* Rodapé do papel com mini ícones */}
                      <div className="mt-10 flex justify-center gap-4 opacity-20">
                         <Heart className="w-4 h-4 fill-current" />
                         <div className="h-[1px] w-20 bg-current self-center" />
                         <Heart className="w-4 h-4 fill-current" />
                      </div>
                   </div>
                   {/* Fita adesiva decorativa segurando o papel */}
                   <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-40 h-10 bg-stone-200/40 rotate-[-1deg] z-20 shadow-sm border border-white/20" />
                </div>
             </div>

             {/* Momentos Especiais (Papel Rasgado) */}
             <div className="pt-16 flex flex-col items-center gap-6">
                <div className="relative w-full">
                   <div className="bg-[#F9F7F2] p-10 md:p-16 relative shadow-lg border-y border-stone-200/30 rounded-sm overflow-hidden">
                      {/* Paper Texture Overlay */}
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
                      
                      {/* Better Torn edges simulation */}
                      <div className="absolute -top-2 left-0 right-0 h-4 bg-white flex justify-between overflow-hidden pointer-events-none">
                         {[...Array(40)].map((_, i) => (
                           <div key={i} className="min-w-[20px] h-6 bg-stone-100 rotate-[45deg] -mt-3 shadow-sm border-r border-stone-200/10" />
                         ))}
                      </div>
                      <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white flex justify-between overflow-hidden pointer-events-none">
                         {[...Array(40)].map((_, i) => (
                           <div key={i} className="min-w-[20px] h-6 bg-stone-100 -rotate-[45deg] mt-3 shadow-sm border-r border-stone-200/10" />
                         ))}
                      </div>

                      <div className="relative z-10 space-y-10 text-[#4A1E59] font-medium leading-[1.6] text-center px-4">
                         <p className="text-xl md:text-2xl drop-shadow-sm font-sans tracking-tight">
                           A loja passou a fazer parte de <span className="font-black text-[#4A1E59]">momentos especiais na vida de muitas pessoas</span>, como anúncios de gravidez, lembranças de batizado, presentes personalizados e outras ocasiões carregadas de significado e afeto.
                         </p>
                         <p className="font-extrabold text-[#4A1E59] text-lg md:text-xl leading-snug drop-shadow-sm">
                           Com o amadurecimento da marca, a atuação também se expandiu para o público corporativo.
                         </p>
                         
                         {/* Subtle decor inside the paper */}
                         <div className="pt-4 flex justify-center opacity-10">
                            <Heart className="w-6 h-6 fill-current" />
                         </div>
                      </div>
                   </div>
                   {/* Glue/Tape decoration at top */}
                   <div className="absolute -top-6 left-1/4 w-24 h-8 bg-[#B09A82]/15 -rotate-6 z-20 shadow-sm border border-white/10" />
                   <div className="absolute -top-4 right-1/4 w-20 h-8 bg-[#B09A82]/20 rotate-3 z-20 shadow-sm border border-white/10" />
                </div>

                <div className="max-w-[550px] mt-12 mb-4">
                   <p className="text-center font-bold text-lg md:text-2xl leading-[1.4] text-[#4A1E59] tracking-tight">
                     Hoje, a empresa <span className="font-black border-b-2 border-[#4A1E59]">atende negócios que buscam brindes personalizados para colaboradores, clientes e parceiros</span>, oferecendo produção organizada, atenção aos detalhes e prazos alinhados às necessidades de cada projeto.
                   </p>
                </div>
             </div>

             {/* Collage de Fotos Corporativo (Film Strip style) */}
             <div className="pt-10 w-full mb-12">
                <div className="relative group">
                   {/* Brown tape at top of the film frame */}
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#B09A82]/70 rounded-sm rotate-[1deg] z-40 shadow-xl border border-white/30 transform transition-transform group-hover:scale-105" />
                   
                   <div className="bg-[#4A1E59] p-5 pt-12 pb-10 rounded-xl shadow-[0_25px_60px_-15px_rgba(74,30,89,0.4)] relative overflow-hidden transform rotate-[-0.5deg]">
                      {/* Film strip holes decorative effect (Left & Right) */}
                      <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-between py-10 z-20">
                         {[...Array(16)].map((_, i) => <div key={i} className="w-3 h-4 bg-white/10 rounded-[2px]" />)}
                      </div>
                      <div className="absolute right-3 top-0 bottom-0 flex flex-col justify-between py-10 z-20">
                         {[...Array(16)].map((_, i) => <div key={i} className="w-3 h-4 bg-white/10 rounded-[2px]" />)}
                      </div>

                      {/* Photo Grid - One visual piece */}
                      <div className="grid grid-cols-2 gap-4 mb-4 px-6 relative z-10">
                         {/* Top Row - Mugs & Bottles Production */}
                         <div className="aspect-[1.1] bg-stone-200 overflow-hidden rounded-md relative group/photo">
                            <img src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?q=80&w=600&auto=format&fit=crop" alt="Produção de Canecas" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#4A1E59]/30 to-transparent opacity-60" />
                         </div>
                         <div className="aspect-[1.1] bg-stone-200 overflow-hidden rounded-md relative group/photo">
                            <img src="https://images.unsplash.com/photo-1602143303490-333f00ec0941?q=80&w=600&auto=format&fit=crop" alt="Produção de Garrafas" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#4A1E59]/30 to-transparent opacity-60" />
                         </div>
                         
                         {/* Bottom Row - Detail photos */}
                         <div className="col-span-2 grid grid-cols-3 gap-4">
                            <div className="aspect-[0.8] bg-stone-200 overflow-hidden rounded-md relative group/photo">
                               <img src="https://images.unsplash.com/photo-1581672472448-43d8c117b96e?q=80&w=400&auto=format&fit=crop" alt="Detalhe Caneca" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-110" />
                            </div>
                            <div className="aspect-[0.8] bg-stone-200 overflow-hidden rounded-md relative group/photo">
                               <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop" alt="Customização" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-110" />
                            </div>
                            <div className="aspect-[0.8] bg-stone-200 overflow-hidden rounded-md relative group/photo">
                               <img src="https://images.unsplash.com/photo-1512418490979-92798ccc1380?q=80&w=400&auto=format&fit=crop" alt="Lembrança Pronta" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500 hover:scale-110" />
                            </div>
                         </div>
                      </div>
                      
                      {/* Subtle brand mark inside the film strip */}
                      <div className="flex justify-center items-center gap-6 opacity-20">
                         <div className="h-[1px] flex-1 bg-white" />
                         <div className="flex gap-2">
                           <Heart className="w-4 h-4 text-white fill-current" />
                           <img 
                              src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
                              alt="USE.GAT" 
                              className="h-6 w-auto object-contain brightness-0 invert"
                            />
                         </div>
                         <div className="h-[1px] flex-1 bg-white" />
                      </div>
                   </div>
                </div>
             </div>

          </div>

          {/* Links Rápidos do Rodapé */}
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-brand-pink-light mt-16 px-4">
             <Link to="/contato" className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Fale Conosco</Link>
             <Link to="/privacidade" className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Trocas e Devoluções</Link>
             <Link to="/termos" className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Segurança</Link>
             <Link to="/perguntas-frequentes" className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary transition-colors">Dúvidas Frequentes</Link>
          </div>
        </div>
      )
    },
    {
      id: 'como-personalizar',
      title: 'Como personalizar seu pedido',
      content: (
        <div className="py-12 space-y-16">
          {/* Header Section - Paper with Torn Edges Effect */}
          <div className="relative w-full">
            <div className="bg-[#F9F7F2] p-10 md:p-14 relative shadow-sm border border-stone-200/40 rounded-sm overflow-hidden">
               {/* Paper Texture Overlay */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
               
               <div className="relative z-10 space-y-8 text-[#4A1E59] text-center">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
                    Na USE GAT® a personalização faz parte do carinho.
                  </h3>
                  
                  <div className="space-y-6 font-medium leading-relaxed max-w-2xl mx-auto">
                    <p className="text-lg md:text-xl italic">
                      Nosso objetivo não é só vender produtos personalizados, mas ajudar você a transformar <span className="font-black border-b-4 border-brand-gold/30">uma ideia, uma memória ou um gesto</span> em algo bonito de verdade.
                    </p>
                    <p className="text-sm md:text-base opacity-80 bg-white/50 p-6 rounded-2xl border border-dashed border-[#4A1E59]/20 shadow-inner">
                      Se você ficou em dúvida sobre como funciona a personalização no site, fica tranquilo(a): <span className="font-bold">aqui está tudo explicado de um jeito simples.</span>
                    </p>
                  </div>
               </div>
               {/* Tape decoration */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-[#B09A82]/15 rotate-[-1deg] z-20" />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* O que você pode personalizar - Post-it Style */}
            <div className="bg-white p-8 md:p-10 shadow-xl border border-stone-100 rotate-[-1.5deg] relative flex flex-col group hover:rotate-0 transition-transform">
               <Paperclip className="absolute -top-6 -left-4 w-12 h-12 text-brand-gold -rotate-12 drop-shadow-md" />
               <h4 className="text-xl font-black text-[#4A1E59] mb-6 uppercase tracking-tighter border-b-2 border-brand-gold/40 pb-2 w-fit">
                 O que você pode personalizar
               </h4>
               <p className="text-sm md:text-base font-medium text-[#4A1E59]/90 leading-relaxed mb-6">
                 Todos os produtos da loja são personalizados. Em cada página de produto, a descrição informa exatamente o que pode ser incluído, como: <span className="font-black italic">nome, frase, aparência, foto, data ou outras informações específicas.</span>
               </p>
               <div className="mt-auto bg-[#4A1E59] text-white p-4 rounded-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">Importante conferir a descrição do item!</p>
               </div>
            </div>

            {/* Importante sobre o modelo da arte - Dark Badge Style */}
            <div className="bg-[#4A1E59] text-white p-8 md:p-10 shadow-2xl rounded-sm rotate-[1deg] relative flex flex-col group hover:rotate-0 transition-transform overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
               <Pin className="absolute -top-4 right-10 w-12 h-12 text-brand-gold rotate-12 fill-current drop-shadow-lg" />
               
               <h4 className="text-xl font-black uppercase mb-6 tracking-tighter leading-none border-b border-white/20 pb-2">
                 Importante sobre o modelo da arte
               </h4>
               <p className="text-sm font-medium opacity-90 mb-6 italic">
                 Os produtos do site seguem fielmente o modelo do anúncio. Isso significa que <span className="font-black text-brand-gold">não alteramos</span>:
               </p>
               <ul className="grid grid-cols-1 gap-3 text-xs md:text-sm font-bold uppercase tracking-tight">
                 {['Cores da arte', 'Posição dos elementos', 'Desenhos ou ilustrações', 'Layout', 'Tipografia/Fonte'].map((item) => (
                   <li key={item} className="flex items-center gap-3 bg-white/5 p-2 rounded-md border border-white/10">
                     <Heart className="w-3 h-3 fill-brand-gold text-brand-gold" />
                     {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          {/* Instructions Box - Large Notepad Style */}
          <div className="relative max-w-2xl mx-auto pt-6">
            <div className="bg-[#E9DFF5] p-10 md:p-14 rounded-sm shadow-inner border-2 border-dashed border-[#4A1E59]/30 text-center relative">
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-full shadow-md border border-[#4A1E59]/10">
                  <span className="text-xs font-black text-[#4A1E59] uppercase tracking-[0.3em]">Instruções Precisas</span>
               </div>
               
               <div className="space-y-8">
                  <p className="text-lg md:text-xl font-black text-[#4A1E59] leading-tight tracking-tight">
                    Escreva os dados da forma mais clara possível, exatamente como deseja que apareçam no produto.
                  </p>
                  
                  <div className="h-[2px] w-12 bg-[#4A1E59]/20 mx-auto" />
                  
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4A1E59]/60">Como enviar as informações</h5>
                    <p className="text-sm md:text-base font-medium text-[#4A1E59]/80 italic">
                      Quando o produto permite foto, você pode enviar a imagem no campo disponível ou conforme a orientação da página do item.
                    </p>
                  </div>
               </div>

               {/* Sticker decor */}
               <div className="absolute -bottom-6 -right-6 bg-brand-gold text-white w-20 h-20 rounded-full flex items-center justify-center p-4 text-center transform rotate-12 shadow-xl border-4 border-white">
                  <span className="text-[10px] font-black uppercase leading-none">Feito com Amor</span>
               </div>
            </div>
          </div>


        </div>
      )
    },
    {
      id: 'duvidas-frequentes',
      title: 'Dúvidas Frequentes',
      content: (
        <div className="py-12 space-y-12">
          {/* FAQ Accordion-like layout in GAT Style */}
          <div className="max-w-2xl mx-auto space-y-6">
            
            {[
              {
                q: "POSSO ALTERAR A ARTE DO PRODUTO?",
                a: "No site, os produtos seguem o modelo do anúncio. Você pode personalizar apenas o que estiver indicado nos campos de cadastro. Caso queira uma arte totalmente nova, utilize o campo 'Projeto Arte' no menu principal."
              },
              {
                q: "COMO SEI O QUE POSSO PERSONALIZAR?",
                a: "Cada página de produto explica exatamente o que pode ser alterado: alguns aceitam nome, outros foto, data, etc. Confira sempre a descrição antes de finalizar!"
              },
              {
                q: "PRECISO MANDAR AS INFORMAÇÕES ORGANIZADAS?",
                a: "Quanto mais claro você escrever, melhor para o nosso processo de produção e menor o risco de erros na impressão final."
              },
              {
                q: "O PEDIDO VAI FICAR EXATAMENTE DO MEU JEITO?",
                a: "Sim! O produto segue a referência do modelo anunciado com as suas personalizações. Em casos de fotos, a nitidez e qualidade da imagem enviada são de responsabilidade do cliente."
              },
              {
                q: "FAZEM PEDIDOS EM GRANDE QUANTIDADE?",
                a: "Sim! Temos condições especiais para pedidos acima de 10 unidades ou R$500. Produzimos para casamentos, brindes corporativos e festas em geral."
              },
              {
                q: "QUAIS SÃO AS FORMAS DE PAGAMENTO?",
                a: "Trabalhamos com ambiente seguro (SSL) e aceitamos Cartão de Crédito, Boleto Bancário e Pix através de plataformas de pagamento confiáveis."
              },
              {
                q: "MEU CUPOM NÃO FUNCIONA, O QUE PODE SER?",
                a: "Geralmente ocorre por conflito com outras promoções automáticas, como o desconto de 5% no Pix, que não é cumulativo com cupons."
              },
              {
                q: "TEM EMBALAGEM PARA PRESETE?",
                a: "Sim! Todos os itens do varejo já são enviados prontos para presentear. Pedidos de atacado vêm em embalagens neutras para reduzir o custo final."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 shadow-md border border-stone-100 rounded-sm hover:-translate-y-1 transition-all relative group">
                <div className="absolute top-0 right-6 w-6 h-1.5 bg-brand-gold/15 rotate-[-3deg] group-hover:bg-brand-gold/30" />
                <h4 className="text-[11px] font-black text-[#4A1E59] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Heart className="w-3 h-3 text-brand-gold fill-current" />
                  {faq.q}
                </h4>
                <p className="text-[13px] font-medium text-[#4A1E59]/70 leading-snug lg:leading-tight">
                  {faq.a}
                </p>
              </div>
            ))}

            {/* Special Section for Production & Wholesale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
               <div className="bg-[#4A1E59] text-white p-8 rounded-sm shadow-xl relative overflow-hidden rotate-[-1deg]">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10" />
                  <Megaphone className="absolute -top-4 -right-4 w-16 h-16 opacity-10 -rotate-12" />
                  <h4 className="text-lg font-black uppercase tracking-tighter mb-4 relative z-10">Prazo de Produção</h4>
                  <p className="text-sm font-medium opacity-90 leading-relaxed mb-4 relative z-10">
                    Como cada item é feito especialmente para você, nosso prazo é de <span className="text-brand-gold font-black">5 a 7 dias úteis</span> + prazo dos correios.
                  </p>
                  <div className="text-[10px] uppercase font-black tracking-widest border-t border-white/20 pt-4 relative z-10">
                    DEDICAÇÃO EM CADA DETALHE
                  </div>
               </div>

               <div className="bg-brand-gold text-[#4A1E59] p-8 rounded-sm shadow-xl relative rotate-[1deg]">
                  <Pin className="absolute -top-3 left-10 w-10 h-10 text-[#4A1E59] -rotate-12 fill-current" />
                  <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Orçamentos Atacado</h4>
                  <p className="text-sm font-[700] mb-6">
                    Para lembranças, brindes e festas (acima de 10 unidades), fale direto com nossa equipe:
                  </p>
                  <a 
                    href="https://wa.me/552140402224" 
                    className="flex items-center justify-center gap-3 bg-[#4A1E59] text-white py-3 rounded-full font-black text-sm uppercase tracking-tighter hover:scale-105 transition-transform"
                  >
                    <WhatsAppIcon className="w-5 h-5 fill-current" />
                    21 4040-2224
                  </a>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'politicas-termos',
      title: 'Políticas e Termo de uso',
      content: (
        <div className="py-12 space-y-16">
          {/* Section 1: Como funcionam os pedidos */}
          <div className="bg-[#F9F7F2] p-8 md:p-12 relative shadow-sm border border-stone-200/40 rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
            <div className="relative z-10 space-y-8 text-[#4A1E59]">
              <h3 className="text-xl font-black uppercase tracking-tighter border-b-2 border-brand-gold/40 pb-2 w-fit">
                1. COMO FUNCIONAM OS PEDIDOS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-wider">1.1 Pedidos pelo site</h4>
                  <ul className="space-y-3 text-sm font-medium leading-relaxed opacity-90">
                    <li><span className="font-bold">Personalização:</span> O cliente escolhe um modelo disponível e pode personalizar apenas os textos ou frases dentro do espaço indicado e, quando houver, realizar o upload de fotos. Não realizamos alterações no layout original.</li>
                    <li><span className="font-bold">Produção:</span> Após confirmação, não há alterações, cancelamentos ou reembolsos. Não enviamos prévias, pois a personalização segue fielmente o modelo escolhido.</li>
                    <li><span className="font-bold">Conferência:</span> O cliente deve revisar tudo antes de finalizar. NÃO nos responsabilizamos por erros de digitação do cliente.</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-wider">1.2 Atacado (WhatsApp)</h4>
                  <ul className="space-y-3 text-sm font-medium leading-relaxed opacity-90">
                    <li><span className="font-bold">Fluxo:</span> Orçamento → Pagamento → Arte → Aprovação → Produção.</li>
                    <li><span className="font-bold">Alterações:</span> Até 4 gratuitas. A partir da 5ª, taxa de R$ 15,00 e o novo prazo poderá ser acrescido.</li>
                    <li><span className="font-bold">Conceito:</span> Mudanças completas em arte já aprovada serão consideradas um novo projeto e podem gerar novo orçamento.</li>
                    <li><span className="font-bold">Desistência:</span> Após o início da criação da arte digital, não haverá reembolso ou devolução.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-10 w-24 h-6 bg-[#B09A82]/15 rotate-3" />
          </div>

          {/* Section 2 & 3: Produção & Envio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Produção e Qualidade */}
             <div className="bg-white p-8 shadow-xl border border-stone-100 rotate-[-1deg] relative">
                <Paperclip className="absolute -top-6 -left-4 w-12 h-12 text-brand-gold -rotate-12 drop-shadow-md" />
                <h3 className="text-lg font-black uppercase tracking-tighter mb-6 text-[#4A1E59]">2. PRODUÇÃO E QUALIDADE</h3>
                <div className="space-y-6 text-sm font-medium text-[#4A1E59]/80 leading-relaxed">
                   <p><span className="font-black">2.1 Variação de Cores:</span> As imagens podem apresentar variações de 10% a 20% nas cores do produto final, devido às diferenças de telas e materiais (porcelana, vidro, alumínio etc.).</p>
                   <p><span className="font-black">2.2 Variações Naturais:</span> Por serem feitos manualmente, os itens podem ter pequenas diferenças de tonalidade e acabamento. Isso faz parte do processo e não caracteriza defeito.</p>
                </div>
             </div>

             {/* Envio e Prazos */}
             <div className="bg-[#4A1E59] text-white p-8 shadow-2xl relative rotate-[1deg]">
                <Pin className="absolute -top-4 right-10 w-12 h-12 text-brand-gold rotate-12 fill-current" />
                <h3 className="text-lg font-black uppercase tracking-tighter mb-6">3. ENVIO E PRAZOS</h3>
                <p className="text-sm italic mb-4 opacity-90">Sediados em Brasília (DF). Feriados locais podem afetar prazos de produção e envio.</p>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-tight">
                   <li className="bg-white/5 p-3 rounded border border-white/10">Logística pela transportadora após a postagem.</li>
                   <li className="bg-white/5 p-3 rounded border border-white/10">Prazo de produção é independente do prazo de envio.</li>
                   <li className="bg-white/5 p-3 rounded border border-white/10">3 tentativas de entrega; reenvio exige novo frete.</li>
                </ul>
             </div>
          </div>

          {/* Section 4 & 5: Responsabilidade & Trocas */}
          <div className="space-y-10">
             <div className="bg-[#E9DFF5] p-10 rounded-sm border-2 border-dashed border-[#4A1E59]/20 relative">
                <h3 className="text-xl font-black text-[#4A1E59] uppercase tracking-tighter mb-6 text-center">4. RESPONSABILIDADE DA TRANSPORTADORA</h3>
                <p className="text-sm font-medium text-[#4A1E59]/80 max-w-2xl mx-auto leading-relaxed text-center italic">
                   A USE GAT® atua como intermediadora. Nosso papel é acompanhar o caso e abrir chamados (extravios, atrasos, danos). A solução definitiva será aplicada somente após a confirmação oficial emitida pela transportadora.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-8 shadow-lg border border-stone-100 flex flex-col items-center text-center">
                   <ShieldCheck className="w-10 h-10 text-brand-primary mb-4" />
                   <h4 className="font-black text-[#4A1E59] uppercase mb-4 tracking-wider">5. TROCAS E DEVOLUÇÕES</h4>
                   <p className="text-xs font-medium text-[#4A1E59]/70 leading-relaxed">
                      Trocas possíveis apenas em caso de defeito de fabricação (7 dias corridos). <span className="font-black">Produtos personalizados NÃO possuem troca por arrependimento</span> (Art. 49 do CDC).
                   </p>
                </div>

                <div className="bg-[#F5F1E9] p-8 shadow-lg border border-stone-100 flex flex-col items-center text-center">
                   <Heart className="w-10 h-10 text-brand-gold mb-4 fill-current" />
                   <h4 className="font-black text-[#4A1E59] uppercase mb-4 tracking-wider">6. CUIDADOS</h4>
                   <p className="text-xs font-medium text-[#4A1E59]/70 leading-relaxed italic">
                      Lave com sabão neutro e esponja macia. Evite abrasivos. Use micro-ondas apenas em itens permitidos (nunca peças metálicas, cristal ou madeira).
                   </p>
                </div>
             </div>
          </div>

          {/* Section 7 & 8: Direitos & SAC */}
          <div className="bg-[#4A1E59] text-white p-10 rounded-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-5" />
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h3 className="text-lg font-black uppercase tracking-widest border-b border-white/20 pb-2">POLÍTICA DE USO</h3>
                   <div className="text-sm space-y-4 opacity-90">
                      <p>7.1 <span className="font-bold">Aceitação:</span> Ao navegar e realizar pedidos, você declara ciência e concordância com estas políticas.</p>
                      <p>7.2 <span className="font-bold">Direitos Autorais:</span> Todas as artes da USE GAT® são exclusivas e protegidas. Proibida reprodução não autorizada.</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-lg font-black uppercase tracking-widest border-b border-white/20 pb-2">8. SAC</h3>
                   <div className="text-sm space-y-2 font-bold uppercase tracking-tight">
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-gold" /> atendimento@usegat.com</p>
                      <p className="flex items-center gap-2"><WhatsAppIcon className="w-4 h-4 fill-brand-gold text-brand-gold" /> (21) 4040-2226 (Seg-Sex, 9h-17:30)</p>
                      <p className="flex items-center gap-2 opacity-60"><MapPin className="w-4 h-4" /> Rua Visconde de Pirajá, 595, Sala 705, Ipanema – RJ</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'regulamento-cupons',
      title: 'Regulamento de Cupons',
      content: (
        <div className="py-12 space-y-16">
          {/* Header Section - Decorative Paper */}
          <div className="relative w-full">
            <div className="bg-[#FFF5F8] p-10 md:p-14 relative shadow-sm border border-brand-pink-light/30 rounded-sm overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
               <div className="relative z-10 text-center space-y-6">
                  <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tighter italic">
                    REGULAMENTO DO CUPOM <br/> DE PRIMEIRA COMPRA
                  </h3>
                  <div className="space-y-4 max-w-xl mx-auto font-medium text-[#4A1E59]">
                    <p className="text-base md:text-lg italic">
                      Se é a sua primeira vez por aqui, <span className="font-black border-b-4 border-brand-gold/30">seja muito bem-vindo(a)!</span>
                    </p>
                    <p className="text-sm opacity-80">
                      Criamos esse cupom com muito carinho pra você se sentir ainda mais especial.
                    </p>
                  </div>
               </div>
               <div className="absolute top-0 left-1/4 w-20 h-6 bg-[#B09A82]/15 -rotate-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Quem pode usar? */}
            <div className="bg-white p-8 shadow-xl border border-stone-100 rotate-[-1deg] relative">
               <Paperclip className="absolute -top-6 -left-4 w-12 h-12 text-brand-gold -rotate-12" />
               <h4 className="text-lg font-black text-[#4A1E59] uppercase tracking-tighter mb-4 border-b border-[#4A1E59]/10 pb-2 flex items-center gap-2">
                 <Heart className="w-4 h-4 fill-brand-gold text-brand-gold" />
                 Quem pode usar?
               </h4>
               <ul className="space-y-4 text-sm font-medium text-[#4A1E59]/80 leading-relaxed">
                  <li>• O cupom <span className="font-black text-brand-primary">AMOUSEGAT</span> é válido para sua primeira compra no site, e está limitado a 1 uso por CPF.</li>
                  <li>• Se você já comprou com a gente antes mas não usou nenhum cupom, pode ficar tranquilo(a): ele ainda será válido pra você!</li>
               </ul>
            </div>

            {/* Como usar? */}
            <div className="bg-[#4A1E59] text-white p-8 shadow-2xl rotate-[1deg] relative">
               <Pin className="absolute -top-4 right-8 w-12 h-12 text-brand-gold rotate-12 fill-current" />
               <h4 className="text-lg font-black uppercase tracking-tighter mb-4 border-b border-white/20 pb-2">Como usar?</h4>
               <ul className="space-y-4 text-sm font-medium opacity-90 leading-relaxed italic">
                  <li>• O cupom deve ser aplicado na finalização da sua compra, antes do pagamento.</li>
                  <li>• O desconto será calculado automaticamente após clicar em <span className="font-black text-brand-gold">“Aplicar cupom”</span>.</li>
               </ul>
            </div>
          </div>

          {/* Parcelamento Section */}
          <div className="bg-[#E9DFF5] p-10 rounded-sm border-2 border-dashed border-[#4A1E59]/20 text-center relative max-w-xl mx-auto">
             <h4 className="font-black text-[#4A1E59] uppercase mb-4 tracking-wider">Posso parcelar minha compra com o cupom?</h4>
             <p className="text-base font-medium text-[#4A1E59]/80 italic">
                Pode sim! O desconto é aplicado no valor total do pedido, e depois você escolhe a forma de pagamento que preferir.
             </p>
          </div>

          {/* Outras Info & Atenção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="bg-white p-8 shadow-lg border border-stone-100 flex flex-col">
                <h4 className="font-black text-[#4A1E59] uppercase mb-6 tracking-wider border-b-2 border-brand-gold/30 pb-2 w-fit">Informações Importantes</h4>
                <ul className="space-y-3 text-xs font-bold text-[#4A1E59]/70 uppercase tracking-tight">
                   <li className="flex gap-2"><span>•</span> O cupom não é cumulativo com outras promoções ativas.</li>
                   <li className="flex gap-2"><span>•</span> Não é possível usar o cupom fora do site (WhatsApp/Instagram).</li>
                   <li className="flex gap-2"><span>•</span> O valor do desconto pode ser alterado sem aviso prévio.</li>
                </ul>
             </div>

             <div className="bg-brand-gold text-[#4A1E59] p-8 shadow-xl relative rotate-[-1deg]">
                <h4 className="font-black uppercase mb-4 tracking-tighter border-b border-[#4A1E59]/20 pb-2">Atenção</h4>
                <p className="text-xs font-black leading-relaxed">
                   Em casos de cancelamento ou reembolso, o cupom <span className="underline">não é reativado automaticamente</span>. Por isso, recomendamos usar com carinho e certeza!
                </p>
                <Pin className="absolute -bottom-4 -left-4 w-10 h-10 text-[#4A1E59] rotate-[160deg] fill-current" />
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'politica-privacidade',
      title: 'Política de privacidade',
      content: (
        <div className="py-12 space-y-16">
          {/* Header Section - Modern Paper style */}
          <div className="relative w-full">
            <div className="bg-[#F9F7F2] p-10 md:p-14 relative shadow-sm border border-stone-200/40 rounded-sm overflow-hidden text-center">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
               <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-black text-[#4A1E59] uppercase tracking-tighter italic leading-none">
                    POLÍTICA DE <br/> PRIVACIDADE
                  </h3>
                  <div className="h-1 w-20 bg-brand-gold mx-auto" />
                  <p className="max-w-2xl mx-auto text-sm font-medium text-[#4A1E59]/80 leading-relaxed italic">
                    A Loja USE GAT se compromete com a segurança de seus dados e é claro que aqui na nossa loja oficial não utilizamos suas informações no nosso benefício!
                  </p>
               </div>
               <div className="absolute top-0 right-10 w-24 h-6 bg-[#B09A82]/15 rotate-3" />
            </div>
          </div>

          {/* Pillars of Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="bg-white p-8 shadow-xl border border-stone-100 rotate-[-1deg] relative">
                <Paperclip className="absolute -top-6 -left-4 w-12 h-12 text-brand-gold -rotate-12" />
                <h4 className="text-lg font-black text-[#4A1E59] uppercase tracking-tighter mb-4 border-b border-[#4A1E59]/10 pb-2">Segurança Total</h4>
                <p className="text-xs font-medium text-[#4A1E59]/80 leading-relaxed">
                  Priorizamos a privacidade e a segurança de nossos clientes durante todo o processo de navegação e compra pelo site. Todos os dados cadastrados (nome, endereço, CPF) <span className="font-black">nunca serão comercializados ou trocados</span>.
                </p>
             </div>

             <div className="bg-[#4A1E59] text-white p-8 shadow-2xl rotate-[1deg] relative">
                <Pin className="absolute -top-4 right-10 w-12 h-12 text-brand-gold rotate-12 fill-current" />
                <h4 className="text-lg font-black uppercase tracking-tighter mb-4 border-b border-white/20 pb-2">Uso de Cookies</h4>
                <p className="text-xs font-medium opacity-90 leading-relaxed italic">
                  Utilizamos cookies e informações de sua navegação para traçar um perfil do público, aperfeiçoar nossos serviços, produtos e conteúdo. Todo processo de dados é regulamentado pela <span className="font-black text-brand-gold">LGPD</span>.
                </p>
             </div>
          </div>

          {/* LGPD Education Section */}
          <div className="bg-[#E9DFF5] p-10 rounded-sm border-2 border-dashed border-[#4A1E59]/20 relative">
             <h4 className="text-xl font-black text-[#4A1E59] uppercase tracking-tighter mb-8 text-center">Entenda a LGPD</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]/60">O QUE É A LGPD?</h5>
                   <p className="text-xs font-medium text-[#4A1E59]">A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) regulamenta o tratamento de dados pessoais de clientes e usuários por parte de empresas.</p>
                </div>
                <div className="space-y-3">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]/60">O QUE SÃO DADOS PESSOAIS?</h5>
                   <p className="text-xs font-medium text-[#4A1E59]">Qualquer informação capaz de identificar você (nome, CPF, RG) ou que, em conjunto com outros dados, tornam você identificável (gênero, idade, telefone).</p>
                </div>
                <div className="space-y-3">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]/60">TRATAMENTO DE DADOS?</h5>
                   <p className="text-xs font-medium text-[#4A1E59]">É tudo o que uma empresa pode fazer com os dados: coleta, qualificação, compartilhamento e exclusão.</p>
                </div>
             </div>
          </div>

          {/* Detailed Cookie Section */}
          <div className="bg-white p-10 border border-stone-100 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -translate-y-12 translate-x-12" />
             <h4 className="text-lg font-black text-[#4A1E59] uppercase tracking-wider mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-brand-primary" />
                Dúvidas sobre Cookies
             </h4>
             <div className="space-y-8 text-sm font-medium text-[#4A1E59]/80 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <p className="font-black italic text-brand-primary">Cookies da Sessão</p>
                      <p className="text-xs">Temporários, utilizados para lembrar de você durante a visita e expiram ao fechar o navegador.</p>
                   </div>
                   <div className="space-y-2">
                      <p className="font-black italic text-brand-primary">Cookies Persistentes</p>
                      <p className="text-xs">Permanecem no dispositivo após fechar o navegador. Servem para medir eficácia e analisar padrões de comportamento.</p>
                   </div>
                </div>
                <p className="bg-brand-gold/10 p-5 rounded-sm border-l-4 border-brand-gold text-xs italic">
                  Você fornece essas informações de forma consciente e voluntária por meio do aceite dos cookies e no momento da realização de um pedido.
                </p>
             </div>
          </div>

          {/* Rights and Security Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="bg-[#4A1E59] text-white p-8 shadow-xl relative">
                <h4 className="text-lg font-black uppercase tracking-tighter mb-6 border-b border-white/20 pb-2">Seus Direitos</h4>
                <ul className="space-y-3 text-[10px] font-bold uppercase tracking-tight opacity-90">
                   <li className="flex gap-2"><span>•</span> Confirmação e acesso aos dados</li>
                   <li className="flex gap-2"><span>•</span> Correção de dados incompletos ou errados</li>
                   <li className="flex gap-2"><span>•</span> Anonimização, bloqueio ou eliminação</li>
                   <li className="flex gap-2"><span>•</span> Portabilidade dos dados</li>
                   <li className="flex gap-2"><span>•</span> Revogação do consentimento</li>
                </ul>
                <Pin className="absolute -bottom-4 -left-4 w-10 h-10 text-brand-gold rotate-[160deg] fill-current" />
             </div>

             <div className="bg-brand-gold text-[#4A1E59] p-8 shadow-xl relative">
                <h4 className="text-lg font-black uppercase tracking-tighter mb-6 border-b border-[#4A1E59]/20 pb-2">Armazenamento</h4>
                <p className="text-xs font-black leading-relaxed italic mb-6">
                   Os Dados Pessoais são armazenados somente pelo tempo necessário para cumprir as finalidades legais, regulatórias ou contratuais.
                </p>
                <div className="bg-white/20 p-4 rounded-sm">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]">Dica de Segurança:</p>
                   <p className="text-[10px] font-bold mt-1">Nunca forneça seus dados de acesso (login/senha) a terceiros.</p>
                </div>
             </div>
          </div>

          {/* Security Certificates - Collage Style */}
          <div className="bg-[#F5F1E9] p-10 md:p-14 rounded-sm border border-stone-200 relative">
             <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-black text-[#4A1E59] uppercase tracking-tighter">Certificados de Segurança</h4>
                   <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Ambiente 100% Criptografado</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="flex gap-6 items-start">
                      <div className="bg-white p-4 shadow-md rounded-2xl rotate-[-5deg] shrink-0">
                         <div className="w-10 h-10 text-brand-primary">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <h5 className="text-[11px] font-black text-[#4A1E59] uppercase tracking-wider">SELO GOOGLE SAFE BROWSING</h5>
                         <p className="text-[10px] font-medium text-[#4A1E59]/70 leading-relaxed">
                            O Google atesta que nosso website é seguro para navegação através de inspeções diárias contra ameaças digitais.
                         </p>
                      </div>
                   </div>

                   <div className="flex gap-6 items-start">
                      <div className="bg-white p-4 shadow-md rounded-2xl rotate-[5deg] shrink-0">
                         <ShieldCheck className="w-10 h-10 text-brand-primary" />
                      </div>
                      <div className="space-y-2">
                         <h5 className="text-[11px] font-black text-[#4A1E59] uppercase tracking-wider">CERTIFICADO SSL</h5>
                         <p className="text-[10px] font-medium text-[#4A1E59]/70 leading-relaxed">
                            Criptografia de 256 bits (HTTPS) que elimina a possibilidade de interceptação de dados sensíveis durante a compra.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-[#4A1E59]/10 text-center">
                   <p className="text-[10px] font-black text-[#4A1E59] uppercase tracking-widest opacity-60 italic">
                      USE GAT® garante que seus dados serão usados exclusivamente para processamento de pedidos.
                   </p>
                </div>
             </div>
             <Paperclip className="absolute -bottom-6 -right-4 w-12 h-12 text-[#4A1E59]/10 rotate-[20deg]" />
          </div>
        </div>
      )
    },
    {
      id: 'acompanhar',
      title: 'Venha nos acompanhar',
      content: (
        <div className="py-8 space-y-10">
          {/* Instagram Reels Grid - Polaroid Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                img: "https://i.postimg.cc/RFfLzxLr/Whats-App-Image-2026-05-15-at-11-04-44.jpg",
                link: "https://www.instagram.com/reel/DOHu3lpDWG2/"
              },
              {
                img: "https://i.postimg.cc/rp9qZKvm/Whats-App-Image-2026-05-15-at-11-07-08.jpg",
                link: "https://www.instagram.com/reel/DOPANAUCSn7/"
              },
              {
                img: "https://i.postimg.cc/gcL2mkh3/Whats-App-Image-2026-05-15-at-11-08-33.jpg",
                link: "https://www.instagram.com/reel/DLBUtyAsecw/"
              },
              {
                img: "https://i.postimg.cc/MHm4qQmW/Whats-App-Image-2026-05-15-at-11-09-59.jpg",
                link: "https://www.instagram.com/reel/DJ9pADbRpAm/"
              }
            ].map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noreferrer"
                className={cn(
                  "bg-white p-2 shadow-lg border border-stone-100 block transition-transform hover:scale-105 hover:rotate-0",
                  idx % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                )}
              >
                <div className="aspect-[1/1] overflow-hidden bg-stone-100 mb-2 relative group">
                  <img src={item.img} alt={`Gat Instagram ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Instagram className="text-white w-8 h-8" />
                  </div>
                </div>
                <div className="text-[10px] font-black text-[#4A1E59] uppercase tracking-widest text-center opacity-40">
                  @use.gat
                </div>
              </a>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4">
            <a href={`https://instagram.com/${instagramUser}`} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#F5F1E9] border border-brand-pink-light rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm group">
              <Instagram className="w-6 h-6" />
            </a>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#F5F1E9] border border-brand-pink-light rounded-full flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm group">
              <WhatsAppIcon className="w-6 h-6 fill-current" />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 'pagamento',
      title: 'Formas de pagamento',
      content: (
        <div className="py-4">
          <div className="flex flex-wrap gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <span className="text-[10px] font-black text-brand-primary">PIX</span>
            </div>
          </div>
          <p className="text-[9px] font-black text-gray-400 mt-4 uppercase tracking-[0.2em]">Pagamento Seguro & Criptografado</p>
        </div>
      )
    },
    {
      id: 'seguro',
      title: 'Ambiente seguro',
      content: (
        <div className="space-y-6 py-6">
          <div className="flex justify-start">
            <img 
              src="https://i.postimg.cc/nL7MTF1R/Whats-App-Image-2026-05-15-at-11-16-02.jpg" 
              alt="Certificados de Segurança SSL e Google" 
              className="h-10 md:h-12 w-auto shadow-sm rounded-sm"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="bg-[#F5F1E9] p-4 rounded-sm border border-stone-100 flex items-center gap-3">
             <ShieldCheck className="w-5 h-5 text-brand-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]">Sua compra é 100% segura e Protegida</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <footer className="bg-white pt-10 pb-12 border-t border-brand-pink-light font-sans">
      <div className="max-w-3xl mx-auto px-6">
        {/* Topic Style Footer as requested */}
        <div className="divide-y divide-brand-pink-light/50">
          {sections.map((section) => (
            <div key={section.id} className="w-full">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-6 group text-left"
              >
                <span className={cn(
                  "text-base font-black uppercase tracking-widest transition-colors",
                  openSection === section.id ? "text-brand-primary" : "text-brand-black"
                )}>
                  {section.title}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-300",
                  openSection === section.id && "rotate-180 text-brand-primary"
                )} />
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                openSection === section.id ? "max-h-[4000px] opacity-100 py-4" : "max-h-0 opacity-0"
              )}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Bottom Info */}
        <div className="mt-20 pt-10 border-t border-brand-pink-light">
          <div className="flex flex-col items-center text-center space-y-8">
            <Link to="/" className="flex flex-col items-center">
              <img 
                src="https://i.postimg.cc/prwzf4PB/Chat-GPT-Image-15-05-2026-14-12-27.png" 
                alt="USE.GAT Logo" 
                className="h-20 w-auto object-contain"
              />
            </Link>
            
            <div className="max-w-2xl space-y-6">
              <div className="space-y-4 px-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                  Todo o conteúdo do site, todas as fotos, imagens, logotipos, marcas, layout, aqui veículados são de propriedade exclusiva da <span className="text-brand-primary">USE GAT PERSONALIZADOS LTDA</span>. 
                  É vedada qualquer reprodução, total ou parcial, de qualquer elemento de identidade, sem expressa autorização. 
                  A violação de qualquer direito mencionado implicará na responsabilização cível e criminal nos termos da Lei.
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-black uppercase tracking-widest">
                  Asa Sul- Brasilia, Distrito Federal CEP: 70301-0O
                </p>
                <p className="text-[10px] font-black text-brand-black uppercase tracking-widest">
                  USE GAT PERSONALIZADOS LTDA • CNPJ 66.154.938/0001-74
                </p>
              </div>

              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic opacity-70">
                Os preços dos produtos estão sujeitos a alteração sem aviso prévio.
              </p>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/50 pt-4">
              © 2026 USE.GAT • TODOS OS DIREITOS RESERVADOS
            </p>

            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-primary/40 hover:text-brand-primary transition-colors pt-2"
              >
                <Settings className="w-3 h-3" />
                Painel Administrativo
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
