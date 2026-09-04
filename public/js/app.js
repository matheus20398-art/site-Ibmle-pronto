/**
 * IBMLE — app.js
 * Igreja Batista Missionária em Lagoa Encantada
 * PHP Dev · 2026
 */

'use strict';

/* =========================================================
   1. CONFIGURAÇÕES GLOBAIS
   ========================================================= */
const CONFIG = {
  API_BASE: '/api',
  TOAST_DURATION: 3500,
  FONT_SCALE_MIN: 0.85,
  FONT_SCALE_MAX: 1.3,
  FONT_SCALE_STEP: 0.1,
  FONT_SCALE_KEY: 'ibmle_font_scale',
  THEME_KEY: 'ibmle_theme',
};

/* Textos para leitura em áudio por seção */
const AUDIO_TEXTS = {
  historia: `Nossa História. A Igreja Batista Missionária em Lagoa Encantada tem suas origens há mais de 30 anos, quando um grupo de crianças começou a se reunir na casa da irmã Célia para louvar e aprender a Palavra de Deus. Em 2010, a igreja já contava com mais de 200 membros e completava 29 anos de existência. Sob a liderança pastoral do Pastor Álvaro Donato de Brito, Pastor Jonathas Brito e Pastora Tânia Brito, a IBMLE continua firme na missão de alcançar vidas para Cristo.`,

  ministerios: `Nossos Ministérios. A IBMLE conta com os seguintes ministérios: Ministério de Louvor Só Pra Te Adorar, liderado pelo Pastor Jonathas, Willams e Rosa. Grupo Clamor do Silêncio, ministério de Libras, liderado por Alexssandra. Grupo de Varões, liderado por Leonardo e Irmão Josias. Grupo de Senhoras, liderado pela Pastora Tânia e Jaciana Passavanti. Ministério Jovens Conexão, liderado por Mikaela e Josias. Ministério de Dança Renascer, liderado por Sther e Andressa. Departamento Infantil, liderado por Suellen Raffaella e Daniela Guerra. Ministério de Missões. Ministério da Família, liderado pelo Diácono Júnior Passavante e Ana Cristina. Ministério de Teatro com Peterson Nelson.`,

  programacao: `Programação de Cultos. Terça-feira às 9 horas: Culto de Jejum e Oração. Terça-feira às 14 horas: Culto Tarde da Vitória. Quarta-feira às 19 horas: Culto de Oração. Quinta-feira das 19 às 20 horas: Culto de Doutrina. Quinta-feira das 20 às 21 horas: Reunião dos Departamentos. Todo domingo às 17 horas: Escola Bíblica Dominical. Todo domingo às 19 horas: Culto da Família. No primeiro domingo do mês às 7 horas: Culto de Consagração. Pela manhã: Café da Comunhão. À noite: Santa Ceia.`,

  ebd: `Escola Bíblica Dominical. A Escola Bíblica Dominical acontece todos os domingos às 17 horas, antes do Culto da Família. É um espaço de estudo, formação e comunhão para todas as idades. Nossos estudos são baseados nos 19 passos de adoração, que guiam os membros e visitantes na experiência espiritual durante os cultos e ministérios.`,

  adoracao: `Exemplos de Adoração e Sonorização de Ministérios. Conheça os 19 passos de adoração da IBMLE: 1. Preparação do Coração. 2. Invocação e Oração Inicial. 3. Louvor Entusiasmado. 4. Ações de Graças. 5. Contemplação da Palavra. 6. Confissão de Pecados. 7. Gratidão e Oferta. 8. Leitura Bíblica Responsiva. 9. Adoração em Espírito e Verdade. 10. Intercessão Geral. 11. Sonorização Ministerial. 12. Pregação da Palavra. 13. Apelo e Renovação de Aliança. 14. Oração pelos Enfermos. 15. Comunhão dos Santos. 16. Testemunhos de Fé. 17. Bênção Apostólica. 18. Envio Missionário. 19. Louvor de Glória.`,

  oracao: `Pedido de Oração. A oração eficaz do justo pode muito em seus efeitos, conforme Tiago 5:16. Compartilhe seu pedido de oração conosco. Nossa equipe pastoral orará por você. Preencha o formulário com seu nome e seu pedido. Você pode optar por manter o pedido anônimo.`,
};

