(() => {
  let headerListenerAdded = false;

  const setupHome = (home) => {
    if (!home || home.dataset.jfReady === 'true') return;
    home.dataset.jfReady = 'true';

    const hero = home.querySelector('.jf-hero');

    if (!headerListenerAdded) {
      const headerState = () => {
        // The header is only transparent while it sits on the hero; as soon as the next section
        // slides under it, it switches to the solid cream state so it never covers content.
        const heroSection = document.querySelector('.jf-home .jf-hero');
        const headerGroupHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--header-group-height')) || 120;
        const headerHeight = document.querySelector('#header-component')?.offsetHeight || headerGroupHeight;
        const scrolledPastIntro = heroSection ? window.scrollY >= heroSection.offsetTop + heroSection.offsetHeight - headerHeight : window.scrollY > headerGroupHeight;
        document.body.classList.toggle('jf-header-scrolled', scrolledPastIntro);
      };
      headerState();
      window.addEventListener('scroll', headerState, { passive: true });
      headerListenerAdded = true;
    }

    const reveals = home.querySelectorAll('[data-jf-reveal]');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: .13 });
      reveals.forEach((element) => observer.observe(element));
    } else reveals.forEach((element) => element.classList.add('is-visible'));

    if (!hero) return;
    const bands = [...home.querySelectorAll('[data-jf-hero-band]')];
    let heroAnimationFrame;
    const moveHero = () => {
      if (!hero) return;
      const availableScroll = Math.max(1, hero.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, (window.scrollY - hero.offsetTop) / availableScroll));
      const directions = [-1, 1, 1, -1];
      const speeds = [94, 78, 88, 74];
      bands.forEach((band, index) => {
        const offset = (progress - .5) * speeds[index] * directions[index];
        band.style.setProperty('--jf-band-shift', `${offset}vw`);
      });
    };
    const queueHeroMotion = () => {
      if (heroAnimationFrame) return;
      heroAnimationFrame = window.requestAnimationFrame(() => {
        moveHero();
        heroAnimationFrame = undefined;
      });
    };

    moveHero();
    // The image bands always react to scrolling, including on iPhone.
    window.addEventListener('scroll', queueHeroMotion, { passive: true });
    window.addEventListener('resize', queueHeroMotion, { passive: true });
    window.addEventListener('orientationchange', queueHeroMotion, { passive: true });
  };

  document.querySelectorAll('.jf-home').forEach(setupHome);

  // The Shopify editor replaces a section in-place after a setting or block changes.
  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll?.('.jf-home').forEach(setupHome);
  });
})();

// Keeps every word whole: if a single word is wider than its container at the
// current viewport, the heading's font size is scaled down instead of breaking the word.
(() => {
  const selector = '#MainContent :is(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6)';
  const fitted = new WeakSet();

  const availableWidth = (element) => {
    const parent = element.parentElement;
    if (!parent) return element.clientWidth;
    const style = getComputedStyle(parent);
    return parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  };

  const fitElement = (element) => {
    if (element.closest('jumbo-text, .jf-spotlight__marquee')) return;
    if (element.style.fontSize && !fitted.has(element)) return;
    const style = getComputedStyle(element);
    if (style.whiteSpace.includes('nowrap') || style.textOverflow === 'ellipsis') return;

    element.style.removeProperty('font-size');
    fitted.delete(element);
    if (!element.clientWidth) return;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const target = Math.min(element.clientWidth, availableWidth(element));
      const needed = Math.max(element.scrollWidth, element.offsetWidth);
      if (needed <= target + 1) break;
      const fontSize = parseFloat(getComputedStyle(element).fontSize);
      element.style.fontSize = `${Math.floor(fontSize * (target / needed) * 2) / 2}px`;
      fitted.add(element);
    }
  };

  let frame;
  const fitWords = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      document.querySelectorAll(selector).forEach(fitElement);
    });
  };

  fitWords();
  document.fonts?.ready.then(fitWords);
  window.addEventListener('load', fitWords);
  window.addEventListener('resize', fitWords, { passive: true });
  window.addEventListener('orientationchange', fitWords, { passive: true });
  document.addEventListener('shopify:section:load', fitWords);
})();
