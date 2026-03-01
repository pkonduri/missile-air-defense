// ============================================
// AEGIS — After-Action Report (AAR)
// Post-scenario performance analysis & grading
// ============================================

const GRADES = [
    { min: 95, letter: 'S', label: 'SUPREME COMMANDER', color: '#e040fb' },
    { min: 85, letter: 'A', label: 'EXCELLENT', color: '#00e676' },
    { min: 70, letter: 'B', label: 'GOOD', color: '#29b6f6' },
    { min: 50, letter: 'C', label: 'ADEQUATE', color: '#ffab40' },
    { min: 25, letter: 'D', label: 'POOR', color: '#ff5252' },
    { min: 0,  letter: 'F', label: 'FAILURE', color: '#ff1744' },
];

function getGrade(interceptRate) {
    const pct = interceptRate * 100;
    return GRADES.find(g => pct >= g.min) || GRADES[GRADES.length - 1];
}

function formatTime(ms) {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`;
}

export function showAAR(report) {
    const { scenario, stats, elapsed, defenses } = report;
    const interceptRate = stats.detected > 0 ? stats.intercepted / stats.detected : 0;
    const grade = getGrade(interceptRate);
    const impacted = stats.missed;
    const civiliansProtected = stats.detected > 0
        ? Math.round(interceptRate * 100) : 0;

    // Efficiency: intercepted per round fired
    const efficiency = stats.roundsFired > 0
        ? ((stats.intercepted / stats.roundsFired) * 100).toFixed(0)
        : '—';

    const defenseRows = defenses.map(d => {
        const pct = d.roundsTotal > 0 ? Math.round((d.roundsFired / d.roundsTotal) * 100) : 0;
        return `
            <div class="aar-defense-row">
                <span class="aar-defense-name">${d.name}</span>
                <div class="aar-defense-bar-track">
                    <div class="aar-defense-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="aar-defense-ammo">${d.roundsFired}/${d.roundsTotal}</span>
            </div>
        `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'aar-overlay';
    overlay.innerHTML = `
        <div class="aar-modal">
            <div class="aar-header">
                <div class="aar-title">AFTER-ACTION REPORT</div>
                <div class="aar-scenario">${scenario.name}</div>
                <div class="aar-difficulty" style="color: ${grade.color}">${scenario.difficulty.toUpperCase()}</div>
            </div>

            <div class="aar-grade-section">
                <div class="aar-grade" style="color: ${grade.color}; border-color: ${grade.color}">${grade.letter}</div>
                <div class="aar-grade-label" style="color: ${grade.color}">${grade.label}</div>
            </div>

            <div class="aar-stats-grid">
                <div class="aar-stat">
                    <div class="aar-stat-value" style="color: var(--accent-cyan)">${stats.detected}</div>
                    <div class="aar-stat-label">THREATS<br>DETECTED</div>
                </div>
                <div class="aar-stat">
                    <div class="aar-stat-value" style="color: var(--accent-green)">${stats.intercepted}</div>
                    <div class="aar-stat-label">THREATS<br>INTERCEPTED</div>
                </div>
                <div class="aar-stat">
                    <div class="aar-stat-value" style="color: var(--accent-red)">${impacted}</div>
                    <div class="aar-stat-label">IMPACTS<br>ON TARGET</div>
                </div>
                <div class="aar-stat">
                    <div class="aar-stat-value" style="color: var(--accent-orange)">${stats.roundsFired}</div>
                    <div class="aar-stat-label">ROUNDS<br>FIRED</div>
                </div>
            </div>

            <div class="aar-bar-section">
                <div class="aar-bar-label">INTERCEPT RATE</div>
                <div class="aar-bar-track">
                    <div class="aar-bar-fill" style="width: ${civiliansProtected}%; background: ${grade.color}"></div>
                </div>
                <div class="aar-bar-value" style="color: ${grade.color}">${civiliansProtected}%</div>
            </div>

            <div class="aar-metrics">
                <div class="aar-metric">
                    <span class="aar-metric-label">ENGAGEMENT TIME</span>
                    <span class="aar-metric-value">${formatTime(elapsed)}</span>
                </div>
                <div class="aar-metric">
                    <span class="aar-metric-label">ROUND EFFICIENCY</span>
                    <span class="aar-metric-value">${efficiency}%</span>
                </div>
            </div>

            <div class="aar-section-label">AMMUNITION EXPENDITURE</div>
            <div class="aar-defenses">${defenseRows}</div>

            <div class="aar-actions">
                <button class="btn btn-secondary" id="aarClose">DISMISS</button>
                <button class="btn" id="aarRetry">RETRY SCENARIO</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    return new Promise((resolve) => {
        const close = (action) => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
            resolve(action);
        };

        overlay.querySelector('#aarClose').addEventListener('click', () => close('dismiss'));
        overlay.querySelector('#aarRetry').addEventListener('click', () => close('retry'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close('dismiss');
        });
    });
}
