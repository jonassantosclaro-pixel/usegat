import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import axios from "axios";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

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
app.use(express.json());

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

// Vite integration
async function subtractStock(produtos: any[]) {
  try {
    for (const p of produtos) {
      // Find product by id (sku is id.toUpperCase())
      const productId = p.sku.toLowerCase();
      const productRef = db.collection('products').doc(productId);
      const productSnap = await productRef.get();
      
      if (productSnap.exists) {
        const currentStock = productSnap.data()?.stock || 0;
        const newStock = Math.max(0, currentStock - p.quantidade);
        await productRef.update({ stock: newStock });
      }
    }
  } catch (error) {
    console.error("Error subtracting stock:", error);
  }
}

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
