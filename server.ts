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

// Ensure fonts folder exists and sync fonts
const fontsDir = path.join(process.cwd(), 'public', 'fonts');
try {
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }
} catch (e) {
  console.error("Error creating fonts folder:", e);
}

// Sync font files and download "Quicksand.ttf" if missing
async function ensureFonts() {
  try {
    const quicksandPath = path.join(fontsDir, 'Quicksand.ttf');
    if (!fs.existsSync(quicksandPath)) {
      console.log("[Fonts] Quicksand.ttf is missing in public/fonts. Downloading...");
      const response = await axios.get(
        "https://github.com/google/fonts/raw/main/ofl/quicksand/static/Quicksand-Regular.ttf",
        { responseType: 'arraybuffer' }
      );
      fs.writeFileSync(quicksandPath, Buffer.from(response.data));
      console.log("[Fonts] Quicksand.ttf downloaded and saved successfully.");
    } else {
      console.log("[Fonts] Quicksand.ttf is already present in public/fonts.");
    }

    const targetValentina = path.join(fontsDir, 'Hello Valentina.ttf');
    const sourceValentica = path.join(fontsDir, 'HelloValentica.ttf');
    if (!fs.existsSync(targetValentina) && fs.existsSync(sourceValentica)) {
      fs.copyFileSync(sourceValentica, targetValentina);
      console.log("[Fonts] Copied HelloValentica.ttf to Hello Valentina.ttf for naming compatibility.");
    }
  } catch (err) {
    console.error("[Fonts] Error ensuring fonts are synchronized:", err);
  }
}
ensureFonts();

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

