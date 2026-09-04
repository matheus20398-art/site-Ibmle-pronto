'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryGet, queryRun } = require('../conexao');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const emailLimpo = email.trim().toLowerCase();
    const usuarioExiste = await queryGet('SELECT id FROM usuarios WHERE email = ?', [emailLimpo]);

    if (usuarioExiste) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await queryRun(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), emailLimpo, senha_hash]
    );

    res.status(201).json({ ok: true, mensagem: 'Usuário cadastrado com sucesso!', id: result.lastInsertRowid });
  } catch (err) {
    console.error('[AUTH] Erro no cadastro:', err.message);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe email e senha.' });
    }

    const usuario = await queryGet(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
      [email.trim().toLowerCase()]
    );

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await queryRun("UPDATE usuarios SET ultimo_login = datetime('now') WHERE id = ?", [usuario.id]);

    res.json({ ok: true, usuario, token });
  } catch (err) {
    console.error('[AUTH] Erro no login:', err.message);
    res.status(500).json({ error: 'Erro ao processar login.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ logado: false });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ logado: true, usuario: payload });
  } catch {
    res.status(401).json({ logado: false });
  }
});

module.exports = router;
