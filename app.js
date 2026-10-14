(function () {
'use strict';
var P = window.PADO;
var KEY = 'pado.v1';
var app = document.getElementById('app');

/* ---------- 저장 ---------- */
function fresh() {
  return { v: 1, days: {}, goal: null, story: {}, survey: { pre: null, post: null }, logs: [], committee: [],
    routines: ['샤워', '양치', '출근길', '설거지'], focusFood: null, followups: [], lastOpen: null, lastMeal: null,
    review: {}, rounds: [], created: today() };
}
var S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('저장 공간이 부족해요. 설정에서 백업해주세요.'); }
}
if (navigator.storage && navigator.storage.persist) { navigator.storage.persist().catch(function () {}); }

/* ---------- 날짜 ---------- */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today() { return ymd(new Date()); }
function toDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(s, k) { var d = toDate(s); d.setDate(d.getDate() + k); return ymd(d); }
function diffDays(a, b) { return Math.round((toDate(b) - toDate(a)) / 864e5); }
var WD = ['일', '월', '화', '수', '목', '금', '토'];
function fShort(s) { if (!s) return ''; var d = toDate(s); return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + WD[d.getDay()]; }
function fLong(s) { var d = toDate(s); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WD[d.getDay()] + '요일'; }
function fMD(s) { var d = toDate(s); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WD[d.getDay()]; }
function ago(ms) {
  var m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return '방금'; if (m < 60) return m + '분 전';
  var h = Math.round(m / 60); if (h < 24) return h + '시간 전';
  return Math.round(h / 24) + '일 전';
}
function timeOf(ms) { var d = new Date(ms); return fShort(ymd(d)) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

/* ---------- 돌아왔을 때 ---------- */
var GAP = 0;
if (S.lastOpen && S.lastOpen !== today()) { GAP = diffDays(S.lastOpen, today()); }
S.lastOpen = today(); save();

/* ---------- 유틸 ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function addLog(type, data) {
  var l = Object.assign({ id: uid(), type: type, at: Date.now(), date: today() }, data || {});
  S.logs.push(l); save(); return l;
}
function logsOf(type, f) { return S.logs.filter(function (l) { return l.type === type && (!f || f(l)); }); }
function currentDay() { for (var n = 1; n <= 21; n++) { if (!(S.days[n] && S.days[n].done)) return n; } return 22; }
function dayData(n) { return S.days[n] || (S.days[n] = {}); }
function toast(msg) {
  var old = document.querySelector('.toast'); if (old) old.remove();
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
function signed(n) { return n > 0 ? '+' + n : '' + n; }
function foodsFrom(types) {
  var seen = {}, out = [];
  S.logs.forEach(function (l) { if (types.indexOf(l.type) >= 0 && l.food) { var k = l.food.trim(); if (k && !seen[k]) { seen[k] = 1; out.push(k); } } });
  return out;
}

/* ---------- 아이콘 ---------- */
var I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="#2F6B5E" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="#2F6B5E"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="#2F6B5E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
  wave: '<svg viewBox="0 0 24 24" fill="none" stroke="#8FB8AA" stroke-width="1.8" stroke-linecap="round"><path d="M3 10c3-3.5 6-3.5 9 0s6 3.5 9 0"/><path d="M3 16c3-3.5 6-3.5 9 0s6 3.5 9 0"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>',
  journey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>',
  tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};
function ic(name, cls) { return '<span class="ico ' + (cls || '') + '" aria-hidden="true">' + I[name] + '</span>'; }

/* ---------- 공통 조각 ---------- */
function topbar(left, title, right) {
  return '<div class="topbar">' + (left || '<span style="width:44px"></span>') + '<div class="title">' + (title || '') + '</div>' + (right || '<span style="width:44px"></span>') + '</div>';
}
function backBtn(href, label) { return '<a class="iconbtn" href="' + (href || '#/') + '" aria-label="' + (label || '뒤로') + '">' + I.back + '</a>'; }
function closeBtn(href) { return '<a class="iconbtn" href="' + (href || '#/') + '" aria-label="닫기">' + I.close + '</a>'; }
function tabbar(on) {
  var t = [['today', '#/', '오늘'], ['journey', '#/journey', '여정'], ['bank', '#/bank', '정보은행'], ['tools', '#/tools', '도구']];
  return '<nav class="tabbar" aria-label="메뉴"><div class="in">' + t.map(function (x) {
    return '<a href="' + x[1] + '" class="' + (x[0] === on ? 'on' : '') + '"' + (x[0] === on ? ' aria-current="page"' : '') + '>' + I[x[0]] + x[2] + '</a>';
  }).join('') + '</div></nav>';
}
function sos() {
  return '<a class="sos" href="#/t/hunger">' + '<span style="width:26px;height:26px;display:flex">' + I.wave + '</span>' +
    '<span class="grow" style="display:flex;flex-direction:column"><span class="t">지금 먹고 싶어요</span><span class="d">허기 테스트부터 같이 해봐요</span></span>' +
    '<span style="width:18px;height:18px;display:flex">' + I.next + '</span></a>';
}
function chips(list, sel, act, multi) {
  return '<div class="wrap">' + list.map(function (x, i) {
    var on = multi ? (sel || []).indexOf(x) >= 0 : sel === x;
    return '<button class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-arg="' + esc(x) + '" aria-pressed="' + on + '">' + esc(x) + '</button>';
  }).join('') + '</div>';
}
function seg(values, labels, sel, act, cols) {
  return '<div class="seg" style="grid-template-columns:repeat(' + (cols || values.length) + ',minmax(0,1fr))">' + values.map(function (v, i) {
    var on = sel === v;
    return '<button class="' + (on ? 'on' : '') + '" data-act="' + act + '" data-arg="' + esc(v) + '" aria-pressed="' + on + '">' + esc(labels ? labels[i] : v) + '</button>';
  }).join('') + '</div>';
}
function foot(inner) { return '<div class="foot"><div class="in">' + inner + '</div></div>'; }
function checkMark(state, num) {
  if (state === 'done') return '<span class="check done">' + I.check + '</span>';
  return '<span class="check ' + (state === 'todo' ? 'todo' : 'idle') + '">' + (num || '') + '</span>';
}

/* ---------- 과제 완료 판정 ---------- */
function since(n) { return (S.days[n] && S.days[n].start) || 0; }
function countSpec(c, n) {
  var from = since(n);
  if (c.type === 'c1focus') return S.focusFood ? logsOf('c1', function (l) { return l.food === S.focusFood && l.at >= from; }).length : 0;
  return logsOf(c.type, function (l) { return (!c.guide || l.guide === c.guide) && l.at >= from; }).length;
}
function taskDone(t, n) {
  var from = since(n);
  switch (t.key) {
    case 'goal': return !!(S.goal && S.goal.items && S.goal.items.length);
    case 'story': return Object.keys(S.story).some(function (k) { return (S.story[k] || '').trim(); });
    case 'survey': return !!S.survey.pre;
    case 'focus': return !!S.focusFood;
    case 'committee': return S.committee.some(function (m) { return (m.at || 0) >= from; });
    case 'choice': return logsOf('choice', function (l) { return l.at >= from; }).length > 0;
    case 'evidence': return !!(S.days[20] && S.days[20].seen);
    case 'review': return logsOf('review', function (l) { return l.at >= from; }).length > 0;
  }
  return t.count ? countSpec(t.count, n) >= t.count.n : false;
}
function taskProgress(t, n) {
  if (!t.count) return '';
  var k = countSpec(t.count, n);
  if (t.key === 'c1food') return k + ' / 15번';
  return t.count.n > 1 ? Math.min(k, t.count.n) + ' / ' + t.count.n : (k ? k + '번 했어요' : '');
}

/* ---------- 자동 완료: 할 일을 다 하면 Day가 끝나요 ---------- */
function autoComplete() {
  var n = currentDay(); if (n > 21) return;
  var dd = dayData(n);
  if (!dd.start) { dd.start = Date.now(); save(); }
  var req = P.days[n - 1].tasks.filter(function (x) { return !x.optional; });
  if (req.every(function (x) { return taskDone(x, n); })) {
    dd.done = true; dd.doneAt = today(); save();
    if (n < 21) { dayData(n + 1).start = Date.now(); save(); }
    setTimeout(function () { toast(n < 21 ? 'Day ' + n + ' 완료! 다음은 Day ' + (n + 1) + ' · ' + P.days[n].title : '21일을 모두 지나왔어요. 정말 수고했어요'); }, 60);
  }
}

/* ---------- 바텀시트 ---------- */
function sheet(html, mount) {
  closeSheet();
  var b = document.createElement('div'); b.className = 'sheet-back';
  b.innerHTML = '<div class="sheet fade" role="dialog" aria-modal="true">' + html + '</div>';
  b.addEventListener('click', function (e) { if (e.target === b) closeSheet(); });
  document.body.appendChild(b);
  if (mount) mount(b.querySelector('.sheet'));
}
function closeSheet() { var b = document.querySelector('.sheet-back'); if (b) b.remove(); }

/* ---------- 상태(화면별 임시) ---------- */
var T = {};
var A = {};
var lastRoute = '';

/* ===================================================== 홈 */
function viewHome() {
  var n = currentDay();
  if (n === 22) return viewAfter();
  var d = P.days[n - 1], dd = dayData(n), t = today();
  var due = S.followups.filter(function (f) { return f.due <= Date.now(); });
  var tasks = d.tasks.filter(function (x) { return !x.optional; });
  var doneCount = tasks.filter(function (x) { return taskDone(x, n); }).length;
  var html = '<main class="screen fade">';
  html += '<div class="between"><div class="brand"><img src="icons/icon-192.png" alt="">파도</div><a class="iconbtn" href="#/settings" aria-label="설정">' + I.gear + '</a></div>';

  if (GAP >= 3 && !T.hideGap) {
    var prev = n > 1 ? n - 1 : null;
    html += '<div class="card kelp tight"><p class="small"><b>' + GAP + '일 만이에요. 다시 와줘서 반가워요.</b><br>쉬었던 날은 실패가 아니에요. 어디서 시작할까요?</p>' +
      '<div class="row"><a class="btn dark small" href="#/day/' + n + '" data-act="hideGap">Day ' + n + ' 이어서</a>' +
      (prev ? '<a class="btn ghost small" href="#/day/' + prev + '" data-act="hideGap">Day ' + prev + ' 다시 보기</a>' : '') + '</div>' +
      (S.goal && S.goal.items && S.goal.items.length ? '<p class="xs muted">내 목표: ' + esc(S.goal.items.join(', ')) + '</p>' : '') + '</div>';
  }

  due.forEach(function (f) {
    var opts = f.kind === 'full' ? ['아직 배고파요', '딱 좋아요', '배불러요', '너무 배불러요'] : ['좋아요', '그저 그래요', '별로예요'];
    html += '<div class="card tight"><p class="small"><b>' + esc(f.text) + '</b></p><div class="wrap">' +
      opts.map(function (o) { return '<button class="chip" data-act="follow" data-arg="' + f.id + '|' + esc(o) + '">' + esc(o) + '</button>'; }).join('') +
      '<button class="chip add" data-act="follow" data-arg="' + f.id + '|">건너뛰기</button></div></div>';
  });

  html += '<div class="stack" style="gap:6px"><span class="small muted">' + fLong(t) + '</span><h1 class="h-xl">' + nl(d.headline) + '</h1></div>';

  html += '<a class="card tight row" href="' + (S.goal ? '#/f/goal' : '#/day/1') + '" style="text-decoration:none;color:inherit;flex-direction:row">' + '<span style="width:20px;height:20px;display:flex">' + I.target + '</span>' +
    '<span class="grow" style="font-size:15px"><span class="muted">내 목표</span>  <b style="font-weight:600">' + (S.goal && S.goal.items && S.goal.items.length ? esc(S.goal.items.join(' · ')) : 'Day 1에서 정해요') + '</b></span></a>';

  html += '<div class="stack"><div class="between small muted"><span>' + P.steps[d.step].name + '</span><span>Day ' + n + ' / 21</span></div><div class="dots" aria-label="21일 중 ' + n + '일째">';
  for (var i = 1; i <= 21; i++) {
    var c = (S.days[i] && S.days[i].done) ? 'done' : (i === n ? 'now' : '');
    html += '<span class="dot ' + c + ((i === 6 || i === 17) ? ' gap' : '') + '"></span>';
  }
  html += '</div></div>';

  html += '<div class="card"><div class="between"><span class="eyebrow">오늘의 실천</span><span class="xs muted">책 ' + d.page + '쪽</span></div>' +
    '<div class="stack" style="gap:6px"><h2 class="h-m">' + esc(d.title) + '</h2><p class="lead" style="font-size:14px">' + esc(d.why) + '</p></div><div class="stack">';
  var firstTodo = true;
  d.tasks.forEach(function (x, k) {
    var ok = taskDone(x, n);
    var st = ok ? 'done' : (firstTodo ? 'todo' : 'idle'); if (!ok) firstTodo = false;
    html += '<a class="task' + (ok ? ' done' : '') + '" href="' + x.route + '">' + checkMark(st, k + 1) + '<span class="grow"><span class="t">' + esc(x.label) + (x.optional ? ' <span class="pill">선택</span>' : '') + '</span>' + (taskProgress(x, n) ? '<br><span class="d">' + taskProgress(x, n) + '</span>' : '') + '</span>' + (ok ? '' : '<span style="width:18px;height:18px;display:flex;color:var(--sea)">' + I.next + '</span>') + '</a>';
  });
  html += '</div><a class="btn primary" href="#/day/' + n + '">' + (doneCount || dd.opened ? '이어서 하기' : '시작하기') + '</a></div>';

  html += '<p class="xs muted" style="text-align:center;margin-top:-6px">할 일을 다 하면 Day ' + n + '이 자동으로 완료돼요</p>';
  html += '<p class="xs muted" style="text-align:center">지금까지 쌓인 기록 <b style="color:var(--ink)">' + S.logs.length + '개</b> · 쌓이기만 해요</p>';
  html += '</main>';

  A.hideGap = function () { T.hideGap = true; GAP = 0; };
  A.follow = function (a) {
    var p = a.split('|'), f = S.followups.filter(function (x) { return x.id === p[0]; })[0];
    if (f && p[1]) { var l = S.logs.filter(function (x) { return x.id === f.ref; })[0]; if (l) { l.after = p[1]; } }
    S.followups = S.followups.filter(function (x) { return x.id !== p[0]; }); save(); render(true);
  };
  return { html: html + sos() + tabbar('today') };
}

