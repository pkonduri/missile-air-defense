// ============================================
// AEGIS — Application Entry Point
// Wires up UI, simulation, and rendering
// ============================================

import './styles.css';
import { THREATS, DEFENSE_SYSTEMS, DEFENSE_STATUS } from './data.js';
import WorldMap from './worldmap.js';
import Simulation from './simulation.js';
import CreatorModal from './creator.js';
import audio from './audio.js';
import { showAAR } from './aar.js';
import { showToast } from './toast.js';

// -- DOM refs --
const $ = (sel) => document.querySelector(sel);
const radarCanvas = $('#radarCanvas');
const defensesEl = $('#defenseSystems');
const catalogEl = $('#missileCatalog');
const logEl = $('#eventLog');
const engagementsEl = $('#activeEngagements');
const trackedCountEl = $('#trackedCount');
const threatLevelEl = $('#threatLevel');
const clockEl = $('#clock');
const scenarioBarEl = $('#scenarioBar');
const statsHudEl = $('#statsHud');
const speedControlEl = $('#speedControl');

// -- Initialize --
const map = new WorldMap(radarCanvas);
const sim = new Simulation(map, addLogEntry, updateUI);
const creator = new CreatorModal({
    onThreatAdded: () => {
        renderCatalog();
        addLogEntry('system', 'New threat profile added to catalog');
    },
    onDefenseAdded: () => {
        sim.reloadDefenses();
        renderDefenseSystems();
        addLogEntry('system', 'New defense system deployed');
    },
    onLaunchThreat: (threat) => {
        sim.spawnThreat(threat);
    },
    onRunScenario: (scenarioId) => {
        sim.runScenario(scenarioId);
        audio.playScenarioStart();
        showToast('system', 'Scenario launched', 4000);
    },
});

// -- Scenario wave/end callbacks --
sim.onScenarioWave = (waveIndex, wave) => {
    updateScenarioBar();
    audio.playWaveIncoming();
    showToast('wave', wave.label, 3000);
};
sim.onScenarioEnd = () => updateScenarioBar();

// -- AAR callback: when all threats resolved after scenario --
sim.onScenarioComplete = async (report) => {
    const action = await showAAR(report);
    if (action === 'retry') {
        sim.runScenario(report.scenario.id);
        audio.playScenarioStart();
    }
};

// -- Theme Toggle --
const themeToggleEl = $('#themeToggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggleEl.textContent = theme === 'day' ? '☀️' : '🌙';
    themeToggleEl.title = theme === 'day' ? 'Switch to night mode' : 'Switch to day mode';
    localStorage.setItem('aegis-theme', theme);
    map.setTheme(theme);
}

themeToggleEl.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'day' ? 'night' : 'day');
});

applyTheme(localStorage.getItem('aegis-theme') || 'night');

// -- Sound Toggle --
const soundToggleEl = $('#soundToggle');

function applySoundState(enabled) {
    audio.enabled = enabled;
    soundToggleEl.textContent = enabled ? '🔊' : '🔇';
    soundToggleEl.title = enabled ? 'Mute sound effects (M)' : 'Enable sound effects (M)';
    soundToggleEl.classList.toggle('muted', !enabled);
    localStorage.setItem('aegis-sound', enabled ? 'on' : 'off');
}

soundToggleEl.addEventListener('click', () => {
    applySoundState(!audio.enabled);
});

applySoundState(localStorage.getItem('aegis-sound') !== 'off');

// -- Speed Control --
speedControlEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.speed-btn');
    if (!btn) return;
    const speed = parseInt(btn.dataset.speed);

    if (speed === 0) {
        sim.paused = !sim.paused;
        btn.classList.toggle('active', sim.paused);
        if (sim.paused) showToast('system', 'Simulation PAUSED', 2000);
    } else {
        sim.paused = false;
        sim.speedMultiplier = speed;
        speedControlEl.querySelectorAll('.speed-btn').forEach(b => {
            const s = parseInt(b.dataset.speed);
            if (s === 0) b.classList.remove('active');
            else b.classList.toggle('active', s === speed);
        });
    }
});

// -- Clock --
function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toUTCString().split(' ')[4] + ' UTC';
}
setInterval(updateClock, 1000);
updateClock();