/* =========================================================
   2. ESTADO DA APLICAÇÃO
   ========================================================= */
let currentSpeech = null;
let currentAudioBtn = null;
let fontScale = parseFloat(localStorage.getItem(CONFIG.FONT_SCALE_KEY)) || 1;

/* =========================================================
   3. INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFontScale();
  initNavbar();
  initScrollAnimations();
  initAudioButtons();
  initOracaoForm();
  initToTop();
  initEscala();
  initQRCode();
  initAuthUI();
  initMembrosUI();
  registerServiceWorker();

});


/* =========================================================
   4. TEMA (DARK / LIGHT)
   ========================================================= */
function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  applyTheme(theme);

  const btnTheme = document.getElementById('btnTheme');
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.icon-theme');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem(CONFIG.THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
}

/* =========================================================
   5. ESCALA DE FONTE
   ========================================================= */
function initFontScale() {
  applyFontScale(fontScale);

  document.getElementById('btnFontPlus')?.addEventListener('click', () => {
    fontScale = Math.min(fontScale + CONFIG.FONT_SCALE_STEP, CONFIG.FONT_SCALE_MAX);
    applyFontScale(fontScale);
    showToast('Fonte aumentada');
  });

  document.getElementById('btnFontMinus')?.addEventListener('click', () => {
    fontScale = Math.max(fontScale - CONFIG.FONT_SCALE_STEP, CONFIG.FONT_SCALE_MIN);
    applyFontScale(fontScale);
    showToast('Fonte diminuída');
  });
}

function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem(CONFIG.FONT_SCALE_KEY, scale);
}

/* =========================================================
   6. NAVBAR
   ========================================================= */
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Scroll: adiciona classe scrolled e atualiza link ativo
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
    updateActiveNavLink();
  }, { passive: true });

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Fechar menu ao clicar em link
  navLinks?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navHeight = 80;
  let current = '';

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - navHeight - 10) {
      current = section.id;
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

/* =========================================================
   7. ANIMAÇÕES AO SCROLL (Intersection Observer)
   ========================================================= */
function initScrollAnimations() {
  const items = document.querySelectorAll('.animate-on-scroll');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach(item => observer.observe(item));
}

/* =========================================================
   8. LEITURA POR ÁUDIO (Web Speech API)
   ========================================================= */
function initAudioButtons() {
  const sections = ['historia', 'ministerios', 'programacao', 'adoracao', 'ebd', 'oracao'];

  sections.forEach(sectionId => {
    const btn = document.getElementById(`audio-${sectionId}`);
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (!window.speechSynthesis) {
        showToast('❌ Seu navegador não suporta leitura de áudio.');
        return;
      }

      const text = AUDIO_TEXTS[sectionId];
      if (!text) return;

      // Se é o botão ativo, para a leitura
      if (currentAudioBtn === btn && window.speechSynthesis.speaking) {
        stopAudio();
        return;
      }

      stopAudio();
      playAudio(text, btn);
    });
  });
}

function playAudio(text, btn) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.92;
  utterance.pitch = 1;

  // Tentar selecionar voz em português
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  utterance.onstart = () => {
    btn.classList.add('playing');
    btn.querySelector('.audio-icon').textContent = '⏸';
    btn.querySelector('.audio-label').textContent = 'Pausar';
    currentAudioBtn = btn;
  };

  utterance.onend = utterance.onerror = () => {
    resetAudioBtn(btn);
    currentAudioBtn = null;
    currentSpeech = null;
  };

  currentSpeech = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopAudio() {
  window.speechSynthesis.cancel();
  if (currentAudioBtn) {
    resetAudioBtn(currentAudioBtn);
    currentAudioBtn = null;
  }
  currentSpeech = null;
}

