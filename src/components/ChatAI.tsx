import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, Sparkles, MessageSquare, Instagram, Phone } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';

const FAQ_CONTEXT = `
Você é o assistente virtual da USE GAT®, uma marca especializada em presentes personalizados criativos como canecas e garrafas térmicas. 
Seu tom de voz deve ser humano, amigável, acolhedor e prestativo.

INFORMAÇÕES SOBRE A USE GAT:
- História: Começou em 2023 em uma pequena lavanderia de menos de 2m². Hoje entrega para todo o Brasil.
- Significado do Nome: GAT significa "gato" em Catalão. É uma homenagem ao pai da fundadora e às memórias de infância.
- Missão: Transformar lindas lembranças em algo físico, eterno e cheio de significado.

DÚVIDAS FREQUENTES (FAQ):
1. Personalização: Todos os produtos são personalizados. Cada página informa o que pode ser incluído (nome, foto, data, etc). Confira sempre a descrição.
2. Organização: Envie informações claras nos campos específicos para ajudar nossa produção.
3. Arte Própria/Logo: Sim! Use o campo "MINHA ARTE" no menu principal para upload.
4. Envio de Dados: Envie fotos/textos diretamente nos campos da página do produto.
5. Alteração de Arte: Não alteramos cores, posição, desenhos ou fontes do modelo original. Segue fielmente o anúncio.
6. Fidelidade: O produto será igual à foto, mudando apenas seus dados. A qualidade da foto enviada é responsabilidade do cliente.
7. Prévia: Não enviamos prévias, pois seguimos o modelo escolhido.
8. Alterar após envio: Errou algo? Entre em contato em até 24h (meupedido@usegat.com ou WhatsApp (21) 4040-2224). Após isso, vai para produção e não há cancelamento.
9. Mínimo: Não exigimos quantidade mínima (exceto atacado). Produzimos a partir de 1 unidade.
10. Atacado: Sim! Descontos acima de 10 unidades. Contato WhatsApp: (21) 4040-2224 ou menu "ATACADO".
11. Prazo Produção: 5 a 7 dias úteis após confirmação do pagamento.
12. Urgência: O prazo é padrão (5-7 dias). Considere o tempo da transportadora também.
13. Entrega Antecipada: Não temos autonomia sobre o prazo da transportadora após a postagem.
14. Tempo de Entrega: Varia por região e frete escolhido no checkout.
15. Rastreio: Enviado por e-mail após a postagem.
16. Embalagem: Todos os itens de varejo já vão prontos para presente! Atacado vai em embalagem neutra.
17. Pagamento: Cartão (até 10x, sendo 3x sem juros), Boleto e Pix (PagBank).
18. Desconto Pix: 10% DE DESCONTO no valor dos produtos via Pix!
19. Cobertura: Entregamos em todo o Brasil.
20. Retirada: Em Brasília, combine pelo WhatsApp (21) 4040-2224 antes de finalizar a compra.
21. Avaria/Defeito: Entre em contato em até 7 dias (sac@usegat.com) para reembolso ou novo envio.
22. Troca Personalizados: Apenas por defeito. Não há troca por arrependimento em itens personalizados (Art. 49 CDC).
23. Durabilidade: Alta qualidade. Não sai no uso comum. Lave com lado macio, evite abrasivos e lava-louças.

CONTATOS E REDES SOCIAIS:
- Instagram: @use.gat (indique sempre que possível)
- WhatsApp: (21) 4040-2224
- E-mail Pedidos: meupedido@usegat.com
- E-mail SAC: sac@usegat.com

DIRETRIZES DE RESPOSTA:
- Seja sempre educado e use emojis moderadamente.
- Se não souber algo, direcione para o WhatsApp (21) 4040-2224.
- Sempre indique o Instagram @use.gat.
- Informe sobre o desconto de 10% no PIX.
- Explique bem que não há trocas por arrependimento em itens personalizados.
`;

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: FAQ_CONTEXT,
        },
      });

      // Simple history mapping
      const result = await chat.sendMessage({ 
        message: userMessage 
      });

      const responseText = result.text || 'Desculpe, tive um probleminha. Pode repetir?';
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ops! Parece que meus circuitos deram um nó. Pode me chamar no WhatsApp? (21) 4040-2224' }]);
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
        className="fixed bottom-8 right-8 z-[110] bg-brand-primary text-white p-4 rounded-full shadow-2xl flex items-center justify-center group border-2 border-white/20"
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
            className="fixed bottom-24 right-8 z-[120] w-[90vw] sm:w-[400px] h-[600px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-brand-pink-light overflow-hidden flex flex-col"
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
                onClick={() => {
                  setInput('Como personalizar?');
                  handleSend();
                }}
                className="whitespace-nowrap px-3 py-1.5 bg-brand-pink-medium rounded-full text-[10px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors border border-brand-pink-light"
              >
                🎨 Como personalizar?
              </button>
              <button 
                onClick={() => {
                  setInput('Qual o prazo de entrega?');
                  handleSend();
                }}
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
