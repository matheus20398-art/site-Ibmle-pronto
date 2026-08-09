/**
 * IBMLE — Servidor Express
 * Igreja Batista Missionária em Lagoa Encantada
 * PHP Dev · 2026
 */

'use strict';

const express = require('express');
const path    = require('path');
const { conectar } = require('./conexao');
const api     = require('./api');

const app  = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   MIDDLEWARES
   ========================================================= */
// Parse JSON e URL encoded
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Headers de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS (desenvolvimento)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ibmlesite-6xwavq.manus.space',
  ];
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Log de requisições
app.use((req, res, next) => {
  const ts = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

/* =========================================================
   ARQUIVOS ESTÁTICOS (PWA)
   ========================================================= */
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Cache de assets estáticos em produção
app.use(express.static(PUBLIC_DIR, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

/* =========================================================
   ROTAS DA API
   ========================================================= */
app.use('/api', api);

/* =========================================================
   SPA — Qualquer rota não-API retorna o index.html
   ========================================================= */
app.get('{*path}', (req, res) => {
  // Não redirecionar rotas de API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Rota não encontrada.' });
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* =========================================================
   TRATAMENTO DE ERROS
   ========================================================= */
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor.'
      : err.message,
  });
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
try {
  conectar();
} catch (err) {
  console.error('[AVISO] Falha na inicialização do banco:', err.message);
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   🏛️  IBMLE — Servidor iniciado               ║');
    console.log('║   Igreja Batista Missionária em Lagoa Enc.   ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   🌐  http://localhost:${PORT}                  ║`);
    console.log(`║   📁  Servindo: ${PUBLIC_DIR.slice(-30)}`);
    console.log('╚══════════════════════════════════════════════╝\n');
  });
}

module.exports = app;