function resetAudioBtn(btn) {
  btn.classList.remove('playing');
  btn.querySelector('.audio-icon').textContent = '🔊';
  const label = btn.querySelector('.audio-label');
  if (label) label.textContent = 'Ouvir';
}

/* =========================================================
   9. FORMULÁRIO — PEDIDO DE ORAÇÃO
   ========================================================= */
function initOracaoForm() {
  const form     = document.getElementById('formOracao');
  const pedido   = document.getElementById('pedido');
  const charCount = document.getElementById('charCount');

  if (!form) return;

  // Contador de caracteres
  pedido?.addEventListener('input', () => {
    const len = pedido.value.length;
    if (charCount) charCount.textContent = `${len}/1000`;
    if (len > 900) charCount.style.color = '#E8B84B';
    else charCount.style.color = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateOracaoForm()) return;

    const btn = document.getElementById('btnEnviarOracao');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const msgEl = document.getElementById('oracaoMsg');

    // Estado de loading
    btn.disabled = true;
    btnText?.classList.add('hidden');
    btnLoading?.classList.remove('hidden');
    msgEl?.classList.add('hidden');

    const nome     = document.getElementById('nome').value.trim();
    const contato  = document.getElementById('contato').value.trim();
    const pedidoVal = pedido.value.trim();
    const anonimo  = document.getElementById('anonimo').checked;

    try {
      const response = await fetch(`${CONFIG.API_BASE}/oracao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, contato, pedido: pedidoVal, anonimo }),
      });

      if (!response.ok) throw new Error('Erro no servidor');

      showFormMsg(msgEl, 'success', '🙏 Pedido enviado! Nossa equipe orará por você.');
      form.reset();
      if (charCount) charCount.textContent = '0/1000';
      showToast('🙏 Pedido de oração enviado!');
    } catch (err) {
      showFormMsg(msgEl, 'error', '❌ Não foi possível enviar. Tente novamente ou entre em contato pelo WhatsApp.');
    } finally {
      btn.disabled = false;
      btnText?.classList.remove('hidden');
      btnLoading?.classList.add('hidden');
    }
  });
}

function validateOracaoForm() {
  let valid = true;

  const nome = document.getElementById('nome');
  const erroNome = document.getElementById('erro-nome');
  const pedido = document.getElementById('pedido');
  const erroPedido = document.getElementById('erro-pedido');

  if (!nome.value.trim()) {
    erroNome.textContent = 'Por favor, informe seu nome.';
    nome.classList.add('error');
    valid = false;
  } else {
    erroNome.textContent = '';
    nome.classList.remove('error');
  }

  if (!pedido.value.trim() || pedido.value.trim().length < 10) {
    erroPedido.textContent = 'Descreva seu pedido (mínimo 10 caracteres).';
    pedido.classList.add('error');
    valid = false;
  } else {
    erroPedido.textContent = '';
    pedido.classList.remove('error');
  }

  return valid;
}

function showFormMsg(el, type, msg) {
  if (!el) return;
  el.textContent = msg;
  el.className = `form-msg ${type}`;
  el.classList.remove('hidden');
}

/* =========================================================
   10. ESCALA DO LOUVOR
   ========================================================= */
async function initEscala() {
  const container = document.getElementById('escalaContainer');
  if (!container) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/escala`);
    if (!res.ok) throw new Error('Sem dados');

    const data = await res.json();
    renderEscala(data, container);
  } catch {
    // Fallback: mostrar escala de exemplo
    renderEscala(getEscalaFallback(), container);
  }
}

function renderEscala(escala, container) {
  if (!escala || !escala.length) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Nenhuma escala disponível no momento.</p>';
    container.className = 'escala-vazia';
    return;
  }

  const tabela = document.createElement('table');
  tabela.className = 'escala-table';
  tabela.setAttribute('role', 'table');
  tabela.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Data</th>
        <th scope="col">Culto</th>
        <th scope="col">Louvor</th>
        <th scope="col">Músicos</th>
      </tr>
    </thead>
    <tbody>
      ${escala.map(item => `
        <tr>
          <td>${formatarData(item.data)}</td>
          <td>${item.culto || '—'}</td>
          <td>${item.louvor || '—'}</td>
          <td>${item.musicos || '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.innerHTML = '';
  container.className = '';
  container.appendChild(tabela);
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  try {
    const d = new Date(dataStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  } catch {
    return dataStr;
  }
}

function getEscalaFallback() {
  const hoje = new Date();
  const proxDomingo = new Date(hoje);
  proxDomingo.setDate(hoje.getDate() + ((0 - hoje.getDay() + 7) % 7 || 7));

  const dom2 = new Date(proxDomingo);
  dom2.setDate(dom2.getDate() + 7);
  const dom3 = new Date(dom2);
  dom3.setDate(dom3.getDate() + 7);

  const fmt = d => d.toISOString().split('T')[0];

  return [
    { data: fmt(proxDomingo), culto: 'Culto da Família', louvor: 'Willams',   musicos: 'Pr. Jonathas · Rosa' },
    { data: fmt(dom2),        culto: 'Culto da Família', louvor: 'Rosa',       musicos: 'Willams · Pr. Jonathas' },
    { data: fmt(dom3),        culto: 'Culto da Família', louvor: 'Pr. Jonathas', musicos: 'Willams · Rosa' },
  ];
}

/* =========================================================
   11. QR CODE
   ========================================================= */
function initQRCode() {
  // O QR Code local (assets/img/qr-louveapp.png) já está renderizado via HTML com link direto.
}

/* =========================================================
   12. BOTÃO VOLTAR AO TOPO
   ========================================================= */
function initToTop() {
  const btn = document.getElementById('btnToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =========================================================
   13. TOAST
   ========================================================= */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, CONFIG.TOAST_DURATION);
}

/* =========================================================
   14. SERVICE WORKER (PWA)
   ========================================================= */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('[SW] Registrado:', reg.scope))
        .catch(err => console.warn('[SW] Falha ao registrar:', err));
    });
  }
}

/* =========================================================
   15. AUTENTICAÇÃO & MODAL (LOGIN / CADASTRO)
   ========================================================= */
function initAuthUI() {
  const btnOpenAuth = document.getElementById('btnOpenAuth');
  const btnCloseAuth = document.getElementById('btnCloseAuth');
  const authModal = document.getElementById('authModal');
  const tabLogin = document.getElementById('tabLogin');
  const tabCadastro = document.getElementById('tabCadastro');
  const formLogin = document.getElementById('formLogin');
  const formCadastro = document.getElementById('formCadastro');
  const userBadge = document.getElementById('userBadge');
  const btnLogout = document.getElementById('btnLogout');

  // Checa se usuário já está logado
  checkUserSession();

  // Abrir / Fechar Modal
  btnOpenAuth?.addEventListener('click', () => {
    authModal.style.display = 'flex';
  });

  btnCloseAuth?.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  // Alternar Abas (Login / Cadastro)
  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabCadastro.classList.remove('active');
    formLogin.style.display = 'block';
    formCadastro.style.display = 'none';
  });

  tabCadastro?.addEventListener('click', () => {
    tabCadastro.classList.add('active');
    tabLogin.classList.remove('active');
    formCadastro.style.display = 'block';
    formLogin.style.display = 'none';
  });

  // Form de Login
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Bem-vindo(a), ${data.usuario.nome}!`);
        authModal.style.display = 'none';
        updateUserUI(data.usuario);
      } else {
        showToast(`⚠️ ${data.error}`);
      }
    } catch (err) {
      showToast('⚠️ Erro ao tentar realizar login.');
    }
  });

  // Form de Cadastro
  formCadastro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cadNome').value;
    const email = document.getElementById('cadEmail').value;
    const senha = document.getElementById('cadSenha').value;

    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast('✅ Conta criada com sucesso! Faça login.');
        tabLogin.click();
      } else {
        showToast(`⚠️ ${data.error}`);
      }
    } catch (err) {
      showToast('⚠️ Erro ao criar conta.');
    }
  });

  // Logout
  btnLogout?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    updateUserUI(null);
    showToast('Sessão encerrada.');
  });
}

