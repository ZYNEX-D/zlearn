import {experiments,simulate} from './model.js';
import {LabScene} from './scene.js';
import {physicsIllustration} from './physics-scene.js';
import {duration,sampleSeries,csvFor,plotSvg} from './analysis.js';
import {$,$$,esc,downloadFile} from '../framework/dom.js';
import {loadJson,saveJson} from '../framework/storage.js';
import {createStore} from '../framework/store.js';

// Application Reactive Store
const store = createStore({
  currentId: 'pendulum',
  subject: 'Physics',
  params: {},
  progress: 0,
  running: false,
  activeTab: 'explore',
  freeMode: false,
  speed: 1,
  repeat: false,
  favorites: loadJson('chemia-favorites', []),
  baselines: loadJson('chemia-baselines', {}),
  notes: loadJson('chemia-notes', []),
  completed: loadJson('chemia-completed', [])
});

let lab = null;
let lastFrame = 0;
let history = [];

function persist() {
  saveJson('chemia-notes', store.get('notes'));
  saveJson('chemia-completed', store.get('completed'));
  saveJson('chemia-favorites', store.get('favorites'));
  saveJson('chemia-baselines', store.get('baselines'));
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3500);
}

function getCurrentExperiment() {
  const id = store.get('currentId');
  return experiments.find(e => e.id === id) || experiments.find(e => e.id === 'pendulum');
}

function illustration(e) {
  if (e.subject === 'Physics') return physicsIllustration(e.id);
  const colors = { titration: '#cc9bb5', gas: '#acbe8a', electrolysis: '#91bdc0', precipitation: '#d8d5b8', heating: '#d4a074', diffusion: '#a995c1' };
  const c = colors[e.id];
  const flask = '<path d="M58 16h16v23l24 43q3 8-7 8H42q-9 0-5-8l21-43z" fill="#f8faee" fill-opacity=".6" stroke="#79927d" stroke-width="1.5"/><path d="M49 61h35l12 22q2 5-6 5H43q-6 0-3-5z" fill="' + c + '" fill-opacity=".7"/><path d="M62 23v19L44 78" fill="none" stroke="white" stroke-width="3" opacity=".7"/><path d="M55 15h22" stroke="#68846d" stroke-width="2"/><path d="M78 72h8m-12 7h16" stroke="#7e9580"/>';
  const beaker = '<path d="M39 26h56l-4 8v51q0 5-5 5H46q-5 0-5-5V31z" fill="#f9fbee" fill-opacity=".6" stroke="#79927d" stroke-width="1.5"/><path d="M43 53h46v31q0 4-4 4H47q-4 0-4-4z" fill="' + c + '" fill-opacity=".7"/><path d="M46 36v44" stroke="white" stroke-width="3" opacity=".7"/><path d="M79 41h10m-10 13h10m-10 13h10m-10 13h10" stroke="#79927d"/>';
  const extra = e.id === 'titration' ? '<path d="M28 8v83H18h24M28 20h39M67 3v40" stroke="#718873" fill="none" stroke-width="2"/><path d="M63 3h8v36h-8z" fill="#d4e3cb" stroke="#718873"/><path d="M61 42h12" stroke="#397363" stroke-width="2"/>'
    : e.id === 'gas' ? '<path d="M67 13V7h42v51" stroke="#8b9b7a" fill="none" stroke-width="3"/><circle cx="74" cy="64" r="3" fill="#f4f8de"/><circle cx="64" cy="77" r="2" fill="#f4f8de"/>'
    : e.id === 'electrolysis' ? '<path d="M56 8v61m22-61v61" stroke="#65827a" stroke-width="3"/><path d="M53 9h6v44h-6zm22 0h6v25h-6z" fill="#c4ded2" stroke="#6b8b78"/>'
    : e.id === 'heating' ? '<rect x="34" y="90" width="63" height="9" rx="3" fill="#49725f"/><path d="M71 5v62" stroke="#bd7957" stroke-width="3"/>'
    : e.id === 'diffusion' ? '<g fill="#785495"><circle cx="57" cy="61" r="2"/><circle cx="69" cy="70" r="2"/><circle cx="78" cy="58" r="2"/><circle cx="62" cy="79" r="2"/><circle cx="82" cy="80" r="2"/></g>'
    : '<path d="M48 81l4-3 4 4 5-3 4 3 4-2 6 3 4-3 5 2" stroke="#fdfcf2" stroke-width="4"/>';
  return '<svg viewBox="0 0 134 108" aria-hidden="true"><ellipse cx="68" cy="96" rx="38" ry="5" fill="#344f3810"/>' + (['titration', 'gas'].includes(e.id) ? flask : beaker) + extra + '</svg>';
}

