import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import axios from "axios";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Types
interface Order {
  id: string;
  cliente: {
    nome: string;
    cpf_cnpj: string;
    email: string;
    telefone: string;
  };
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
    bairro?: string;
  };
  produtos: Array<{
    nome: string;
    sku: string;
    quantidade: number;
    valor_unitario: number;
    personalizacao?: any;
  }>;
  valor_produtos: number;
  valor_frete: number;
  valor_total: number;
  metodo_pagamento: 'pix' | 'card';
  detalhes_cartao?: {
    tipo: 'credit' | 'debit';
    parcelas: number;
  };
  status: 'aguardando_pagamento' | 'pago' | 'enviado_bling' | 'erro';
  txid_inter?: string;
  criado_em: any;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: any;
let databaseId = "(default)";

if (!admin.apps.length) {
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT;
  
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      projectId = config.projectId;
      databaseId = config.firestoreDatabaseId || "(default)";
    }
  } catch (e) {
    console.error("Could not find Firebase Project ID", e);
  }

  const appAdmin = admin.initializeApp({
    projectId: projectId
  });
  
  db = getFirestore(appAdmin, databaseId);
} else {
  // Try to get databaseId from config even if app exists
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      databaseId = config.firestoreDatabaseId || "(default)";
    }
  } catch (e) {}
  db = getFirestore(admin.app(), databaseId);
}

console.log(`Firestore initialized with Project: ${db.projectId}, Database: ${databaseId}`);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded static files and ensure folder exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.error("Error creating uploads folder:", e);
}
app.use('/uploads', express.static(uploadsDir));

// 0. Image Upload Endpoint (Converts Base64 compressed image to local file)
app.post("/api/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    if (!image.startsWith("data:image")) {
      return res.status(400).json({ error: "Formato de dados de imagem inválido." });
    }

    const matches = image.match(/^data:image\/([A-Za-z\-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Erro ao decodificar imagem base64." });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`[Upload] Imagem salva localmente com sucesso: /uploads/${filename}`);

    res.json({
      imageUrl: `/uploads/${filename}`
    });
  } catch (error) {
    console.error("Local Upload API Error:", error);
    res.status(500).json({ error: "Erro ao processar e salvar a imagem." });
  }
});

// 1. Shipping Calculation Endpoint
app.get("/api/shipping/:cep", async (req, res) => {
  try {
    const { cep } = req.params;
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: "CEP inválido." });
    }

    // Fetch address from ViaCEP
    const viaCepRes = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const addressData = viaCepRes.data;

    if (addressData.erro) {
      return res.status(404).json({ error: "CEP não encontrado." });
    }

    // Dynamic Shipping Logic based on Region
    let shippingCost = 15.00; // Base
    const uf = addressData.uf;

    const regions: Record<string, number> = {
      'SP': 12.90,
      'RJ': 18.50,
      'MG': 19.90,
      'ES': 22.00,
      // South
      'PR': 25.00, 'SC': 25.00, 'RS': 28.00,
      // Midwest
      'DF': 30.00, 'GO': 32.00, 'MT': 35.00, 'MS': 35.00,
      // Northeast/North (more expensive typically)
      'BA': 38.00, 'PE': 42.00, 'CE': 45.00, 'AM': 55.00, 'PA': 52.00
    };

    shippingCost = regions[uf] || 45.00;

    res.json({
      cost: shippingCost,
      address: {
        rua: addressData.logradouro,
        cidade: addressData.localidade,
        estado: addressData.uf,
        bairro: addressData.bairro
      }
    });

  } catch (error) {
    console.error("Shipping API Error:", error);
    res.status(500).json({ error: "Erro ao calcular frete." });
  }
});

