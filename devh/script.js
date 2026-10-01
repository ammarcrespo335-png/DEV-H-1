'use strict';

/* =========================================================
   CONFIG
   Edit these to change prices, copy, or where the form goes.
========================================================= */

// Google Apps Script Web App URL (see apps-script/SETUP.md).
// While empty, the form only simulates sending (good for demos).
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwQBdm7JGjjcPKc-jyKuRwEH1gqF6ApMmvjBtqN5iSHT_VJQKg3s9xzv9Y0UVwR5shDCQ/exec';

// Must match SECRET in Code.gs. Blocks random posts to your sheet.
const FORM_SECRET = 'DEV-H012**';

const BUNDLE_MIN = 3;        // services needed for a bundle discount
const BUNDLE_DISCOUNT = 0.10; // 10% off

const SERVICES = [
    {
        name: 'Landing Page', price: 300, cat: 'Web', e: '🌐', weeks: 1,
        d: 'A fast, sharp page that turns visitors into clients.',
        inc: ['Single responsive page', 'Contact or sign-up form', 'Basic SEO and analytics', 'Speed-optimised build']
    },
    {
        name: 'Company Website', price: 900, cat: 'Web', e: '💻', weeks: 3,
        d: 'A full website that represents your brand properly.',
        inc: ['Up to 8 pages', 'Content you can edit yourself', 'Contact forms and maps', 'SEO-ready structure']
    },
    {
        name: 'E-commerce Store', price: 1500, cat: 'Web', e: '🛒', weeks: 5,
        d: 'Sell online with secure checkout and easy management.',
        inc: ['Product catalogue and search', 'Cart and secure checkout', 'Order management', 'Payment gateway setup']
    },
    {
        name: 'Mobile App', price: 2500, cat: 'Apps', e: '📱', weeks: 8,
        d: 'iOS and Android apps built to be smooth and reliable.',
        inc: ['iOS and Android versions', 'Sign-in and push notifications', 'App store submission', 'Usage analytics']
    },
    {
        name: 'Custom Dashboard', price: 1200, cat: 'Apps', e: '📊', weeks: 4,
        d: 'Control your data and operations from one place.',
        inc: ['Live charts and tables', 'Role-based access', 'Export to CSV and PDF', 'Connects to your data']
    },
    {
        name: 'API & Backend', price: 1100, cat: 'Apps', e: '⚙️', weeks: 4,
        d: 'Solid servers and APIs that scale with you.',
        inc: ['API design and build', 'Database and authentication', 'Documentation', 'Deployment and monitoring']
    },
    {
        name: 'UI/UX Design', price: 600, cat: 'Design', e: '🎨', weeks: 2,
        d: 'Clean interfaces people enjoy using.',
        inc: ['User flows and wireframes', 'Clickable prototype', 'Design system', 'Developer-ready handoff']
    },
    {
        name: 'Brand Identity', price: 500, cat: 'Design', e: '✨', weeks: 2,
        d: 'Logo, colors and a look that people remember.',
        inc: ['Logo and variations', 'Color and type system', 'Brand guidelines', 'Social media kit']
    },
    {
        name: 'AI Chatbot', price: 1000, cat: 'AI', e: '🤖', weeks: 3,
        d: 'Automate support and sales conversations.',
        inc: ['Trained on your content', 'Website chat widget', 'Hand-off to a human', 'Conversation analytics']
    }
];

const EXTRAS = [
    { id: 'rush', name: 'Rush delivery', note: 'About 40% faster, +25% on the project price', pct: 0.25 },
    { id: 'host', name: 'Hosting and domain setup', note: 'DNS, SSL and deployment handled for you', flat: 120 },
    { id: 'rev', name: 'Two extra revision rounds', note: 'More room to refine before launch', flat: 150 }
];

