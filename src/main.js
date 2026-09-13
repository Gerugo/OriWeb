// Main Game Controller: Phaser Configuration, Input Management, Camera & HUD
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            c: Phaser.Input.Keyboard.KeyCodes.C,
            x: Phaser.Input.Keyboard.KeyCodes.X,
            b: Phaser.Input.Keyboard.KeyCodes.B,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.moveX = 0;
        this.moveY = 0;
        this.holdingJump = false;
        this.justPressedJump = false;
        this.justPressedDash = false;
        this.holdingBash = false;
        this.attack = false;
        this.stomp = false;
        this.dashDirX = 0;
        this.dashDirY = 0;

        scene.input.mouse.disableContextMenu();
    }

    update() {
        const k = this.keys;
        const c = this.cursors;
        const pointer = this.scene.input.activePointer;

        this.moveX = 0;
        if (c.left.isDown || k.a.isDown) this.moveX -= 1;
        if (c.right.isDown || k.d.isDown) this.moveX += 1;

        this.moveY = 0;
        if (c.up.isDown || k.w.isDown) this.moveY -= 1;
        if (c.down.isDown || k.s.isDown) this.moveY += 1;

        const jumpDown = c.space.isDown || k.space.isDown || c.up.isDown || k.w.isDown;
        this.justPressedJump = Phaser.Input.Keyboard.JustDown(c.space) ||
                               Phaser.Input.Keyboard.JustDown(k.space) ||
                               Phaser.Input.Keyboard.JustDown(c.up) ||
                               Phaser.Input.Keyboard.JustDown(k.w);
        this.holdingJump = jumpDown;

        this.justPressedDash = Phaser.Input.Keyboard.JustDown(k.c) || Phaser.Input.Keyboard.JustDown(k.shift);
        this.dashDirX = this.moveX;
        this.dashDirY = this.moveY;

        // Clean frame-by-frame state (no stuck keys!)
        const isLeftMouseDown = pointer.isDown && (pointer.button === 0 || pointer.leftButtonDown());
        const isRightMouseDown = (pointer.isDown && pointer.button === 2) || pointer.rightButtonDown();

        this.attack = isLeftMouseDown || k.x.isDown;
        this.holdingBash = isRightMouseDown || k.b.isDown || k.e.isDown;

        this.stomp = Phaser.Input.Keyboard.JustDown(k.s) || Phaser.Input.Keyboard.JustDown(c.down);

        if (navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            if (gamepads && gamepads[0]) {
                const pad = gamepads[0];
                const stickX = pad.axes[0];
                const stickY = pad.axes[1];

                if (Math.abs(stickX) > 0.15) this.moveX = stickX;
                if (Math.abs(stickY) > 0.15) this.moveY = stickY;

                if (pad.buttons[0] && pad.buttons[0].pressed) this.holdingJump = true;
                if (pad.buttons[2] && pad.buttons[2].pressed) this.attack = true;
                if ((pad.buttons[5] && pad.buttons[5].pressed) || (pad.buttons[7] && pad.buttons[7].pressed)) this.justPressedDash = true;
                if ((pad.buttons[4] && pad.buttons[4].pressed) || (pad.buttons[6] && pad.buttons[6].pressed)) this.holdingBash = true;
            }
        }
    }
}

class TestLevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestLevelScene' });
    }

    preload() {
        if (window.GAME_ASSETS) {
            for (const key in window.GAME_ASSETS) {
                if (key === 'run_sheet') {
                    this.load.spritesheet('run_sheet', window.GAME_ASSETS[key], {
                        frameWidth: 512,
                        frameHeight: 512
                    });
                } else {
                    this.load.image(key, window.GAME_ASSETS[key]);
                }
            }
        }
    }

    create() {
        this.cfg = window.ORI_CONFIG;

        this.physics.world.setBounds(0, 0, this.cfg.WORLD_WIDTH, this.cfg.WORLD_HEIGHT);
        this.physics.world.gravity.y = this.cfg.GRAVITY;

        this.vfx = new VFXManager(this);
        this.parallax = new ParallaxManager(this);
        this.level = new LevelManager(this);
        this.inputManager = new InputManager(this);

        // Initialize Animation Manager
        if (window.AnimationManager) {
            AnimationManager.setup(this);
        }

        // Spawn Ori Player
        this.player = new Player(this, 260, 1468);

        // Colliders
        this.physics.add.collider(this.player, this.level.platforms);
        this.physics.add.collider(this.player, this.level.destructibles);

        // Camera Follow with Instant Centering & Look-ahead
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.cfg.WORLD_WIDTH, this.cfg.WORLD_HEIGHT);
        cam.centerOn(this.player.x, this.player.y);
        cam.startFollow(this.player, true, 0.08, 0.08);
        cam.setZoom(1.05);
        cam.setBackgroundColor(0x020813);

        this.ambientTimer = 0;
    }

    update(time, delta) {
        this.inputManager.update();
        this.player.update(time, delta);
        this.level.update(time, delta);
        if (this.parallax) {
            this.parallax.update(this.cameras.main.scrollX, this.cameras.main.scrollY);
        }

        // Persistent high-speed ghost trails
        if (this.vfx && this.vfx.updatePersistentTrail) {
            this.vfx.updatePersistentTrail(this.player, delta);
        }

        // Camera look-ahead with vertical smoothing
        const vx = this.player.body.velocity.x;
        const vy = this.player.body.velocity.y;
        const targetOffsetX = Phaser.Math.Clamp(vx * 0.22, -140, 140);
        const targetOffsetY = Phaser.Math.Clamp(vy * 0.06, -50, 35);
        this.cameras.main.followOffset.x = Phaser.Math.Linear(this.cameras.main.followOffset.x, -targetOffsetX, 0.05);
        this.cameras.main.followOffset.y = Phaser.Math.Linear(this.cameras.main.followOffset.y, -targetOffsetY, 0.05);

        this.ambientTimer += delta;
        if (this.ambientTimer > 180) {
            this.ambientTimer = 0;
            const cam = this.cameras.main;
            const rx = cam.worldView.x + Math.random() * cam.worldView.width;
            const ry = cam.worldView.y + Math.random() * cam.worldView.height;
            this.vfx.spawnBurst(rx, ry, 1, 0x38bdf8, 0.3);
        }
    }

    getBashableObjects() {
        const list = [...this.level.lanterns];
        for (const dummy of this.level.dummies) {
            list.push(dummy);
        }
        return list;
    }

    getEnemiesInRange(cx, cy, range) {
        const hits = [];
        if (this.level) {
            for (const dummy of this.level.dummies) {
                if (dummy.active && Phaser.Math.Distance.Between(cx, cy, dummy.x, dummy.y - 35) < range) {
                    hits.push(dummy);
                }
            }
            for (const block of this.level.destructibles) {
                if (block.active && !block.isBroken && Phaser.Math.Distance.Between(cx, cy, block.x, block.y) < range + 30) {
                    hits.push(block);
                }
            }
        }
        return hits;
    }

    onGroundStomp(x, y, range) {
        this.level.checkStompCollisions(x, y, range);
    }

    updateHUD() {
        const hudState = document.getElementById('hud-state');
        const hudVel = document.getElementById('hud-vel');
        const hudDoubleJump = document.getElementById('hud-dj');
        const hudAirDash = document.getElementById('hud-dash');
        const hudCoyote = document.getElementById('hud-coyote');

        if (hudState) hudState.innerText = this.player.state;
        if (hudVel) {
            const vx = Math.round(this.player.body.velocity.x);
            const vy = Math.round(this.player.body.velocity.y);
            hudVel.innerText = `Vx: ${vx} | Vy: ${vy}`;
        }
        if (hudDoubleJump) {
            hudDoubleJump.className = this.player.hasDoubleJump ? 'badge ready' : 'badge used';
            hudDoubleJump.innerText = this.player.hasDoubleJump ? 'Double Jump: READY' : 'Double Jump: USED';
        }
        if (hudAirDash) {
            hudAirDash.className = this.player.dashCooldownTimer <= 0 ? 'badge ready' : 'badge used';
            hudAirDash.innerText = this.player.dashCooldownTimer <= 0 ? 'Dash: READY' : 'Dash: COOLDOWN';
        }
        if (hudCoyote) {
            hudCoyote.className = this.player.coyoteTimer > 0 ? 'badge ready' : 'badge used';
            hudCoyote.innerText = `Coyote: ${Math.max(0, Math.round(this.player.coyoteTimer))}ms`;
        }
    }
}

window.addEventListener('load', () => {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#020813',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: window.ORI_CONFIG.GRAVITY },
                debug: false
            }
        },
        scene: [TestLevelScene],
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    window.game = new Phaser.Game(config);
});