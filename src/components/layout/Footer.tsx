import React, { useEffect, useState } from 'react';
import { Instagram, Mail, Phone, MapPin, Heart, ChevronDown, ShieldCheck, Calendar, Settings } from 'lucide-react';
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
        const globalDoc = q.docs.find(d => d.id === 'global') || q.docs[0];
        setSettings(globalDoc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const instagramUser = settings?.instagram || 'use.gat';
  const whatsappNumber = settings?.whatsapp || '5521999999999';
  const email = settings?.email || 'contato@usegat.com.br';

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const renderSectionContent = (id: string, fallbackContent: React.ReactNode) => {
    const keyId = id.replace(/-/g, '_');
    const type = settings?.[`acc_${keyId}_type`] || 'default';
    const text = settings?.[`acc_${keyId}_text` || ''];
    const imageUrl = settings?.[`acc_${keyId}_image` || ''];

    if (type === 'text') {
      return (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150">
            <p className="text-xs sm:text-sm text-brand-gray font-medium leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap text-center sm:text-left">
              {text || "Nenhum texto cadastrado ainda nas Configurações da aba."}
            </p>
          </div>
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div className="py-6 flex justify-center">
          <div className="bg-[#FAF7F8] p-4 sm:p-6 rounded-[2.5rem] border border-stone-150 w-full flex justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Banner Personalizado" 
                className="w-full h-auto max-h-[850px] object-contain rounded-2xl shadow-sm hover:scale-[1.01] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="p-8 text-center text-xs text-brand-gray uppercase tracking-widest font-black">
                Nenhuma imagem carregada ainda nas Configurações da aba.
              </div>
            )}
          </div>
        </div>
      );
    }

    return fallbackContent;
  };

  const sections = [
    {
      id: 'use-gat',
      title: 'Use Gat',
      content: renderSectionContent('use_gat', (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150">
            <div className="flex flex-col items-center text-center space-y-6">
              <img 
                src="/imagens/logo-gat-purple.png" 
                alt="USE GAT Logo" 
                className="h-16 w-auto object-contain"
              />
              <div className="space-y-4 text-brand-gray font-medium leading-relaxed max-w-lg text-sm">
                <p>
                  A <span className="font-bold text-brand-primary">USE GAT®</span> é uma marca especializada em mimos e presentes personalizados criativos que contam histórias.
                </p>
                <p>
                  Criamos e confeccionamos canecas rústicas e garrafas térmicas sob medida em Brasília (DF), despachando carinho em caixas preparadas com muito afeto para todo o território nacional.
                </p>
              </div>
            </div>
          </div>
        </div>
      ))
    },
    {
      id: 'atendimento',
      title: 'Atendimento',
      content: renderSectionContent('atendimento', (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150 space-y-8">
            <h3 className="text-lg font-serif font-bold text-center text-brand-black border-b border-stone-200 pb-3">Fale com o Ateliê</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-brand-gray">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center space-y-2">
                <span className="text-2xl block">💬</span>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]">Atendimento PJ e Atacado</h4>
                <p className="font-bold text-sm text-brand-black">(21) 4040-2224</p>
                <p className="text-[9px] text-gray-400">Dúvidas & orçamentos corporativos</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center space-y-2">
                <span className="text-2xl block">📨</span>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]">Dúvidas Gerais</h4>
                <p className="font-bold text-sm text-brand-black">meupedido@usegat.com</p>
                <p className="text-[9px] text-gray-400">Suporte pós-compra e prazos</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center space-y-2">
                <span className="text-2xl block">⚜️</span>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A1E59]">Apoio & SAC</h4>
                <p className="font-bold text-sm text-brand-black">atendimento@usegat.com</p>
                <p className="text-[9px] text-gray-400">Críticas ou sugestões</p>
              </div>
            </div>
          </div>
        </div>
      ))
    },
    {
      id: 'quem-somos',
      title: 'Quem somos',
      content: renderSectionContent('quem_somos', (
        <div className="py-6 space-y-8">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150">
            {/* 1. Main Narrative text - Pristine styling */}
            <div className="space-y-6 max-w-2xl mx-auto text-center md:text-justify text-brand-gray font-medium text-sm sm:text-base leading-relaxed">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold block text-center">Nossa Trajetória Boho</span>
              <h3 className="text-3xl font-serif text-brand-black text-center mb-4">
                {settings?.about_title || "Começamos em uma lavanderia de 2m²"}
              </h3>
              
              {settings?.about_text ? (
                <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-medium text-brand-gray text-center md:text-justify">
                  {settings.about_text}
                </div>
              ) : (
                <>
                  <p>
                    A USE GAT nasceu em 2023, fruto de muito trabalho, perseverança e um propósito claro de criar mimos que tocam o coração de quem recebe. Começamos de forma simples, organizando materiais e criando peças exclusivas dentro de um pequeno espaço residencial.
                  </p>
                  <p>
                    Em seguida, passamos a ilustrar momentos inesquecíveis da vida de nossos clientes: revelações de batismo, anúncios de gravidez e presentes de casamento afetivos sob medida.
                  </p>
                  <p className="font-bold text-[#4A1E59] text-center italic py-2">
                    "De um pequeno compartimento residencial, nasceram histórias infinitas e canecas que levam amor por todo o território nacional."
                  </p>
                </>
              )}
            </div>

            {/* 2. Photo gallery grid - 3 requested URLs - Clean captions - Complete visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-white p-3 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between">
                <div className={`bg-stone-100 rounded-xl overflow-hidden mb-3 ${settings?.about_image ? 'h-auto max-h-[300px] flex items-center justify-center p-1' : 'aspect-[4/5]'}`}>
                  <img 
                    src={settings?.about_image || "/imagens/oficina-inicial.jpg"} 
                    alt={settings?.about_title || "Ateliê GAT"} 
                    referrerPolicy="no-referrer" 
                    className={`${settings?.about_image ? 'w-full h-auto max-h-[290px] object-contain rounded-lg' : 'w-full h-full object-cover'}`} 
                  />
                </div>
                <div className="text-center font-serif text-xs italic text-brand-black">
                  {settings?.about_title && settings?.about_image ? "Nossa Linda História" : "Nossa Oficina Inicial"}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between">
                <div className={`bg-stone-100 rounded-xl overflow-hidden mb-3 ${settings?.banner_img_2 ? 'h-auto max-h-[300px] flex items-center justify-center p-1' : 'aspect-[4/5]'}`}>
                  <img 
                    src={settings?.banner_img_2 || "/imagens/mugs-boho.jpg"} 
                    alt={settings?.banner_img_2_name || "Mugs Boho Minimalista"} 
                    referrerPolicy="no-referrer" 
                    className={`${settings?.banner_img_2 ? 'w-full h-auto max-h-[290px] object-contain rounded-lg' : 'w-full h-full object-cover'}`} 
                  />
                </div>
                <div className="text-center font-serif text-xs italic text-brand-black">
                  {settings?.banner_img_2_name || "Mugs Boho Minimalista"}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between">
                <div className={`bg-stone-100 rounded-xl overflow-hidden mb-3 ${settings?.banner_img_1 ? 'h-auto max-h-[300px] flex items-center justify-center p-1' : 'aspect-[4/5]'}`}>
                  <img 
                    src={settings?.banner_img_1 || "/imagens/banner-sua-historia.jpg"} 
                    alt={settings?.banner_img_1_name || "Garrafa 'Sua História'"} 
                    referrerPolicy="no-referrer" 
                    className={`${settings?.banner_img_1 ? 'w-full h-auto max-h-[290px] object-contain rounded-lg' : 'w-full h-full object-cover'}`} 
                  />
                </div>
                <div className="text-center font-serif text-xs italic text-brand-black">
                  {settings?.banner_img_1_name || "Garrafa 'Sua História'"}
                </div>
              </div>
            </div>

            {/* 3. Narrative additions */}
            <div className="mt-12 pt-8 border-t border-stone-250 max-w-xl mx-auto space-y-6 text-center text-brand-gray text-xs sm:text-sm">
              <h4 className="font-serif font-black uppercase text-brand-black text-md">Por que o nome GAT?</h4>
              <p className="italic">
                "Gat" significa gato em catalão. É uma homenagem afetiva da fundadora ao seu pai, que costumava lhe ensinar palavras desse idioma durante sua infância, mantendo acesa uma memória de afeto que agora inspira a marca.
              </p>
            </div>
          </div>
        </div>
      ))
    },
    {
      id: 'como-personalizar',
      title: 'Como personalizar seu pedido',
      content: renderSectionContent('como_personalizar', (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150 space-y-6 text-brand-gray text-sm">
            <h4 className="text-lg font-serif text-brand-black font-bold">Instruções Importantes</h4>
            <p>
              Todos os mimos da nossa loja incluem áreas de personalização artesanal. Cada página do produto especifica quais informações ele recebe (como nome completo, foto, preferências ou pequenas frases de até 10 palavras).
            </p>
            <p className="font-bold text-[#4A1E59]">
              * Lembrete: Os produtos seguem fielmente o leiaute original do modelo anunciado. Não realizamos alterações na posição dos desenhos, tipografia/fontes, cores estruturais da arte ou no estilo estético geral das ilustrações.
            </p>
          </div>
        </div>
      ))
    },
    {
      id: 'duvidas-frequentes',
      title: 'Dúvidas Frequentes',
      content: renderSectionContent('duvidas_frequentes', (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150 space-y-4">
            {[
              { q: "Qual o prazo de produção?", a: "Como cada peça é desenhada e gravada de forma única pra você, nosso prazo de confecção é de 5 a 7 dias úteis antes de enviar aos Correios." },
              { q: "Posso alterar as cores estruturais do modelo original?", a: "Para garantir os padrões estéticos do ateliê, mantemos as cores e as posições de fundo oficiais de cada linha temática." },
              { q: "Os mimos vêm prontos para presentes?", a: "Sim! Embalamos carinhosamente cada unidade com materiais naturais Boho perfeitos para surpresas." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-stone-100">
                <h4 className="font-bold text-[#4A1E59] text-xs uppercase mb-1">✦ {faq.q}</h4>
                <p className="text-xs text-brand-gray leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      ))
    },
    {
      id: 'politicas-termos',
      title: 'Políticas e Prazos',
      content: renderSectionContent('politicas_termos', (
        <div className="py-6">
          <div className="bg-[#FAF7F8] p-6 sm:p-10 rounded-[2.5rem] border border-stone-150 text-brand-gray text-xs sm:text-sm space-y-6">
            <h4 className="text-base font-serif font-bold text-brand-black">Políticas de Devolução & Arrependimento</h4>
            <p>
              Conforme o Código de Defesa do Consumidor brasileiro, produtos manufaturados sob especificação e 100% personalizados não comportam devoluções por mero arrependimento ou trocas de arte após aprovação da produção.
            </p>
            <p>
              Se houver quaisquer danos comprovados de transporte ou falhas do ateliê, garantimos a substituição imediata sem custos em até 7 dias corridos após o recebimento.
            </p>
          </div>
        </div>
      ))
    },
    {
      id: 'pagamento',
      title: 'Formas de pagamento',
      content: renderSectionContent('pagamento', (
        <div className="py-4">
          <div className="flex flex-wrap gap-4 opacity-75 justify-center sm:justify-start items-center">
            <img src="/imagens/payment-visa.svg" alt="Visa" className="h-4" />
            <img src="/imagens/payment-mastercard.svg" alt="Mastercard" className="h-4" />
            <div className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded text-xs font-black">PIX (-5% off)</div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-semibold uppercase tracking-wider text-center sm:text-left">Criptografia nativa em ambiente 100% seguro (SSL)</p>
        </div>
      ))
    },
    {
      id: 'seguro',
      title: 'Ambiente seguro',
      content: renderSectionContent('seguro', (
        <div className="py-4 flex flex-col sm:flex-row items-center gap-6">
          <img 
            src="/imagens/footer-whats.jpg" 
            alt="Ambiente Seguro" 
            className="h-10 w-auto rounded object-contain shadow-sm"
          />
          <div className="text-xs text-[#4A1E59] font-bold uppercase tracking-wider">
            🔐 Seus dados estão criptografados na USE GAT.
          </div>
        </div>
      ))
    }
  ];

  return (
    <footer className="bg-white pt-10 pb-16 border-t border-brand-pink-light font-sans relative z-30">
      <div className="max-w-3xl mx-auto px-6">
        {/* Topic Style Footer - Pristine, clean, no overlapping elements */}
        <div className="divide-y divide-brand-pink-light/50">
          {sections.map((section) => (
            <div key={section.id} className="w-full">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between py-6 group text-left outline-none focus:text-brand-primary"
              >
                <span className={cn(
                  "text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-colors",
                  openSection === section.id ? "text-brand-primary" : "text-brand-black"
                )}>
                  {section.title}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-gray-400 transition-transform duration-300",
                  openSection === section.id && "rotate-180 text-brand-primary"
                )} />
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                openSection === section.id ? "max-h-[5000px] opacity-100 pb-6" : "max-h-0 opacity-0"
              )}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Bottom Info */}
        <div className="mt-16 pt-10 border-t border-brand-pink-light">
          <div className="flex flex-col items-center text-center space-y-6">
            <Link to="/">
              <img 
                src="/imagens/logo-gat-purple.png" 
                alt="USE.GAT Logo" 
                className="h-16 w-auto object-contain"
              />
            </Link>
            
            <div className="max-w-xl space-y-4">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Todo o conteúdo do site, fotos, descrições, logotipos e identidades veículados aqui são de posse restrita da <span className="text-brand-primary font-black">USE GAT PERSONALIZADOS LTDA</span>. 
                Qualquer cópia ilegal estará sujeita às sanções jurídicas cabíveis.
              </p>

              <p className="text-[9px] font-black text-brand-black uppercase tracking-widest">
                Asa Sul - Brasília, DF • CNPJ 66.154.938/0001-74
              </p>
            </div>

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-primary/40 pt-4">
              © 2026 USE.GAT • TODOS OS DIREITOS RESERVADOS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
