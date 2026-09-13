// Level Manager: Minimalist White Test Arena with Clean Platforms, Distance Grid, and Interactive Test Objects

class Lantern extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'lantern');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5);
        this.setDisplaySize(54, 58);
        this.setDepth(16);

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setCircle(26, 0, 0);

        this.homeX = x;
        this.homeY = y;
        this.recoilVx = 0;
        this.recoilVy = 0;
        this.wobblePhase = Math.random() * Math.PI * 2;

        // Subtle glowing aura using soft_glow texture
        this.glow = scene.add.image(x, y, 'soft_glow');
        this.glow.setDisplaySize(90, 90);
        this.glow.setBlendMode(Phaser.BlendModes.ADD);
        this.glow.setAlpha(0.5);
        this.glow.setDepth(14);
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.wobblePhase += dt * 2.5;

        // Spring recoil physics back to home position
        const dx = this.homeX - this.x;
        const dy = this.homeY - this.y;
        this.recoilVx = (this.recoilVx + dx * 32 * dt) * 0.90;
        this.recoilVy = (this.recoilVy + dy * 32 * dt) * 0.90;

        const bobY = Math.sin(this.wobblePhase) * 6;
        this.x += this.recoilVx * dt;
        this.y += (this.recoilVy * dt) + (bobY * 0.06);

        this.glow.setPosition(this.x, this.y);
    }

    recoil(vx, vy) {
        this.recoilVx = vx;
        this.recoilVy = vy;
        this.scene.vfx.spawnBurst(this.x, this.y, 14, 0x0ea5e9, 1.2);
    }
}

class TrainingDummy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, name = 'Target Dummy') {
        super(scene, x, y, 'burst');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.displayName = name;
        this.hp = 250;
        this.maxHp = 250;
        this.setOrigin(0.5, 1);
        this.setDisplaySize(48, 72);
        this.setDepth(15);
        this.body.setSize(48, 72);
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);

        // Visual dummy shape using graphics
        this.dummyGfx = scene.add.graphics();
        this.dummyGfx.setDepth(15);

        // Floating HP Bar
        this.hpBar = scene.add.graphics();
        this.hpBar.setDepth(17);

        this.label = scene.add.text(x, y - 92, name, {
            fontSize: '12px',
            fontFamily: 'monospace',
            fill: '#64748b'
        }).setOrigin(0.5).setDepth(17);

        this.flashTimer = 0;
        this.redraw();
    }

    redraw() {
        this.dummyGfx.clear();
        const flash = this.flashTimer > 0;
        const color = flash ? 0xffffff : 0x0f172a;
        const rimColor = flash ? 0x38bdf8 : 0x0ea5e9;

        // Base & Head
        this.dummyGfx.fillStyle(color, 1);
        this.dummyGfx.fillRoundedRect(this.x - 22, this.y - 70, 44, 68, 8);
        this.dummyGfx.lineStyle(2.5, rimColor, 1);
        this.dummyGfx.strokeRoundedRect(this.x - 22, this.y - 70, 44, 68, 8);

        // Core target eye
        this.dummyGfx.fillStyle(0x38bdf8, 0.9);
        this.dummyGfx.fillCircle(this.x, this.y - 42, 10);
        this.dummyGfx.fillStyle(0xffffff, 1);
        this.dummyGfx.fillCircle(this.x, this.y - 42, 4);

        // HP Bar
        this.hpBar.clear();
        this.hpBar.fillStyle(0xe2e8f0, 1);
        this.hpBar.fillRect(this.x - 28, this.y - 82, 56, 6);

        const hpRatio = Math.max(0, this.hp / this.maxHp);
        this.hpBar.fillStyle(0x0ea5e9, 1);
        this.hpBar.fillRect(this.x - 28, this.y - 82, 56 * hpRatio, 6);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.flashTimer = 100;
        this.scene.vfx.showDamageText(this.x, this.y - 65, amount);
        this.scene.vfx.spawnBurst(this.x, this.y - 40, 8, 0x38bdf8, 0.9);

        if (this.hp <= 0) {
            this.scene.vfx.spawnShockwave(this.x, this.y - 35, 90, 0x38bdf8);
            this.scene.vfx.spawnBurst(this.x, this.y - 35, 20, 0x0284c7, 1.5);
            this.hp = this.maxHp;
        }
        this.redraw();
    }

    update(time, delta) {
        if (this.flashTimer > 0) {
            this.flashTimer -= delta;
            if (this.flashTimer <= 0) this.redraw();
        }
    }
}