// -- Render Defense Systems Panel --
function renderDefenseSystems() {
    defensesEl.innerHTML = sim.defenses.map(d => {
        const ammoPercent = (d.roundsRemaining / d.roundsTotal) * 100;
        const statusClass = d.status;
        const engageTypes = d.canEngage.map(t => t.toUpperCase().slice(0, 4)).join(' · ');

        return `
            <div class="defense-system-card ${d.status === DEFENSE_STATUS.ENGAGING ? 'active' : ''}" data-id="${d.id}">
                <div class="ds-header">
                    <span class="ds-name">${d.name}</span>
                    <span class="ds-status ${statusClass}">${d.status.toUpperCase()}</span>
                </div>
                <div class="ds-type">${d.type} — ${engageTypes}</div>
                <div class="ds-stats">
                    <div class="ds-stat">RNG <span>${d.range}km</span></div>
                    <div class="ds-stat">ALT <span>${d.maxAlt}km</span></div>
                    <div class="ds-stat">Pk <span>${(d.pkill * 100).toFixed(0)}%</span></div>
                    <div class="ds-stat">RDS <span>${d.roundsRemaining}/${d.roundsTotal}</span></div>
                </div>
                <div class="ds-range-bar">
                    <div class="ds-range-fill" style="width: ${ammoPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');

    defensesEl.querySelectorAll('.defense-system-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const def = DEFENSE_SYSTEMS.find(d => d.id === card.dataset.id);
            if (def) creator.openDefenseDetail(def);
        });
    });
}

// -- Render Missile Catalog --
function renderCatalog() {
    catalogEl.innerHTML = THREATS.map(t => `
        <div class="missile-card ${t.type}" data-id="${t.id}">
            <div class="mc-header">
                <span class="mc-name">${t.name}</span>
                <span class="mc-threat ${t.threat}">${t.threat.toUpperCase()}</span>
            </div>
            <div class="mc-type">${t.description}</div>
            <div class="mc-specs">
                <div class="mc-spec">SPD <span>${t.speed}m/s</span></div>
                <div class="mc-spec">RNG <span>${t.maxRange}km</span></div>
                <div class="mc-spec">ALT <span>${t.altitude}km</span></div>
                <div class="mc-spec">RCS <span>${t.rcs}m²</span></div>
            </div>
        </div>
    `).join('');

    catalogEl.querySelectorAll('.missile-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const template = THREATS.find(t => t.id === card.dataset.id);
            if (template) creator.openThreatDetail(template);
        });
    });
}

// -- Log with Audio + Toasts --
let toastThrottle = 0;

function addLogEntry(type, message) {
    const time = new Date().toUTCString().split(' ')[4];
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${time}] ${message}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;

    while (logEl.children.length > 100) {
        logEl.removeChild(logEl.firstChild);
    }

    // Play sound effects + toasts based on event type
    const now = Date.now();
    switch (type) {
        case 'detect':
            audio.playAlert();
            if (now - toastThrottle > 800) {
                showToast('detect', message, 3000);
                toastThrottle = now;
            }
            break;
        case 'engage':
            audio.playEngage();
            break;
        case 'intercept':
            audio.playIntercept();
            showToast('intercept', message, 3000);
            break;
        case 'miss':
            if (message.includes('IMPACT')) {
                audio.playImpact();
                showToast('critical', message, 5000);
            }
            break;
    }
}

// -- Active Engagements --
function renderEngagements() {
    const active = sim.engagements.filter(e => e.result === null || e.result === 'intercepted');

    if (active.length === 0) {
        engagementsEl.innerHTML = '<div class="no-engagements">NO ACTIVE ENGAGEMENTS</div>';
        return;
    }

    engagementsEl.innerHTML = active.map(e => `
        <div class="engagement-card ${e.result === 'intercepted' ? 'intercepted' : ''}">
            <div class="eng-header">
                <span class="eng-threat">${e.threatId} ${e.threatName}</span>
                <span class="eng-defender">${e.defenseName}</span>
            </div>
            <div class="eng-progress">
                <div class="eng-progress-fill ${e.result === 'intercepted' ? 'complete' : ''}"
                     style="width: ${Math.round(e.progress * 100)}%"></div>
            </div>
        </div>
    `).join('');
}

// -- Threat Level --
function updateThreatLevel() {
    const activeThreats = sim.getActiveThreats().length;
    let level, className;

    if (activeThreats === 0) {
        level = 'LOW';
        className = '';
    } else if (activeThreats <= 3) {
        level = 'ELEVATED';
        className = 'elevated';
    } else {
        level = 'CRITICAL';
        className = 'critical';
    }

    threatLevelEl.innerHTML = `THREAT LEVEL: <strong>${level}</strong>`;
    threatLevelEl.className = `threat-level ${className}`;
}

function updateTrackedCount() {
    const count = sim.getActiveThreats().length;
    trackedCountEl.textContent = `${count} TRACKED`;
}

function updateScenarioBar() {
    const progress = sim.getScenarioProgress();
    if (!progress) {
        scenarioBarEl.classList.remove('active');
        scenarioBarEl.innerHTML = '';
        return;
    }

    scenarioBarEl.classList.add('active');

    const waveDots = progress.scenario.waves.map((w, i) => {
        let cls = 'scenario-bar-wave';
        if (i < progress.waveIndex) cls += ' launched';
        else if (i === progress.waveIndex) cls += ' current';
        return `<div class="${cls}" title="${w.label}"></div>`;
    }).join('');

    scenarioBarEl.innerHTML = `
        <span class="scenario-bar-name">${progress.scenario.name}</span>
        <div class="scenario-bar-waves">${waveDots}</div>
        <span class="scenario-bar-info">W${progress.waveIndex}/${progress.totalWaves} · ${progress.launched}/${progress.total} LAUNCHED</span>
    `;
}

// -- Stats HUD --
function updateStatsHud() {
    const s = sim.stats;
    const rate = s.detected > 0 ? Math.round((s.intercepted / s.detected) * 100) : 0;
    const rateColor = rate >= 80 ? 'var(--accent-green)' : rate >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';

    // Only show when there's activity
    if (s.detected === 0) {
        statsHudEl.innerHTML = '';
        return;
    }

    statsHudEl.innerHTML = `
        <div class="stats-hud-item">
            <span class="stats-hud-value" style="color: var(--accent-cyan)">${s.detected}</span>
            <span class="stats-hud-label">DETECTED</span>
        </div>
        <div class="stats-hud-item">
            <span class="stats-hud-value" style="color: var(--accent-green)">${s.intercepted}</span>
            <span class="stats-hud-label">KILLS</span>
        </div>
        <div class="stats-hud-item">
            <span class="stats-hud-value" style="color: var(--accent-red)">${s.missed}</span>
            <span class="stats-hud-label">IMPACTS</span>
        </div>
        <div class="stats-hud-item">
            <span class="stats-hud-value" style="color: ${rateColor}">${rate}%</span>
            <span class="stats-hud-label">RATE</span>
        </div>
    `;
}

function updateUI() {
    renderDefenseSystems();
    renderEngagements();
    updateThreatLevel();
    updateTrackedCount();
    updateScenarioBar();
    updateStatsHud();
}

// -- Animation Loop --
function gameLoop(timestamp) {
    sim.tick();
    map.render(timestamp);
    requestAnimationFrame(gameLoop);
}

// -- Button handlers --
$('#btnLaunchThreat').addEventListener('click', () => {
    sim.spawnRandomThreat();
    audio.playLaunch();
});
$('#btnEngageAll').addEventListener('click', () => sim.engageAll());
$('#btnReset').addEventListener('click', () => { sim.reset(); updateUI(); });
$('#btnScenarios').addEventListener('click', () => creator.openScenarioSelector());
$('#btnAddThreat').addEventListener('click', () => creator.openThreatForm());
$('#btnAddDefense').addEventListener('click', () => creator.openDefenseForm());

// -- Keyboard shortcuts --
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key === ' ' || e.key === 't') {
        e.preventDefault();
        sim.spawnRandomThreat();
        audio.playLaunch();
    }
    if (e.key === 'e') sim.engageAll();
    if (e.key === 's') creator.openScenarioSelector();
    if (e.key === 'r') { sim.reset(); updateUI(); }
    if (e.key === 'p') {
        sim.paused = !sim.paused;
        const pauseBtn = speedControlEl.querySelector('[data-speed="0"]');
        pauseBtn.classList.toggle('active', sim.paused);
        if (sim.paused) showToast('system', 'PAUSED', 2000);
    }
    if (e.key === 'm') {
        applySoundState(!audio.enabled);
    }
    // Speed shortcuts: 1-4
    if (e.key >= '1' && e.key <= '4') {
        const speed = parseInt(e.key);
        sim.paused = false;
        sim.speedMultiplier = speed;
        speedControlEl.querySelectorAll('.speed-btn').forEach(b => {
            const s = parseInt(b.dataset.speed);
            if (s === 0) b.classList.remove('active');
            else b.classList.toggle('active', s === speed);
        });
    }
});

// -- Auto-engage when threats enter defense range --
setInterval(() => {
    const unengaged = sim.threats.filter(t => !t.engaged && !t.destroyed);
    for (const threat of unengaged) {
        if (sim.isInDefenseRange(threat)) {
            sim.engageThreat(threat);
        }
    }
}, 1500);

// -- Boot --
renderDefenseSystems();
renderCatalog();
updateUI();
requestAnimationFrame(gameLoop);

addLogEntry('system', 'AEGIS Air Defense Command — Online');
addLogEntry('system', `${DEFENSE_SYSTEMS.length} defense batteries loaded`);
addLogEntry('system', `${THREATS.length} threat profiles cataloged`);
addLogEntry('system', 'T=threat  S=scenarios  E=engage  R=reset  P=pause  M=mute  1-4=speed');