/* ---------- 21일 이후 ---------- */
function viewAfter() {
  var html = '<main class="screen fade">';
  html += '<div class="between"><div class="brand"><img src="icons/icon-192.png" alt="">파도</div><a class="iconbtn" href="#/settings" aria-label="설정">' + I.gear + '</a></div>';
  html += '<div class="stack" style="gap:6px"><span class="small muted">' + fLong(today()) + '</span><h1 class="h-xl">21일을<br>지나왔어요</h1><p class="lead">이제부터는 필요할 때 도구를 꺼내 쓰고, 정보은행을 계속 채워가요.</p></div>';
  if (S.goal && S.goal.items) html += '<div class="card tight"><span class="xs muted">내 목표</span><b>' + esc(S.goal.items.join(' · ')) + '</b></div>';
  html += '<div class="grid2">' + toolCard('#/t/rain', 'RAIN', '갈망의 파도 타기') + toolCard('#/t/c2', '갈망의 도구 2', '먹기 전에 상상하기') + toolCard('#/t/plateau', '쾌락 안정기', '한 입씩 즐거움 재기') + toolCard('#/t/c1', '갈망의 도구 1', '먹은 뒤 기록') + '</div>';
  html += '<a class="card tight" href="#/f/review" style="text-decoration:none;color:inherit"><b>전과 후 다시 보기</b><span class="small muted">Day 1의 나와 지금의 나</span></a>';
  html += '<button class="btn ghost" data-act="again">21일 다시 돌기</button>';
  html += '</main>';
  A.again = function () {
    if (!confirm('기록은 그대로 두고 Day 진도만 처음부터 다시 시작할까요?')) return;
    S.rounds.push({ days: S.days, endedAt: today() }); S.days = {}; save(); toast('다시 Day 1부터, 이번엔 더 가볍게'); render();
  };
  return { html: html + sos() + tabbar('today') };
}
function toolCard(href, t, d) { return '<a class="tool" href="' + href + '"><b>' + t + '</b><span>' + d + '</span></a>'; }

/* ===================================================== Day 화면 */
function viewDay(n) {
  n = +n; if (!(n >= 1 && n <= 21)) return viewHome();
  var d = P.days[n - 1], dd = dayData(n), t = today();
  if (!dd.opened) { dd.opened = t; save(); }
  var html = '<main class="screen has-foot fade">';
  html += topbar(backBtn('#/'), 'Day ' + n + ' / 21', '<span class="iconbtn" title="책 쪽수" style="width:auto;padding:0 8px;font-size:12px;color:var(--mute)">' + d.page + '쪽</span>');
  html += '<div class="stack"><span class="eyebrow">' + P.steps[d.step].name + '</span><h1 class="h-l">' + esc(d.title) + '</h1><p class="lead">' + esc(d.why) + '</p></div>';

  html += '<div class="card"><span class="small" style="font-weight:600">책에서 하라는 것</span><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">' +
    d.practice.map(function (p) { return '<li class="small" style="line-height:1.6;color:var(--body)">' + esc(p) + '</li>'; }).join('') + '</ol></div>';

  html += '<div class="stack"><span class="small" style="font-weight:600">앱에서 할 일</span><div class="timeline">';
  var firstTodo = true;
  d.tasks.forEach(function (x, k) {
    var ok = taskDone(x, n), st = ok ? 'done' : (firstTodo ? 'todo' : 'idle'); if (!ok) firstTodo = false;
    var last = k === d.tasks.length - 1;
    html += '<div class="tl' + (ok ? ' done' : '') + '"><div class="rail">' + checkMark(st, k + 1) + (last ? '' : '<i></i>') + '</div><div class="body">' +
      (st === 'todo'
        ? '<div class="card tight" style="gap:10px"><b>' + esc(x.label) + (x.optional ? ' <span class="pill">선택</span>' : '') + '</b>' + (taskProgress(x, n) ? '<span class="xs muted">' + taskProgress(x, n) + '</span>' : '') + '<a class="btn primary small" href="' + x.route + '">지금 하기</a></div>'
        : '<a href="' + x.route + '" style="text-decoration:none;color:inherit"><b style="' + (ok ? 'color:var(--mute)' : '') + '">' + esc(x.label) + (x.optional ? ' <span class="pill">선택</span>' : '') + '</b><br><span class="xs muted">' + (ok ? '완료 · 다시 하기' : (taskProgress(x, n) || '다음')) + '</span></a>') +
      '</div></div>';
  });
  html += '</div></div>';
  if (d.tips) html += '<div class="card outline tight"><b class="small">알아두면 편해요</b><span class="small" style="color:var(--body)">' + esc(d.tips) + '</span></div>';
  if (n === 6) html += checkinTimesCard();

  if (dd.done) {
    html += '<div class="card tight"><label class="field">완료한 날<input class="input" type="date" id="doneAt" value="' + (dd.doneAt || '') + '" max="' + t + '"></label><span class="xs muted">종이로 먼저 했던 날이라면 날짜를 고쳐도 돼요.</span></div>';
  }
  html += '</main>';

  if (dd.done) html += foot('<a class="btn primary" href="#/">오늘로 돌아가기</a>');
  else if (n === currentDay()) html += foot('<p class="small muted" style="text-align:center">할 일을 다 하면 Day ' + n + '이 자동으로 완료돼요</p><button class="linkbtn" data-act="skip" style="font-weight:400;font-size:13px;color:var(--mute)">다 못 했지만 다음 Day로 넘어갈래요</button>');
  else html += foot('<p class="small muted" style="text-align:center">Day ' + currentDay() + '을 먼저 마치면 열려요. 미리 읽어봐도 괜찮아요.</p>');

  A.skip = function () {
    if (!confirm('Day ' + n + '을 완료로 표시하고 다음 Day로 넘어갈까요?')) return;
    dd.done = true; dd.doneAt = t; if (n < 21) dayData(n + 1).start = Date.now(); save();
    toast(n < 21 ? 'Day ' + (n + 1) + '로 넘어왔어요' : '21일을 모두 지나왔어요'); go(n < 21 ? '#/' : '#/f/review');
  };
  return { html: html, mount: function (el) {
    var i = el.querySelector('#doneAt'); if (i) i.onchange = function () { if (i.value) { dd.doneAt = i.value; save(); toast('완료 날짜를 고쳤어요'); } };
    mountCheckinTimes(el);
  } };
}

/* ---------- Day 6 무작위 알림 ---------- */
function randomTimes() {
  var bad = [[7 * 60, 9 * 60], [11 * 60 + 30, 13 * 60 + 30], [17 * 60 + 30, 19 * 60 + 30]];
  var out = [], tries = 0;
  while (out.length < 5 && tries < 500) {
    tries++;
    var m = 9 * 60 + Math.floor(Math.random() * (13 * 60));
    m = m - (m % 5);
    if (bad.some(function (b) { return m >= b[0] && m <= b[1]; })) continue;
    if (out.some(function (o) { return Math.abs(o - m) < 60; })) continue;
    out.push(m);
  }
  return out.sort(function (a, b) { return a - b; }).map(function (m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); });
}
function checkinTimesCard() {
  var c = S.checkinTimes && S.checkinTimes.date === today() ? S.checkinTimes.times : null;
  return '<div class="card tight" id="ctc"><b class="small">오늘의 무작위 알람</b>' +
    (c ? '<div class="wrap">' + c.map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('') + '</div><span class="xs muted">아이폰 시계 앱에서 이 시각에 알람을 맞추고, 레이블을 “지금 무엇을 의식하고 있지?”로 적어두세요. 알람이 울리면 앱의 체크인으로 와요.</span>'
      : '<span class="xs muted">식사 시간을 피해 다섯 개를 뽑아드려요.</span>') +
    '<button class="btn soft small" id="pick">' + (c ? '다시 뽑기' : '시각 뽑기') + '</button></div>';
}
function mountCheckinTimes(el) {
  var b = el.querySelector('#pick'); if (!b) return;
  b.onclick = function () { S.checkinTimes = { date: today(), times: randomTimes() }; save(); render(true); };
}

/* ===================================================== 여정 */
function viewJourney() {
  var t = today();
  if (!T.month) T.month = t.slice(0, 7);
  var ym = T.month.split('-'), y = +ym[0], m = +ym[1];
  var first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
  var doneMap = {}, logDates = {};
  for (var n = 1; n <= 21; n++) {
    var dd = S.days[n]; if (!dd) continue;
    if (dd.done && dd.doneAt) (doneMap[dd.doneAt] = doneMap[dd.doneAt] || []).push('D' + n);
  }
  S.logs.forEach(function (l) { logDates[l.date] = 1; });

  var html = '<main class="screen fade">';
  html += '<div class="stack" style="gap:6px"><h1 class="h-xl">21일 여정</h1><p class="small muted" style="line-height:1.6">할 일을 다 하면 Day가 자동으로 완료되고, 그날이 달력에 남아요. 쉬어간 날이 있어도 Day는 그대로 기다려요.</p></div>';

  html += '<div class="card"><div class="between"><button class="iconbtn" data-act="mon" data-arg="-1" aria-label="이전 달">' + I.back + '</button><span style="font-family:var(--serif);font-weight:600;font-size:17px">' + y + '년 ' + m + '월</span><button class="iconbtn" data-act="mon" data-arg="1" aria-label="다음 달">' + I.next + '</button></div><div class="cal">';
  WD.forEach(function (w) { html += '<span class="wd">' + w + '</span>'; });
  for (var b = 0; b < first.getDay(); b++) html += '<div class="c"></div>';
  for (var dI = 1; dI <= days; dI++) {
    var key = y + '-' + pad(m) + '-' + pad(dI), cls = '', tag = '';
    if (doneMap[key]) { cls = 'done'; tag = doneMap[key].join(' '); }
    else if (logDates[key]) { cls = 'rec' + (key === t ? ' today' : ''); tag = key === t ? '오늘' : '기록'; }
    else if (key === t) { cls = 'today'; tag = '오늘'; }
    html += '<div class="c"><span class="n ' + cls + '">' + dI + '</span><span class="tag">' + tag + '</span></div>';
  }
  html += '</div><div class="legend"><span><i style="background:var(--sea)"></i>Day를 끝낸 날</span><span><i style="background:var(--kelp)"></i>기록만 한 날</span></div></div>';

  html += '<div class="card"><span class="small" style="font-weight:600">지금까지 쌓은 경험</span><div class="grid3">' + evidenceStats().slice(0, 6).map(function (s) {
    return '<a class="stat" href="' + s.href + '"><b>' + s.n + '</b><span>' + s.label + '</span></a>';
  }).join('') + '</div></div>';

  var cur = currentDay();
  [1, 2, 3].forEach(function (st) {
    html += '<div class="stack" style="gap:4px"><div class="between" style="padding-bottom:6px"><span style="font-family:var(--serif);font-weight:600;font-size:17px">' + P.steps[st].name + '</span><span class="xs muted">' + P.steps[st].range + '</span></div>';
    P.days.filter(function (d) { return d.step === st; }).forEach(function (d) {
      var dd = S.days[d.n] || {}, done = dd.done, now = d.n === cur;
      var sub = done ? '완료' : (now ? '지금 여기' : '');
      if (d.n === 19) sub = (sub ? sub + ' · ' : '') + '+ 다섯 손가락 호흡법';
      html += '<div class="dayrow' + (now ? ' now' : '') + '"><a href="#/day/' + d.n + '" class="row grow" style="text-decoration:none;color:inherit"><span class="daynum ' + (done ? 'done' : (now ? 'now' : '')) + '">' + d.n + '</span><span class="grow"><span style="font-size:15px;font-weight:' + (now ? 600 : 500) + ';color:' + (d.n > cur ? 'var(--mute)' : 'var(--ink)') + '">' + esc(d.title) + '</span><br><span class="xs muted">' + (sub ? sub + ' · ' : '') + d.page + '쪽</span></span></a>' +
        (done ? '<span class="datechip done">' + fShort(dd.doneAt) + '</span>' : '') + '</div>';
    });
    html += '</div>';
  });
  html += '</main>';
  A.mon = function (a) { var d = new Date(y, m - 1 + (+a), 1); T.month = d.getFullYear() + '-' + pad(d.getMonth() + 1); render(true); };
  return { html: html + tabbar('journey') };
}
function evidenceStats() {
  var c = function (t, g) { return logsOf(t, function (l) { return !g || l.guide === g; }).length; };
  return [
    { label: '허기 테스트', n: c('hunger'), href: '#/t/hunger', day: 5 },
    { label: '갈망의 도구', n: c('c1') + c('c2'), href: '#/t/c1', day: 10 },
    { label: 'RAIN', n: c('rain'), href: '#/t/rain', day: 14 },
    { label: '마음챙김 식사', n: c('guide', 'raisin') + c('plateau'), href: '#/t/plateau', day: 7 },
    { label: '습관 루프', n: c('loop'), href: '#/t/loop', day: 3 },
    { label: '돌아보기', n: c('retro'), href: '#/f/retro', day: 12 },
    { label: '쾌락 안정기', n: c('plateau'), href: '#/t/plateau', day: 9 },
    { label: '주목하기', n: c('noting') + c('checkin'), href: '#/t/noting', day: 15 }
  ];
}

