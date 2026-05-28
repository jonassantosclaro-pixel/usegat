import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, Sparkles, MessageSquare, Instagram, Phone } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou a IA da USE GAT®. Como posso transformar seu dia hoje? 💖' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (forcedMessage?: string) => {
    const textToSend = forcedMessage || input.trim();
    if (!textToSend || isLoading) return;

    if (!forcedMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      // Map history to Gemini format if needed, but here we just send the new message
      // and let the server handle the context or just stateless for now to simplify
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const responseText = data.text || 'Desculpe, tive um probleminha. Pode repetir?';
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.warn('Chat API Error, falling back to local client-side FAQ matcher:', error);
      const fallbackText = getClientFAQResponse(textToSend);
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-8 z-[110] bg-brand-primary text-white p-4 rounded-full shadow-2xl flex items-center justify-center group border-2 border-white/20"
        aria-label="Chat IA"
      >
        <Bot className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 bg-white text-brand-primary p-1 rounded-full shadow-sm animate-pulse">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="absolute right-full mr-4 bg-white text-brand-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-brand-pink-light">
          Chat com nossa IA
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-40 lg:bottom-24 right-8 z-[120] w-[90vw] sm:w-[400px] h-[600px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-brand-pink-light overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-primary p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-2xl">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Gat IA</h3>
                  <span className="text-[10px] opacity-70 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online agora
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-6 overflow-y-auto space-y-4 bg-[#FAF7F8]/50"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-brand-primary text-white ml-auto rounded-tr-none shadow-md"
                      : "bg-white text-brand-black border border-brand-pink-light rounded-tl-none shadow-sm"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white border border-brand-pink-light p-4 rounded-3xl rounded-tl-none w-fit shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => handleSend('Como personalizar?')}
                className="whitespace-nowrap px-3 py-1.5 bg-brand-pink-medium rounded-full text-[10px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors border border-brand-pink-light"
              >
                🎨 Como personalizar?
              </button>
              <button 
                onClick={() => handleSend('Qual o prazo de entrega?')}
                className="whitespace-nowrap px-3 py-1.5 bg-brand-pink-medium rounded-full text-[10px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors border border-brand-pink-light"
              >
                🚚 Prazo de entrega
              </button>
              <button 
                onClick={() => window.open('https://instagram.com/use.gat', '_blank')}
                className="whitespace-nowrap px-3 py-1.5 bg-brand-pink-medium rounded-full text-[10px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors border border-brand-pink-light flex items-center gap-1"
              >
                <Instagram className="w-3 h-3" /> Instagram
              </button>
            </div>

            {/* Input */}
            <div className="p-6 border-t border-brand-pink-light bg-white">
              <div className="flex items-center gap-2 bg-[#FAF7F8] rounded-[2rem] px-4 py-2 border border-brand-pink-light focus-within:border-brand-primary/30 transition-colors">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua dúvida..."
                  className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-2 placeholder:text-gray-400"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-brand-primary text-white p-2 rounded-full disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getClientFAQResponse(userMessage: string): string {
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "");
  };

  const text = normalize(userMessage);

  // Define matcher rules (keywords & answers from the complete official FAQ)
  const rules = [
    {
      keywords: ["personalizar", "personalizacao", "gravar", "nome", "foto", "dados", "texto", "preencher", "frase", "parentesco", "data"],
      answer: "Todos os produtos da USE GAT® são personalizados. 😊\n\nEm cada página de produto, a descrição informa exatamente o que pode ser incluído, como: nome, frase, parentesco, foto, data ou outras informações específicas. É de suma importância escolher as opções certas e ler a descrição!"
    },
    {
      keywords: ["organizado", "organizada", "organizar", "claras", "informacoes enviadas", "observacoes"],
      answer: "Quanto mais claras e bem organizadas estiverem as informações enviadas por você, melhor! 😊\n\nIsso ajuda a nossa equipe de produção a seguir exatamente como você imaginou. O site possui campos específicos do produto para preenchimento de textos e observações."
    },
    {
      keywords: ["minha arte", "arte propria", "propria arte", "logotipo", "logo", "enviar arte", "enviar logo", "meu desenho", "meu logo", "upload logo"],
      answer: "Sim! 😊 Se você possui uma arte própria ou logotipo, clique no campo 'MINHA ARTE' localizado no menu principal do ateliê. Lá você poderá fazer o upload de seu arquivo. Lembre-se apenas de ler atentamente as diretrizes de formato correto descritas na página de envio."
    },
    {
      keywords: ["alterar arte original", "alteracao de arte", "alteram a arte", "desenhos", "mudar cor", "alterar cores", "mudar posicao", "mudar fonte", "altera layout"],
      answer: "Os produtos seguem fielmente o modelo apresentado no anúncio. Por esse motivo, nós não realizamos alterações estruturais em:\n- Cores da arte original ou dos elementos;\n- Posição dos elementos;\n- Desenhos ou ilustrações;\n- Layout geral;\n- Tipografia/fonte do anúncio.\n\nNa página do produto, preencha exatamente como deseja que os dados personalizados fiquem gravados."
    },
    {
      keywords: ["igual a foto", "igual à foto", "vai ser igual", "fidelidade", "ficar igual", "fiel", "foto do site"],
      answer: "Sim! 😊 O produto final seguirá fielmente o modelo anunciado e as estruturas originais, alterando apenas os textos, fotos e nomes personalizados enviados por você. Em itens com foto, a qualidade da imagem enviada é de inteira responsabilidade do cliente."
    },
    {
      keywords: ["previa", "ver antes", "esboco", "enviar previa", "ver a previa", "mostra arte", "amostra"],
      answer: "Não enviamos prévias de arte para pedidos realizados pelo site, pois a personalização segue exatamente o modelo escolhido e configurado pelo cliente no anúncio do anúncio."
    },
    {
      keywords: ["alterar arte depois", "corrigir dados", "mudar dados", "errei", "errado", "alterar apos", "corrigir nome", "revisar", "digitacao", "ortografia"],
      answer: "Caso tenha preenchido alguma informação incorretamente, entre em contato conosco em até 24 horas no e-mail meupedido@usegat.com ou WhatsApp (21) 4040-2224 com o número do seu pedido.\n\nApós o prazo de 24 horas, o item segue para produção e não poderá mais ser alterado, cancelado ou reembolsado. O cliente é inteiramente responsável por revisar grafias, nomes e digitações enviadas."
    },
    {
      keywords: ["uma unidade", "1 unidade", "so uma", "só uma", "so de 1", "só de 1", "fazer uma", "comprar um", "comprar uma"],
      answer: "Sim! 😊 Nós produzimos perfeitamente a partir de 1 unidade para presentear quem você ama."
    },
    {
      keywords: ["minimo", "minima", "quantidade minima", "quantidade mínima", "pedido minimo"],
      answer: "Não há quantidade mínima para pedidos comuns na loja! Produzimos perfeitamente a partir de 1 unidade. Parcerias em atacado corporativo possuem condições próprias de volume."
    },
    {
      keywords: ["cores impressao", "tela do celular", "cores ficam iguais", "variacao de cor", "calibracao", "10%", "20%"],
      answer: "As imagens do site podem apresentar variação de 10% a 20% nas cores do produto final. Isso se deve às variações de brilho e calibração das telas (celulares e monitores) e também à natureza física das superfícies graváveis como cerâmica, porcelana, vidro, alumínio ou aço inox."
    },
    {
      keywords: ["atacado", "acima de 10", "comprar lote", "revenda", "lote", "vender", "desconto quantidade", "lembranca corporativa"],
      answer: "Sim! 😊 Para pedidos maiores, brindes de empresas ou lembranças corporativas, temos descontos especiais para compras acima de 10 unidades. Entre em contato por WhatsApp no 📞 (21) 4040-2224 ou clique na opção ATACADO no menu principal do site para solicitar seu orçamento personalizado."
    },
    {
      keywords: ["prazo", "producao", "produzir", "tempo para fazer", "confeccao", "prazo de producao", "tempo de producao", "dias uteis"],
      answer: "Após a confirmação do pagamento, nosso prazo cuidadoso de produção é de 5 a 7 dias úteis. Após esse período, o pedido será despachado via transportadora conforme o frete selecionado no checkout."
    },
    {
      keywords: ["urgente", "urgencia", "pressa", "rapido", "acelerar", "antecipar", "emergencia", "prazo curto", "rio de janeiro", "brasilia"],
      answer: "Somos originários do Rio de Janeiro, mas nosso ateliê produtivo está situado hoje em Brasília, seguindo seu calendário local de feriados. Sempre nos empenhamos para produzir e agilizar os envios, mas respeitamos a qualidade padrão do prazo de 5 a 7 dias úteis de produção. Tenha atenção ao programar compras de urgência!"
    },
    {
      keywords: ["consigo receber antes", "chega antes", "data especifica", "receber antes", "autonomia", "data limite"],
      answer: "Após a postagem de encomenda, todo o processo de tráfego, rastreamento físico, prazos e tentativas passa a ser de responsabilidade absoluta da transportadora escolhida. A USE GAT® não possui autonomia para intervir nos prazos ou agilizar trâmites das transportadoras, mas acompanhamos de perto e abrimos chamados (como em atrasos ou extravios) para assegurar o cliente."
    },
    {
      keywords: ["entrega", "prazo de entrega", "quanto tempo", "demora", "chegar", "transporte", "correio", "sedex", "pac"],
      answer: "O prazo de recebimento exibido na simulação e no checkout é fornecido e gerido pelas transportadoras parceiras e varia por região geográfica ou imprevistos de trânsito (obstáculos climáticos, greves, etc)."
    },
    {
      keywords: ["rastrear", "rastreio", "codigo de rastreio", "enviar rastreio", "acompanhar", "onde esta", "postagem"],
      answer: "Sim! 😊 Assim que postado, o código e o link para rastreamento oficial da transportadora são enviados diretamente e de maneira automática para o seu e-mail cadastrado!"
    },
    {
      keywords: ["embalado", "embalagem", "embalar", "neutra", "presente", "pronto para presentear"],
      answer: "Todos os nossos pedidos comuns de varejo são carinhosamente enviados prontos para presentear. Apenas lotes de atacado são expedidos em caixas neutras protetoras para otimizar os custos de investimento dos nossos clientes."
    },
    {
      keywords: ["formas de pagamento", "pagar", "pagamento", "boleto", "cartao", "pix", "aceita", "parcela", "credito", "pagbank"],
      answer: "Contamos com um checkout criptografado e certificado por SSL. Oferecemos processamento extremamente seguro via PAGBANK® nas seguintes opções:\n- Pix (com 10% de desconto automático)\n- Cartão de Crédito (simulações de parcelas visíveis em tempo real)\n- Boleto Bancário"
    },
    {
      keywords: ["desconto pix", "pix tem desconto", "desconto no pix", "pago no pix", "pagamento pix"],
      answer: "Sim! Compras realizadas com pagamento via Pix recebem um desconto excelente de 10% de forma imediata (calculado sobre o subtotal de produtos, não abrangendo o frete)."
    },
    {
      keywords: ["parcelar", "parcelamento", "parcelas", "vezes", "dividir", "credito 10x", "sem juros"],
      answer: "Sim! 😊 Você poderá parcelar as suas compras em até 10 vezes no cartão de crédito. Sendo em até 3 parcelas, os juros são por nossa conta (sem juros)."
    },
    {
      keywords: ["todo o brasil", "entrega brasil", "envia para", "meu estado", "enviam para", "enviar para", "frete para"],
      answer: "Sim! Realizamos entregas oficiais e seguras em todos os estados do território brasileiro."
    },
    {
      keywords: ["valor do frete", "quanto é o frete", "frete gratis", "frete pago", "calcular frete", "custo do frete"],
      answer: "O frete é calculado de forma automática baseando-se no CEP inserido. Você poderá simular o frete e prazos na página de cada produto ou diretamente na finalização de carrinho."
    },
    {
      keywords: ["retirar", "retirada", "pessoalmente", "pegar", "brasilia", "retirar em", "busca", "df"],
      answer: "Se você reside em Brasília, realizamos retiradas em mãos sob agendamento prévio. Por favor, entre em contato via WhatsApp no 📞 (21) 4040-2224 antes de fechar sua compra no site para obter o código correto."
    },
    {
      keywords: ["quebrado", "defeito", "avaria", "danificado", "estragou", "quebrou", "amassou", "riscado", "sac@usegat.com"],
      answer: "Se porventura o seu produto apresentar algum defeito de fabricação ou danos causados no transporte físico da logística, entre em contato no e-mail sac@usegat.com em até 7 dias corridos após o recebimento.\n\nApós confirmada a ocorrência com as fotos, providenciaremos imediatamente o seu reembolso total ou a produção e novo reenvio gratuito do item!"
    },
    {
      keywords: ["atrasar", "atrase", "nao chegar", "extravio", "ressarcimento", "atraso"],
      answer: "A USE GAT® acompanha o status do pedido diariamente. Se o frete for confirmed como extraviado pela transportadora parceira, nós providenciaremos a reposição imediata da peça personalizada ou o ressarcimento integral do seu dinheiro, sem burocracias."
    },
    {
      keywords: ["tentativas de entrega", "correios voltando", "retornar ao remetente", "nao havia ninguem", "tentaram entregar", "destinatario ausente"],
      answer: "A transportadora realiza até 3 tentativas de entrega formais. Caso o destinatário esteja ausente em todas elas, o pacote retornará ao nosso ateliê em Brasília. Um novo custo de frete será cobrado do cliente para efetuar a re-postagem da mercadoria."
    },
    {
      keywords: ["trocar personalizado", "troca de personalizado", "trocar garrafa", "trocar caneca", "troca", "devolver personalizado", "desistir", "arrependimento", "art 49"],
      answer: "De acordo com o Art. 49 do Código de Defesa do Consumidor, por se tratarem de artigos confeccionados sob medida e únicos de forma personalizada, não realizamos devoluções ou trocas motivadas por arrependimento simples do cliente. As substituições ocorrem estritamente sob ocorrências de avarias logísticas ou defeitos de fabricação relatados em até 7 dias."
    },
    {
      keywords: ["diferente do que pedi", "produto errado", "veio trocado", "dados errados", "veio diferente"],
      answer: "Se você identificou qualquer erro em relação ao pedido efetuado no site, tire fotos nítidas do produto recebido e envie para sac@usegat.com ou meupedido@usegat.com junto ao código da sua compra para correção."
    },
    {
      keywords: ["desbota", "sai", "lava louca", "lavar", "durabilidade", "qualidade", "esponja"],
      answer: "Nossos produtos possuem máxima qualidade e durabilidade eterna! Não desbota no uso cotidiano. Indicamos apenas lavar com a parte amarela e macia da esponja, evitar solventes abrasivos e não submeter à lavadora de louças industrial."
    },
    {
      keywords: ["garantia", "oferece garantia", "garantia cobre"],
      answer: "Sim! Oferecemos garantia cobre exclusivamente qualquer defeito de produção/insumo que for reportado num raio de até 7 dias corridos a contar da entrega realizada."
    }
  ];

  let bestMatch = null;
  let maxScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      const kwNormalized = normalize(kw);
      if (text.includes(kwNormalized)) {
        score += kwNormalized.split(" ").length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && maxScore > 0) {
    return bestMatch.answer;
  }

  return "Dúvida muito específica 😊\nPor favor entre em contato com nosso suporte direto pelo WhatsApp para que possamos te ajudar perfeitamente:\n\nWhatsApp: (21) 4040-2224";
}
