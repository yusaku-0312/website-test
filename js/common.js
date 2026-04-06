document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu
    const hamburger = document.getElementById('js-hamburger');
    const mobileMenu = document.getElementById('js-mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-active');
        });
    }

    // Fade-in Animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));

    // Floating CTA visibility on scroll
    const floatingCta = document.getElementById('js-floating-cta');
    if (floatingCta) {
        const toggleFloating = () => {
            if (window.scrollY > 400) {
                floatingCta.classList.add('is-visible');
            } else {
                floatingCta.classList.remove('is-visible');
            }
        };
        window.addEventListener('scroll', toggleFloating, { passive: true });
    }

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('is-active')) {
                    mobileMenu.classList.remove('is-active');
                }

                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const elementPosition = target.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
