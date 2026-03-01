// ============================================
// AEGIS — Simulation Engine
// Geo-based threat spawning, tracking, interception
// ============================================

import {
    MISSILE_TYPES,
    DEFENSE_STATUS,
    THREATS,
    DEFENSE_SYSTEMS,
} from './data.js';

import { LAUNCH_SITES, DEFENSE_LOCATIONS, TARGET_CITIES } from './geodata.js';
import { SCENARIOS } from './scenarios.js';

// 1 sim-tick ≈ 16.7ms real time, but we compress time so missiles
// cross a theater in ~15-30 seconds of screen time
const SIM_TIME_SCALE = 250;
const DEG_PER_METER = 1 / 111000;

export default class Simulation {
    constructor(radar, onLog, onUpdate) {
        this.radar = radar;
        this.log = onLog;
        this.onUpdate = onUpdate;
        this.threats = [];
        this.engagements = [];
        this.defenses = structuredClone(DEFENSE_SYSTEMS);
        this.nextThreatId = 1;
        this.nextEngId = 1;
        this.stats = { detected: 0, intercepted: 0, missed: 0, engaged: 0, roundsFired: 0 };
        this.scenarioStartTime = null;

        // Scenario state
        this.activeScenario = null;
        this.scenarioWaveIndex = 0;
        this.scenarioTimers = [];
        this.scenarioStats = null;
        this.onScenarioWave = null;
        this.onScenarioEnd = null;
        this.onScenarioComplete = null; // Called when all threats resolved

        // Speed control
        this.speedMultiplier = 1;
        this.paused = false;
    }

    // -- Geo helpers --

    _bearing(lat1, lon1, lat2, lon2) {
        const toRad = Math.PI / 180;
        const φ1 = lat1 * toRad;
        const φ2 = lat2 * toRad;
        const Δλ = (lon2 - lon1) * toRad;
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        return Math.atan2(y, x);
    }