/* ===================================================== 정보은행 */
function viewBank() {
  if (!T.tab) T.tab = 'dis';
  var html = '<main class="screen fade"><h1 class="h-xl">정보은행</h1>';
  html += '<div class="tabs" style="--n:3">' + [['dis', '환멸감'], ['enc', '매혹'], ['all', '모든 기록']].map(function (x) {
    return '<button class="' + (T.tab === x[0] ? 'on' : '') + '" data-act="tab" data-arg="' + x[0] + '">' + x[1] + '</button>';
  }).join('') + '</div>';

  if (T.tab === 'dis') {
    var foods = foodsFrom(['c1', 'c2', 'retro']);
    if (S.focusFood && foods.indexOf(S.focusFood) < 0) foods.unshift(S.focusFood);
    if (!T.food) T.food = S.focusFood || foods[0];
    html += '<p class="small" style="color:var(--body);line-height:1.6">먹고 나서 실제로 어땠는지 모아둔 곳이에요. 갈망이 올라오면 여기 기록이 먼저 떠요.</p>';
    html += '<div class="wrap">' + foods.map(function (f) { return '<button class="chip' + (f === T.food ? ' on' : '') + '" data-act="food" data-arg="' + esc(f) + '">' + esc(f) + (f === S.focusFood ? ' ·집중' : '') + '</button>'; }).join('') + '<button class="chip add" data-act="newfood">+ 음식 추가</button></div>';
    if (!T.food) {
      html += '<div class="empty">아직 기록이 없어요. 고민인 음식을 추가하거나<br>갈망의 도구 1로 첫 기록을 남겨봐요.<br><br><a class="btn primary small" href="#/t/c1">갈망의 도구 1</a></div>';
    } else {
      var rec = S.logs.filter(function (l) { return (l.type === 'c1' || l.type === 'c2' || l.type === 'retro') && l.food === T.food; });
      var c1 = rec.filter(function (l) { return l.type === 'c1'; });
      html += '<div class="card"><div class="between"><span class="small" style="font-weight:600">갈망의 도구 점수</span><span class="small muted"><b style="color:var(--ink)">' + c1.length + '</b> / 15번</span></div>' + scoreChart(c1.map(function (l) { return l.total; })) +
        '<span class="small" style="color:var(--body)">' + chartMsg(c1) + '</span>' +
        (T.food !== S.focusFood ? '<button class="btn soft small" data-act="focus">이 음식에 집중하기 (Day 11)</button>' : '<a class="btn primary small" href="#/t/c1?food=' + encodeURIComponent(T.food) + '">이 음식으로 갈망의 도구 1</a>') + '</div>';
      html += '<div class="stack"><span class="small muted" style="font-weight:600">기록</span>' + (rec.length ? rec.slice().reverse().map(recordCard).join('') : '<div class="empty">아직 기록이 없어요</div>') + '</div>';
    }
    var rains = logsOf('rain');
    if (rains.length) {
      var avg = Math.max(1, Math.round(sum(rains.map(function (r) { return r.duration || 0; })) / rains.length / 60000));
      html += '<div class="card ink tight"><span class="xs muted">RAIN으로 탄 파도</span><span style="font-family:var(--serif);font-size:20px;font-weight:600">' + rains.length + '번 · 평균 ' + avg + '분</span><span class="xs muted">갈망은 보통 몇 분이면 지나가요. 내 숫자로 확인 중이에요.</span></div>';
    }
  } else if (T.tab === 'enc') {
    var en = logsOf('enchant');
    html += '<p class="small" style="color:var(--body);line-height:1.6">먹고 나서도 오래 기분 좋았던 음식과 순간들이에요. 진짜 배고플 때 여기서 골라봐요.</p>';
    html += en.length ? en.slice().reverse().map(function (l) {
      return '<div class="card tight"><div class="between"><b style="font-family:var(--serif);font-size:18px">' + esc(l.food) + '</b><span class="xs muted">' + (l.after ? '나중 기분: ' + esc(l.after) : fShort(l.date)) + '</span></div>' + (l.note ? '<span class="small" style="color:var(--body)">' + nl(l.note) + '</span>' : '') + '</div>';
    }).join('') : '<div class="empty">Day 18에서 본격적으로 채워요</div>';
    var stops = logsOf('plateau', function (l) { return l.note; });
    if (stops.length) html += '<div class="stack"><span class="small muted" style="font-weight:600">절벽 직전에 멈춘 느낌</span>' + stops.slice(-3).reverse().map(function (l) { return '<div class="card tight"><span class="small">“' + esc(l.note) + '”</span><span class="xs muted">' + esc(l.food || '') + ' · ' + fShort(l.date) + '</span></div>'; }).join('') + '</div>';
    html += '<a class="btn primary" href="#/f/enchant">매혹 기록 남기기</a>';
  } else {
    html += S.logs.length ? S.logs.slice().reverse().slice(0, 80).map(function (l) {
      return '<div class="record"><span class="grow"><b class="small">' + typeName(l) + '</b><br><span class="small" style="color:var(--body)">' + esc(summaryOf(l)) + '</span><br><span class="xs muted">' + timeOf(l.at) + '</span></span><button class="iconbtn" data-act="del" data-arg="' + l.id + '" aria-label="기록 삭제" style="width:36px;height:36px;color:var(--mute)">' + I.trash + '</button></div>';
    }).join('') : '<div class="empty">아직 기록이 없어요</div>';
  }
  html += '</main>';
  A.tab = function (a) { T.tab = a; render(true); };
  A.food = function (a) { T.food = a; render(true); };
  A.focus = function () { S.focusFood = T.food; save(); toast('이 음식에 집중해요. 15번을 목표로'); render(true); };
  A.newfood = function () {
    sheet('<h2 class="h-m">어떤 음식이 고민인가요?</h2><p class="small muted">특히 자꾸 손이 가는 음식이나 과식 행동 하나.</p><input class="input" id="nf" placeholder="예: 편의점 과자"><button class="btn primary" id="nfok">추가하고 집중하기</button>', function (el) {
      el.querySelector('#nfok').onclick = function () { var v = el.querySelector('#nf').value.trim(); if (!v) return; S.focusFood = v; T.food = v; save(); closeSheet(); render(true); };
      el.querySelector('#nf').focus();
    });
  };
  A.del = function (a) { if (!confirm('이 기록을 지울까요?')) return; S.logs = S.logs.filter(function (l) { return l.id !== a; }); save(); render(true); };
  return { html: html + tabbar('bank') };
}
function scoreChart(vals) {
  if (!vals.length) return '<div class="empty" style="padding:22px">기록이 쌓이면 점수 변화가 그래프로 보여요</div>';
  var W = 300, H = 110, mid = 55, k = vals.length;
  var step = k > 1 ? (W - 30) / (k - 1) : 0;
  var pts = vals.map(function (v, i) { return [15 + i * step, mid - v * 1.6]; });
  var poly = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
  var last = vals[k - 1];
  return '<svg viewBox="0 0 ' + W + ' ' + (H + 6) + '" width="100%" role="img" aria-label="점수 그래프, 마지막 ' + signed(last) + '"><path d="M0 ' + mid + 'H' + W + '" stroke="#CBD6D0" stroke-dasharray="3 4"/>' +
    '<text x="' + (W - 2) + '" y="' + (mid - 4) + '" text-anchor="end" font-size="10" fill="#55665F">0</text>' +
    (k > 1 ? '<polyline points="' + poly + '" fill="none" stroke="#2F6B5E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' : '') +
    pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === k - 1 ? 5 : 3.5) + '" fill="#2F6B5E"/>'; }).join('') +
    '<text x="' + pts[k - 1][0].toFixed(1) + '" y="' + (pts[k - 1][1] + (last >= 0 ? -10 : 18)).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#16302B">' + signed(last) + '</text></svg>';
}
function chartMsg(c1) {
  if (c1.length < 2) return '두 번 이상 기록하면 변화가 보여요.';
  var a = c1[0].total, b = c1[c1.length - 1].total;
  if (b < a) return '점수가 내려가고 있어요. 뇌가 이 음식의 진짜 보상값을 다시 배우는 중이에요.';
  if (b > a) return '아직 이 음식을 즐기고 있어요. 그것도 소중한 정보예요. 계속 모아봐요.';
  return '큰 변화는 아직이에요. 10–15번쯤 모이면 달라지기 시작해요.';
}
function recordCard(l) {
  var score = l.type === 'c1' ? signed(l.total) : (l.type === 'c2' ? '상상' : '돌아봄');
  var q = l.gain || l.got || l.note || '';
  return '<div class="record"><span class="score" style="' + (l.type !== 'c1' ? 'font-size:13px;color:var(--mute)' : '') + '">' + score + '</span><span class="grow quote">' + (q ? '“' + esc(q) + '”<br>' : '') + '<span class="xs muted">' + timeOf(l.at) + (l.amount ? ' · ' + esc(l.amount) : '') + (l.urge != null ? ' · 충동 ' + signed(l.urge) : '') + '</span></span></div>';
}
var TYPE = { hunger: '허기 테스트', loop: '습관 루프', signal: '몸의 신호', checkin: '알아차림 체크인', c1: '갈망의 도구 1', c2: '갈망의 도구 2', rain: 'RAIN', noting: '주목하기', plateau: '쾌락 안정기', guide: '실천', retro: '돌아보기', choice: '자발적인 선택', enchant: '매혹', kind: '오늘의 친절', review: '전과 후' };
function typeName(l) { return l.type === 'guide' ? (P.guides[l.guide] ? P.guides[l.guide].title : '실천') : (TYPE[l.type] || l.type); }
function summaryOf(l) {
  switch (l.type) {
    case 'hunger': return l.result || '';
    case 'loop': return [l.trigger, l.action, l.result].filter(Boolean).join(' → ');
    case 'signal': return (l.signal || '') + ' · ' + (l.mode || '') + (l.feel ? ' · ' + l.feel : '');
    case 'checkin': return [l.focus, l.where, l.mood].filter(Boolean).join(' · ');
    case 'c1': return (l.food || '') + ' · 합계 ' + signed(l.total) + (l.gain ? ' · ' + l.gain : '');
    case 'c2': return (l.food || '') + ' · 충동 ' + signed(l.urge);
    case 'rain': return Math.max(1, Math.round((l.duration || 0) / 60000)) + '분 · 주목 ' + (l.notes ? l.notes.length : 0) + '번';
    case 'noting': return (l.routine ? l.routine + ' · ' : '') + l.count + '번 주목';
    case 'plateau': return (l.food || '') + ' · ' + (l.bites ? l.bites.length : 0) + '입' + (l.after ? ' · ' + l.after : '');
    case 'guide': return (l.notes || []).filter(Boolean).join(' / ');
    case 'retro': return (l.food || '') + (l.got ? ' · ' + l.got : '');
    case 'enchant': return (l.food || '') + (l.after ? ' · ' + l.after : '');
    case 'kind': return [l.other ? '남에게' : '', l.self ? '나에게' : ''].filter(Boolean).join(', ') + (l.note ? ' · ' + l.note : '');
    case 'choice': return l.easy || '';
  }
  return '';
}

/* ===================================================== 도구 목록 */
function viewTools() {
  var cur = currentDay();
  function card(href, t, d, day) { return '<a class="tool" href="' + href + '"><b>' + t + '</b><span>' + d + (day && day > cur ? '<br>Day ' + day + '에서 배워요' : '') + '</span></a>'; }
  var html = '<main class="screen fade"><h1 class="h-xl">도구</h1><p class="small muted">언제든 꺼내 쓸 수 있어요. 아직 배우기 전이어도 괜찮아요.</p>';
  html += '<div class="stack"><b class="small">먹고 싶을 때</b><div class="grid2">' + card('#/t/hunger', '허기 테스트', '허기인지 갈망인지', 5) + card('#/t/rain', 'RAIN', '갈망의 파도 타기', 14) + card('#/t/c2', '갈망의 도구 2', '먹기 전에 상상하기', 13) + card('#/g/fivefinger', '다섯 손가락 호흡', '걱정으로 꽉 찰 때', 19) + '</div></div>';
  html += '<div class="stack"><b class="small">먹을 때</b><div class="grid2">' + card('#/t/plateau', '쾌락 안정기', '한 입씩 즐거움 재기', 9) + card('#/g/raisin', '건포도 수련', '오감으로 먹기', 7) + card('#/t/c1', '갈망의 도구 1', '먹으며 정보 모으기', 10) + card('#/f/enchant', '매혹 기록', '정말 좋았던 음식', 18) + '</div></div>';
  html += '<div class="stack"><b class="small">먹은 뒤·하루 중</b><div class="grid2">' + card('#/t/loop', '습관 루프', '계기 → 행동 → 결과', 3) + card('#/t/signal', '몸의 신호', '무시한 신호 적기', 4) + card('#/f/retro', '돌아보기', '지난 과식 되짚기', 12) + card('#/t/checkin', '알아차림 체크인', '지금 무엇을 의식하지?', 6) + '</div></div>';
  html += '<div class="stack"><b class="small">마음 연습</b><div class="grid2">' + card('#/t/noting', '주목하기', '생각·감정·감각', 15) + card('#/g/bodyscan', '바디 스캔', '몸과 다시 연결', 8) + card('#/g/kindness', '친절 연습', '나에게 친절하기', 19) + card('#/f/committee', '머릿속 위원회', '목소리에 이름 붙이기', 16) + '</div></div>';
  html += '<div class="stack"><b class="small">나</b><div class="grid2">' + card('#/f/goal', '나의 목표', 'Day 1') + card('#/f/story', '음식 이야기', 'Day 2') + card('#/f/survey', '마음챙김 식사 설문', 'Day 7 · Day 21') + card('#/f/evidence', '쌓은 경험', 'Day 20') + '</div></div>';
  html += '<a class="btn ghost" href="#/settings">설정 · 백업</a></main>';
  return { html: html + tabbar('tools') };
}

