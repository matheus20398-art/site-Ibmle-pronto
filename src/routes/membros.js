'use strict';

const express = require('express');
const { queryAll, queryGet, queryRun } = require('../conexao');
const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { busca } = req.query;
    let membros;

    if (busca) {
      membros = await queryAll(
        `SELECT * FROM membros WHERE ativo = 1 AND (nome LIKE ? OR telefone LIKE ? OR email LIKE ?) ORDER BY nome`,
        [`%${busca}%`, `%${busca}%`, `%${busca}%`]
      );
    } else {
      membros = await queryAll('SELECT * FROM membros WHERE ativo = 1 ORDER BY nome');
    }

    res.json(membros);
  } catch (err) {
    console.error('[MEMBROS] Erro ao listar:', err.message);
    res.status(500).json({ error: 'Erro ao buscar membros.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const membro = await queryGet('SELECT * FROM membros WHERE id = ?', [req.params.id]);
    if (!membro) return res.status(404).json({ error: 'Membro não encontrado.' });
    res.json(membro);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar membro.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, telefone, email, data_nascimento, endereco, ministerio, data_batismo, observacoes } = req.body || {};

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do membro é obrigatório.' });
    }

    const result = await queryRun(
      `INSERT INTO membros (nome, telefone, email, data_nascimento, endereco, ministerio, data_batismo, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome.trim(), telefone || null, email || null, data_nascimento || null, endereco || null, ministerio || null, data_batismo || null, observacoes || null]
    );

    res.status(201).json({ ok: true, id: result.lastInsertRowid, mensagem: 'Membro cadastrado com sucesso.' });
  } catch (err) {
    console.error('[MEMBROS] Erro ao criar:', err.message);
    res.status(500).json({ error: 'Erro ao cadastrar membro.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, telefone, email, data_nascimento, endereco, ministerio, data_batismo, observacoes } = req.body || {};

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do membro é obrigatório.' });
    }

    const result = await queryRun(
      `UPDATE membros SET nome=?, telefone=?, email=?, data_nascimento=?, endereco=?, ministerio=?, data_batismo=?, observacoes=?, atualizado_em=datetime('now')
       WHERE id = ?`,
      [nome.trim(), telefone || null, email || null, data_nascimento || null, endereco || null, ministerio || null, data_batismo || null, observacoes || null, req.params.id]
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Membro não encontrado.' });
    res.json({ ok: true, mensagem: 'Membro atualizado com sucesso.' });
  } catch (err) {
    console.error('[MEMBROS] Erro ao editar:', err.message);
    res.status(500).json({ error: 'Erro ao editar membro.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await queryRun('UPDATE membros SET ativo = 0 WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Membro não encontrado.' });
    res.json({ ok: true, mensagem: 'Membro inativado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover membro.' });
  }
});

module.exports = router;
