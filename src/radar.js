// ============================================
// AEGIS — Radar Renderer
// Canvas-based radar display with sweep, tracks
// ============================================

export default class Radar {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sweepAngle = 0;
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
        this.center = { x: 0, y: 0 };
        this.radius = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.center = { x: rect.width / 2, y: rect.height / 2 };
        this.radius = Math.min(rect.width, rect.height) * 0.44;
    }

    // -- Drawing primitives --

    drawGrid() {
        const { ctx, center, radius } = this;

        const rings = 4;
        for (let i = 1; i <= rings; i++) {
            const r = (radius / rings) * i;
            ctx.beginPath();
            ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = i === rings
                ? 'rgba(0, 230, 118, 0.15)'
                : 'rgba(0, 230, 118, 0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0, 230, 118, 0.08)';
        ctx.lineWidth = 1;
        for (let angle = 0; angle < Math.PI; angle += Math.PI / 6) {
            ctx.beginPath();
            ctx.moveTo(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius,
            );
            ctx.lineTo(
                center.x - Math.cos(angle) * radius,
                center.y - Math.sin(angle) * radius,
            );
            ctx.stroke();
        }

        ctx.font = '9px SF Mono, Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 230, 118, 0.3)';
        ctx.textAlign = 'left';
        for (let i = 1; i <= rings; i++) {
            const r = (radius / rings) * i;
            const rangeKm = Math.round((i / rings) * 400);
            ctx.fillText(`${rangeKm}km`, center.x + 4, center.y - r + 12);
        }

        ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
        ctx.font = '10px SF Mono, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('N', center.x, center.y - radius - 6);
        ctx.fillText('S', center.x, center.y + radius + 14);
        ctx.textAlign = 'left';
        ctx.fillText('E', center.x + radius + 6, center.y + 4);
        ctx.textAlign = 'right';
        ctx.fillText('W', center.x - radius - 6, center.y + 4);
    }

    drawSweep() {
        const { ctx, center, radius, sweepAngle } = this;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, radius, sweepAngle - 0.4, sweepAngle);
        ctx.closePath();

        const grad = ctx.createLinearGradient(
            center.x + Math.cos(sweepAngle - 0.4) * radius,
            center.y + Math.sin(sweepAngle - 0.4) * radius,
            center.x + Math.cos(sweepAngle) * radius,
            center.y + Math.sin(sweepAngle) * radius,
        );
        grad.addColorStop(0, 'rgba(0, 230, 118, 0)');
        grad.addColorStop(1, 'rgba(0, 230, 118, 0.12)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(
            center.x + Math.cos(sweepAngle) * radius,
            center.y + Math.sin(sweepAngle) * radius,
        );
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawTracks(timestamp) {
        const { ctx, center, radius } = this;

        for (const track of this.tracks) {
            if (track.destroyed) continue;

            const x = center.x + track.x * radius;
            const y = center.y + track.y * radius;

            if (track.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(
                    center.x + track.trail[0].x * radius,
                    center.y + track.trail[0].y * radius,
                );
                for (let i = 1; i < track.trail.length; i++) {
                    ctx.lineTo(
                        center.x + track.trail[i].x * radius,
                        center.y + track.trail[i].y * radius,
                    );
                }
                ctx.strokeStyle = track.color + '40';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            const blipSize = 3 + Math.sin(timestamp * 0.005) * 1;
            ctx.beginPath();
            ctx.arc(x, y, blipSize, 0, Math.PI * 2);
            ctx.fillStyle = track.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, blipSize + 4, 0, Math.PI * 2);
            ctx.fillStyle = track.color + '20';
            ctx.fill();

            ctx.font = '9px SF Mono, Consolas, monospace';
            ctx.fillStyle = track.color + 'CC';
            ctx.textAlign = 'left';
            ctx.fillText(track.label, x + 8, y - 4);
            ctx.fillStyle = track.color + '80';
            ctx.fillText(track.info, x + 8, y + 6);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + track.vx * radius * 8, y + track.vy * radius * 8);
            ctx.strokeStyle = track.color + '60';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawInterceptors() {
        const { ctx, center, radius } = this;

        for (const int of this.interceptors) {
            const x = center.x + int.x * radius;
            const y = center.y + int.y * radius;

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#29b6f6';
            ctx.fill();

            if (int.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(
                    center.x + int.trail[0].x * radius,
                    center.y + int.trail[0].y * radius,
                );
                for (let i = 1; i < int.trail.length; i++) {
                    ctx.lineTo(
                        center.x + int.trail[i].x * radius,
                        center.y + int.trail[i].y * radius,
                    );
                }
                ctx.strokeStyle = 'rgba(41, 182, 246, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    drawExplosions(timestamp) {
        const { ctx, center, radius } = this;

        this.explosions = this.explosions.filter(exp => {
            const age = timestamp - exp.startTime;
            if (age > 800) return false;

            const x = center.x + exp.x * radius;
            const y = center.y + exp.y * radius;
            const progress = age / 800;
            const expRadius = 4 + progress * 16;

            ctx.beginPath();
            ctx.arc(x, y, expRadius, 0, Math.PI * 2);
            ctx.fillStyle = exp.success
                ? `rgba(0, 230, 118, ${0.5 * (1 - progress)})`
                : `rgba(255, 82, 82, ${0.5 * (1 - progress)})`;
            ctx.fill();

            if (age < 150) {
                ctx.beginPath();
                ctx.arc(x, y, expRadius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - age / 150)})`;
                ctx.fill();
            }

            return true;
        });
    }

    drawDefenseOrigin() {
        const { ctx, center } = this;

        ctx.beginPath();
        ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#00e676';
        ctx.fill();
    }

    // -- Main render --

    render(timestamp) {
        const { ctx, canvas } = this;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, width, height);

        this.drawGrid();
        this.drawSweep();
        this.drawTracks(timestamp);
        this.drawInterceptors();
        this.drawExplosions(timestamp);
        this.drawDefenseOrigin();

        this.sweepAngle += 0.012;
        if (this.sweepAngle > Math.PI * 2) {
            this.sweepAngle -= Math.PI * 2;
        }
    }

    // -- Track management --

    addTrack(track) {
        this.tracks.push(track);
    }

    removeTrack(id) {
        this.tracks = this.tracks.filter(t => t.id !== id);
    }

    addInterceptor(interceptor) {
        this.interceptors.push(interceptor);
    }

    removeInterceptor(id) {
        this.interceptors = this.interceptors.filter(i => i.id !== id);
    }

    addExplosion(x, y, success) {
        this.explosions.push({
            x, y, success,
            startTime: performance.now(),
        });
    }

    clearAll() {
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
    }
}
