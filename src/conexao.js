'use strict';

// ── SQLite em memória (via sql.js / WebAssembly) ─────────────────────
// Substitui o MySQL para permitir deploy na Vercel (serverless).
// ATENÇÃO: dados são perdidos a cada cold start na Vercel.

const initSqlJs = require('sql.js');

let db = null;
let dbPromise = null;

async function conectar() {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    console.log('[DB] Inicializando SQLite em memória...');

    const fs = require('fs');
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
    const wasmBinary = fs.readFileSync(wasmPath);

    const SQL = await initSqlJs({ wasmBinary });
    db = new SQL.Database();

    // ── Tabela de ministérios ──────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS ministerios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        icone VARCHAR(10) DEFAULT '✋',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Tabela de usuários ─────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        papel VARCHAR(50) DEFAULT 'membro',
        ministerio_id INTEGER,
        ativo INTEGER DEFAULT 1,
        ultimo_login DATETIME,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ministerio_id) REFERENCES ministerios(id)
      );
    `);

    // ── Tabela de membros ──────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS membros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        telefone VARCHAR(30),
        email VARCHAR(150),
        data_nascimento VARCHAR(10),
        endereco VARCHAR(255),
        ministerio VARCHAR(100),
        data_batismo VARCHAR(10),
        observacoes TEXT,
        ativo INTEGER DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Tabela de vinculação membros ↔ ministérios (muitos-para-muitos)
    db.run(`
      CREATE TABLE IF NOT EXISTS membros_ministerios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        membro_id INTEGER NOT NULL,
        ministerio_id INTEGER NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (membro_id) REFERENCES membros(id),
        FOREIGN KEY (ministerio_id) REFERENCES ministerios(id),
        UNIQUE(membro_id, ministerio_id)
      );
    `);

    // ── Escala de louvor ───────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS escala_louvor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data VARCHAR(10) NOT NULL,
        culto VARCHAR(100) NOT NULL,
        louvor VARCHAR(100),
        musicos VARCHAR(200),
        obs VARCHAR(300),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Pedidos de oração ──────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS pedidos_oracao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        contato VARCHAR(50),
        pedido TEXT NOT NULL,
        anonimo INTEGER DEFAULT 0,
        lido INTEGER DEFAULT 0,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Seed: ministérios da IBMLE ─────────────────────────────────────
    const ministeriosSeed = [
      ['Ministério de Louvor', '🎵'],
      ['Clamor do Silêncio', '🤟'],
      ['Grupo de Varões', '👨‍👨‍👦'],
      ['Grupo de Senhoras', '👩‍👩‍👧'],
      ['Jovens Conexão', '⚡'],
      ['Dança Renascer', '💃'],
      ['Departamento Infantil', '🧒'],
      ['Missões', '🌍'],
      ['Ministério da Família', '❤️'],
      ['Teatro', '🎭'],
    ];

    const countResult = db.exec("SELECT COUNT(*) FROM ministerios");
    const count = countResult[0]?.values[0][0] || 0;

    if (count === 0) {
      const stmt = db.prepare("INSERT INTO ministerios (nome, icone) VALUES (?, ?)");
      for (const [nome, icone] of ministeriosSeed) {
        stmt.run([nome, icone]);
      }
      stmt.free();
      console.log('[DB] Seed: 10 ministérios inseridos.');
    }

    console.log('[DB] Tabelas verificadas/criadas com sucesso no SQLite em memória.');
    return db;
  })();

  return dbPromise;
}

function getDb() {
  if (!db) throw new Error('Banco não inicializado. Chame conectar() primeiro.');
  return db;
}

async function queryAll(sql, args = []) {
  await conectar();
  const stmt = getDb().prepare(sql);
  stmt.bind(args);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function queryGet(sql, args = []) {
  const rows = await queryAll(sql, args);
  return rows[0] || null;
}

async function queryRun(sql, args = []) {
  await conectar();
  const d = getDb();
  d.run(sql, args);
  return {
    lastInsertRowid: d.exec("SELECT last_insert_rowid() AS id")[0]?.values[0][0] || 0,
    changes: d.getRowsModified(),
  };
}

module.exports = {
  conectar,
  queryAll,
  queryGet,
  queryRun,
};