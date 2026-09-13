// AnimationManager: Handles Character Sprite Sheets, Animation Registration, and Procedural Motion
class AnimationManager {
    static setup(scene) {
        // Multi-frame Run Cycle Animation from run_sheet (4 frames, 512x512 each)
        if (scene.textures.exists('run_sheet')) {
            if (!scene.anims.exists('anim_run')) {
                scene.anims.create({
                    key: 'anim_run',
                    frames: scene.anims.generateFrameNumbers('run_sheet', { start: 0, end: 3 }),
                    frameRate: 9.5,
                    repeat: -1
                });
            }
        }
    }
}
window.AnimationManager = AnimationManager;