const STEPS = [
    {
        n: '01', t: 'Discovery', when: 'Week 1',
        d: 'We listen and define goals, scope and timeline.',
        b: ['A call to understand your business and users', 'A written scope you can approve', 'A clear timeline and fixed quote']
    },
    {
        n: '02', t: 'Design', when: 'Weeks 1 to 2',
        d: 'Wireframes and visuals you approve before coding.',
        b: ['Wireframes for every key screen', 'Visual design in your brand', 'Revision rounds until you are happy']
    },
    {
        n: '03', t: 'Development', when: 'Weeks 2 to 6',
        d: 'We build in short cycles and show progress often.',
        b: ['Working builds you can open and test', 'Regular check-ins, no long silences', 'Testing on real devices and browsers']
    },
    {
        n: '04', t: 'Launch & support', when: 'After go-live',
        d: 'We go live and stay with you after.',
        b: ['Deployment and final checks', 'Handover of files and access', 'Support period included in every package']
    }
];

const PLANS = [
    { n: 'Basic', p: 300, f: ['Single page or simple app', '1 revision round', '2 weeks delivery'] },
    { n: 'Pro', p: 900, hot: 1, f: ['Multi-page or full app', '3 revision rounds', 'Basic SEO setup', '1 month support'] },
    { n: 'Enterprise', p: 2500, f: ['Custom solution', 'Unlimited revisions', 'Hosting & domain', '6 months maintenance'] }
];

const ROTATE = ['websites', 'mobile apps', 'dashboards', 'AI chatbots', 'brand identities'];


/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let netRGB = [34, 211, 238]; // hero network color, kept in sync with the theme

let toastTimer;
function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function goTo(id) {
    const el = $(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

function tween(el, from, to, format, ms = 400) {
    cancelAnimationFrame(el._raf);
    if (reduceMotion || from === to) { el.textContent = format(to); return; }
    const start = performance.now();
    (function tick(now) {
        const k = Math.min((now - start) / ms, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = format(from + (to - from) * eased);
        if (k < 1) el._raf = requestAnimationFrame(tick);
        else el.textContent = format(to);
    })(start);
}


/* =========================================================
   THEME
========================================================= */

function setTheme(t, persist = true) {
    if (t === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;

    $('theme').textContent = t === 'light' ? '☀️' : '🌙';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? '#f4f7fc' : '#070b14';

    if (persist) {
        try { localStorage.setItem('theme', t); } catch (e) { }
    }
    updateNetworkColors();
}

let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) { }
setTheme(
    savedTheme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
    false
);

$('theme').onclick = () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');


/* =========================================================
   NAV: mobile menu, scroll progress, active link, to-top
========================================================= */

const menu = $('menu');
const burger = $('burger');

function closeMenu() {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
}

burger.onclick = () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
};

menu.onclick = e => { if (e.target.closest('a')) closeMenu(); };

let ticking = false;
function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        $('progress').style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        $('nav').classList.toggle('scrolled', y > 8);
        $('totop').classList.toggle('show', y > 700);
        ticking = false;
    });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

$('totop').onclick = () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

const navLinks = [...menu.querySelectorAll('a')];
const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (en.isIntersecting) {
            navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        }
    });
}, { rootMargin: '-40% 0px -55% 0px' });

navLinks.forEach(a => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) spy.observe(sec);
});
spy.observe($('home'));


/* =========================================================
   HERO: rotating word + count-up stats
========================================================= */

(function rotator() {
    if (reduceMotion) return;
    const el = $('rot');
    let i = 0;
    setInterval(() => {
        el.classList.add('out');
        setTimeout(() => {
            i = (i + 1) % ROTATE.length;
            el.textContent = ROTATE[i];
            el.classList.remove('out');
        }, 260);
    }, 2400);
})();

(function counters() {
    const els = document.querySelectorAll('[data-count]');
    if (reduceMotion) return;
    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const el = en.target;
            const to = Number(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            tween(el, 0, to, v => Math.round(v) + suffix, 1200);
            obs.unobserve(el);
        });
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
})();