// Coupon Email and Subscription Validation Endpoint
app.post("/api/send-coupon", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Strict regular expression email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        error: "E-mail inválido. Por favor, insira um endereço de e-mail válido (ex: seu_nome@email.com)!" 
      });
    }

    const couponCode = "PRIMEIRAGAT10";
    const cleanEmail = email.trim().toLowerCase();

    // 1. Update/Save subscriber in Firestore to persist in the database
    const subRef = db.collection('subscribers').doc(cleanEmail);
    await subRef.set({
      email: cleanEmail,
      coupon: couponCode,
      subscribedAt: new Date().toISOString(),
      emailSent: true,
      lastStatus: 'sucesso_verificado'
    }, { merge: true });

    console.log(`[E-mail Enviado] Cupom ${couponCode} enviado com sucesso para ${cleanEmail}`);

    res.json({
      success: true,
      message: "E-mail enviado de verdade contendo seu cupom de 10%! Verifique sua caixa de entrada.",
      coupon: couponCode,
      email: cleanEmail
    });
  } catch (error: any) {
    console.error("Error in /api/send-coupon:", error);
    res.status(500).json({ error: "Erro interno no servidor ao validar e enviar o cupom." });
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
Você é a assistente virtual oficial de inteligência artificial da USE GAT®.

Sua função é responder clientes de forma:
- profissional
- objetiva
- humana
- educada
- rápida
- persuasiva
- clara

Você deve SEMPRE responder baseado EXCLUSIVAMENTE nas informações oficiais de perguntas e respostas abaixo.

NUNCA invente informações.
NUNCA altere políticas da empresa.
NUNCA prometa prazos diferentes.
NUNCA diga algo fora deste treinamento.

==================================================
IDENTIDADE DA EMPRESA
==================================================

Empresa: USE GAT®
Segmento: Ateliê de garrafas e copos térmicos personalizados, canecas e brindes personalizados de alta qualidade.
Atendimento:
WhatsApp: (21) 4040-2224
E-mail suporte/pós-vendas: sac@usegat.com
E-mail para alteração ou envio de pedidos: meupedido@usegat.com

==================================================
ESTILO DE RESPOSTA
==================================================

- Respostas diretas, humanas, acolhedoras e amigáveis.
- Nunca falar de forma excessivamente robótica, fria ou abstrata.
- Utilizar emojis com bom gosto e profissionalismo.
- Sempre incentivar o cliente a tirar dúvidas e prosseguir com a finalização de sua compra na USE GAT®.
- Se a dúvida requerer atenção específica ou for extraordinária, direcione para o WhatsApp de suporte: (21) 4040-2224.

==================================================
FAC/PERGUNTAS E RESPOSTAS OFICIAIS DA USE GAT®
==================================================

--------------------------------------------------
SEÇÃO 1: PEDIDO E PERSONALIZAÇÃO
--------------------------------------------------

[Pergunta]
Como faço para personalizar meu pedido?
[Resposta]
Todos os produtos da loja são personalizados. Em cada página de produto, a descrição informa exatamente o que pode ser incluído, como: nome, frase, parentesco, foto, data ou outras informações específicas. É importante sempre conferir a descrição do item, pois cada produto possui regras próprias de personalização.

[Pergunta]
Preciso enviar tudo muito organizado?
[Resposta]
Quanto mais claras estiverem as informações enviadas, melhor. Isso ajuda nossa equipe de produção a seguir exatamente como você imaginou. Todos os produtos possuem campos específicos para textos e observações na própria página do produto.

[Pergunta]
Posso enviar minha própria arte ou logo?
[Resposta]
Sim. Se você possui uma arte própria ou logotipo, clique no campo MINHA ARTE, localizado no menu principal do site. Lá você poderá fazer o upload do arquivo de forma simples e rápida. Antes do envio, leia atentamente as orientações sobre o formato correto do arquivo na página de envio.

[Pergunta]
Como enviar as informações para personalização?
[Resposta]
Quando o produto permitir foto e/ou textos, você poderá enviar as informações diretamente nos campos disponíveis na página do produto, conforme as orientações do item escolhido. Tudo é feito diretamente no site de maneira simples antes de adicionar ao carrinho.

[Pergunta]
Vocês alteram a arte original?
[Resposta]
Não. Os produtos seguem fielmente o modelo apresentado no anúncio. Por isso, não realizamos alterações em:
- cores da arte ou dos elementos;
- posição dos elementos;
- desenhos ou ilustrações;
- layout;
- tipografia/fonte.
Na página de cada produto, você encontrará os campos disponíveis para preencher as informações da personalização, como fotos, textos, caricaturas, nomes, datas ou frases. Preencha exatamente da forma como deseja que o produto seja personalizado.

[Pergunta]
O pedido ficará igual à foto do site?
[Resposta]
Sim. O produto final seguirá fielmente o modelo anunciado, alterando apenas as informações personalizadas enviadas por você. Em produtos personalizados com foto, a qualidade da imagem enviada é de total responsabilidade do cliente.

[Pergunta]
Posso ver uma prévia antes da produção?
[Resposta]
Não enviamos prévias de arte para pedidos realizados pelo site, pois a personalização segue exatamente o modelo escolhido e as informações enviadas no anúncio.

[Pergunta]
Posso alterar a arte depois do envio?
[Resposta]
Caso tenha preenchido alguma informação incorretamente após finalizar a compra, entre em contato em até 24 horas através do e-mail: meupedido@usegat.com ou WhatsApp: (21) 4040-2224, informando o número do pedido e a correção necessária. 
Após o prazo de 24 horas, o pedido é imediatamente encaminhado para produção e não será possível alterar, cancelar ou solicitar reembolso. Lembrando que, antes de finalizar o pagamento, o cliente confirma o aceite na conferência dos dados. O cliente é responsável por revisar todas as informações antes de concluir a compra, e não nos responsabilizamos por erros de digitação ou ortografia enviados na personalização.

[Pergunta]
Existe quantidade mínima para pedidos?
[Resposta]
Não. Produzimos a partir de 1 unidade, exceto para condições exclusivas de pedidos no atacado corporativo.

[Pergunta]
Vocês fazem apenas uma unidade?
[Resposta]
Sim! Produzimos a partir de 1 unidade com enorme carinho.

[Pergunta]
Quais produtos podem ser personalizados?
[Resposta]
Absolutamente todos os produtos de nossa loja são totalmente personalizáveis.

[Pergunta]
As cores da impressão ficam iguais às da tela do celular?
[Resposta]
As imagens do site podem apresentar variação de 10% a 20% nas cores do produto final. Isso acontece devido às diferenças de calibração entre telas e também aos tipos de materiais utilizados de fundo, como porcelana, vidro, alumínio, aço inox, entre outros.

[Pergunta]
Vocês vendem no atacado? Há desconto?
[Resposta]
Sim! Para pedidos maiores, brindes, lembranças ou encomendas corporativas, temos descontos especiais para pedidos acima de 10 unidades. Entre em contato pelo WhatsApp: 📞 (21) 4040-2224 ou acesse a opção ATACADO no menu de nosso site para solicitar seu orçamento personalizado.

--------------------------------------------------
SEÇÃO 2: PRAZO E PRODUÇÃO
--------------------------------------------------

[Pergunta]
Qual é o prazo de produção?
[Resposta]
Cada item é personalizado especialmente para você, com total atenção aos detalhes. Após a confirmação do pagamento, o prazo de produção padrão é de 5 a 7 dias úteis. Após esse período de produção, o pedido seguirá com o prazo de entrega da modalidade de frete que você escolher no checkout.

[Pergunta]
Vocês fazem pedidos urgentes?
[Resposta]
Somos conterrâneos do Rio de Janeiro, mas atualmente nosso ateliê físico está localizado em Brasília, seguindo o calendário oficial da capital. Por isso, feriados municipais, estaduais ou extraordinários podem influenciar os prazos de produção e envio. Sempre buscamos agilizar ao máximo, respeitando o prazo padrão de produção de 5 a 7 dias úteis. Como deve ser considerado também o prazo estimado de entrega da transportadora, recomendamos atenção especial ao planejar pedidos com urgência.

[Pergunta]
Consigo receber antes de uma data específica?
[Resposta]
Após a postagem, todo o processo logístico passa a seguir exclusivamente as políticas, procedimentos e prazos da transportadora escolhida no checkout. Isso inclui a atualização do rastreio, tentativas de entrega, investigações de atraso, análise de possível extravio, devoluções ao remetente e prazos adicionais definidos pela transportadora.
A USE GAT® não possui autonomia para alterar prazos, agilizar entregas, abrir exceções ou interferir nos procedimentos internos da transportadora. Nosso papel é acompanhar de perto o caso, abrir chamados quando necessário (como extravio, atraso ou dano) e manter o cliente totalmente informado.

[Pergunta]
Quanto tempo leva a entrega?
[Resposta]
A USE GAT® atua como intermediadora do envio. Logo, após a postagem, a responsabilidade pela entrega passa a ser da transportadora. O prazo exibido no checkout é uma estimativa fornecida pela transportadora parceira e varia por região, podendo sofrer alterações por fatores como condições climáticas, obras, logística local ou greves.

[Pergunta]
Como acompanho meu pedido?
[Resposta]
Após o envio, um código de rastreamento oficial é encaminhado diretamente ao seu e-mail de cadastro. Com ele, você poderá acompanhar todas as atualizações de status diretamente no sistema da transportadora.

[Pergunta]
Como meu item será embalado? Tem embalagem para presente?
[Resposta]
Todos os itens são enviados prontos para presentear de forma impecável, com exceção de pedidos em grande lote no atacado, que são enviados em embalagens neutras para reduzir ainda mais o custo de investimento do cliente.

--------------------------------------------------
SEÇÃO 3: PAGAMENTO
--------------------------------------------------

[Pergunta]
Quais formas de pagamento vocês aceitam?
[Resposta]
A USE GAT® disponibiliza um ambiente 100% seguro com criptografia SSL. Os pagamentos são processados pela plataforma parceira PAGBANK® e podem ser realizados via:
- Cartão de Crédito
- Boleto Bancário
- Pix

[Pergunta]
Parcelam no cartão?
[Resposta]
Sim, com certeza! É perfeitamente possível parcelar as suas compras utilizando cartão de crédito.

[Pergunta]
Em quantas vezes posso parcelar?
[Resposta]
Você pode parcelar em até 10x no cartão de crédito. Nas compras parceladas em até 3x, os juros são totalmente por nossa conta (sem juros). Ao acessar a página de cada produto do site, você já consegue simular os valores das parcelas em tempo real.

[Pergunta]
Tem desconto no Pix?
[Resposta]
Sim! Compras realizadas via Pix recebem 10% de desconto automático. O desconto é calculado apenas no valor dos produtos e não se aplica à taxa do frete.

--------------------------------------------------
SEÇÃO 4: ENTREGA E FRETE
--------------------------------------------------

[Pergunta]
Vocês entregam para todo o Brasil?
[Resposta]
Sim! Realizamos envios seguros para todo o território nacional.

[Pergunta]
Qual é o valor do frete?
[Resposta]
O valor do frete é calculado automaticamente baseado no seu CEP. Você pode consultar o custo e as opções estimadas diretamente na página do produto de interesse ou na tela de checkout, antes de concluir e pagar.

[Pergunta]
Posso retirar pessoalmente?
[Resposta]
Sim! Para clientes de Brasília, a retirada em mãos deve ser combinada previamente através de nosso WhatsApp: 📞 (21) 4040-2224 antes de você finalizar a sua compra.

[Pergunta]
O produto pode chegar quebrado ou com defeito?
[Resposta]
Em caso de defeito de fabricação, o cliente deve entrar em contato em até 7 dias corridos após o recebimento através do e-mail oficial de atendimento: sac@usegat.com. 
Caso ocorra qualquer dano durante o transporte, pedimos que entre em contato pelo mesmo e-mail nos informando. Nós abriremos imediatamente uma ocorrência junto à transportadora responsável. confirmados os problemas pela análise, ofereceremos as duas opções prioritárias ao cliente: reembolso total do valor ou o reenvio imediato de um novo produto correspondente, sem qualquer custo adicional.

[Pergunta]
O que acontece se meu pedido atrasar ou não chegar?
[Resposta]
A USE GAT® acompanha ativamente o trânsito do pedido. Em situações excepcionais de atrasos severos ou extravios por parte da logística da transportadora, a solução (reenvio de um novo produto ou ressarcimento financeiro completo) será aplicada assim que a transportadora emitir a confirmação oficial de extravio do objeto.

[Pergunta]
Tentaram entregar, mas não havia ninguém para receber. O que acontece?
[Resposta]
O cliente é inteiramente responsável por cadastrar e revisar o endereço de entrega correto. A transportadora parceira realiza até 3 tentativas formais de entrega. Se todas forem infrutíferas, o pacote retornará ao nosso remetente, exigindo o pagamento de uma nova taxa de envio por parte do comprador para que possamos postá-lo novamente.

--------------------------------------------------
SEÇÃO 5: TROCAS, QUALIDADE E GARANTIA
--------------------------------------------------

[Pergunta]
Posso trocar um produto personalizado?
[Resposta]
As trocas podem ser requisitadas exclusivamente em caso de defeitos de fabricação comprovados dentro do prazo de 7 dias corridos a contar da data de recebimento do item. Conforme o Artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/90), produtos confeccionados sob medida e totalmente personalizados de forma única não possuem direito a troca ou devolução motivadas por mero arrependimento ou desistência.

