// ============================================
// AEGIS — Toast Notification System
// Slide-in alerts for critical events
// ============================================

let container = null;

function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

const ICONS = {
    detect: '\u26A0',    // ⚠
    intercept: '\u2713', // ✓
    miss: '\u2717',      // ✗
    engage: '\u26A1',    // ⚡
    system: '\u25C6',    // ◆
    wave: '\u25B8',      // ▸
    critical: '\u2622',  // ☢
};

export function showToast(type, message, duration = 3500) {
    const c = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = ICONS[type] || ICONS.system;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <div class="toast-timer"></div>
    `;

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('visible');
        // Start timer bar
        const timer = toast.querySelector('.toast-timer');
        timer.style.transition = `width ${duration}ms linear`;
        timer.style.width = '0%';
    });

    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // Max 5 toasts
    while (c.children.length > 5) {
        c.removeChild(c.firstChild);
    }
}
