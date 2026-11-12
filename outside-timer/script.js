(() => {
  const pageURL = new URL(window.location.href);
  if (pageURL.protocol !== 'file:' && pageURL.pathname.endsWith('/outside-timer/index.html')) {
    pageURL.pathname = pageURL.pathname.slice(0, -'index.html'.length);
    window.history.replaceState(window.history.state, '', pageURL);
  }

  if (pageURL.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (/^(?:[a-z][a-z\d+.-]*:|\/|#|\?)/i.test(href)) return;
      const destination = new URL(href, pageURL);
      if (destination.protocol === 'file:' && destination.pathname.endsWith('/')) {
        destination.pathname += 'index.html';
        link.href = destination.href;
      }
    });
  }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const goalScene = document.querySelector('[data-goal-scene]');
  const goalHours = goalScene?.querySelector('[data-goal-hours]');
  const goalTarget = Number(goalHours?.dataset.goalHours);
  const seasonScene = document.querySelector('[data-season-scene]');
  const seasons = seasonScene ? [...seasonScene.querySelectorAll('[data-season]')] : [];
  const seasonLabel = seasonScene?.querySelector('[data-season-label]');
  const record = startAnalytics();
  const pendingDepths = [25, 50, 75, 100];
  let frame = null;
  let previousGoalProgress = -1;
  let previousSeason;

  document.querySelectorAll('[data-timer]').forEach(startTimer);
  updateScroll();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  window.addEventListener('pageshow', requestScrollUpdate);
  onMotionChange(requestScrollUpdate);

  function onMotionChange(callback) {
    if (motion.addEventListener) motion.addEventListener('change', callback);
    else motion.addListener(callback);
  }

  function requestScrollUpdate() {
    if (frame === null) frame = window.requestAnimationFrame(updateScroll);
  }

  function updateScroll() {
    frame = null;
    const viewportHeight = window.innerHeight;

    let progress;
    if (goalScene) {
      const { top, height } = goalScene.getBoundingClientRect();
      const travel = Math.max(viewportHeight * 0.65, height - viewportHeight * 0.35);
      const fraction = motion.matches ? 1 : Math.min(1, Math.max(0, (viewportHeight * 0.8 - top) / travel));
      progress = Math.round(fraction * 1000) / 1000;
    }

    let activeSeason;
    if (seasons.length) {
      const { top, height } = seasonScene.getBoundingClientRect();
      const travel = Math.max(1, height - viewportHeight);
      const fraction = Math.min(1, Math.max(0, -top / travel));
      const index = Math.min(seasons.length - 1, Math.floor(fraction * seasons.length));
      activeSeason = seasons[index].dataset.season;
    }

    if (record && pendingDepths.length) {
      const page = document.scrollingElement;
      const scrollable = page.scrollHeight - page.clientHeight;
      if (scrollable > 0 && page.scrollTop > 0) {
        const depth = 100 * Math.min(1, (page.scrollTop + 2) / scrollable);
        while (pendingDepths.length && depth >= pendingDepths[0]) {
          record('scroll_depth', { depth: pendingDepths.shift() });
        }
      }
    }

    if (progress !== undefined && progress !== previousGoalProgress) {
      previousGoalProgress = progress;
      goalScene.style.setProperty('--goal-progress', progress);
      if (goalHours && Number.isFinite(goalTarget)) {
        goalHours.textContent = Math.round(goalTarget * progress).toLocaleString('en-US');
      }
    }
    if (activeSeason && activeSeason !== previousSeason) {
      previousSeason = activeSeason;
      seasonScene.dataset.activeSeason = activeSeason;
      if (seasonLabel) {
        seasonLabel.textContent = activeSeason.charAt(0).toUpperCase() + activeSeason.slice(1);
      }
      seasons.forEach((image) => {
        image.setAttribute('aria-hidden', String(image.dataset.season !== activeSeason));
      });
    }
  }

  function startTimer(timer) {
    if (!('IntersectionObserver' in window)) return;

    let inView = false;
    let startedAt = null;
    let elapsed = 0;
    let tick = null;

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateRunningState();
    });

    observer.observe(timer);
    document.addEventListener('visibilitychange', updateRunningState);
    onMotionChange(updateRunningState);

    function updateRunningState() {
      const shouldRun = inView && !document.hidden && !motion.matches;
      if (shouldRun && startedAt === null) {
        startedAt = performance.now();
        render();
      } else if (!shouldRun && startedAt !== null) {
        elapsed += performance.now() - startedAt;
        startedAt = null;
        window.clearTimeout(tick);
      }
    }

    function render() {
      const milliseconds = elapsed + performance.now() - startedAt;
      const seconds = Math.floor(milliseconds / 1000);
      timer.textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
        .map((part) => String(part).padStart(2, '0'))
        .join(':');
      tick = window.setTimeout(render, 1000 - milliseconds % 1000);
    }
  }

  function startAnalytics() {
    const setting = document.body.dataset.analyticsEndpoint;
    if (!setting || navigator.globalPrivacyControl === true) return null;

    let endpoint;
    try {
      endpoint = new URL(setting, window.location.href);
    } catch {
      return null;
    }
    const local = endpoint.origin === window.location.origin
      && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if ((endpoint.protocol !== 'https:' && !local) || endpoint.username || endpoint.password) return null;

    const query = new URLSearchParams(window.location.search);
    const campaign = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term']) {
      const value = query.get(key)?.trim();
      if (value && /^[\p{L}\p{N} ._+~:/-]{1,120}$/u.test(value) && !value.includes('://')) {
        campaign[key] = value;
      }
    }

    const referrer = document.referrer ? new URL(document.referrer).hostname : '';
    const internal = referrer === window.location.hostname;
    const traffic = Object.keys(campaign).length ? 'campaign' : internal ? 'internal' : referrer ? 'referral' : 'direct';
    const ua = navigator.userAgent;
    const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)
      || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'tablet'
      : /Mobile|iPhone|iPod/i.test(ua) ? 'mobile' : 'desktop';
    const browser = [
      ['edge', /Edg(?:A|iOS)?\//],
      ['firefox', /(?:Firefox|FxiOS)\//],
      ['chrome', /(?:Chrome|CriOS)\//],
      ['safari', /Safari\//]
    ].find(([, pattern]) => pattern.test(ua))?.[0] || 'other';

    const context = {
      path: window.location.pathname,
      traffic,
      referrer_host: internal ? '' : referrer,
      campaign,
      device,
      browser
    };

    function send(event, details = {}) {
      // A plain-text JSON payload can be sent without a cross-origin preflight.
      window.fetch(endpoint.href, {
        method: 'POST',
        body: JSON.stringify({ event, ...context, ...details }),
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        mode: 'no-cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        keepalive: true
      }).catch(() => {});
    }

    send('page_view');

    if ('IntersectionObserver' in window) {
      const visibleSections = new Set();
      const sections = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSections.add(entry.target);
          else visibleSections.delete(entry.target);
        }
        recordVisibleSections();
      }, { rootMargin: '-72px 0px' });
      document.querySelectorAll('[data-section]').forEach((section) => sections.observe(section));
      document.addEventListener('visibilitychange', recordVisibleSections);

      function recordVisibleSections() {
        if (document.hidden) return;
        for (const section of visibleSections) {
          send('section_view', { section: section.dataset.section });
          sections.unobserve(section);
        }
        visibleSections.clear();
      }
    }

    function recordStoreClick(event) {
      const link = event.target.closest?.('a[data-app-store]');
      if (link) send('app_store_click', { placement: link.dataset.appStore });
    }

    document.addEventListener('click', recordStoreClick);
    document.addEventListener('auxclick', (event) => {
      if (event.button === 1) recordStoreClick(event);
    });

    return send;
  }
})();