/* ===================================================== 허기 테스트 */
var HOURS = ['1시간 이내', '1–2시간', '2–3시간', '3–4시간', '4–5시간', '5시간 이상'];
function hoursSince(ms) { var h = (Date.now() - ms) / 36e5; return h < 1 ? 0 : h < 2 ? 1 : h < 3 ? 2 : h < 4 ? 3 : h < 5 ? 4 : 5; }
function viewHunger() {
  if (!T.sel) { T.sel = {}; T.hrs = S.lastMeal ? hoursSince(S.lastMeal) : null; }
  var c = { E: 0, H: 0, F: 0 };
  P.hungerItems.forEach(function (it, k) { if (T.sel[k]) for (var j = 0; j < it[1].length; j++) c[it[1][j]]++; });
  var max = Math.max(c.E, c.H, c.F, 1);
  var top = [['E', c.E], ['H', c.H], ['F', c.F]].sort(function (a, b) { return b[1] - a[1]; });
  var key;
  if (!top[0][1]) key = 'none';
  else if (top[0][1] === top[1][1]) key = T.hrs == null ? 'ask' : (T.hrs >= 4 ? 'TF' : 'TE');
  else key = top[0][0];
  var R = {
    E: ['감정이 보내는 신호', '배보다 마음이 먼저 반응하고 있어요. 갈망의 파도는 보통 몇 분이면 지나가요.', 'RAIN으로 파도 타보기', '#/t/rain'],
    TE: ['감정 쪽에 가까워요', '두 쪽이 비슷한데, 먹은 지 4–5시간이 안 됐어요. 몸보다 마음의 신호일 가능성이 커요.', 'RAIN으로 파도 타보기', '#/t/rain'],
    TF: ['허기 쪽에 가까워요', '두 쪽이 비슷한데, 먹은 지 4–5시간이 넘었어요. 몸이 연료를 원하는 것 같아요.', '쾌락 안정기 켜고 먹기', '#/t/plateau'],
    H: ['습관이 부르는 중', '늘 이맘때 찾던 그 맛이에요. 먹고 나서 실제로 어땠는지 먼저 떠올려봐요.', '갈망의 도구 2 · 상상해보기', '#/t/c2'],
    F: ['진짜 배고픔이에요', '몸이 연료를 원해요. 먹어도 괜찮아요. 한 입씩 느끼면서요.', '쾌락 안정기 켜고 먹기', '#/t/plateau'],
    ask: ['두 쪽이 비슷해요', '마지막으로 먹은 지 얼마나 됐는지 골라주세요. 그걸로 가려요.', '', ''],
    none: ['아직 몰라요', '해당하는 걸 하나 이상 눌러주세요.', '', '']
  }[key];
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">허기 테스트 · 책 136쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">잠깐, 지금 어떤지<br>먼저 살펴봐요</h1><p class="small muted">해당하는 걸 모두 눌러요. 정답은 없어요.</p></div>';
  html += '<div class="wrap">' + P.hungerItems.map(function (it, k) { return '<button class="chip' + (T.sel[k] ? ' on' : '') + '" data-act="tg" data-arg="' + k + '" aria-pressed="' + !!T.sel[k] + '">' + it[0] + '</button>'; }).join('') + '</div>';
  html += '<div class="card"><div class="stack">' + [['스트레스·감정', c.E, 'var(--emo)'], ['습관', c.H, 'var(--habit)'], ['허기', c.F, 'var(--hunger)']].map(function (r) {
    return '<div class="row small"><span style="width:92px;flex-shrink:0">' + r[0] + '</span><span class="bar"><i style="width:' + Math.round(r[1] / max * 100) + '%;background:' + r[2] + '"></i></span><b style="width:16px;text-align:right">' + r[1] + '</b></div>';
  }).join('') + '</div><div class="hr"></div><span class="xs muted">마지막으로 먹은 지</span>' + seg([0, 1, 2, 3, 4, 5], HOURS, T.hrs, 'hrs', 3) + '</div>';
  html += '<div class="card ink"><span class="xs muted">지금은 아마도</span><span style="font-family:var(--serif);font-weight:600;font-size:21px">' + R[0] + '</span><span class="small" style="color:#DCE7E2">' + R[1] + '</span></div>';
  html += '</main>';
  html += foot((R[3] ? '<button class="btn primary" data-act="route" data-arg="' + R[3] + '">' + R[2] + '</button>' : '') +
    '<button class="linkbtn" data-act="route" data-arg="#/t/c1" style="font-weight:400">그냥 먹을래요 · 먹으면서 정보를 모아봐요</button>');
  A.tg = function (a) { T.sel[a] = !T.sel[a]; render(true); };
  A.hrs = function (a) { T.hrs = +a; render(true); };
  A.route = function (a) {
    if (key !== 'none') addLog('hunger', { sel: Object.keys(T.sel).filter(function (k) { return T.sel[k]; }).map(function (k) { return P.hungerItems[k][0]; }), counts: c, result: R[0] });
    go(a);
  };
  return { html: html };
}