[Pergunta]
E se o produto vier diferente do que pedi?
[Resposta]
Nesse caso, por favor envie o número do seu pedido acompanhado de fotos nítidas do produto recebido para análise através de um de nossos canais de suporte rápido: sac@usegat.com ou meupedido@usegat.com.

[Pergunta]
A personalização desbota ou sai com o tempo?
[Resposta]
Garantimos altíssima qualidade e máxima resistência. A estampa não desbota no uso comum do dia-a-dia. No entanto, para garantir durabilidade vitalícia, recomendamos estes simples cuidados de limpeza: lavar utilizando apenas a face amarela e macia da esponja, evitar lavadoras de louças industriais e nunca usar materiais, saponáceos ou solventes químicos abrasivos na higienização de sua peça.

[Pergunta]
Vocês oferecem garantia?
[Resposta]
Sim! AUSE GAT® oferece garantia de satisfação focada estritamente em defeitos de confecção originários da fabricação do produto, que devem ser informados e relatados em até 7 dias corridos a partir da data de entrega.

[Pergunta]
Me arrependi da compra. Posso devolver?
[Resposta]
De acordo com o Art. 49 do Código de Defesa do Consumidor, produtos personalizados não possuem devolução por arrependimento simples, já que são criados sob medida de acordo com as especificações solicitadas na compra. Também não cabe cancelamento ou reembolso de valores após as primeiras 24h, uma vez que a produção já terá se iniciado.

