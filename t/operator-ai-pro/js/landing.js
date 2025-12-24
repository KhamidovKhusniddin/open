// Landing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Update stats with real data
    const updateRealStats = () => {
        const stats = Database.getStatistics();
        const totalQueuesEl = document.querySelector('[data-count="1000"]');
        const branchesEl = document.querySelector('[data-count="50"]');

        if (totalQueuesEl) {
            totalQueuesEl.dataset.count = Database.getQueues().length || 1000;
        }
        if (branchesEl) {
            branchesEl.dataset.count = Database.getBranches().length || 50;
        }
    };
    updateRealStats();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animated counter for stats
    const animateCounter = (element, target, duration = 2000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + (element.dataset.suffix || '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + (element.dataset.suffix || '');
            }
        }, 16);
    };

    // Intersection Observer for reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // Animate counters when they come into view
                if (entry.target.classList.contains('stat-number')) {
                    const target = parseInt(entry.target.dataset.count);
                    animateCounter(entry.target, target);
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe reveal elements
    document.querySelectorAll('.reveal, .stat-number').forEach(el => {
        observer.observe(el);
    });

    // Suble Parallax & Mouse Movement
    const hero = document.querySelector('.hero');
    const heroCard = document.querySelector('.hero-card');

    if (hero && heroCard) {
        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            const rotateY = (clientX - innerWidth / 2) / 60;
            const rotateX = (innerHeight / 2 - clientY) / 60;

            heroCard.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(-5px)`;
        });

        hero.addEventListener('mouseleave', () => {
            heroCard.style.transform = `perspective(1000px) rotateY(0) rotateX(0) translateY(0)`;
        });
    }

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
});
