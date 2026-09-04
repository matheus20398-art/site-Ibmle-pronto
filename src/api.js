'use strict';

const express = require('express');
const { queryAll, queryRun } = require('./conexao');

const authRoutes = require('./routes/auth');
const membrosRoutes = require('./routes/membros');
const ministeriosRoutes = require('./routes/ministerios');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/membros', membrosRoutes);
router.use('/ministerios', ministeriosRoutes);


function sanitizeStr(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'IBMLE API',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/escala', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const escalas = await queryAll(
      `SELECT id, data, culto, louvor, musicos, obs
       FROM escala_louvor
       WHERE data >= ?
       ORDER BY data ASC
       LIMIT 8`,
      [hoje]
    );

    res.json(escalas);
  } catch (err) {
    console.error('[API] Erro ao buscar escala:', err.message);
    res.status(500).json({ error: 'Erro ao buscar escala.' });
  }
});

router.post('/escala', async (req, res) => {
  const { data, culto, louvor, musicos, obs } = req.body || {};

  if (!data || !culto) {
    return res.status(400).json({ error: 'Campos obrigatórios: data, culto.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
  }

  try {
    const result = await queryRun(
      `INSERT INTO escala_louvor (data, culto, louvor, musicos, obs)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sanitizeStr(data, 10),
        sanitizeStr(culto, 100),
        sanitizeStr(louvor || '', 100),
        sanitizeStr(musicos || '', 200),
        sanitizeStr(obs || '', 300),
      ]
    );

    res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Escala adicionada com sucesso.' });
  } catch (err) {
    console.error('[API] Erro ao inserir escala:', err.message);
    res.status(500).json({ error: 'Erro ao salvar escala.' });
  }
});

router.delete('/escala/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const result = await queryRun(
      'DELETE FROM escala_louvor WHERE id = ?',
      [Number(id)]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    res.json({ mensagem: 'Entrada removida com sucesso.' });
  } catch (err) {
    console.error('[API] Erro ao deletar escala:', err.message);
    res.status(500).json({ error: 'Erro ao remover entrada.' });
  }
});

router.post('/oracao', async (req, res) => {
  const { nome, contato, pedido, anonimo } = req.body || {};

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
    const result = await queryRun(
      `INSERT INTO pedidos_oracao (nome, contato, pedido, anonimo)
       VALUES (?, ?, ?, ?)`,
      [nomeVal, sanitizeStr(contato || '', 50), pedidoVal, anonimo ? 1 : 0]
    );

    console.log(`[API] Novo pedido de oração recebido (ID: ${result.lastInsertRowid})`);
    res.status(201).json({ mensagem: 'Pedido de oração recebido. Oraremos por você! 🙏' });
  } catch (err) {
    console.error('[API] Erro ao salvar pedido de oração:', err.message);
    res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

router.get('/oracao', async (req, res) => {
  try {
    const pedidos = await queryAll(
      `SELECT id, 
             CASE WHEN anonimo = 1 THEN 'Anônimo' ELSE nome END as nome,
             CASE WHEN anonimo = 1 THEN '' ELSE contato END as contato,
             pedido, anonimo, criado_em, lido
       FROM pedidos_oracao
       ORDER BY criado_em DESC
       LIMIT 50`
    );

    res.json(pedidos);
  } catch (err) {
    console.error('[API] Erro ao listar pedidos:', err.message);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

module.exports = router;
