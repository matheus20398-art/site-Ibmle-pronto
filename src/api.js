/**
 * IBMLE — Rotas da API REST
 * PHP Dev · 2026
 */

'use strict';

const express = require('express');
const { obterDB } = require('./conexao');

const router = express.Router();

/* =========================================================
   MIDDLEWARE: Validação simples
   ========================================================= */
function sanitizeStr(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

/* =========================================================
   GET /api/status — Health check
   ========================================================= */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'IBMLE API',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   GET /api/escala — Escala do Ministério de Louvor
   ========================================================= */
router.get('/escala', (req, res) => {
  try {
    const db = obterDB();
    const hoje = new Date().toISOString().split('T')[0];

    const escalas = db.prepare(`
      SELECT id, data, culto, louvor, musicos, obs
      FROM escala_louvor
      WHERE data >= ?
      ORDER BY data ASC
      LIMIT 8
    `).all(hoje);

    res.json(escalas);
  } catch (err) {
    console.error('[API] Erro ao buscar escala:', err.message);
    res.status(500).json({ error: 'Erro ao buscar escala.' });
  }
});

/* =========================================================
   POST /api/escala — Adicionar entrada na escala (admin)
   ========================================================= */
router.post('/escala', (req, res) => {
  const { data, culto, louvor, musicos, obs } = req.body || {};

  if (!data || !culto) {
    return res.status(400).json({ error: 'Campos obrigatórios: data, culto.' });
  }

  // Validar formato de data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
  }

  try {
    const db = obterDB();
    const stmt = db.prepare(`
      INSERT INTO escala_louvor (data, culto, louvor, musicos, obs)
      VALUES (@data, @culto, @louvor, @musicos, @obs)
    `);

    const result = stmt.run({
      data: sanitizeStr(data, 10),
      culto: sanitizeStr(culto, 100),
      louvor: sanitizeStr(louvor || '', 100),
      musicos: sanitizeStr(musicos || '', 200),
      obs: sanitizeStr(obs || '', 300),
    });

    res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Escala adicionada com sucesso.' });
  } catch (err) {
    console.error('[API] Erro ao inserir escala:', err.message);
    res.status(500).json({ error: 'Erro ao salvar escala.' });
  }
});

/* =========================================================
   DELETE /api/escala/:id — Remover entrada da escala
   ========================================================= */
router.delete('/escala/:id', (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const db = obterDB();
    const result = db.prepare('DELETE FROM escala_louvor WHERE id = ?').run(Number(id));

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    res.json({ mensagem: 'Entrada removida com sucesso.' });
  } catch (err) {
    console.error('[API] Erro ao deletar escala:', err.message);
    res.status(500).json({ error: 'Erro ao remover entrada.' });
  }
});

/* =========================================================
   POST /api/oracao — Enviar pedido de oração
   ========================================================= */
router.post('/oracao', (req, res) => {
  const { nome, contato, pedido, anonimo } = req.body || {};

  // Validação
  if (!nome || !pedido) {
    return res.status(400).json({ error: 'Nome e pedido são obrigatórios.' });
  }

  const nomeVal   = sanitizeStr(nome, 100);
  const pedidoVal = sanitizeStr(pedido, 1000);

  if (nomeVal.length < 2) {
    return res.status(400).json({ error: 'Nome muito curto.' });
  }

  if (pedidoVal.length < 10) {
    return res.status(400).json({ error: 'Pedido muito curto (mínimo 10 caracteres).' });
  }

  try {
    const db = obterDB();
    const stmt = db.prepare(`
      INSERT INTO pedidos_oracao (nome, contato, pedido, anonimo)
      VALUES (@nome, @contato, @pedido, @anonimo)
    `);

    const result = stmt.run({
      nome: nomeVal,
      contato: sanitizeStr(contato || '', 50),
      pedido: pedidoVal,
      anonimo: anonimo ? 1 : 0,
    });

    console.log(`[API] Novo pedido de oração recebido (ID: ${result.lastInsertRowid})`);
    res.status(201).json({ mensagem: 'Pedido de oração recebido. Oraremos por você! 🙏' });
  } catch (err) {
    console.error('[API] Erro ao salvar pedido de oração:', err.message);
    res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

/* =========================================================
   GET /api/oracao — Listar pedidos (uso interno/admin)
   ========================================================= */
router.get('/oracao', (req, res) => {
  try {
    const db = obterDB();
    const pedidos = db.prepare(`
      SELECT id, 
             CASE WHEN anonimo = 1 THEN 'Anônimo' ELSE nome END as nome,
             CASE WHEN anonimo = 1 THEN '' ELSE contato END as contato,
             pedido, anonimo, criado_em, lido
      FROM pedidos_oracao
      ORDER BY criado_em DESC
      LIMIT 50
    `).all();

    res.json(pedidos);
  } catch (err) {
    console.error('[API] Erro ao listar pedidos:', err.message);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

module.exports = router;
