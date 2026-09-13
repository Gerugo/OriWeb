// ParallaxManager: High-End Ori Parallax Controller (Seamless Single-Image Layers, No Cuts, No Additive Fog)
class ParallaxManager {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.build();
    }

    build() {
        const cam = this.scene.cameras.main;
        const w = cam.width || window.innerWidth;
        const h = cam.height || window.innerHeight;

        // Base solid deep sky backing (depth -22)
        const gSky = this.scene.add.graphics();
        gSky.setDepth(-22);
        gSky.setScrollFactor(0);
        gSky.fillGradientStyle(0x020813, 0x020813, 0x051329, 0x051329, 1);
        gSky.fillRect(0, 0, w * 2, h * 2);

        // Layer 1: Far Sky & Celestial Spirit Tree (factor: 0.05)
        if (this.scene.textures.exists('bg_far')) {
            const far = this.scene.add.image(0, 0, 'bg_far');
            far.setOrigin(0, 0);
            far.setDepth(-20);
            far.setScrollFactor(0);
            far.setAlpha(0.96);
            far.setDisplaySize(Math.max(w + 350, 1800), h + 60);
            this.layers.push({ obj: far, factorX: 0.05, factorY: 0.015, baseW: 1800, extraW: 350 });
        }

        // Layer 2: Distant Tree Silhouettes (factor: 0.14)
        if (this.scene.textures.exists('bg_mid')) {
            const mid = this.scene.add.image(0, 0, 'bg_mid');
            mid.setOrigin(0, 0);
            mid.setDepth(-16);
            mid.setScrollFactor(0);
            mid.setAlpha(0.88);
            mid.setDisplaySize(Math.max(w + 650, 2100), h + 60);
            this.layers.push({ obj: mid, factorX: 0.14, factorY: 0.03, baseW: 2100, extraW: 650 });
        }

        // Layer 3: Mid-ground Canopy with Moon & Stars (factor: 0.24)
        if (this.scene.textures.exists('bg_mid2')) {
            const mid2 = this.scene.add.image(0, 0, 'bg_mid2');
            mid2.setOrigin(0, 0);
            mid2.setDepth(-13);
            mid2.setScrollFactor(0);
            mid2.setAlpha(0.82);
            mid2.setDisplaySize(Math.max(w + 1050, 2500), h + 60);
            this.layers.push({ obj: mid2, factorX: 0.24, factorY: 0.045, baseW: 2500, extraW: 1050 });
        }

        // Layer 4: Near Roots & Ancient Trunks with Glowing Runes (factor: 0.38)
        if (this.scene.textures.exists('bg_near')) {
            const near = this.scene.add.image(0, 0, 'bg_near');
            near.setOrigin(0, 0);
            near.setDepth(-10);
            near.setScrollFactor(0);
            near.setAlpha(0.92);
            near.setDisplaySize(Math.max(w + 1550, 2950), h + 60);
            this.layers.push({ obj: near, factorX: 0.38, factorY: 0.065, baseW: 2950, extraW: 1550 });
        }

        // Atmospheric Depth Fog - Bottom ground blend
        this.fogBottom = this.scene.add.graphics();
        this.fogBottom.setScrollFactor(0);
        this.fogBottom.setDepth(-8);
        this.drawFog(w, h);

        // Handle window resizing
        this.scene.scale.on('resize', (gameSize) => {
            const nw = gameSize.width;
            const nh = gameSize.height;
            for (const layer of this.layers) {
                if (layer.obj.setDisplaySize) {
                    layer.obj.setDisplaySize(Math.max(nw + layer.extraW, layer.baseW), nh + 60);
                }
            }
            this.drawFog(nw, nh);
        });
    }

    drawFog(w, h) {
        this.fogBottom.clear();
        // Soft gradient mist at the bottom connecting ground with depth
        this.fogBottom.fillGradientStyle(0x020813, 0x020813, 0x020813, 0x020813, 0, 0, 0.70, 0.70);
        this.fogBottom.fillRect(0, h * 0.68, w, h * 0.32);

        // Very soft upper horizon shade
        this.fogBottom.fillGradientStyle(0x020813, 0x020813, 0x020813, 0x020813, 0.35, 0.35, 0, 0);
        this.fogBottom.fillRect(0, 0, w, h * 0.12);
    }

    update(camX, camY = 1200) {
        const refY = 1200;
        const diffY = camY - refY;

        for (const layer of this.layers) {
            if (layer.obj) {
                layer.obj.x = -camX * layer.factorX;
                layer.obj.y = -30 - diffY * layer.factorY;
            }
        }
    }
}
window.ParallaxManager = ParallaxManager;