function card(e) {
  const current = getCurrentExperiment();
  const completed = store.get('completed');
  return `<button class="lesson-card ${e.id === current.id ? 'selected' : ''}" data-experiment="${e.id}" aria-label="Open ${e.name}">
    <div class="card-art" style="background:${e.color}22">
      <span class="card-number">${e.tag}</span>
      ${illustration(e)}
      <span class="card-check">${completed.includes(e.id) ? '✓' : e.id === current.id ? '↗' : ''}</span>
    </div>
    <div class="card-body">
      <h3>${e.name}</h3>
      <p>${e.category}<span>${e.time}</span></p>
    </div>
  </button>`;
}

function updateCards() {
  const subject = store.get('subject');
  const completed = store.get('completed');
  const favorites = store.get('favorites');
  const current = getCurrentExperiment();

  $('#lesson-cards').innerHTML = experiments.filter(e => e.subject === subject).map(card).join('');
  $('#progress-label').textContent = `${completed.filter(id => experiments.some(e => e.id === id)).length} / ${experiments.length} explored`;
  $('#note-count').textContent = store.get('notes').length || '';

  $$('.subject-switch [data-subject]').forEach(b => b.setAttribute('aria-pressed', b.dataset.subject === subject));
  $('#favorite').setAttribute('aria-pressed', favorites.includes(current.id));
  $('#favorite').textContent = favorites.includes(current.id) ? '★ Saved experiment' : '☆ Save experiment';
}

function select(id) {
  const exp = experiments.find(e => e.id === id) || experiments.find(e => e.id === 'pendulum');
  const initialParams = Object.fromEntries(exp.controls.map(c => [c.id, c.value]));
  
  store.update({
    currentId: exp.id,
    subject: exp.subject,
    params: initialParams,
    progress: 0,
    running: false,
    activeTab: 'explore'
  });
  history = [];

  const freeMode = store.get('freeMode');
  $('#experiment-title').innerHTML = (freeMode ? 'Your own discovery' : exp.title) + '<span>.</span>';
  $('#experiment-subtitle').textContent = freeMode ? 'Choose a model, change the variables, and investigate.' : exp.subtitle;
  $('#category').textContent = exp.category.toUpperCase();
  $('#subject-label').textContent = exp.subject.toUpperCase();
  document.body.dataset.subject = exp.subject;
  $('#scene-number').textContent = 'EXPERIMENT ' + exp.tag + ' / ' + experiments.length;
  $('#scene-topic').textContent = exp.name.toUpperCase();
  $('#scene-caption').textContent = exp.caption;
  $('#object-info').hidden = true;

  if (lab) lab.build(exp.id);
  renderPanel();
  updateCards();
  updateSimulation();

  if (location.hash !== '#' + exp.id) {
    window.history.replaceState(null, '', '#' + exp.id);
  }
}

function setParameter(c, value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return;
  const params = { ...store.get('params') };
  params[c.id] = c.options ? v : Math.max(c.min, Math.min(c.max, Math.round((v - c.min) / c.step) * c.step + c.min));

  store.update({
    params,
    progress: 0,
    running: false
  });
  history = [];

  if ($('#' + c.id)) $('#' + c.id).value = params[c.id];
  if ($('#number-' + c.id)) $('#number-' + c.id).value = params[c.id].toFixed(c.digits);
  updateSimulation();
}

