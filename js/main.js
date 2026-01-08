/* ============================================
   TK Portfolio - Smooth Scroll Animations
   Using lerp for buttery smooth movement
   ============================================ */

/* ============================================
   CONTENT PROTECTION
   Disable right-click, text selection shortcuts
   ============================================ */
(function() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Disable common keyboard shortcuts for copying/saving
    document.addEventListener('keydown', (e) => {
        // Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+Shift+I, F12
        if (
            (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
            (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
            e.key === 'F12'
        ) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable drag on images
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
})();

/* ============================================
   SMOOTH SCROLL ENGINE
   Creates buttery smooth scrolling by lerping
   the visual scroll position
   ============================================ */
class SmoothScroll {
    constructor() {
        this.wrapper = document.getElementById('smoothWrapper');
        this.container = document.getElementById('scrollContainer');
        
        if (!this.wrapper || !this.container) return;
        
        // Scroll state
        this.scrollY = 0;           // Current visual scroll position
        this.targetScrollY = 0;     // Target scroll position (from wheel/touch)
        this.lerpFactor = 0.08;     // Smoothing factor (lower = smoother but slower)
        this.velocity = 0;          // For momentum
        
        // Bounds
        this.maxScroll = 0;
        
        // Touch tracking
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.isTouching = false;
        
        this.init();
    }
    
    init() {
        // Enable smooth scroll mode
        document.documentElement.classList.add('smooth-scroll-enabled');
        
        // Calculate scrollable height
        this.calculateBounds();
        
        // Create virtual scrollbar (for scroll position tracking)
        this.createScrollSpacer();
        
        // Event listeners
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Touch events for mobile
        this.wrapper.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.wrapper.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.wrapper.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Keyboard scrolling
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Start animation loop
        this.animate();
    }
    
    calculateBounds() {
        // Wait for content to render
        this.maxScroll = this.container.scrollHeight - window.innerHeight;
    }
    
    createScrollSpacer() {
        // Create a spacer element that makes the page "scrollable" for native scrollbar
        let spacer = document.querySelector('.scroll-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.className = 'scroll-spacer';
            document.body.appendChild(spacer);
        }
        spacer.style.height = (this.container.scrollHeight) + 'px';
    }
    
    onWheel(e) {
        e.preventDefault();
        
        // Get scroll delta (normalize across browsers)
        let delta = e.deltaY;
        
        // Handle different delta modes
        if (e.deltaMode === 1) { // Lines
            delta *= 40;
        } else if (e.deltaMode === 2) { // Pages
            delta *= window.innerHeight;
        }
        
        // Add to target scroll
        this.targetScrollY += delta;
        
        // Clamp to bounds
        this.targetScrollY = Math.max(0, Math.min(this.targetScrollY, this.maxScroll));
    }
    
    onTouchStart(e) {
        this.isTouching = true;
        this.touchStartY = e.touches[0].clientY;
        this.touchCurrentY = this.touchStartY;
    }
    
    onTouchMove(e) {
        if (!this.isTouching) return;
        e.preventDefault();
        
        const touchY = e.touches[0].clientY;
        const delta = this.touchCurrentY - touchY;
        this.touchCurrentY = touchY;
        
        this.targetScrollY += delta * 1.5; // Multiply for better feel
        this.targetScrollY = Math.max(0, Math.min(this.targetScrollY, this.maxScroll));
    }
    
    onTouchEnd() {
        this.isTouching = false;
    }
    
    onKeyDown(e) {
        const scrollAmount = window.innerHeight * 0.3;
        
        switch(e.key) {
            case 'ArrowDown':
            case 'PageDown':
                this.targetScrollY += scrollAmount;
                break;
            case 'ArrowUp':
            case 'PageUp':
                this.targetScrollY -= scrollAmount;
                break;
            case 'Home':
                this.targetScrollY = 0;
                break;
            case 'End':
                this.targetScrollY = this.maxScroll;
                break;
            case ' ': // Spacebar
                if (e.shiftKey) {
                    this.targetScrollY -= window.innerHeight * 0.8;
                } else {
                    this.targetScrollY += window.innerHeight * 0.8;
                }
                e.preventDefault();
                break;
            default:
                return;
        }
        
        this.targetScrollY = Math.max(0, Math.min(this.targetScrollY, this.maxScroll));
    }
    
    onResize() {
        this.calculateBounds();
        this.createScrollSpacer();
        this.targetScrollY = Math.min(this.targetScrollY, this.maxScroll);
    }
    
    animate() {
        // Lerp toward target
        const diff = this.targetScrollY - this.scrollY;
        this.scrollY += diff * this.lerpFactor;
        
        // Apply transform (GPU accelerated)
        this.container.style.transform = `translate3d(0, ${-this.scrollY}px, 0)`;
        
        // Dispatch custom scroll event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('smoothscroll', { 
            detail: { 
                scrollY: this.scrollY,
                targetScrollY: this.targetScrollY,
                maxScroll: this.maxScroll
            }
        }));
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    // Public method to get current scroll position
    getScrollY() {
        return this.scrollY;
    }
    
    // Public method to scroll to position
    scrollTo(y, instant = false) {
        this.targetScrollY = Math.max(0, Math.min(y, this.maxScroll));
        if (instant) {
            this.scrollY = this.targetScrollY;
        }
    }
}

// Global instance
let smoothScrollInstance = null;

class SmoothScrollAnimator {
    constructor() {
        // DOM Elements
        this.svg = document.querySelector('.main-svg');
        this.scrollIndicator = document.querySelector('.scroll-indicator');
        this.nav = document.querySelector('.nav');
        this.sections = document.querySelectorAll('.scroll-section');
        
        // SVG Layers
        this.layers = {
            outer: document.querySelector('.layer-outer'),
            gearOuter: document.querySelector('.layer-gear-outer'),
            gearInner: document.querySelector('.layer-gear-inner'),
            spokes: document.querySelector('.layer-spokes'),
            circuits: document.querySelector('.layer-circuits'),
            hub: document.querySelector('.layer-hub'),
            compass: document.querySelector('.layer-compass'),
            orbits: document.querySelector('.layer-orbits'),
            textRing: document.querySelector('.layer-text-ring'),
            bgGlow: document.querySelector('.bg-glow')
        };
        
        this.circuitPaths = document.querySelectorAll('.circuit-path');
        this.circuitNodes = document.querySelectorAll('.circuit-node');
        this.orbitDots = document.querySelectorAll('.orbit-dot-group');
        
        // Animation state (current smooth values)
        this.current = {
            scrollProgress: 0,
            gearOuterRotation: 0,
            gearInnerRotation: 0,
            spokesRotation: 0,
            compassRotation: 0,
            orbitRotation1: 0,
            orbitRotation2: 0,
            orbitRotation3: 0,
            scale: 1,
            outerOpacity: 0,
            circuitsOpacity: 0,
            textRingOpacity: 0,
            glowOpacity: 0
        };
        
        // Target values (from scroll position)
        this.target = { ...this.current };
        
        // Lerp factor (0.05 - 0.15 for smooth, higher = faster response)
        this.lerpFactor = 0.08;
        
        // Total scrollable height in terms of section count
        this.totalSections = this.sections.length;
        
        // Initialize circuit path lengths
        this.initCircuitPaths();
        
        // Bind methods
        this.onScroll = this.onScroll.bind(this);
        this.animate = this.animate.bind(this);
        
        // Start
        this.init();
    }
    
    init() {
        // Listen to smooth scroll events (from SmoothScroll class)
        window.addEventListener('smoothscroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll, { passive: true });
        
        // Start animation loop
        this.animate();
        
        // Initial scroll calculation
        this.onScroll({ detail: { scrollY: 0, maxScroll: 1 } });
        
        // Intersection observer for content cards
        this.setupIntersectionObserver();
    }
    
    initCircuitPaths() {
        // Calculate and set stroke-dasharray for each path
        this.circuitPaths.forEach(path => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        });
    }
    
    onScroll(e) {
        // Get scroll position from smooth scroll event or fallback
        const scrollY = e && e.detail ? e.detail.scrollY : (smoothScrollInstance ? smoothScrollInstance.getScrollY() : window.scrollY);
        const windowHeight = window.innerHeight;
        const docHeight = e && e.detail ? e.detail.maxScroll : (document.documentElement.scrollHeight - windowHeight);
        
        // Overall scroll progress (0 to 1)
        const scrollProgress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
        
        // Section-based progress (for more granular control)
        const sectionHeight = windowHeight;
        const currentSection = Math.floor(scrollY / sectionHeight);
        const sectionProgress = (scrollY % sectionHeight) / sectionHeight;
        
        // Update target values based on scroll
        this.target.scrollProgress = scrollProgress;
        
        // Gear rotations - smooth continuous rotation based on scroll
        this.target.gearOuterRotation = scrollProgress * 360 * 2; // 2 full rotations
        this.target.gearInnerRotation = -scrollProgress * 360 * 3; // Counter-rotate, 3 rotations
        this.target.spokesRotation = scrollProgress * 180; // Half rotation
        
        // Compass needle points to different directions based on section
        this.target.compassRotation = currentSection * 45;
        
        // Orbit rotations (continuous, different speeds)
        this.target.orbitRotation1 = scrollProgress * 360;
        this.target.orbitRotation2 = scrollProgress * 540;
        this.target.orbitRotation3 = scrollProgress * 720;
        
        // Scale: starts at 1, shrinks slightly in middle, back to 1
        const scaleCurve = 1 - Math.sin(scrollProgress * Math.PI) * 0.15;
        this.target.scale = scaleCurve;
        
        // Layer opacities based on scroll progress
        // Outer compass ring appears after first section
        this.target.outerOpacity = this.smoothStep(0.1, 0.25, scrollProgress);
        
        // Circuits appear in skills section
        this.target.circuitsOpacity = this.smoothStep(0.35, 0.5, scrollProgress);
        
        // Text ring appears later
        this.target.textRingOpacity = this.smoothStep(0.6, 0.75, scrollProgress);
        
        // Background glow pulses based on scroll
        this.target.glowOpacity = 0.3 + Math.sin(scrollProgress * Math.PI * 4) * 0.2;
        
        // Hide scroll indicator after scrolling
        if (scrollProgress > 0.05) {
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.scrollIndicator?.classList.remove('hidden');
        }
        
        // Nav background
        if (scrollY > 100) {
            this.nav?.classList.add('scrolled');
        } else {
            this.nav?.classList.remove('scrolled');
        }
        
        // Animate skill bars when in view
        this.animateSkillBars(scrollProgress);
        
        // Draw circuit paths based on scroll
        this.drawCircuits(scrollProgress);
    }
    
    // Smooth step function for gradual transitions
    smoothStep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    // Linear interpolation
    lerp(current, target, factor) {
        return current + (target - current) * factor;
    }
    
    animate() {
        // Lerp all values for smooth animation
        this.current.scrollProgress = this.lerp(this.current.scrollProgress, this.target.scrollProgress, this.lerpFactor);
        this.current.gearOuterRotation = this.lerp(this.current.gearOuterRotation, this.target.gearOuterRotation, this.lerpFactor);
        this.current.gearInnerRotation = this.lerp(this.current.gearInnerRotation, this.target.gearInnerRotation, this.lerpFactor);
        this.current.spokesRotation = this.lerp(this.current.spokesRotation, this.target.spokesRotation, this.lerpFactor);
        this.current.compassRotation = this.lerp(this.current.compassRotation, this.target.compassRotation, this.lerpFactor * 0.5); // Slower for compass
        this.current.orbitRotation1 = this.lerp(this.current.orbitRotation1, this.target.orbitRotation1, this.lerpFactor);
        this.current.orbitRotation2 = this.lerp(this.current.orbitRotation2, this.target.orbitRotation2, this.lerpFactor);
        this.current.orbitRotation3 = this.lerp(this.current.orbitRotation3, this.target.orbitRotation3, this.lerpFactor);
        this.current.scale = this.lerp(this.current.scale, this.target.scale, this.lerpFactor);
        this.current.outerOpacity = this.lerp(this.current.outerOpacity, this.target.outerOpacity, this.lerpFactor);
        this.current.circuitsOpacity = this.lerp(this.current.circuitsOpacity, this.target.circuitsOpacity, this.lerpFactor);
        this.current.textRingOpacity = this.lerp(this.current.textRingOpacity, this.target.textRingOpacity, this.lerpFactor);
        this.current.glowOpacity = this.lerp(this.current.glowOpacity, this.target.glowOpacity, this.lerpFactor);
        
        // Apply transforms to SVG layers
        this.applyTransforms();
        
        // Continue animation loop
        requestAnimationFrame(this.animate);
    }
    
    applyTransforms() {
        // Outer gear - rotate clockwise
        if (this.layers.gearOuter) {
            this.layers.gearOuter.style.transform = `rotate(${this.current.gearOuterRotation}deg)`;
        }
        
        // Inner gear - rotate counter-clockwise
        if (this.layers.gearInner) {
            this.layers.gearInner.style.transform = `rotate(${this.current.gearInnerRotation}deg)`;
        }
        
        // Spokes - rotate slowly
        if (this.layers.spokes) {
            this.layers.spokes.style.transform = `rotate(${this.current.spokesRotation}deg)`;
        }
        
        // Compass - points to sections
        if (this.layers.compass) {
            this.layers.compass.style.transform = `rotate(${this.current.compassRotation}deg)`;
        }
        
        // Orbit dots - different rotation speeds
        if (this.orbitDots[0]) {
            this.orbitDots[0].style.transform = `rotate(${this.current.orbitRotation1}deg)`;
        }
        if (this.orbitDots[1]) {
            this.orbitDots[1].style.transform = `rotate(${this.current.orbitRotation2}deg)`;
        }
        if (this.orbitDots[2]) {
            this.orbitDots[2].style.transform = `rotate(${this.current.orbitRotation3}deg)`;
        }
        
        // Overall SVG scale
        if (this.svg) {
            this.svg.style.transform = `scale(${this.current.scale})`;
        }
        
        // Layer opacities
        if (this.layers.outer) {
            this.layers.outer.style.opacity = this.current.outerOpacity;
        }
        
        if (this.layers.circuits) {
            this.layers.circuits.style.opacity = this.current.circuitsOpacity;
        }
        
        if (this.layers.textRing) {
            this.layers.textRing.style.opacity = this.current.textRingOpacity;
        }
        
        if (this.layers.bgGlow) {
            this.layers.bgGlow.style.opacity = this.current.glowOpacity;
        }
        
        // Pulse the circuit nodes when visible
        this.circuitNodes.forEach((node, i) => {
            const delay = i * 0.1;
            const pulse = Math.sin((this.current.scrollProgress * 10) + delay) * 0.3 + 0.7;
            node.style.opacity = this.current.circuitsOpacity * pulse;
        });
    }
    
    drawCircuits(progress) {
        // Draw circuit paths based on scroll (between 35% and 65%)
        const drawProgress = this.smoothStep(0.35, 0.65, progress);
        
        this.circuitPaths.forEach((path, index) => {
            const length = path.getTotalLength();
            // Stagger the drawing of each path
            const staggeredProgress = Math.max(0, Math.min(1, (drawProgress - index * 0.05) * 1.5));
            path.style.strokeDashoffset = length * (1 - staggeredProgress);
        });
    }
    
    animateSkillBars(progress) {
        // Animate skill bars when scrolled past 40%
        if (progress > 0.4) {
            document.querySelectorAll('.skill-fill').forEach(fill => {
                const level = fill.dataset.level;
                if (level) {
                    fill.style.width = `${level}%`;
                }
            });
        }
    }
    
    setupIntersectionObserver() {
        // Manual visibility checking for smooth scroll compatibility
        const checkVisibility = () => {
            this.sections.forEach(section => {
                // Skip already revealed sections
                if (section.dataset.revealed === 'true') return;
                
                const rect = section.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                // Check if section is in viewport (with threshold)
                const isVisible = rect.top < windowHeight * 0.85 && rect.bottom > windowHeight * 0.15;
                
                if (isVisible) {
                    // Get all animatable elements
                    const labels = section.querySelectorAll('.label');
                    const titles = section.querySelectorAll('.title-large, h2');
                    const subtitles = section.querySelectorAll('.subtitle, .contact-text');
                    const cards = section.querySelectorAll('.content-card');
                    const icons = section.querySelectorAll('.icon-item');
                    const skillsLists = section.querySelectorAll('.skills-list');
                    const projectCards = section.querySelectorAll('.project-card');
                    const buttons = section.querySelectorAll('.contact-buttons');
                    const footerText = section.querySelectorAll('.footer-text');
                    
                    // Stagger everything with precise timing
                    let delay = 0;
                    
                    // 1. Labels first (quick)
                    labels.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 50);
                    });
                    delay += 150;
                    
                    // 2. Main titles
                    titles.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 100);
                    });
                    delay += 200;
                    
                    // 3. Subtitles
                    subtitles.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 100);
                    });
                    delay += 150;
                    
                    // 4. Content cards (staggered from sides)
                    const leftCards = section.querySelectorAll('.content-left .content-card');
                    const rightCards = section.querySelectorAll('.content-right .content-card');
                    const centerCards = section.querySelectorAll('.content-center .content-card');
                    
                    leftCards.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 150);
                    });
                    
                    rightCards.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + 100 + i * 150);
                    });
                    
                    centerCards.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 150);
                    });
                    delay += 300;
                    
                    // 5. Icon items (pop in sequence)
                    icons.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 100);
                    });
                    
                    // 6. Skills lists
                    skillsLists.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 150);
                    });
                    
                    // 7. Project cards (cascade)
                    projectCards.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 120);
                    });
                    
                    // 8. Buttons
                    buttons.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + 200 + i * 100);
                    });
                    
                    // 9. Footer
                    footerText.forEach((el, i) => {
                        setTimeout(() => el.classList.add('visible'), delay + i * 100);
                    });
                    
                    // Mark section as revealed
                    section.dataset.revealed = 'true';
                }
            });
        };
        
        // Check visibility on each smooth scroll frame
        window.addEventListener('smoothscroll', checkVisibility);
        
        // Initial check
        setTimeout(checkVisibility, 100);
        
        // Setup parallax effect on content
        this.setupParallaxContent();
    }
    
    setupParallaxContent() {
        // Add subtle parallax movement to content based on scroll
        const leftContent = document.querySelectorAll('.content-left');
        const rightContent = document.querySelectorAll('.content-right');
        
        window.addEventListener('smoothscroll', (e) => {
            const scrollY = e.detail ? e.detail.scrollY : 0;
            
            leftContent.forEach(content => {
                const rect = content.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                const offset = (centerY - viewportCenter) * 0.05;
                
                // Only apply when in view
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    content.style.transform = `translateY(${offset}px)`;
                }
            });
            
            rightContent.forEach(content => {
                const rect = content.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                const offset = (centerY - viewportCenter) * -0.05;
                
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    content.style.transform = `translateY(${offset}px)`;
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scroll engine FIRST
    smoothScrollInstance = new SmoothScroll();
    
    // Then initialize scroll-based animations
    new SmoothScrollAnimator();
    
    // Initialize mouse-reactive particles
    initMouseSpotlight();
    
    // Smooth scroll for nav links (use our custom scroll)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target && smoothScrollInstance) {
                // Calculate target position
                const targetY = target.getBoundingClientRect().top + smoothScrollInstance.getScrollY();
                smoothScrollInstance.scrollTo(targetY);
            }
        });
    });
});

