/**
 * common.js
 * Common JavaScript functions for MIRAINA website
 */

document.addEventListener('DOMContentLoaded', function () {
  // Handle mobile navigation toggle
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const mobileNav = document.querySelector('.mobile-nav');
  const body = document.body;

  if (hamburgerMenu && mobileNav) {
    hamburgerMenu.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
      body.classList.toggle('menu-open');
    });
  }

  // Handle header scroll behavior
  const header = document.querySelector('.site-header');
  let lastScrollTop = 0;

  function handleScroll() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add shadow and change background opacity based on scroll position
    if (scrollTop > 50) {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
      header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    }

    lastScrollTop = scrollTop;
  }

  window.addEventListener('scroll', handleScroll);

  // Initialize lazy loading for images
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support native lazy loading
    const lazyloadImages = document.querySelectorAll('img[loading="lazy"]');

    if (lazyloadImages.length > 0) {
      const imageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const image = entry.target;
            image.src = image.dataset.src;
            imageObserver.unobserve(image);
          }
        });
      });

      lazyloadImages.forEach(function (image) {
        imageObserver.observe(image);
      });
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        if (mobileNav && mobileNav.classList.contains('active')) {
          mobileNav.classList.remove('active');
          body.classList.remove('menu-open');
        }
      }
    });
  });

  // Add current page indicator to navigation
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.global-nav a, .mobile-nav a');

  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });

  // === Aboutページ用：MVVセクションのフェードイン ===
  var mvvSections = document.querySelectorAll('.mvv-section');
  if (!mvvSections.length) return;
  var observer = new window.IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  mvvSections.forEach(function (section) {
    observer.observe(section);
  });

  if (window.location.pathname.match(/about\.html$/)) {
    document.body.classList.add('about-page');
  }

  function updateOverviewArrows() {
    var arrows = document.querySelectorAll('.ai-overview-arrow');
    var isMobile = window.innerWidth <= 900;
    arrows.forEach(function (arrow) {
      arrow.textContent = isMobile ? '↓' : '→';
    });
  }
  window.addEventListener('load', updateOverviewArrows);
  window.addEventListener('resize', updateOverviewArrows);
});
// ===== FAQ Accordion =====
(function () {
  function setMaxHeight(panel, expand) {
    if (!panel) return;
    if (expand) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      panel.style.maxHeight = '0px';
    }
  }

  function closeOthers(currentItem) {
    document.querySelectorAll('.faq-item[open]').forEach((opened) => {
      if (opened !== currentItem) {
        opened.removeAttribute('open');
        opened.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        setMaxHeight(opened.querySelector('.faq-a'), false);
      }
    });
  }

  function setup(item) {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');

    if (!btn || !panel) return;

    // 初期状態
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panel.id || '');
    btn.setAttribute('role', 'button');

    // クリックで開閉
    btn.addEventListener('click', () => {
      const isOpen = item.hasAttribute('open');
      if (isOpen) {
        item.setAttribute('closing', '');
        setMaxHeight(panel, false);
        btn.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
          item.removeAttribute('closing');
          item.removeAttribute('open');
        }, 300);
      } else {
        closeOthers(item); // アコーディオン（単一開き）にしたくない場合はこの行を削除
        item.setAttribute('opening', '');
        item.setAttribute('open', '');
        setMaxHeight(panel, true);
        btn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          item.removeAttribute('opening');
        }, 300);
      }
    });

    // リサイズでmax-height再計算
    window.addEventListener('resize', () => {
      if (item.hasAttribute('open')) setMaxHeight(panel, true);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.faq-item').forEach(setup);
  });
})();