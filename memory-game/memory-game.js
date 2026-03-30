/**
 * <memory-game> — Composant Web autonome
 * Usage : <memory-game></memory-game>
 *
 * Attributs configurables :
 *   total-pairs   : nombre de paires (défaut: 12)
 *   max-moves     : essais max avant reset (défaut: 15)
 *   secret-emoji  : emoji de la paire secrète (défaut: 🦊)
 *   secret-letter : lettre du code secret (défaut: Z)
 */
class MemoryGame extends HTMLElement {

  // ─── OBSERVED ATTRIBUTES ────────────────────────────────────────────────────
  static get observedAttributes() {
    return ['total-pairs', 'max-moves', 'secret-emoji', 'secret-letter'];
  }

  attributeChangedCallback() {
    if (this._initialized) this._newGame();
  }

  // ─── CONFIG ─────────────────────────────────────────────────────────────────
  get totalPairs()    { return parseInt(this.getAttribute('total-pairs')   || 12); }
  get maxMoves()      { return parseInt(this.getAttribute('max-moves')     || 15); }
  get secretEmoji()   { return this.getAttribute('secret-emoji')           || '🦊'; }
  get secretLetter()  { return (this.getAttribute('secret-letter')         || 'Z').toUpperCase(); }

  static EMOJIS = ['🐬','🌵','🍄','🎸','🚀','🦋','🍕','🎲','🌙','🐙',
                   '🦁','🍉','⚡','🌺','🦄','🐉','🎪','🍦','🎵','🧩'];

  static JOKES = [
    {
      setup: "Pourquoi les plongeurs plongent-ils toujours en arrière ?",
      punchline: "Parce que s'ils plongeaient en avant, ils tomberaient dans le bateau !"
    }
  ];

