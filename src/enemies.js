// Enemy Management System for Ori Mechanics Proving Ground
// Includes: Base Enemy, Skeeto (Aerial), Crawler (Patrol Beetle), Spitter (Turret), and Corrupted Spore

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, hp = 100, displayW = 64, displayH = 64) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = hp;
        this.maxHp = hp;
        this.displayW = displayW;
        this.displayH = displayH;
        this.setDisplaySize(displayW, displayH);
        this.setDepth(16);

        this.flashTimer = 0;
        this.isDead = false;
        this.isBashable = true;
        this.homeX = x;
        this.homeY = y;

        // Floating HP bar
        this.hpBar = scene.add.graphics();
        this.hpBar.setDepth(17);
        this.hpBarVisibleTimer = 0;
    }

    takeDamage(amount, kx = 0, ky = 0) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - amount);
        this.flashTimer = 120;
        this.hpBarVisibleTimer = 2500; // show bar for 2.5s

        // Apply knockback if movable
        if (this.body && !this.body.immovable) {
            this.body.setVelocity(kx, ky);
        }

        // Damage number & spark
        if (this.scene.vfx) {
            this.scene.vfx.showDamageText(this.x, this.y - this.displayH * 0.5, amount);
            this.scene.vfx.spawnBurst(this.x, this.y, 10, 0xa855f7, 1.2);
            this.scene.vfx.spawnBurst(this.x, this.y, 6, 0xffffff, 0.9);
        }

        if (this.hp <= 0) {
            this.die();
        } else {
            this.drawHpBar();
        }
    }

    drawHpBar() {
        this.hpBar.clear();
        if (this.hpBarVisibleTimer <= 0 || this.isDead) return;

        const barW = Math.max(40, this.displayW * 0.75);
        const barH = 5;
        const barX = this.x - barW / 2;
        const barY = this.y - (this.displayH * 0.6) - 10;

        // Background
        this.hpBar.fillStyle(0x0f172a, 0.85);
        this.hpBar.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);

        // Health fill
        const ratio = Math.max(0, this.hp / this.maxHp);
        const color = ratio > 0.4 ? 0xa855f7 : 0xef4444;
        this.hpBar.fillStyle(color, 1);
        this.hpBar.fillRoundedRect(barX, barY, barW * ratio, barH, 2);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        if (this.scene.vfx) {
            this.scene.vfx.spawnShockwave(this.x, this.y, 90, 0xa855f7);
            this.scene.vfx.spawnBurst(this.x, this.y, 22, 0xc084fc, 1.6);
            this.scene.vfx.spawnBurst(this.x, this.y, 12, 0x00f0ff, 1.3);
        }

        // Camera micro punch
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(70, 0.003);
        }

        this.hpBar.destroy();
        this.destroy();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.flashTimer > 0) {
            this.flashTimer -= delta;
            this.setTint(0xffffff);
            if (this.flashTimer <= 0) this.clearTint();
        }

        if (this.hpBarVisibleTimer > 0) {
            this.hpBarVisibleTimer -= delta;
            this.drawHpBar();
        }
    }
}

