// Player Class: AAA Ori Character Controller with 4-Frame Run Stride & Hands-On-Wall Cling
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Base physics body using 'vfx_dot' with unscaled dimensions
        super(scene, x, y, 'vfx_dot');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.cfg = window.ORI_CONFIG;
        this.vfx = scene.vfx;

        // Base physics collider box (38px wide, 62px tall, centered)
        this.setAlpha(0);
        this.setScale(1, 1);
        this.body.setSize(38, 62, true);
        this.body.setMaxVelocity(1200, 1400);
        this.body.setCollideWorldBounds(true);

        // Visual character sprite
        this.currentVisualState = '';
        this.visual = scene.add.sprite(x, y, 'idle');
        this.visual.setOrigin(0.5, 0.85);
        this.visual.setDepth(20);

        // Movement state machine
        this.state = 'IDLE';
        this.facingRight = true;
        this.visualTilt = 0;

        // Timers & Buffers
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.variableJumpTimer = 0;
        this.wallJumpLockTimer = 0;
        this.wallDirection = 0;
        this.wallClingGraceTimer = 0;
        this.wasInAir = false;

        // Abilities flags
        this.hasDoubleJump = true;
        this.hasAirDash = true;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.dashTrailTimer = 0;

        // Bash
        this.isBashing = false;
        this.bashTarget = null;
        this.bashAngle = 0;
        this.bashHoldTimer = 0;

        // Stomp
        this.isStomping = false;
        this.stompPauseTimer = 0;

        // Dynamic Squash & Stretch
        this.targetScaleX = 1;
        this.targetScaleY = 1;
        this.currentScaleX = 1;
        this.currentScaleY = 1;

        // Spirit flame cooldown
        this.spiritFlameCooldown = 0;
        this.slashTimer = 0;

        // Health & Energy HUD telemetry
        this.health = 100;
        this.maxHealth = 100;

        // Subtle, elegant spirit heart glow
        this.auraGlow = scene.add.image(x, y, 'soft_glow');
        this.auraGlow.setDisplaySize(56, 56);
        this.auraGlow.setBlendMode(Phaser.BlendModes.ADD);
        this.auraGlow.setAlpha(0.30);
        this.auraGlow.setDepth(19);

        this.setVisualState('idle');
    }

    setVisualState(stateKey) {
        if (this.currentVisualState === stateKey) return;
        this.currentVisualState = stateKey;

        if (stateKey === 'attack') {
            this.visual.setOrigin(0.5, 0.76);
        } else if (stateKey === 'idle') {
            this.visual.setOrigin(0.5, 0.85);
        } else {
            this.visual.setOrigin(0.5, 0.80);
        }

        if (stateKey === 'run') {
            if (this.scene.anims.exists('anim_run')) {
                this.visual.play('anim_run', true);
            } else {
                this.visual.stop();
                this.visual.setTexture('run');
            }
        } else {
            this.visual.stop();
            if (this.scene.textures.exists(stateKey)) {
                this.visual.setTexture(stateKey);
            }
        }
    }

    update(time, delta) {
        const dt = delta / 1000;
        const input = this.scene.inputManager;

        // Failsafe respawn if out of bounds
        if (this.y > 1750) {
            this.setPosition(260, 1380);
            this.body.setVelocity(0, 0);
        }

        // Update cooldown timers
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= delta;
        if (this.spiritFlameCooldown > 0) this.spiritFlameCooldown -= delta;
        if (this.slashTimer > 0) this.slashTimer -= delta;
        if (this.wallJumpLockTimer > 0) this.wallJumpLockTimer -= delta;

        // Jump buffer tracking
        if (input.justPressedJump) {
            this.jumpBufferTimer = this.cfg.JUMP_BUFFER_TIME;
        } else if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= delta;
        }

        const onGround = this.body.blocked.down;
        const touchingLeft = this.body.blocked.left;
        const touchingRight = this.body.blocked.right;

        // Landing impact event
        if (onGround && this.wasInAir) {
            this.targetScaleX = 1.10;
            this.targetScaleY = 0.90;
            this.vfx.spawnBurst(this.x, this.y + 30, 8, 0x38bdf8, 0.7);
        }
        this.wasInAir = !onGround;

        // Coyote time & Ground reset
        if (onGround) {
            this.coyoteTimer = this.cfg.COYOTE_TIME;
            this.hasDoubleJump = true;
            this.hasAirDash = true;
            if (this.isStomping) {
                this.finishStomp();
            }
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
        }

        // Active State Logic
        if (this.isBashing) {
            this.handleBashState(input, delta);
        } else if (this.isDashing) {
            this.handleDashState(delta);
        } else if (this.isStomping) {
            this.handleStompState(delta);
        } else {
            this.handleNormalMovement(input, onGround, touchingLeft, touchingRight, delta);
        }

        // Attacks: Melee Light Sword Slash
        if (input.attack && this.spiritFlameCooldown <= 0 && !this.isBashing) {
            this.performSlash();
        }

        // Smooth Exponential Squash & Stretch decay
        const lerpRate = 1 - Math.pow(0.01, dt);
        this.currentScaleX = Phaser.Math.Linear(this.currentScaleX, this.targetScaleX, lerpRate);
        this.currentScaleY = Phaser.Math.Linear(this.currentScaleY, this.targetScaleY, lerpRate);
        this.targetScaleX = Phaser.Math.Linear(this.targetScaleX, 1, lerpRate * 0.8);
        this.targetScaleY = Phaser.Math.Linear(this.targetScaleY, 1, lerpRate * 0.8);

        // Procedural Motion
        let visualOffsetY = 10;
        let proceduralScaleX = 1.0;
        let proceduralScaleY = 1.0;
        let targetTilt = 0;

        if (this.state === 'ATTACK') {
            targetTilt = (this.facingRight ? 1 : -1) * 8.0;
            visualOffsetY += 4;
        } else if (this.state === 'IDLE' && onGround) {
            const breath = Math.sin(time * 0.0022);
            // Feet remain naturally grounded; subtle rhythmic breathing in chest
            visualOffsetY += breath * 0.5;
            proceduralScaleY = 1.0 + breath * 0.014;
            proceduralScaleX = 1.0 - breath * 0.007;
            targetTilt = 0;
        } else if (this.state === 'RUN' && onGround) {
            const runSpeedRatio = Math.min(1.0, Math.abs(this.body.velocity.x) / this.cfg.RUN_SPEED);
            targetTilt = (this.facingRight ? 1 : -1) * (runSpeedRatio * 5.0);
        } else if (this.state === 'WALL_CLING') {
            targetTilt = (this.wallDirection === -1) ? 3 : -3;
        }

        // Visual tilt interpolation
        this.visualTilt = Phaser.Math.Linear(this.visualTilt, targetTilt, 0.15);
        this.visual.setAngle(this.visualTilt);

        // Mathematical Uniform Scaling (100% Proportions Preserved Across All States)
        const TARGET_HEIGHT = 104;
        const frame = this.visual.frame;
        const nativeH = (frame && frame.height) ? frame.height : 512;
        const baseScale = TARGET_HEIGHT / nativeH;

        this.visual.setScale(
            baseScale * (this.facingRight ? 1 : -1) * this.currentScaleX * proceduralScaleX,
            baseScale * this.currentScaleY * proceduralScaleY
        );

        // Sync position
        this.visual.setPosition(this.x, this.y + visualOffsetY);

        // Subtle, elegant spirit heart aura centered at chest (y - 12)
        const targetAuraSize = (this.state === 'IDLE') ? 56 : (this.isDashing ? 84 : 68);
        const currentAuraSize = Phaser.Math.Linear(this.auraGlow.displayWidth, targetAuraSize, 0.08);
        this.auraGlow.setDisplaySize(currentAuraSize, currentAuraSize);
        this.auraGlow.setPosition(this.x, this.y - 12);

        const pulse = (this.state === 'IDLE')
            ? (0.28 + Math.sin(time * 0.0025) * 0.08)
            : (0.45 + Math.sin(time * 0.005) * 0.12);
        this.auraGlow.setAlpha(pulse);

        // Update Telemetry display
        this.scene.updateHUD();
    }

    handleNormalMovement(input, onGround, touchingLeft, touchingRight, delta) {
        const moveX = input.moveX;

        // 1. Rock-solid Wall Cling with Hands-on-Wall Orientation
        const touchingWallNow = (touchingLeft || touchingRight);
        if (touchingWallNow) {
            this.wallDirection = touchingLeft ? -1 : 1;
            this.wallClingGraceTimer = 110;
        } else if (this.wallClingGraceTimer > 0) {
            this.wallClingGraceTimer -= delta;
        }

        const canCling = (this.wallClingGraceTimer > 0) && !onGround && this.body.velocity.y > 0;
        const holdingTowardsWall = (this.wallDirection === -1 && moveX <= 0) || (this.wallDirection === 1 && moveX >= 0) || Math.abs(moveX) < 0.2;

        if (canCling && holdingTowardsWall) {
            this.state = 'WALL_CLING';
            // HANDS TOUCH WALL: If wall is on right (1), face right; if wall is on left (-1), face left!
            this.facingRight = (this.wallDirection === 1);

            // Gently maintain contact against wall
            this.body.setVelocityX(this.wallDirection * 20);

            // Cap fall speed on wall
            if (this.body.velocity.y > this.cfg.WALL_SLIDE_MAX_SPEED) {
                this.body.setVelocityY(this.cfg.WALL_SLIDE_MAX_SPEED);
            }

            // Friction sparks
            if (Math.random() < 0.35) {
                this.vfx.spawnBurst(this.x + (this.wallDirection * 18), this.y, 1, 0x38bdf8, 0.6);
            }

            // Wall Jump
            if (this.jumpBufferTimer > 0) {
                this.performWallJump();
                return;
            }

            this.setVisualState('wall_cling');
            return;
        }

        // 2. Horizontal Run Movement
        if (this.wallJumpLockTimer <= 0) {
            const targetSpeed = moveX * this.cfg.RUN_SPEED;
            const accel = onGround ? this.cfg.RUN_ACCEL : this.cfg.AIR_ACCEL;
            const decel = onGround ? this.cfg.RUN_DECEL : this.cfg.AIR_DECEL;

            if (moveX !== 0) {
                this.body.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, targetSpeed, (accel * delta) / 1000 / 300));
                this.facingRight = moveX > 0;
            } else {
                this.body.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, 0, (decel * delta) / 1000 / 300));
            }
        }

        // 3. Jump Handling
        if (this.jumpBufferTimer > 0) {
            if (this.coyoteTimer > 0) {
                this.performGroundJump();
            } else if (this.hasDoubleJump) {
                this.performDoubleJump();
            }
        }

        // Variable Jump Hold & Glide
        if (input.holdingJump && this.variableJumpTimer > 0) {
            this.variableJumpTimer -= delta;
            this.body.setGravityY(this.cfg.GRAVITY * this.cfg.VARIABLE_JUMP_GRAVITY_RATIO);
        } else {
            if (input.holdingJump && !onGround && this.body.velocity.y > 0) {
                this.state = 'GLIDE';
                this.body.setGravityY(this.cfg.GRAVITY * this.cfg.GLIDE_GRAVITY_RATIO);
                if (this.body.velocity.y > this.cfg.GLIDE_MAX_FALL_SPEED) {
                    this.body.setVelocityY(this.cfg.GLIDE_MAX_FALL_SPEED);
                }
            } else {
                this.body.setGravityY(this.cfg.GRAVITY);
            }
        }

        // 4. Dash Initiation
        if (input.justPressedDash && this.dashCooldownTimer <= 0 && (onGround || this.hasAirDash)) {
            this.startDash(input.dashDirX, input.dashDirY);
            return;
        }

        // 5. Stomp Initiation
        if (!onGround && input.stomp && !this.isStomping) {
            this.startStomp();
            return;
        }

        // 6. Bash Detection
        this.checkBashCandidate(input);

        // Update Animation States
        if (this.slashTimer > 0) {
            this.state = 'ATTACK';
            this.setVisualState('attack');
        } else if (onGround) {
            if (Math.abs(moveX) > 0.1 || Math.abs(this.body.velocity.x) > 20) {
                this.state = 'RUN';
                this.setVisualState('run');
                if (Math.random() < 0.25) {
                    this.vfx.spawnBurst(this.x - (this.facingRight ? 16 : -16), this.y + 30, 1, 0x38bdf8, 0.4);
                }
            } else {
                this.state = 'IDLE';
                this.setVisualState('idle');
            }
        } else {
            if (this.body.velocity.y < -50) {
                this.state = 'JUMP';
                this.setVisualState('jump');
            } else {
                this.state = 'FALL';
                this.setVisualState('jump');
            }
        }
    }

    performGroundJump() {
        this.body.setVelocityY(this.cfg.JUMP_VELOCITY);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.variableJumpTimer = this.cfg.VARIABLE_JUMP_TIME;

        this.targetScaleX = 0.80;
        this.targetScaleY = 1.28;
        this.vfx.spawnBurst(this.x, this.y + 30, 14, 0x38bdf8, 1.2);
    }

    performDoubleJump() {
        this.body.setVelocityY(this.cfg.DOUBLE_JUMP_VELOCITY);
        this.hasDoubleJump = false;
        this.jumpBufferTimer = 0;
        this.variableJumpTimer = this.cfg.VARIABLE_JUMP_TIME * 0.8;

        this.targetScaleX = 0.76;
        this.targetScaleY = 1.32;
        this.vfx.spawnShockwave(this.x, this.y, 95, 0x38bdf8);
        this.vfx.spawnBurst(this.x, this.y, 18, 0x0ea5e9, 1.4);
    }

    performWallJump() {
        const jumpDirX = -this.wallDirection;
        this.body.setVelocityX(jumpDirX * this.cfg.WALL_JUMP_VEL_X);
        this.body.setVelocityY(this.cfg.WALL_JUMP_VEL_Y);

        this.wallJumpLockTimer = this.cfg.WALL_JUMP_INPUT_LOCK;
        this.jumpBufferTimer = 0;
        this.variableJumpTimer = this.cfg.VARIABLE_JUMP_TIME;
        this.hasDoubleJump = true;

        this.facingRight = (jumpDirX > 0);
        this.targetScaleX = 0.88;
        this.targetScaleY = 1.15;
        this.vfx.spawnBurst(this.x + (this.wallDirection * 18), this.y, 14, 0x38bdf8, 1.4);
    }

    startDash(dirX, dirY) {
        this.isDashing = true;
        this.dashTimer = this.cfg.DASH_DURATION;
        this.dashCooldownTimer = this.cfg.DASH_COOLDOWN;
        this.hasAirDash = false;
        this.state = 'DASH';

        let dx = dirX;
        let dy = dirY;
        if (dx === 0 && dy === 0) {
            dx = this.facingRight ? 1 : -1;
        }

        const len = Math.hypot(dx, dy) || 1;
        this.dashVelX = (dx / len) * this.cfg.DASH_SPEED;
        this.dashVelY = (dy / len) * (this.cfg.DASH_SPEED * 0.75);

        this.body.setAllowGravity(false);
        this.body.setVelocity(this.dashVelX, this.dashVelY);

        this.setVisualState('dash');
        this.facingRight = (this.dashVelX > 0);

        this.targetScaleX = 1.20;
        this.targetScaleY = 0.85;

        this.vfx.createGhostTrail(this);
        this.vfx.spawnShockwave(this.x, this.y, 70, 0x06b6d4);
    }

    handleDashState(delta) {
        this.dashTimer -= delta;
        this.dashTrailTimer -= delta;

        if (this.dashTrailTimer <= 0) {
            this.vfx.createGhostTrail(this);
            this.dashTrailTimer = this.cfg.DASH_TRAIL_INTERVAL;
        }

        if (this.dashTimer <= 0) {
            this.isDashing = false;
            this.body.setAllowGravity(true);
            this.body.setVelocityX(this.body.velocity.x * 0.45);
        }
    }

    checkBashCandidate(input) {
        const bashables = this.scene.getBashableObjects();
        let closest = null;
        let minDist = this.cfg.BASH_RANGE;

        for (const obj of bashables) {
            const d = Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y);
            if (d < minDist) {
                minDist = d;
                closest = obj;
            }
        }

        this.vfx.updateTargetIndicator(closest, !!closest);

        if (closest && input.holdingBash) {
            this.startBash(closest);
        }
    }

    startBash(target) {
        this.isBashing = true;
        this.bashTarget = target;
        this.bashHoldTimer = this.cfg.BASH_SLOWMO_DURATION;
        this.state = 'BASH_AIM';

        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);
        this.setPosition(target.x, target.y);

        this.scene.cameras.main.shake(100, 0.005);
        this.vfx.spawnShockwave(target.x, target.y, 60, 0x38bdf8);
    }

    handleBashState(input, delta) {
        this.bashHoldTimer -= delta;

        const pointer = this.scene.input.activePointer;
        const worldPointer = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.bashAngle = Phaser.Math.Angle.Between(this.bashTarget.x, this.bashTarget.y, worldPointer.x, worldPointer.y);

        this.vfx.updateBashAim(this.bashTarget.x, this.bashTarget.y, this.bashAngle, true);
        this.setPosition(this.bashTarget.x, this.bashTarget.y);

        if (!input.holdingBash || this.bashHoldTimer <= 0) {
            this.launchBash();
        }
    }

    launchBash() {
        this.isBashing = false;
        this.body.setAllowGravity(true);
        this.vfx.updateBashAim(0, 0, 0, false);
        this.vfx.updateTargetIndicator(null, false);

        const vx = Math.cos(this.bashAngle) * this.cfg.BASH_LAUNCH_SPEED;
        const vy = Math.sin(this.bashAngle) * this.cfg.BASH_LAUNCH_SPEED;
        this.body.setVelocity(vx, vy);

        if (this.bashTarget && this.bashTarget.recoil) {
            const rx = -Math.cos(this.bashAngle) * this.cfg.BASH_TARGET_RECOIL;
            const ry = -Math.sin(this.bashAngle) * this.cfg.BASH_TARGET_RECOIL;
            this.bashTarget.recoil(rx, ry);
        }

        this.hasDoubleJump = true;
        this.hasAirDash = true;

        this.facingRight = (vx > 0);
        this.setVisualState('dash');

        this.vfx.spawnShockwave(this.x, this.y, 130, 0x0ea5e9);
        this.vfx.spawnBurst(this.x, this.y, 22, 0x38bdf8, 2.0);
        this.scene.cameras.main.shake(180, 0.012);
        this.vfx.createGhostTrail(this);
    }

    startStomp() {
        this.isStomping = true;
        this.stompPauseTimer = this.cfg.STOMP_PAUSE_TIME;
        this.state = 'STOMP';

        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);

        this.targetScaleX = 0.85;
        this.targetScaleY = 1.20;

        this.vfx.spawnShockwave(this.x, this.y, 50, 0xf43f5e);
    }

    handleStompState(delta) {
        if (this.stompPauseTimer > 0) {
            this.stompPauseTimer -= delta;
            this.body.setVelocity(0, 0);
            return;
        }

        this.body.setAllowGravity(false);
        this.body.setVelocity(0, this.cfg.STOMP_FALL_SPEED);

        if (Math.random() < 0.4) {
            this.vfx.createGhostTrail(this);
        }
    }

    finishStomp() {
        this.isStomping = false;
        this.body.setAllowGravity(true);

        this.targetScaleX = 1.25;
        this.targetScaleY = 0.80;

        this.vfx.spawnGroundStompShockwave(this.x, this.y + 30);
        this.scene.onGroundStomp(this.x, this.y, this.cfg.STOMP_SHOCKWAVE_RANGE);
    }

    performSlash() {
        this.spiritFlameCooldown = this.cfg.SLASH_COOLDOWN || 260;
        this.slashTimer = 220; // 220ms full attack lunge pose

        this.state = 'ATTACK';
        this.setVisualState('attack');

        const dir = this.facingRight ? 1 : -1;

        // Snappy kinetic forward step on ground
        if (this.body.blocked.down) {
            this.body.setVelocityX(this.body.velocity.x * 0.4 + dir * 160);
        }

        // Dynamic strike squash & stretch
        this.targetScaleX = 1.18;
        this.targetScaleY = 0.88;
        this.visualTilt = dir * 10;

        const slashReach = this.cfg.SLASH_RANGE || 110;
        const attackOriginX = this.x + dir * (slashReach * 0.45);
        const attackOriginY = this.y - 10;

        // Query enemies and destructibles within melee reach
        const targets = this.scene.getEnemiesInRange(attackOriginX, attackOriginY, slashReach);

        // Spawn AAA Ori Spirit Edge crescent arc VFX
        this.vfx.spawnSlashArc(this.x, this.y, this.facingRight, () => {
            for (const target of targets) {
                if (target.takeDamage) {
                    target.takeDamage(this.cfg.SLASH_DAMAGE || 45);
                    this.vfx.spawnSlashImpact(target.x, target.y - 35, dir);
                }
                if (target.shatter && !target.isBroken) {
                    target.shatter();
                    this.vfx.spawnSlashImpact(target.x, target.y, dir);
                }
            }
        });
    }
}
window.Player = Player;