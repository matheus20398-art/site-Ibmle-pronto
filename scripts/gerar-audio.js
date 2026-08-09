/**
 * IBMLE — Gerador de Áudios (Text-to-Speech)
 * Gera os arquivos MP3 de narração para cada seção do site
 * 
 * Uso: node scripts/gerar-audio.js
 * PHP Dev · 2026
 */

'use strict';

const gtts = require('node-gtts');
const path = require('path');
const fs   = require('fs');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'assets', 'audio');

// Garantir que a pasta existe
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Instância do sintetizador em português do Brasil
const tts = gtts('pt');

/* =========================================================
   TEXTOS DE CADA SEÇÃO
   ========================================================= */
const SECOES = [
  {
    arquivo: 'historia.mp3',
    titulo: 'Nossa História',
    texto: `Nossa História. 
A Igreja Batista Missionária em Lagoa Encantada tem suas origens há mais de 30 anos, 
quando um grupo de crianças começou a se reunir na casa da irmã Célia 
para louvar e aprender a Palavra de Deus. 
A partir desse núcleo inicial, a obra foi crescendo e passou a alcançar também os pais dessas crianças.

Em 2010, a igreja já contava com mais de 200 membros e completava 29 anos de existência. 
Ao longo das décadas, a organização cresceu significativamente, 
tanto em estrutura física — hoje com dois pavimentos — quanto em programação ministerial.

Sob a liderança pastoral do Pastor Álvaro Donato de Brito, 
Pastor Jonathas Brito e Pastora Tânia Brito, 
a IBMLE continua firme na missão de alcançar vidas para Cristo em Lagoa Encantada e arredores.`
  },
  {
    arquivo: 'ministerios.mp3',
    titulo: 'Ministérios',
    texto: `Nossos Ministérios.

A IBMLE conta com os seguintes ministérios e departamentos:

Ministério de Louvor Só Pra Te Adorar, 
liderado pelo Pastor Jonathas, Willams e Rosa. 
A escala está disponível no site.

Grupo Clamor do Silêncio, ministério de Libras, 
liderado por Alexssandra.

Grupo de Varões, homens dedicados à obra, 
liderado por Leonardo e Irmão Josias.

Grupo de Senhoras, ministério das mulheres, 
liderado pela Pastora Tânia e Jaciana Passavanti.

Ministério Jovens Conexão, para jovens e adolescentes, 
liderado por Mikaela e Josias.

Ministério de Dança Renascer, expressão artística da fé, 
liderado por Sther e Andressa.

Departamento Infantil, para crianças, 
liderado por Suellen Raffaella e Daniela Guerra.

Ministério de Missões, envio e apoio missionário, 
liderado por Sther e Andressa.

Ministério da Família, famílias da congregação, 
liderado pelo Diácono Júnior Passavante e Ana Cristina.

Ministério de Teatro, expressão artística, 
com Peterson Nelson.`
  },
  {
    arquivo: 'programacao.mp3',
    titulo: 'Programação de Cultos',
    texto: `Programação de Cultos da IBMLE.

Terça-feira às 9 horas: Culto de Jejum e Oração.

Terça-feira às 14 horas: Culto Tarde da Vitória.

Quarta-feira às 19 horas: Culto de Oração.

Quinta-feira, das 19 às 20 horas: Culto de Doutrina.

Quinta-feira, das 20 às 21 horas: Reunião dos Departamentos.

Todo domingo às 17 horas: Escola Bíblica Dominical.

Todo domingo às 19 horas: Culto da Família.

No primeiro domingo do mês, às 7 horas: Culto de Consagração.

Pela manhã do primeiro domingo: Café da Comunhão.

À noite do primeiro domingo: Santa Ceia.`
  },
  {
    arquivo: 'ebd.mp3',
    titulo: 'Escola Bíblica Dominical',
    texto: `Escola Bíblica Dominical — IBMLE.

A Escola Bíblica Dominical acontece todos os domingos às 17 horas, 
antes do Culto da Família. 
É um espaço de estudo, formação e comunhão para todas as idades.

Nossos estudos são baseados nos 19 passos de adoração, 
que guiam os membros e visitantes na experiência espiritual 
durante os cultos e ministérios.

Os 19 passos orientam o Ministério de Louvor, 
servem de guia para todos os ministérios, 
e fundamentam a experiência de adoração na Palavra de Deus.`
  },
  {
    arquivo: 'oracao.mp3',
    titulo: 'Pedido de Oração',
    texto: `Pedido de Oração.

"A oração eficaz do justo pode muito em seus efeitos." 
Tiago 5, versículo 16.

Compartilhe seu pedido de oração conosco. 
Nossa equipe pastoral orará por você.

Preencha o formulário com seu nome e seu pedido. 
Você pode informar um WhatsApp ou telefone para contato, 
e pode optar por manter o pedido anônimo.

Seja qual for a sua necessidade, 
a Igreja Batista Missionária em Lagoa Encantada está aqui para interceder por você.`
  },
  {
    arquivo: 'bemvindo.mp3',
    titulo: 'Boas-vindas',
    texto: `Bem-vindo à Igreja Batista Missionária em Lagoa Encantada. 
A IBMLE é uma comunidade de fé localizada em Lagoa Encantada, no bairro do Ibura, em Recife, Pernambuco. 
Você pode navegar pelas seções deste site para conhecer nossa história, 
nossos ministérios, a programação de cultos, 
enviar um pedido de oração e nos encontrar. 
Que Deus te abençoe!`
  },
];

/* =========================================================
   FUNÇÃO DE GERAÇÃO
   ========================================================= */
async function gerarAudio(secao) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(AUDIO_DIR, secao.arquivo);
    
    // Limpar texto: remover quebras de linha extras para o TTS
    const textoLimpo = secao.texto
      .replace(/\n\n+/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    tts.save(filePath, textoLimpo, (err) => {
      if (err) {
        reject(new Error(`Erro ao gerar ${secao.arquivo}: ${err.message}`));
      } else {
        const stats = fs.statSync(filePath);
        const tamanhoKB = (stats.size / 1024).toFixed(1);
        console.log(`  ✅ ${secao.arquivo} (${tamanhoKB} KB) — ${secao.titulo}`);
        resolve(filePath);
      }
    });
  });
}

/* =========================================================
   EXECUÇÃO PRINCIPAL
   ========================================================= */
async function main() {
  console.log('\n🎙️  IBMLE — Gerador de Áudios TTS');
  console.log('   Idioma: Português (pt-BR via Google TTS)');
  console.log(`   Destino: ${AUDIO_DIR}`);
  console.log('─'.repeat(50));

  let sucesso = 0;
  let falha   = 0;

  for (const secao of SECOES) {
    try {
      await gerarAudio(secao);
      sucesso++;
      // Pequena pausa entre requisições para não sobrecarregar a API
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  ❌ ${secao.arquivo}: ${err.message}`);
      falha++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n📊 Resultado: ${sucesso} gerados, ${falha} com erro`);

  if (sucesso > 0) {
    console.log('\n📁 Arquivos em: public/assets/audio/');
    const arquivos = fs.readdirSync(AUDIO_DIR);
    arquivos.forEach(f => {
      const stats = fs.statSync(path.join(AUDIO_DIR, f));
      console.log(`   ${f} — ${(stats.size / 1024).toFixed(1)} KB`);
    });
  }

  if (falha > 0) {
    console.log('\n⚠️  Alguns arquivos falharam. Verifique a conexão com a internet.');
    console.log('   O site usará a Web Speech API como alternativa automática.');
  }

  console.log('\n✨ Pronto! Execute "npm start" para iniciar o servidor.\n');
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