/* =========================================================
   SERVICES: tabs, search, cards
========================================================= */

const cats = ['All', ...new Set(SERVICES.map(s => s.cat))];
let tab = 'All';
let query = '';

function filtered() {
    const q = query.trim().toLowerCase();
    return SERVICES
        .map((s, i) => ({ s, i }))
        .filter(({ s }) =>
            (tab === 'All' || s.cat === tab) &&
            (!q || (s.name + ' ' + s.d + ' ' + s.cat).toLowerCase().includes(q))
        );
}

function renderTabs() {
    $('tabs').innerHTML = cats.map(c => {
        const n = c === 'All' ? SERVICES.length : SERVICES.filter(s => s.cat === c).length;
        return `<button class="tab ${c === tab ? 'on' : ''}" role="tab" aria-selected="${c === tab}" data-c="${c}">${c}<small>${n}</small></button>`;
    }).join('');
}

function renderServices() {
    const list = filtered();

    $('cards').innerHTML = list.map(({ s, i }) => `
        <article class="card svc" data-i="${i}">
            <span class="ico">${s.e}</span>
            <h3>${s.name}</h3>
            <p>${s.d}</p>
            <div class="foot-row">
                <span class="price">From $${s.price.toLocaleString('en-US')}</span>
                <button class="more" aria-label="View details for ${s.name}">Details</button>
            </div>
        </article>
    `).join('');

    $('empty').hidden = list.length > 0;
}

$('tabs').onclick = e => {
    const c = e.target.closest('.tab')?.dataset.c;
    if (!c) return;
    tab = c;
    renderTabs();
    renderServices();
};

$('search').oninput = e => {
    query = e.target.value;
    renderServices();
};

$('clear').onclick = () => {
    query = '';
    $('search').value = '';
    renderServices();
    $('search').focus();
};

renderTabs();
renderServices();


/* =========================================================
   SERVICE MODAL
========================================================= */

const dlg = $('modal');
let openIndex = null;

function openService(i) {
    const s = SERVICES[i];
    openIndex = i;
    $('m-ico').textContent = s.e;
    $('m-title').textContent = s.name;
    $('m-desc').textContent = s.d;
    $('m-inc').innerHTML = s.inc.map(x => `<li>${x}</li>`).join('');
    $('m-price').textContent = money(s.price);
    $('m-time').textContent = s.weeks === 1 ? '1 week' : s.weeks + ' weeks';
    syncModalAdd();
    root.classList.add('lock');
    dlg.showModal();
}

function syncModalAdd() {
    $('m-add').textContent = picked.has(openIndex) ? 'Remove from estimate' : 'Add to estimate';
}

$('cards').onclick = e => {
    const card = e.target.closest('.svc');
    if (card) openService(Number(card.dataset.i));
};

$('mClose').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => root.classList.remove('lock'));

$('m-add').onclick = () => {
    toggleService(openIndex);
    syncModalAdd();
    toast(picked.has(openIndex) ? SERVICES[openIndex].name + ' added to your estimate' : 'Removed from your estimate');
};

$('m-request').onclick = () => {
    const i = openIndex;
    dlg.close();
    $('service').value = SERVICES[i].name;
    goTo('contact');
    setTimeout(() => $('f-name').focus({ preventScroll: true }), 500);
};


/* =========================================================
   ESTIMATOR
========================================================= */

const picked = new Set();
const extras = new Set();
let lastTotal = 0;

function renderPicks() {
    $('picks').innerHTML = SERVICES.map((s, i) => `
        <button class="pick" data-i="${i}" aria-pressed="${picked.has(i)}">
            <span class="e">${s.e}</span>
            <b>${s.name}</b>
            <span>From ${money(s.price)}</span>
        </button>
    `).join('');
}