/* ===================================================== 습관 루프 */
function viewLoop() {
  if (!T.init) { T.init = 1; T.tr = []; T.em = []; }
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">습관 루프 · 책 110쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">계기 → 행동 → 결과</h1><p class="small muted">방금 먹은 순간을, 혹은 오늘 하루를 되짚으며 적어요.</p></div>';
  html += '<div class="stack-l"><div class="field">계기 <span class="hint">무엇이 먹고 싶게 했나요?</span>' + chips(P.triggers, T.tr, 'tr', true) + '<input class="input" id="trig" placeholder="직접 적기 (선택)" value="' + esc(T.trig || '') + '"></div>' +
    '<label class="field">행동 <span class="hint">무엇을, 어떻게 먹었나요?</span><input class="input" id="act" placeholder="예: 과자 한 봉지를 서서 다 먹음" value="' + esc(T.act || '') + '"></label>' +
    '<div class="field">결과 <span class="hint">먹고 나서 어땠나요?</span>' + chips(P.emotions, T.em, 'em', true) + '<input class="input" id="res" placeholder="직접 적기 (선택)" value="' + esc(T.res || '') + '"></div></div>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  A.tr = function (a) { tog(T.tr, a); render(true); };
  A.em = function (a) { tog(T.em, a); render(true); };
  A.save = function () {
    var trig = T.tr.concat(T.trig ? [T.trig] : []).join(', '), res = T.em.concat(T.res ? [T.res] : []).join(', ');
    if (!trig && !T.act && !res) { toast('한 칸이라도 적어주세요'); return; }
    addLog('loop', { trigger: trig, action: T.act || '', result: res }); toast('루프 하나를 알아차렸어요'); go('#/');
  };
  return { html: html, mount: bindInputs({ trig: 'trig', act: 'act', res: 'res' }) };
}
function tog(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
function bindInputs(map) {
  return function (el) {
    Object.keys(map).forEach(function (id) { var i = el.querySelector('#' + id); if (i) i.addEventListener('input', function () { T[map[id]] = i.value; }); });
  };
}

/* ===================================================== 몸의 신호 */
function viewSignal() {
  if (!T.init) { T.init = 1; T.mode = '무시했어요'; }
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">몸의 신호 · 책 126쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">몸이 보낸 신호를<br>어떻게 했나요?</h1><p class="small muted">계기는 넘기고, 행동과 그 뒤 몸의 느낌에 집중해요.</p></div>';
  html += '<div class="stack-l">' + seg(['무시했어요', '귀 기울였어요'], null, T.mode, 'mode') +
    '<div class="field">어떤 신호였나요?' + chips(P.signals, T.sig, 'sig') + '</div>' +
    '<label class="field">내가 한 행동<input class="input" id="act" placeholder="예: 배불렀지만 남은 걸 다 먹었다" value="' + esc(T.act || '') + '"></label>' +
    '<label class="field">그 뒤 몸의 느낌<input class="input" id="feel" placeholder="예: 속이 더부룩하고 졸렸다" value="' + esc(T.feel || '') + '"></label></div>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  A.mode = function (a) { T.mode = a; render(true); };
  A.sig = function (a) { T.sig = a; render(true); };
  A.save = function () { if (!T.sig) { toast('신호를 하나 골라주세요'); return; } addLog('signal', { signal: T.sig, mode: T.mode, action: T.act || '', feel: T.feel || '' }); toast('몸의 신호를 기록했어요'); go('#/'); };
  return { html: html, mount: bindInputs({ act: 'act', feel: 'feel' }) };
}

/* ===================================================== 체크인 */
function viewCheckin() {
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">알아차림 체크인 · 책 155쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">지금 나는 무엇을<br>의식하고 있지?</h1><p class="small muted">자동 조종이었어도 괜찮아요. 알아챈 것만으로 충분해요.</p></div>';
  html += '<div class="stack-l"><div class="field">하는 일에' + seg(['몰두 중', '자동 조종'], null, T.focus, 'f1') + '</div>' +
    '<div class="field">주의는' + seg(['몸의 감각', '머릿속 생각'], null, T.where, 'f2') + '</div>' +
    '<div class="field">지금 기분' + seg(['좋아요', '보통', '별로'], null, T.mood, 'f3') + '</div></div>';
  html += checkinTimesCard() + '</main>' + foot('<button class="btn primary" data-act="save">체크인</button>');
  A.f1 = function (a) { T.focus = a; render(true); };
  A.f2 = function (a) { T.where = a; render(true); };
  A.f3 = function (a) { T.mood = a; render(true); };
  A.save = function () { if (!T.focus && !T.where && !T.mood) { toast('하나라도 골라주세요'); return; } addLog('checkin', { focus: T.focus, where: T.where, mood: T.mood }); toast('지금을 알아차렸어요'); go('#/'); };
  return { html: html, mount: mountCheckinTimes };
}

/* ===================================================== 갈망의 도구 1 */
var AMOUNTS = ['너무 많이', '꽤 많이', '적절하게', '조금 모자라게', '먹지 않음'];
var VALS = [-10, -5, 0, 5, 10];
function scaleRows(prefix) {
  return [['몸은 어떤 느낌인가요?', 'body'], ['기분은 어떤가요?', 'mood'], ['어떤 생각이 드나요?', 'think']].map(function (q) {
    return '<div class="stack" style="gap:6px"><div class="between"><b class="small">' + q[0] + '</b><span class="xs muted">끔찍해 ← → 최고야</span></div>' + seg(VALS, VALS.map(signed), T[q[1]], prefix + q[1]) + '</div>';
  }).join('');
}
function bindScales(prefix) {
  ['body', 'mood', 'think'].forEach(function (k) { A[prefix + k] = function (a) { T[k] = +a; render(true); }; });
}
function viewC1(q) {
  if (!T.init) { T.init = 1; T.phase = 'pre'; T.food = q.food || ''; T.why = []; }
  var foods = foodsFrom(['c1', 'c2', 'retro', 'plateau', 'enchant']);
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">갈망의 도구 1 · 책 202쪽</span>');
  if (T.phase === 'pre') {
    html += '<div class="stack" style="gap:6px"><h1 class="h-l">먹으면서<br>정보를 모아봐요</h1><p class="small muted">참으라는 게 아니에요. 먹되, 주의를 기울여요.</p></div>';
    html += '<div class="stack-l"><label class="field">무엇을 먹나요?<input class="input" id="food" list="fl" placeholder="예: 편의점 과자" value="' + esc(T.food) + '"><datalist id="fl">' + foods.map(function (f) { return '<option value="' + esc(f) + '">'; }).join('') + '</datalist></label>' +
      '<div class="field">왜 먹고 싶나요?' + chips(['허기', '스트레스', '지루함', '피곤함', '기분 전환', '눈에 보여서', '습관'], T.why, 'why', true) + '</div>' +
      '<div class="card kelp tight"><b class="small">먹는 동안</b><span class="small" style="color:var(--body);line-height:1.6">재료와 모양, 냄새를 살피고, 한 입마다 맛과 질감, 온도에 집중해요. 다 먹을 때까지.</span></div></div>';
    html += '</main>' + foot('<button class="btn primary" data-act="ate">다 먹었어요</button>');
  } else {
    var total = (T.body || 0) + (T.mood || 0) + (T.think || 0);
    var ready = T.amount && T.body != null && T.mood != null && T.think != null;
    html += '<div class="stack" style="gap:4px"><span class="small muted">' + esc(T.food || '음식') + ' · 방금 먹음</span><h1 class="h-l">다 먹고 나니, 어때요?</h1></div>';
    html += '<div class="stack-l"><div class="field">얼마나 먹었나요?' + chips(AMOUNTS, T.amount, 'amt') + '</div>' + scaleRows('s') + '</div>';
    html += '<div class="card ink" style="flex-direction:row;align-items:center;gap:16px"><span style="font-family:var(--serif);font-weight:600;font-size:34px;min-width:64px">' + (ready ? signed(total) : '–') + '</span><span class="small" style="color:#DCE7E2">' +
      (!ready ? '네 가지에 답하면 합계가 나와요.' : total > 0 ? '아직 이 음식을 즐기고 있어요. 그것도 소중한 정보예요.' : total < 0 ? '환멸감이 느껴지기 시작했어요. 다음 갈망 때 이 기록이 먼저 떠요.' : '좋지도 나쁘지도 않았어요. 한 번 더 모아봐요.') + '</span></div>';
    html += '<label class="field">여기서 나는 무엇을 얻었나요?<textarea class="input" id="gain" placeholder="판단 말고, 몸이 하는 말을 적어봐요">' + esc(T.gain || '') + '</textarea></label>';
    html += '</main>' + foot('<button class="btn primary" data-act="save"' + (ready ? '' : ' disabled') + '>정보은행에 쌓기</button>');
  }
  A.why = function (a) { tog(T.why, a); render(true); };
  A.ate = function () { if (!T.food.trim()) { toast('무엇을 먹는지 적어주세요'); return; } T.phase = 'post'; render(); };
  A.amt = function (a) { T.amount = a; render(true); };
  bindScales('s');
  A.save = function () {
    var total = T.body + T.mood + T.think;
    addLog('c1', { food: T.food.trim(), why: T.why, amount: T.amount, body: T.body, mood: T.mood, think: T.think, total: total, gain: (T.gain || '').trim() });
    S.lastMeal = Date.now(); save();
    toast('정보은행에 쌓였어요'); T = { tab: 'dis', food: T.food.trim() }; location.hash = '#/bank';
  };
  return { html: html, mount: bindInputs({ food: 'food', gain: 'gain' }) };
}

/* ===================================================== 갈망의 도구 2 */
function viewC2(q) {
  if (!T.init) { T.init = 1; T.phase = 'imagine'; T.food = q.food || S.focusFood || ''; }
  var foods = foodsFrom(['c1', 'c2', 'retro']);
  var past = logsOf('c1', function (l) { return T.food && l.food === T.food.trim(); }).slice(-2).reverse();
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">갈망의 도구 2 · 책 235쪽</span>');
  if (T.phase === 'imagine') {
    html += '<div class="stack" style="gap:6px"><h1 class="h-l">먹기 전에<br>먼저 상상해봐요</h1><p class="small muted">도구 1을 상상으로 따라가요. 실제로 먹지 않아도 돼요.</p></div>';
    html += '<label class="field">무엇이 먹고 싶나요?<input class="input" id="food" list="fl2" value="' + esc(T.food) + '" placeholder="예: 편의점 과자"><datalist id="fl2">' + foods.map(function (f) { return '<option value="' + esc(f) + '">'; }).join('') + '</datalist></label>';
    if (past.length) html += '<div class="stack"><span class="small" style="font-weight:600">지난번 이걸 먹었을 때</span>' + past.map(recordCard).join('') + '</div>';
    html += '<div class="card kelp"><b class="small">눈을 감고 떠올려요</b><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px" class="small"><li>그 음식을 집어 드는 모습</li><li>한 입, 두 입… 맛과 질감, 먹는 속도</li><li>다 먹은 뒤 배의 느낌, 기분, 기운, 떠오르는 생각</li></ol></div>';
    html += '</main>' + foot('<button class="btn primary" data-act="next">다 떠올렸어요</button>');
  } else {
    html += '<div class="stack" style="gap:4px"><span class="small muted">' + esc(T.food || '음식') + ' · 상상으로</span><h1 class="h-l">상상 속에서 다 먹고 나니</h1></div>';
    html += '<div class="stack-l"><div class="field">얼마나 먹었을까요?' + chips(AMOUNTS, T.amount, 'amt') + '</div>' + scaleRows('s') + '</div>';
    html += '<div class="card"><b class="small">처음과 비교해 지금, 그 음식을 먹고 싶은 충동은?</b>' + seg(VALS, ['많이 약해짐', '약해짐', '비슷', '강해짐', '많이 강해짐'], T.urge, 'urge') + '<span class="xs muted">-10 상당히 약해졌다 · 0 비슷하다 · +10 상당히 강해졌다</span></div>';
    if (T.urge > 0) html += '<div class="card kelp tight"><span class="small">충동이 오히려 강해졌네요. 괜찮아요. 주의를 덜 기울였다는 신호일 수 있어요. <b>먹으면서 도구 1로 정보를 모아봐요.</b></span></div>';
    html += '</main>' + foot('<button class="btn primary" data-act="save"' + (T.urge == null ? ' disabled' : '') + '>' + (T.urge > 0 ? '기록하고 도구 1로' : '기록하기') + '</button>');
  }
  A.next = function () { if (!T.food.trim()) { toast('무엇이 먹고 싶은지 적어주세요'); return; } T.phase = 'rate'; render(); };
  A.amt = function (a) { T.amount = a; render(true); };
  A.urge = function (a) { T.urge = +a; render(true); };
  bindScales('s');
  A.save = function () {
    addLog('c2', { food: T.food.trim(), amount: T.amount, body: T.body, mood: T.mood, think: T.think, urge: T.urge });
    var f = T.food.trim();
    if (T.urge > 0) { toast('기록했어요. 먹으면서 정보를 모아봐요'); go('#/t/c1?food=' + encodeURIComponent(f)); }
    else { toast(T.urge < 0 ? '충동이 약해졌어요. 상상만으로도 달라졌네요' : '기록했어요'); go('#/'); }
  };
  return { html: html, mount: bindInputs({ food: 'food' }) };
}

/* ===================================================== RAIN */
function viewRain() {
  if (!T.init) { T.init = 1; T.step = 0; T.start = Date.now(); T.parts = []; T.notes = []; T.level = 3; }
  var labels = ['R', 'A', 'I', 'N'];
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<div class="rainstep" style="justify-content:center">' + labels.map(function (l, i) { return '<span class="' + (T.step === 'done' || i < T.step ? '' : i === T.step ? 'on' : 'off') + '">' + l + '</span>'; }).join('') + '</div>');
  var f;
  if (T.step === 0) {
    html += '<div class="guide"><span class="eyebrow">1단계 · Recognize</span><h1 class="h-l">알아차리고<br>마음을 가라앉혀요</h1><p class="lead">이를 악물고 버티지 않아도 돼요. 지금 느끼는 것이 갈망이라는 걸 알아차리기만 해도, 그 힘이 조금 줄어들어요.</p><p class="small muted">공포영화의 괴물도 정체를 알면 덜 무섭잖아요.</p></div>';
    f = '<button class="btn primary" data-act="nx">알아차렸어요</button>';
  } else if (T.step === 1) {
    html += '<div class="guide"><span class="eyebrow">2단계 · Accept</span><h1 class="h-l">밀어내지 않고<br>받아들여요</h1><p class="lead">밀어내거나 무시하거나 다른 데로 돌리지 않아요. “절대 안 먹을 거야”라고 저항하면 갈망은 오히려 커져요.</p><p class="small muted">저기 다가오고 있네. 살짝 미소 지어도 좋아요.</p></div>';
    f = '<button class="btn primary" data-act="nx">그대로 둘게요</button>';
  } else if (T.step === 2) {
    html += '<div class="stack" style="gap:8px;padding-top:12px"><span class="eyebrow">3단계 · Investigate</span><h1 class="h-l">호기심으로<br>몸을 탐색해요</h1><p class="lead">“지금 내 몸에 무슨 일이 일어나고 있지?” 애써 찾지 말고, 가장 뚜렷하게 솟는 곳을 봐요.</p></div>' +
      '<div class="field">어디서 느껴지나요?' + chips(P.bodyParts, T.parts, 'part', true) + '</div>' +
      '<div class="card kelp tight"><span class="small">가슴의 긴장인가요? 뱃속이 타는 느낌인가요? 도망치고 싶은 초조함인가요?</span></div>';
    f = '<button class="btn primary" data-act="nx">다음 · 주목하기</button>';
  } else if (T.step === 3) {
    var n = T.notes.length, step = n > 1 ? 304 / (n - 1) : 0;
    var pts = T.notes.map(function (p, k) { return (5 + k * step).toFixed(1) + ',' + (80 - p.v * 14.5).toFixed(1); }).join(' ');
    var area = n > 1 ? '5,80 ' + pts + ' ' + (5 + (n - 1) * step).toFixed(1) + ',80' : '';
    html += '<div class="stack" style="gap:6px"><span class="eyebrow">4단계 · Note</span><h1 class="h-l">가장 강한 것에<br>이름을 붙여요</h1><p class="small muted">하나에 1초. 모르겠으면 큰 이름만 눌러도 충분해요.</p></div>';
    html += '<div class="card tight"><div class="between xs muted"><span>지금 파도</span><span>' + n + '번 주목함</span></div>' +
      (n > 1 ? '<svg viewBox="0 0 314 84" width="100%" role="img" aria-label="갈망의 세기 변화"><path d="M0 80h314" stroke="#E6ECE8"/><polygon points="' + area + '" fill="#DCE7E2"/><polyline points="' + pts + '" fill="none" stroke="#2F6B5E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>' : '<div class="xs muted" style="padding:28px 0;text-align:center">세기를 고르고 이름을 붙이면 파도가 그려져요</div>') + '</div>';
    html += '<div class="field">지금 세기' + seg([1, 2, 3, 4, 5], null, T.level, 'lv') + '</div>';
    html += '<div class="big3">' + ['생각', '감정', '감각'].map(function (l) { return '<button data-act="note" data-arg="' + l + '">' + l + '</button>'; }).join('') + '</div>';
    html += chips(P.senseWords, null, 'noteS');
    if (n) html += '<p class="small muted">방금: <span style="color:var(--ink)">' + T.notes.slice(-3).map(function (x) { return esc(x.l); }).join(' → ') + '</span></p>';
    f = '<button class="btn ghost" data-act="finish" style="border-color:var(--sea);color:var(--sea)">파도가 지나갔어요</button>';
  } else {
    var mins = Math.max(1, Math.round(T.duration / 60000));
    var rains = logsOf('rain'), avg = rains.length ? Math.max(1, Math.round(sum(rains.map(function (r) { return r.duration || 0; })) / rains.length / 60000)) : mins;
    html += '<div class="guide"><svg width="96" height="40" viewBox="0 0 96 40" aria-hidden="true"><path d="M2 20c7.5-12 15-12 23 0s15 12 23 0 15-12 23 0 15 12 23 0" fill="none" stroke="#2F6B5E" stroke-width="3" stroke-linecap="round"/></svg><h1 class="h-xl">이번 파도는<br>' + (T.duration < 60000 ? '1분 안에' : mins + '분 만에') + ' 지나갔어요</h1><p class="lead">하는 동안엔 시간을 보여주지 않았어요. 시계를 보는 것도 저항의 신호라서요.' + (rains.length > 1 ? ' 지금까지 내 파도는 평균 ' + avg + '분이에요.' : '') + '</p></div>';
    f = '<a class="btn primary" href="#/">오늘로 돌아가기</a><a class="linkbtn" href="#/t/c1" style="font-weight:400;text-align:center">그래도 먹고 싶어요 · 먹으면서 정보를 모아봐요</a>';
  }
  html += '</main>' + foot(f);
  A.nx = function () { T.step++; render(); };
  A.part = function (a) { tog(T.parts, a); render(true); };
  A.lv = function (a) { T.level = +a; render(true); };
  A.note = function (a) { T.notes.push({ l: a, v: T.level }); if (T.notes.length > 30) T.notes.shift(); render(true); };
  A.noteS = function (a) { T.notes.push({ l: '감각 · ' + a, v: T.level }); if (T.notes.length > 30) T.notes.shift(); render(true); };
  A.finish = function () { T.duration = Date.now() - T.start; addLog('rain', { duration: T.duration, parts: T.parts, notes: T.notes }); T.step = 'done'; render(); };
  return { html: html };
}

/* ===================================================== 주목하기 */
function viewNoting() {
  if (!T.init) { T.init = 1; T.list = []; T.open = null; }
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">주목하기 · 책 260쪽</span>');
  if (T.phase === 'end') {
    html += '<div class="guide"><h1 class="h-l">' + T.list.length + '번 주목했어요</h1><p class="lead">자동 조종(계획, 걱정)일 때보다 지금에 있을 때 기분이 어땠나요?</p>' + seg(['더 나았어요', '비슷했어요', '잘 모르겠어요'], null, T.feel, 'feel') + '</div>';
    html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  } else {
    html += '<div class="stack" style="gap:6px"><h1 class="h-l">지금 가장 강한 것에<br>1초씩 이름을</h1><p class="small muted">모르겠으면 큰 이름만. 길게 생각하지 않아도 돼요.</p></div>';
    html += '<div class="field">어떤 일과 중인가요? <span class="hint">선택</span>' + chips(S.routines, T.routine, 'rt') + '<button class="textbtn" data-act="addrt" style="align-self:flex-start">+ 일과 추가</button></div>';
    html += '<div class="big3">' + ['생각', '감정', '감각'].map(function (l) { return '<button data-act="note" data-arg="' + l + '">' + l + '</button>'; }).join('') + '</div>';
    html += '<div class="wrap"><button class="chip' + (T.open === 'e' ? ' on' : '') + '" data-act="op" data-arg="e">감정 자세히</button><button class="chip' + (T.open === 't' ? ' on' : '') + '" data-act="op" data-arg="t">생각 자세히</button><button class="chip' + (T.open === 's' ? ' on' : '') + '" data-act="op" data-arg="s">감각 자세히</button></div>';
    if (T.open) {
      var words = T.open === 'e' ? P.emotionWords : T.open === 't' ? P.thoughtWords : ['시각', '청각', '촉각', '후각', '미각'].concat(P.senseWords.slice(0, 6));
      var pre = T.open === 'e' ? '감정' : T.open === 't' ? '생각' : '감각';
      html += '<div class="wrap">' + words.map(function (w) { return '<button class="chip" data-act="noteD" data-arg="' + pre + ' · ' + w + '">' + w + '</button>'; }).join('') + '</div>';
    }
    html += '<div class="card tight"><div class="between xs muted"><span>흐름</span><span>' + T.list.length + '번</span></div><span class="small">' + (T.list.length ? T.list.slice(-8).map(esc).join(' → ') : '버튼을 누르면 여기에 흐름이 쌓여요') + '</span></div>';
    html += '</main>' + foot('<button class="btn primary" data-act="end"' + (T.list.length ? '' : ' disabled') + '>마치기</button>');
  }
  A.rt = function (a) { T.routine = T.routine === a ? null : a; render(true); };
  A.addrt = function () { var v = prompt('어떤 일과를 추가할까요?'); if (v && v.trim()) { S.routines.push(v.trim()); save(); T.routine = v.trim(); render(true); } };
  A.note = function (a) { T.list.push(a); render(true); };
  A.noteD = function (a) { T.list.push(a); render(true); };
  A.op = function (a) { T.open = T.open === a ? null : a; render(true); };
  A.end = function () { T.phase = 'end'; render(); };
  A.feel = function (a) { T.feel = a; render(true); };
  A.save = function () { addLog('noting', { routine: T.routine || '', labels: T.list, count: T.list.length, feel: T.feel || '' }); toast('주목하기를 기록했어요'); go('#/'); };
  return { html: html };
}

/* ===================================================== 쾌락 안정기 */
function viewPlateau() {
  if (!T.init) { T.init = 1; T.bites = []; T.food = ''; }
  var vals = [5], v = 5;
  T.bites.forEach(function (b) { v = Math.max(0, Math.min(10, v + (b === '더' ? 1 : b === '덜' ? -1 : 0))); vals.push(v); });
  var stopIdx = T.bites.indexOf('덜');
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">쾌락 안정기 · 책 187쪽</span>');
  if (T.phase === 'end') {
    html += '<div class="stack" style="gap:6px"><h1 class="h-l">' + T.bites.length + '입 먹었어요</h1><p class="lead">' + (stopIdx >= 0 ? (stopIdx + 1) + '번째 입에서 즐거움이 줄기 시작했어요.' : '마지막까지 즐거웠어요. 그것도 좋은 정보예요.') + '</p></div>' + plateauChart(vals, stopIdx);
    html += '<label class="field">멈춘 순간의 느낌을 기억해둘까요? <span class="hint">매혹 정보은행에 함께 보여요 (선택)</span><textarea class="input" id="note" placeholder="예: 세 숟가락째에 개운하게 멈췄다">' + esc(T.note || '') + '</textarea></label>';
    html += '<div class="card kelp tight"><span class="small">포만감은 늦게 와요. 15분 뒤에 홈에서 한 번 물어볼게요.</span></div>';
    html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  } else {
    html += '<div class="stack" style="gap:6px"><h1 class="h-l">한 입마다<br>즐거움을 재봐요</h1><p class="small muted">앞의 한 입보다 더 맛있나요, 비슷한가요, 덜한가요?</p></div>';
    html += '<input class="input" id="food" placeholder="무엇을 먹나요? (선택)" value="' + esc(T.food) + '">';
    html += plateauChart(vals, stopIdx);
    if (stopIdx >= 0) html += '<div class="card ink tight"><b>여기가 쾌락 안정기예요</b><span class="small" style="color:#DCE7E2">즐거움이 줄기 시작했어요. 접시에 남아 있어도 여기서 멈춰도 괜찮아요.</span></div>';
    html += '<div class="grid3">' + ['덜', '비슷', '더'].map(function (b) { return '<button class="btn ' + (b === '덜' ? 'soft' : b === '더' ? 'primary' : 'ghost') + '" data-act="bite" data-arg="' + b + '">' + (b === '더' ? '더 맛있어' : b === '덜' ? '덜해' : '비슷해') + '</button>'; }).join('') + '</div>';
    html += '<p class="xs muted" style="text-align:center">' + (T.bites.length ? T.bites.length + '입째 · <button class="textbtn" data-act="undo" style="padding:0;font-size:12px">한 입 취소</button>' : '첫 입을 먹고 눌러요') + '</p>';
    html += '</main>' + foot('<button class="btn dark" data-act="end"' + (T.bites.length ? '' : ' disabled') + '>그만 먹었어요</button>');
  }
  A.bite = function (a) { T.bites.push(a); render(true); };
  A.undo = function () { T.bites.pop(); render(true); };
  A.end = function () { T.phase = 'end'; render(); };
  A.save = function () {
    var l = addLog('plateau', { food: (T.food || '').trim(), bites: T.bites, stopAt: stopIdx >= 0 ? stopIdx + 1 : null, note: (T.note || '').trim() });
    S.lastMeal = Date.now();
    S.followups.push({ id: uid(), ref: l.id, kind: 'full', due: Date.now() + 15 * 60000, text: '15분 지났어요. ' + (l.food ? l.food + ', ' : '') + '포만감은 어때요?' });
    save(); toast('기록했어요. 15분 뒤에 물어볼게요'); go('#/');
  };
  return { html: html, mount: bindInputs({ food: 'food', note: 'note' }) };
}
function plateauChart(vals, stopIdx) {
  var W = 314, H = 120, n = vals.length, step = n > 1 ? Math.min(40, (W - 20) / (n - 1)) : 0;
  var pts = vals.map(function (v, i) { return [10 + i * step, H - 10 - v * 10]; });
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="한 입 그래프"><path d="M0 ' + (H - 10) + 'H' + W + '" stroke="#E6ECE8"/>';
  if (stopIdx >= 0) { var x = pts[stopIdx + 1][0]; s += '<path d="M' + x + ' 6V' + (H - 10) + '" stroke="#C9785D" stroke-dasharray="4 4"/><text x="' + (x + 4) + '" y="16" font-size="10" fill="#9A4F36">안정기</text>'; }
  if (n > 1) s += '<polyline points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '" fill="none" stroke="#2F6B5E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  s += pts.slice(1).map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="#2F6B5E"/>'; }).join('') + '</svg>';
  return '<div class="card tight"><div class="between xs muted"><span>한 입 그래프</span><span>즐거움</span></div>' + s + '</div>';
}

/* ===================================================== 가이드형 실천 */
function viewGuide(name) {
  var g = P.guides[name]; if (!g) return viewTools();
  if (!T.init) { T.init = 1; T.i = g.mood ? -1 : 0; T.notes = []; }
  var n = g.steps.length;
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), esc(g.title), '<span class="iconbtn" style="font-size:13px;color:var(--mute)">' + (T.i >= 0 && T.i < n ? (T.i + 1) + '/' + n : '') + '</span>');
  html += '<div class="progress">' + g.steps.map(function (s, k) { return '<i class="' + (k <= T.i ? 'on' : '') + '"></i>'; }).join('') + '</div>';
  var f;
  if (T.i === -1) {
    html += '<div class="guide"><span class="eyebrow">시작하기 전에</span><h1 class="h-l">지금 기분은<br>어떤가요?</h1>' + seg(['좋아요', '보통', '별로'], null, T.pre, 'pre') +
      (name === 'bodyscan' ? '<p class="small muted">저자의 안내 녹음은 <a href="https://drjud.com/body-scan/" target="_blank" rel="noopener">drjud.com</a>에도 있어요(영어).</p>' : '') +
      (name === 'kindness' ? '<p class="small muted">어렵게 느껴지면 <a href="#/g/kindness2">대안 연습</a>으로 해도 돼요.</p>' : '') + '</div>';
    f = '<button class="btn primary" data-act="gnext">시작하기</button>';
  } else if (T.i < n) {
    var st = g.steps[T.i];
    html += '<div class="guide"><span class="eyebrow">' + esc(st[0]) + '</span><h1 class="h-xl">' + esc(st[1]) + '</h1><p class="lead" style="font-size:16px;line-height:1.75">' + esc(st[2]) + '</p>' +
      (g.speak && window.speechSynthesis ? '<button class="btn soft small" data-act="speak" style="width:auto;align-self:flex-start">' + '<span style="width:18px;height:18px;display:flex">' + I.speak + '</span>읽어주기</button>' : '') +
      '<svg width="72" height="20" viewBox="0 0 72 20" aria-hidden="true"><path d="M2 10c5.5-6 11-6 17 0s11.5 6 17 0 11.5-6 17 0 11.5 6 17 0" fill="none" stroke="#8FB8AA" stroke-width="2" stroke-linecap="round"/></svg></div>';
    html += '<label class="field" style="font-weight:400;color:var(--mute);font-size:13px">알아차린 것 한 줄 (안 써도 돼요)<input class="input" id="gn" value="' + esc(T.notes[T.i] || '') + '" placeholder="예: 생각보다 시큼했다"></label>';
    f = '<div class="row"><button class="btn ghost" data-act="gprev" style="width:96px;flex-shrink:0">이전</button><button class="btn primary" data-act="gnext">' + (T.i === n - 1 ? '다 했어요' : '다음') + '</button></div>';
  } else {
    html += '<div class="guide"><h1 class="h-xl">잘했어요</h1>' + (g.mood ? '<p class="lead">지금 기분은 시작할 때와 비교해 어때요?</p>' + seg(['좋아요', '보통', '별로'], null, T.post, 'post') + (T.pre ? '<p class="small muted">시작할 때: ' + esc(T.pre) + '</p>' : '') : '<p class="lead">감을 잡으면 다른 간식과 식사에도 해봐요. 속도가 아니라 감각을 따라가는 거예요.</p>') + '</div>';
    f = '<button class="btn primary" data-act="gsave">기록하기</button>';
  }
  html += '</main>' + foot(f);
  A.pre = function (a) { T.pre = a; render(true); };
  A.post = function (a) { T.post = a; render(true); };
  A.gnext = function () { stopSpeak(); T.i++; render(); };
  A.gprev = function () { stopSpeak(); if (T.i > 0) T.i--; render(); };
  A.speak = function () { stopSpeak(); var st = g.steps[T.i]; var u = new SpeechSynthesisUtterance(st[1] + '. ' + st[2]); u.lang = 'ko-KR'; u.rate = 0.9; speechSynthesis.speak(u); };
  A.gsave = function () { addLog('guide', { guide: name, notes: T.notes.filter(Boolean), pre: T.pre || '', post: T.post || '' }); toast(g.title + ' 기록 완료'); go('#/'); };
  return { html: html, mount: function (el) { var i = el.querySelector('#gn'); if (i) i.oninput = function () { T.notes[T.i] = i.value; }; } };
}
function stopSpeak() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

