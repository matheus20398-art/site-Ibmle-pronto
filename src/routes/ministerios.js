'use strict';

const express = require('express');
const { queryAll, queryGet, queryRun } = require('../conexao');
const { exigirLogin, exigirLiderOuAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /ministerios — listar todos os ministérios (público)
router.get('/', async (req, res) => {
  try {
    const ministerios = await queryAll('SELECT id, nome, icone FROM ministerios ORDER BY nome');
    res.json(ministerios);
  } catch (err) {
    console.error('[MINISTERIOS] Erro ao listar:', err.message);
    res.status(500).json({ error: 'Erro ao buscar ministérios.' });
  }
});

// GET /ministerios/:id/membros — listar membros de um ministério (requer login + líder/admin)
router.get('/:id/membros', exigirLogin, exigirLiderOuAdmin, async (req, res) => {
  try {
    const ministerioId = Number(req.params.id);

    // Líder só pode ver membros do próprio ministério
    if (req.usuario.papel === 'lider' && req.usuario.ministerio_id !== ministerioId) {
      return res.status(403).json({ error: 'Você só pode ver membros do seu ministério.' });
    }

    const membros = await queryAll(
      `SELECT m.id, m.nome, m.telefone, m.email, m.data_nascimento, m.endereco,
              m.data_batismo, m.observacoes, m.ativo, m.criado_em, m.atualizado_em
       FROM membros m
       INNER JOIN membros_ministerios mm ON mm.membro_id = m.id
       WHERE mm.ministerio_id = ? AND m.ativo = 1
       ORDER BY m.nome`,
      [ministerioId]
    );

    res.json(membros);
  } catch (err) {
    console.error('[MINISTERIOS] Erro ao listar membros:', err.message);
    res.status(500).json({ error: 'Erro ao buscar membros do ministério.' });
  }
});

// POST /ministerios/:id/membros — adicionar membro existente ao ministério
router.post('/:id/membros', exigirLogin, exigirLiderOuAdmin, async (req, res) => {
  try {
    const ministerioId = Number(req.params.id);
    const { membro_id } = req.body || {};

    if (!membro_id) {
      return res.status(400).json({ error: 'ID do membro é obrigatório.' });
    }

    // Líder só pode adicionar ao próprio ministério
    if (req.usuario.papel === 'lider' && req.usuario.ministerio_id !== ministerioId) {
      return res.status(403).json({ error: 'Você só pode gerenciar seu ministério.' });
    }

    // Verifica se membro existe
    const membro = await queryGet('SELECT id FROM membros WHERE id = ? AND ativo = 1', [membro_id]);
    if (!membro) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }

    // Verifica se já está vinculado
    const jaVinculado = await queryGet(
      'SELECT id FROM membros_ministerios WHERE membro_id = ? AND ministerio_id = ?',
      [membro_id, ministerioId]
    );
    if (jaVinculado) {
      return res.status(400).json({ error: 'Membro já pertence a este ministério.' });
    }

    await queryRun(
      'INSERT INTO membros_ministerios (membro_id, ministerio_id) VALUES (?, ?)',
      [membro_id, ministerioId]
    );

    res.status(201).json({ ok: true, mensagem: 'Membro adicionado ao ministério.' });
  } catch (err) {
    console.error('[MINISTERIOS] Erro ao vincular membro:', err.message);
    res.status(500).json({ error: 'Erro ao vincular membro ao ministério.' });
  }
});

// DELETE /ministerios/:id/membros/:membroId — remover membro do ministério
router.delete('/:id/membros/:membroId', exigirLogin, exigirLiderOuAdmin, async (req, res) => {
  try {
    const ministerioId = Number(req.params.id);
    const membroId = Number(req.params.membroId);

    // Líder só pode remover do próprio ministério
    if (req.usuario.papel === 'lider' && req.usuario.ministerio_id !== ministerioId) {
      return res.status(403).json({ error: 'Você só pode gerenciar seu ministério.' });
    }

    const result = await queryRun(
      'DELETE FROM membros_ministerios WHERE membro_id = ? AND ministerio_id = ?',
      [membroId, ministerioId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado.' });
    }

    res.json({ ok: true, mensagem: 'Membro removido do ministério.' });
  } catch (err) {
    console.error('[MINISTERIOS] Erro ao desvincular membro:', err.message);
    res.status(500).json({ error: 'Erro ao remover membro do ministério.' });
  }
});

module.exports = router;
