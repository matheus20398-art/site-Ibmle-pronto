/**
 * IBMLE — Conexão com banco de dados (SQLite3 Local / MemoryDB Fallback para Vercel Serverless)
 * PHP Dev · 2026
 */

'use strict';

const path = require('path');
const fs = require('fs');

let db = null;
let useMemoryDB = false;

// Banco de dados em memória para ambiente Serverless (Vercel) ou fallback
class MemoryDB {
  constructor() {
    this.pedidosOracao = [];
    this.escalaLouvor = [];
    this.nextOracaoId = 1;
    this.nextEscalaId = 1;
    this.popularDados();
  }

  popularDados() {
    const hoje = new Date();
    const louvorOptions = ['Willams', 'Rosa', 'Pr. Jonathas'];
    const musicosOptions = [
      'Pr. Jonathas · Rosa',
      'Willams · Pr. Jonathas',
      'Rosa · Willams',
    ];

    for (let i = 1; i <= 8; i++) {
      const dom = new Date(hoje);
      const diasAteProxDom = (7 - hoje.getDay()) % 7 || 7;
      dom.setDate(hoje.getDate() + diasAteProxDom + (i - 1) * 7);
      const dataStr = dom.toISOString().split('T')[0];
      const idx = (i - 1) % 3;

      this.escalaLouvor.push({
        id: this.nextEscalaId++,
        data: dataStr,
        culto: 'Culto da Família',
        louvor: louvorOptions[idx],
        musicos: musicosOptions[idx],
        obs: i === 1 ? 'Próximo domingo' : '',
        criado_em: new Date().toISOString(),
      });
    }
  }

  prepare(sql) {
    const sqlUpper = sql.toUpperCase().trim();
    const self = this;

    // --- ESCALA ---
    if (sqlUpper.includes('FROM ESCALA_LOUVOR') && sqlUpper.includes('SELECT')) {
      return {
        all: (dataMin) => {
          return self.escalaLouvor
            .filter((item) => !dataMin || item.data >= dataMin)
            .sort((a, b) => a.data.localeCompare(b.data))
            .slice(0, 8);
        },
        get: () => self.escalaLouvor[0] || null,
      };
    }

    if (sqlUpper.includes('INSERT INTO ESCALA_LOUVOR')) {
      return {
        run: (params) => {
          const newItem = {
            id: self.nextEscalaId++,
            data: params.data || '',
            culto: params.culto || '',
            louvor: params.louvor || '',
            musicos: params.musicos || '',
            obs: params.obs || '',
            criado_em: new Date().toISOString(),
          };
          self.escalaLouvor.push(newItem);
          return { lastInsertRowid: newItem.id, changes: 1 };
        },
      };
    }

    if (sqlUpper.includes('DELETE FROM ESCALA_LOUVOR')) {
      return {
        run: (id) => {
          const initialLen = self.escalaLouvor.length;
          self.escalaLouvor = self.escalaLouvor.filter((item) => item.id !== Number(id));
          const changes = initialLen - self.escalaLouvor.length;
          return { changes };
        },
      };
    }

    // --- ORAÇÃO ---
    if (sqlUpper.includes('INSERT INTO PEDIDOS_ORACAO')) {
      return {
        run: (params) => {
          const newItem = {
            id: self.nextOracaoId++,
            nome: params.nome || 'Anônimo',
            contato: params.contato || '',
            pedido: params.pedido || '',
            anonimo: params.anonimo ? 1 : 0,
            criado_em: new Date().toISOString(),
            lido: 0,
          };
          self.pedidosOracao.push(newItem);
          return { lastInsertRowid: newItem.id, changes: 1 };
        },
      };
    }

    if (sqlUpper.includes('FROM PEDIDOS_ORACAO') && sqlUpper.includes('SELECT')) {
      return {
        all: () => {
          return self.pedidosOracao
            .slice()
            .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
            .slice(0, 50)
            .map((p) => ({
              id: p.id,
              nome: p.anonimo === 1 ? 'Anônimo' : p.nome,
              contato: p.anonimo === 1 ? '' : p.contato,
              pedido: p.pedido,
              anonimo: p.anonimo,
              criado_em: p.criado_em,
              lido: p.lido,
            }));
        },
      };
    }

    // Fallback genérico
    return {
      all: () => [],
      get: () => null,
      run: () => ({ lastInsertRowid: 1, changes: 1 }),
    };
  }

  transaction(fn) {
    return (rows) => fn(rows);
  }
}

function conectar() {
  if (db) return db;

  // Se estiver na Vercel ou for forçado fallback em memória
  if (process.env.VERCEL || process.env.USE_MEMORY_DB) {
    console.log('[DB] Ambiente Serverless Vercel detectado. Utilizando MemoryDB.');
    useMemoryDB = true;
    db = new MemoryDB();
    return db;
  }

  try {
    const Database = require('better-sqlite3');
    const DB_DIR = path.join(__dirname, 'database');
    const DB_PATH = path.join(DB_DIR, 'ibmle.db');

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    criarTabelas(db);
    popularDadosIniciais(db);

    console.log('[DB] SQLite conectado:', DB_PATH);
    return db;
  } catch (err) {
    console.warn('[DB] Falha ao carregar SQLite3 (' + err.message + '). Ativando fallback em memória.');
    useMemoryDB = true;
    db = new MemoryDB();
    return db;
  }
}

function criarTabelas(database) {
  if (!database || useMemoryDB) return;
  database.exec(`
    CREATE TABLE IF NOT EXISTS pedidos_oracao (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL,
      contato   TEXT,
      pedido    TEXT NOT NULL,
      anonimo   INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      lido      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS escala_louvor (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      data     TEXT NOT NULL,
      culto    TEXT NOT NULL,
      louvor   TEXT,
      musicos  TEXT,
      obs      TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

function popularDadosIniciais(database) {
  if (!database || useMemoryDB) return;
  const count = database.prepare('SELECT COUNT(*) as c FROM escala_louvor').get();
  if (count.c > 0) return;

  const hoje = new Date();
  const escalas = [];

  for (let i = 1; i <= 8; i++) {
    const dom = new Date(hoje);
    const diasAteProxDom = (7 - hoje.getDay()) % 7 || 7;
    dom.setDate(hoje.getDate() + diasAteProxDom + (i - 1) * 7);
    const dataStr = dom.toISOString().split('T')[0];

    const louvorOptions = ['Willams', 'Rosa', 'Pr. Jonathas'];
    const musicosOptions = [
      'Pr. Jonathas · Rosa',
      'Willams · Pr. Jonathas',
      'Rosa · Willams',
    ];
    const idx = (i - 1) % 3;

    escalas.push({
      data: dataStr,
      culto: 'Culto da Família',
      louvor: louvorOptions[idx],
      musicos: musicosOptions[idx],
      obs: i === 1 ? 'Próximo domingo' : '',
    });
  }

  const insert = database.prepare(
    'INSERT INTO escala_louvor (data, culto, louvor, musicos, obs) VALUES (@data, @culto, @louvor, @musicos, @obs)'
  );

  const insertMany = database.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  insertMany(escalas);
}

function obterDB() {
  return db || conectar();
}

module.exports = { conectar, obterDB };
