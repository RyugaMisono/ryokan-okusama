(() => {
  const cfg = window.RYOKAN;
  const MAX_NIGHTS = 2, MAX_DAYS = 90;
  const demo = !cfg.GAS_URL;
  const $ = (id) => document.getElementById(id);

  document.querySelectorAll('[data-photo]').forEach((img) => { img.src = cfg.PHOTOS[img.dataset.photo]; });

  // 日付はすべて日本時間の 'YYYY-MM-DD' で扱う
  const iso = (d) => d.toISOString().slice(0, 10);
  const parse = (s) => new Date(s + 'T00:00:00Z');
  const add = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const today = iso(new Date(Date.now() + 9 * 3600e3));
  const first = add(today, 1), last = add(today, MAX_DAYS);
  const label = (s) => { const d = parse(s); return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${'日月火水木金土'[d.getUTCDay()]}）`; };

  let booked = new Set(), loaded = false;
  let start = null, end = null;
  let month = first.slice(0, 7);

  const free = (s) => s >= first && s <= last && !booked.has(s);
  // start に到着した場合、s を出発日にできるか
  const canEnd = (s) => {
    if (!start || s <= start || s > add(start, MAX_NIGHTS)) return false;
    for (let d = start; d < s; d = add(d, 1)) if (!free(d)) return false;
    return true;
  };

  function render() {
    const [y, m] = month.split('-').map(Number);
    $('month').textContent = `${y}年 ${m}月`;
    $('prev').disabled = month <= first.slice(0, 7);
    $('next').disabled = month >= last.slice(0, 7);
    const box = $('days');
    box.textContent = '';
    const lead = parse(month + '-01').getUTCDay();
    for (let i = 0; i < lead; i++) box.append(document.createElement('span'));
    const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let n = 1; n <= length; n++) {
      const s = `${month}-${String(n).padStart(2, '0')}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'day';
      const picking = start && !end;
      const usable = loaded && (free(s) || (picking && canEnd(s)));
      b.disabled = !usable;
      let mark = '';
      if (loaded && s >= first && s <= last) mark = booked.has(s) ? '満' : '○';
      if (s === start) { b.classList.add('edge'); mark = '着'; }
      else if (s === end) { b.classList.add('edge'); mark = '発'; }
      else if (end && s > start && s < end) b.classList.add('in');
      else if (picking && canEnd(s)) { b.classList.add('in'); mark = '発可'; }
      b.innerHTML = `${n}<small>${mark || '&nbsp;'}</small>`;
      b.setAttribute('aria-label', `${label(s)} ${mark}`);
      b.setAttribute('aria-pressed', String(s === start || s === end));
      b.dataset.date = s;
      b.onclick = () => pick(s);
      box.append(b);
    }
  }

  function pick(s) {
    if (start && !end && canEnd(s)) end = s;
    else if (s === start) { start = end = null; }
    else { start = s; end = null; }
    $('error').textContent = '';
    summary(); render();
    const again = document.querySelector(`[data-date="${s}"]`);
    if (again && !again.disabled) again.focus({ preventScroll: true });
  }

  function summary() {
    $('stay').textContent = !start ? '日程が未選択です'
      : !end ? `${label(start)}ご到着　出発日をお選びください`
      : `${label(start)}から${label(end)}まで　${(parse(end) - parse(start)) / 864e5}泊`;
  }

  async function load() {
    loaded = false; render();
    if (demo) {
      $('demo').hidden = false;
      booked = new Set([3, 4, 11, 18, 19, 27].map((n) => add(today, n)));
      loaded = true; render(); return;
    }
    $('cal-status').textContent = '空室状況を確認しています…';
    try {
      const res = await fetch(`${cfg.GAS_URL}?action=availability`);
      const data = await res.json();
      if (!data.ok) throw new Error();
      booked = new Set(data.booked);
      loaded = true;
      $('cal-status').textContent = '';
    } catch (e) {
      $('cal-status').textContent = '空室状況を取得できませんでした。ページを再読み込みしてください。';
    }
    render();
  }

  const move = (n) => { const d = parse(month + '-01'); d.setUTCMonth(d.getUTCMonth() + n); month = iso(d).slice(0, 7); render(); };
  $('prev').onclick = () => move(-1);
  $('next').onclick = () => move(1);

  const form = $('form');
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const f = form.elements;
    const err = (t) => { $('error').textContent = t; };
    if (!start || !end) return err('カレンダーで到着日と出発日をお選びください。');
    if (!f.namedItem('name').value.trim()) return err('お名前をご入力ください。');
    if (!f.email.value.trim() || !f.email.checkValidity()) return err('メールアドレスを正しくご入力ください。');
    if (!f.agree.checked) return err('宿泊規約への同意にチェックを入れてください。');
    err('');
    const body = {
      checkin: start, checkout: end,
      name: f.namedItem('name').value.trim(), email: f.email.value.trim(),
      guests: Number(f.guests.value), plan: f.plan.value, note: f.note.value.trim(), website: f.website.value
    };
    const button = $('submit');
    button.disabled = true; button.textContent = '送信しています…';
    try {
      if (!demo) {
        // text/plain にすると Apps Script への事前確認通信が不要になる
        const res = await fetch(cfg.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!data.ok) { err(data.message); if (data.reload) { start = end = null; summary(); load(); } return; }
      }
      $('done-text').textContent = `${$('stay').textContent}\n${body.name} さま ${body.guests}名` + (demo ? '\n（お試し表示のため送信していません）' : '');
      form.hidden = true; $('done').hidden = false; $('done').focus();
      start = end = null; form.reset(); summary(); load();
    } catch (e) {
      err('送信結果を確認できませんでした。二重のお申し込みを避けるため、女将へご確認ください。');
    } finally {
      button.disabled = false; button.textContent = 'この内容で予約を申し込む';
    }
  };
  $('again').onclick = () => { $('done').hidden = true; form.hidden = false; };

  summary(); load();
})();