class DestructibleBlock extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, w = 90, h = 40) {
        super(scene, x + w / 2, y + h / 2, 'burst');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.blockW = w;
        this.blockH = h;
        this.blockX = x;
        this.blockY = y;
        this.setOrigin(0.5, 0.5);
        this.body.setSize(w, h);
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.setDepth(14);
        this.setAlpha(0);

        this.art = PlatformArtist.drawDestructiblePlatform(scene, x, y, w, h);
        this.isBroken = false;
    }

    shatter() {
        if (this.isBroken) return;
        this.isBroken = true;
        this.body.enable = false;
        if (this.art && this.art.destroy) {
            this.art.destroy();
        }

        this.scene.vfx.spawnBurst(this.x, this.y, 24, 0xf97316, 2.0);
        this.scene.vfx.spawnShockwave(this.x, this.y, 110, 0xf97316);

        this.scene.time.delayedCall(4000, () => {
            this.isBroken = false;
            this.body.enable = true;
            this.art = PlatformArtist.drawDestructiblePlatform(this.scene, this.blockX, this.blockY, this.blockW, this.blockH);
            this.scene.vfx.spawnShockwave(this.x, this.y, 60, 0x38bdf8);
        });
    }
}

class SpiritFlameProjectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, target) {
        super(scene, x, y, 'spirit_orb');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.target = target;
        this.setOrigin(0.5, 0.5);
        this.setDisplaySize(38, 38);
        this.setDepth(22);
        this.body.setAllowGravity(false);
        this.speed = window.ORI_CONFIG.SPIRIT_FLAME_SPEED;
        this.lifespan = 2000;

        const angle = target ? Phaser.Math.Angle.Between(x, y, target.x, target.y) : (scene.player.facingRight ? 0 : Math.PI);
        this.vx = Math.cos(angle) * 300;
        this.vy = Math.sin(angle) * 300 - 150;
        this.body.setVelocity(this.vx, this.vy);
    }

    update(time, delta) {
        if (!this.active || !this.scene) return;

        const dt = delta / 1000;
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
            return;
        }

        if (this.target && this.target.active) {
            const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y - 35);
            const currentAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, 8.0 * dt);

            this.body.setVelocity(
                Math.cos(newAngle) * this.speed,
                Math.sin(newAngle) * this.speed
            );
            this.setRotation(newAngle);

            if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y - 35) < 32) {
                this.hitTarget();
                return;
            }
        }

        if (this.scene && this.scene.vfx && Math.random() < 0.6) {
            this.scene.vfx.spawnBurst(this.x, this.y, 1, 0x38bdf8, 0.3);
        }
    }

    hitTarget() {
        if (!this.active || !this.scene) return;
        const currentScene = this.scene;
        const hx = this.x;
        const hy = this.y;

        if (this.target && this.target.takeDamage) {
            this.target.takeDamage(window.ORI_CONFIG.SPIRIT_FLAME_DAMAGE);
        }
        if (currentScene && currentScene.vfx) {
            currentScene.vfx.spawnBurst(hx, hy, 10, 0x38bdf8, 1.2);
        }
        this.destroy();
    }
}

