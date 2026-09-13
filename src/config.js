// Ori Physics & Mechanics Configuration Tuned for AAA Platformer Feel
window.ORI_CONFIG = {
    // World Dimensions
    WORLD_WIDTH: 4200,
    WORLD_HEIGHT: 1800,
    GRAVITY: 1450,

    // Run & Ground Movement
    RUN_SPEED: 370,
    RUN_ACCEL: 2600,
    RUN_DECEL: 2200,
    AIR_ACCEL: 1800,
    AIR_DECEL: 800,

    // Jump (Empowered AAA Ori Jump Height & Air Control)
    JUMP_VELOCITY: -760,
    VARIABLE_JUMP_TIME: 240, // ms to hold jump for extra soaring lift
    VARIABLE_JUMP_GRAVITY_RATIO: 0.38, // gravity multiplier while holding jump
    COYOTE_TIME: 140, // ms
    JUMP_BUFFER_TIME: 130, // ms

    // Double Jump (High aerial burst)
    DOUBLE_JUMP_VELOCITY: -690,

    // Wall Mechanics (Athletic diagonal chimney wall kick)
    WALL_SLIDE_MAX_SPEED: 85,
    WALL_JUMP_VEL_X: 480,
    WALL_JUMP_VEL_Y: -690,
    WALL_JUMP_INPUT_LOCK: 140, // ms before user can counter-steer

    // Dash
    DASH_SPEED: 820,
    DASH_DURATION: 160, // ms
    DASH_COOLDOWN: 550, // ms
    DASH_TRAIL_INTERVAL: 25, // ms between ghost afterimages

    // Bash (Ori's Signature Mechanic)
    BASH_RANGE: 140,
    BASH_LAUNCH_SPEED: 890,
    BASH_TARGET_RECOIL: 520,
    BASH_SLOWMO_DURATION: 2600, // ms max freeze time if held
    BASH_TIMESCALE: 0.04,

    // Stomp (Ground Pound)
    STOMP_PAUSE_TIME: 150, // ms freeze in air before dive
    STOMP_FALL_SPEED: 980,
    STOMP_SHOCKWAVE_RANGE: 220,

    // Glide (Feather)
    GLIDE_MAX_FALL_SPEED: 95,
    GLIDE_GRAVITY_RATIO: 0.15,

    // Combat: Light Sword Melee Slash (AAA Ori Spirit Edge)
    SLASH_DAMAGE: 45,
    SLASH_COOLDOWN: 260,      // ms between swings
    SLASH_RANGE: 110,         // px reach in front of player
    SLASH_ARC_DEGREES: 140,   // arc coverage
    SLASH_VFX_DURATION: 280,  // ms visible persistence for readable, beautiful slash

    // Visual Palette (Minimalist Test Chamber with Glowing Cyan Highlights)
    COLORS: {
        BG_COLOR: 0xffffff,
        GRID_LINES: 0xe2e8f0,
        PLATFORM_BODY: 0x0f172a,
        PLATFORM_TOP: 0x00f0ff,
        PLATFORM_CORNER: 0x0ea5e9,
        TEXT_PRIMARY: '#0f172a',
        TEXT_MUTED: '#64748b',
        ACCENT_CYAN: '#06b6d4',
        ACCENT_GLOW: '#38bdf8',
        SPIRIT_WHITE: '#ffffff'
    }
};