// ----------------------------------------------------------------------------------
// SkeetoEnemy: Corrupted flying insect fiend that hovers and dive-bombs Ori
// ----------------------------------------------------------------------------------
class SkeetoEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_skeeto', 90, 64, 60);
        this.body.setAllowGravity(false);
        this.body.setCircle(26, 6, 6);

        this.aiState = 'HOVER';
        this.hoverAngle = Math.random() * Math.PI * 2;
        this.stateTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.recoilVx = 0;
        this.recoilVy = 0;

        // Wing hum / purple wisp glow
        this.aura = scene.add.image(x, y, 'soft_glow');
        this.aura.setDisplaySize(75, 75);
        this.aura.setBlendMode(Phaser.BlendModes.ADD);
        this.aura.setAlpha(0.35);
        this.aura.setDepth(15);
        this.aura.setTint(0xa855f7);
    }

    update(time, delta) {
        if (this.isDead) return;
        const dt = delta / 1000;
        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Recoil decay
        if (Math.abs(this.recoilVx) > 5 || Math.abs(this.recoilVy) > 5) {
            this.x += this.recoilVx * dt;
            this.y += this.recoilVy * dt;
            this.recoilVx *= 0.88;
            this.recoilVy *= 0.88;
        }

        switch (this.aiState) {
            case 'HOVER':
                this.hoverAngle += dt * 3.5;
                const bobY = Math.sin(this.hoverAngle) * 28;
                const targetHoverY = this.homeY + bobY;
                this.y = Phaser.Math.Linear(this.y, targetHoverY, 0.08);
                this.x = Phaser.Math.Linear(this.x, this.homeX, 0.04);

                // Detect player
                if (dist < 340 && player.state !== 'RESPAWN') {
                    this.aiState = 'TELEGRAPH';
                    this.stateTimer = 420; // ms warning before dive
                    this.targetX = player.x;
                    this.targetY = player.y;
                }
                break;

            case 'TELEGRAPH':
                this.stateTimer -= delta;
                // Vibrating warning anticipation
                this.x += (Math.random() - 0.5) * 4;
                this.setTint(0xef4444);
                if (this.stateTimer <= 0) {
                    this.clearTint();
                    this.aiState = 'DIVE';
                    this.stateTimer = 1100; // max dive duration

                    // Aim dive vector
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                    const speed = 360;
                    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                }
                break;

            case 'DIVE':
                this.stateTimer -= delta;
                // Leave purple speed sparks
                if (Math.random() < 0.3) {
                    this.scene.vfx.spawnBurst(this.x, this.y, 1, 0xc084fc, 0.5);
                }

                if (this.stateTimer <= 0 || dist < 40 || this.body.blocked.down || this.body.blocked.left || this.body.blocked.right) {
                    this.aiState = 'RESET';
                    this.stateTimer = 800;
                    this.body.setVelocity(0, 0);
                }
                break;

            case 'RESET':
                this.stateTimer -= delta;
                this.body.setVelocity(0, 0);
                this.x = Phaser.Math.Linear(this.x, this.homeX, 0.04);
                this.y = Phaser.Math.Linear(this.y, this.homeY, 0.05);
                if (this.stateTimer <= 0) {
                    this.aiState = 'HOVER';
                }
                break;
        }

        // Facing direction (Ori sprites default face left for enemy)
        if (this.body.velocity.x !== 0) {
            this.setFlipX(this.body.velocity.x > 0);
        } else {
            this.setFlipX(player.x > this.x);
        }

        this.aura.setPosition(this.x, this.y);
    }

    recoil(vx, vy) {
        this.recoilVx = vx;
        this.recoilVy = vy;
        this.aiState = 'RESET';
        this.stateTimer = 900;
        this.body.setVelocity(0, 0);
    }

    die() {
        if (this.aura) this.aura.destroy();
        super.die();
    }
}

// ----------------------------------------------------------------------------------
// CrawlerEnemy: Armored terrestrial beetle patrolling platforms, vulnerable to Stomp
// ----------------------------------------------------------------------------------
class CrawlerEnemy extends Enemy {
    constructor(scene, x, y, patrolDist = 280) {
        super(scene, x, y, 'enemy_crawler', 120, 78, 56);
        this.body.setAllowGravity(true);
        this.body.setSize(68, 48);
        this.body.setOffset(5, 8);

        this.patrolStartX = x - patrolDist / 2;
        this.patrolEndX = x + patrolDist / 2;
        this.patrolSpeed = 80;
        this.direction = 1;
        this.isStunned = false;
        this.stunTimer = 0;
    }

    update(time, delta) {
        if (this.isDead) return;
        const player = this.scene.player;

        // Stunned by Stomp
        if (this.isStunned) {
            this.stunTimer -= delta;
            this.body.setVelocityX(0);
            this.setTint(0x38bdf8);
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.clearTint();
            }
            return;
        }

        const onGround = this.body.blocked.down;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        const isSamePlatform = Math.abs(this.y - player.y) < 50;

        // Charge if player is in front on same platform
        if (isSamePlatform && dist < 240 && ((player.x > this.x && this.direction === 1) || (player.x < this.x && this.direction === -1))) {
            this.body.setVelocityX(this.direction * 220);
            if (Math.random() < 0.2) {
                this.scene.vfx.spawnBurst(this.x, this.y + 20, 1, 0xf59e0b, 0.4);
            }
        } else {
            // Normal patrol
            this.body.setVelocityX(this.direction * this.patrolSpeed);
            if (this.x <= this.patrolStartX && this.direction === -1) {
                this.direction = 1;
            } else if (this.x >= this.patrolEndX && this.direction === 1) {
                this.direction = -1;
            }
        }

        // Turn around on wall hit
        if (this.body.blocked.left) this.direction = 1;
        if (this.body.blocked.right) this.direction = -1;