    _haversineKm(lat1, lon1, lat2, lon2) {
        const toRad = Math.PI / 180;
        const dLat = (lat2 - lat1) * toRad;
        const dLon = (lon2 - lon1) * toRad;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // -- Threat spawning --

    spawnRandomThreat() {
        const template = THREATS[Math.floor(Math.random() * THREATS.length)];
        return this.spawnThreat(template);
    }

    spawnThreat(template) {
        const id = `T${String(this.nextThreatId++).padStart(3, '0')}`;

        const site = this._pickLaunchSite(template);
        const target = this._pickTarget(site, template);

        const bearing = this._bearing(site.lat, site.lon, target.lat, target.lon);
        const degsPerTick = this._getDegsPerTick(template);

        // Project velocity into lat/lon deltas
        const dlat = degsPerTick * Math.cos(bearing);
        const dlon = degsPerTick * Math.sin(bearing) / Math.cos(site.lat * Math.PI / 180);

        const colorMap = {
            [MISSILE_TYPES.BALLISTIC]: '#ff5252',
            [MISSILE_TYPES.CRUISE]: '#ffab40',
            [MISSILE_TYPES.HYPERSONIC]: '#e040fb',
            [MISSILE_TYPES.DRONE]: '#00e5ff',
        };

        const threat = {
            id,
            templateId: template.id,
            name: template.name,
            type: template.type,
            threat: template.threat,
            speed: template.speed,
            lat: site.lat,
            lon: site.lon,
            dlat, dlon,
            trail: [{ lat: site.lat, lon: site.lon }],
            targetLat: target.lat,
            targetLon: target.lon,
            launchSiteName: site.name,
            targetName: target.name,
            color: colorMap[template.type] || '#ffffff',
            label: `${id} ${template.name}`,
            info: `${template.speed}m/s → ${target.name}`,
            destroyed: false,
            engaged: false,
        };

        this.threats.push(threat);
        this.radar.addTrack(threat);
        this.stats.detected++;

        this.log('detect', `TRACK ${id} — ${template.name} launched from ${site.name} → ${target.name}, ${template.speed}m/s`);
        this.onUpdate();

        return threat;
    }

    // -- Directed threat spawn (for scenarios) --

    spawnThreatDirected(threatId, launchSiteId, targetName) {
        const template = THREATS.find(t => t.id === threatId);
        if (!template) return null;

        const site = launchSiteId
            ? LAUNCH_SITES.find(s => s.id === launchSiteId) || this._pickLaunchSite(template)
            : this._pickLaunchSite(template);

        const target = targetName
            ? TARGET_CITIES.find(c => c.name === targetName) || this._pickTarget(site, template)
            : this._pickTarget(site, template);

        const id = `T${String(this.nextThreatId++).padStart(3, '0')}`;
        const bearing = this._bearing(site.lat, site.lon, target.lat, target.lon);
        const degsPerTick = this._getDegsPerTick(template);
        const dlat = degsPerTick * Math.cos(bearing);
        const dlon = degsPerTick * Math.sin(bearing) / Math.cos(site.lat * Math.PI / 180);

        const colorMap = {
            [MISSILE_TYPES.BALLISTIC]: '#ff5252',
            [MISSILE_TYPES.CRUISE]: '#ffab40',
            [MISSILE_TYPES.HYPERSONIC]: '#e040fb',
            [MISSILE_TYPES.DRONE]: '#00e5ff',
        };

        const threat = {
            id, templateId: template.id,
            name: template.name, type: template.type, threat: template.threat,
            speed: template.speed,
            lat: site.lat, lon: site.lon, dlat, dlon,
            trail: [{ lat: site.lat, lon: site.lon }],
            targetLat: target.lat, targetLon: target.lon,
            launchSiteName: site.name, targetName: target.name,
            color: colorMap[template.type] || '#ffffff',
            label: `${id} ${template.name}`,
            info: `${template.speed}m/s → ${target.name}`,
            destroyed: false, engaged: false,
        };

        this.threats.push(threat);
        this.radar.addTrack(threat);
        this.stats.detected++;
        this.log('detect', `TRACK ${id} — ${template.name} launched from ${site.name} → ${target.name}, ${template.speed}m/s`);
        this.onUpdate();
        return threat;
    }

    // -- Scenario Runner --

    runScenario(scenarioId) {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return;

        // Reset before starting
        this.stopScenario();
        this.reset();

        this.activeScenario = scenario;
        this.scenarioWaveIndex = 0;
        this.scenarioStats = { launched: 0, total: scenario.totalThreats };
        this.scenarioStartTime = performance.now();

        this.log('system', `━━━ SCENARIO: ${scenario.name} ━━━`);
        this.log('system', scenario.description);
        this.log('system', `${scenario.waves.length} waves, ${scenario.totalThreats} total threats — Difficulty: ${scenario.difficulty.toUpperCase()}`);

        // Schedule each wave
        for (let i = 0; i < scenario.waves.length; i++) {
            const wave = scenario.waves[i];
            const timer = setTimeout(() => this._executeWave(i), wave.delay);
            this.scenarioTimers.push(timer);
        }

        this.onUpdate();
    }

    _executeWave(waveIndex) {
        if (!this.activeScenario) return;
        const scenario = this.activeScenario;
        const wave = scenario.waves[waveIndex];
        if (!wave) return;

        this.scenarioWaveIndex = waveIndex + 1;
        this.log('system', `▸ ${wave.label} (${wave.threats.length} threats)`);

        if (this.onScenarioWave) {
            this.onScenarioWave(waveIndex, wave);
        }

        for (const t of wave.threats) {
            this.spawnThreatDirected(t.threatId, t.launchSiteId, t.targetName);
            this.scenarioStats.launched++;
        }

        // Check if this was the last wave
        if (waveIndex >= scenario.waves.length - 1) {
            this.log('system', `━━━ ALL WAVES LAUNCHED — ${this.scenarioStats.launched} threats in play ━━━`);
            if (this.onScenarioEnd) {
                this.onScenarioEnd(scenario);
            }
        }

        this.onUpdate();
    }

    stopScenario() {
        for (const timer of this.scenarioTimers) {
            clearTimeout(timer);
        }
        this.scenarioTimers = [];
        this.activeScenario = null;
        this.scenarioStats = null;
        this.scenarioWaveIndex = 0;
    }

    getScenarioProgress() {
        if (!this.activeScenario) return null;
        return {
            scenario: this.activeScenario,
            waveIndex: this.scenarioWaveIndex,
            totalWaves: this.activeScenario.waves.length,
            launched: this.scenarioStats?.launched || 0,
            total: this.scenarioStats?.total || 0,
        };
    }

    _getDegsPerTick(template) {
        const dt = (1 / 60) * SIM_TIME_SCALE;
        const metersPerTick = template.speed * dt;
        return metersPerTick * DEG_PER_METER;
    }

    _pickLaunchSite(template) {
        const byType = {
            [MISSILE_TYPES.BALLISTIC]: ['iran-shahrud', 'iran-tabriz', 'nk-sohae', 'nk-sinpo', 'russia-kapyar', 'china-jiuquan'],
            [MISSILE_TYPES.HYPERSONIC]: ['russia-plesetsk', 'russia-kapyar', 'china-jiuquan'],
            [MISSILE_TYPES.CRUISE]: ['russia-kapyar', 'iran-shahrud', 'yemen-sanaa', 'syria-damascus'],
            [MISSILE_TYPES.DRONE]: ['yemen-sanaa', 'iran-shahrud', 'iran-tabriz', 'syria-damascus'],
        };
        const allowed = byType[template.type] || LAUNCH_SITES.map(s => s.id);
        const candidates = LAUNCH_SITES.filter(s => allowed.includes(s.id));
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    _pickTarget(site, template) {
        // Prefer targets within missile range, but fall back to any
        const inRange = TARGET_CITIES.filter(t => {
            const dist = this._haversineKm(site.lat, site.lon, t.lat, t.lon);
            return dist > 50 && dist <= template.maxRange;
        });
        const pool = inRange.length > 0 ? inRange : TARGET_CITIES.filter(t => {
            const dist = this._haversineKm(site.lat, site.lon, t.lat, t.lon);
            return dist > 50;
        });
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // -- Engagement --

    findBestDefense(threat) {
        const available = this.defenses.filter(d =>
            d.status === DEFENSE_STATUS.READY &&
            d.roundsRemaining > 0 &&
            d.canEngage.includes(threat.type)
        );
        if (available.length === 0) return null;

        // Prefer defense systems near the threat's target
        available.sort((a, b) => {
            const locA = DEFENSE_LOCATIONS.find(l => l.systemId === a.id);
            const locB = DEFENSE_LOCATIONS.find(l => l.systemId === b.id);
            if (!locA || !locB) return b.pkill - a.pkill;
            const distA = this._haversineKm(locA.lat, locA.lon, threat.targetLat, threat.targetLon);
            const distB = this._haversineKm(locB.lat, locB.lon, threat.targetLat, threat.targetLon);
            // Weight proximity and pkill
            return (distA - distB) * 0.001 + (b.pkill - a.pkill);
        });
        return available[0];
    }

    engageThreat(threat) {
        if (threat.engaged || threat.destroyed) return null;

        const defense = this.findBestDefense(threat);
        if (!defense) {
            this.log('system', `No defense available for ${threat.id} (${threat.type})`);
            return null;
        }

        threat.engaged = true;
        defense.roundsRemaining--;
        this.stats.engaged++;
        this.stats.roundsFired++;

        if (defense.roundsRemaining <= 0) {
            defense.status = DEFENSE_STATUS.RELOADING;
            setTimeout(() => {
                defense.roundsRemaining = defense.roundsTotal;
                defense.status = DEFENSE_STATUS.READY;
                this.onUpdate();
            }, 5000);
        } else {
            defense.status = DEFENSE_STATUS.ENGAGING;
            setTimeout(() => {
                if (defense.status === DEFENSE_STATUS.ENGAGING) {
                    defense.status = DEFENSE_STATUS.READY;
                    this.onUpdate();
                }
            }, 2000);
        }

        // Interceptor launches from defense site
        const defLoc = DEFENSE_LOCATIONS.find(d => d.systemId === defense.id)
            || { lat: 32.0, lon: 35.0 };

        const interceptor = {
            id: `I${String(this.nextEngId).padStart(3, '0')}`,
            lat: defLoc.lat,
            lon: defLoc.lon,
            targetId: threat.id,
            trail: [{ lat: defLoc.lat, lon: defLoc.lon }],
            speed: defense.interceptSpeed,
        };
        this.radar.addInterceptor(interceptor);

        const engagement = {
            id: this.nextEngId++,
            threatId: threat.id,
            threatName: threat.name,
            defenseId: defense.id,
            defenseName: defense.name,
            pkill: defense.pkill,
            interceptor,
            progress: 0,
            result: null,
        };
        this.engagements.push(engagement);

        this.log('engage', `${defense.name} (${defLoc.name}) engaging ${threat.id} ${threat.name} — Pk ${(defense.pkill * 100).toFixed(0)}%`);
        this.onUpdate();

        return engagement;
    }

    engageAll() {
        const unengaged = this.threats.filter(t => !t.engaged && !t.destroyed);
        let count = 0;
        for (const threat of unengaged) {
            if (this.engageThreat(threat)) count++;
        }
        if (count === 0) {
            this.log('system', 'No threats to engage');
        }
    }

    // -- Simulation Tick --

    tick() {
        if (this.paused) return;

        const steps = this.speedMultiplier;

        for (let step = 0; step < steps; step++) {
            this._tickOnce();
        }
    }

    _tickOnce() {
        // Move threats
        for (const threat of this.threats) {
            if (threat.destroyed) continue;

            threat.lat += threat.dlat;
            threat.lon += threat.dlon;
            threat.trail.push({ lat: threat.lat, lon: threat.lon });
            if (threat.trail.length > 40) threat.trail.shift();

            // Check if threat reached target
            const distToTarget = this._haversineKm(
                threat.lat, threat.lon, threat.targetLat, threat.targetLon,
            );
            if (distToTarget < 20) {
                threat.destroyed = true;
                threat.impacted = true;
                this.radar.addExplosion(threat.lat, threat.lon, false);
                this.radar.addCityImpact(threat.targetLat, threat.targetLon, threat.targetName);
                this.stats.missed++;
                this.log('miss', `${threat.id} ${threat.name} — IMPACT at ${threat.targetName}`);
                this.onUpdate();
            }

            // Cull if out of bounds
            if (threat.lat < -90 || threat.lat > 90 || threat.lon < -180 || threat.lon > 360) {
                threat.destroyed = true;
                this.radar.removeTrack(threat.id);
            }
        }

        // Move interceptors
        for (const eng of this.engagements) {
            if (eng.result !== null) continue;

            const threat = this.threats.find(t => t.id === eng.threatId);
            if (!threat || threat.destroyed) {
                eng.result = 'aborted';
                this.radar.removeInterceptor(eng.interceptor.id);
                continue;
            }

            const int = eng.interceptor;
            const distKm = this._haversineKm(int.lat, int.lon, threat.lat, threat.lon);

            eng.progress = Math.max(0, Math.min(1, 1 - distKm / 600));

            if (distKm < 20) {
                // Intercept attempt
                const hit = Math.random() < eng.pkill;
                if (hit) {
                    threat.destroyed = true;
                    this.radar.addExplosion(threat.lat, threat.lon, true);
                    this.stats.intercepted++;
                    eng.result = 'intercepted';
                    this.log('intercept', `${threat.id} ${threat.name} INTERCEPTED by ${eng.defenseName}`);
                } else {
                    eng.result = 'missed';
                    threat.engaged = false;
                    this.log('miss', `${eng.defenseName} missed ${threat.id} ${threat.name} — re-engaging`);
                    setTimeout(() => this.engageThreat(threat), 1000);
                }
                this.radar.removeInterceptor(int.id);
                this.onUpdate();
            } else {
                // Pursue threat
                const bearing = this._bearing(int.lat, int.lon, threat.lat, threat.lon);
                const intDegsPerTick = int.speed * (1 / 60) * SIM_TIME_SCALE * DEG_PER_METER;
                int.lat += Math.cos(bearing) * intDegsPerTick;
                int.lon += Math.sin(bearing) * intDegsPerTick / Math.cos(int.lat * Math.PI / 180);
                int.trail.push({ lat: int.lat, lon: int.lon });
                if (int.trail.length > 25) int.trail.shift();
            }
        }

        // Cleanup resolved engagements after display delay
        this.engagements = this.engagements.filter(e => {
            if (e.result && e.result !== 'aborted') {
                e.removeTimer = (e.removeTimer || 0) + 1;
                return e.removeTimer < 120;
            }
            return e.result === null;
        });

        // Clean destroyed threats
        this.threats = this.threats.filter(t => !t.destroyed);

        // Check scenario completion: all waves launched + no active threats + no active engagements
        this._checkScenarioComplete();
    }

    _checkScenarioComplete() {
        if (!this.activeScenario) return;
        if (!this.scenarioStats) return;
        if (this.scenarioStats.launched < this.scenarioStats.total) return;
        if (this.threats.length > 0) return;
        if (this.engagements.some(e => e.result === null)) return;
        if (this._scenarioCompleted) return;

        this._scenarioCompleted = true;
        const elapsed = performance.now() - this.scenarioStartTime;
        const report = {
            scenario: this.activeScenario,
            stats: { ...this.stats },
            elapsed,
            defenses: this.defenses.map(d => ({
                name: d.name,
                roundsFired: d.roundsTotal - d.roundsRemaining,
                roundsTotal: d.roundsTotal,
            })),
        };

        this.log('system', `━━━ SCENARIO COMPLETE — ${this.stats.intercepted}/${this.stats.detected} intercepted ━━━`);

        if (this.onScenarioComplete) {
            // Small delay so the last explosion can play out
            setTimeout(() => this.onScenarioComplete(report), 1500);
        }
    }

    // -- Check if threat is near any defense site --

    isInDefenseRange(threat) {
        for (const defense of this.defenses) {
            if (defense.status !== DEFENSE_STATUS.READY) continue;
            if (!defense.canEngage.includes(threat.type)) continue;
            const defLoc = DEFENSE_LOCATIONS.find(d => d.systemId === defense.id);
            if (!defLoc) continue;
            const dist = this._haversineKm(threat.lat, threat.lon, defLoc.lat, defLoc.lon);
            if (dist < defense.range * 2.5) return true;
        }
        return false;
    }

    reloadDefenses() {
        this.defenses = structuredClone(DEFENSE_SYSTEMS);
    }

    reset() {
        this.stopScenario();
        this.threats = [];
        this.engagements = [];
        this.defenses = structuredClone(DEFENSE_SYSTEMS);
        this.nextThreatId = 1;
        this.nextEngId = 1;
        this.stats = { detected: 0, intercepted: 0, missed: 0, engaged: 0, roundsFired: 0 };
        this._scenarioCompleted = false;
        this.scenarioStartTime = null;
        this.paused = false;
        this.speedMultiplier = 1;
        this.radar.clearAll();
        this.log('system', 'System reset. All batteries nominal.');
        this.onUpdate();
    }

    getActiveThreats() {
        return this.threats.filter(t => !t.destroyed);
    }
}
