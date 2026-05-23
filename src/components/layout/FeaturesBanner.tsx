import { Package, Truck, CreditCard, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function FeaturesBanner() {
  const features = [
    { icon: Package, title: 'Valor especial', desc: 'nas compras acima de 10un.' },
    { icon: Truck, title: 'Enviando afeto', desc: 'para todo Brasil' },
    { icon: CreditCard, title: 'Parcelamos', desc: 'em até 3x sem juros' },
    { icon: HelpCircle, title: 'Dúvida com pedido?', desc: 'Clique aqui' },
  ];

  return (
    <div className="bg-[#EFE9DD] py-4 overflow-hidden border-b border-brand-gold/10">
      <div className="flex animate-marquee md:justify-center gap-8 whitespace-nowrap px-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <f.icon className="w-6 h-6 text-[#8C6A3B]" />
            <div>
              <p className="font-black text-[11px] text-[#8C6A3B] uppercase tracking-widest">{f.title}</p>
              <p className="text-[10px] text-stone-600">{f.desc}</p>
            </div>
            {i < features.length - 1 && <div className="w-[1px] h-10 bg-brand-gold/20 ml-6 hidden md:block"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
