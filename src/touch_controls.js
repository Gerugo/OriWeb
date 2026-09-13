// Touch Controls Manager: Ergonomic Virtual Joystick & Action Buttons for Mobile
class TouchControlsManager {
    constructor() {
        this.enabled = false;
        this.moveX = 0;
        this.moveY = 0;
        this.holdingJump = false;
        this.justPressedJump = false;
        this.justPressedDash = false;
        this.attack = false;
        this.holdingBash = false;
        this.stomp = false;

        this.stickPointerId = null;
        this.stickCenter = { x: 0, y: 0 };
        this.stickRadius = 55;

        this.init();
    }

    init() {
        this.injectStyles();
        this.createDOM();
        this.bindEvents();

        // Auto-detect mobile / touch device
        const isTouchDevice = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) || 
                              (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                              (window.innerWidth <= 960);

        if (isTouchDevice) {
            this.show();
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.id = 'touch-controls-styles';
        style.innerHTML = `
            /* Touch Controls Glassmorphic Overlay */
            .touch-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 100;
                display: none;
                user-select: none;
                -webkit-user-select: none;
                touch-action: none;
            }
            .touch-overlay.active {
                display: block;
            }

            /* Left Stick Zone */
            #touch-stick-zone {
                position: absolute;
                bottom: 24px;
                left: 24px;
                width: 160px;
                height: 160px;
                pointer-events: auto;
                touch-action: none;
            }
            #touch-stick-base {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 124px;
                height: 124px;
                border-radius: 50%;
                background: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 2px solid rgba(56, 189, 248, 0.35);
                box-shadow: 0 0 25px rgba(14, 165, 233, 0.2), inset 0 0 15px rgba(14, 165, 233, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #touch-stick-base::after {
                content: '';
                position: absolute;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 1px dashed rgba(56, 189, 248, 0.4);
            }
            #touch-stick-knob {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, #38bdf8, #0284c7);
                box-shadow: 0 0 16px rgba(56, 189, 248, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.6);
                border: 2px solid #e0f2fe;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                transition: transform 0.05s ease-out;
            }

            /* Right Action Cluster */
            #touch-buttons-cluster {
                position: absolute;
                bottom: 24px;
                right: 24px;
                width: 250px;
                height: 230px;
                pointer-events: none;
            }
            .touch-btn {
                position: absolute;
                border-radius: 50%;
                border: 1.5px solid rgba(255, 255, 255, 0.25);
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: system-ui, -apple-system, sans-serif;
                font-weight: 700;
                pointer-events: auto;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
                transition: transform 0.08s ease, background 0.08s ease, box-shadow 0.08s ease;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }
            .touch-btn:active, .touch-btn.pressed {
                transform: scale(0.90) !important;
                background: rgba(56, 189, 248, 0.45) !important;
                box-shadow: 0 0 22px rgba(56, 189, 248, 0.9) !important;
                border-color: #38bdf8 !important;
            }
            .touch-btn .btn-icon {
                font-size: 20px;
                line-height: 1;
                pointer-events: none;
            }
            .touch-btn .btn-label {
                font-size: 9px;
                letter-spacing: 0.5px;
                margin-top: 2px;
                opacity: 0.9;
                pointer-events: none;
                text-transform: uppercase;
            }

            /* Specific Action Buttons */
            /* JUMP (Primary, big bottom-right) */
            .btn-jump {
                bottom: 8px;
                right: 12px;
                width: 72px;
                height: 72px;
                background: radial-gradient(circle at 35% 35%, rgba(14, 165, 233, 0.7), rgba(15, 23, 42, 0.8));
                border-color: rgba(56, 189, 248, 0.6);
                box-shadow: 0 0 16px rgba(14, 165, 233, 0.4);
            }
            .btn-jump .btn-icon { font-size: 24px; }
            .btn-jump .btn-label { font-size: 10px; font-weight: 800; color: #bae6fd; }

            /* ATTACK (Sword, left of Jump) */
            .btn-attack {
                bottom: 18px;
                right: 96px;
                width: 60px;
                height: 60px;
                background: radial-gradient(circle at 35% 35%, rgba(6, 182, 212, 0.6), rgba(15, 23, 42, 0.8));
                border-color: rgba(34, 211, 238, 0.5);
            }

            /* DASH (Above Attack) */
            .btn-dash {
                bottom: 88px;
                right: 120px;
                width: 54px;
                height: 54px;
                background: radial-gradient(circle at 35% 35%, rgba(99, 102, 241, 0.6), rgba(15, 23, 42, 0.8));
                border-color: rgba(129, 140, 248, 0.5);
            }

            /* BASH (Above Jump) */
            .btn-bash {
                bottom: 96px;
                right: 48px;
                width: 58px;
                height: 58px;
                background: radial-gradient(circle at 35% 35%, rgba(168, 85, 247, 0.65), rgba(15, 23, 42, 0.8));
                border-color: rgba(192, 132, 252, 0.6);
            }
            .btn-bash .btn-label { color: #f5d0fe; }

            /* STOMP (Top row) */
            .btn-stomp {
                bottom: 160px;
                right: 102px;
                width: 46px;
                height: 46px;
                background: radial-gradient(circle at 35% 35%, rgba(245, 158, 11, 0.6), rgba(15, 23, 42, 0.8));
                border-color: rgba(251, 191, 36, 0.5);
            }
            .btn-stomp .btn-icon { font-size: 16px; }

            /* Toggle Mobile Controls Floating Button */
            #touch-toggle-btn {
                position: fixed;
                top: 18px;
                right: 18px;
                z-index: 101;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(56, 189, 248, 0.4);
                color: #e2e8f0;
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 13px;
                font-family: system-ui, sans-serif;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            #touch-toggle-btn:active {
                transform: scale(0.95);
            }

            /* Hide desktop controls bar when touch controls are active */
            .touch-overlay.active ~ #controls-bar,
            #controls-bar.touch-hidden {
                display: none !important;
            }

            /* Responsive Adjustments for Mobile Landscape */
            @media (max-width: 960px) {
                #controls-bar { display: none !important; }
                #touch-stick-zone { bottom: 16px; left: 16px; width: 140px; height: 140px; }
                #touch-stick-base { width: 115px; height: 115px; }
                #touch-buttons-cluster { bottom: 14px; right: 14px; }
                #hud-overlay { transform: scale(0.85); transform-origin: top left; }
            }
        `;
        document.head.appendChild(style);
    }

    createDOM() {
        // Main Overlay
        const overlay = document.createElement('div');
        overlay.id = 'touch-overlay';
        overlay.className = 'touch-overlay';
        overlay.innerHTML = `
            <div id="touch-stick-zone">
                <div id="touch-stick-base">
                    <div id="touch-stick-knob"></div>
                </div>
            </div>
            <div id="touch-buttons-cluster">
                <button id="touch-btn-bash" class="touch-btn btn-bash" data-action="bash">
                    <span class="btn-icon">🎯</span>
                    <span class="btn-label">BASH</span>
                </button>
                <button id="touch-btn-stomp" class="touch-btn btn-stomp" data-action="stomp">
                    <span class="btn-icon">⚡</span>
                    <span class="btn-label">STOMP</span>
                </button>
                <button id="touch-btn-dash" class="touch-btn btn-dash" data-action="dash">
                    <span class="btn-icon">💨</span>
                    <span class="btn-label">DASH</span>
                </button>
                <button id="touch-btn-attack" class="touch-btn btn-attack" data-action="attack">
                    <span class="btn-icon">⚔️</span>
                    <span class="btn-label">ESPADA</span>
                </button>
                <button id="touch-btn-jump" class="touch-btn btn-jump" data-action="jump">
                    <span class="btn-icon">🦘</span>
                    <span class="btn-label">SALTO</span>
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'touch-toggle-btn';
        toggleBtn.innerHTML = `<span>📱</span><span id="touch-toggle-text">Táctil</span>`;
        toggleBtn.addEventListener('click', () => {
            this.toggle();
        });
        document.body.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;
    }

    show() {
        this.enabled = true;
        if (this.overlay) this.overlay.classList.add('active');
        const bar = document.getElementById('controls-bar');
        if (bar) bar.classList.add('touch-hidden');
        const txt = document.getElementById('touch-toggle-text');
        if (txt) txt.innerText = 'Táctil ON';
    }

    hide() {
        this.enabled = false;
        if (this.overlay) this.overlay.classList.remove('active');
        const bar = document.getElementById('controls-bar');
        if (bar) bar.classList.remove('touch-hidden');
        const txt = document.getElementById('touch-toggle-text');
        if (txt) txt.innerText = 'Táctil OFF';
        this.resetInputs();
    }

    toggle() {
        if (this.enabled) this.hide();
        else this.show();
    }

    resetInputs() {
        this.moveX = 0;
        this.moveY = 0;
        this.holdingJump = false;
        this.justPressedJump = false;
        this.justPressedDash = false;
        this.attack = false;
        this.holdingBash = false;
        this.stomp = false;
        this.stickPointerId = null;

        const knob = document.getElementById('touch-stick-knob');
        if (knob) {
            knob.style.transform = 'translate(-50%, -50%)';
        }
    }

    bindEvents() {
        const stickZone = document.getElementById('touch-stick-zone');
        const stickKnob = document.getElementById('touch-stick-knob');
        const stickBase = document.getElementById('touch-stick-base');

        if (!stickZone) return;

        // --- Virtual Joystick Tracking ---
        const handleStickStart = (e) => {
            if (this.stickPointerId !== null) return;
            this.stickPointerId = e.pointerId;

            const rect = stickBase.getBoundingClientRect();
            this.stickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            handleStickMove(e);
        };

        const handleStickMove = (e) => {
            if (e.pointerId !== this.stickPointerId) return;

            const dx = e.clientX - this.stickCenter.x;
            const dy = e.clientY - this.stickCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxR = this.stickRadius;

            let clampedX = dx;
            let clampedY = dy;

            if (dist > maxR) {
                clampedX = (dx / dist) * maxR;
                clampedY = (dy / dist) * maxR;
            }

            stickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

            // Normalized input (-1.0 to 1.0) with slight deadzone
            const deadzone = 8;
            if (dist < deadzone) {
                this.moveX = 0;
                this.moveY = 0;
            } else {
                this.moveX = Math.max(-1, Math.min(1, clampedX / maxR));
                this.moveY = Math.max(-1, Math.min(1, clampedY / maxR));
            }
        };

        const handleStickEnd = (e) => {
            if (e.pointerId !== this.stickPointerId) return;
            this.stickPointerId = null;
            this.moveX = 0;
            this.moveY = 0;
            stickKnob.style.transform = 'translate(-50%, -50%)';
        };

        stickZone.addEventListener('pointerdown', handleStickStart);
        window.addEventListener('pointermove', handleStickMove);
        window.addEventListener('pointerup', handleStickEnd);
        window.addEventListener('pointercancel', handleStickEnd);

        // --- Action Buttons Tracking ---
        const buttons = this.overlay.querySelectorAll('.touch-btn');
        buttons.forEach(btn => {
            const action = btn.dataset.action;

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.triggerActionStart(action);
            });

            const onRelease = (e) => {
                btn.classList.remove('pressed');
                this.triggerActionEnd(action);
            };

            btn.addEventListener('pointerup', onRelease);
            btn.addEventListener('pointercancel', onRelease);
            btn.addEventListener('pointerleave', onRelease);
        });
    }

    triggerActionStart(action) {
        switch (action) {
            case 'jump':
                this.holdingJump = true;
                this.justPressedJump = true;
                break;
            case 'attack':
                this.attack = true;
                break;
            case 'dash':
                this.justPressedDash = true;
                break;
            case 'bash':
                this.holdingBash = true;
                break;
            case 'stomp':
                this.stomp = true;
                break;
        }
    }

    triggerActionEnd(action) {
        switch (action) {
            case 'jump':
                this.holdingJump = false;
                break;
            case 'attack':
                this.attack = false;
                break;
            case 'bash':
                this.holdingBash = false;
                break;
        }
    }
}

window.TouchControlsManager = TouchControlsManager;