  // ─── LIFECYCLE ──────────────────────────────────────────────────────────────
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = this._template();
    this._bindRefs();
    this._state = this._freshState();
    this._newGame();
    this._initialized = true;
  }

  disconnectedCallback() {
    clearInterval(this._state?.timerInterval);
  }

  // ─── STATE ──────────────────────────────────────────────────────────────────
  _freshState() {
    return {
      cards: [],
      flipped: [],
      matched: 0,
      moves: 0,
      locked: false,
      secretFound: false,
      startTime: null,
      timerInterval: null,
    };
  }

  // ─── TEMPLATE ───────────────────────────────────────────────────────────────
  _template() {
    return `
<style>
  :host {
    --bg: #2e2e2e;
    --ink: #ffffff;
    --card-back: #fff;
    --card-front: #3a3a3a;
    --card-border: #ffffff;
    --accent: #c0392b;
    --accent2: #e67e22;
    --gold: #d4a843;
    --muted: #888888;
    --radius: 10px;
    --flip-dur: 0.5s;

    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'DM Mono', 'Courier New', monospace;
    background: var(--bg);
    color: var(--ink);
    padding: 2.5rem 1rem 4rem;
    min-height: 100vh;
    box-sizing: border-box;
  }

  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── HEADER ── */
  header { text-align: center; margin-bottom: 0.5rem; }

  .label-top {
    font-size: 0.65rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.4rem;
  }

  h1 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2.8rem, 7vw, 5rem);
    letter-spacing: -2px;
    line-height: 1;
    color: #fff;
  }

  h1 .accent { color: var(--accent); font-style: italic; }

  .tagline {
    font-size: 0.7rem;
    letter-spacing: 3px;
    color: var(--muted);
    margin-top: 0.5rem;
    text-transform: uppercase;
  }

  hr.deco {
    width: 60px;
    border: none;
    border-top: 2px solid #444;
    margin: 1.2rem auto;
  }

  /* ── STATS ── */
  .stats {
    display: flex;
    gap: 2.5rem;
    margin-bottom: 1.8rem;
    align-items: center;
  }

  .stat { display: flex; flex-direction: column; align-items: center; }

  .stat-value {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 2rem;
    color: #fff;
    line-height: 1;
    transition: transform 0.15s, color 0.2s;
  }

  .stat-value.bump  { transform: scale(1.35); color: var(--accent); }
  .stat-value.danger { color: var(--accent) !important; }

  .stat-label {
    font-size: 0.6rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-top: 0.2rem;
  }

  .stat-sep { color: #444; font-size: 1.5rem; }

  /* ── SECRET ZONE ── */
  .secret-zone {
    background: #111;
    color: #fff;
    border-radius: 10px;
    padding: 0.9rem 2rem;
    margin-bottom: 1.8rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    min-width: 260px;
    transition: outline 0.2s;
  }

  .secret-zone::before {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(45deg, transparent, transparent 6px,
      rgba(255,255,255,0.02) 6px, rgba(255,255,255,0.02) 12px);
  }

  .secret-label {
    font-size: 0.6rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 0.5rem;
  }

  .secret-letter-display {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 3rem;
    color: #fff;
    min-width: 50px;
    display: inline-block;
    text-align: center;
  }

  .secret-letter-display.hidden-state { color: rgba(255,255,255,0.15); }

  @keyframes revealLetter {
    0%   { transform: scale(0.3) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.3) rotate(5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; color: #fff; }
  }

  .secret-letter-display.revealed {
    animation: revealLetter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .secret-hint {
    font-size: 0.6rem;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.3);
    margin-top: 0.3rem;
  }

  /* ── GRID ── */
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
    max-width: 460px;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  /* ── CARD ── */
  .card {
    aspect-ratio: 1;
    cursor: pointer;
    perspective: 700px;
  }

  .card-inner {
    width: 100%; height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform var(--flip-dur) cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: var(--radius);
  }

  .card.flipped .card-inner,
  .card.matched .card-inner { transform: rotateY(180deg); }

  .card-face {
    position: absolute; inset: 0;
    border-radius: var(--radius);
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .card-back-face {
    background: var(--card-back);
    border: 2px solid var(--card-border);
    position: relative;
    overflow: hidden;
  }

  .card-back-face::before {
    content: '';
    position: absolute; inset: 4px;
    border: 1px solid rgba(0,0,0,0.15);
    border-radius: 6px;
  }

  .card-back-face::after {
    content: '✦';
    font-size: 1.1rem;
    color: rgba(0,0,0,0.25);
  }

  .card-front-face {
    background: var(--card-front);
    border: 2px solid var(--card-border);
    transform: rotateY(180deg);
    font-size: clamp(1.8rem, 4.5vw, 2.4rem);
    flex-direction: column;
  }

  .card.matched .card-front-face {
    border-color: var(--gold);
    box-shadow: 0 0 14px rgba(212,168,67,0.25);
  }

  .card.secret-card.matched .card-front-face {
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(192,57,43,0.3);
  }

  .card:not(.flipped):not(.matched):hover .card-inner {
    transform: rotateY(6deg) translateY(-3px);
  }

  @keyframes matchPop {
    0%   { transform: rotateY(180deg) scale(1); }
    35%  { transform: rotateY(180deg) scale(1.12); }
    65%  { transform: rotateY(180deg) scale(0.96); }
    100% { transform: rotateY(180deg) scale(1); }
  }

  .card.matched .card-inner {
    animation: matchPop 0.4s ease 0.1s both;
  }

  /* ── BUTTONS ── */
  .btn {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 8px;
    padding: 0.65rem 1.8rem;
    cursor: pointer;
    transition: all 0.15s;
    border: 2px solid #fff;
    background: transparent;
    color: #fff;
  }

  .btn:hover { background: #fff; color: #000; }
  .btn:active { transform: scale(0.97); }

  .btn-accent {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .btn-accent:hover { background: #a93226; border-color: #a93226; }

  /* ── OVERLAYS ── */
  .overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 100;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    backdrop-filter: blur(4px);
  }

  .overlay.show { display: flex; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: none; }
  }

  .win-box {
    text-align: center;
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    max-width: 400px;
    padding: 1rem;
  }

  .win-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2.5rem, 7vw, 4rem);
    letter-spacing: -1px;
    color: #fff;
  }

  .win-title .it { font-style: italic; color: var(--accent); }

  .win-sub {
    font-size: 0.7rem;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 0.5rem;
  }

  hr.deco2 { width: 40px; border: none; border-top: 2px solid #333; margin: 1.2rem auto; }

  .code-input-zone { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }

  .code-label {
    font-size: 0.65rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .code-input {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 2.5rem;
    width: 80px;
    text-align: center;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.3rem 0.5rem;
    outline: none;
    letter-spacing: 4px;
    text-transform: uppercase;
    transition: background 0.2s;
  }

  .code-input::placeholder { color: rgba(255,255,255,0.2); }
  .code-input.wrong-flash  { background: #7b241c; }

  .code-feedback {
    font-size: 0.75rem;
    letter-spacing: 2px;
    color: var(--muted);
    min-height: 1.2rem;
    transition: color 0.2s;
  }

  .code-feedback.wrong { color: var(--accent); }
  .code-feedback.right { color: #27ae60; }

  /* Fail overlay */
  .fail-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.96);
    z-index: 150;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    padding: 2rem;
    backdrop-filter: blur(6px);
  }

  .fail-overlay.show { display: flex; }

  @keyframes shakeIn {
    0%   { transform: scale(0.8) rotate(-3deg); opacity: 0; }
    50%  { transform: scale(1.05) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .fail-box { animation: shakeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  .fail-emoji { font-size: 3.5rem; display: block; margin-bottom: 0.5rem; }

  .fail-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2rem, 6vw, 3.5rem);
    color: var(--accent);
    font-style: italic;
    letter-spacing: -1px;
  }

  .fail-sub {
    font-size: 0.7rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-top: 0.4rem;
  }

  /* Secret overlay */
  .secret-overlay {
    display: none;
    position: fixed; inset: 0;
    background: var(--accent);
    z-index: 200;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #fff;
    text-align: center;
    padding: 2rem;
  }

  .secret-overlay.show { display: flex; }

  @keyframes secretIn {
    from { opacity: 0; transform: scale(0.7) rotate(-5deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  .secret-message-box { animation: secretIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  .secret-badge {
    font-size: 0.65rem;
    letter-spacing: 5px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 1rem;
  }

  .secret-joke {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(1.6rem, 5vw, 2.8rem);
    line-height: 1.25;
    max-width: 500px;
    font-style: italic;
  }

  .secret-punchline {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(1rem, 3vw, 1.6rem);
    opacity: 0.85;
    margin-top: 0.5rem;
  }

  @keyframes spin360 {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .secret-emoji {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
    animation: spin360 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
</style>

<!-- ── HTML ── -->
<header>
  <p class="label-top">✦ Jeu de concentration ✦</p>
  <h1>MÉ<span class="accent">MOIRE</span></h1>
  <p class="tagline">Un secret se cache ici</p>
</header>

<hr class="deco">

<div class="stats">
  <div class="stat">
    <span class="stat-value" id="moves">0</span>
    <span class="stat-label">Essais</span>
  </div>
  <span class="stat-sep">·</span>
  <div class="stat">
    <span class="stat-value" id="pairs">0</span>
    <span class="stat-label">Paires</span>
  </div>
  <span class="stat-sep">·</span>
  <div class="stat">
    <span class="stat-value" id="timer">0s</span>
    <span class="stat-label">Temps</span>
  </div>
</div>

<div class="secret-zone" id="secretZone">
  <div class="secret-label">▲ Code Secret ▲</div>
  <span class="secret-letter-display hidden-state" id="secretDisplay">?</span>
  <div class="secret-hint" id="secretHint">Trouvez la paire mystère…</div>
</div>

<div class="grid" id="grid"></div>

<button class="btn" id="restartBtn">↺ Recommencer</button>

<!-- Win overlay -->
<div class="overlay" id="winOverlay">
  <div class="win-box">
    <div class="win-title">Bien <span class="it">joué !</span></div>
    <div class="win-sub" id="winStats"></div>
    <hr class="deco2">
    <div class="code-input-zone">
      <div class="code-label">Entrez le code secret</div>
      <input class="code-input" id="codeInput" maxlength="1" placeholder="?" autocomplete="off" spellcheck="false">
      <div class="code-feedback" id="codeFeedback">Une seule lettre…</div>
      <button class="btn btn-accent" id="validateBtn">Valider</button>
    </div>
    <br>
    <button class="btn" id="replayBtn">Rejouer</button>
  </div>
</div>

<!-- Fail overlay -->
<div class="fail-overlay" id="failOverlay">
  <div class="fail-box">
    <span class="fail-emoji">💥</span>
    <div class="fail-title">Trop d'essais !</div>
    <div class="fail-sub">Plus de ${this.maxMoves} essais — on repart de zéro</div>
  </div>
  <br>
  <button class="btn btn-accent" id="failRestartBtn">Recommencer</button>
</div>

<!-- Secret overlay -->
<div class="secret-overlay" id="secretOverlay">
  <div class="secret-message-box">
    <span class="secret-emoji">🔓</span>
    <div class="secret-badge">✦ Code correct ✦</div>
    <div class="secret-joke" id="jokeSetup"></div>
    <div class="secret-punchline" id="jokePunchline"></div>
  </div>
  <br>
  <button class="btn" style="border-color:#fff;color:#fff;" id="secretReplayBtn">Rejouer</button>
</div>
    `;
  }

  // ─── BIND REFS ──────────────────────────────────────────────────────────────
  _bindRefs() {
    const $ = id => this.shadowRoot.getElementById(id);

    this._refs = {
      grid:           $('grid'),
      moves:          $('moves'),
      pairs:          $('pairs'),
      timer:          $('timer'),
      secretZone:     $('secretZone'),
      secretDisplay:  $('secretDisplay'),
      secretHint:     $('secretHint'),
      winOverlay:     $('winOverlay'),
      winStats:       $('winStats'),
      codeInput:      $('codeInput'),
      codeFeedback:   $('codeFeedback'),
      failOverlay:    $('failOverlay'),
      secretOverlay:  $('secretOverlay'),
      jokeSetup:      $('jokeSetup'),
      jokePunchline:  $('jokePunchline'),
    };

    $('restartBtn').addEventListener('click', () => this._newGame());
    $('validateBtn').addEventListener('click', () => this._checkCode());
    $('replayBtn').addEventListener('click', () => {
      this._refs.winOverlay.classList.remove('show');
      this._newGame();
    });
    $('failRestartBtn').addEventListener('click', () => {
      this._refs.failOverlay.classList.remove('show');
      this._newGame();
    });
    $('secretReplayBtn').addEventListener('click', () => {
      this._refs.secretOverlay.classList.remove('show');
      this._refs.winOverlay.classList.remove('show');
      this._newGame();
    });
    this._refs.codeInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._checkCode();
    });
  }

  // ─── NEW GAME ───────────────────────────────────────────────────────────────
  _newGame() {
    clearInterval(this._state?.timerInterval);
    this._state = this._freshState();

    const r = this._refs;
    r.moves.textContent = '0';
    r.moves.classList.remove('danger', 'bump');
    r.pairs.textContent = '0';
    r.timer.textContent = '0s';
    r.secretDisplay.textContent = '?';
    r.secretDisplay.className = 'secret-letter-display hidden-state';
    r.secretHint.textContent = 'Trouvez la paire mystère…';
    r.secretZone.style.outline = '';
    r.winOverlay.classList.remove('show');
    r.failOverlay.classList.remove('show');
    r.secretOverlay.classList.remove('show');
    r.codeInput.value = '';
    r.codeFeedback.textContent = 'Une seule lettre…';
    r.codeFeedback.className = 'code-feedback';

    this._buildDeck();
    this._renderGrid();
  }

  // ─── DECK ───────────────────────────────────────────────────────────────────
  _buildDeck() {
    const pool = MemoryGame.EMOJIS.filter(e => e !== this.secretEmoji);
    const chosen = this._shuffle(pool).slice(0, this.totalPairs - 1);
    chosen.push(this.secretEmoji);
    this._state.cards = this._shuffle([...chosen, ...chosen]);
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  _renderGrid() {
    const grid = this._refs.grid;
    grid.innerHTML = '';

    this._state.cards.forEach((emoji, i) => {
      const card = document.createElement('div');
      card.className = 'card' + (emoji === this.secretEmoji ? ' secret-card' : '');
      card.dataset.index = i;
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-back-face"></div>
          <div class="card-face card-front-face">${emoji}</div>
        </div>`;
      card.addEventListener('click', () => this._flipCard(card, i));
      grid.appendChild(card);
    });
  }

  // ─── FLIP ───────────────────────────────────────────────────────────────────
  _flipCard(el, idx) {
    const s = this._state;
    if (s.locked) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    // Start timer
    if (!s.startTime) {
      s.startTime = Date.now();
      s.timerInterval = setInterval(() => {
        const secs = Math.floor((Date.now() - s.startTime) / 1000);
        this._refs.timer.textContent = secs + 's';
      }, 500);
    }

    el.classList.add('flipped');
    s.flipped.push({ el, idx });

    if (s.flipped.length === 2) {
      s.locked = true;
      s.moves++;
      this._bump('moves');
      this._refs.moves.textContent = s.moves;

      // Warning color
      if (s.moves >= this.maxMoves - 2) this._refs.moves.classList.add('danger');

      // Too many moves
      if (s.moves > this.maxMoves) {
        setTimeout(() => this._refs.failOverlay.classList.add('show'), 700);
        return;
      }

      const [a, b] = s.flipped;
      if (s.cards[a.idx] === s.cards[b.idx]) {
        setTimeout(() => {
          a.el.classList.add('matched');
          b.el.classList.add('matched');
          a.el.classList.remove('flipped');
          b.el.classList.remove('flipped');
          s.matched++;
          this._bump('pairs');
          this._refs.pairs.textContent = s.matched;

          if (s.cards[a.idx] === this.secretEmoji && !s.secretFound) {
            s.secretFound = true;
            this._revealLetter();
          }

          s.flipped = [];
          s.locked = false;
          if (s.matched === this.totalPairs) setTimeout(() => this._winGame(), 500);
        }, 400);
      } else {
        setTimeout(() => {
          a.el.classList.remove('flipped');
          b.el.classList.remove('flipped');
          s.flipped = [];
          s.locked = false;
        }, 900);
      }
    }
  }

  // ─── REVEAL LETTER ──────────────────────────────────────────────────────────
  _revealLetter() {
    const disp = this._refs.secretDisplay;
    disp.textContent = this.secretLetter;
    disp.className = 'secret-letter-display revealed';
    this._refs.secretHint.textContent = '✦ Notez bien cette lettre ! ✦';

    const zone = this._refs.secretZone;
    zone.style.outline = '3px solid #c0392b';
    setTimeout(() => { zone.style.outline = ''; }, 1500);
  }

  // ─── WIN ────────────────────────────────────────────────────────────────────
  _winGame() {
    clearInterval(this._state.timerInterval);
    const secs = Math.floor((Date.now() - this._state.startTime) / 1000);
    this._refs.winStats.textContent =
      `${this._state.moves} essais · ${secs}s · ${this.totalPairs} paires`;

    if (!this._state.secretFound)
      this._refs.secretHint.textContent = '(paire mystère non trouvée…)';

    this._refs.winOverlay.classList.add('show');
    setTimeout(() => this._refs.codeInput.focus(), 300);
  }

  // ─── CHECK CODE ─────────────────────────────────────────────────────────────
  _checkCode() {
    const input    = this._refs.codeInput.value.trim().toUpperCase();
    const feedback = this._refs.codeFeedback;

    if (!input) {
      feedback.textContent = "Entre une lettre d'abord !";
      feedback.className = 'code-feedback wrong';
      return;
    }

    if (input === this.secretLetter) {
      feedback.textContent = '✦ Correct ! ✦';
      feedback.className = 'code-feedback right';
      setTimeout(() => this._showSecret(), 600);
    } else {
      feedback.textContent = 'Mauvaise lettre… cherche encore !';
      feedback.className = 'code-feedback wrong';
      this._refs.codeInput.value = '';
      this._refs.codeInput.classList.add('wrong-flash');
      setTimeout(() => this._refs.codeInput.classList.remove('wrong-flash'), 400);
    }
  }

  // ─── SHOW SECRET ────────────────────────────────────────────────────────────
  _showSecret() {
    const joke = MemoryGame.JOKES[Math.floor(Math.random() * MemoryGame.JOKES.length)];
    this._refs.jokeSetup.textContent    = joke.setup;
    this._refs.jokePunchline.textContent = joke.punchline;
    this._refs.secretOverlay.classList.add('show');
  }

  // ─── UTILS ──────────────────────────────────────────────────────────────────
  _shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  _bump(id) {
    const el = this._refs[id];
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    el.addEventListener('transitionend', () => el.classList.remove('bump'), { once: true });
  }
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
customElements.define('memory-game', MemoryGame);
