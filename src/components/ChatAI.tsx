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

  const rules = [
    {
      keywords: ["personalizar", "personalizacao", "gravar", "nome", "foto", "dados", "texto", "preencher"],
      answer: "Todos os produtos da USE GAT® são personalizados. 😊\nEm cada página de produto você encontrará os campos disponíveis para preenchimento, como nomes, frases, fotos, datas e outras informações específicas do item escolhido."
    },
    {
      keywords: ["minha arte", "arte propria", "propria arte", "logotipo", "logo", "enviar arte", "enviar logo", "meu desenho"],
      answer: "Sim! 😊 Caso possua arte própria ou logotipo, utilize a opção “MINHA ARTE” disponível no menu principal do site para realizar o envio do arquivo."
    },
    {
      keywords: ["alterar arte", "mudar desenho", "mudar cor", "altera arte", "cor estrutural", "alterar cores", "mudar posicao", "mudar fonte"],
      answer: "Não realizamos alterações estruturais. Os produtos seguem fielmente o modelo apresentado no anúncio.\n\nNão realizamos alterações em:\n- cores\n- layout\n- posição de elementos\n- desenhos\n- tipografia/fonte"
    },
    {
      keywords: ["igual a foto", "igual à foto", "vai ser igual", "fidelidade", "ficar igual", "fiel"],
      answer: "Sim! 😊 O produto final seguirá exatamente o modelo anunciado, alterando apenas os dados personalizados enviados pelo cliente."
    },
    {
      keywords: ["previa", "ver antes", "esboco", "enviar previa", "ver a previa", "mostra arte", "amostra"],
      answer: "Não enviamos prévias de arte para pedidos realizados pelo site. A personalização segue exatamente o modelo escolhido no anúncio."
    },
    {
      keywords: ["alterar pedido", "mudar pedido", "mudar dados", "corrigir", "errei", "errado", "alterar apos", "mudar nome"],
      answer: "Sim, caso seja necessário corrigir alguma informação do seu pedido, entre em contato em até 24 horas após a compra.\n\nWhatsApp: (21) 4040-2224\nE-mail: meupedido@usegat.com\n\nApós esse prazo, o pedido entra em produção e não poderá mais ser alterado."
    },
    {
      keywords: ["uma unidade", "1 unidade", "so uma", "só uma", "so de 1", "só de 1", "fazer uma", "comprar um", "comprar uma"],
      answer: "Sim! 😊 Produzimos pedidos a partir de 1 unidade."
    },
    {
      keywords: ["minimo", "minima", "quantidade minima", "quantidade mínima", "pedido minimo"],
      answer: "Não há quantidade mínima. 😊 Produzimos a partir de 1 unidade. Apenas pedidos no atacado possuem condições específicas."
    },
    {
      keywords: ["atacado", "acima de 10", "comprar lote", "revenda", "lote", "vender", "desconto quantidade"],
      answer: "Sim! 😊 Pedidos acima de 10 unidades possuem descontos especiais.\n\nPara fazer um orçamento de atacado, entre em contato via WhatsApp:\n(21) 4040-2224"
    },
    {
      keywords: ["prazo", "producao", "produzir", "tempo para fazer", "confeccao", "prazo de producao", "fazer"],
      answer: "Após a confirmação do pagamento, o prazo de produção de cada peça personalizada (desenho e gravação) é de 5 a 7 dias úteis."
    },
    {
      keywords: ["urgente", "urgencia", "pressa", "rapido", "acelerar", "antecipar", "emergencia", "prazo curto"],
      answer: "Sempre buscamos agilizar os pedidos! 😊 Porém seguimos o prazo padrão de produção de 5 a 7 dias úteis, além do prazo da transportadora."
    },
    {
      keywords: ["entrega", "prazo de entrega", "quanto tempo", "demora", "chegar", "transporte", "correio", "sedex", "pac"],
      answer: "O prazo de entrega varia conforme a sua região e a transportadora escolhida no checkout. Após postarmos seu pedido nos Correios/transportadora, o prazo corre por conta deles."
    },
    {
      keywords: ["rastrear", "rastreio", "codigo de rastreio", "enviar rastreio", "acompanhar", "onde esta", "postagem"],
      answer: "Assim que seu pedido for postado, nós enviaremos o código de rastreio oficial diretamente em seu e-mail cadastrado! 😊"
    },
    {
      keywords: ["todo o brasil", "entrega brasil", "envia para", "meu estado", "enviam para", "enviar para", "frete para"],
      answer: "Sim! 😊 Realizamos envios seguros para todo o território nacional."
    },
    {
      keywords: ["valor do frete", "quanto é o frete", "frete gratis", "frete pago", "calcular frete", "custo do frete"],
      answer: "O valor do frete é calculado automaticamente no checkout ou diretamente na página do produto inserindo seu CEP."
    },
    {
      keywords: ["retirar", "retirada", "pessoalmente", "pegar", "brasilia", "retirar em", "busca", "df"],
      answer: "Sim! Para retirada pessoalmente em Brasília (DF), por favor, combine os detalhes conosco antecipadamente pelo WhatsApp: (21) 4040-2224 antes de finalizar a compra."
    },
    {
      keywords: ["formas de pagamento", "pagar", "pagamento", "boleto", "cartao", "pix", "aceita", "parcela", "credito"],
      answer: "Aceitamos Pix, cartão de crédito (em até 10x) e boleto bancário.\n\nTodo o pagamento é processado com 100% de segurança via PAGBANK®."
    },
    {
      keywords: ["desconto pix", "pix tem desconto", "desconto no pix", "pago no pix", "pagamento pix"],
      answer: "Sim! 😊 Compras realizadas via Pix ganham automaticamente 10% de desconto no valor de todos os produtos do carrinho."
    },
    {
      keywords: ["parcelar", "parcelamento", "parcelas", "vezes", "dividir", "credito 10x"],
      answer: "Sim! 😊 Parcelamos em até 10x no cartão de crédito, sendo em até 3x sem juros."
    },
    {
      keywords: ["quebrado", "defeito", "avaria", "danificado", "estragou", "quebrou", "amassou", "riscado"],
      answer: "Fique tranquilo(a)! Se houver avarias no transporte ou qualquer defeito do ateliê, garantimos a substituição sem custos. Entre em contato em até 7 dias no e-mail: sac@usegat.com"
    },
    {
      keywords: ["trocar personalizado", "troca de personalizado", "trocar garrafa", "trocar caneca", "troca"],
      answer: "Por serem peças únicas e sob medida, trocas de itens personalizados são realizadas exclusivamente em caso de defeito de fabricação ou danos no transporte relatados em até 7 dias corridos."
    },
    {
      keywords: ["devolver", "arrependi", "cancelar", "desistir", "devolucao", "arrependimento"],
      answer: "Conforme o Artigo 49 do Código de Defesa do Consumidor, produtos sob medida e totalmente personalizados não possuem direito de devolução por arrependimento, por serem inviáveis para revenda."
    },
    {
      keywords: ["desbota", "sai", "lava louca", "lavar", "durabilidade", "qualidade", "microondas", "micro-ondas"],
      answer: "Não desbota e não sai! 😊 Nossas gravações a laser e impressões de cerâmica são de altíssima qualidade. Recomendamos apenas lavar com o lado macio da bucha, evitar produtos abrasivos e evitar lava-louças para durabilidade eterna."
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
