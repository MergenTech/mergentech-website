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
      // geen toegang tot het klembord: toon het adres, zodat het met de hand te kopiëren is
      if (status) status.textContent = btn.dataset.copyFailed!;
    }
  });
});

/* ---- contactformulier: eigen foutmeldingen en versturen zonder de pagina te verlaten ---- */
const contactForm = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (contactForm) {
  type Field = HTMLInputElement | HTMLTextAreaElement;
  const status = contactForm.querySelector<HTMLElement>('[data-form-status]')!;
  const success = document.querySelector<HTMLElement>('[data-form-success]')!;
  const button = contactForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const label = button.querySelector<HTMLElement>('[data-label]')!;
  const idle = label.textContent!;
  const fields = Array.from(contactForm.querySelectorAll<Field>('[data-error]'));
  contactForm.noValidate = true;

  const setError = (field: Field, message: string) => {
    const box = document.getElementById(`${field.id}-error`)!;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    box.textContent = message;
    box.hidden = !message;
  };
  const check = (field: Field) => {
    const ok = field.value.trim() !== '' && field.checkValidity();
    setError(field, ok ? '' : field.dataset.error!);
    return ok;
  };
  const say = (message: string) => {
    status.textContent = message;
    status.hidden = !message;
  };

  // een fout verdwijnt zodra het veld klopt, maar verschijnt niet tijdens het typen
  fields.forEach((field) =>
    field.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) check(field);
    }),
  );

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    say('');
    const invalid = fields.filter((field) => !check(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    button.disabled = true;
    label.textContent = button.dataset.sending!;
    try {
      // lege optionele velden gaan niet mee
      const body = new FormData(contactForm);
      for (const [key, value] of [...body.entries()]) {
        if (key.startsWith('fi-') && typeof value === 'string' && value.trim() === '') body.delete(key);
      }
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        contactForm.hidden = true;
        success.hidden = false;
        success.focus();
      } else if (res.status === 429) {
        say(contactForm.dataset.tooFast!);
      } else if (res.status === 400 && String(data?.error ?? '').includes('EMAIL')) {
        const email = fields.find((field) => field.type === 'email')!;
        setError(email, email.dataset.error!);
        email.focus();
      } else {
        say(contactForm.dataset.failed!);
      }
    } catch {
      if (navigator.onLine) {
        // de browser kon het verzoek niet doen: verstuur het formulier dan op de gewone manier
        contactForm
          .querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name^="fi-"]')
          .forEach((el) => (el.disabled = el.value.trim() === ''));
        contactForm.submit();
        return;
      }
      say(contactForm.dataset.failed!);
    } finally {
      button.disabled = false;
      label.textContent = idle;
    }
  });
}
