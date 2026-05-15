import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CreditCard, QrCode } from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentMethodsProps {
  total: number;
  className?: string;
  isDark?: boolean;
}

export function PaymentMethods({ total, className, isDark = false }: PaymentMethodsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Pix logic (10% discount)
  const pixTotal = total * 0.9;
  
  // Installment logic
  const getInstallments = (val: number) => {
    const list = [];
    // 1-3x Interest Free
    for (let i = 1; i <= 3; i++) {
      list.push({
        times: i,
        value: val / i,
        interest: false
      });
    }
    // 4-10x with Interest (simplified based on user example rates)
    const rates = [1, 1, 1, 1.108, 1.123, 1.137, 1.144, 1.162, 1.176, 1.186];
    for (let i = 4; i <= 10; i++) {
      const totalWithInterest = val * rates[i - 1];
      list.push({
        times: i,
        value: totalWithInterest / i,
        interest: true
      });
    }
    return list;
  };

  const installments = getInstallments(total);
  const bestInstallment = installments[2]; // 3x

  const textColor = isDark ? 'text-white' : 'text-brand-primary';
  const subTextColor = isDark ? 'text-white/60' : 'text-gray-500';

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Main Display */}
        <div className="space-y-4">
          {/* Pix Row */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              isDark ? "bg-white/10" : "bg-brand-primary/10"
            )}>
              <QrCode className={cn("w-5 h-5", isDark ? "text-white" : "text-brand-primary")} />
            </div>
            <div>
              <p className={cn("text-xl font-black", textColor)}>{formatPrice(pixTotal)} no pix</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", isDark ? "text-white/80" : "text-green-600")}>com 10% de desconto</p>
            </div>
          </div>

          {/* Card Row */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              isDark ? "bg-white/10" : "bg-brand-primary/10"
            )}>
              <CreditCard className={cn("w-5 h-5", isDark ? "text-white" : "text-brand-primary")} />
            </div>
            <div>
              <p className={cn("text-xl font-black", textColor)}>{formatPrice(total)}</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", subTextColor)}>
                até 3x de {formatPrice(bestInstallment.value)} sem juros
              </p>
            </div>
          </div>
        </div>

        {/* Toggleable More Payment Methods */}
        <div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity",
              isDark ? "text-white" : "text-[#4A1E59]"
            )}
          >
            mais formas de pagamento
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                   <div className={cn(
                     "p-6 rounded-3xl space-y-4",
                     isDark ? "bg-white/10 border border-white/10" : "bg-[#F5F1E9]"
                   )}>
                      <p className={cn(
                        "text-[11px] font-black uppercase tracking-[0.2em] border-b pb-2",
                        isDark ? "text-white border-white/20" : "text-[#4A1E59] border-[#4A1E59]/10"
                      )}>Parcelas</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        {installments.map((inst) => (
                          <div key={inst.times} className="flex justify-between items-center text-[10px] font-bold">
                            <span className={isDark ? "text-white/80" : "text-gray-600"}>
                              {inst.times}x de {formatPrice(inst.value)}
                              {!inst.interest && <span className={isDark ? "text-white ml-1 font-black" : "text-green-600 ml-1"}>sem juros</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className={cn(
                        "pt-4 border-t",
                        isDark ? "border-white/20" : "border-[#4A1E59]/10"
                      )}>
                        <div className="flex items-center gap-2">
                          <QrCode className={cn("w-3 h-3", isDark ? "text-white" : "text-brand-primary")} />
                          <p className={cn("text-[10px] font-black", isDark ? "text-white" : "text-brand-primary")}>pix — {formatPrice(pixTotal)}</p>
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
