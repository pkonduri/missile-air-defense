// ============================================
// AEGIS — Map Projection
// Equirectangular projection for theater view
// ============================================

export default class Projection {
    constructor() {
        // Theater extents — covers Europe through Pacific
        this.lonMin = -25;
        this.lonMax = 155;
        this.latMin = -12;
        this.latMax = 72;
        this.viewWidth = 0;
        this.viewHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setViewport(width, height) {
        const mapAspect = (this.lonMax - this.lonMin) / (this.latMax - this.latMin);
        const viewAspect = width / height;

        if (viewAspect > mapAspect) {
            this.viewHeight = height * 0.94;
            this.viewWidth = this.viewHeight * mapAspect;
        } else {
            this.viewWidth = width * 0.94;
            this.viewHeight = this.viewWidth / mapAspect;
        }

        this.offsetX = (width - this.viewWidth) / 2;
        this.offsetY = (height - this.viewHeight) / 2;
    }

    project(lat, lon) {
        const x = this.offsetX + ((lon - this.lonMin) / (this.lonMax - this.lonMin)) * this.viewWidth;
        const y = this.offsetY + ((this.latMax - lat) / (this.latMax - this.latMin)) * this.viewHeight;
        return { x, y };
    }

    unproject(x, y) {
        const lon = ((x - this.offsetX) / this.viewWidth) * (this.lonMax - this.lonMin) + this.lonMin;
        const lat = this.latMax - ((y - this.offsetY) / this.viewHeight) * (this.latMax - this.latMin);
        return { lat, lon };
    }
}
