'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const apiRoutes = require('../src/api');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Suporta tanto /api/... quanto /... na Vercel
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use((err, req, res, next) => {
  console.error('[ERRO VERCEL SERVERLESS]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno no servidor Vercel.',
  });
});

module.exports = app;
