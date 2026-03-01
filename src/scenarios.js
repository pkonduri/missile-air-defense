// ============================================
// AEGIS — Attack Scenarios & Waves
// Pre-built combat scenarios with timed waves
// ============================================

export const DIFFICULTY = Object.freeze({
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EXTREME: 'extreme',
});

// Each wave: { delay (ms before this wave fires), threats: [{ threatId, launchSiteId?, targetId? }] }
// threatId references THREATS[].id, launchSiteId references LAUNCH_SITES[].id, targetId references TARGET_CITIES[].name
// If launchSiteId/targetId omitted, the simulation picks randomly (within type constraints)

export const SCENARIOS = [
    {
        id: 'iran-salvo',
        name: 'IRAN SALVO STRIKE',
        description: 'Iran launches a coordinated ballistic and cruise missile salvo targeting Middle Eastern allied cities.',
        difficulty: DIFFICULTY.MEDIUM,
        totalThreats: 8,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — BALLISTIC VOLLEY',
                threats: [
                    { threatId: 'scud-b', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                    { threatId: 'scud-b', launchSiteId: 'iran-tabriz', targetName: 'Tel Aviv' },
                    { threatId: 'df-21', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                ],
            },
            {
                delay: 4000,
                label: 'WAVE 2 — CRUISE FOLLOW-UP',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                    { threatId: 'kalibr', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                ],
            },
            {
                delay: 8000,
                label: 'WAVE 3 — FINAL STRIKE',
                threats: [
                    { threatId: 'scud-b', launchSiteId: 'iran-shahrud', targetName: 'Tel Aviv' },
                    { threatId: 'kalibr', launchSiteId: 'iran-tabriz', targetName: 'Dubai' },
                    { threatId: 'scud-b', launchSiteId: 'iran-tabriz', targetName: 'Riyadh' },
                ],
            },
        ],
    },
    {
        id: 'drone-swarm',
        name: 'DRONE SWARM',
        description: 'Massive wave of low-cost loitering munitions and strike drones from Yemen and Iran saturate air defenses.',
        difficulty: DIFFICULTY.HARD,
        totalThreats: 14,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — SCOUT DRONES',
                threats: [
                    { threatId: 'mohajer-6', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                    { threatId: 'mohajer-6', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                ],
            },
            {
                delay: 3000,
                label: 'WAVE 2 — FIRST SWARM',
                threats: [
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Dubai' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-shahrud', targetName: 'Baghdad' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-tabriz', targetName: 'Tel Aviv' },
                ],
            },
            {
                delay: 6000,
                label: 'WAVE 3 — SECOND SWARM',
                threats: [
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Tel Aviv' },
                ],
            },
            {
                delay: 10000,
                label: 'WAVE 4 — FINAL SWARM',
                threats: [
                    { threatId: 'shahed-136', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Dubai' },
                    { threatId: 'mohajer-6', launchSiteId: 'iran-tabriz', targetName: 'Tel Aviv' },
                    { threatId: 'mohajer-6', launchSiteId: 'iran-shahrud', targetName: 'Baghdad' },
                ],
            },
        ],
    },
    {
        id: 'hypersonic-strike',
        name: 'HYPERSONIC FIRST STRIKE',
        description: 'Russia launches high-speed hypersonic missiles designed to overwhelm advanced defense systems.',
        difficulty: DIFFICULTY.EXTREME,
        totalThreats: 7,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — KINZHAL STRIKE',
                threats: [
                    { threatId: 'kinzhal', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'kinzhal', launchSiteId: 'russia-plesetsk', targetName: 'Warsaw' },
                ],
            },
            {
                delay: 3000,
                label: 'WAVE 2 — ZIRCON SALVO',
                threats: [
                    { threatId: 'zircon', launchSiteId: 'russia-kapyar', targetName: 'Tel Aviv' },
                    { threatId: 'zircon', launchSiteId: 'russia-plesetsk', targetName: 'Berlin' },
                    { threatId: 'kinzhal', launchSiteId: 'russia-kapyar', targetName: 'Riyadh' },
                ],
            },
            {
                delay: 7000,
                label: 'WAVE 3 — FOLLOW-UP',
                threats: [
                    { threatId: 'kinzhal', launchSiteId: 'russia-plesetsk', targetName: 'Kyiv' },
                    { threatId: 'zircon', launchSiteId: 'russia-kapyar', targetName: 'Warsaw' },
                ],
            },
        ],
    },
    {
        id: 'nk-crisis',
        name: 'NORTH KOREA CRISIS',
        description: 'North Korea launches ballistic missiles toward South Korea, Japan, and Guam in an escalating crisis.',
        difficulty: DIFFICULTY.MEDIUM,
        totalThreats: 8,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — OPENING VOLLEY',
                threats: [
                    { threatId: 'scud-b', launchSiteId: 'nk-sohae', targetName: 'Seoul' },
                    { threatId: 'scud-b', launchSiteId: 'nk-sinpo', targetName: 'Seoul' },
                ],
            },
            {
                delay: 5000,
                label: 'WAVE 2 — ESCALATION',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'nk-sinpo', targetName: 'Tokyo' },
                    { threatId: 'scud-b', launchSiteId: 'nk-sohae', targetName: 'Seoul' },
                    { threatId: 'df-21', launchSiteId: 'nk-sohae', targetName: 'Guam' },
                ],
            },
            {
                delay: 10000,
                label: 'WAVE 3 — DESPERATION LAUNCH',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'nk-sinpo', targetName: 'Guam' },
                    { threatId: 'df-21', launchSiteId: 'nk-sohae', targetName: 'Tokyo' },
                    { threatId: 'scud-b', launchSiteId: 'nk-sinpo', targetName: 'Seoul' },
                ],
            },
        ],
    },
    {
        id: 'cruise-barrage',
        name: 'CRUISE MISSILE BARRAGE',
        description: 'Staggered waves of sea-launched cruise missiles approach at low altitude, exploiting radar blind spots.',
        difficulty: DIFFICULTY.MEDIUM,
        totalThreats: 10,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — FIRST SALVO',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'tomahawk', launchSiteId: 'syria-damascus', targetName: 'Baghdad' },
                ],
            },
            {
                delay: 3500,
                label: 'WAVE 2 — SEA-SKIM ATTACK',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'russia-kapyar', targetName: 'Warsaw' },
                    { threatId: 'kalibr', launchSiteId: 'syria-damascus', targetName: 'Tel Aviv' },
                    { threatId: 'tomahawk', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                ],
            },
            {
                delay: 7000,
                label: 'WAVE 3 — SECOND SALVO',
                threats: [
                    { threatId: 'tomahawk', launchSiteId: 'syria-damascus', targetName: 'Riyadh' },
                    { threatId: 'kalibr', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                ],
            },
            {
                delay: 11000,
                label: 'WAVE 4 — FINAL APPROACH',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'tomahawk', launchSiteId: 'syria-damascus', targetName: 'Tel Aviv' },
                    { threatId: 'kalibr', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                ],
            },
        ],
    },
    {
        id: 'multi-vector',
        name: 'MULTI-VECTOR ASSAULT',
        description: 'Coordinated attack using all missile types from multiple theaters — ballistic, cruise, hypersonic, and drones.',
        difficulty: DIFFICULTY.HARD,
        totalThreats: 12,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — DRONE SCREEN',
                threats: [
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                    { threatId: 'mohajer-6', launchSiteId: 'syria-damascus', targetName: 'Tel Aviv' },
                ],
            },
            {
                delay: 3000,
                label: 'WAVE 2 — CRUISE MISSILES',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'tomahawk', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                    { threatId: 'kalibr', launchSiteId: 'syria-damascus', targetName: 'Tel Aviv' },
                ],
            },
            {
                delay: 6000,
                label: 'WAVE 3 — BALLISTIC STRIKE',
                threats: [
                    { threatId: 'scud-b', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                    { threatId: 'df-21', launchSiteId: 'iran-tabriz', targetName: 'Tel Aviv' },
                ],
            },
            {
                delay: 9000,
                label: 'WAVE 4 — HYPERSONIC FINISHER',
                threats: [
                    { threatId: 'kinzhal', launchSiteId: 'russia-kapyar', targetName: 'Warsaw' },
                    { threatId: 'zircon', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'kinzhal', launchSiteId: 'russia-plesetsk', targetName: 'Berlin' },
                    { threatId: 'zircon', launchSiteId: 'russia-plesetsk', targetName: 'Warsaw' },
                ],
            },
        ],
    },
    {
        id: 'saturation',
        name: 'SATURATION ATTACK',
        description: 'Overwhelming assault from all directions designed to exhaust interceptor magazines and break through.',
        difficulty: DIFFICULTY.EXTREME,
        totalThreats: 20,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — OPENING BARRAGE',
                threats: [
                    { threatId: 'scud-b', launchSiteId: 'iran-shahrud', targetName: 'Riyadh' },
                    { threatId: 'scud-b', launchSiteId: 'iran-tabriz', targetName: 'Tel Aviv' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Dubai' },
                    { threatId: 'kalibr', launchSiteId: 'syria-damascus', targetName: 'Baghdad' },
                ],
            },
            {
                delay: 3000,
                label: 'WAVE 2 — SUSTAINED FIRE',
                threats: [
                    { threatId: 'kalibr', launchSiteId: 'russia-kapyar', targetName: 'Kyiv' },
                    { threatId: 'tomahawk', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                    { threatId: 'scud-b', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                    { threatId: 'shahed-136', launchSiteId: 'iran-shahrud', targetName: 'Tel Aviv' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Riyadh' },
                ],
            },
            {
                delay: 6000,
                label: 'WAVE 3 — ESCALATION',
                threats: [
                    { threatId: 'kinzhal', launchSiteId: 'russia-kapyar', targetName: 'Warsaw' },
                    { threatId: 'zircon', launchSiteId: 'russia-plesetsk', targetName: 'Berlin' },
                    { threatId: 'df-21', launchSiteId: 'iran-shahrud', targetName: 'Tel Aviv' },
                    { threatId: 'kalibr', launchSiteId: 'syria-damascus', targetName: 'Tel Aviv' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Dubai' },
                ],
            },
            {
                delay: 10000,
                label: 'WAVE 4 — FINAL PUSH',
                threats: [
                    { threatId: 'kinzhal', launchSiteId: 'russia-plesetsk', targetName: 'Kyiv' },
                    { threatId: 'zircon', launchSiteId: 'russia-kapyar', targetName: 'Riyadh' },
                    { threatId: 'scud-b', launchSiteId: 'iran-shahrud', targetName: 'Dubai' },
                    { threatId: 'kalibr', launchSiteId: 'iran-tabriz', targetName: 'Baghdad' },
                    { threatId: 'shahed-136', launchSiteId: 'yemen-sanaa', targetName: 'Tel Aviv' },
                ],
            },
        ],
    },
    {
        id: 'pacific-storm',
        name: 'PACIFIC STORM',
        description: 'China launches a multi-axis strike against Pacific targets using ballistic missiles and drones from mainland and Hainan.',
        difficulty: DIFFICULTY.HARD,
        totalThreats: 10,
        waves: [
            {
                delay: 0,
                label: 'WAVE 1 — CARRIER KILLER',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'china-jiuquan', targetName: 'Guam' },
                    { threatId: 'df-21', launchSiteId: 'china-hainan', targetName: 'Taipei' },
                ],
            },
            {
                delay: 4000,
                label: 'WAVE 2 — SUPPRESSION',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'china-jiuquan', targetName: 'Seoul' },
                    { threatId: 'df-21', launchSiteId: 'china-hainan', targetName: 'Tokyo' },
                    { threatId: 'scud-b', launchSiteId: 'china-hainan', targetName: 'Taipei' },
                ],
            },
            {
                delay: 8000,
                label: 'WAVE 3 — SECOND STRIKE',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'china-jiuquan', targetName: 'Tokyo' },
                    { threatId: 'df-21', launchSiteId: 'china-hainan', targetName: 'Guam' },
                    { threatId: 'scud-b', launchSiteId: 'china-jiuquan', targetName: 'Seoul' },
                ],
            },
            {
                delay: 12000,
                label: 'WAVE 4 — FINAL SALVO',
                threats: [
                    { threatId: 'df-21', launchSiteId: 'china-hainan', targetName: 'Taipei' },
                    { threatId: 'df-21', launchSiteId: 'china-jiuquan', targetName: 'Guam' },
                ],
            },
        ],
    },
];