class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.cfg = window.ORI_CONFIG;
        this.platforms = scene.physics.add.staticGroup();
        this.lanterns = [];
        this.dummies = [];
        this.destructibles = [];
        this.projectiles = [];

        this.buildMinimalistArena();
    }

    buildMinimalistArena() {
        const bgG = this.scene.add.graphics();
        bgG.setDepth(0);

        // Subtle ambient proving ground grid over parallax
        bgG.lineStyle(1, 0x38bdf8, 0.06);
        for (let x = 0; x <= this.cfg.WORLD_WIDTH; x += 80) {
            bgG.lineBetween(x, 0, x, this.cfg.WORLD_HEIGHT);
        }
        for (let y = 0; y <= this.cfg.WORLD_HEIGHT; y += 80) {
            bgG.lineBetween(0, y, this.cfg.WORLD_WIDTH, y);
        }

        // Base Floor
        this.createPlatform(0, 1500, 4200, 300, 'MAIN TESTING GROUND');

        // Zone 1: Sprint & Run Track (x: 100 .. 1000)
        this.createZoneSign(300, 1440, 'ZONE 1: ACCELERATION & SPRINT TRACK', 'Test run curve, skid, and horizontal dash [C / SHIFT]');
        for (let m = 0; m <= 60; m += 10) {
            this.createDistanceMarker(150 + m * 14, 1500, `${m}m`);
        }

        // Zone 2: Precision Platforming
        this.createZoneSign(1250, 1260, 'ZONE 2: JUMP HEIGHT & DOUBLE JUMP', 'Tap [SPACE] for short hop, HOLD for full height. Press in air for Double Jump.');
        this.createPlatform(1050, 1420, 120, 80);
        this.createPlatform(1220, 1340, 120, 160);
        this.createPlatform(1390, 1240, 120, 260);
        this.createPlatform(1560, 1120, 160, 380);
        this.createPlatform(1760, 1000, 140, 500);

        // Zone 3: Wall Cling & Vertical Chimney
        this.createZoneSign(2150, 840, 'ZONE 3: WALL CLING & VERTICAL SHAFT', 'Cling against wall to slide down. Press [SPACE] to kick off diagonally.');
        this.createPlatform(2000, 600, 60, 900);
        this.createPlatform(2260, 600, 60, 900);
        this.createPlatform(2260, 540, 260, 60);

        // Zone 4: Aerial Bash Course
        this.createZoneSign(2900, 820, 'ZONE 4: AERIAL BASH LANTERN COURSE', 'Hold [RIGHT-CLICK / B / SHIFT] near lantern to aim with mouse, release to slingshot!');
        this.lanterns.push(new Lantern(this.scene, 2600, 1320));
        this.lanterns.push(new Lantern(this.scene, 2800, 1180));
        this.lanterns.push(new Lantern(this.scene, 3020, 1060));
        this.lanterns.push(new Lantern(this.scene, 3240, 1200));

        // Zone 5: Combat Arena
        this.createZoneSign(3650, 1360, 'ZONE 5: COMBAT & STOMP ARENA', 'Press [X / LEFT-CLICK] for Spirit Flame. In air, press [S] to STOMP shatter blocks!');
        this.dummies.push(new TrainingDummy(this.scene, 3550, 1500, 'Combat Dummy A'));
        this.dummies.push(new TrainingDummy(this.scene, 3750, 1500, 'Combat Dummy B'));
        this.dummies.push(new TrainingDummy(this.scene, 4000, 1500, 'Armored Dummy C'));

        this.createPlatform(3620, 1380, 100, 20);
        const block1 = new DestructibleBlock(this.scene, 3720, 1380, 110, 20);
        this.destructibles.push(block1);
        this.createPlatform(3830, 1380, 100, 20);

    }

    createPlatform(x, y, w, h, label = '') {
        const rect = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h);
        this.scene.physics.add.existing(rect, true);
        this.platforms.add(rect);
        
        // Distinguish Floor from Floating Platforms
        if (label === 'MAIN TESTING GROUND' || (w >= 3000 && y >= 1400)) {
            PlatformArtist.drawFloor(this.scene, x, y, w, h);
        } else {
            PlatformArtist.drawPlatform(this.scene, x, y, w, h);
        }

        if (label) {
            this.scene.add.text(x + 20, y + 25, label, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                fill: '#64748b'
            }).setDepth(11);
        }
    }

    createZoneSign(x, y, title, subtitle) {
        const g = this.scene.add.graphics();
        g.setDepth(5);
        g.fillStyle(0xffffff, 0.94);
        g.fillRoundedRect(x - 220, y - 45, 440, 65, 8);
        g.lineStyle(1.5, 0x0ea5e9, 0.6);
        g.strokeRoundedRect(x - 220, y - 45, 440, 65, 8);

        this.scene.add.text(x, y - 28, title, {
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
            fontStyle: 'bold',
            fill: '#0f172a'
        }).setOrigin(0.5).setDepth(6);

        this.scene.add.text(x, y - 6, subtitle, {
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            fill: '#64748b'
        }).setOrigin(0.5).setDepth(6);
    }

    createDistanceMarker(x, y, label) {
        const g = this.scene.add.graphics();
        g.setDepth(5);
        g.lineStyle(1, 0xcbd5e1, 1);
        g.moveTo(x, y);
        g.lineTo(x, y - 25);
        g.strokePath();

        this.scene.add.text(x, y - 35, label, {
            fontSize: '10px',
            fontFamily: 'monospace',
            fill: '#94a3b8'
        }).setOrigin(0.5).setDepth(6);
    }

    update(time, delta) {
        for (const lantern of this.lanterns) {
            lantern.update(time, delta);
        }
        for (const dummy of this.dummies) {
            dummy.update(time, delta);
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(time, delta);
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkStompCollisions(x, y, range) {
        for (const block of this.destructibles) {
            if (!block.isBroken && Math.abs(x - block.x) < range && Math.abs(y - block.y) < 70) {
                block.shatter();
            }
        }
        for (const dummy of this.dummies) {
            if (Math.abs(x - dummy.x) < range && Math.abs(y - dummy.y) < 80) {
                dummy.takeDamage(60);
            }
        }
    }
}
window.LevelManager = LevelManager;
window.Lantern = Lantern;
window.TrainingDummy = TrainingDummy;
window.SpiritFlameProjectile = SpiritFlameProjectile;