/* ===================================================== Day 1 목표 */
function viewGoal() {
  if (!T.init) { T.init = 1; var g = S.goal || {}; T.items = (g.items || []).slice(); T.why = g.why || ''; T.methods = JSON.parse(JSON.stringify(g.methods || [])); T.custom = ''; }
  var custom = T.items.filter(function (x) { return P.goalExamples.indexOf(x) < 0; });
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">Day 1 · 책 103쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">나의 목표</h1><p class="small muted">절박하게 움켜쥐는 목표 말고, 가볍게 품을 한두 개. 남의 바람이 아니라 내 바람으로.</p></div>';
  html += '<div class="field">고르거나 직접 적어요 <span class="hint">두 개까지</span>' + chips(P.goalExamples.concat(custom), T.items, 'gi', true) +
    '<div class="row"><input class="input" id="gc" placeholder="직접 적기" value="' + esc(T.custom) + '"><button class="btn soft small" data-act="gadd" style="width:auto">추가</button></div></div>';
  html += '<label class="field">이 도전이 왜 나에게 중요한가요? <span class="hint">남의 기준 때문인지, 나를 돌보고 싶어서인지 살펴봐요</span><textarea class="input" id="gw">' + esc(T.why) + '</textarea></label>';
  html += '<div class="stack"><b class="small">예전에 시도했던 방법</b><span class="xs muted">노력: 0 노력 필요 없었음 ~ 10 매우 힘들었음 · 즐거움: 0 고문 같았음 ~ 10 너무 즐거웠음</span>';
  T.methods.forEach(function (m, k) {
    html += '<div class="card tight"><div class="row"><input class="input" data-mi="' + k + '" value="' + esc(m.name) + '" placeholder="예: 저탄고지 식단"><button class="iconbtn" data-act="mdel" data-arg="' + k + '" aria-label="삭제" style="color:var(--mute)">' + I.trash + '</button></div>' +
      '<label class="small">노력 <b>' + m.effort + '</b><input class="range" type="range" min="0" max="10" value="' + m.effort + '" data-me="' + k + '"></label>' +
      '<label class="small">즐거움 <b>' + m.joy + '</b><input class="range" type="range" min="0" max="10" value="' + m.joy + '" data-mj="' + k + '"></label></div>';
  });
  html += '<button class="btn soft small" data-act="madd">+ 방법 추가</button></div>';
  html += '</main>' + foot('<button class="btn primary" data-act="gsave">목표 저장</button>');
  A.gi = function (a) { if (T.items.indexOf(a) < 0 && T.items.length >= 2) { toast('두 개까지만 골라요'); return; } tog(T.items, a); render(true); };
  A.gadd = function () { var v = (T.custom || '').trim(); if (!v) return; if (T.items.length >= 2) { toast('두 개까지만 골라요'); return; } T.items.push(v); T.custom = ''; render(true); };
  A.madd = function () { T.methods.push({ name: '', effort: 5, joy: 5 }); render(true); };
  A.mdel = function (a) { T.methods.splice(+a, 1); render(true); };
  A.gsave = function () {
    if (!T.items.length) { toast('목표를 하나 이상 골라주세요'); return; }
    S.goal = { items: T.items, why: T.why, methods: T.methods.filter(function (m) { return m.name.trim(); }), at: S.goal && S.goal.at || today() }; save();
    toast('목표를 홈에 띄워둘게요'); go('#/');
  };
  return { html: html, mount: function (el) {
    bindInputs({ gc: 'custom', gw: 'why' })(el);
    el.querySelectorAll('[data-mi]').forEach(function (i) { i.oninput = function () { T.methods[+i.getAttribute('data-mi')].name = i.value; }; });
    el.querySelectorAll('[data-me]').forEach(function (i) { i.oninput = function () { T.methods[+i.getAttribute('data-me')].effort = +i.value; i.previousElementSibling.textContent = i.value; }; });
    el.querySelectorAll('[data-mj]').forEach(function (i) { i.oninput = function () { T.methods[+i.getAttribute('data-mj')].joy = +i.value; i.previousElementSibling.textContent = i.value; }; });
  } };
}

