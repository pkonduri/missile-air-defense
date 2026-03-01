// ============================================
// AEGIS — World Map Renderer
// D3-geo powered canvas map with threat overlays
// ============================================

import { geoGraticule } from 'd3-geo';
import * as topojson from 'topojson-client';
import { DEFENSE_LOCATIONS, TARGET_CITIES } from './geodata.js';
import Projection from './projection.js';

export default class WorldMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.projection = new Projection();
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
        this.particles = [];
        this.cityImpacts = [];   // { lat, lon, name, startTime, intensity }
        this.sweepX = 0;

        // Theme (night or day)
        this._theme = 'night';

        // Map data
        this._land = null;
        this._borders = null;
        this._graticule = geoGraticule().step([15, 15])();
        this._loaded = false;

        this._width = 0;
        this._height = 0;

        window.addEventListener('resize', () => this._applyResize());
        this._loadMapData();
    }

    async _loadMapData() {
        try {
            const res = await fetch('/world-110m.json');
            const topology = await res.json();
            this._land = topojson.feature(topology, topology.objects.land);
            this._borders = topojson.mesh(topology, topology.objects.countries, (a, b) => a !== b);
            this._loaded = true;
        } catch (e) {
            console.error('Failed to load map data:', e);
        }
    }

    _applyResize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        // Skip if container has no size yet (layout not ready)
        if (w < 10 || h < 10) return;

        // Skip if dimensions unchanged
        if (w === this._width && h === this._height) return;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this._width = w;
        this._height = h;
        this.projection.setViewport(w, h);
    }

    setTheme(theme) {
        this._theme = theme;
    }

    get _isDay() {
        return this._theme === 'day';
    }

    // -- Drawing methods --

    drawMap() {
        if (!this._loaded) return;

        const { ctx } = this;
        const path = this.projection.pathGenerator;
        path.context(ctx);

        // Land fill
        ctx.beginPath();
        path(this._land);
        ctx.fillStyle = this._isDay ? 'rgba(220, 230, 215, 0.95)' : 'rgba(15, 35, 28, 0.9)';
        ctx.fill();

        // Coastlines
        ctx.beginPath();
        path(this._land);
        ctx.strokeStyle = this._isDay ? 'rgba(0, 130, 70, 0.3)' : 'rgba(0, 230, 118, 0.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Country borders
        ctx.beginPath();
        path(this._borders);
        ctx.strokeStyle = this._isDay ? 'rgba(0, 130, 70, 0.15)' : 'rgba(0, 230, 118, 0.07)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
    }

    drawGraticule() {
        const { ctx } = this;
        const path = this.projection.pathGenerator;
        path.context(ctx);

        ctx.beginPath();
        path(this._graticule);
        ctx.strokeStyle = this._isDay ? 'rgba(0, 100, 60, 0.08)' : 'rgba(0, 230, 118, 0.035)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Axis labels
        ctx.font = '8px SF Mono, Consolas, monospace';
        ctx.fillStyle = this._isDay ? 'rgba(0, 100, 60, 0.3)' : 'rgba(0, 230, 118, 0.18)';

        // Longitude labels along bottom
        ctx.textAlign = 'center';
        for (let lon = 0; lon <= 150; lon += 30) {
            const { x, y } = this.projection.project(-10, lon);
            ctx.fillText(`${lon}°E`, x, y + 12);
        }

        // Latitude labels along left
        ctx.textAlign = 'right';
        for (let lat = 0; lat <= 60; lat += 15) {
            const { x, y } = this.projection.project(lat, -22);
            ctx.fillText(`${lat}°N`, x - 4, y + 3);
        }
    }

    drawDefenseSites() {
        const { ctx, projection } = this;

        for (const site of DEFENSE_LOCATIONS) {
            const { x, y } = projection.project(site.lat, site.lon);
            const r = 5;

            // Range ring
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.strokeStyle = this._isDay ? 'rgba(0, 130, 70, 0.2)' : 'rgba(0, 230, 118, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Bracket marker
            ctx.strokeStyle = this._isDay ? 'rgba(0, 130, 70, 0.7)' : 'rgba(0, 230, 118, 0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - r, y - r + 2); ctx.lineTo(x - r, y - r); ctx.lineTo(x - r + 2, y - r);
            ctx.moveTo(x + r - 2, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y - r + 2);
            ctx.moveTo(x + r, y + r - 2); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r - 2, y + r);
            ctx.moveTo(x - r + 2, y + r); ctx.lineTo(x - r, y + r); ctx.lineTo(x - r, y + r - 2);
            ctx.stroke();

            // Center dot
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = this._isDay ? '#00a85a' : '#00e676';
            ctx.fill();

            // Labels
            ctx.font = '8px SF Mono, Consolas, monospace';
            ctx.fillStyle = this._isDay ? 'rgba(0, 100, 60, 0.7)' : 'rgba(0, 230, 118, 0.5)';
            ctx.textAlign = 'left';
            ctx.fillText(site.label, x + r + 5, y - 2);
            ctx.fillStyle = this._isDay ? 'rgba(0, 100, 60, 0.45)' : 'rgba(0, 230, 118, 0.25)';
            ctx.fillText(site.name, x + r + 5, y + 8);
        }
    }

    drawCityMarkers() {
        const { ctx, projection } = this;

        ctx.font = '7px SF Mono, Consolas, monospace';
        ctx.textAlign = 'center';

        for (const city of TARGET_CITIES) {
            const { x, y } = projection.project(city.lat, city.lon);

            // Dot
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = this._isDay ? 'rgba(30, 45, 60, 0.4)' : 'rgba(200, 214, 229, 0.25)';
            ctx.fill();

            // Name
            ctx.fillStyle = this._isDay ? 'rgba(30, 45, 60, 0.35)' : 'rgba(200, 214, 229, 0.2)';
            ctx.fillText(city.name, x, y - 5);
        }
    }

    drawSweep() {
        const { ctx, _width, _height } = this;

        // Horizontal scanline
        const grad = ctx.createLinearGradient(this.sweepX - 60, 0, this.sweepX, 0);
        grad.addColorStop(0, this._isDay ? 'rgba(0, 130, 70, 0)' : 'rgba(0, 230, 118, 0)');
        grad.addColorStop(1, this._isDay ? 'rgba(0, 130, 70, 0.06)' : 'rgba(0, 230, 118, 0.035)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.sweepX - 60, 0, 60, _height);

        ctx.beginPath();
        ctx.moveTo(this.sweepX, 0);
        ctx.lineTo(this.sweepX, _height);
        ctx.strokeStyle = this._isDay ? 'rgba(0, 130, 70, 0.2)' : 'rgba(0, 230, 118, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        this.sweepX += 1.2;
        if (this.sweepX > _width) this.sweepX = 0;
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

            // Target line (faint dashed line to destination)
            const target = projection.project(track.targetLat, track.targetLon);
            ctx.beginPath();
            ctx.setLineDash([3, 6]);
            ctx.moveTo(x, y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = track.color + '18';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.setLineDash([]);

            // Blip
            const blipSize = 3 + Math.sin(timestamp * 0.005) * 1;
            ctx.beginPath();
            ctx.arc(x, y, blipSize, 0, Math.PI * 2);
            ctx.fillStyle = track.color;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(x, y, blipSize + 6, 0, Math.PI * 2);
            ctx.fillStyle = track.color + '12';
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
            ctx.fillText(track.info, x + 10, y + 6);
        }
    }

    drawInterceptors() {
        const { ctx, projection } = this;

        for (const int of this.interceptors) {
            const { x, y } = projection.project(int.lat, int.lon);

            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
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
            if (age > 1800) return false;

            const { x, y } = projection.project(exp.lat, exp.lon);
            const progress = age / 1800;
            const r = 5 + progress * 32;

            // Shockwave ring
            if (age < 600) {
                const shockR = 8 + (age / 600) * 40;
                ctx.beginPath();
                ctx.arc(x, y, shockR, 0, Math.PI * 2);
                ctx.strokeStyle = exp.success
                    ? `rgba(0, 230, 118, ${0.6 * (1 - age / 600)})`
                    : `rgba(255, 82, 82, ${0.6 * (1 - age / 600)})`;
                ctx.lineWidth = 2.5 * (1 - age / 600);
                ctx.stroke();
            }

            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            if (exp.success) {
                grad.addColorStop(0, `rgba(0, 230, 118, ${0.5 * (1 - progress)})`);
                grad.addColorStop(0.5, `rgba(0, 230, 118, ${0.15 * (1 - progress)})`);
                grad.addColorStop(1, 'rgba(0, 230, 118, 0)');
            } else {
                grad.addColorStop(0, `rgba(255, 82, 82, ${0.5 * (1 - progress)})`);
                grad.addColorStop(0.5, `rgba(255, 82, 82, ${0.15 * (1 - progress)})`);
                grad.addColorStop(1, 'rgba(255, 82, 82, 0)');
            }
            ctx.fillStyle = grad;
            ctx.fill();

            // White flash
            if (age < 150) {
                const flashAlpha = 0.95 * (1 - age / 150);
                ctx.beginPath();
                ctx.arc(x, y, 6 + (age / 150) * 10, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fill();
            }

            // Inner core flicker
            if (age < 800) {
                const coreR = 3 * (1 - age / 800);
                ctx.beginPath();
                ctx.arc(x, y, coreR, 0, Math.PI * 2);
                ctx.fillStyle = exp.success
                    ? `rgba(180, 255, 220, ${0.8 * (1 - age / 800)})`
                    : `rgba(255, 200, 150, ${0.8 * (1 - age / 800)})`;
                ctx.fill();
            }

            return true;
        });
    }

    drawParticles() {
        const { ctx, projection } = this;

        this.particles = this.particles.filter(p => {
            p.lat += p.vy * 0.01;
            p.lon += p.vx * 0.01;
            p.life -= p.decay;
            p.vx *= 0.97;
            p.vy *= 0.97;

            if (p.life <= 0) return false;

            const { x, y } = projection.project(p.lat, p.lon);
            ctx.beginPath();
            ctx.arc(x, y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.round(p.life * 200).toString(16).padStart(2, '0');
            ctx.fill();

            return true;
        });
    }

    drawCityImpacts(timestamp) {
        const { ctx, projection } = this;

        this.cityImpacts = this.cityImpacts.filter(impact => {
            const age = timestamp - impact.startTime;
            if (age > 8000) return false;

            const { x, y } = projection.project(impact.lat, impact.lon);
            const progress = age / 8000;

            // Pulsing red glow around impacted city
            const pulseR = 8 + Math.sin(age * 0.008) * 4;
            const alpha = 0.4 * (1 - progress);
            ctx.beginPath();
            ctx.arc(x, y, pulseR, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pulseR);
            grad.addColorStop(0, `rgba(255, 82, 82, ${alpha})`);
            grad.addColorStop(0.6, `rgba(255, 50, 20, ${alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(255, 50, 20, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            // Fire flicker particles
            if (age < 5000) {
                for (let i = 0; i < 3; i++) {
                    const fx = x + (Math.random() - 0.5) * 10;
                    const fy = y + (Math.random() - 0.5) * 10 - Math.random() * 5;
                    const fr = 1 + Math.random() * 2;
                    ctx.beginPath();
                    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${200 + Math.random() * 55}, ${80 + Math.random() * 80}, 20, ${0.3 * (1 - progress)})`;
                    ctx.fill();
                }
            }

            // "IMPACT" label
            if (age < 3000) {
                ctx.font = 'bold 10px SF Mono, Consolas, monospace';
                ctx.fillStyle = `rgba(255, 82, 82, ${0.8 * (1 - age / 3000)})`;
                ctx.textAlign = 'center';
                ctx.fillText('IMPACT', x, y - 14);
            }

            return true;
        });
    }

    // -- Main render --

    render(timestamp) {
        // Re-check size every frame to catch late layout
        this._applyResize();

        const { ctx, _width, _height } = this;
        if (_width < 10 || _height < 10) return;

        ctx.clearRect(0, 0, _width, _height);

        // Ocean
        ctx.fillStyle = this._isDay ? '#c8d6e5' : '#080d12';
        ctx.fillRect(0, 0, _width, _height);

        this.drawGraticule();
        this.drawMap();
        this.drawSweep();
        this.drawCityImpacts(timestamp);
        this.drawCityMarkers();
        this.drawDefenseSites();
        this.drawTracks(timestamp);
        this.drawInterceptors();
        this.drawExplosions(timestamp);
        this.drawParticles();
    }

    // -- Track management (same API as before) --

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

        // Spawn particles for dramatic effect
        const count = success ? 18 : 24;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 0.3 + Math.random() * 1.2;
            this.particles.push({
                lat, lon,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.008 + Math.random() * 0.012,
                size: 1.5 + Math.random() * 2.5,
                color: success ? '#00e676' : '#ff5252',
            });
        }
    }

    addCityImpact(lat, lon, name) {
        this.cityImpacts.push({
            lat, lon, name,
            startTime: performance.now(),
            intensity: 1.0,
        });
    }

    clearAll() {
        this.tracks = [];
        this.interceptors = [];
        this.explosions = [];
        this.particles = [];
        this.cityImpacts = [];
    }
}
