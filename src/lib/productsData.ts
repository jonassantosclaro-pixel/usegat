export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  category: 'garrafas-termicas' | 'canecas' | 'atacado';
  subcategory?: string;
  description: string;
  detailedDescription?: string;
  customizable: boolean;
  isSuaHistoria?: boolean;
}

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "sua-historia-bottle",
    name: "Garrafa Térmica 'Sua História'",
    sku: "G-HIS-01",
    price: 189.00,
    imageUrl: "https://i.postimg.cc/hv2SWwmj/704945826-1785809935732333-1325427837227963059-n.jpg",
    category: "garrafas-termicas",
    subcategory: "Meu Jeito",
    description: "Cada garrafa térmica é 100% personalizada. Criamos um estilo único, do zero, ilustrando cada elemento de suas memórias, comidas, bebidas e lazeres favoritos.",
    detailedDescription: "• Conserva gelada por até 24 horas e quente por até 12 horas\n• Pintura eletrostática fosca de altíssima durabilidade\n• Inclui tampa hermética anti-vazamento inteligente\n• Personalização exclusiva 'Sua História' gravada à laser permanente ou colorida premium\n• Livre de BPA e ecológica",
    customizable: true,
    isSuaHistoria: true
  },
  {
    id: "caneca-rostinho",
    name: "Caneca Rostinho Minimalista com Foto",
    sku: "C-MIN-02",
    price: 59.90,
    imageUrl: "https://i.postimg.cc/bv3TD1vJ/Whats-App-Image-2026-05-15-at-16-10-17-(1).jpg",
    category: "canecas",
    subcategory: "Estilo Único",
    description: "Inspirada no charme minimalista Boho Chic, recriamos os rostos da sua foto preferida em traços finos e elegantes sobre cerâmica premium.",
    detailedDescription: "• Capacidade ideal de 325ml de puro aconchego\n• Arte gravada com técnica durável (pode ir ao micro-ondas)\n• Cerâmica natural Off-white de altíssimo brilho com alça anatômica\n• Desenho executado à mão por artistas especializados da USE GAT",
    customizable: true
  },
  {
    id: "profissoes-laser",
    name: "Garrafa Profissões Premium 750ml",
    sku: "G-PRO-03",
    price: 209.00,
    imageUrl: "https://i.postimg.cc/SRgyF59z/702683690-985446547786044-744971589972713843-n.jpg",
    category: "garrafas-termicas",
    subcategory: "Corporativo",
    description: "Elegância e autoridade em cada gole. Personalize com seu nome, logo de sua profissão gravados a laser com precisão cirúrgica.",
    detailedDescription: "• Aço cirúrgico inoxidável dupla parede a vácuo\n• Gravação em alta definição permanente (não sai na lavagem)\n• Design ergonômico moderno com fundo emborrachado",
    customizable: true
  },
  {
    id: "classic-vacuum",
    name: "Garrafa Térmica Classic Amplo Vácuo",
    sku: "G-CLS-04",
    price: 139.00,
    imageUrl: "https://i.postimg.cc/PJStscDY/703119362-1756189318697651-4748773951990116268-n.jpg",
    category: "garrafas-termicas",
    subcategory: "Essencial",
    description: "Com design minimalista atemporal de inspiração escandinava. Uma cor suave e acolhedora perfeita para os dias frios de inverno.",
    detailedDescription: "• Disponível em tons terrosos suaves Boho\n• Trava de click rápida para acionamento com uma mão\n• Alça premium integrada para transporte prático",
    customizable: false
  },
  {
    id: "caneca-canelada",
    name: "Caneca Cerâmica Canelada Gold",
    sku: "C-CNL-05",
    price: 49.90,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    category: "canecas",
    subcategory: "Para Mesa",
    description: "Caneca de cerâmica artesanal rústico-chique com borda em ouro líquido aplicada manualmente. Perfeita para harmonizar seu café matinal.",
    detailedDescription: "• Toque rústico de cerâmica crua fosca na base e esmalte brilhoso sobre o corpo\n• Detalhe dourado clássico feito com ouro 12k autêntico\n• Produto artesanal - cada peça é exclusiva",
    customizable: false
  },
  {
    id: "caneca-amor-por-ai",
    name: "Caneca Personalizada 'Leve Amor por Aí'",
    sku: "C-AMO-06",
    price: 54.90,
    imageUrl: "https://i.postimg.cc/JhPqDjhB/Whats-App-Image-2026-05-15-at-16-03-49-(1).jpg",
    category: "canecas",
    subcategory: "Amor Por Aí",
    description: "Para aquecer o coração. Adicione o seu nome ou o de quem você ama em uma estampa cheia de doçura e afeto.",
    detailedDescription: "• Base de cerâmica de alta densidade\n• Estampa com alta fixação e cores Boho vivas\n• Frase clássica gravada na parte interna superior",
    customizable: true
  },
  {
    id: "kit-casal-gat",
    name: "Kit Presente Casal GAT (Canecas+Garrafas)",
    sku: "K-CAS-07",
    price: 349.00,
    imageUrl: "https://i.postimg.cc/hv2SWwmj/704945826-1785809935732333-1325427837227963059-n.jpg",
    category: "atacado",
    subcategory: "Especiais",
    description: "Surpreenda seu parceiro(a) com a dupla perfeita de canecas e garrafas rústicas, embaladas em nossa clássica caixa Boho de palha de trigo.",
    detailedDescription: "• Contém 2 Garrafas térmicas e 2 Canecas de Cerâmica\n• Caixa decorada em palha natural desidratada\n• Cartão de presentes com selo de cera real",
    customizable: true
  }
];
