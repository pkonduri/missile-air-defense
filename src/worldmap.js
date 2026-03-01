// ============================================
// AEGIS — World Map Renderer
// Canvas-based map with threat tracks, defense sites
// ============================================

import { WORLD_POLYGONS, DEFENSE_LOCATIONS, TARGET_CITIES } from './geodata.js';
import Projection from './projection.js';

export default class WorldMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.projection = new Projection();
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
        this.sweepX = 0;

        // Cached Path2D objects for land polygons
        this._mapPaths = null;

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

        this._width = rect.width;
        this._height = rect.height;
        this.projection.setViewport(rect.width, rect.height);
        this._buildMapPaths();
    }

    // -- Pre-build Path2D cache for performance --

    _buildMapPaths() {
        this._mapPaths = WORLD_POLYGONS.map(ring => {
            const path = new Path2D();
            if (ring.length === 0) return path;
            const first = this.projection.project(ring[0][1], ring[0][0]);
            path.moveTo(first.x, first.y);
            for (let i = 1; i < ring.length; i++) {
                const p = this.projection.project(ring[i][1], ring[i][0]);
                path.lineTo(p.x, p.y);
            }
            path.closePath();
            return path;
        });
    }

    // -- Drawing methods --

    drawMap() {
        const { ctx } = this;

        // Land masses
        for (const path of this._mapPaths) {
            ctx.fillStyle = 'rgba(18, 38, 32, 0.85)';
            ctx.fill(path);
            ctx.strokeStyle = 'rgba(0, 230, 118, 0.12)';
            ctx.lineWidth = 0.8;
            ctx.stroke(path);
        }
    }

    drawGraticule() {
        const { ctx, projection, _width, _height } = this;

        ctx.strokeStyle = 'rgba(0, 230, 118, 0.04)';
        ctx.lineWidth = 0.5;

        // Longitude lines every 30°
        for (let lon = -30; lon <= 150; lon += 30) {
            const top = projection.project(projection.latMax, lon);
            const bot = projection.project(projection.latMin, lon);
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(bot.x, bot.y);
            ctx.stroke();
        }

        // Latitude lines every 15°
        for (let lat = -15; lat <= 75; lat += 15) {
            const left = projection.project(lat, projection.lonMin);
            const right = projection.project(lat, projection.lonMax);
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }

        // Labels
        ctx.font = '8px SF Mono, Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 230, 118, 0.18)';
        ctx.textAlign = 'center';
        for (let lon = 0; lon <= 150; lon += 30) {
            const p = projection.project(projection.latMin, lon);
            ctx.fillText(`${lon}°E`, p.x, p.y + 10);
        }
        ctx.textAlign = 'right';
        for (let lat = 0; lat <= 60; lat += 15) {
            const p = projection.project(lat, projection.lonMin);
            ctx.fillText(`${lat}°N`, p.x - 4, p.y + 3);
        }
    }

    drawDefenseSites() {
        const { ctx, projection } = this;

        for (const site of DEFENSE_LOCATIONS) {
            const { x, y } = projection.project(site.lat, site.lon);
            const r = 5;

            // Range ring (subtle)
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 230, 118, 0.12)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Bracket marker
            ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            // Top-left corner
            ctx.moveTo(x - r, y - r + 2); ctx.lineTo(x - r, y - r); ctx.lineTo(x - r + 2, y - r);
            // Top-right corner
            ctx.moveTo(x + r - 2, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y - r + 2);
            // Bottom-right corner
            ctx.moveTo(x + r, y + r - 2); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r - 2, y + r);
            // Bottom-left corner
            ctx.moveTo(x - r + 2, y + r); ctx.lineTo(x - r, y + r); ctx.lineTo(x - r, y + r - 2);
            ctx.stroke();

            // Center dot
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00e676';
            ctx.fill();

            // Label
            ctx.font = '8px SF Mono, Consolas, monospace';
            ctx.fillStyle = 'rgba(0, 230, 118, 0.45)';
            ctx.textAlign = 'left';
            ctx.fillText(site.label, x + r + 4, y - 2);
            ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
            ctx.fillText(site.name, x + r + 4, y + 7);
        }
    }

    drawCityMarkers() {
        const { ctx, projection } = this;

        ctx.fillStyle = 'rgba(200, 214, 229, 0.2)';
        ctx.font = '7px SF Mono, Consolas, monospace';
        ctx.textAlign = 'center';

        for (const city of TARGET_CITIES) {
            const { x, y } = projection.project(city.lat, city.lon);

            // Small dot
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillText(city.name, x, y - 5);
        }
    }

    drawSweep() {
        const { ctx, _width, _height } = this;

        // Horizontal scanline moving left to right
        const grad = ctx.createLinearGradient(this.sweepX - 50, 0, this.sweepX, 0);
        grad.addColorStop(0, 'rgba(0, 230, 118, 0)');
        grad.addColorStop(1, 'rgba(0, 230, 118, 0.04)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.sweepX - 50, 0, 50, _height);

        ctx.beginPath();
        ctx.moveTo(this.sweepX, 0);
        ctx.lineTo(this.sweepX, _height);
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Advance
        this.sweepX += 1.5;
        if (this.sweepX > _width) {
            this.sweepX = 0;
        }
    }

    drawTracks(timestamp) {
        const { ctx, projection } = this;

        for (const track of this.tracks) {
            if (track.destroyed) continue;

            const { x, y } = projection.project(track.lat, track.lon);

            // Trail
            if (track.trail.length > 1) {
                ctx.beginPath();
                const p0 = projection.project(track.trail[0].lat, track.trail[0].lon);
                ctx.moveTo(p0.x, p0.y);
                for (let i = 1; i < track.trail.length; i++) {
                    const p = projection.project(track.trail[i].lat, track.trail[i].lon);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = track.color + '50';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Blip
            const blipSize = 3 + Math.sin(timestamp * 0.005) * 1;
            ctx.beginPath();
            ctx.arc(x, y, blipSize, 0, Math.PI * 2);
            ctx.fillStyle = track.color;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(x, y, blipSize + 5, 0, Math.PI * 2);
            ctx.fillStyle = track.color + '15';
            ctx.fill();

            // Velocity vector
            const vEnd = projection.project(
                track.lat + track.dlat * 120,
                track.lon + track.dlon * 120,
            );
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(vEnd.x, vEnd.y);
            ctx.strokeStyle = track.color + '50';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            ctx.font = '9px SF Mono, Consolas, monospace';
            ctx.fillStyle = track.color + 'DD';
            ctx.textAlign = 'left';
            ctx.fillText(track.label, x + 10, y - 5);
            ctx.fillStyle = track.color + '88';
            ctx.fillText(track.info, x + 10, y + 5);
        }
    }

    drawInterceptors() {
        const { ctx, projection } = this;

        for (const int of this.interceptors) {
            const { x, y } = projection.project(int.lat, int.lon);

            // Interceptor dot
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#29b6f6';
            ctx.fill();

            // Trail
            if (int.trail.length > 1) {
                ctx.beginPath();
                const p0 = projection.project(int.trail[0].lat, int.trail[0].lon);
                ctx.moveTo(p0.x, p0.y);
                for (let i = 1; i < int.trail.length; i++) {
                    const p = projection.project(int.trail[i].lat, int.trail[i].lon);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(41, 182, 246, 0.35)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    drawExplosions(timestamp) {
        const { ctx, projection } = this;

        this.explosions = this.explosions.filter(exp => {
            const age = timestamp - exp.startTime;
            if (age > 1000) return false;

            const { x, y } = projection.project(exp.lat, exp.lon);
            const progress = age / 1000;
            const r = 5 + progress * 20;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = exp.success
                ? `rgba(0, 230, 118, ${0.5 * (1 - progress)})`
                : `rgba(255, 82, 82, ${0.5 * (1 - progress)})`;
            ctx.fill();

            if (age < 200) {
                ctx.beginPath();
                ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - age / 200)})`;
                ctx.fill();
            }

            return true;
        });
    }

    // -- Main render --

    render(timestamp) {
        const { ctx, _width, _height } = this;

        ctx.clearRect(0, 0, _width, _height);

        // Ocean background
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, _width, _height);

        this.drawMap();
        this.drawGraticule();
        this.drawSweep();
        this.drawDefenseSites();
        this.drawCityMarkers();
        this.drawTracks(timestamp);
        this.drawInterceptors();
        this.drawExplosions(timestamp);
    }

    // -- Track management (same API as Radar) --

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

    addExplosion(lat, lon, success) {
        this.explosions.push({
            lat, lon, success,
            startTime: performance.now(),
        });
    }

    clearAll() {
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
    }
}