function renderPanel() {
  const activeTab = store.get('activeTab');
  const exp = getCurrentExperiment();
  const params = store.get('params');
  const freeMode = store.get('freeMode');
  const baselines = store.get('baselines');

  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === activeTab));

  if (activeTab === 'explore') {
    $('#panel-content').innerHTML = `
      <h2>${exp.name}</h2>
      <p class="description">${exp.description}</p>
      <div class="equation">${exp.equation}</div>
      ${freeMode ? `
        <div class="control">
          <label for="reaction">Experiment model</label>
          <select id="reaction">
            ${experiments.map(x => `<option value="${x.id}" ${x.id === exp.id ? 'selected' : ''}>${x.subject} · ${x.name}</option>`).join('')}
          </select>
          <div class="sandbox-tools">
            ${exp.subject === 'Chemistry' ? '<button id="add-vessel">＋ Add vessel</button><button id="remove-vessel">− Last vessel</button>' : ''}
            <button id="exit-free">Exit free lab</button>
          </div>
        </div>` : ''}
      ${exp.presets ? `
        <div class="presets" role="group" aria-label="Experiment presets">
          ${exp.presets.map(([label], i) => `<button data-preset="${i}">${label}</button>`).join('')}
        </div>` : ''}
      ${exp.controls.map(c => c.options ? `
        <div class="control">
          <label for="${c.id}">${c.label}</label>
          <select id="${c.id}" aria-label="${c.label}">
            ${c.options.map(([label, v]) => `<option value="${v}" ${params[c.id] === v ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>` : `
        <div class="control">
          <label for="${c.id}">${c.label}
            <span class="number-unit">
              <input id="number-${c.id}" type="number" min="${c.min}" max="${c.max}" step="${c.step}" value="${params[c.id]?.toFixed(c.digits) ?? c.value}" aria-label="${c.label} value">
              <span>${c.unit}</span>
            </span>
          </label>
          <input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${params[c.id] ?? c.value}" aria-label="${c.label}">
        </div>`).join('')}
      <div class="metrics">
        <div class="metric"><label>${exp.metricA}</label><strong id="metric-a">0</strong><small>${exp.unitA}</small></div>
        <div class="metric"><label>${exp.metricB}</label><strong id="metric-b">0</strong><small>${exp.unitB}</small></div>
      </div>
      <div class="chart-toolbar">
        <span>LIVE MEASUREMENT</span>
        <button id="pin-baseline" class="text-btn">${baselines[exp.id] ? 'Replace baseline' : 'Pin baseline'} ◇</button>
      </div>
      <div id="mini-chart"></div>
      <p class="hint" id="result-hint"></p>`;

    for (let c of exp.controls) {
      $('#' + c.id)?.addEventListener(c.options ? 'change' : 'input', event => setParameter(c, event.target.value));
      if (!c.options) {
        $('#number-' + c.id)?.addEventListener('change', event => setParameter(c, event.target.value));
      }
    }

    $$('[data-preset]').forEach(b => b.onclick = () => {
      const presetIdx = Number(b.dataset.preset);
      const chosen = exp.presets[presetIdx];
      const nextParams = { ...store.get('params'), ...chosen[1] };
      store.update({ params: nextParams, progress: 0, running: false });
      renderPanel();
      toast(chosen[0] + ' preset loaded.');
    });

    $('#pin-baseline').onclick = () => {
      const currBaselines = { ...store.get('baselines'), [exp.id]: { ...store.get('params') } };
      store.set('baselines', currBaselines);
      persist();
      renderPanel();
      toast('Baseline pinned. Change a variable and open Analyze data to compare.');
    };

    if (freeMode) {
      $('#reaction')?.addEventListener('change', event => select(event.target.value));
      if ($('#add-vessel')) {
        $('#add-vessel').onclick = () => toast(lab?.addVessel() ? 'Decorative vessel added.' : 'The workbench holds up to four extra vessels.');
        $('#remove-vessel').onclick = () => {
          let g = lab?.extra.pop();
          if (g) {
            lab.world.remove(g);
            lab.requestRender();
            toast('Last extra vessel removed.');
          } else {
            toast('There are no extra vessels.');
          }
        };
      }
      $('#exit-free').onclick = () => {
        store.set('freeMode', false);
        select(exp.id);
      };
    }
  } else if (activeTab === 'guide') {
    $('#panel-content').innerHTML = `
      <h2>Look a little closer.</h2>
      <p class="description">A guided investigation into ${exp.category.toLowerCase()}.</p>
      <div class="equation">${exp.equation}</div>
      <ol class="guide-steps">${exp.steps.map(v => '<li>' + v + '</li>').join('')}</ol>
      <p class="science-note"><strong>Model assumptions</strong><br>${exp.science}</p>
      ${exp.source ? `<a class="reference-link" href="${exp.source}" target="_blank" rel="noopener">Read the OpenStax reference ↗</a>` : ''}`;
  } else {
    $('#panel-content').innerHTML = `
      <h2>Put it to the test.</h2>
      <p class="description">Run the experiment, then check your understanding.</p>
      <p style="font-size:13px;line-height:1.7">${exp.question}</p>
      ${exp.answers.map((a, i) => `<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65 + i)}. &nbsp; ${a}</button>`).join('')}
      <p class="feedback" id="quiz-feedback" aria-live="polite"></p>`;
    $$('[data-answer]').forEach(b => b.onclick = () => {
      const correct = Number(b.dataset.answer) === exp.answer;
      b.classList.add(correct ? 'correct' : 'wrong');
      $('#quiz-feedback').textContent = (correct ? 'Exactly. ' : 'Try again. ') + exp.explanation;
      if (correct) complete();
    });
  }
  updateSimulation();
}

function complete() {
  const exp = getCurrentExperiment();
  const completed = store.get('completed');
  if (!completed.includes(exp.id)) {
    store.set('completed', [...completed, exp.id]);
    persist();
    updateCards();
  }
}

function display(v) {
  return v === null ? 'TIR' : Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2);
}

function updateSimulation() {
  const exp = getCurrentExperiment();
  const params = store.get('params');
  const progress = store.get('progress');
  const running = store.get('running');
  const baselines = store.get('baselines');

  const result = simulate(exp.id, params, progress);
  if (lab) lab.update(params, progress, result, running);

  if ($('#metric-a')) {
    $('#metric-a').textContent = display(result.a);
    $('#metric-a').nextElementSibling.textContent = result.a === null ? '' : exp.unitA;
    $('#metric-b').textContent = display(result.b);
    $('#result-hint').textContent = result.hint;
    $('#mini-chart').innerHTML = plotSvg(exp, params, { progress, baseline: baselines[exp.id] });
  }

  const maxP = exp.id === 'projectile' ? 1.85 : 1.0;
  $('#run').innerHTML = running ? '<span>Ⅱ</span> Pause experiment' : progress >= maxP ? '<span>↻</span> Run again' : '<span>▶</span> ' + (progress > 0 ? 'Resume experiment' : 'Run experiment');
  $('#run-status').textContent = running ? 'Observing · ' + Math.min(100, Math.round(progress * 100)) + '%' : progress >= maxP ? 'Experiment complete' : progress > 0 ? 'Paused · ' + Math.min(100, Math.round(progress * 100)) + '%' : 'Ready when you are';
  $('#timeline').value = Math.round(Math.min(1, progress) * 1000);
  $('#time-display').textContent = (duration(exp, params) * Math.min(1, progress)).toFixed(2) + ' / ' + duration(exp, params).toFixed(2) + ' s';
  return result;
}

function simulationLoop(ts) {
  requestAnimationFrame(simulationLoop);
  const dt = Math.min(0.1, (ts - lastFrame) / 1000) || 0;
  lastFrame = ts;

  const running = store.get('running');
  let progress = store.get('progress');
  const speed = store.get('speed');
  const repeat = store.get('repeat');

  if (running) {
    const exp = getCurrentExperiment();
    const params = store.get('params');
    const dur = duration(exp, params);
    const dtSim = dt * speed;
    let maxProgress = 1.0;
    let delta = 0;

    if (exp.id === 'projectile') {
      maxProgress = 1.85;
      const flight = dur > 0 ? dur : 2;
      if (progress < 1.0) {
        delta = dtSim / flight;
      } else {
        delta = dtSim / (flight * 1.15);
      }
    } else {
      delta = dur > 0 ? dtSim / dur : dtSim / 20;
    }

    progress = Math.min(maxProgress, progress + delta);
    store.set('progress', progress);
    if (progress >= maxProgress) {
      complete();
      if (repeat) {
        store.set('progress', 0);
      } else {
        store.set('running', false);
        toast('Experiment complete. Record what you discovered.');
      }
    }
    updateSimulation();
  }
}

// Dialogs and Overlays
function openDialog(view) {
  const names = { library: 'Find your next discovery', apparatus: 'Tools of the trade', notebook: 'Your lab notebook', help: 'A laboratory for curious minds' };
  $('#dialog-title').textContent = names[view] || names.library;
  $('#dialog-kicker').textContent = view === 'notebook' ? 'OBSERVE · QUESTION · REMEMBER' : view === 'apparatus' ? 'GET TO KNOW YOUR APPARATUS' : 'CHEMIA / THE INTERACTIVE LAB';
  $$('.nav').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  if (view === 'library') {
    $('#dialog-body').innerHTML = `
      <div class="library-tools">
        <input id="search" class="input" type="search" placeholder="Search 16 experiments…" aria-label="Search experiments">
        <select id="subject-filter" aria-label="Filter by subject">
          <option value="all">All subjects</option>
          <option>Physics</option>
          <option>Chemistry</option>
        </select>
        <select id="filter" aria-label="Filter experiments">
          <option value="all">All topics</option>
          ${[...new Set(experiments.map(e => e.category))].map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="library-flags">
        <label><input id="favorites-only" type="checkbox"> Saved experiments</label>
        <label><input id="unexplored-only" type="checkbox"> Not yet explored</label>
        <span id="result-count"></span>
      </div>
      <div id="filtered-cards" class="dialog-cards"></div>
      <p class="science-note">10 physics + 6 chemistry experiments. Every experiment includes interactive apparatus, adjustable variables, measurements, a guide, and a challenge.</p>`;

    const filter = () => {
      const q = $('#search').value.toLowerCase();
      const cat = $('#filter').value;
      const sub = $('#subject-filter').value;
      const favorites = store.get('favorites');
      const completed = store.get('completed');

      const found = experiments.filter(e =>
        (e.name + ' ' + e.category + ' ' + e.description).toLowerCase().includes(q) &&
        (cat === 'all' || e.category === cat) &&
        (sub === 'all' || e.subject === sub) &&
        (!$('#favorites-only').checked || favorites.includes(e.id)) &&
        (!$('#unexplored-only').checked || !completed.includes(e.id))
      );
      $('#filtered-cards').innerHTML = found.length ? found.map(card).join('') : '<p class="empty">No experiments match. Try clearing the filters.</p>';
      $('#result-count').textContent = found.length + ' experiments';
    };

    $('#search').oninput = filter;
    for (let id of ['filter', 'subject-filter', 'favorites-only', 'unexplored-only']) {
      $('#' + id).onchange = filter;
    }
    filter();
  }

  if (view === 'apparatus') {
    $('#dialog-body').innerHTML = '<div class="apparatus-grid">' + [
      ['◉', 'Pendulum', 'A fixed pivot, a light string, and a bob reveal oscillations driven by gravity.'],
      ['∿', 'Spring & cart', 'A spring stores elastic energy. A frictionless cart makes its exchange with kinetic energy visible.'],
      ['±', 'Resistors & supply', 'Compare series and parallel arrangements of ideal ohmic resistors.'],
      ['⌁', 'Lens & ray source', 'Trace principal rays through a converging lens or across a boundary between optical media.'],
      ['↗', 'Ramp & collision carts', 'Investigate forces, friction, momentum, and kinetic energy.'],
      ['≈', 'Water tank', 'Measure displaced fluid and the buoyant force on a supported solid.'],
      ['⚗', 'Conical flask', 'Its narrow neck and broad base allow swirling while reducing splashes. Used for titration and gas reactions.'],
      ['⌑', 'Beaker', 'A general vessel for mixing and heating. Its markings give approximate volumes.'],
      ['↧', 'Burette', 'Delivers carefully measured volumes of liquid. Read the bottom of the meniscus at eye level.'],
      ['⊥', 'Retort stand', 'Supports apparatus with clamps to keep an experiment stable.'],
      ['♧', 'Thermometer', 'Measures temperature and helps reveal heating curves and phase changes.'],
      ['±', 'Power supply', 'Provides controlled current for electrochemical reactions.']
    ].map(([i, n, d]) => `<article class="apparatus-card"><span class="apparatus-icon">${i}</span><h3>${n}</h3><p>${d}</p></article>`).join('') + '</div><p class="science-note">Click labels or apparatus in the 3D scene to inspect their role in the current experiment.</p>';
  }

  if (view === 'notebook') renderNotebook();

  if (view === 'help') {
    $('#dialog-body').innerHTML = `
      <div class="help-copy">
        <h3>Learn by changing one thing.</h3>
        <p>Choose an experiment, adjust a variable, and press Run. A full animation takes 20 seconds at 1× playback speed. The timeline shows the model’s simulated time. Scrub to any instant, step forward or backward, choose 0.25×–2× speed, or repeat. Pause at any point to inspect the measurements. Record a result to keep your observations.</p>
        <h3>Make the scene your own.</h3>
        <p>Drag to orbit. Scroll or use + / − to zoom. Use the arrow buttons to rotate and ⌖ to reset the camera. Aa toggles labels. Select a label or an apparatus to learn about it.</p>
        <h3>Free lab</h3>
        <p>Switch between all 16 supported experiment models. Chemistry experiments also allow up to four decorative vessels. This release does not simulate arbitrary chemical combinations or transfers between extra vessels.</p>
        <h3>Compare and export.</h3>
        <p>Pin a baseline, change a variable, and open Analyze data. Choose a time graph or a parameter sweep. Dashed gold is the baseline; solid teal is the current setup. CSV exports contain 101 calculated samples, not physical sensor measurements. A blank refraction cell means total internal reflection.</p>
        <h3>Your work stays in this browser.</h3>
        <p>Notebook entries and explored lessons are saved locally on this device. Export your notebook for a portable copy. There are no accounts, classroom management, or cloud sync in this version.</p>
        <h3>Models, with clear boundaries.</h3>
        <p>Calculations use simplified educational models. Each experiment’s Science tab states its assumptions. Particle sizes, reaction speed, apparatus scale, and liquid motion are illustrative. This is a learning simulation, not laboratory operating guidance.</p>
        <h3>Built for curiosity.</h3>
        <p>An original platform inspired by NOBOOK’s chemistry library and Learn Arduino’s interactive 3D teaching approach. All apparatus models in this site are generated from original geometry.</p>
      </div>`;
  }

  if (!$('#drawer').open) $('#drawer').showModal();
}

function renderNotebook() {
  const notes = store.get('notes');
  $('#dialog-body').innerHTML = `
    <div class="notes-form">
      <label for="note-text" class="eyebrow">WHAT DID YOU NOTICE?</label>
      <textarea id="note-text" placeholder="Describe your observation or prediction…"></textarea>
      <div style="display:flex;justify-content:space-between;gap:12px">
        <button id="save-note" class="primary-btn">Save observation with current result</button>
        <button id="export-notes" class="outline-btn">Export notebook ↓</button>
      </div>
    </div>
    <div id="notes-list">
      ${notes.length ? [...notes].reverse().map(n => `
        <article class="note">
          <h3>${esc(n.title)}</h3>
          <small>${esc(n.date)}</small>
          <p>${esc(n.result)}</p>
          ${n.text ? '<p>' + esc(n.text) + '</p>' : ''}
          <footer>
            <span>${esc(n.settings)}</span>
            ${n.experimentId ? `<button class="text-btn" data-restore-note="${esc(n.id)}">Restore setup ↗</button>` : ''}
            <button class="text-btn" data-delete-note="${esc(n.id)}">Remove</button>
          </footer>
        </article>`).join('') : '<div class="empty">Your next discovery belongs here.<br><br>Run an experiment and record the result, or write an observation above.</div>'}
    </div>
    <p class="science-note">Saved on this browser only. Export to keep a backup.</p>`;

  $('#save-note').onclick = () => {
    saveNote($('#note-text').value);
    renderNotebook();
  };
  $('#export-notes').onclick = exportNotes;

  $$('[data-restore-note]').forEach(b => b.onclick = () => {
    const n = notes.find(item => item.id === b.dataset.restoreNote);
    if (!n) return;
    select(n.experimentId);
    store.update({
      params: { ...store.get('params'), ...n.parameters },
      progress: n.progress || 0
    });
    renderPanel();
    $('#drawer').close();
    toast('Recorded setup restored.');
  });

  $$('[data-delete-note]').forEach(b => b.onclick = () => {
    const removed = notes.find(item => item.id === b.dataset.deleteNote);
    const nextNotes = notes.filter(item => item.id !== b.dataset.deleteNote);
    store.set('notes', nextNotes);
    persist();
    updateCards();
    renderNotebook();
    toast('Entry removed.');
    if (removed) {
      const undo = document.createElement('button');
      undo.textContent = ' Undo';
      undo.style.color = '#e5efc1';
      undo.onclick = () => {
        store.set('notes', [...store.get('notes'), removed]);
        persist();
        updateCards();
        renderNotebook();
        toast('Entry restored.');
      };
      $('#toast').append(undo);
    }
  });
}

function saveNote(text = '') {
  const exp = getCurrentExperiment();
  const params = store.get('params');
  const progress = store.get('progress');
  const r = simulate(exp.id, params, progress);
  const n = {
    id: crypto.randomUUID(),
    experimentId: exp.id,
    parameters: { ...params },
    progress,
    title: exp.name,
    date: new Date().toLocaleString(),
    text: text.trim(),
    result: `${exp.metricA}: ${display(r.a)} ${r.a === null ? '' : exp.unitA} · ${exp.metricB}: ${display(r.b)} ${exp.unitB} · Progress: ${Math.round(progress * 100)}%`,
    settings: exp.controls.map(c => `${c.label}: ${c.options ? c.options.find(o => o[1] === params[c.id])?.[0] : params[c.id]} ${c.unit || ''}`).join(' · ')
  };
  store.set('notes', [...store.get('notes'), n]);
  persist();
  updateCards();
  toast('Observation added to your notebook.');
}

function exportNotes() {
  const notes = store.get('notes');
  const md = '# Chemia — Lab notebook\n\n' + notes.map(n => `## ${n.title}\n${n.date}\n\n${n.result}\n\n${n.settings}\n\n${n.text}\n`).join('\n---\n\n');
  downloadFile('chemia-notebook.md', md, 'text/markdown');
  toast('Notebook exported as Markdown.');
}

function openAnalysis() {
  store.set('running', false);
  updateSimulation();
  const exp = getCurrentExperiment();
  const params = store.get('params');
  const baselines = store.get('baselines');

  $('#dialog-title').textContent = 'Measure. Compare. Understand.';
  $('#dialog-kicker').textContent = exp.subject.toUpperCase() + ' / ' + exp.name.toUpperCase();
  $('#dialog-body').innerHTML = `
    <div class="analysis-controls">
      <label>Horizontal axis
        <select id="plot-axis">
          <option value="time">Simulated time</option>
          ${exp.controls.filter(c => !c.options).map(c => `<option value="${c.id}">Sweep: ${c.label}</option>`).join('')}
        </select>
      </label>
      <label>Measurement
        <select id="plot-metric">
          <option value="a">${exp.metricA} (${exp.unitA})</option>
          <option value="b">${exp.metricB} (${exp.unitB})</option>
        </select>
      </label>
    </div>
    <div class="graph-legend">
      <span><i></i> Current setup</span>
      <span><i class="baseline-dot"></i> Pinned baseline</span>
      <button id="pin-analysis" class="text-btn">Pin current setup</button>
      <button id="clear-baseline" class="text-btn">Clear baseline</button>
    </div>
    <div id="large-chart"></div>
    <div id="baseline-summary" class="baseline-summary"></div>
    <div class="data-actions">
      <button id="export-csv" class="primary-btn">↓ Export CSV</button>
      <button id="export-chart" class="outline-btn">↓ Export graph</button>
      <button id="record-data" class="outline-btn">＋ Record result</button>
    </div>
    <p class="science-note">Time graphs show a full calculated run. Sweeps change one variable while holding the other controls fixed and show the end-of-run result. Time comparisons stop each setup at its own end time. Blank cells indicate total internal reflection. Curves are model predictions, not collected sensor data.</p>
    <details><summary>View sampled values</summary><div id="data-table" class="data-table"></div></details>`;

  const refresh = () => {
    const axis = $('#plot-axis').value;
    const metric = $('#plot-metric').value;
    const baseline = baselines[exp.id];

    $('#large-chart').innerHTML = plotSvg(exp, params, { axis, metric, baseline });
    $('#baseline-summary').textContent = baseline ? 'Baseline: ' + exp.controls.map(c => c.label + ' ' + (c.options ? c.options.find(o => o[1] === baseline[c.id])?.[0] : baseline[c.id]) + ' ' + (c.unit || '')).join(' · ') : 'No baseline pinned. Pin this setup, change a control, and return here to compare.';

    const rows = sampleSeries(exp, params, axis, 10);
    $('#data-table').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>${axis === 'time' ? 'Time (s)' : exp.controls.find(c => c.id === axis).label}</th>
            <th>${exp.metricA} (${exp.unitA})</th>
            <th>${exp.metricB} (${exp.unitB})</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.x.toFixed(2)}</td><td>${display(r.a)}</td><td>${display(r.b)}</td></tr>`).join('')}
        </tbody>
      </table>`;
  };

  $('#plot-axis').onchange = refresh;
  $('#plot-metric').onchange = refresh;
  $('#pin-analysis').onclick = () => {
    baselines[exp.id] = { ...params };
    store.set('baselines', baselines);
    persist();
    refresh();
  };
  $('#clear-baseline').onclick = () => {
    delete baselines[exp.id];
    store.set('baselines', baselines);
    persist();
    refresh();
  };
  $('#export-csv').onclick = () => {
    downloadFile(exp.id + '-data.csv', csvFor(exp, params, $('#plot-axis').value, baselines[exp.id]), 'text/csv');
    toast('101 model samples exported.');
  };
  $('#export-chart').onclick = () => {
    let svg = $('#large-chart').innerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    downloadFile(exp.id + '-graph.svg', svg, 'image/svg+xml');
  };
  $('#record-data').onclick = () => saveNote();

  refresh();
  if (!$('#drawer').open) $('#drawer').showModal();
}