/* ============================================
   MOUSE-REACTIVE FLOATING PARTICLES
   ============================================ */
function initMouseSpotlight() {
    const container = document.getElementById('reactiveParticles');
    if (!container) return;
    
    const particles = [];
    const particleCount = 50;
    const mouseInfluenceRadius = 250;
    const mouseInfluenceStrength = 80;
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Particle types with different visual styles
    const particleTypes = ['orb', 'ring', 'dot', 'diamond', 'cross'];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        const size = type === 'cross' ? 20 : Math.random() * 40 + 10;
        
        particle.className = `reactive-particle ${type}`;
        
        // Random initial position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = Math.random() * 0.4 + 0.1;
        
        // Random animation delay and duration for floating effect
        const animDuration = Math.random() * 8 + 6;
        const animDelay = Math.random() * -10;
        particle.style.animation = `particleFloat ${animDuration}s ease-in-out ${animDelay}s infinite`;
        
        container.appendChild(particle);
        
        particles.push({
            element: particle,
            baseX: x,
            baseY: y,
            currentX: x,
            currentY: y,
            size: size,
            // Different particles react with different intensities
            reactivity: Math.random() * 0.5 + 0.5,
            // Drift slowly over time
            driftX: (Math.random() - 0.5) * 0.3,
            driftY: (Math.random() - 0.5) * 0.3,
            // Rotation for visual variety
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 2
        });
    }
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Animation loop
    function animate() {
        particles.forEach((p, index) => {
            // Slowly drift the base position
            p.baseX += p.driftX;
            p.baseY += p.driftY;
            
            // Wrap around screen edges
            if (p.baseX < -50) p.baseX = window.innerWidth + 50;
            if (p.baseX > window.innerWidth + 50) p.baseX = -50;
            if (p.baseY < -50) p.baseY = window.innerHeight + 50;
            if (p.baseY > window.innerHeight + 50) p.baseY = -50;
            
            // Calculate distance from mouse
            const dx = mouseX - p.baseX;
            const dy = mouseY - p.baseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Target position (pushed away from mouse if within radius)
            let targetX = p.baseX;
            let targetY = p.baseY;
            
            if (distance < mouseInfluenceRadius && distance > 0) {
                // Normalize direction and push away
                const force = (1 - distance / mouseInfluenceRadius) * mouseInfluenceStrength * p.reactivity;
                const angle = Math.atan2(dy, dx);
                targetX = p.baseX - Math.cos(angle) * force;
                targetY = p.baseY - Math.sin(angle) * force;
                
                // Also add some rotation when influenced
                p.rotation += p.rotationSpeed * (1 - distance / mouseInfluenceRadius);
            }
            
            // Smooth lerp to target position
            p.currentX += (targetX - p.currentX) * 0.08;
            p.currentY += (targetY - p.currentY) * 0.08;
            
            // Apply position and rotation
            p.element.style.transform = `translate(${p.currentX - p.baseX}px, ${p.currentY - p.baseY}px) rotate(${p.rotation}deg)`;
            p.element.style.left = p.baseX + 'px';
            p.element.style.top = p.baseY + 'px';
            
            // Brighten particles near the mouse
            if (distance < mouseInfluenceRadius) {
                const brightness = 0.2 + (1 - distance / mouseInfluenceRadius) * 0.5;
                p.element.style.opacity = brightness;
            } else {
                // Slowly fade back to original opacity
                const currentOpacity = parseFloat(p.element.style.opacity) || 0.2;
                p.element.style.opacity = currentOpacity + (0.2 - currentOpacity) * 0.05;
            }
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        particles.forEach(p => {
            // Redistribute particles that are now outside
            if (p.baseX > window.innerWidth) p.baseX = Math.random() * window.innerWidth;
            if (p.baseY > window.innerHeight) p.baseY = Math.random() * window.innerHeight;
        });
    });}