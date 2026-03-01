// ============================================
// AEGIS — Simulation Engine
// Threat spawning, interception logic, engagement
// ============================================

class Simulation {
    constructor(radar, onLog, onUpdate) {
        this.radar = radar;
        this.log = onLog;
        this.onUpdate = onUpdate;
        this.threats = [];
        this.engagements = [];
        this.defenses = structuredClone(DEFENSE_SYSTEMS);
        this.nextThreatId = 1;
        this.nextEngId = 1;
        this.stats = { detected: 0, intercepted: 0, missed: 0 };
    }

    // -- Threat Spawning --

    spawnRandomThreat() {
        const template = THREATS[Math.floor(Math.random() * THREATS.length)];
        return this.spawnThreat(template);
    }

    spawnThreat(template) {
        const id = `T${String(this.nextThreatId++).padStart(3, '0')}`;

        // Spawn on radar edge, moving inward
        const angle = Math.random() * Math.PI * 2;
        const edgeDist = 0.85 + Math.random() * 0.1;
        const x = Math.cos(angle) * edgeDist;
        const y = Math.sin(angle) * edgeDist;

        // Velocity toward center with some randomness
        const targetAngle = Math.atan2(-y, -x) + (Math.random() - 0.5) * 0.4;
        const speedFactor = this.getSpeedFactor(template);
        const vx = Math.cos(targetAngle) * speedFactor;
        const vy = Math.sin(targetAngle) * speedFactor;

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
            x, y, vx, vy,
            trail: [{ x, y }],
            color: colorMap[template.type],
            label: `${id} ${template.name}`,
            info: `${template.speed}m/s ${template.type.toUpperCase()}`,
            destroyed: false,
            engaged: false,
        };

        this.threats.push(threat);
        this.radar.addTrack(threat);
        this.stats.detected++;

        this.log('detect', `TRACK ${id} — ${template.name} detected bearing ${Math.round((angle * 180 / Math.PI + 360) % 360)}°, ${template.speed}m/s`);
        this.onUpdate();

        return threat;
    }

    getSpeedFactor(template) {
        // Normalize speed to radar movement rate
        const base = {
            [MISSILE_TYPES.BALLISTIC]: 0.003,
            [MISSILE_TYPES.CRUISE]: 0.0015,
            [MISSILE_TYPES.HYPERSONIC]: 0.004,
            [MISSILE_TYPES.DRONE]: 0.0008,
        };
        return base[template.type] + Math.random() * 0.001;
    }

    // -- Engagement --

    findBestDefense(threat) {
        const available = this.defenses.filter(d =>
            d.status === DEFENSE_STATUS.READY &&
            d.roundsRemaining > 0 &&
            d.canEngage.includes(threat.type)
        );

        if (available.length === 0) return null;

        // Pick highest pkill among capable systems
        available.sort((a, b) => b.pkill - a.pkill);
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

        // Launch interceptor from center toward threat
        const interceptor = {
            id: `I${String(this.nextEngId).padStart(3, '0')}`,
            x: 0, y: 0,
            targetId: threat.id,
            trail: [{ x: 0, y: 0 }],
            speed: 0.006,
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

        this.log('engage', `${defense.name} engaging ${threat.id} ${threat.name} — Pk ${(defense.pkill * 100).toFixed(0)}%`);
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
        // Move threats
        for (const threat of this.threats) {
            if (threat.destroyed) continue;

            threat.x += threat.vx;
            threat.y += threat.vy;
            threat.trail.push({ x: threat.x, y: threat.y });
            if (threat.trail.length > 30) threat.trail.shift();

            // Check if threat reached center (impact)
            const distToCenter = Math.sqrt(threat.x ** 2 + threat.y ** 2);
            if (distToCenter < 0.03) {
                threat.destroyed = true;
                this.radar.addExplosion(threat.x, threat.y, false);
                this.stats.missed++;
                this.log('miss', `${threat.id} ${threat.name} — IMPACT at defended zone`);
                this.onUpdate();
            }

            // Check if threat left radar
            if (distToCenter > 1.1) {
                threat.destroyed = true;
                this.radar.removeTrack(threat.id);
            }
        }

        // Move interceptors toward targets
        for (const eng of this.engagements) {
            if (eng.result !== null) continue;

            const threat = this.threats.find(t => t.id === eng.threatId);
            if (!threat || threat.destroyed) {
                eng.result = 'aborted';
                this.radar.removeInterceptor(eng.interceptor.id);
                continue;
            }

            const int = eng.interceptor;
            const dx = threat.x - int.x;
            const dy = threat.y - int.y;
            const dist = Math.sqrt(dx ** 2 + dy ** 2);

            eng.progress = Math.min(1, 1 - dist / 0.9);

            if (dist < 0.03) {
                // Intercept attempt
                const hit = Math.random() < eng.pkill;
                if (hit) {
                    threat.destroyed = true;
                    this.radar.addExplosion(threat.x, threat.y, true);
                    this.stats.intercepted++;
                    eng.result = 'intercepted';
                    this.log('intercept', `${threat.id} ${threat.name} INTERCEPTED by ${eng.defenseName}`);
                } else {
                    eng.result = 'missed';
                    threat.engaged = false;
                    this.log('miss', `${eng.defenseName} missed ${threat.id} ${threat.name} — re-engaging`);
                    // Allow re-engagement
                    setTimeout(() => this.engageThreat(threat), 1000);
                }
                this.radar.removeInterceptor(int.id);
                this.onUpdate();
            } else {
                // Move toward threat
                int.x += (dx / dist) * int.speed;
                int.y += (dy / dist) * int.speed;
                int.trail.push({ x: int.x, y: int.y });
                if (int.trail.length > 20) int.trail.shift();
            }
        }

        // Cleanup completed engagements after delay
        this.engagements = this.engagements.filter(e => {
            if (e.result && e.result !== 'aborted') {
                e.removeTimer = (e.removeTimer || 0) + 1;
                return e.removeTimer < 120; // keep for ~2 seconds at 60fps
            }
            return e.result === null;
        });

        // Clean destroyed threats
        this.threats = this.threats.filter(t => !t.destroyed);
    }

    reset() {
        this.threats = [];
        this.engagements = [];
        this.defenses = structuredClone(DEFENSE_SYSTEMS);
        this.nextThreatId = 1;
        this.nextEngId = 1;
        this.stats = { detected: 0, intercepted: 0, missed: 0 };
        this.radar.clearAll();
        this.log('system', 'System reset. All batteries nominal.');
        this.onUpdate();
    }

    getActiveThreats() {
        return this.threats.filter(t => !t.destroyed);
    }
}
