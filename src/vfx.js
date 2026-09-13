// VFX Manager: Particle Emitters, Shockwaves, Bash Aim Arrows, and Ghost Afterimages
class VFXManager {
    constructor(scene) {
        this.scene = scene;
        this.shockwaves = [];
        this.ghostTrails = [];
        this.damageTexts = [];

        this.initParticles();
        this.initAimArrow();
    }

    initParticles() {
        // Create soft radial glow texture
        if (!this.scene.textures.exists('soft_glow')) {
            const canvas = this.scene.textures.createCanvas('soft_glow', 128, 128);
            const ctx = canvas.getContext();
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
            grad.addColorStop(0.35, 'rgba(14, 165, 233, 0.45)');
            grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.15)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
            canvas.refresh();
        }

        // Spirit motes ambient / running
        if (!this.scene.textures.exists('vfx_dot')) {
            const sparkGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            sparkGraphics.fillStyle(0x38bdf8, 1);
            sparkGraphics.fillCircle(4, 4, 4);
            sparkGraphics.generateTexture('vfx_dot', 8, 8);
        }
    }

    initAimArrow() {
        // Bash Aim Arrow graphics
        this.arrowGraphics = this.scene.add.graphics();
        this.arrowGraphics.setDepth(100);
        this.arrowGraphics.setVisible(false);

        // Bash Target Ring
        this.targetRing = this.scene.add.graphics();
        this.targetRing.setDepth(99);
        this.targetRing.setVisible(false);
    }

    createGhostTrail(player) {
        const ghost = this.scene.add.sprite(player.x, player.y, player.texture.key);
        ghost.setDisplaySize(player.displayWidth, player.displayHeight);
        ghost.setOrigin(0.5, 0.5);
        ghost.setFlipX(player.flipX);
        ghost.setTint(0x38bdf8);
        ghost.setAlpha(0.6);
        ghost.setBlendMode(Phaser.BlendModes.ADD);
        ghost.setDepth(player.depth - 1);

        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: ghost.scaleX * 1.15,
            scaleY: ghost.scaleY * 1.15,
            duration: 320,
            ease: 'Sine.easeOut',
            onComplete: () => ghost.destroy()
        });
    }

    spawnBurst(x, y, count = 12, tint = 0x38bdf8, speedMultiplier = 1) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
            const speed = (80 + Math.random() * 140) * speedMultiplier;
            const spark = this.scene.add.image(x, y, 'vfx_dot');
            spark.setTint(tint);
            spark.setBlendMode(Phaser.BlendModes.ADD);
            spark.setDepth(25);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnShockwave(x, y, maxRadius = 140, color = 0x06b6d4) {
        const ring = this.scene.add.graphics();
        ring.setDepth(20);

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 380,
            ease: 'Cubic.easeOut',
            onUpdate: (tween) => {
                const t = tween.getValue();
                ring.clear();
                const radius = 8 + (maxRadius - 8) * t;
                const alpha = (1 - t) * 0.9;
                ring.lineStyle(4 * (1 - t) + 1, color, alpha);
                ring.strokeCircle(x, y, radius);
            },
            onComplete: () => ring.destroy()
        });
    }

    spawnGroundStompShockwave(x, y) {
        this.spawnShockwave(x, y, 160, 0x38bdf8);
        this.spawnBurst(x, y - 5, 24, 0x0284c7, 1.8);
        this.scene.cameras.main.shake(250, 0.015);
    }

    showDamageText(x, y, amount, isCrit = false) {
        const text = this.scene.add.text(x, y - 20, `${amount}`, {
            fontSize: isCrit ? '22px' : '18px',
            fontFamily: 'system-ui, sans-serif',
            fontStyle: 'bold',
            fill: isCrit ? '#f59e0b' : '#0284c7',
            stroke: '#ffffff',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(50);

        this.scene.tweens.add({
            targets: text,
            y: y - 70,
            x: x + (Math.random() * 40 - 20),
            alpha: 0,
            scale: isCrit ? 1.4 : 1.1,
            duration: 650,
            ease: 'Back.easeOut',
            onComplete: () => text.destroy()
        });
    }

    updateBashAim(originX, originY, angleRad, active) {
        if (!active) {
            this.arrowGraphics.clear();
            this.arrowGraphics.setVisible(false);
            return;
        }

        this.arrowGraphics.setVisible(true);
        this.arrowGraphics.clear();

        const length = 110;
        const targetX = originX + Math.cos(angleRad) * length;
        const targetY = originY + Math.sin(angleRad) * length;

        // Player launch arrow (glowing cyan)
        this.arrowGraphics.lineStyle(6, 0x38bdf8, 0.9);
        this.arrowGraphics.beginPath();
        this.arrowGraphics.moveTo(originX, originY);
        this.arrowGraphics.lineTo(targetX, targetY);
        this.arrowGraphics.strokePath();

        // Arrow head
        const headAngle1 = angleRad + Math.PI * 0.85;
        const headAngle2 = angleRad - Math.PI * 0.85;
        this.arrowGraphics.fillStyle(0x0ea5e9, 1);
        this.arrowGraphics.beginPath();
        this.arrowGraphics.moveTo(targetX, targetY);
        this.arrowGraphics.lineTo(targetX + Math.cos(headAngle1) * 20, targetY + Math.sin(headAngle1) * 20);
        this.arrowGraphics.lineTo(targetX + Math.cos(headAngle2) * 20, targetY + Math.sin(headAngle2) * 20);
        this.arrowGraphics.closePath();
        this.arrowGraphics.fillPath();

        // Recoil vector arrow (opposite direction, dashed / rose)
        const recoilX = originX - Math.cos(angleRad) * (length * 0.6);
        const recoilY = originY - Math.sin(angleRad) * (length * 0.6);
        this.arrowGraphics.lineStyle(3, 0xf43f5e, 0.75);
        this.arrowGraphics.beginPath();
        this.arrowGraphics.moveTo(originX, originY);
        this.arrowGraphics.lineTo(recoilX, recoilY);
        this.arrowGraphics.strokePath();
    }

    updateTargetIndicator(target, active) {
        if (!active || !target) {
            this.targetRing.clear();
            this.targetRing.setVisible(false);
            return;
        }

        this.targetRing.setVisible(true);
        this.targetRing.clear();

        const time = this.scene.time.now * 0.005;
        const radius = 32 + Math.sin(time) * 4;

        this.targetRing.lineStyle(2.5, 0x38bdf8, 0.85);
        this.targetRing.strokeCircle(target.x, target.y, radius);

        for (let i = 0; i < 4; i++) {
            const rot = time * 0.5 + (i * Math.PI) / 2;
            const px = target.x + Math.cos(rot) * (radius + 6);
            const py = target.y + Math.sin(rot) * (radius + 6);
            this.targetRing.fillStyle(0x0ea5e9, 0.9);
            this.targetRing.fillCircle(px, py, 3);
        }
    }
    updatePersistentTrail(player, delta) {
        this.persistentTrailTimer = (this.persistentTrailTimer || 0) - delta;
        const speed = Math.hypot(player.body.velocity.x, player.body.velocity.y);

        if ((speed > 420 || player.isDashing || player.isBashing) && this.persistentTrailTimer <= 0) {
            const interval = player.isDashing ? 25 : Math.max(30, 80 - (speed / 20));
            this.persistentTrailTimer = interval;
            this.createGhostTrail(player);
        }
    }

    spawnSlashArc(x, y, facingRight, onHit) {
        const dir = facingRight ? 1 : -1;
        const range = window.ORI_CONFIG.SLASH_RANGE || 110;
        const totalDuration = window.ORI_CONFIG.SLASH_VFX_DURATION || 280;

        // Container anchored locally at Ori's hand position, flipped directionally
        const container = this.scene.add.container(x, y - 12);
        container.setDepth(25);
        container.setScale(dir * 0.72, 0.72);
        container.setAngle(-26);

        const arcG = this.scene.add.graphics();
        arcG.setBlendMode(Phaser.BlendModes.ADD);
        container.add(arcG);

        const halfArc = ((window.ORI_CONFIG.SLASH_ARC_DEGREES || 140) / 2) * (Math.PI / 180);
        const startAngle = -halfArc;
        const endAngle = halfArc;
        const steps = 24;

        // 1. Crescent Outer Energy Bloom
        arcG.lineStyle(20, 0x0284c7, 0.25);
        arcG.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            const r = range * (0.92 + Math.sin(t * Math.PI) * 0.12);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * (r * 0.78);
            if (i === 0) arcG.moveTo(px, py);
            else arcG.lineTo(px, py);
        }
        arcG.strokePath();

        // 2. Neon Cyan Radiant Blade Ribbon
        arcG.lineStyle(10, 0x00f0ff, 0.75);
        arcG.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            const r = range * (0.95 + Math.sin(t * Math.PI) * 0.10);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * (r * 0.78);
            if (i === 0) arcG.moveTo(px, py);
            else arcG.lineTo(px, py);
        }
        arcG.strokePath();

        // 3. Bright Electric Blue Inner Filament
        arcG.lineStyle(5, 0x7dd3fc, 0.95);
        arcG.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            const r = range * (0.97 + Math.sin(t * Math.PI) * 0.08);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * (r * 0.78);
            if (i === 0) arcG.moveTo(px, py);
            else arcG.lineTo(px, py);
        }
        arcG.strokePath();

        // 4. Razor-sharp Brilliant White Pure Light Core
        arcG.lineStyle(2.5, 0xffffff, 1.0);
        arcG.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = startAngle + (endAngle - startAngle) * t;
            const r = range * (0.98 + Math.sin(t * Math.PI) * 0.06);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * (r * 0.78);
            if (i === 0) arcG.moveTo(px, py);
            else arcG.lineTo(px, py);
        }
        arcG.strokePath();

        // 5. Flash at Hilt
        this.spawnBurst(x + dir * 20, y - 12, 10, 0xffffff, 0.9);
        this.spawnBurst(x + dir * 38, y - 12, 8, 0x00f0ff, 1.2);

        // Flung Spirit Embers along the swing curve
        for (let i = 0; i < 7; i++) {
            const t = 0.2 + (i / 7) * 0.65;
            const a = startAngle + (endAngle - startAngle) * t;
            const r = range * 0.96;
            const localPx = Math.cos(a) * r;
            const localPy = Math.sin(a) * (r * 0.78);
            const worldPx = x + dir * localPx;
            const worldPy = (y - 12) + localPy;

            const ember = this.scene.add.graphics();
            ember.fillStyle(0x38bdf8, 0.95);
            ember.fillCircle(0, 0, 1.5 + Math.random() * 1.5);
            ember.setPosition(worldPx, worldPy);
            ember.setDepth(26);

            this.scene.tweens.add({
                targets: ember,
                x: worldPx + dir * Phaser.Math.Between(18, 48),
                y: worldPy + Phaser.Math.Between(-14, 14),
                alpha: 0,
                duration: totalDuration * 0.85,
                ease: 'Quad.easeOut',
                onComplete: () => ember.destroy()
            });
        }

        // Two-phase animation: explosive swing forward (90ms) -> majestic fade dissipation (190ms)
        this.scene.tweens.add({
            targets: container,
            scaleX: dir * 1.05,
            scaleY: 1.05,
            angle: 12,
            duration: 90,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: container,
                    alpha: 0,
                    scaleX: dir * 1.15,
                    scaleY: 1.15,
                    angle: 18,
                    duration: 190,
                    ease: 'Cubic.easeOut',
                    onComplete: () => container.destroy()
                });
            }
        });

        // Trigger hit callback right at the peak of the forward swing
        if (onHit) {
            this.scene.time.delayedCall(30, () => onHit());
        }
    }

    spawnSlashImpact(x, y, dir = 1) {
        // Crisp 4-pointed White Star Flash
        const star = this.scene.add.graphics();
        star.setDepth(26);
        star.setBlendMode(Phaser.BlendModes.ADD);
        star.setPosition(x, y);

        // Core flash
        star.fillStyle(0xffffff, 1);
        star.fillCircle(0, 0, 6);

        // Cross flares
        star.lineStyle(3, 0xffffff, 0.95);
        star.lineBetween(-24, 0, 24, 0);
        star.lineBetween(0, -24, 0, 24);

        star.lineStyle(1.5, 0x00f0ff, 0.85);
        star.lineBetween(-16, -16, 16, 16);
        star.lineBetween(-16, 16, 16, -16);

        this.scene.tweens.add({
            targets: star,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeOut',
            onComplete: () => star.destroy()
        });

        // Directional splash particles
        this.spawnBurst(x, y, 12, 0x00f0ff, 1.4);
        this.spawnBurst(x, y, 6, 0xffffff, 1.0);

        // Subtle punchy camera micro-shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(60, 0.0025);
        }
    }
}