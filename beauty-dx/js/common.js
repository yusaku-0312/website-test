document.addEventListener('DOMContentLoaded', () => {
    // ─── Hamburger Menu ───
    const hamburger = document.getElementById('bdx-hamburger');
    const mobileMenu = document.getElementById('bdx-mobile-menu');
    const body = document.body;

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = hamburger.classList.toggle('is-active');
            mobileMenu.classList.toggle('is-active');
            body.style.overflow = isActive ? 'hidden' : '';
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('is-active');
                mobileMenu.classList.remove('is-active');
                body.style.overflow = '';
            });
        });
    }

    // ─── Mobile Service Submenu Toggle ───
    const mobileServiceToggle = document.getElementById('bdx-mobile-service-toggle');
    const mobileServiceSub = document.getElementById('bdx-mobile-service-sub');

    if (mobileServiceToggle && mobileServiceSub) {
        mobileServiceToggle.addEventListener('click', (e) => {
            e.preventDefault();
            mobileServiceSub.classList.toggle('is-open');
            mobileServiceToggle.classList.toggle('is-open');
        });
    }

    // ─── Fade In Animation (IntersectionObserver) ───
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.bdx-fade-in').forEach(el => fadeObserver.observe(el));

    // ─── Smooth Scroll for Anchors ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('is-active')) {
                    hamburger.classList.remove('is-active');
                    mobileMenu.classList.remove('is-active');
                    body.style.overflow = '';
                }

                const headerHeight = document.querySelector('.bdx-header')?.offsetHeight || 0;
                const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ─── FAQ Toggle ───
    document.querySelectorAll('.sd-faq-q').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.closest('.sd-faq-item');
            if (item) {
                item.classList.toggle('is-open');
            }
        });
    });
});