// Event Wireup
export function initLab() {
  $('#run').onclick = () => {
    let p = store.get('progress');
    const maxP = getCurrentExperiment().id === 'projectile' ? 1.85 : 1.0;
    if (p >= maxP) store.set('progress', 0);
    store.set('running', !store.get('running'));
    updateSimulation();
  };

  $('#reset').onclick = () => {
    store.update({ progress: 0, running: false });
    history = [];
    updateSimulation();
    toast('Experiment reset. Your variable settings are kept.');
  };

  $$('[data-tab]').forEach(b => b.onclick = () => {
    store.set('activeTab', b.dataset.tab);
    renderPanel();
  });

  $('#record').onclick = () => saveNote();
  $('#open-notes').onclick = () => openDialog('notebook');
  $('#free-lab').onclick = () => { location.href = 'builder.html'; };
  $('#close-dialog').onclick = () => $('#drawer').close();

  $('#drawer').addEventListener('close', () => {
    $$('.nav').forEach(b => b.classList.toggle('active', b.dataset.view === 'lab'));
  });

  $('#drawer').addEventListener('click', e => {
    if (e.target === $('#drawer')) {
      const r = $('#drawer').getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        $('#drawer').close();
      }
    }
  });

  document.addEventListener('click', e => {
    let targetCard = e.target.closest('[data-experiment]');
    if (targetCard) {
      store.set('freeMode', false);
      select(targetCard.dataset.experiment);
      $('#drawer').close();
      return;
    }
    let nav = e.target.closest('[data-view]');
    if (nav) {
      if (nav.dataset.view === 'lab') {
        $('#drawer').close();
        $$('.nav').forEach(b => b.classList.toggle('active', b === nav));
      } else {
        openDialog(nav.dataset.view);
      }
    }
  });

  $('#rotate-left').onclick = () => { if (lab) { lab.theta -= 0.25; lab.requestRender(); } };
  $('#rotate-right').onclick = () => { if (lab) { lab.theta += 0.25; lab.requestRender(); } };
  $('#zoom-in').onclick = () => { if (lab) { lab.radius = Math.max(7, lab.radius - 1); lab.requestRender(); } };
  $('#zoom-out').onclick = () => { if (lab) { lab.radius = Math.min(19, lab.radius + 1); lab.requestRender(); } };
  $('#reset-camera').onclick = () => { lab?.resetCamera(); };
  $('#toggle-labels').onclick = () => {
    let on = $('#toggle-labels').getAttribute('aria-pressed') !== 'true';
    $('#toggle-labels').setAttribute('aria-pressed', on);
    $('#labels').hidden = !on;
  };

  window.addEventListener('hashchange', () => select(location.hash.slice(1)));

  $('#analysis-open').onclick = openAnalysis;

  $('#favorite').onclick = () => {
    const cur = getCurrentExperiment().id;
    let favs = store.get('favorites');
    favs = favs.includes(cur) ? favs.filter(id => id !== cur) : [...favs, cur];
    store.set('favorites', favs);
    persist();
    updateCards();
  };

  $$('.subject-switch [data-subject]').forEach(b => b.onclick = () => {
    store.set('freeMode', false);
    const firstExp = experiments.find(e => e.subject === b.dataset.subject);
    if (firstExp) select(firstExp.id);
  });

  $('#timeline').oninput = e => {
    store.update({ progress: Number(e.target.value) / 1000, running: false });
    updateSimulation();
  };

  $('#step-back').onclick = () => {
    store.update({ progress: Math.max(0, store.get('progress') - 0.01), running: false });
    updateSimulation();
  };
  $('#step-forward').onclick = () => {
    const maxP = getCurrentExperiment().id === 'projectile' ? 1.85 : 1.0;
    store.update({ progress: Math.min(maxP, store.get('progress') + 0.01), running: false });
    updateSimulation();
  };

  $('#speed').onchange = e => store.set('speed', Number(e.target.value));
  $('#repeat').onclick = () => {
    const nextRepeat = !store.get('repeat');
    store.set('repeat', nextRepeat);
    $('#repeat').setAttribute('aria-pressed', nextRepeat);
  };

  $('#capture').onclick = () => {
    if (!lab) {
      toast('3D capture is unavailable on this device.');
      return;
    }
    lab.renderer.render(lab.scene, lab.camera);
    $('#lab-canvas').toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getCurrentExperiment().id + '-scene.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  const fullButton = document.createElement('button');
  fullButton.id = 'fullscreen';
  fullButton.setAttribute('aria-label', 'Fullscreen lab');
  fullButton.textContent = '⛶';
  fullButton.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('.scene-panel').requestFullscreen();
    } catch {
      toast('Fullscreen is not supported in this browser.');
    }
  };
  $('.camera-controls').append(fullButton);

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !$('#drawer').open && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      $('#run').click();
    }
  });

  // Init 3D Lab Scene
  try {
    lab = new LabScene($('#lab-canvas'), l => {
      $('#object-info').hidden = false;
      $('#object-info').innerHTML = `<strong>${esc(l.name)}</strong><br>${esc(l.description)}<button aria-label="Close apparatus description">×</button>`;
      $('#object-info button').onclick = () => $('#object-info').hidden = true;
    });
  } catch (error) {
    console.error('3D initialization failed', error);
    $('#scene-fallback').hidden = false;
    $('#lab-canvas').hidden = true;
  }

  select(location.hash.slice(1) || 'pendulum');
  requestAnimationFrame(simulationLoop);
}

// Auto-run when DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLab);
  } else {
    initLab();
  }
}