/* ===================================================== Day 2 음식 이야기 */
function viewStory() {
  if (T.i == null) T.i = 0;
  var Q = P.storyQuestions, n = Q.length;
  var answered = Q.filter(function (q, k) { return (S.story[k] || '').trim(); }).length;
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">나의 음식 이야기 · ' + (T.i + 1) + '/' + n + '</span>');
  html += '<div class="progress">' + Q.map(function (q, k) { return '<i class="' + ((S.story[k] || '').trim() ? 'on' : '') + '" style="' + (k === T.i ? 'outline:2px solid var(--ink);outline-offset:1px' : '') + '"></i>'; }).join('') + '</div>';
  html += '<div class="stack-l" style="padding-top:20px"><span class="eyebrow">질문 ' + (T.i + 1) + '</span><h1 class="h-l">' + esc(Q[T.i]) + '</h1><p class="small muted">잘잘못을 따지지 말고, 떠오르는 대로. 건너뛰어도 괜찮아요.</p>' +
    '<textarea class="input" id="sa" style="min-height:200px" placeholder="여기에 적어요">' + esc(S.story[T.i] || '') + '</textarea><span class="xs muted">자동으로 저장돼요 · ' + answered + '개 답함</span></div>';
  html += '</main>' + foot('<div class="row"><button class="btn ghost" data-act="sp" style="width:96px;flex-shrink:0"' + (T.i ? '' : ' disabled') + '>이전</button><button class="btn primary" data-act="sn">' + (T.i === n - 1 ? '다 썼어요' : '다음 질문') + '</button></div>');
  A.sp = function () { T.i--; render(); };
  A.sn = function () { if (T.i === n - 1) { toast('이야기를 남겼어요. 언제든 더 써도 돼요'); go('#/'); } else { T.i++; render(); } };
  return { html: html, mount: function (el) { var t = el.querySelector('#sa'); t.oninput = function () { S.story[T.i] = t.value; save(); }; } };
}

/* ===================================================== Day 7 설문 */
function viewSurvey(which) {
  which = which === 'post' ? 'post' : (S.survey.pre && which !== 'pre' && currentDay() >= 21 ? 'post' : 'pre');
  if (!T.ans) T.ans = (S.survey[which] && S.survey[which].ans) ? S.survey[which].ans.slice() : [];
  var done = T.ans.filter(function (x) { return x; }).length;
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">마음챙김 식사 설문 · ' + (which === 'pre' ? '처음' : 'Day 21') + '</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">지금의 나를<br>재봐요</h1><p class="small muted">1 절대·극히 드물게 · 2 가끔 · 3 자주 · 4 대체로·항상<br>1–6번이 높고 7–10번이 낮아도 실망하지 마세요. 출발점일 뿐이에요.</p></div>';
  P.survey.forEach(function (q, k) {
    html += '<div class="stack" style="gap:6px"><span class="small"><b>' + (k + 1) + '.</b> ' + esc(q[0]) + '</span>' + seg([1, 2, 3, 4], null, T.ans[k], 'sv' + k) + '</div>';
  });
  if (which === 'post' && S.survey.pre) html += surveyCompare(S.survey.pre.ans, T.ans);
  html += '</main>' + foot('<button class="btn primary" data-act="ssave"' + (done === 10 ? '' : ' disabled') + '>' + (done === 10 ? '저장하기' : done + ' / 10') + '</button>');
  P.survey.forEach(function (q, k) { A['sv' + k] = function (a) { T.ans[k] = +a; render(true); }; });
  A.ssave = function () { S.survey[which] = { ans: T.ans, at: today() }; save(); toast(which === 'pre' ? 'Day 21에 다시 풀어서 비교해요' : '처음과 비교해봐요'); go(which === 'pre' ? '#/day/7' : '#/f/review'); };
  return { html: html };
}
function surveyScores(ans) {
  var a = 0, w = 0; P.survey.forEach(function (q, k) { if (q[1] === 'auto') a += ans[k] || 0; else w += ans[k] || 0; }); return { auto: a, aware: w };
}
function surveyCompare(pre, post) {
  var A1 = surveyScores(pre), B = surveyScores(post || []);
  return '<div class="card"><b class="small">처음과 비교</b><div class="grid2"><div class="stat"><span>자동으로 먹기 (6–24)</span><b>' + A1.auto + ' → ' + (post && post.length ? B.auto : '?') + '</b></div><div class="stat"><span>알아차리며 먹기 (4–16)</span><b>' + A1.aware + ' → ' + (post && post.length ? B.aware : '?') + '</b></div></div><span class="xs muted">자동으로 먹기는 낮아지고, 알아차리며 먹기는 높아지면 좋아요.</span></div>';
}

/* ===================================================== Day 12 돌아보기 */
function viewRetro() {
  var F = [['food', '무엇을 얼마나 먹었나요?', '예: 치킨 한 마리, 맥주 두 캔'], ['body', '몸은 어땠나요?', '예: 배가 터질 것 같았다'], ['after', '먹은 뒤 기분은?', ''], ['mind', '그때 어떤 생각과 감정이 있었나요?', ''], ['later', '20분 뒤에는 어땠나요?', ''], ['got', '여기서 나는 무엇을 얻었나요?', '판단 말고, 몸이 하는 말을']];
  var html = '<main class="screen has-foot fade">' + topbar(closeBtn('#/'), '<span class="sub">돌아보기 · 책 232쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">최근 절벽에서<br>떨어졌던 순간</h1><p class="small muted">뇌가 따지지 않게, 몸이 하는 말을 들어요.</p></div><div class="stack-l">';
  F.forEach(function (f) { html += '<label class="field">' + f[1] + (f[0] === 'food' || f[0] === 'got' ? '<input class="input" id="r_' + f[0] + '" placeholder="' + f[2] + '" value="' + esc(T[f[0]] || '') + '">' : '<textarea class="input" id="r_' + f[0] + '" style="min-height:70px" placeholder="' + f[2] + '">' + esc(T[f[0]] || '') + '</textarea>') + '</label>'; });
  html += '</div></main>' + foot('<button class="btn primary" data-act="save">정보은행에 쌓기</button>');
  A.save = function () { if (!(T.food || '').trim()) { toast('무엇을 먹었는지 적어주세요'); return; } var d = {}; F.forEach(function (f) { d[f[0]] = (T[f[0]] || '').trim(); }); addLog('retro', d); toast('돌아보기를 정보은행에 쌓았어요'); go('#/'); };
  var map = {}; F.forEach(function (f) { map['r_' + f[0]] = f[0]; });
  return { html: html, mount: bindInputs(map) };
}

/* ===================================================== Day 16 위원회 */
function viewCommittee() {
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">머릿속 위원회 · 책 284쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">내 머릿속 위원회</h1><p class="small muted">위원이 말할 때 “아, 이건 ○○네” 하고 알아차리면 눌러요. 이름만 붙여도 힘이 줄어요.</p></div>';
  html += S.committee.length ? S.committee.map(function (m) {
    return '<div class="card tight" style="' + (m.kind ? 'background:var(--kelp)' : '') + '"><div class="between"><b style="font-family:var(--serif);font-size:18px">' + esc(m.name) + '</b><span class="pill" style="' + (m.helpful ? '' : 'background:#F3E3DC;color:#9A4F36') + '">' + (m.helpful ? '유용함' : '해로움') + '</span></div>' +
      (m.says ? '<span class="small" style="color:var(--body)">“' + esc(m.says) + '”</span>' : '') +
      '<div class="between"><span class="xs muted">' + (m.count || 0) + '번 알아차림</span><div class="row"><button class="iconbtn" data-act="cdel" data-arg="' + m.id + '" aria-label="삭제" style="width:36px;height:36px;color:var(--mute)">' + I.trash + '</button><button class="btn primary small" data-act="cplus" data-arg="' + m.id + '" style="width:auto">들렸어요 +1</button></div></div></div>';
  }).join('') : '<div class="empty">아직 위원이 없어요. 조용히 숨을 고르고, 내면의 목소리에 귀 기울여봐요.</div>';
  html += '</main>' + foot('<button class="btn primary" data-act="cnew">+ 위원 추가</button><button class="linkbtn" data-act="ckind" style="font-weight:400">친절한 목소리 추가하기 (Day 19)</button>');
  A.cplus = function (a) { S.committee.forEach(function (m) { if (m.id === a) m.count = (m.count || 0) + 1; }); save(); render(true); };
  A.cdel = function (a) { if (!confirm('이 위원을 해고할까요?')) return; S.committee = S.committee.filter(function (m) { return m.id !== a; }); save(); render(true); };
  A.cnew = function () { memberSheet(false); };
  A.ckind = function () { memberSheet(true); };
  return { html: html };
}
function memberSheet(kind) {
  var st = { name: kind ? '친절한 목소리' : '', helpful: kind };
  function draw(el) {
    el.innerHTML = '<h2 class="h-m">' + (kind ? '친절한 목소리' : '새 위원') + '</h2>' + (kind ? '' : '<div class="wrap">' + P.committeeTypes.map(function (t) { return '<button class="chip' + (st.name === t ? ' on' : '') + '" data-n="' + t + '">' + t + '</button>'; }).join('') + '</div>') +
      '<label class="field">이름<input class="input" id="mn" value="' + esc(st.name) + '" placeholder="예: 완벽주의 감독관"></label>' +
      '<label class="field">자주 하는 말<input class="input" id="ms" placeholder="' + (kind ? '예: 난 지금 최선을 다하고 있어' : '예: 또 이랬어? 넌 안 돼') + '"></label>' +
      '<div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button data-h="0" class="' + (!st.helpful ? 'on' : '') + '">해로움</button><button data-h="1" class="' + (st.helpful ? 'on' : '') + '">유용함</button></div>' +
      '<button class="btn primary" id="mok">위원회에 추가</button>';
    el.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { st.name = b.getAttribute('data-n'); st.says = el.querySelector('#ms').value; draw(el); el.querySelector('#ms').value = st.says || ''; }; });
    el.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { st.helpful = b.getAttribute('data-h') === '1'; st.name = el.querySelector('#mn').value; st.says = el.querySelector('#ms').value; draw(el); el.querySelector('#ms').value = st.says || ''; }; });
    el.querySelector('#mok').onclick = function () {
      var name = el.querySelector('#mn').value.trim(); if (!name) { toast('이름을 붙여주세요'); return; }
      S.committee.push({ id: uid(), at: Date.now(), name: name, says: el.querySelector('#ms').value.trim(), helpful: st.helpful, kind: kind, count: 0 }); save(); closeSheet(); render(true);
    };
  }
  sheet('', draw);
}

