/* Anna's Travel — interactions
 * - Scroll reveal for chapter content
 * - Lightbox with keyboard / swipe navigation
 */

(() => {
  'use strict';

  /* ---------- Scroll reveal ---------- */

  const revealTargets = document.querySelectorAll(
    '.chapter__head, .card, .aside, .colophon__inner'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${Math.min(i * 40, 200)}ms`;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Lightbox ---------- */

  const cards = Array.from(document.querySelectorAll('.card[data-photo]'));
  const photos = cards.map(card => {
    const img = card.querySelector('img');
    const cap = card.querySelector('figcaption');
    return {
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      no: cap.querySelector('.caption__no')?.textContent ?? '',
      title: cap.querySelector('.caption__title')?.textContent ?? '',
      where: cap.querySelector('.caption__where')?.textContent ?? ''
    };
  });

  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('.lightbox__img');
  const lbNo = lb.querySelector('.lightbox__no');
  const lbTitle = lb.querySelector('.lightbox__title');
  const lbWhere = lb.querySelector('.lightbox__where');
  const btnClose = lb.querySelector('.lightbox__close');
  const btnPrev = lb.querySelector('.lightbox__nav--prev');
  const btnNext = lb.querySelector('.lightbox__nav--next');

  let current = 0;
  let lastFocus = null;

  function render(i) {
    const p = photos[i];
    if (!p) return;
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    lbNo.textContent = p.no;
    lbTitle.textContent = p.title;
    lbWhere.textContent = p.where;
    current = i;
  }

  function open(i) {
    lastFocus = document.activeElement;
    render(i);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    btnClose.focus({ preventScroll: true });
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      lb.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 220);
  }

  function step(delta) {
    const next = (current + delta + photos.length) % photos.length;
    render(next);
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => open(i));
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open photograph ${i + 1}`);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => step(-1));
  btnNext.addEventListener('click', () => step(1));

  lb.addEventListener('click', (e) => {
    // click on backdrop (not on the image or controls) closes
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // Touch swipe on small screens
  let touchX = null;
  lb.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].screenX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
})();
