// ============================================
// AEGIS — Creator Modal
// Create custom missiles and defense systems
// ============================================

import { MISSILE_TYPES, THREAT_LEVELS, DEFENSE_STATUS, THREATS, DEFENSE_SYSTEMS } from './data.js';

export default class CreatorModal {
    constructor({ onThreatAdded, onDefenseAdded }) {
        this.onThreatAdded = onThreatAdded;
        this.onDefenseAdded = onDefenseAdded;
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

    // -- Open modal for threat creation --

    openThreatForm() {
        this.overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <span class="modal-icon">▲</span>
                    <h3>NEW THREAT PROFILE</h3>
                    <button class="modal-close" id="modalClose">×</button>
                </div>
                <form class="modal-form" id="threatForm">
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
                        </div>
                        <div class="form-group">
                            <label>MAX RANGE (km)</label>
                            <input type="number" name="maxRange" placeholder="300" required min="1" max="20000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>ALTITUDE (km)</label>
                            <input type="number" name="altitude" placeholder="80" required min="0" max="1000" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>RCS (m²)</label>
                            <input type="number" name="rcs" placeholder="0.5" required min="0.001" max="50" step="0.001">
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

    // -- Open modal for defense system creation --

    openDefenseForm() {
        const typeOptions = Object.values(MISSILE_TYPES)
            .map(t => `<label class="checkbox-label"><input type="checkbox" name="canEngage" value="${t}"> ${t.toUpperCase()}</label>`)
            .join('');

        this.overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <span class="modal-icon">⛨</span>
                    <h3>NEW DEFENSE SYSTEM</h3>
                    <button class="modal-close" id="modalClose">×</button>
                </div>
                <form class="modal-form" id="defenseForm">
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
                        </div>
                        <div class="form-group">
                            <label>MAX ALTITUDE (km)</label>
                            <input type="number" name="maxAlt" placeholder="25" required min="1" max="1000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>INTERCEPT SPEED (m/s)</label>
                            <input type="number" name="interceptSpeed" placeholder="1700" required min="100" max="10000">
                        </div>
                        <div class="form-group">
                            <label>TOTAL ROUNDS</label>
                            <input type="number" name="roundsTotal" placeholder="16" required min="1" max="5000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Pk (KILL PROBABILITY %)</label>
                            <input type="number" name="pkill" placeholder="85" required min="1" max="99">
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

    // -- Helpers --

    bindClose() {
        document.getElementById('modalClose').addEventListener('click', () => this.close());
        document.getElementById('modalCancel').addEventListener('click', () => this.close());
    }

    close() {
        this.overlay.classList.remove('visible');
    }
}
