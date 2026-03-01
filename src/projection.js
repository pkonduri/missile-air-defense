// ============================================
// AEGIS — Map Projection
// D3-geo Natural Earth projection with theater fit
// ============================================

import { geoNaturalEarth1, geoPath } from 'd3-geo';

// Theater bounding box as a GeoJSON feature
const THEATER_FEATURE = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [-25, -12], [155, -12], [155, 72], [-25, 72], [-25, -12],
        ]],
    },
};

export default class Projection {
    constructor() {
        this._projection = geoNaturalEarth1();
        this._pathGenerator = null;
    }

    setViewport(width, height) {
        const pad = 10;
        this._projection = geoNaturalEarth1()
            .fitExtent(
                [[pad, pad], [width - pad, height - pad]],
                THEATER_FEATURE,
            );
        this._pathGenerator = geoPath(this._projection);
    }

    project(lat, lon) {
        const result = this._projection([lon, lat]);
        if (!result) return { x: -100, y: -100 };
        return { x: result[0], y: result[1] };
    }

    unproject(x, y) {
        const result = this._projection.invert([x, y]);
        if (!result) return { lat: 0, lon: 0 };
        return { lat: result[1], lon: result[0] };
    }

    get pathGenerator() {
        return this._pathGenerator;
    }

    get d3Projection() {
        return this._projection;
    }
}