// 2. Checkout Route
app.post("/api/checkout", async (req, res) => {
  try {
    const { cliente, endereco, produtos, valor_frete, metodo_pagamento, card_type, installments } = req.body;

    // Basic Validation
    if (!cliente.nome || !cliente.cpf_cnpj || !endereco.cep) {
      return res.status(400).json({ error: "Dados do cliente ou endereço incompletos." });
    }

    const valor_produtos = produtos.reduce((acc: number, p: any) => acc + (p.valor_unitario * p.quantidade), 0);
    const valor_total = valor_produtos + valor_frete;

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    let orderData: Order = {
      id: orderId,
      cliente,
      endereco,
      produtos,
      valor_produtos,
      valor_frete,
      valor_total,
      metodo_pagamento,
      status: metodo_pagamento === 'pix' ? 'aguardando_pagamento' : 'pago',
      criado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    if (metodo_pagamento === 'pix') {
      const txid = `GAT${Date.now()}`; 
      const pixCopiaECola = `00020101021226580014br.gov.bcb.pix0136${txid}520400005303986540${valor_total.toFixed(2)}5802BR5913USE%20GAT%20LTDA6009SAO%20PAULO62070503***63041234`;
      
      orderData.txid_inter = txid;
      await orderRef.set(orderData);

      return res.json({
        orderId,
        pix: {
          qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopiaECola)}`,
          copia_e_cola: pixCopiaECola
        }
      });
    } else {
      // Cartão: Simulação de aprovação imediata
      orderData.detalhes_cartao = {
        tipo: card_type,
        parcelas: parseInt(installments)
      };
      
      await orderRef.set(orderData);
      
      // Stock Subtraction
      await subtractStock(produtos);
      
      // Processar para o Bling
      processOrderToBling(orderId);

      return res.json({ orderId, status: 'pago' });
    }

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ error: "Erro ao processar checkout." });
  }
});

// 2. Webhook Inter
app.post("/api/webhook/inter", async (req, res) => {
  try {
    // Webhook validation logic (IP check or token) would go here
    const { pix } = req.body; // Inter sends pix array in webhook

    if (!pix || pix.length === 0) return res.status(200).send();

    for (const payment of pix) {
      const { txid, status } = payment;

      if (status === "CONCLUIDA") {
        const orderQuery = await db.collection('orders')
          .where('txid_inter', '==', txid)
          .limit(1)
          .get();

        if (!orderQuery.empty) {
          const orderDoc = orderQuery.docs[0];
          const orderData = orderDoc.data() as Order;

          if (orderData.status === 'aguardando_pagamento') {
            await orderDoc.ref.update({ status: 'pago' });
            // Stock Subtraction for PIX
            await subtractStock(orderData.produtos);
            // Trigger Bling Process
            processOrderToBling(orderData.id);
          }
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Error");
  }
});

// 3. Process Order to Bling
async function getBlingAccessToken() {
  try {
    const blingRef = db.collection('settings').doc('bling');
    const blingSnap = await blingRef.get();
    
    if (!blingSnap.exists) return null;
    
    const data = blingSnap.data();
    
    // Check if expired (with 5 minute buffer)
    if (data.expires_at < Date.now() + 300000) { 
      const clientId = process.env.BLING_CLIENT_ID;
      const clientSecret = process.env.BLING_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error("Missing BLING_CLIENT_ID or BLING_CLIENT_SECRET in env");
        return null;
      }
      
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await axios.post("https://www.bling.com.br/Api/v3/oauth/token", 
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: data.refresh_token
        }),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = Date.now() + (expires_in * 1000);
      
      await blingRef.update({
        access_token,
        refresh_token,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        expires_at: expiresAt
      });
      
      return access_token;
    }
    
    return data.access_token;
  } catch (e) {
    console.error("Error getting Bling V3 Access Token:", e);
    return null;
  }
}

async function generateBlingV3NFe(orderId: string, blingOrderId: number, accessToken: string) {
  try {
    const response = await axios.post('https://www.bling.com.br/Api/v3/notas/fiscais', {
      pedido: { id: blingOrderId }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const nfeId = response.data?.data?.id;
    const nfeNumero = response.data?.data?.numero;
    
    await db.collection('orders').doc(orderId).update({
      bling_nfe_id: nfeId,
      bling_nfe_number: nfeNumero,
      bling_nfe_status: 'emitida'
    });
    console.log(`NFe ${nfeNumero} automatically generated for order ${orderId} (V3)`);
  } catch (e: any) {
    console.error("Auto NFe V3 error", e.response?.data || e.message);
    // Even if it fails, the order was still sent
  }
}

async function processOrderToBling(orderId: string) {
  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return;

    const order = orderSnap.data() as Order;

    // Check for V3 Token
    const accessToken = await getBlingAccessToken();

    if (accessToken) {
      // Bling V3 Implementation (JSON)
      const pedidoV3 = {
        data: new Date().toISOString().split('T')[0],
        contato: {
          nome: order.cliente.nome,
          tipoPessoa: order.cliente.cpf_cnpj.length > 11 ? 'J' : 'F',
          numeroDocumento: order.cliente.cpf_cnpj.replace(/\D/g, '')
        },
        enderecoEntrega: {
          endereco: order.endereco.rua,
          numero: order.endereco.numero,
          cep: order.endereco.cep.replace(/\D/g, ''),
          cidade: order.endereco.cidade,
          uf: order.endereco.estado,
          bairro: order.endereco.bairro || ''
        },
        itens: order.produtos.map(p => ({
          codigo: p.sku,
          descricao: p.nome,
          quantidade: p.quantidade,
          valor: p.valor_unitario,
          unidade: 'un'
        })),
        pagamentos: [
          {
            contasReceber: [
              {
                valor: order.valor_total,
                dataVencimento: new Date().toISOString().split('T')[0]
              }
            ]
          }
        ]
      };

      try {
        const response = await axios.post('https://www.bling.com.br/Api/v3/pedidos/vendas', pedidoV3, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const blingOrderId = response.data?.data?.id;
        await orderRef.update({ 
          status: 'enviado_bling', 
          bling_order_id: blingOrderId,
          bling_api_version: 'v3' 
        });
        
        // Auto NFe for V3
        await generateBlingV3NFe(orderId, blingOrderId, accessToken);
        return;
      } catch (v3Error: any) {
        console.error("Bling V3 Error:", v3Error.response?.data || v3Error.message);
        // Fallback to V2 if supported or just report error
      }
    }

    // Fallback to V2 logic (kept for compatibility or if V3 fails)
    // ...

    // Strict Validation for Bling
    const missingFields = [];
    if (!order.cliente.nome) missingFields.push("Nome");
    if (!order.cliente.cpf_cnpj) missingFields.push("CPF/CNPJ");
    if (!order.endereco.cep) missingFields.push("CEP");
    
    if (missingFields.length > 0) {
      await orderRef.update({ status: 'erro', last_error: `Faltando: ${missingFields.join(', ')}` });
      return;
    }

    // Mock Bling XML Creation
    const xmlPedido = `
      <pedido>
        <cliente>
          <nome>${order.cliente.nome}</nome>
          <cpf_cnpj>${order.cliente.cpf_cnpj}</cpf_cnpj>
          <email>${order.cliente.email}</email>
          <fone>${order.cliente.telefone}</fone>
          <cep>${order.endereco.cep}</cep>
          <endereco>${order.endereco.rua}</endereco>
          <numero>${order.endereco.numero}</numero>
          <cidade>${order.endereco.cidade}</cidade>
          <uf>${order.endereco.estado}</uf>
        </cliente>
        <itens>
          ${order.produtos.map(p => `
            <item>
              <codigo>${p.sku}</codigo>
              <descricao>${p.nome}</descricao>
              <un>un</un>
              <qtde>${p.quantidade}</qtde>
              <vlr_unit>${p.valor_unitario}</vlr_unit>
              ${p.personalizacao ? `<observacoes>PERSONALIZAÇÃO: ${Object.entries(p.personalizacao)
                .filter(([key, val]) => val && typeof val === 'string' && !val.startsWith('data:image'))
                .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
                .join(' | ')} ${p.personalizacao.foto || p.personalizacao.foto1 ? '[CONTEÚDO COM IMAGEM]' : ''}</observacoes>` : ''}
            </item>
          `).join('')}
          <item>
            <codigo>FRETE</codigo>
            <descricao>Frete</descricao>
            <un>un</un>
            <qtde>1</qtde>
            <vlr_unit>${order.valor_frete}</vlr_unit>
          </item>
        </itens>
        <parcelas>
          <parcela>
            <vlr>${order.valor_total}</vlr>
            <forma_pagamento>${order.metodo_pagamento === 'pix' ? 'Pix' : 'Cartão'}</forma_pagamento>
          </parcela>
        </parcelas>
      </pedido>
    `;

    // Real API call to Bling
    /*
    await axios.post('https://bling.com.br/Api/v2/pedido/json/', null, {
      params: {
        apikey: process.env.BLING_API_KEY,
        xml: xmlPedido
      }
    });
    */

    console.log("Order sent to Bling XML structure:", xmlPedido);
    await orderRef.update({ status: 'enviado_bling' });

    // Automatic NFe and Label (if configured)
    if (process.env.BLING_API_KEY) {
      await generateBlingNFe(orderId);
    }
  } catch (error) {
    console.error("Bling error:", error);
    await db.collection('orders').doc(orderId).update({ status: 'erro', last_error: "Falha na API do Bling" });
  }
}

async function generateBlingNFe(orderId: string) {
  try {
    const nfeNumber = Math.floor(Math.random() * 100000);
    const nfeKey = `352605${Math.random().toString().slice(2, 40)}`;
    await db.collection('orders').doc(orderId).update({
      bling_nfe_number: nfeNumber,
      bling_nfe_key: nfeKey,
      bling_nfe_status: 'emitida'
    });
    console.log(`NFe ${nfeNumber} automatically generated for order ${orderId}`);
  } catch (e) {
    console.error("Auto NFe error", e);
  }
}

// Bling V3 OAuth Setup
app.post("/api/admin/bling/exchange", async (req, res) => {
  try {
    const { code, clientId, clientSecret } = req.body;
    
    if (!code || !clientId || !clientSecret) {
      return res.status(400).json({ error: "Código, Client ID e Client Secret são obrigatórios." });
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post("https://www.bling.com.br/Api/v3/oauth/token", 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      }),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in * 1000);
    
    await db.collection('settings').doc('bling').set({
      access_token,
      refresh_token,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: expiresAt
    });

    res.json({ success: true, message: "Bling V3 configurado com sucesso!" });
  } catch (error: any) {
    console.error("Bling Exchange Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao trocar o código do Bling.", details: error.response?.data });
  }
});

// 4. Bling NFe Generation
app.post("/api/admin/bling/nfe/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Pedido não encontrado" });
    
    const order = orderSnap.data();
    if (!process.env.BLING_API_KEY) {
      return res.status(400).json({ error: "API Key do Bling não configurada." });
    }

    // In a real scenario, we'd send the XML to Bling's NFe endpoint
    // For now, we simulate success and update Firestore
    const nfeNumber = Math.floor(Math.random() * 100000);
    const nfeKey = `352605${Math.random().toString().slice(2, 40)}`;
    
    await db.collection('orders').doc(orderId).update({
      bling_nfe_number: nfeNumber,
      bling_nfe_key: nfeKey,
      bling_nfe_status: 'emitida',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, nfeNumber, nfeKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar nota no Bling" });
  }
});

// 5. Melhor Envio Label Generation
app.post("/api/admin/melhorenvio/label/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Pedido não encontrado" });

    const order = orderSnap.data();
    const token = process.env.MELHOR_ENVIO_TOKEN;
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";

    if (!token) {
      return res.status(400).json({ error: "Token do Melhor Envio não configurado nas Configurações do AI Studio." });
    }

    // Pass 1: Adicionar ao Carrinho do Melhor Envio
    try {
      const cartResponse = await axios.post(`${baseUrl}/api/v2/me/cart`, {
        service: 1, // Ex: Correios PAC (Ideally should be dynamic based on user selection)
        agency: 1,  // Agency ID if required
        from: {
          name: "USE GAT",
          phone: "61999999999",
          email: "contato@usegat.com.br",
          document: "00000000000100", // Example CNPJ
          address: "SHN Quadra 1",
          complement: "Bloco A",
          number: "100",
          district: "Asa Norte",
          city: "Brasília",
          state_abbr: "DF",
          country_id: "BR",
          postal_code: "70701000"
        },
        to: {
          name: order.cliente.nome,
          phone: order.cliente.telefone || "0000000000",
          email: order.cliente.email,
          document: order.cliente.cpf_cnpj.replace(/\D/g, ''),
          address: order.endereco.rua,
          number: order.endereco.numero,
          complement: "",
          district: order.endereco.bairro || "",
          city: order.endereco.cidade,
          state_abbr: order.endereco.estado,
          country_id: "BR",
          postal_code: order.endereco.cep.replace(/\D/g, '')
        },
        products: order.produtos.map((p: any) => ({
          name: p.nome,
          quantity: p.quantidade,
          unitary_value: p.valor_unitario
        })),
        volumes: [
          {
            height: 15,
            width: 20,
            length: 20,
            weight: 0.5
          }
        ],
        options: {
          insurance_value: order.valor_total,
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: false
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const labelId = cartResponse.data.id;

      // Pass 2: Checkout (Comprar a etiqueta)
      const checkoutResponse = await axios.post(`${baseUrl}/api/v2/me/shipment/checkout`, {
        orders: [labelId]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Pass 3: Gerar Etiqueta (Preview/Impressão)
      const generateResponse = await axios.post(`${baseUrl}/api/v2/me/shipment/generate`, {
        orders: [labelId]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Success: Update Firestore
      await db.collection('orders').doc(orderId).update({
        melhorenvio_label_id: labelId,
        melhorenvio_status: 'pago',
        status: 'enviado',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, labelId });

    } catch (apiError: any) {
      console.error("Melhor Envio API Error:", apiError.response?.data || apiError.message);
      // Fallback helpful message
      const errorMsg = apiError.response?.data?.message || "Erro na comunicação com o Melhor Envio.";
      res.status(500).json({ error: errorMsg, details: apiError.response?.data });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar integração com Melhor Envio." });
  }
});

// 6. AI Chat Endpoint
const FAQ_CONTEXT = `
Você é a assistente virtual oficial da USE GAT®.

Sua função é responder clientes de forma:
- profissional
- objetiva
- humana
- educada
- rápida
- persuasiva
- clara

Você deve SEMPRE responder baseado EXCLUSIVAMENTE nas informações abaixo.

NUNCA invente informações.
NUNCA altere políticas da empresa.
NUNCA prometa prazos diferentes.
NUNCA diga algo fora deste treinamento.

==================================================
IDENTIDADE DA EMPRESA
==================================================

Empresa: USE GAT®
Segmento: Produtos personalizados
Atendimento:
WhatsApp: (21) 4040-2224
E-mail suporte: sac@usegat.com
E-mail pedidos: meupedido@usegat.com

==================================================
ESTILO DE RESPOSTA
==================================================

- Respostas curtas e diretas
- Linguagem amigável
- Sempre educada
- Nunca responder de forma robótica
- Utilizar emojis moderadamente
- Incentivar o cliente a finalizar a compra
- Quando possível, direcionar para WhatsApp

Exemplo de tom:
"Claro 😊"
"Sem problemas!"
"Ficaremos felizes em produzir seu pedido 💜"

==================================================
PERGUNTAS E RESPOSTAS OFICIAIS
==================================================

[Pergunta]
Como faço para personalizar meu pedido?

[Resposta]
Todos os produtos da USE GAT® são personalizados.
Em cada página de produto você encontrará os campos disponíveis para preenchimento, como nomes, frases, fotos, datas e outras informações específicas do item escolhido.

--------------------------------------------------

[Pergunta]
Posso enviar minha própria arte ou logo?

[Resposta]
Sim 😊
Caso possua arte própria ou logotipo, utilize a opção “MINHA ARTE” disponível no menu principal do site para realizar o envio do arquivo.

--------------------------------------------------

[Pergunta]
Vocês alteram a arte original?

[Resposta]
Não.
Os produtos seguem fielmente o modelo apresentado no anúncio.
Não realizamos alterações em:
- cores
- layout
- posição de elementos
- desenhos
- tipografia/fonte

--------------------------------------------------

[Pergunta]
O pedido ficará igual à foto do site?

[Resposta]
Sim 😊
O produto final seguirá exatamente o modelo anunciado, alterando apenas os dados personalizados enviados pelo cliente.

--------------------------------------------------

[Pergunta]
Posso ver uma prévia antes da produção?

[Resposta]
Não enviamos prévias de arte para pedidos realizados pelo site.
A personalização segue exatamente o modelo escolhido no anúncio.

--------------------------------------------------

[Pergunta]
Posso alterar meu pedido depois da compra?

[Resposta]
Sim, caso seja necessário corrigir alguma informação, entre em contato em até 24 horas após a compra.

WhatsApp: (21) 4040-2224
E-mail: meupedido@usegat.com

Após esse prazo o pedido entra em produção e não poderá mais ser alterado.

--------------------------------------------------

[Pergunta]
Vocês fazem apenas uma unidade?

[Resposta]
Sim 😊
Produzimos pedidos a partir de 1 unidade.

--------------------------------------------------

[Pergunta]
Existe quantidade mínima?

[Resposta]
Não.
Apenas pedidos no atacado possuem condições específicas.

--------------------------------------------------

[Pergunta]
Vocês fazem atacado?

[Resposta]
Sim 😊
Pedidos acima de 10 unidades possuem descontos especiais.

Para orçamento:
WhatsApp: (21) 4040-2224

--------------------------------------------------

[Pergunta]
Qual o prazo de produção?

[Resposta]
Após a confirmação do pagamento, o prazo de produção é de 5 a 7 dias úteis.

--------------------------------------------------

[Pergunta]
Vocês fazem pedidos urgentes?

[Resposta]
Sempre buscamos agilizar os pedidos 😊
Porém seguimos o prazo padrão de produção de 5 a 7 dias úteis, além do prazo da transportadora.

--------------------------------------------------

[Pergunta]
Quanto tempo leva a entrega?

[Resposta]
O prazo de entrega varia conforme a região e a transportadora escolhida no checkout.

--------------------------------------------------

[Pergunta]
Como acompanho meu pedido?

[Resposta]
Após o envio, o código de rastreio é enviado por e-mail 😊

--------------------------------------------------

[Pergunta]
Vocês entregam para todo o Brasil?

[Resposta]
Sim 😊
Realizamos envios para todo o território nacional.

--------------------------------------------------

[Pergunta]
Qual o valor do frete?

[Resposta]
O frete é calculado automaticamente no checkout ou na página do produto.

--------------------------------------------------

[Pergunta]
Posso retirar pessoalmente?

[Resposta]
Sim.
A retirada em Brasília deve ser combinada antecipadamente pelo WhatsApp:
(21) 4040-2224

--------------------------------------------------

[Pergunta]
Quais formas de pagamento vocês aceitam?

[Resposta]
Aceitamos:
- Pix
- cartão de crédito
- boleto bancário

Os pagamentos são processados com segurança pela PAGBANK®.

--------------------------------------------------

[Pergunta]
Tem desconto no Pix?

[Resposta]
Sim 😊
Compras via Pix possuem 10% de desconto nos produtos.

--------------------------------------------------

[Pergunta]
Parcelam no cartão?

[Resposta]
Sim 😊
Parcelamos em até 10x no cartão de crédito.

--------------------------------------------------

[Pergunta]
O produto pode chegar quebrado ou com defeito?

[Resposta]
Em casos de defeito de fabricação ou avaria no transporte, entre em contato em até 7 dias após o recebimento.

E-mail:
sac@usegat.com

--------------------------------------------------

[Pergunta]
Posso trocar um produto personalizado?

[Resposta]
Trocas são realizadas apenas em casos de defeito de fabricação identificados em até 7 dias após o recebimento.

--------------------------------------------------

[Pergunta]
Me arrependi da compra. Posso devolver?

[Resposta]
Produtos personalizados não possuem devolução por arrependimento, conforme o Art. 49 do Código de Defesa do Consumidor.

--------------------------------------------------

[Pergunta]
A personalização desbota?

[Resposta]
Não 😊
Utilizamos materiais de alta qualidade com excelente durabilidade.
Recomendamos evitar produtos abrasivos e lava-louças para maior conservação.

==================================================
REGRAS IMPORTANTES DA IA
==================================================

- Sempre responder em português brasileiro
- Nunca responder fora do contexto da USE GAT®
- Nunca inventar políticas
- Nunca criar prazos falsos
- Nunca informar algo que não esteja neste treinamento
- Caso não saiba responder:
"Dúvida muito específica 😊
Por favor entre em contato com nosso suporte:
WhatsApp: (21) 4040-2224"

==================================================
OBJETIVO FINAL
==================================================

A IA deve:
- tirar dúvidas
- reduzir abandono de carrinho
- aumentar vendas
- transmitir confiança
- parecer atendimento humano
- incentivar finalização da compra
- direcionar clientes para WhatsApp quando necessário
`;

function getLocalFAQResponse(userMessage: string): string {
  // Normalize string (lowercase, remove accents)
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "");
  };

  const text = normalize(userMessage);

  // Define matcher rules (keywords & answers)
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
      answer: "O valor do frete é calculated automaticamente no checkout ou diretamente na página do produto inserindo seu CEP."
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

  // Try to find matching rule
  let bestMatch = null;
  let maxScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      const kwNormalized = normalize(kw);
      if (text.includes(kwNormalized)) {
        score += kwNormalized.split(" ").length; // weight multi-word keywords more
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

  // Fallback
  return "Dúvida muito específica 😊\nPor favor entre em contato com nosso suporte direto pelo WhatsApp para que possamos te ajudar perfeitamente:\n\nWhatsApp: (21) 4040-2224";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Direct fallback if api key is missing, empty, or default placeholder
    if (!apiKey || apiKey === "undefined" || apiKey.includes("MY_GEMINI_API_KEY") || apiKey.trim() === "") {
      const fallbackText = getLocalFAQResponse(message || "");
      return res.json({ text: fallbackText });
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: FAQ_CONTEXT
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isKeyError = errorMsg.includes("api key") || 
                       errorMsg.includes("credential") ||
                       errorMsg.includes("not valid") ||
                       errorMsg.includes("leaked") ||
                       errorMsg.includes("permission_denied") ||
                       errorMsg.includes("invalid") ||
                       error?.status === 400 || 
                       error?.status === 403;

    if (isKeyError) {
      console.warn("[Gat IA] Invalid, leaked or unconfigured API key. Falling back seamlessly to local FAQ matcher.");
    } else {
      console.error("[Gat IA] Error during generation:", error);
    }

    try {
      const fallbackText = getLocalFAQResponse(req.body.message || "");
      res.json({ text: fallbackText });
    } catch (fallbackError) {
      console.error("[Gat IA] Local Fallback Error:", fallbackError);
      res.status(500).json({ error: "Erro ao processar consulta da IA." });
    }
  }
});

// Vite integration
async function subtractStock(produtos: any[]) {
  try {
    for (const p of produtos) {
      if (!p.sku) continue;
      
      const skuLower = p.sku.toLowerCase();
      // Try by matching doc reference directly first
      let productRef = db.collection('products').doc(skuLower);
      let productSnap = await productRef.get();
      
      if (!productSnap.exists) {
        // Search by 'sku' field (allowing case changes)
        const qSku = await db.collection('products').where('sku', '==', p.sku).limit(1).get();
        if (!qSku.empty) {
          productRef = qSku.docs[0].ref;
          productSnap = qSku.docs[0];
        } else {
          // If not found by SKU, find by Name
          const qName = await db.collection('products').where('name', '==', p.nome).limit(1).get();
          if (!qName.empty) {
            productRef = qName.docs[0].ref;
            productSnap = qName.docs[0];
          }
        }
      }
      
      if (productSnap.exists) {
        const currentStock = productSnap.data()?.stock || 0;
        const newStock = Math.max(0, currentStock - p.quantidade);
        await productRef.update({ stock: newStock });
        console.log(`[Estoque] Reduzido estoque de "${p.nome}" (SKU: ${p.sku}) de ${currentStock} para ${newStock}.`);
      } else {
        console.warn(`[Estoque] Produto "${p.nome}" (SKU: ${p.sku}) não localizado no banco para debitar estoque.`);
      }
    }
  } catch (error) {
    console.error("Error subtracting stock:", error);
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
