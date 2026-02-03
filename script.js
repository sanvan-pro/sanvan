// ——— Three.js: 3D hero scene (wireframe + particles) ———
let scene, camera, renderer;
let wireframeGroup, particleSystem;
let mouseX = 0, mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Wireframe geometries (floating shapes)
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.35
    });

    wireframeGroup = new THREE.Group();

    const geometries = [
        new THREE.BoxGeometry(80, 80, 80),
        new THREE.OctahedronGeometry(60, 0),
        new THREE.TetrahedronGeometry(50, 0),
        new THREE.IcosahedronGeometry(45, 0)
    ];

    const positions = [
        [120, 60, -100],
        [-100, -40, -80],
        [80, -80, -120],
        [-80, 100, -90]
    ];

    geometries.forEach((geo, i) => {
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, wireframeMaterial);
        line.position.set(...positions[i]);
        line.userData.baseRotation = { x: Math.random() * 0.02, y: Math.random() * 0.02, z: Math.random() * 0.02 };
        wireframeGroup.add(line);
    });

    scene.add(wireframeGroup);

    // Particle layer
    const particleCount = 1200;
    const pGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pPositions[i3] = (Math.random() - 0.5) * 1200;
        pPositions[i3 + 1] = (Math.random() - 0.5) * 1200;
        pPositions[i3 + 2] = (Math.random() - 0.5) * 800;
        color.setHSL(0.35 + Math.random() * 0.08, 0.6, 0.65);
        pColors[i3] = color.r;
        pColors[i3 + 1] = color.g;
        pColors[i3 + 2] = color.b;
    }

    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMaterial = new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(pGeometry, pMaterial);
    scene.add(particleSystem);

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onWindowResize);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    if (wireframeGroup) {
        wireframeGroup.rotation.y = t * 0.08 + mouseX * 0.0003;
        wireframeGroup.rotation.x = mouseY * 0.0003;
        wireframeGroup.children.forEach((child, i) => {
            child.rotation.x += 0.008 + i * 0.002;
            child.rotation.y += 0.01;
        });
    }

    if (particleSystem) {
        particleSystem.rotation.y = t * 0.02;
        const pos = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i + 1] += Math.sin(t + pos[i] * 0.008) * 0.15;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x += (mouseX * 0.15 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.15 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

function onMouseMove(e) {
    mouseX = e.clientX - windowHalfX;
    mouseY = e.clientY - windowHalfY;
}

function onWindowResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ——— Smooth scroll ———
function initSmoothScrolling() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const el = document.querySelector(href);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ——— Mobile menu ———
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ——— Navbar on scroll ———
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
}

// ——— Scroll-triggered animations ———
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.work-card, .hobby-card, .skill-category, .about-content, .cert-badge, .cert-card-text').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// ——— Counter animation for stats ———
function initCounterAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10) || 0;
            let current = 0;
            const step = target / 50;
            const duration = 1500;
            const stepTime = duration / 50;

            const tick = () => {
                current += step;
                if (current < target) {
                    el.textContent = Math.round(current);
                    setTimeout(tick, stepTime);
                } else {
                    el.textContent = target;
                }
            };
            tick();
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(el => observer.observe(el));
}

// ——— Footer year ———
function setFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
}

// ——— Init ———
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initSmoothScrolling();
    initMobileMenu();
    initNavbarScroll();
    initScrollAnimations();
    initCounterAnimation();
    setFooterYear();
});