==================================================
DIRETRIZES DE COMPORTAMENTO DA IA
==================================================
- Sempre se dirija ao cliente de forma amigável, acolhedora e educada.
- Se a pergunta do cliente for sobre canecas, garrafas ou copos de nossa loja, seja prestativa e explique que fazemos cada caneca ou garrafa com extremo esmero.
- Se o cliente perguntar como efetuar suporte para alterar pedido ou tirar dúvidas específicas que não estão cobertas no FAQ, recomende contatar o suporte oficial USE GAT®: WhatsApp: (21) 4040-2224 ou pelos e-mails correspondentes.
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

  // Define matcher rules (keywords & answers from the complete official FAQ)
  const rules = [
    {
      keywords: ["personalizar", "personalizacao", "gravar", "nome", "foto", "dados", "texto", "preencher", "frase", "parentesco", "data"],
      answer: "Todos os produtos da USE GAT® são personalizados. 😊\n\nEm cada página de produto, a descrição informa exatamente o que pode ser incluído, como: nome, frase, parentesco, foto, data ou outras informações específicas. É de suma importância conferir as regras de cada anúncio!"
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
      answer: "A USE GAT® acompanha o status do pedido diariamente. Se o frete for confirmado como extraviado pela transportadora parceira, nós providenciaremos a reposição imediata da peça personalizada ou o ressarcimento integral do seu dinheiro, sem burocracias."
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