/* ===================================================== Day 17 선택 */
function viewChoice() {
  var better = foodsFrom(['c1']).filter(function (f) { var c = logsOf('c1', function (l) { return l.food === f; }); return c.length > 1 && c[c.length - 1].total < c[0].total; });
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">Day 17 · 책 299쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">자발적인 선택의<br>힘을 돌아봐요</h1><p class="small muted">A보다 나은 B를 찾았다면, 이미 습관 회로 한두 개를 무너뜨린 거예요.</p></div>';
  if (better.length) html += '<div class="card kelp tight"><b class="small">내 기록에서 찾은 변화</b><span class="small">' + better.map(esc).join(', ') + '의 점수가 처음보다 내려갔어요. 뇌가 이미 다른 선택을 배우는 중이에요.</span></div>';
  html += '<label class="field">쉽게 바뀌었던 습관<input class="input" id="ce" value="' + esc(T.easy || '') + '" placeholder="예: 탄산 대신 탄산수"></label>' + seg(['내가 골랐어요', '떠밀렸어요'], null, T.ew, 'ew');
  html += '<label class="field">바꾸기 힘들었던 습관<input class="input" id="ch" value="' + esc(T.hard || '') + '" placeholder="예: 야식 끊기"></label>' + seg(['내가 골랐어요', '떠밀렸어요'], null, T.hw, 'hw');
  html += '<label class="field">알게 된 것<textarea class="input" id="cn">' + esc(T.note || '') + '</textarea></label>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  A.ew = function (a) { T.ew = a; render(true); };
  A.hw = function (a) { T.hw = a; render(true); };
  A.save = function () { addLog('choice', { easy: T.easy || '', easyWhy: T.ew || '', hard: T.hard || '', hardWhy: T.hw || '', note: T.note || '' }); toast('기록했어요'); go('#/'); };
  return { html: html, mount: bindInputs({ ce: 'easy', ch: 'hard', cn: 'note' }) };
}

/* ===================================================== Day 18 매혹 */
function viewEnchant() {
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/bank'), '<span class="sub">매혹 정보은행 · 책 310쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">더 즐기게 된 음식</h1><p class="small muted">마음챙김 식사로 먹고, 20분 뒤 기분을 홈에서 물어볼게요.</p></div>';
  html += '<label class="field">어떤 음식인가요?<input class="input" id="ef" value="' + esc(T.food || '') + '" placeholder="예: 구운 고구마"></label>';
  html += '<label class="field">먹는 동안 어땠나요?<textarea class="input" id="en" placeholder="예: 달고 따뜻한데 속이 편안했다">' + esc(T.note || '') + '</textarea></label>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">매혹 기록 남기기</button>');
  A.save = function () {
    if (!(T.food || '').trim()) { toast('음식을 적어주세요'); return; }
    var l = addLog('enchant', { food: T.food.trim(), note: (T.note || '').trim() });
    S.followups.push({ id: uid(), ref: l.id, kind: 'mood', due: Date.now() + 20 * 60000, text: '20분 지났어요. ' + l.food + ' 먹은 뒤 기분은 어때요?' });
    save(); toast('20분 뒤에 기분을 물어볼게요'); T = { tab: 'enc' }; location.hash = '#/bank';
  };
  return { html: html, mount: bindInputs({ ef: 'food', en: 'note' }) };
}

/* ===================================================== Day 19 오늘의 친절 */
function viewKind() {
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">오늘의 친절 · 책 333쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">오늘, 친절을<br>베풀었나요?</h1><p class="small muted">나에게 불친절한 습관을 발견하면 물어요: 여기서 무엇을 얻을 수 있을까?</p></div>';
  html += '<div class="stack">' + [['other', '남에게 한 번'], ['self', '나에게 한 번']].map(function (x) { return '<button class="task" data-act="kt" data-arg="' + x[0] + '" style="border:0;text-align:left">' + checkMark(T[x[0]] ? 'done' : 'idle') + '<span class="t">' + x[1] + '</span></button>'; }).join('') + '</div>';
  html += '<label class="field">어떤 친절이었나요? <span class="hint">선택</span><textarea class="input" id="kn">' + esc(T.note || '') + '</textarea></label>';
  html += '<a class="card tight" href="#/g/kindness" style="text-decoration:none;color:inherit"><b class="small">친절 연습 다시 하기</b><span class="xs muted">행복하길 · 건강하길 · 안전하길 · 기쁜 마음으로 자신을 배려하길</span></a>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">기록하기</button>');
  A.kt = function (a) { T[a] = !T[a]; render(true); };
  A.save = function () { if (!T.other && !T.self) { toast('하나라도 체크해요'); return; } addLog('kind', { other: !!T.other, self: !!T.self, note: (T.note || '').trim() }); toast('친절을 기록했어요'); go('#/'); };
  return { html: html, mount: bindInputs({ kn: 'note' }) };
}

/* ===================================================== Day 20 쌓은 경험 */
function viewEvidence() {
  var d = dayData(20); if (!d.seen) { d.seen = true; save(); }
  var st = evidenceStats(), min = Math.min.apply(null, st.map(function (s) { return s.n; }));
  var html = '<main class="screen fade">' + topbar(backBtn('#/'), '<span class="sub">Day 20 · 책 352쪽</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">신뢰할 만한 경험을<br>얼마나 쌓았나요?</h1><p class="small muted">부족한 곳은 되돌아가 천천히 다시 모으면 돼요. 며칠에서 몇 주까지.</p></div>';
  html += '<div class="stack">' + st.map(function (s) {
    return '<a class="record" href="' + s.href + '"><span class="score">' + s.n + '</span><span class="grow"><b class="small">' + s.label + '</b><br><span class="xs muted">' + (s.n === min ? '여기를 조금 더 모아볼까요? · ' : '') + 'Day ' + s.day + '</span></span><span style="width:18px;height:18px;display:flex;color:var(--sea);align-self:center">' + I.next + '</span></a>';
  }).join('') + '</div></main>';
  return { html: html + tabbar('') };
}

/* ===================================================== Day 21 전과 후 */
function viewReview() {
  var R = S.review || {};
  var Q = ['나에 대한 인식은 어떻게 달라졌나요?', '나를 비난하는 일이 줄었나요?', '고요한 순간이 늘었나요?', '갈망에 덜 사로잡히나요?', '몸은 어떻게 느껴지나요?'];
  var html = '<main class="screen has-foot fade">' + topbar(backBtn('#/'), '<span class="sub">Day 21 · 전과 후</span>');
  html += '<div class="stack" style="gap:6px"><h1 class="h-l">높은 곳에서<br>내려다봐요</h1><p class="small muted">“아직 시작일 뿐”이어도 괜찮아요. 어떤 훈련이든 돌아가 반복할 수 있어요.</p></div>';
  if (S.goal) {
    html += '<div class="card tight"><span class="xs muted">Day 1의 목표' + (S.goal.at ? ' · ' + fShort(S.goal.at) : '') + '</span><b>' + esc((S.goal.items || []).join(' · ')) + '</b>' + (S.goal.why ? '<span class="small" style="color:var(--body)">' + nl(S.goal.why) + '</span>' : '') +
      ((S.goal.methods || []).length ? '<div class="hr"></div><span class="xs muted">예전에 시도한 방법 (노력 / 즐거움)</span>' + S.goal.methods.map(function (m) { return '<span class="small">' + esc(m.name) + ' · ' + m.effort + ' / ' + m.joy + '</span>'; }).join('') : '') + '</div>';
  }
  var firstStory = P.storyQuestions.map(function (q, k) { return S.story[k] ? [q, S.story[k]] : null; }).filter(Boolean)[0];
  if (firstStory) html += '<div class="card tight"><span class="xs muted">Day 2의 나 · ' + esc(firstStory[0]) + '</span><span class="small">' + nl(firstStory[1]) + '</span></div>';
  if (S.survey.pre) html += surveyCompare(S.survey.pre.ans, S.survey.post && S.survey.post.ans) + (S.survey.post ? '' : '<a class="btn soft small" href="#/f/survey/post">설문 다시 풀기</a>');
  html += '<div class="grid3">' + evidenceStats().slice(0, 6).map(function (s) { return '<div class="stat"><b>' + s.n + '</b><span>' + s.label + '</span></div>'; }).join('') + '</div>';
  html += '<div class="stack-l">' + Q.map(function (q, k) { return '<label class="field">' + q + '<textarea class="input" data-rq="' + k + '" style="min-height:70px">' + esc(R[k] || '') + '</textarea></label>'; }).join('') + '</div>';
  html += '</main>' + foot('<button class="btn primary" data-act="save">돌아보기 저장</button>');
  A.save = function () { addLog('review', { answers: S.review }); toast('21일을 돌아봤어요. 정말 수고했어요'); go('#/'); };
  return { html: html, mount: function (el) { el.querySelectorAll('[data-rq]').forEach(function (t) { t.oninput = function () { S.review = S.review || {}; S.review[t.getAttribute('data-rq')] = t.value; save(); }; }); } };
}

/* ===================================================== 설정 */
function viewSettings() {
  var html = '<main class="screen plain fade">' + topbar(backBtn('#/'), '설정');
  html += '<div class="card"><b>백업</b><p class="small muted">기록은 이 폰 안에만 저장돼요. 가끔 파일로 내보내 두면 폰을 바꿔도 이어갈 수 있어요.' + (S.lastBackup ? '<br>마지막 백업: ' + fShort(S.lastBackup) : '') + '</p>' +
    '<button class="btn primary" data-act="export">백업 파일 내보내기</button><label class="btn ghost" style="cursor:pointer">백업 불러오기<input type="file" accept="application/json,.json" id="imp" style="display:none"></label></div>';
  html += '<div class="card"><b>알림</b><p class="small muted">홈 화면 앱은 혼자서 정해진 시각에 알림을 보내기 어려워요. 아이폰 <b>미리 알림</b>이나 <b>시계</b> 앱에 매일 같은 시각 “파도 열기”를 반복으로 만들어두면 가장 확실해요.</p></div>';
  html += '<div class="card"><b>이 앱에 대해</b><p class="small muted">저드슨 브루어, 『식탐 해방』(푸른숲)의 21일 챌린지를 따라 하기 위한 개인용 앱이에요. 앱 안의 안내는 책을 짧게 요약한 것이니, 자세한 내용은 책의 해당 쪽을 함께 봐주세요.</p></div>';
  html += '<button class="linkbtn" data-act="reset" style="color:#9A4F36;font-weight:400">모든 기록 지우기</button></main>';
  A.export = function () {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    var name = 'pado-backup-' + today() + '.json';
    var file = null; try { file = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: '파도 백업' }).then(function () { S.lastBackup = today(); save(); render(true); }).catch(function () {});
    } else {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      S.lastBackup = today(); save(); render(true);
    }
  };
  A.reset = function () { if (confirm('정말 모든 기록을 지울까요? 되돌릴 수 없어요.') && confirm('한 번 더 확인할게요. 지울까요?')) { localStorage.removeItem(KEY); S = fresh(); save(); go('#/'); } };
  return { html: html, mount: function (el) {
    el.querySelector('#imp').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () {
        try { var d = JSON.parse(r.result); if (!d || !d.days || !d.logs) throw 0; if (!confirm('지금 기록을 백업 파일 내용으로 바꿀까요?')) return; S = Object.assign(fresh(), d); save(); toast('백업을 불러왔어요'); go('#/'); }
        catch (x) { toast('파도 백업 파일이 아니에요'); }
      }; r.readAsText(f);
    };
  } };
}

/* ===================================================== 라우터 */
function parse() {
  var h = location.hash || '#/';
  var qi = h.indexOf('?'), q = {};
  if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
  return { parts: h.replace(/^#\/?/, '').split('/'), q: q, key: h };
}
function render(keep) {
  autoComplete();
  var r = parse(), p = r.parts, v;
  if (r.key !== lastRoute) { T = (T.tab || T.food) && (p[0] === 'bank') ? { tab: T.tab, food: T.food } : {}; A = {}; stopSpeak(); }
  var routeChanged = r.key !== lastRoute; lastRoute = r.key;
  var y = window.scrollY;
  switch (p[0]) {
    case '': v = viewHome(); break;
    case 'day': v = viewDay(p[1]); break;
    case 'journey': v = viewJourney(); break;
    case 'bank': v = viewBank(); break;
    case 'tools': v = viewTools(); break;
    case 'settings': v = viewSettings(); break;
    case 't':
      v = ({ hunger: viewHunger, loop: viewLoop, signal: viewSignal, checkin: viewCheckin, c1: viewC1, c2: viewC2, rain: viewRain, noting: viewNoting, plateau: viewPlateau }[p[1]] || viewTools)(r.q); break;
    case 'g': v = viewGuide(p[1]); break;
    case 'f':
      v = ({ goal: viewGoal, story: viewStory, survey: function () { return viewSurvey(p[2]); }, retro: viewRetro, committee: viewCommittee, choice: viewChoice, enchant: viewEnchant, kind: viewKind, evidence: viewEvidence, review: viewReview }[p[1]] || viewTools)(); break;
    default: v = viewHome();
  }
  app.innerHTML = v.html;
  if (!keep || routeChanged) {
    app.querySelectorAll('.fade').forEach(function (e) { e.classList.add('fade'); });
    window.scrollTo(0, 0);
  } else {
    app.querySelectorAll('.fade').forEach(function (e) { e.classList.remove('fade'); });
    window.scrollTo(0, y);
  }
  if (v.mount) v.mount(app);
}
app.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]'); if (!el) return;
  var fn = A[el.getAttribute('data-act')]; if (!fn) return;
  if (el.tagName !== 'A') e.preventDefault();
  fn(el.getAttribute('data-arg'), el);
});
window.addEventListener('hashchange', function () { closeSheet(); render(); });
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    if (S.lastOpen !== today()) { GAP = diffDays(S.lastOpen, today()); S.lastOpen = today(); save(); }
    if (parse().parts[0] === '') render(true);
  }
});
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(function () {});
}
})();
