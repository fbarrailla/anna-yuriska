/* Anna's Travel — guestbook
 * Backed by a Supabase table `guestbook_entries(name, message, created_at)`
 * with RLS that allows anon select + anon insert.
 */

(() => {
  'use strict';

  const SUPABASE_URL = 'https://jikeyqaxppfwpmldkbew.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mk3vS1OdbTShNC6YNGuXcg_yCIq-cFQ';
  const TABLE = 'guestbook_entries';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[guestbook] supabase-js not loaded; skipping.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const form    = document.getElementById('guestbook-form');
  const listEl  = document.getElementById('guestbook-list');
  const emptyEl = document.getElementById('guestbook-empty');
  const loadEl  = document.getElementById('guestbook-loading');
  const statusEl = document.getElementById('gb-status');
  const submitBtn = document.getElementById('gb-submit');
  const nameEl    = document.getElementById('gb-name');
  const msgEl     = document.getElementById('gb-message');
  const hpEl      = document.getElementById('gb-website');

  if (!form || !listEl) return;

  /* ---------- Rendering ---------- */

  const TIME_UNITS = [
    ['year',   31536000],
    ['month',  2592000],
    ['week',   604800],
    ['day',    86400],
    ['hour',   3600],
    ['minute', 60]
  ];

  function timeAgo(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diff = Math.max(1, Math.floor((Date.now() - then) / 1000));
    for (const [unit, secs] of TIME_UNITS) {
      const n = Math.floor(diff / secs);
      if (n >= 1) return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    }
    return 'just now';
  }

  function renderEntry(entry) {
    const li = document.createElement('li');
    li.className = 'guestbook__entry';

    const head = document.createElement('div');
    head.className = 'guestbook__entry-head';

    const name = document.createElement('span');
    name.className = 'guestbook__entry-name';
    name.textContent = entry.name;

    const time = document.createElement('time');
    time.className = 'guestbook__entry-time';
    time.dateTime = entry.created_at;
    time.textContent = timeAgo(entry.created_at);

    head.appendChild(name);
    head.appendChild(time);

    const msg = document.createElement('p');
    msg.className = 'guestbook__entry-message';
    msg.textContent = entry.message;

    li.appendChild(head);
    li.appendChild(msg);
    return li;
  }

  function renderAll(entries) {
    listEl.innerHTML = '';
    if (!entries.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    const frag = document.createDocumentFragment();
    entries.forEach(e => frag.appendChild(renderEntry(e)));
    listEl.appendChild(frag);
  }

  /* ---------- Load ---------- */

  async function loadEntries() {
    loadEl.hidden = false;
    const { data, error } = await client
      .from(TABLE)
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    loadEl.hidden = true;

    if (error) {
      console.error('[guestbook] load failed', error);
      emptyEl.hidden = true;
      listEl.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'guestbook__entry';
      li.innerHTML = '<p class="guestbook__entry-message"><em>Could not load notes right now.</em></p>';
      listEl.appendChild(li);
      return;
    }
    renderAll(data || []);
  }

  /* ---------- Submit ---------- */

  function setStatus(text, state) {
    statusEl.textContent = text || '';
    if (state) statusEl.setAttribute('data-state', state);
    else statusEl.removeAttribute('data-state');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (hpEl && hpEl.value.trim() !== '') {
      setStatus('Saved.', 'ok');
      form.reset();
      return;
    }

    const name = nameEl.value.trim();
    const message = msgEl.value.trim();

    if (!name || !message) {
      setStatus('Add a name and a note.', 'error');
      return;
    }
    if (name.length > 60 || message.length > 500) {
      setStatus('Too long — keep it short.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Sending…', null);

    const { data, error } = await client
      .from(TABLE)
      .insert([{ name, message }])
      .select('id, name, message, created_at')
      .single();

    submitBtn.disabled = false;

    if (error) {
      console.error('[guestbook] insert failed', error);
      setStatus('Could not send — try again later.', 'error');
      return;
    }

    setStatus('Thank you.', 'ok');
    form.reset();

    if (data) {
      emptyEl.hidden = true;
      listEl.insertBefore(renderEntry(data), listEl.firstChild);
    }
  });

  loadEntries();
})();
