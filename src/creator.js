// ============================================
// AEGIS — Creator & Detail Modal
// View details, create custom missiles/defenses
// ============================================

import { MISSILE_TYPES, THREAT_LEVELS, DEFENSE_STATUS, THREATS, DEFENSE_SYSTEMS } from './data.js';

const TYPE_COLORS = {
    ballistic: '#ff5252',
    cruise: '#ffab40',
    hypersonic: '#e040fb',
    drone: '#00e5ff',
};

export default class CreatorModal {
    constructor({ onThreatAdded, onDefenseAdded, onLaunchThreat }) {
        this.onThreatAdded = onThreatAdded;
        this.onDefenseAdded = onDefenseAdded;
        this.onLaunchThreat = onLaunchThreat;
        this.overlay = null;
        this.init();
    }

    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.body.appendChild(this.overlay);
    }

    // ===== DETAIL VIEWS =====

    openThreatDetail(threat) {
        const color = TYPE_COLORS[threat.type] || '#ffffff';
        const canBeEngagedBy = DEFENSE_SYSTEMS
            .filter(d => d.canEngage.includes(threat.type))
            .map(d => d.name)
            .join(', ') || 'None';

        this.overlay.innerHTML = `
            <div class="modal modal-detail">
                <div class="modal-header">
                    <span class="modal-icon" style="color:${color}">▲</span>
                    <h3>${threat.name}</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                </div>
                <div class="detail-body">
                    <div class="detail-badge" style="border-color:${color}; color:${color}">
                        ${threat.type.toUpperCase()}
                    </div>
                    <p class="detail-desc">${threat.description}</p>

                    <div class="detail-section-label">SPECIFICATIONS</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">SPEED</span>
                            <span class="detail-value">${threat.speed.toLocaleString()} m/s</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MAX RANGE</span>
                            <span class="detail-value">${threat.maxRange.toLocaleString()} km</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">ALTITUDE</span>
                            <span class="detail-value">${threat.altitude} km</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">RADAR CROSS SECTION</span>
                            <span class="detail-value">${threat.rcs} m&sup2;</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">THREAT LEVEL</span>
                            <span class="detail-value threat-val-${threat.threat}">${threat.threat.toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MACH NUMBER</span>
                            <span class="detail-value">~${(threat.speed / 343).toFixed(1)} Mach</span>
                        </div>
                    </div>

                    <div class="detail-section-label">COUNTERMEASURES</div>
                    <p class="detail-counters">${canBeEngagedBy}</p>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="modalCancel">CLOSE</button>
                        <button type="button" class="btn btn-danger" id="btnLaunchThis">LAUNCH THIS THREAT</button>
                    </div>
                </div>
            </div>
        `;
        this.overlay.classList.add('visible');
        this.bindClose();

        document.getElementById('btnLaunchThis').addEventListener('click', () => {
            this.onLaunchThreat(threat);
            this.close();
        });
    }

    openDefenseDetail(defense) {
        const engageTypes = defense.canEngage
            .map(t => `<span class="detail-engage-tag" style="border-color:${TYPE_COLORS[t]}; color:${TYPE_COLORS[t]}">${t.toUpperCase()}</span>`)
            .join(' ');

        const effectiveAgainst = THREATS
            .filter(t => defense.canEngage.includes(t.type))
            .map(t => t.name)
            .join(', ') || 'None';

        this.overlay.innerHTML = `
            <div class="modal modal-detail">
                <div class="modal-header">
                    <span class="modal-icon">⛨</span>
                    <h3>${defense.name}</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                </div>
                <div class="detail-body">
                    <div class="detail-badge detail-badge-green">
                        ${defense.type.toUpperCase()}
                    </div>

                    <div class="detail-section-label">SPECIFICATIONS</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">ENGAGEMENT RANGE</span>
                            <span class="detail-value">${defense.range.toLocaleString()} km</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MAX ALTITUDE</span>
                            <span class="detail-value">${defense.maxAlt.toLocaleString()} km</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">INTERCEPT SPEED</span>
                            <span class="detail-value">${defense.interceptSpeed.toLocaleString()} m/s</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">KILL PROBABILITY</span>
                            <span class="detail-value">${(defense.pkill * 100).toFixed(0)}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MAGAZINE CAPACITY</span>
                            <span class="detail-value">${defense.roundsTotal} rounds</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MACH NUMBER</span>
                            <span class="detail-value">~${(defense.interceptSpeed / 343).toFixed(1)} Mach</span>
                        </div>
                    </div>

                    <div class="detail-section-label">CAN ENGAGE</div>
                    <div class="detail-engage-tags">${engageTypes}</div>

                    <div class="detail-section-label">EFFECTIVE AGAINST</div>
                    <p class="detail-counters">${effectiveAgainst}</p>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="modalCancel">CLOSE</button>
                    </div>
                </div>
            </div>
        `;
        this.overlay.classList.add('visible');
        this.bindClose();
    }

    // ===== CREATION FORMS =====

    openThreatForm() {
        this.overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <span class="modal-icon">▲</span>
                    <h3>NEW THREAT PROFILE</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                </div>
                <form class="modal-form" id="threatForm">
                    <div class="form-hint">Reference: SCUD-B has speed 1500 m/s, range 300 km, altitude 80 km, RCS 1.2 m&sup2;</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>DESIGNATION</label>
                            <input type="text" name="name" placeholder="e.g. FALCON-X" required maxlength="20">
                        </div>
                        <div class="form-group">
                            <label>TYPE</label>
                            <select name="type" required>
                                <option value="ballistic">BALLISTIC</option>
                                <option value="cruise">CRUISE</option>
                                <option value="hypersonic">HYPERSONIC</option>
                                <option value="drone">DRONE / UAV</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>SPEED (m/s)</label>
                            <input type="number" name="speed" placeholder="1500" required min="1" max="10000">
                            <span class="form-range-hint">Drone ~50 | Cruise ~250 | Ballistic ~1500 | Hyper ~3000+</span>
                        </div>
                        <div class="form-group">
                            <label>MAX RANGE (km)</label>
                            <input type="number" name="maxRange" placeholder="300" required min="1" max="20000">
                            <span class="form-range-hint">Short 70-300 | Medium 1000-2500 | Long 2500+</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>ALTITUDE (km)</label>
                            <input type="number" name="altitude" placeholder="80" required min="0" max="1000" step="0.01">
                            <span class="form-range-hint">Sea-skim 0.02 | Low 1-5 | Med 20-80 | High 250+</span>
                        </div>
                        <div class="form-group">
                            <label>RCS (m&sup2;)</label>
                            <input type="number" name="rcs" placeholder="0.5" required min="0.001" max="50" step="0.001">
                            <span class="form-range-hint">Stealth 0.01 | Small 0.1 | Med 0.5 | Large 1.0+</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>THREAT LEVEL</label>
                            <select name="threat" required>
                                <option value="low">LOW</option>
                                <option value="medium" selected>MEDIUM</option>
                                <option value="high">HIGH</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group full">
                        <label>DESCRIPTION</label>
                        <input type="text" name="description" placeholder="Brief description of the threat" required maxlength="60">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="modalCancel">CANCEL</button>
                        <button type="submit" class="btn">ADD TO CATALOG</button>
                    </div>
                </form>
            </div>
        `;
        this.overlay.classList.add('visible');
        this.bindClose();

        document.getElementById('threatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitThreat(e.target);
        });
    }

    submitThreat(form) {
        const data = new FormData(form);
        const threat = {
            id: `custom-${Date.now()}`,
            name: data.get('name').toUpperCase(),
            type: data.get('type'),
            threat: data.get('threat'),
            speed: Number(data.get('speed')),
            maxRange: Number(data.get('maxRange')),
            altitude: Number(data.get('altitude')),
            rcs: Number(data.get('rcs')),
            description: data.get('description'),
        };

        THREATS.push(threat);
        this.onThreatAdded(threat);
        this.close();
    }

    openDefenseForm() {
        const typeOptions = Object.values(MISSILE_TYPES)
            .map(t => `<label class="checkbox-label"><input type="checkbox" name="canEngage" value="${t}"> ${t.toUpperCase()}</label>`)
            .join('');

        this.overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <span class="modal-icon">⛨</span>
                    <h3>NEW DEFENSE SYSTEM</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                </div>
                <form class="modal-form" id="defenseForm">
                    <div class="form-hint">Reference: PATRIOT PAC-3 has range 160 km, alt 25 km, speed 1700 m/s, 16 rounds, Pk 85%</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>DESIGNATION</label>
                            <input type="text" name="name" placeholder="e.g. SHIELD-MK2" required maxlength="20">
                        </div>
                        <div class="form-group">
                            <label>SYSTEM TYPE</label>
                            <input type="text" name="type" placeholder="e.g. Surface-to-Air" required maxlength="25">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>RANGE (km)</label>
                            <input type="number" name="range" placeholder="200" required min="1" max="2000">
                            <span class="form-range-hint">CIWS 3-5 | Short 70 | Med 160-200 | Long 400-700</span>
                        </div>
                        <div class="form-group">
                            <label>MAX ALTITUDE (km)</label>
                            <input type="number" name="maxAlt" placeholder="25" required min="1" max="1000">
                            <span class="form-range-hint">CIWS 2 | Short 10 | Med 25-30 | High 150-500</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>INTERCEPT SPEED (m/s)</label>
                            <input type="number" name="interceptSpeed" placeholder="1700" required min="100" max="10000">
                            <span class="form-range-hint">CIWS 1100 | SAM 1700 | THAAD 2500 | SM-3 3000</span>
                        </div>
                        <div class="form-group">
                            <label>TOTAL ROUNDS</label>
                            <input type="number" name="roundsTotal" placeholder="16" required min="1" max="5000">
                            <span class="form-range-hint">SAM 16-48 | CIWS 1550 | Ship 24</span>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Pk (KILL PROBABILITY %)</label>
                            <input type="number" name="pkill" placeholder="85" required min="1" max="99">
                            <span class="form-range-hint">CIWS 70% | SAM 82-90%</span>
                        </div>
                    </div>
                    <div class="form-group full">
                        <label>CAN ENGAGE</label>
                        <div class="checkbox-group">${typeOptions}</div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="modalCancel">CANCEL</button>
                        <button type="submit" class="btn">ADD SYSTEM</button>
                    </div>
                </form>
            </div>
        `;
        this.overlay.classList.add('visible');
        this.bindClose();

        document.getElementById('defenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitDefense(e.target);
        });
    }

    submitDefense(form) {
        const data = new FormData(form);
        const canEngage = data.getAll('canEngage');

        if (canEngage.length === 0) {
            form.querySelector('.checkbox-group').style.outline = '1px solid var(--accent-red)';
            return;
        }

        const rounds = Number(data.get('roundsTotal'));
        const defense = {
            id: `custom-${Date.now()}`,
            name: data.get('name').toUpperCase(),
            type: data.get('type'),
            range: Number(data.get('range')),
            maxAlt: Number(data.get('maxAlt')),
            interceptSpeed: Number(data.get('interceptSpeed')),
            roundsTotal: rounds,
            roundsRemaining: rounds,
            pkill: Number(data.get('pkill')) / 100,
            canEngage,
            status: DEFENSE_STATUS.READY,
        };

        DEFENSE_SYSTEMS.push(defense);
        this.onDefenseAdded(defense);
        this.close();
    }

    // ===== HELPERS =====

    bindClose() {
        document.getElementById('modalClose').addEventListener('click', () => this.close());
        document.getElementById('modalCancel').addEventListener('click', () => this.close());
    }

    close() {
        this.overlay.classList.remove('visible');
    }
}
