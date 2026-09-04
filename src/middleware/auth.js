'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ibmle-segredo-jwt-2026';

function exigirLogin(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Faça login.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

function exigirAdmin(req, res, next) {
  if (!req.usuario || req.usuario.papel !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

function exigirLiderOuAdmin(req, res, next) {
  if (!req.usuario || (req.usuario.papel !== 'admin' && req.usuario.papel !== 'lider')) {
    return res.status(403).json({ error: 'Acesso restrito a líderes e administradores.' });
  }
  next();
}

module.exports = { exigirLogin, exigirAdmin, exigirLiderOuAdmin, JWT_SECRET };
