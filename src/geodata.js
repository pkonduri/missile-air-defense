// ============================================
// AEGIS — Geographic Data
// Launch sites, defense positions, target cities
// ============================================

// Known missile launch sites
export const LAUNCH_SITES = [
    { id: 'iran-shahrud',    name: 'Shahrud, Iran',      lat: 36.4, lon: 55.0 },
    { id: 'iran-tabriz',     name: 'Tabriz, Iran',       lat: 38.1, lon: 46.3 },
    { id: 'nk-sohae',       name: 'Sohae, N. Korea',    lat: 39.7, lon: 124.7 },
    { id: 'nk-sinpo',       name: 'Sinpo, N. Korea',    lat: 40.0, lon: 128.2 },
    { id: 'china-jiuquan',  name: 'Jiuquan, China',     lat: 40.9, lon: 100.3 },
    { id: 'china-hainan',   name: 'Hainan, China',      lat: 19.6, lon: 110.9 },
    { id: 'russia-kapyar',  name: 'Kapustin Yar, RU',   lat: 48.6, lon: 45.8 },
    { id: 'russia-plesetsk',name: 'Plesetsk, Russia',   lat: 62.9, lon: 40.7 },
    { id: 'yemen-sanaa',    name: "Sana'a, Yemen",      lat: 15.4, lon: 44.2 },
    { id: 'syria-damascus', name: 'Damascus, Syria',    lat: 33.5, lon: 36.3 },
    { id: 'pakistan-gwadar', name: 'Gwadar, Pakistan',   lat: 25.1, lon: 62.3 },
];

// Defense system positions (systemId matches DEFENSE_SYSTEMS[].id)
export const DEFENSE_LOCATIONS = [
    { systemId: 'patriot',   lat: 24.7,  lon: 46.7,  name: 'Riyadh',        label: 'PAC-3' },
    { systemId: 'thaad',     lat: 36.0,  lon: 127.0, name: 'Seongju',       label: 'THAAD' },
    { systemId: 'iron-dome', lat: 32.1,  lon: 34.8,  name: 'Tel Aviv',      label: 'IRON DOME' },
    { systemId: 's400',      lat: 34.8,  lon: 32.4,  name: 'Akrotiri',      label: 'S-400' },
    { systemId: 'cram',      lat: 33.3,  lon: 44.4,  name: 'Baghdad',       label: 'C-RAM' },
    { systemId: 'aegis-sm3', lat: 35.3,  lon: 139.7, name: 'Yokosuka',      label: 'AEGIS SM-3' },
];

// Target cities
export const TARGET_CITIES = [
    { name: 'Tel Aviv',     lat: 32.1,  lon: 34.8 },
    { name: 'Riyadh',       lat: 24.7,  lon: 46.7 },
    { name: 'Seoul',        lat: 37.6,  lon: 126.9 },
    { name: 'Tokyo',        lat: 35.7,  lon: 139.7 },
    { name: 'Warsaw',       lat: 52.2,  lon: 21.0 },
    { name: 'Kyiv',         lat: 50.5,  lon: 30.5 },
    { name: 'Taipei',       lat: 25.0,  lon: 121.6 },
    { name: 'Dubai',        lat: 25.2,  lon: 55.3 },
    { name: 'Baghdad',      lat: 33.3,  lon: 44.4 },
    { name: 'Berlin',       lat: 52.5,  lon: 13.4 },
    { name: 'Mumbai',       lat: 19.1,  lon: 72.9 },
    { name: 'Guam',         lat: 13.4,  lon: 144.8 },
];
