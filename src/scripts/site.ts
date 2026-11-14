// Kleine, afhankelijkheidsvrije scripts voor de hele site.
// Alles werkt ook zonder JavaScript; dit voegt alleen gemak en beweging toe.

const root = document.documentElement;
const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* privé-venster: voorkeur geldt alleen voor deze pagina */
    }
  },
};

const motionOn = () => root.classList.contains('motion-ok');

/* ---- menu (mobiel) ---- */
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
if (menuBtn && menu) {
  const setOpen = (open: boolean) => {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a[href*="#"]')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      menuBtn.focus();
    }
  });
}

/* ---- thema ---- */
const themeBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
if (themeBtn) {
  const sync = () => themeBtn.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  sync();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('theme', root.dataset.theme);
    sync();
  });
}

/* ---- animaties aan/uit ---- */
const motionBtn = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
if (motionBtn) {
  const sync = () => motionBtn.setAttribute('aria-pressed', String(motionOn()));
  sync();
  motionBtn.addEventListener('click', () => {
    const next = !motionOn();
    root.classList.toggle('motion-ok', next);
    root.dataset.motion = next ? 'on' : 'off';
    store.set('motion', next ? 'on' : 'off');
    sync();
  });
}

/* ---- onderdelen die starten zodra ze in beeld komen ---- */
const inview = document.querySelectorAll<HTMLElement>('[data-inview]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
  );
  inview.forEach((el) => io.observe(el));
} else {
  inview.forEach((el) => el.classList.add('in-view'));
}

/* ---- werk: tabbladen ---- */
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
  const list = group.querySelector<HTMLElement>('[data-tablist]');
  const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const panels = Array.from(group.querySelectorAll<HTMLElement>('[data-panel]'));
  if (!list || tabs.length < 2) return;

  list.hidden = false;
  list.setAttribute('role', 'tablist');
  panels.forEach((panel) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');
    const tab = tabs.find((t) => t.dataset.tab === panel.id);
    if (tab) panel.setAttribute('aria-labelledby', tab.id);
  });
  tabs.forEach((tab) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.dataset.tab!);
  });

  const select = (index: number, focus = false, animate = true) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = panels.find((p) => p.id === tab.dataset.tab);
      if (!panel) return;
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
      panel.classList.toggle('is-entering', on && animate);
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const keys: Record<string, number> = {
        ArrowDown: i + 1,
        ArrowRight: i + 1,
        ArrowUp: i - 1,
        ArrowLeft: i - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select((keys[e.key] + tabs.length) % tabs.length, true);
    });
  });
  select(0, false, false);
});

/* ---- e-mailadres kopiëren ---- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const status = btn.closest('div')?.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      if (status) {
        status.textContent = btn.dataset.copied!;
        window.setTimeout(() => (status.textContent = ''), 4000);
      }
    } catch {
      /* geen toegang tot het klembord: het adres staat als link naast de knop */
    }
  });
});

/* ---- hero: stippen bewegen mee met de aanwijzer ---- */
const hero = document.querySelector<HTMLElement>('[data-hero]');
const target = document.querySelector<SVGSVGElement>('[data-target]');
if (hero && target && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const dots = Array.from(target.querySelectorAll<SVGCircleElement>('.dots circle')).map((el) => ({
    el,
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
  }));
  let frame = 0;
  let px = 0;
  let py = 0;

  const draw = () => {
    frame = 0;
    const box = target.getBoundingClientRect();
    const scale = 420 / box.width;
    const x = (px - box.left) * scale;
    const y = (py - box.top) * scale;
    for (const dot of dots) {
      const dx = x - dot.x;
      const dy = y - dot.y;
      const dist = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - dist / 170);
      const tx = (dx / (dist || 1)) * pull * 9;
      const ty = (dy / (dist || 1)) * pull * 9;
      dot.el.style.transform = pull ? `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${(1 + pull * 1.4).toFixed(2)})` : '';
    }
  };

  hero.addEventListener('pointermove', (e) => {
    if (!motionOn()) return;
    px = e.clientX;
    py = e.clientY;
    frame ||= requestAnimationFrame(draw);
  });
  hero.addEventListener('pointerleave', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    dots.forEach((dot) => (dot.el.style.transform = ''));
  });
}
