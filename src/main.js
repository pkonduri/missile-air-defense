// ============================================
// AEGIS — Application Entry Point
// Wires up UI, simulation, and rendering
// ============================================

import './styles.css';
import { THREATS, DEFENSE_SYSTEMS, DEFENSE_STATUS } from './data.js';
import WorldMap from './worldmap.js';
import Simulation from './simulation.js';
import CreatorModal from './creator.js';

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
    },
});

// -- Scenario wave/end callbacks --
sim.onScenarioWave = () => updateScenarioBar();
sim.onScenarioEnd = () => updateScenarioBar();

// -- Theme Toggle --
const themeToggleEl = $('#themeToggle');

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggleEl.textContent = theme === 'day' ? '☀️' : '🌙';
    themeToggleEl.title = theme === 'day' ? 'Switch to night mode' : 'Switch to day mode';
    localStorage.setItem('aegis-theme', theme);
    // Notify canvas renderers of theme change
    map.setTheme(theme);
}

themeToggleEl.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'day' ? 'night' : 'day');
});

// Restore saved theme
applyTheme(localStorage.getItem('aegis-theme') || 'night');

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

    // Click to view details
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

// -- Log --
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

function updateUI() {
    renderDefenseSystems();
    renderEngagements();
    updateThreatLevel();
    updateTrackedCount();
    updateScenarioBar();
}

// -- Animation Loop --
function gameLoop(timestamp) {
    sim.tick();
    map.render(timestamp);
    requestAnimationFrame(gameLoop);
}

// -- Button handlers --
$('#btnLaunchThreat').addEventListener('click', () => sim.spawnRandomThreat());
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
    }
    if (e.key === 'e') sim.engageAll();
    if (e.key === 's') creator.openScenarioSelector();
    if (e.key === 'r') { sim.reset(); updateUI(); }
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
addLogEntry('system', 'Press SPACE to launch threat, S for scenarios, E to engage all, R to reset');