        this.setFlipX(this.direction > 0);
    }

    stun(duration = 1200) {
        this.isStunned = true;
        this.stunTimer = duration;
        this.body.setVelocity(0, -180);
        this.scene.vfx.spawnBurst(this.x, this.y - 15, 12, 0x38bdf8, 1.2);
    }
}

// ----------------------------------------------------------------------------------
// CorruptedSpore: Spat projectile from Spitter. Fully Bashable & redirectable!
// ----------------------------------------------------------------------------------
class CorruptedSpore extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, targetX, targetY) {
        super(scene, x, y, 'spore_projectile');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(34, 34);
        this.setDepth(18);
        this.body.setAllowGravity(false);
        this.body.setCircle(14, 2, 2);

        this.isBashable = true;
        this.isRedirected = false;
        this.damage = 30;
        this.lifeTimer = 5000;

        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = 210;
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.setRotation(angle);

        // Glowing core
        this.glow = scene.add.image(x, y, 'soft_glow');
        this.glow.setDisplaySize(50, 50);
        this.glow.setBlendMode(Phaser.BlendModes.ADD);
        this.glow.setTint(0xa855f7);
        this.glow.setAlpha(0.6);
        this.glow.setDepth(17);
    }

    update(time, delta) {
        this.lifeTimer -= delta;
        if (this.lifeTimer <= 0 || this.body.blocked.down || this.body.blocked.left || this.body.blocked.right || this.body.blocked.up) {
            this.explode();
            return;
        }

        this.glow.setPosition(this.x, this.y);

        // Particle trail
        if (Math.random() < 0.35) {
            const color = this.isRedirected ? 0x00f0ff : 0xc084fc;
            this.scene.vfx.spawnBurst(this.x, this.y, 1, color, 0.4);
        }

        // If redirected by Bash, hit enemies!
        if (this.isRedirected) {
            const enemies = this.scene.level.enemies;
            for (const enemy of enemies) {
                if (!enemy.isDead && Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < 40) {
                    enemy.takeDamage(100, this.body.velocity.x * 0.5, -200);
                    this.explode();
                    return;
                }
            }
        }
    }

    recoil(vx, vy) {
        // Called when player BASHES off the spore
        this.isRedirected = true;
        this.body.setVelocity(vx, vy);
        this.setRotation(Math.atan2(vy, vx));
        this.glow.setTint(0x00f0ff);
        this.scene.vfx.spawnShockwave(this.x, this.y, 60, 0x00f0ff);
    }

    explode() {
        if (this.scene.vfx) {
            const color = this.isRedirected ? 0x00f0ff : 0xa855f7;
            this.scene.vfx.spawnBurst(this.x, this.y, 12, color, 1.1);
            this.scene.vfx.spawnBurst(this.x, this.y, 5, 0xffffff, 0.8);
        }
        if (this.glow) this.glow.destroy();
        this.destroy();
    }
}

// ----------------------------------------------------------------------------------
// SpitterEnemy: Corrupted stationary turret plant rooted on platforms
// ----------------------------------------------------------------------------------
class SpitterEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_spitter', 110, 72, 74);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setSize(58, 64);
        this.body.setOffset(7, 10);

        this.spitCooldown = 2600;
        this.spitTimer = 1200; // initial delay
        this.projectiles = [];
    }

    update(time, delta) {
        if (this.isDead) return;
        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        this.setFlipX(player.x > this.x);

        // Spit loop
        if (dist < 550 && player.state !== 'RESPAWN') {
            this.spitTimer -= delta;

            // Telegraph: squash & stretch anticipating spit
            if (this.spitTimer < 400 && this.spitTimer > 0) {
                this.setScale(0.92, 1.15);
                this.setTint(0xf43f5e);
            }

            if (this.spitTimer <= 0) {
                this.clearTint();
                this.setScale(1.15, 0.90);
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 250,
                    ease: 'Back.easeOut'
                });

                // Spawn Corrupted Spore projectile
                const spawnX = this.x + (player.x > this.x ? 25 : -25);
                const spawnY = this.y - 15;
                const spore = new CorruptedSpore(this.scene, spawnX, spawnY, player.x, player.y - 10);
                this.scene.level.spores.push(spore);
                this.scene.vfx.spawnBurst(spawnX, spawnY, 8, 0xa855f7, 0.9);

                this.spitTimer = this.spitCooldown;
            }
        }
    }
}

window.Enemy = Enemy;
window.SkeetoEnemy = SkeetoEnemy;
window.CrawlerEnemy = CrawlerEnemy;
window.SpitterEnemy = SpitterEnemy;
window.CorruptedSpore = CorruptedSpore;