async function checkUserSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.logado) {
      updateUserUI(data.usuario);
    } else {
      updateUserUI(null);
    }
  } catch {
    updateUserUI(null);
  }
}

function updateUserUI(usuario) {
  const btnOpenAuth = document.getElementById('btnOpenAuth');
  const userBadge = document.getElementById('userBadge');
  const btnLogout = document.getElementById('btnLogout');

  if (usuario) {
    if (btnOpenAuth) btnOpenAuth.style.display = 'none';
    if (userBadge) {
      userBadge.textContent = `👤 ${usuario.nome}`;
      userBadge.style.display = 'inline-block';
    }
    if (btnLogout) btnLogout.style.display = 'inline-block';
  } else {
    if (btnOpenAuth) btnOpenAuth.style.display = 'inline-block';
    if (userBadge) userBadge.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'none';
  }
}


/* =========================================================
   16. GESTÃO DE MEMBROS (CRUD)
   ========================================================= */
function initMembrosUI() {
  const btnNovoMembro = document.getElementById('btnNovoMembro');
  const btnCloseMembro = document.getElementById('btnCloseMembro');
  const membroModal = document.getElementById('membroModal');
  const formMembro = document.getElementById('formMembro');
  const membroBusca = document.getElementById('membroBusca');

  carregarMembros();


  btnNovoMembro?.addEventListener('click', () => {
    document.getElementById('membroModalTitle').textContent = 'Cadastrar Membro';
    formMembro.reset();
    document.getElementById('membroId').value = '';
    membroModal.style.display = 'flex';
  });

  btnCloseMembro?.addEventListener('click', () => {
    membroModal.style.display = 'none';
  });

  membroBusca?.addEventListener('input', (e) => {
    carregarMembros(e.target.value.trim());
  });

  formMembro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('membroId').value;
    const body = {
      nome: document.getElementById('membroNome').value,
      telefone: document.getElementById('membroTelefone').value,
      email: document.getElementById('membroEmail').value,
      data_nascimento: document.getElementById('membroNascimento').value,
      endereco: document.getElementById('membroEndereco').value,
      ministerio: document.getElementById('membroMinisterio').value,
      data_batismo: document.getElementById('membroBatismo').value,
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/membros/${id}` : '/api/membros';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(id ? 'Membro atualizado!' : 'Membro cadastrado com sucesso!');
        membroModal.style.display = 'none';
        carregarMembros();
      } else {
        showToast(`⚠️ ${data.error}`);
      }
    } catch {
      showToast('⚠️ Erro ao salvar membro.');
    }
  });
}

async function carregarMembros(busca = '') {
  const tbody = document.getElementById('membrosTbody');
  if (!tbody) return;

  try {
    const url = busca ? `/api/membros?busca=${encodeURIComponent(busca)}` : '/api/membros';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Não autorizado');
    
    const membros = await res.json();

    if (!membros || membros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">Nenhum membro encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = membros.map(m => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.8rem 1rem; font-weight: 600;">${m.nome}</td>
        <td style="padding: 0.8rem 1rem;">${m.telefone || '-'}</td>
        <td style="padding: 0.8rem 1rem;">${m.ministerio || '-'}</td>
        <td style="padding: 0.8rem 1rem;">${m.email || '-'}</td>
        <td style="padding: 0.8rem 1rem; text-align: right;">
          <button onclick="deletarMembro(${m.id})" class="btn btn-outline btn-sm" style="color: var(--color-error); border-color: var(--color-error);">Excluir</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 1.5rem; text-align: center; color: var(--color-error);">Erro ao carregar lista de membros.</td></tr>`;
  }
}

async function deletarMembro(id) {
  if (!confirm('Deseja realmente excluir este membro?')) return;
  try {
    const res = await fetch(`/api/membros/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Membro removido.');
      carregarMembros();
    }
  } catch {
    showToast('Erro ao remover membro.');
  }
}