function renderExtras() {
    $('opts').innerHTML = EXTRAS.map(x => `
        <label class="opt">
            <input type="checkbox" data-id="${x.id}" ${extras.has(x.id) ? 'checked' : ''}>
            <span>${x.name}<small>${x.note}</small></span>
            <em>${x.flat ? '+' + money(x.flat) : '+' + Math.round(x.pct * 100) + '%'}</em>
        </label>
    `).join('');
}

function calc() {
    const items = [...picked].map(i => SERVICES[i]);
    const subtotal = items.reduce((a, s) => a + s.price, 0);
    const discount = items.length >= BUNDLE_MIN ? subtotal * BUNDLE_DISCOUNT : 0;
    let base = subtotal - discount;

    const rows = items.map(s => [s.name, s.price]);
    if (discount) rows.push([`Bundle discount (${Math.round(BUNDLE_DISCOUNT * 100)}%)`, -discount, 'disc']);

    let total = base;
    EXTRAS.forEach(x => {
        if (!extras.has(x.id)) return;
        const amount = x.pct ? base * x.pct : x.flat;
        total += amount;
        rows.push([x.name, amount]);
    });

    let weeks = items.length ? Math.max(...items.map(s => s.weeks)) + (items.length - 1) : 0;
    if (extras.has('rush') && weeks) weeks = Math.max(1, Math.round(weeks * 0.6));

    return { items, rows, total, weeks };
}

function updateEstimate() {
    const { items, rows, total, weeks } = calc();

    tween($('total'), lastTotal, total, money);
    lastTotal = total;

    $('lines').innerHTML = items.length
        ? rows.map(([n, v, c]) => `<li class="${c || ''}"><span>${n}</span><span>${v < 0 ? '-' : ''}${money(Math.abs(v))}</span></li>`).join('')
        : '<li class="muted">Select at least one service to begin.</li>';

    $('weeks').textContent = weeks ? (weeks === 1 ? 'About 1 week' : `About ${weeks} weeks`) : '-';
    $('useEstimate').disabled = !items.length;
    $('resetEstimate').hidden = !items.length && !extras.size;
}

function toggleService(i) {
    picked.has(i) ? picked.delete(i) : picked.add(i);
    renderPicks();
    updateEstimate();
}

$('picks').onclick = e => {
    const b = e.target.closest('.pick');
    if (b) toggleService(Number(b.dataset.i));
};

$('opts').onchange = e => {
    const id = e.target.dataset.id;
    if (!id) return;
    e.target.checked ? extras.add(id) : extras.delete(id);
    updateEstimate();
};

$('resetEstimate').onclick = () => {
    picked.clear();
    extras.clear();
    renderPicks();
    renderExtras();
    updateEstimate();
};

$('useEstimate').onclick = () => {
    const { items, total, weeks } = calc();
    if (!items.length) return;

    const extraNames = EXTRAS.filter(x => extras.has(x.id)).map(x => x.name);
    const text =
        `Hi DEV-H, I would like a quote for: ${items.map(s => s.name).join(', ')}.` +
        (extraNames.length ? ` Extras: ${extraNames.join(', ')}.` : '') +
        ` Estimate from the site: ${money(total)}, about ${weeks} week${weeks === 1 ? '' : 's'}.`;

    const msg = $('f-msg');
    msg.value = msg.value.trim() ? msg.value.trim() + '\n\n' + text : text;
    msg.dispatchEvent(new Event('input'));
    $('service').value = items[0].name;

    goTo('contact');
    toast('Estimate added to your message');
};

renderPicks();
renderExtras();
updateEstimate();


/* =========================================================
   PROCESS (interactive stepper)
========================================================= */

let step = 0;

