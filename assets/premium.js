(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let headerListenerAdded = false;

  const setupHome = (home) => {
    if (!home || home.dataset.jfReady === 'true') return;
    home.dataset.jfReady = 'true';

    const hero = home.querySelector('.jf-hero');
    const collections = home.querySelector('.jf-collections, .jf-products');

    if (!headerListenerAdded) {
      const headerState = () => {
        const headerGroupHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--header-group-height')) || 120;
        const scrolledPastIntro = collections ? window.scrollY >= collections.offsetTop : window.scrollY > headerGroupHeight;
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

    const bands = [...home.querySelectorAll('[data-jf-hero-band]')];
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

    moveHero();
    if (!reducedMotion) window.addEventListener('scroll', moveHero, { passive: true });
  };

  document.querySelectorAll('.jf-home').forEach(setupHome);

  // The Shopify editor replaces a section in-place after a setting or block changes.
  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll?.('.jf-home').forEach(setupHome);
  });
})();
