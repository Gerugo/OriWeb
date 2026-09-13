// PlatformArtist: Layered AAA Platform & Floor Renderer for Ori Proving Ground
class PlatformArtist {
    static drawPlatform(scene, x, y, w, h) {
        // --- 1. Soft Ambient Drop Shadow ---
        const gShadow = scene.add.graphics();
        gShadow.setDepth(9);
        for (let i = 5; i > 0; i--) {
            gShadow.fillStyle(0x0f172a, 0.025 * i);
            gShadow.fillRoundedRect(x - i, y + h, w + i * 2, i * 2, 4);
        }

        // --- 2. Platform Body (Tileable ancient stone) ---
        if (scene.textures.exists('body_tile')) {
            const body = scene.add.tileSprite(x + w / 2, y + h / 2, w, h, 'body_tile');
            body.setDepth(10);
            body.setAlpha(0.95);
            body.setTint(0x8da0b8);
        } else {
            const gBody = scene.add.graphics();
            gBody.setDepth(10);
            gBody.fillStyle(0x0f172a, 1);
            gBody.fillRoundedRect(x, y, w, h, 2);
            gBody.fillStyle(0x1e293b, 0.75);
            gBody.fillRect(x + 2, y + 4, w - 4, Math.min(18, h - 4));
        }

        // --- 3. Luminous Top Cap Surface ---
        if (scene.textures.exists('top_cap')) {
            const topCap = scene.add.tileSprite(x + w / 2, y + 8, w, 16, 'top_cap');
            topCap.setDepth(12);
            topCap.setAlpha(0.95);
        } else {
            const gTop = scene.add.graphics();
            gTop.setDepth(12);
            gTop.fillStyle(0x00f0ff, 0.95);
            gTop.fillRect(x, y, w, 3.5);
            gTop.fillStyle(0xffffff, 0.9);
            gTop.fillRect(x + 4, y, w - 8, 1.2);
        }

        // --- 4. Procedural Ethereal Top Glow ---
        const gGlow = scene.add.graphics();
        gGlow.setDepth(11);
        for (let i = 4; i > 0; i--) {
            gGlow.fillStyle(0x00f0ff, 0.07 * i);
            gGlow.fillRect(x, y - i * 1.5, w, i * 1.5 + 2);
        }

        // --- 5. Precision Border Brackets ---
        const gBorder = scene.add.graphics();
        gBorder.setDepth(12);
        gBorder.lineStyle(1.5, 0x0ea5e9, 0.6);
        gBorder.strokeRect(x, y, w, h);

        // Corner crystals
        const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
        for (const [cx, cy] of corners) {
            gBorder.fillStyle(0x38bdf8, 0.85);
            gBorder.fillRect(cx - 2, cy - 2, 4, 4);
        }

        // --- 6. Floating Spirit Motes ---
        PlatformArtist.spawnPlatformMotes(scene, x, y, w);
    }

    static drawFloor(scene, x, y, w, h) {
        // --- 1. Massive Ancient Bedrock Floor ---
        if (scene.textures.exists('floor_tile')) {
            const floor = scene.add.tileSprite(x + w / 2, y + h / 2, w, h, 'floor_tile');
            floor.setDepth(10);
            floor.setAlpha(0.96);
            floor.setTint(0x9ab2c8);
        } else {
            const gFloor = scene.add.graphics();
            gFloor.setDepth(10);
            gFloor.fillStyle(0x0f172a, 1);
            gFloor.fillRect(x, y, w, h);
        }

        // --- 2. Luminous Spirit Top Edge ---
        if (scene.textures.exists('top_cap')) {
            const topCap = scene.add.tileSprite(x + w / 2, y + 10, w, 20, 'top_cap');
            topCap.setDepth(12);
            topCap.setAlpha(0.95);
        } else {
            const gTop = scene.add.graphics();
            gTop.setDepth(12);
            gTop.fillStyle(0x00f0ff, 0.95);
            gTop.fillRect(x, y, w, 4);
            gTop.fillStyle(0xffffff, 0.95);
            gTop.fillRect(x, y, w, 1.5);
        }

        // --- 3. Ground Ambient Bloom ---
        const gGlow = scene.add.graphics();
        gGlow.setDepth(11);
        for (let i = 6; i > 0; i--) {
            gGlow.fillStyle(0x00f0ff, 0.05 * i);
            gGlow.fillRect(x, y - i * 2, w, i * 2 + 2);
        }

        // --- 4. Floating Motes along floor ---
        PlatformArtist.spawnPlatformMotes(scene, x, y, w);
    }

    static drawDestructiblePlatform(scene, x, y, w, h) {
        const container = scene.add.container(x + w / 2, y + h / 2);
        container.setDepth(14);

        // Body
        if (scene.textures.exists('body_tile')) {
            const body = scene.add.tileSprite(0, 0, w, h, 'body_tile');
            body.setTint(0x451a1a);
            container.add(body);
        } else {
            const gBody = scene.add.graphics();
            gBody.fillStyle(0x180d0d, 1);
            gBody.fillRoundedRect(-w / 2, -h / 2, w, h, 2);
            container.add(gBody);
        }

        // Fiery Destructible Cap
        if (scene.textures.exists('destructible_cap')) {
            const cap = scene.add.tileSprite(0, -h / 2 + 8, w, 16, 'destructible_cap');
            container.add(cap);
        } else {
            const gCap = scene.add.graphics();
            gCap.fillStyle(0xf97316, 1);
            gCap.fillRect(-w / 2, -h / 2, w, 3);
            gCap.fillStyle(0xfef08a, 0.9);
            gCap.fillRect(-w / 2 + 4, -h / 2, w - 8, 1);
            container.add(gCap);
        }

        // Warning fracture glow
        const gFx = scene.add.graphics();
        gFx.lineStyle(2, 0xf97316, 0.8);
        gFx.lineBetween(-w * 0.25, -h / 2 + 2, -w * 0.15, h / 2 - 2);
        gFx.lineBetween(w * 0.15, -h / 2 + 2, w * 0.05, h / 2 - 2);
        gFx.lineBetween(w * 0.35, -h / 2 + 2, w * 0.40, h / 2 - 2);
        container.add(gFx);

        return container;
    }

    static spawnPlatformMotes(scene, x, y, w) {
        const count = Math.max(1, Math.floor(w / 140));
        for (let i = 0; i < count; i++) {
            const mx = x + Phaser.Math.Between(20, w - 20);
            const mote = scene.add.graphics();
            const radius = 1 + Math.random() * 1.2;
            mote.fillStyle(0x0ea5e9, 0.6);
            mote.fillCircle(0, 0, radius);
            mote.setPosition(mx, y - 2);
            mote.setDepth(13);

            const delay = Math.random() * 3000;
            const duration = 2800 + Math.random() * 2200;

            scene.tweens.add({
                targets: mote,
                y: y - Phaser.Math.Between(35, 80),
                x: mx + Phaser.Math.Between(-12, 12),
                alpha: 0,
                delay: delay,
                duration: duration,
                repeat: -1,
                repeatDelay: Math.random() * 1500,
                ease: 'Sine.easeInOut'
            });
        }
    }
}
window.PlatformArtist = PlatformArtist;