function renderSteps() {
    $('stepsNav').innerHTML = STEPS.map((s, i) => `
        <button class="step-btn ${i === step ? 'on' : ''}" role="tab" aria-selected="${i === step}" data-i="${i}">
            <span class="n">${s.n}</span><span>${s.t}</span>
        </button>
    `).join('');

    const s = STEPS[step];
    const panel = $('stepPanel');
    panel.innerHTML = `
        <span class="when">${s.when}</span>
        <h3>${s.t}</h3>
        <p>${s.d}</p>
        <ul>${s.b.map(x => `<li>${x}</li>`).join('')}</ul>
    `;
    // restart the swap animation
    panel.style.animation = 'none';
    void panel.offsetWidth;
    panel.style.animation = '';
}

$('stepsNav').onclick = e => {
    const b = e.target.closest('.step-btn');
    if (!b) return;
    step = Number(b.dataset.i);
    renderSteps();
    $('stepsNav').querySelector('.on').focus();
};

$('stepsNav').onkeydown = e => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    step = (step + dir + STEPS.length) % STEPS.length;
    renderSteps();
    $('stepsNav').querySelector('.on').focus();
};

renderSteps();


/* =========================================================
   PLANS
========================================================= */

$('plans').innerHTML = PLANS.map(p => `
    <article class="card plan ${p.hot ? 'hot' : ''}">
        ${p.hot ? '<span class="badge">Most popular</span>' : ''}
        <h3>${p.n}</h3>
        <span class="price">From $${p.p.toLocaleString('en-US')}</span>
        <ul>${p.f.map(x => `<li>${x}</li>`).join('')}</ul>
        <a href="#contact" class="btn ${p.hot ? '' : 'ghost'}" data-plan="${p.n}">Choose ${p.n}</a>
    </article>
`).join('');

$('plans').onclick = e => {
    const a = e.target.closest('[data-plan]');
    if (!a) return;
    $('plan').value = a.dataset.plan;
    toast(a.dataset.plan + ' package selected');
};


/* =========================================================
   FAQ: open one at a time
========================================================= */

$('faqList').addEventListener('toggle', e => {
    if (!e.target.open) return;
    $('faqList').querySelectorAll('details[open]').forEach(d => { if (d !== e.target) d.open = false; });
}, true);


/* =========================================================
   CONTACT FORM
========================================================= */

$('service').innerHTML =
    '<option value="">Not sure yet</option>' +
    SERVICES.map(s => `<option>${s.name}</option>`).join('');

$('plan').innerHTML =
    '<option value="">Not sure yet</option>' +
    PLANS.map(p => `<option>${p.n}</option>`).join('');

const form = $('form');

function setError(input, message) {
    const out = form.querySelector(`.err[data-for="${input.id}"]`);
    out.textContent = message;
    input.classList.toggle('invalid', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validate(input) {
    const v = input.value.trim();
    let m = '';
    if (input.id === 'f-name' && v.length < 2) m = 'Enter your name.';
    if (input.id === 'f-email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) m = 'Enter a valid email, like you@example.com.';
    if (input.id === 'f-phone') {
        const digits = v.replace(/\D/g, '');
        if (!v) m = 'Enter your phone number.';
        else if (!/^\+?[0-9\s\-()]+$/.test(v) || digits.length < 7 || digits.length > 15) m = 'Enter a valid phone number, like +20 100 000 0000.';
    }
    if (input.id === 'f-msg' && v.length < 10) m = 'Tell us a little more about your project (at least 10 characters).';
    setError(input, m);
    return !m;
}

['f-name', 'f-email', 'f-phone', 'f-msg'].forEach(id => {
    const el = $(id);
    el.addEventListener('blur', () => validate(el));
    el.addEventListener('input', () => { if (el.classList.contains('invalid')) validate(el); });
});

$('f-msg').addEventListener('input', e => {
    $('count').textContent = `${e.target.value.length} / ${e.target.maxLength}`;
});

form.onsubmit = async e => {
    e.preventDefault();
    $('ok').hidden = true;

    const fields = ['f-name', 'f-email', 'f-phone', 'f-msg'].map($);
    const results = fields.map(validate);
    if (results.includes(false)) {
        fields[results.indexOf(false)].focus();
        return;
    }

    const btn = $('send');
    btn.disabled = true;
    btn.classList.add('loading');
    $('sendText').textContent = 'Sending';

    try {
        if (FORM_ENDPOINT) {
            const { items, total, weeks } = calc();
            const data = Object.fromEntries(new FormData(form));

            const payload = {
                secret: FORM_SECRET,
                name: data.name.trim(),
                email: data.email.trim(),
                phone: data.phone.trim(),
                service: data.service || '',
                plan: data.plan || '',
                message: data.msg.trim(),
                estimateServices: items.map(s => s.name).join(', '),
                estimateTotal: items.length ? Math.round(total) : '',
                estimateWeeks: items.length ? weeks : '',
                website: data.website || '',          // honeypot
                page: location.href
            };

            // text/plain keeps this a "simple" request, so Apps Script accepts it without CORS preflight
            const res = await fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            const out = await res.json();
            if (!out.ok) throw new Error(out.error || 'Request failed');
        } else {
            await new Promise(r => setTimeout(r, 900));
        }

        form.reset();
        $('count').textContent = '0 / 1200';
        $('ok').hidden = false;
        toast('Request sent');
    } catch (err) {
        toast('Could not send. Please try again.');
    } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        $('sendText').textContent = 'Send request';
    }
};


/* =========================================================
   CARD SPOTLIGHT (pointer position)
========================================================= */

document.addEventListener('pointermove', e => {
    const c = e.target.closest?.('.svc, .plan');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});


/* =========================================================
   INTERACTIVE NETWORK (hero background)
========================================================= */

const canvas = $('network');
const ctx = canvas.getContext('2d');

let netW = 0;
let netH = 0;
let particles = [];
let netVisible = true;

const mouse = { x: null, y: null, radius: 170 };
const LINK_DIST = 145;

function updateNetworkColors() {
    const c = getComputedStyle(root).getPropertyValue('--accent').trim() || '#22d3ee';
    let h = c.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    netRGB = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
}

const rgba = a => `rgba(${netRGB[0]},${netRGB[1]},${netRGB[2]},${a})`;

function resizeNetwork() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    netW = rect.width;
    netH = rect.height;
    canvas.width = netW * dpr;
    canvas.height = netH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

class Particle {
    constructor() {
        this.x = Math.random() * netW;
        this.y = Math.random() * netH;
        this.size = Math.random() * 1.7 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x >= netW) this.vx *= -1;
        if (this.y <= 0 || this.y >= netH) this.vy *= -1;

        if (mouse.x !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < mouse.radius && d > 0) {
                const f = (mouse.radius - d) / mouse.radius;
                this.x += (dx / d) * f * 1.6;
                this.y += (dy / d) * f * 1.6;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(1);
        ctx.fill();
    }
}

function createNetwork() {
    const count = window.innerWidth < 700 ? 45 : 85;
    particles = Array.from({ length: count }, () => new Particle());
}

function drawLinks() {
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < LINK_DIST) {
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = rgba((1 - d / LINK_DIST) * 0.32);
                ctx.stroke();
            }
        }
    }

    if (mouse.x === null) return;
    ctx.lineWidth = 1;
    particles.forEach(p => {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = rgba((1 - d / mouse.radius) * 0.5);
            ctx.stroke();
        }
    });
}

function frame() {
    ctx.clearRect(0, 0, netW, netH);
    particles.forEach(p => p.update());
    drawLinks();
    particles.forEach(p => p.draw());
}

function loop() {
    if (netVisible && !document.hidden) frame();
    requestAnimationFrame(loop);
}

const hero = canvas.parentElement;

hero.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = null; });

new IntersectionObserver(([en]) => { netVisible = en.isIntersecting; }).observe(hero);

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeNetwork();
        createNetwork();
        if (reduceMotion) frame();
    }, 120);
});

updateNetworkColors();
resizeNetwork();
createNetwork();

if (reduceMotion) frame();   // one static frame, no animation
else loop();