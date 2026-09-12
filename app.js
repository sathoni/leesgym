/* De Leesgym — werking. Alles blijft op deze telefoon. */
(function () {
"use strict";

/* ============================================================ helpers */
var KEY = "leesgym:v1";
var DAY = 86400000;
var $ = function (s) { return document.querySelector(s); };

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function clamp(n, a, b) { return n < a ? a : n > b ? b : n; }
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function dk(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function parseD(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function daysBetween(a, b) { return Math.round((b - a) / DAY); }
/* dagen optellen via de kalender, niet via milliseconden — anders schuift alles
   een dag op zodra het zomeruur verandert (eind oktober, eind maart) */
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

var NL_DAY = ["zo", "ma", "di", "wo", "do", "vr", "za"];
var NL_MON = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fShort(d) { return d.getDate() + " " + NL_MON[d.getMonth()]; }
function fFull(d) { return NL_DAY[d.getDay()] + " " + d.getDate() + " " + NL_MON[d.getMonth()]; }
function monthLabel(dueStr) {
  var d = parseD(dueStr);
  return NL_MON[d.getMonth()].toUpperCase() + " '" + String(d.getFullYear()).slice(2);
}
function fMin(m) {
  if (m < 60) return m + " min";
  var h = Math.floor(m / 60), r = m % 60;
  return r ? h + " u " + r : h + " u";
}

/* ============================================================ state */
var S = null, UI = { screen: null, filter: "alle", cat: 0, draft: null };
var memOnly = false;

function blank() {
  return { v: 1, tab: "today", cur: null, books: {}, custom: [], sessions: [], weeks: {}, timer: null };
}
function load() {
  try {
    var raw = localStorage.getItem(KEY);
    S = raw ? JSON.parse(raw) : blank();
  } catch (e) { S = blank(); memOnly = true; }
  var d = blank();
  for (var k in d) if (S[k] === undefined) S[k] = d[k];
  if (!S.books) S.books = {};
  if (!Array.isArray(S.custom)) S.custom = [];
  if (!Array.isArray(S.sessions)) S.sessions = [];
  /* een timer die blijft lopen omdat de app dichtging, na vier uur weggooien:
     anders staat er morgen "een sessie van 14 uur" klaar om op te slaan */
  if (S.timer && S.timer.running && Date.now() - S.timer.at > 4 * 3600 * 1000) S.timer = null;
}
function save() {
  if (memOnly) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast("Opslaan lukte niet — geheugen vol. Verwijder een boekfoto."); }
}

/* ============================================================ books */
function allBooks() { return BOOKS.concat(S.custom); }
function byId(id) {
  var a = allBooks();
  for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
  return null;
}
function scheduled() {
  var out = BOOKS.slice();
  for (var i = 0; i < S.custom.length; i++)
    if (S.custom[i].list !== "waitlist" && dueOf(S.custom[i])) out.push(S.custom[i]);
  out.sort(function (x, y) { return parseD(dueOf(x)) - parseD(dueOf(y)); });
  return out;
}
function st(id) {
  if (!S.books[id]) S.books[id] = { cur: 0, pages: null, done: false, doneAt: null, rating: 0, ans: {}, photo: null };
  var s = S.books[id];
  if (!s.ans) s.ans = {};
  return s;
}
function dueOf(b) { return st(b.id).due || b.due; }
function pagesOf(b) { return st(b.id).pages || b.p; }
function pctOf(b) {
  var p = pagesOf(b); if (!p) return 0;
  return clamp(Math.round((st(b.id).cur / p) * 100), 0, 100);
}
/* Een boek begint pas de dag na de deadline van het vorige boek.
   Zonder dit zou "pagina's per dag" van een boek uit november al vanaf vandaag
   tellen, en dus veel te laag uitkomen. */
function windowStart(b) {
  var sch = scheduled(), prev = null, i;
  for (i = 0; i < sch.length; i++) { if (sch[i].id === b.id) break; prev = sch[i]; }
  var s = prev && dueOf(prev) ? addDays(parseD(dueOf(prev)), 1) : parseD(START);
  if (s < parseD(START)) s = parseD(START);
  /* ben je er al in bezig, of is het het boek dat je nu leest, dan staat het
     venster hoe dan ook open — ook als er een boek voor geschoven is */
  if (st(b.id).cur > 0 || S.cur === b.id) { var t = today(); if (s > t) s = t; }
  return s;
}
/* de eerstvolgende vrije deadline: dertig dagen na het laatste geplande boek */
function nextDue() {
  var sch = scheduled(), base = today();
  if (sch.length) {
    var lastDue = parseD(dueOf(sch[sch.length - 1]));
    if (lastDue > base) base = lastDue;
  }
  return dk(addDays(base, 30));
}
function started(b) { return windowStart(b) <= today(); }
function effStart(b) { var w = windowStart(b), t = today(); return w > t ? w : t; }
function daysLeft(b) {
  var d = dueOf(b); if (!d) return 30;
  return Math.max(1, daysBetween(effStart(b), parseD(d)) + 1);
}
function perDay(b) {
  var s = st(b.id); if (s.done) return 0;
  return Math.max(1, Math.ceil(Math.max(0, pagesOf(b) - s.cur) / daysLeft(b)));
}
function currentBook() {
  var sch = scheduled(), i;
  if (S.cur) for (i = 0; i < sch.length; i++) if (sch[i].id === S.cur && !st(sch[i].id).done) return sch[i];
  for (i = 0; i < sch.length; i++) if (!st(sch[i].id).done) return sch[i];
  return null;
}

/* ============================================================ training */
function dayIndex(d) { return daysBetween(parseD(START), d || today()); }
function phaseAt(idx) {
  if (idx < 0) idx = 0;
  for (var i = 0; i < PHASES.length; i++) if (idx >= PHASES[i].from && idx <= PHASES[i].to) return PHASES[i];
  return PHASES[PHASES.length - 1];
}
function phaseIndexAt(idx) {
  if (idx < 0) idx = 0;
  for (var i = 0; i < PHASES.length; i++) if (idx >= PHASES[i].from && idx <= PHASES[i].to) return i;
  return PHASES.length - 1;
}
function targetFor(dateKey) { return phaseAt(dayIndex(parseD(dateKey))).min; }
function minutesOn(dateKey) {
  var t = 0;
  for (var i = 0; i < S.sessions.length; i++) if (S.sessions[i].d === dateKey) t += S.sessions[i].min;
  return t;
}
function dayDone(dateKey) { return minutesOn(dateKey) >= targetFor(dateKey); }
function streak() {
  var d = today();
  if (!dayDone(dk(d))) d = addDays(d, -1);
  var n = 0;
  while (dayDone(dk(d))) { n++; d = addDays(d, -1); }
  return n;
}
function stats() {
  var min = 0, pg = 0, best = 0, days = {}, i;
  for (i = 0; i < S.sessions.length; i++) {
    var s = S.sessions[i];
    min += s.min; pg += s.pages || 0;
    if (s.min > best) best = s.min;
    days[s.d] = true;
  }
  var keys = [], k;
  for (k in days) if (dayDone(k)) keys.push(k);
  keys.sort();
  var run = 0, top = 0;
  for (i = 0; i < keys.length; i++) {
    if (i > 0 && daysBetween(parseD(keys[i - 1]), parseD(keys[i])) === 1) run++; else run = 1;
    if (run > top) top = run;
  }
  return { min: min, pages: pg, best: best, top: top, days: keys.length };
}

/* ============================================================ icons */
function ico(name, size) {
  var s = size || 23;
  var p = {
    open: '<path d="M12 6.6S9.6 4.6 4.2 4.6v12.9c5.4 0 7.8 2 7.8 2s2.4-2 7.8-2V4.6c-5.4 0-7.8 2-7.8 2z"/><path d="M12 6.6v12.9"/>',
    lib: '<rect x="3.6" y="4.2" width="4.2" height="15.6" rx="1.2"/><rect x="9.9" y="4.2" width="4.2" height="15.6" rx="1.2"/><path d="M17.3 5.2l3.1 14.1"/>',
    dumb: '<path d="M6.6 7.2v9.6M17.4 7.2v9.6M3.4 9.8v4.4M20.6 9.8v4.4M6.6 12h10.8"/>',
    check: '<circle cx="12" cy="12" r="8.6"/><path d="M8.3 12.3l2.5 2.5 4.9-5.1"/>',
    tick: '<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    cam: '<path d="M3.5 8.5h3.2l1.5-2.2h7.6l1.5 2.2h3.2v10.2H3.5z"/><circle cx="12" cy="13.2" r="3.3"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 5.5h-10a2 2 0 0 0-2 2v10"/>'
  }[name];
  return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
}

/* ============================================================ covers */
function cover(b, w, cls) {
  var s = st(b.id), a = b.art || ART_POOL[0];
  var base = "cover c-" + a.s + (cls ? " " + cls : "");
  if (s.photo) {
    return '<div class="' + base + ' photo" style="--w:' + w + ';background-image:url(' + s.photo + ')"></div>';
  }
  var style = "--w:" + w + ";--cbg:" + a.bg + ";--cfg:" + a.fg + ";--cac:" + a.ac + ";";
  var band = a.s === "band" ? '<div class="cv-band"></div>' : "";
  var rule = '<div class="cv-r"></div>';
  return '<div class="' + base + '" style="' + style + '">' + band +
    '<div class="cv"><div class="cv-t">' + esc(b.t) + "</div>" + rule +
    '<div class="cv-a">' + esc(b.a || "") + "</div></div></div>";
}

/* ============================================================ toast */
var toastT = null;
function toast(msg) {
  var el = $("#toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(function () { el.classList.remove("on"); }, 2300);
}

/* ============================================================ sheet */
var sheetOpen = false;
function openSheet(html) {
  var sh = $("#sheet"), sc = $("#scrim");
  sh.innerHTML = '<div class="grab"></div>' + html;
  sc.classList.remove("hide");
  requestAnimationFrame(function () { sc.classList.add("on"); sh.classList.add("on"); });
  sheetOpen = true;
}
function closeSheet() {
  if (!sheetOpen) return;
  var sh = $("#sheet"), sc = $("#scrim");
  sh.classList.remove("on"); sc.classList.remove("on");
  sheetOpen = false;
  setTimeout(function () { if (!sheetOpen) { sc.classList.add("hide"); sh.innerHTML = ""; } }, 260);
}

/* ============================================================ timer */
var tick = null, wake = null;

function elapsed() {
  if (!S.timer) return 0;
  var e = S.timer.base;
  if (S.timer.running) e += (Date.now() - S.timer.at) / 1000;
  return Math.floor(e);
}
function clockStr(sec) {
  if (sec >= 3600) return Math.floor(sec / 3600) + ":" + pad2(Math.floor(sec / 60) % 60) + ":" + pad2(sec % 60);
  return pad2(Math.floor(sec / 60)) + ":" + pad2(sec % 60);
}

function startTimer() {
  S.timer = { running: true, at: Date.now(), base: S.timer ? S.timer.base : 0 };
  save(); runTick(); paintTimer(); lockScreen();
}
function pauseTimer() {
  if (!S.timer || !S.timer.running) return;
  S.timer = { running: false, at: 0, base: elapsed() };
  save(); stopTick(); paintTimer(); releaseScreen();
}
function clearTimer() { S.timer = null; save(); stopTick(); releaseScreen(); }
function runTick() { stopTick(); tick = setInterval(paintTimer, 1000); }
function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

function lockScreen() {
  try {
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request("screen").then(function (w) { wake = w; }, function () {});
    }
  } catch (e) {}
}
function releaseScreen() { try { if (wake) { wake.release(); wake = null; } } catch (e) {} }

function paintTimer() {
  var n = $("#tclock"); if (!n) return;
  var sec = elapsed(), goal = phaseAt(dayIndex()).min * 60;
  n.textContent = clockStr(sec);
  var ring = $("#tring");
  if (ring) {
    var C = 590.62;
    ring.setAttribute("stroke-dashoffset", String(C - C * clamp(sec / goal, 0, 1)));
  }
  var lab = $("#tlabel");
  if (lab) lab.textContent = sec >= goal ? "doel gehaald" : "doel " + Math.round(goal / 60) + " min";
}

function finishSession() {
  var sec = elapsed();
  if (sec < 60) {
    openSheet(
      '<h2 class="h2">Korter dan een minuut</h2>' +
      '<p class="sub">Die sessie is te kort om te bewaren. Weggooien?</p>' +
      '<div class="btnrow"><button class="btn ghost" data-a="x">Terug</button>' +
      '<button class="btn" data-a="drop">Weggooien</button></div>'
    );
    return;
  }
  pauseTimer();
  render(true);
  var b = currentBook();
  var mins = Math.max(1, Math.round(sec / 60));
  if (!b) {
    openSheet('<h2 class="h2">' + mins + ' minuten gelezen</h2>' +
      '<p class="sub">Je hebt geen boek meer openstaan, dus er valt geen pagina te noteren.</p>' +
      '<div class="btnrow"><button class="btn" data-a="drop">Klaar</button></div>');
    return;
  }
  var s = st(b.id), tot = pagesOf(b);
  openSheet(
    '<h2 class="h2">' + mins + " minuten gelezen</h2>" +
    '<p class="sub">' + esc(b.t) + " — waar sta je nu?</p>" +
    '<div style="margin-top:18px"><label class="label">Op welke pagina ben je gestopt?</label>' +
    '<div class="pg"><input class="field" id="endpg" type="number" inputmode="numeric" pattern="[0-9]*" ' +
    'value="' + s.cur + '" min="0" max="' + tot + '"><span>van ' + tot + "</span></div></div>" +
    '<p class="tiny" style="margin-top:10px">Je stond op pagina ' + s.cur + " toen je begon.</p>" +
    '<div class="btnrow"><button class="btn ghost" data-a="x">Later</button>' +
    '<button class="btn" data-a="savesess" data-id="' + b.id + '" data-min="' + mins + '">Opslaan</button></div>'
  );
  setTimeout(function () { var f = $("#endpg"); if (f) { f.focus(); f.select(); } }, 320);
}

function saveSession(id, mins) {
  var b = byId(id); if (!b) { closeSheet(); return; }
  var s = st(id), tot = pagesOf(b);
  var f = $("#endpg");
  var end = f ? clamp(parseInt(f.value, 10) || s.cur, 0, tot) : s.cur;
  var read = Math.max(0, end - s.cur);
  s.cur = end;
  S.sessions.push({ d: dk(today()), min: mins, pages: read, b: id, at: Date.now() });
  if (end >= tot && !s.done) { markDone(id, true); }
  clearTimer();
  save(); closeSheet(); render();
  var goal = phaseAt(dayIndex()).min;
  var m = minutesOn(dk(today()));
  toast(m >= goal ? "Dag afgevinkt — " + fMin(m) + " gelezen" : fMin(m) + " vandaag, nog " + fMin(goal - m));
}

function markDone(id, silent) {
  var s = st(id);
  s.done = true;
  s.doneAt = dk(today());
  var b = byId(id);
  if (b) s.cur = pagesOf(b);
  if (S.cur === id) S.cur = null;
  if (!silent) { save(); }
}

/* ============================================================ render */
function render(keepScroll) {
  var el = $("#app");
  var sc = UI.screen;
  if (sc && sc.t === "book") el.innerHTML = viewBook(sc.id);
  else if (sc && sc.t === "debrief") el.innerHTML = viewDebrief(sc.id);
  else if (S.tab === "today") el.innerHTML = viewToday();
  else if (S.tab === "books") el.innerHTML = viewBooks();
  else if (S.tab === "training") el.innerHTML = viewTraining();
  else el.innerHTML = viewDone();
  renderTabs();
  if (S.timer && S.timer.running) runTick(); else stopTick();
  paintTimer();
  if (!keepScroll) window.scrollTo(0, 0);
}

function renderTabs() {
  var tabs = [["today", "Vandaag", "open"], ["books", "Boeken", "lib"], ["training", "Training", "dumb"], ["done", "Uit", "check"]];
  var h = '<div class="tabbar-in">';
  for (var i = 0; i < tabs.length; i++) {
    var on = !UI.screen && S.tab === tabs[i][0];
    h += '<button class="tab' + (on ? " on" : "") + '" data-a="tab" data-t="' + tabs[i][0] + '">' +
      ico(tabs[i][2]) + "<span>" + tabs[i][1] + "</span></button>";
  }
  $("#tabbar").innerHTML = h + "</div>";
}

/* ---------------------------------------------------- VANDAAG */
function viewToday() {
  var d = today(), idx = dayIndex(), ph = phaseAt(idx), b = currentBook();
  var str = streak(), mins = minutesOn(dk(d)), goal = ph.min;
  var head = idx < 0
    ? "start " + fFull(parseD(START))
    : "dag " + (idx + 1) + " · " + fFull(d);

  var h = '<div class="screen"><div class="head"><div>' +
    '<div class="eyebrow">' + esc(head) + "</div>" +
    '<h1 class="h1">Vandaag</h1></div>' +
    (str > 0 ? '<span class="badge b-gold" style="margin-top:6px">' + str + " dag" + (str === 1 ? "" : "en") + " op rij</span>" : "") +
    "</div>";

  if (idx < 0) {
    h += '<div class="note" style="margin-top:16px"><div class="h3">Je begint ' +
      (idx === -1 ? "morgen" : "over " + (-idx) + " dagen") + "</div>" +
      '<p class="small" style="margin-top:4px">Leg je boek klaar op de plek waar je gaat lezen. Dat is vanaf nu de vaste plek.</p></div>';
  }

  /* huidige boek */
  if (b) {
    var s = st(b.id), tot = pagesOf(b), pct = pctOf(b), pd = perDay(b);
    var readToday = 0;
    for (var i = 0; i < S.sessions.length; i++)
      if (S.sessions[i].d === dk(d) && S.sessions[i].b === b.id) readToday += S.sessions[i].pages || 0;
    var todo = Math.max(0, pd - readToday);
    h += '<button class="card pad" style="margin-top:18px;display:flex;gap:15px;width:100%;text-align:left" ' +
      'data-a="book" data-id="' + b.id + '">' + cover(b, "62px") +
      '<div class="item-b"><div class="item-t">' + esc(b.t) + "</div>" +
      '<div class="item-a">' + esc(b.a) + "</div>" +
      '<div class="pctline"><div class="bar"><i style="width:' + pct + '%"></i></div><b>' + pct + "%</b></div>" +
      '<div class="meta"><span>op p. ' + s.cur + " van " + tot + "</span></div></div></button>";
    h += '<p class="small" style="margin:12px 2px 0">' +
      (s.done ? "Dit boek is uit." :
        !started(b) ? "Dit boek staat gepland vanaf " + esc(fShort(windowStart(b))) + ". Begin gerust vroeger — " + pd + " pagina’s per dag is het tempo." :
        todo > 0 ? "<b style=\"color:var(--ink)\">Nog " + todo + " pagina" + (todo === 1 ? "" : "’s") + " vandaag</b> om op schema te blijven."
          : "Je pagina’s van vandaag zijn binnen. Alles wat je nu leest is voorsprong.") +
      "</p>";
  } else {
    h += '<div class="card pad tc" style="margin-top:18px"><div class="h2">Alle boeken uit</div>' +
      '<p class="sub">Tien boeken van september 2026 tot juli 2027. Je wachtlijst staat klaar bij Boeken.</p></div>';
  }

  /* timer */
  var sec = elapsed(), C = 590.62, off = C - C * clamp(sec / (goal * 60), 0, 1);
  h += '<div class="card timer" style="margin-top:18px">' +
    '<div class="ring"><svg width="212" height="212" viewBox="0 0 212 212">' +
    '<circle cx="106" cy="106" r="94" fill="none" stroke="#EEECE5" stroke-width="11"/>' +
    '<circle id="tring" cx="106" cy="106" r="94" fill="none" stroke="#1E6F52" stroke-width="11" ' +
    'stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off + '" ' +
    'style="transition:stroke-dashoffset .9s linear"/></svg>' +
    '<div class="ring-c"><div class="ring-n" id="tclock">' + clockStr(sec) + "</div>" +
    '<div class="ring-l" id="tlabel">doel ' + goal + " min</div>" +
    '<div class="ring-d">' + esc(ph.w) + " · " + esc(ph.label) + "</div></div></div>";

  if (!S.timer) {
    h += '<button class="btn" style="margin-top:20px" data-a="tstart">' + ico("play", 17) + " Start met lezen</button>";
  } else if (S.timer.running) {
    h += '<div class="btnrow" style="width:100%;margin-top:20px">' +
      '<button class="btn ghost" data-a="tpause">' + ico("pause", 17) + " Pauze</button>" +
      '<button class="btn" data-a="tstop">Klaar</button></div>';
  } else {
    h += '<div class="btnrow" style="width:100%;margin-top:20px">' +
      '<button class="btn ghost" data-a="tstart">' + ico("play", 17) + " Verder</button>" +
      '<button class="btn" data-a="tstop">Klaar</button></div>';
  }
  h += "</div>";

  /* vandaag gelezen */
  h += '<div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding:0 2px">' +
    '<span id="tdone" class="' + (mins >= goal ? "badge b-green" : "badge b-grey") + '">' +
    (mins >= goal ? "Dag gehaald" : "Vandaag " + fMin(mins)) + "</span>" +
    '<span class="tiny">doel van deze week: ' + fMin(goal) + "</span></div>";

  /* zin van de week */
  h += '<div class="note" style="margin-top:18px"><div class="eyebrow">' + esc(ph.w) + "</div>" +
    '<p class="body" style="margin-top:6px">' + esc(ph.note) + "</p></div>";

  /* logboek */
  var last = S.sessions.slice(-5).reverse();
  h += '<div class="sec"><div class="sec-t"><h2 class="h2">Je logboek</h2>' +
    '<span class="tiny">' + S.sessions.length + " sessie" + (S.sessions.length === 1 ? "" : "s") + "</span></div>";
  if (!last.length) {
    h += '<div class="card pad"><p class="small">Nog niets. Na je eerste sessie met de timer staat hier je geschiedenis: datum, minuten en pagina’s.</p></div>';
  } else {
    h += '<div class="card pad"><div class="rowlist">';
    for (var j = 0; j < last.length; j++) {
      var ss = last[j], bb = byId(ss.b);
      h += '<div class="item" style="padding:11px 0;gap:10px"><div class="item-b">' +
        '<div class="item-t" style="font-size:14px">' + esc(fFull(parseD(ss.d))) + "</div>" +
        '<div class="item-a">' + (bb ? esc(bb.t) : "boek verwijderd") + "</div></div>" +
        '<div style="text-align:right"><div class="num" style="font-weight:650;font-size:14px">' + fMin(ss.min) + "</div>" +
        '<div class="tiny num">' + (ss.pages || 0) + " p.</div></div></div>";
    }
    h += "</div></div>";
  }
  h += "</div></div>";
  return h;
}

/* ---------------------------------------------------- BOEKEN */
function viewBooks() {
  var f = UI.filter;
  var h = '<div class="screen"><div class="head"><div>' +
    '<h1 class="h1">Mijn boeken</h1>' +
    '<p class="sub">Tien boeken, september 2026 tot juli 2027.</p></div>' +
    '<button class="fab" data-a="add" aria-label="Boek toevoegen">' + ico("plus", 19) + "</button></div>";

  var fs = [["alle", "Alle"], ["bezig", "Bezig"], ["lezen", "Te lezen"], ["uit", "Uit"], ["wacht", "Wachtlijst"]];
  h += '<div class="chips">';
  for (var i = 0; i < fs.length; i++)
    h += '<button class="chip' + (f === fs[i][0] ? " on" : "") + '" data-a="filter" data-f="' + fs[i][0] + '">' + fs[i][1] + "</button>";
  h += "</div>";

  if (f === "wacht") return h + viewWaitlist() + "</div>";

  var list = scheduled().filter(function (b) {
    var s = st(b.id);
    if (f === "bezig") return !s.done && s.cur > 0;
    if (f === "lezen") return !s.done && !s.cur;
    if (f === "uit") return s.done;
    return true;
  });

  if (!list.length) {
    h += '<div class="empty"><div class="h2">Niets hier</div><p class="small">Onder deze filter staat voorlopig geen enkel boek.</p></div>';
    return h + "</div>";
  }

  h += '<div class="card pad" style="margin-top:16px"><div class="rowlist">';
  for (var k = 0; k < list.length; k++) h += bookRow(list[k]);
  h += "</div></div></div>";
  return h;
}

function bookRow(b) {
  var s = st(b.id), pct = pctOf(b), tot = pagesOf(b), cur = currentBook();
  var h = '<button class="item" data-a="book" data-id="' + esc(b.id) + '">' + cover(b, "54px") +
    '<div class="item-b"><div class="item-t">' + esc(b.t) + "</div>" +
    '<div class="item-a">' + esc(b.a || "—") + "</div>";
  if (s.done) {
    h += '<div class="meta" style="margin-top:8px"><span class="badge b-green">Uit</span>' +
      (s.doneAt ? "<span>" + esc(fShort(parseD(s.doneAt))) + "</span>" : "") +
      (s.rating ? '<span style="color:var(--gold)">' + "★".repeat(s.rating) + "</span>" : "") + "</div>";
  } else {
    h += '<div class="pctline"><div class="bar"><i style="width:' + pct + '%"></i></div><b>' + pct + "%</b></div>";
    h += '<div class="meta"><span class="badge b-grey">' + esc(b.m || "Eigen") + "</span>" +
      "<span>" + tot + " pagina’s</span>" +
      (b.buy ? '<span class="badge b-gold">Nog te kopen</span>' : "") +
      (cur && cur.id === b.id ? '<span class="badge b-green">Lees ik nu</span>' : "") + "</div>";
  }
  return h + "</div></button>";
}

function viewWaitlist() {
  var mine = S.custom.filter(function (b) { return b.list === "waitlist"; });
  var cats = FUTURE.slice();
  if (mine.length) cats = [{ cat: "Zelf toegevoegd", mine: true, items: mine }].concat(cats);
  var c = clamp(UI.cat, 0, cats.length - 1);
  var h = '<p class="sub" style="margin-top:14px">Wat er na juli 2027 aankomt, wat doorgeschoven is, en wat je beter niet koopt.</p>';
  h += '<div class="chips">';
  for (var i = 0; i < cats.length; i++)
    h += '<button class="chip' + (c === i ? " on" : "") + '" data-a="cat" data-i="' + i + '">' + esc(cats[i].cat) + "</button>";
  h += "</div>";
  var items = cats[c].items;
  h += '<div style="margin-top:16px">';
  for (var j = 0; j < items.length; j++) {
    var it = items[j];
    if (cats[c].mine) {
      h += '<button class="card pad" style="width:100%;text-align:left;margin-bottom:10px;display:flex;gap:14px" ' +
        'data-a="book" data-id="' + esc(it.id) + '">' + cover(it, "44px") +
        '<div class="item-b"><span class="badge b-green">Eigen</span>' +
        '<div class="item-t" style="margin-top:6px">' + esc(it.t) + "</div>" +
        '<div class="item-a">' + esc(it.a || "—") + " · " + it.p + " pagina’s</div></div></button>";
    } else {
      var v = VERDICT[it.v] || VERDICT.later;
      h += '<div class="card pad" style="margin-bottom:10px">' +
        '<span class="badge ' + v.cls + '">' + v.label + "</span>" +
        '<div class="h3" style="margin-top:8px">' + esc(it.t) + "</div>" +
        '<div class="item-a">' + esc(it.a) + "</div>" +
        '<p class="body" style="margin-top:8px">' + esc(it.w) + "</p></div>";
    }
  }
  h += "</div>";
  h += '<div class="note" style="margin-top:18px"><div class="h3">Elke dag vijftien minuten krant</div>' +
    '<p class="body" style="margin-top:5px">De Tijd, De Standaard of The Economist. Dat doet meer voor je woordenschat en je gespreksvermogen dan welk zelfhulpboek ook — en het is korter dan een hoofdstuk.</p></div>';
  return h;
}

/* ---------------------------------------------------- BOEK DETAIL */
function viewBook(id) {
  var b = byId(id);
  if (!b) { UI.screen = null; return viewBooks(); }
  var s = st(id), tot = pagesOf(b), pct = pctOf(b), cur = currentBook();
  var wait = b.list === "waitlist";

  var h = '<div class="screen"><button class="back" data-a="back">' + ico("left", 18) + " Boeken</button>";
  h += '<div style="display:flex;gap:18px;align-items:flex-start">' + cover(b, "108px") +
    '<div style="flex:1;min-width:0;padding-top:2px">' +
    '<span class="badge b-grey">' + esc(b.m || "Eigen") + "</span>" +
    '<h1 class="h2" style="margin-top:9px">' + esc(b.t) + "</h1>" +
    '<div class="item-a" style="margin-top:3px">' + esc(b.a || "—") + "</div>" +
    '<div class="meta">' + (b.lang ? "<span>" + esc(b.lang) + "</span>" : "") +
    (b.tag ? "<span>" + esc(b.tag) + "</span>" : "") + "</div>";
  if (b.buy) h += '<span class="badge b-gold" style="margin-top:8px">Nog te kopen</span>';
  h += "</div></div>";

  if (b.why) h += '<p class="body" style="margin-top:18px">' + esc(b.why) + "</p>";

  if (s.done) {
    h += '<div class="card pad" style="margin-top:18px;text-align:center">' +
      '<span class="badge b-green">Uit' + (s.doneAt ? " op " + esc(fShort(parseD(s.doneAt))) : "") + "</span>" +
      '<p class="small" style="margin-top:10px">' + (s.rating ? "Jouw cijfer: " + "★".repeat(s.rating) + "☆".repeat(5 - s.rating) : "Je nabespreking staat klaar.") + "</p>" +
      '<button class="btn" style="margin-top:14px" data-a="debrief" data-id="' + esc(id) + '">Nabespreking openen</button>' +
      '<button class="btn ghost sm" style="margin-top:10px" data-a="undone" data-id="' + esc(id) + '">Toch nog niet uit</button></div>';
  } else if (!wait) {
    h += '<div class="card pad" style="margin-top:18px;display:flex;align-items:flex-end;gap:18px">' +
      '<div><div style="font-family:var(--serif);font-size:46px;line-height:1;color:var(--green)" class="num" id="d-perday">' + perDay(b) + "</div>" +
      '<div class="eyebrow" style="margin-top:6px">pagina’s per dag</div></div>' +
      '<div class="small num" style="padding-bottom:4px" id="d-left">' + leftText(b) + "</div></div>";
    h += '<div class="meta" style="margin-top:10px;padding:0 2px"><span>klaar tegen ' + esc(fShort(parseD(dueOf(b)))) + " " + parseD(dueOf(b)).getFullYear() + "</span>" +
      '<button class="btn xs ghost" data-a="extend" data-id="' + esc(id) + '">+ 1 maand</button></div>';
  }

  if (!wait) {
    h += '<div class="sec"><div class="label">Waar sta je?</div>' +
      '<div class="pg"><span>op p.</span>' +
      '<input class="field num" type="number" inputmode="numeric" pattern="[0-9]*" data-in="cur" data-id="' + esc(id) + '" value="' + s.cur + '" min="0" max="' + tot + '">' +
      "<span>van</span>" +
      '<input class="field num" type="number" inputmode="numeric" pattern="[0-9]*" data-in="pages" data-id="' + esc(id) + '" value="' + tot + '" min="1">' +
      '<b style="color:var(--green);font-size:14px" id="d-pct">' + pct + "%</b></div>" +
      '<div class="bar" style="margin-top:14px" id="d-barwrap"><i id="d-bar" style="width:' + pct + '%"></i></div>' +
      '<p class="tiny" style="margin-top:8px">Klopt het aantal pagina’s van jouw editie niet? Pas het aan — alles rekent mee.</p></div>';
  }

  h += '<div class="sec">';
  if (!s.done && !wait && (!cur || cur.id !== b.id))
    h += '<button class="btn soft" style="margin-bottom:10px" data-a="setcur" data-id="' + esc(id) + '">Dit boek lees ik nu</button>';
  if (wait)
    h += '<button class="btn soft" style="margin-bottom:10px" data-a="toschedule" data-id="' + esc(id) + '">Uit de wachtlijst halen</button>';
  if (!s.done && !wait)
    h += '<button class="btn" style="margin-bottom:10px" data-a="done" data-id="' + esc(id) + '">' + ico("tick", 18) + " Boek uit</button>";
  h += '<button class="btn ghost" data-a="photo" data-id="' + esc(id) + '">' + ico("cam", 18) + " " +
    (s.photo ? "Andere cover" : "Cover vervangen door foto") + "</button>";
  if (s.photo) h += '<button class="btn ghost sm" style="margin-top:10px" data-a="unphoto" data-id="' + esc(id) + '">Foto weghalen</button>';
  if (b.own) h += '<button class="btn danger sm" style="margin-top:10px" data-a="del" data-id="' + esc(id) + '">Dit boek verwijderen</button>';
  h += "</div></div>";
  return h;
}

function leftText(b) {
  var s = st(b.id), tot = pagesOf(b);
  if (!started(b)) return "start " + esc(fShort(windowStart(b))) + "<br>" + daysLeft(b) + " dagen";
  return "nog " + Math.max(0, tot - s.cur) + " p.<br>" + daysLeft(b) + " dagen";
}
function updateDetail(id) {
  var b = byId(id); if (!b) return;
  var pct = pctOf(b);
  var e = $("#d-pct"); if (e) e.textContent = pct + "%";
  e = $("#d-bar"); if (e) e.style.width = pct + "%";
  e = $("#d-perday"); if (e) e.textContent = perDay(b);
  e = $("#d-left"); if (e) e.innerHTML = leftText(b);
}

/* ---------------------------------------------------- TRAINING */
function viewTraining() {
  var idx = dayIndex(), pi = phaseIndexAt(idx), st2 = stats();
  var h = '<div class="screen"><h1 class="h1">Training</h1>' +
    '<p class="sub">Van vijftien minuten naar een uur, in negen weken.</p>';

  var ph = PHASES[pi];
  h += '<div class="card pad" style="margin-top:18px">' +
    '<div class="eyebrow">waar je nu staat</div>' +
    '<div class="h2" style="margin-top:6px">' + esc(ph.w) + " · " + esc(ph.label) + " per dag</div>" +
    '<p class="body" style="margin-top:8px">' + esc(ph.note) + "</p></div>";

  h += '<div class="sec"><div class="eyebrow">de opbouw</div><div style="margin-top:12px">';
  for (var i = 0; i < PHASES.length; i++) {
    var p = PHASES[i];
    var a = addDays(parseD(START), p.from);
    var b2 = addDays(parseD(START), Math.min(p.to, 400));
    var range = p.to > 300 ? "vanaf " + fShort(a) : fShort(a) + " – " + fShort(b2);
    var on = !!S.weeks[i];
    h += '<button class="checkrow' + (on ? " on" : "") + '" data-a="week" data-i="' + i + '">' +
      '<span class="box">' + (on ? ico("tick", 13) : "") + "</span>" +
      '<span style="flex:1;min-width:0"><span style="display:flex;align-items:baseline;gap:8px">' +
      '<span class="small" style="font-weight:600">' + esc(p.w) + "</span>" +
      '<span style="font-family:var(--serif);font-size:17px">' + esc(p.label) + "</span>" +
      (i === pi && idx >= 0 ? '<span class="badge b-green">Nu</span>' : "") + "</span>" +
      '<span class="tiny" style="display:block">' + esc(range) + "</span>" +
      '<span class="small" style="display:block;margin-top:3px">' + esc(p.note) + "</span></span></button>";
  }
  h += "</div></div>";

  h += '<div class="sec"><div class="eyebrow">de vaste regels</div><div class="card pad" style="margin-top:12px"><div class="rowlist">';
  for (var j = 0; j < RULES.length; j++)
    h += '<div class="item" style="padding:12px 0;gap:12px"><span class="num" style="color:var(--green);font-weight:700;font-size:13px;padding-top:2px">' + (j + 1) + "</span>" +
      '<div class="item-b"><div class="h3">' + esc(RULES[j][0]) + "</div>" +
      '<p class="small" style="margin-top:3px;line-height:1.5">' + esc(RULES[j][1]) + "</p></div></div>";
  h += "</div></div></div>";

  h += '<div class="sec"><div class="eyebrow">tegen het herlezen</div><div style="margin-top:12px">';
  for (var k = 0; k < TECHNIQUES.length; k++)
    h += '<div class="card pad" style="margin-bottom:10px"><div class="h3">' + esc(TECHNIQUES[k][0]) + "</div>" +
      '<p class="body" style="margin-top:5px">' + esc(TECHNIQUES[k][1]) + "</p></div>";
  h += "</div></div>";

  h += '<div class="sec"><div class="eyebrow">jouw cijfers</div><div class="stats" style="margin-top:12px">' +
    '<div class="stat"><b>' + fMin(st2.min) + "</b><span>totaal gelezen</span></div>" +
    '<div class="stat"><b>' + st2.pages + "</b><span>pagina’s</span></div>" +
    '<div class="stat"><b>' + fMin(st2.best) + "</b><span>langste sessie</span></div>" +
    '<div class="stat"><b>' + st2.top + "</b><span>langste reeks dagen</span></div></div></div>";

  h += '<div class="sec"><div class="eyebrow">wat het je oplevert</div><div class="card pad" style="margin-top:12px"><div class="rowlist">';
  for (var m = 0; m < BENEFITS.length; m++)
    h += '<div class="item" style="padding:11px 0;gap:11px"><span style="color:var(--green);padding-top:2px">' + ico("tick", 14) + "</span>" +
      '<div class="item-b"><div class="h3" style="font-size:14.5px">' + esc(BENEFITS[m][0]) + "</div>" +
      '<p class="small" style="margin-top:2px;line-height:1.5">' + esc(BENEFITS[m][1]) + "</p></div></div>";
  h += "</div></div></div>";

  h += '<div class="note" style="margin-top:22px"><div class="h3">Dit gaat traag, en dat hoort</div>' +
    '<p class="body" style="margin-top:5px">Na één boek voel je vooral trots. Pas na vier of vijf merk je dat je makkelijker gaat zitten, minder herleest en langer volhoudt. Het is training, geen knop.</p></div>';

  h += '<div class="sec"><div class="eyebrow">veiligheid</div>' +
    '<div class="card pad" style="margin-top:12px"><div class="h3">Back-up</div>' +
    '<p class="small" style="margin-top:5px;line-height:1.5">Alles staat op deze telefoon en nergens anders. Kopieer je gegevens af en toe en plak ze in je Notities.</p>' +
    '<div class="btnrow"><button class="btn ghost sm" data-a="backup">' + ico("copy", 16) + " Kopiëren</button>" +
    '<button class="btn ghost sm" data-a="restore">Terugzetten</button></div></div></div>';

  h += "</div>";
  return h;
}

/* ---------------------------------------------------- UIT */
function viewDone() {
  var list = allBooks().filter(function (b) { return st(b.id).done; });
  list.sort(function (a, b) { return String(st(b.id).doneAt || "").localeCompare(String(st(a.id).doneAt || "")); });
  var total = scheduled().length;

  var h = '<div class="screen"><h1 class="h1">Uit</h1>' +
    '<p class="sub">' + list.length + " van de " + total + " boeken uitgelezen. Tik op een boek voor de nabespreking.</p>";

  if (!list.length) {
    h += '<div class="empty" style="margin-top:30px"><div class="h2">Je plank is nog leeg</div>' +
      '<p class="small">Zodra je een boek als uit markeert, komt het hier te staan — met acht vragen die je er zelf over beantwoordt.</p></div>';
    return h + "</div>";
  }

  h += '<div class="shelf">';
  for (var i = 0; i < list.length; i++) {
    var b = list[i], s = st(b.id);
    var filled = 0, qs = CORE_Q.length + (b.q ? 1 : 0);
    for (var k in s.ans) if (s.ans[k] && String(s.ans[k]).trim()) filled++;
    h += '<button data-a="debrief" data-id="' + esc(b.id) + '">' + cover(b, "100%") +
      '<span class="shelf-t">' + esc(b.t) + "</span>" +
      (s.rating ? '<span class="shelf-s">' + "★".repeat(s.rating) + "</span>"
        : '<span class="tiny">' + (filled ? filled + "/" + qs + " ingevuld" : "nog niets") + "</span>") +
      "</button>";
  }
  h += "</div></div>";
  return h;
}

/* ---------------------------------------------------- NABESPREKING */
function viewDebrief(id) {
  var b = byId(id);
  if (!b) { UI.screen = null; return viewDone(); }
  var s = st(id);
  var qs = CORE_Q.concat(b.q ? [{ id: "qx", label: b.q }] : []);

  var h = '<div class="screen"><div style="display:flex;align-items:center;justify-content:space-between">' +
    '<button class="back" style="margin:0" data-a="back">' + ico("left", 18) + " Uit</button>" +
    '<span class="badge b-green" style="gap:5px">' + ico("tick", 12) + " Uitgelezen</span></div>";
  h += '<div style="display:flex;gap:16px;align-items:flex-start;margin-top:16px">' + cover(b, "84px") +
    '<div style="flex:1;min-width:0">' +
    '<h1 class="h2">' + esc(b.t) + "</h1>" +
    '<div class="item-a">' + esc(b.a || "—") + "</div>" +
    (s.doneAt ? '<div class="tiny" style="margin-top:6px">uit op ' + esc(fFull(parseD(s.doneAt))) + "</div>" : "") +
    "</div></div>";

  h += '<div class="card pad" style="margin-top:18px"><div class="label">Jouw cijfer</div>' +
    '<div class="stars">';
  for (var i = 1; i <= 5; i++)
    h += '<button class="' + (s.rating >= i ? "on" : "") + '" data-a="star" data-id="' + esc(id) + '" data-n="' + i + '">★</button>';
  h += "</div></div>";

  h += '<p class="small" style="margin:18px 2px 0;line-height:1.55">Invullen zodra het boek uit is, en daarna met Claude delen. Na twee of drie boeken komen er patronen boven die je zelf niet ziet — daarop past hij je wachtlijst aan.</p>';

  h += '<div class="sec">';
  for (var j = 0; j < qs.length; j++) {
    h += '<div style="margin-bottom:18px"><label class="label" style="display:flex;gap:9px;align-items:flex-start">' +
      '<span class="num" style="color:var(--green);font-weight:700">' + pad2(j + 1) + "</span>" +
      "<span>" + esc(qs[j].label) + "</span></label>" +
      '<textarea class="field" rows="3" data-in="ans" data-id="' + esc(id) + '" data-q="' + esc(qs[j].id) + '" ' +
      'placeholder="Typ hier…">' + esc(s.ans[qs[j].id] || "") + "</textarea></div>";
  }
  h += "</div>";

  var recs = [["ja", "Ja"], ["misschien", "Misschien"], ["nee", "Nee"]];
  h += '<div style="margin-bottom:8px"><label class="label">Zou je dit boek aanraden?</label><div class="seg">';
  for (var r = 0; r < recs.length; r++)
    h += '<button class="' + (s.rec === recs[r][0] ? "on" : "") + '" data-a="rec" data-id="' + esc(id) +
      '" data-v="' + recs[r][0] + '">' + recs[r][1] + "</button>";
  h += "</div></div>";

  h += '<p class="tiny tc" style="margin-top:18px">Alles wordt vanzelf bewaard.</p>';
  h += '<button class="btn" style="margin-top:12px" data-a="savequit">' + ico("tick", 17) + " Bewaren</button>";
  h += '<button class="btn ghost" style="margin-top:10px" data-a="copyq" data-id="' + esc(id) + '">' + ico("copy", 17) + " Kopieer voor Claude</button>";
  h += "</div>";
  return h;
}

/* ============================================================ boek toevoegen */
function sheetAdd() {
  UI.draft = { photo: null, where: "schedule" };
  openSheet(
    '<h2 class="h2">Nieuw boek</h2>' +
    '<p class="sub">Een foto, de titel en het aantal pagina’s. De rest doet de app.</p>' +
    '<div style="display:flex;gap:16px;margin-top:18px;align-items:flex-start">' +
    '<button id="addcov" data-a="addphoto" style="flex:0 0 auto">' +
    '<div class="cover c-minimal" style="--w:74px;--cbg:#F1EFE8;--cfg:#8A9099;--cac:#D9D5CA">' +
    '<div class="cv"><div class="cv-t" style="font-size:1em">foto</div></div></div></button>' +
    '<div style="flex:1;min-width:0">' +
    '<label class="label">Titel</label>' +
    '<input class="field" id="a-t" placeholder="Bijvoorbeeld: Influence" autocomplete="off">' +
    '<label class="label" style="margin-top:12px">Aantal pagina’s</label>' +
    '<input class="field num" id="a-p" type="number" inputmode="numeric" pattern="[0-9]*" placeholder="320">' +
    "</div></div>" +
    '<label class="label" style="margin-top:14px">Auteur <span class="tiny">(mag leeg)</span></label>' +
    '<input class="field" id="a-a" placeholder="Robert Cialdini" autocomplete="off">' +
    '<label class="label" style="margin-top:16px">Waar hoort het?</label>' +
    '<div class="chips" style="margin:0 -18px 0;padding:2px 18px">' +
    '<button class="chip" data-a="where" data-w="now">Ik lees dit nu</button>' +
    '<button class="chip on" data-a="where" data-w="schedule">In mijn schema</button>' +
    '<button class="chip" data-a="where" data-w="waitlist">Op de wachtlijst</button></div>' +
    '<div class="btnrow"><button class="btn ghost" data-a="x">Annuleren</button>' +
    '<button class="btn" data-a="addsave">Toevoegen</button></div>'
  );
}

function addSave() {
  var t = ($("#a-t") || {}).value || "";
  var p = parseInt(($("#a-p") || {}).value, 10);
  var a = ($("#a-a") || {}).value || "";
  t = t.trim(); a = a.trim();
  if (!t) { toast("Geef het boek een titel."); return; }
  if (!p || p < 1) { toast("Hoeveel pagina’s heeft het?"); return; }

  var id = "own-" + Date.now().toString(36);
  var where = UI.draft.where;
  var due;
  if (where === "waitlist") due = null;
  else if (where === "now") due = dk(addDays(today(), 30));
  else due = nextDue();
  var art = ART_POOL[S.custom.length % ART_POOL.length];
  S.custom.push({
    id: id, t: t, a: a, p: p, lang: "", tag: "", own: true,
    m: where === "waitlist" ? "Wachtlijst" : monthLabel(due),
    due: due, art: art, list: where === "waitlist" ? "waitlist" : "schedule",
    why: "", q: ""
  });
  st(id);
  if (UI.draft.photo) S.books[id].photo = UI.draft.photo;
  if (where === "now") S.cur = id;
  save(); closeSheet();
  UI.filter = where === "waitlist" ? "wacht" : "alle";
  S.tab = "books"; UI.screen = null;
  render();
  toast(where === "now" ? "Toegevoegd — dit lees je nu" : "Boek toegevoegd");
}

/* ============================================================ foto */
function pickPhoto(cb) {
  var inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.style.position = "fixed"; inp.style.left = "-9999px";
  document.body.appendChild(inp);
  inp.onchange = function () {
    var f = inp.files && inp.files[0];
    document.body.removeChild(inp);
    if (f) shrink(f, cb);
  };
  inp.click();
}
function shrink(file, cb) {
  var url = URL.createObjectURL(file), img = new Image();
  img.onload = function () {
    var W = 320, H = 474, c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    var sr = img.width / img.height, dr = W / H, sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (sr > dr) { sw = img.height * dr; sx = (img.width - sw) / 2; }
    else { sh = img.width / dr; sy = (img.height - sh) / 2; }
    x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    URL.revokeObjectURL(url);
    try { cb(c.toDataURL("image/jpeg", 0.72)); }
    catch (e) { toast("Die foto lukte niet."); }
  };
  img.onerror = function () { URL.revokeObjectURL(url); toast("Die foto lukte niet."); };
  img.src = url;
}

/* ============================================================ back-up */
function backup() {
  var txt = JSON.stringify(S);
  copy(txt, "Back-up gekopieerd — plak hem in je Notities.");
}
function sheetRestore() {
  openSheet(
    '<h2 class="h2">Back-up terugzetten</h2>' +
    '<p class="sub">Plak hier de tekst die je eerder kopieerde. Alles wat nu in de app staat, wordt vervangen.</p>' +
    '<textarea class="field" id="rst" rows="5" style="margin-top:14px" placeholder="Plak hier…"></textarea>' +
    '<div class="btnrow"><button class="btn ghost" data-a="x">Annuleren</button>' +
    '<button class="btn danger" data-a="dorestore">Terugzetten</button></div>'
  );
}
function doRestore() {
  var v = ($("#rst") || {}).value || "";
  try {
    var o = JSON.parse(v);
    if (!o || typeof o !== "object" || !o.books) throw 0;
    S = o; load2(); save(); closeSheet(); UI.screen = null; render();
    toast("Back-up teruggezet.");
  } catch (e) { toast("Dat lijkt geen geldige back-up."); }
}
function load2() {
  var d = blank();
  for (var k in d) if (S[k] === undefined) S[k] = d[k];
  if (!S.books) S.books = {};
  if (!Array.isArray(S.custom)) S.custom = [];
  if (!Array.isArray(S.sessions)) S.sessions = [];
}

function copyAnswers(id) {
  var b = byId(id); if (!b) return;
  var s = st(id);
  var qs = CORE_Q.concat(b.q ? [{ id: "qx", label: b.q }] : []);
  var out = "Nabespreking — " + b.t + (b.a ? " (" + b.a + ")" : "") + "\n";
  out += "Uitgelezen: " + (s.doneAt ? fFull(parseD(s.doneAt)) + " " + parseD(s.doneAt).getFullYear() : "—") + "\n";
  out += "Cijfer: " + (s.rating ? s.rating + "/5" : "—") + "\n";
  out += "Aanraden: " + (s.rec || "—") + "\n\n";
  for (var i = 0; i < qs.length; i++)
    out += (i + 1) + ". " + qs[i].label + "\n" + ((s.ans[qs[i].id] || "").trim() || "—") + "\n\n";
  copy(out, "Gekopieerd — plak het in een gesprek met Claude.");
}

function copy(text, msg) {
  var ok = function () { toast(msg); };
  var legacy = function () {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.top = "-1000px";
    document.body.appendChild(ta); ta.focus(); ta.select();
    var done = false;
    try { done = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    if (done) ok(); else showText(text);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(ok, legacy);
  } else legacy();
}
/* laatste redmiddel: de tekst tonen zodat je hem zelf kan selecteren */
function showText(text) {
  openSheet(
    '<h2 class="h2">Kopieer het zelf</h2>' +
    '<p class="sub">Je telefoon liet kopiëren niet toe. Tik in het vak, hou je vinger vast, kies Alles selecteren en dan Kopiëren.</p>' +
    '<textarea class="field" rows="7" readonly style="margin-top:14px">' + esc(text) + "</textarea>" +
    '<div class="btnrow"><button class="btn" data-a="x">Klaar</button></div>'
  );
}

/* ============================================================ acties */
document.addEventListener("click", function (ev) {
  var el = ev.target.closest ? ev.target.closest("[data-a]") : null;
  if (!el) return;
  var a = el.getAttribute("data-a"), id = el.getAttribute("data-id");

  if (a === "tab") { S.tab = el.getAttribute("data-t"); UI.screen = null; save(); render(); return; }
  if (a === "back") { UI.screen = null; render(); return; }
  if (a === "filter") { UI.filter = el.getAttribute("data-f"); UI.cat = 0; render(); return; }
  if (a === "cat") { UI.cat = parseInt(el.getAttribute("data-i"), 10) || 0; render(); return; }
  if (a === "book") { UI.screen = { t: "book", id: id }; render(); return; }
  if (a === "debrief") { UI.screen = { t: "debrief", id: id }; render(); return; }
  if (a === "week") {
    var i = parseInt(el.getAttribute("data-i"), 10);
    S.weeks[i] = !S.weeks[i]; save(); render(true); return;
  }
  if (a === "tstart") { startTimer(); render(); return; }
  if (a === "tpause") { pauseTimer(); render(); return; }
  if (a === "tstop") { finishSession(); return; }
  if (a === "savesess") { saveSession(id, parseInt(el.getAttribute("data-min"), 10) || 1); return; }
  if (a === "drop") { clearTimer(); closeSheet(); render(); return; }
  if (a === "x") { closeSheet(); return; }

  if (a === "setcur") { S.cur = id; save(); toast("Dit boek staat nu op Vandaag."); render(true); return; }
  if (a === "done") {
    markDone(id); save();
    UI.screen = { t: "debrief", id: id }; render();
    toast("Uitgelezen. Vul je nabespreking in.");
    return;
  }
  if (a === "undone") {
    var s0 = st(id); s0.done = false; s0.doneAt = null; save(); render(true); return;
  }
  if (a === "extend") {
    var b1 = byId(id); if (!b1) return;
    var s1 = st(id);
    var nd = addDays(parseD(dueOf(b1)), 30);
    s1.due = dk(nd); save(); render(true);
    toast("Een maand extra: tot " + fShort(nd) + ".");
    return;
  }
  if (a === "toschedule") {
    var nd2 = nextDue();
    for (var c = 0; c < S.custom.length; c++) if (S.custom[c].id === id) {
      S.custom[c].list = "schedule";
      S.custom[c].due = nd2;
      S.custom[c].m = monthLabel(nd2);
    }
    save(); render(true); toast("Naar je schema verplaatst."); return;
  }
  if (a === "rec") {
    var sr = st(id), v = el.getAttribute("data-v");
    sr.rec = sr.rec === v ? null : v;
    save(); render(true); return;
  }
  if (a === "savequit") {
    save(); S.tab = "done"; UI.screen = null; render();
    toast("Nabespreking bewaard."); return;
  }
  if (a === "star") {
    var n = parseInt(el.getAttribute("data-n"), 10);
    var s2 = st(id);
    s2.rating = s2.rating === n ? 0 : n;
    save(); render(true); return;
  }
  if (a === "photo") {
    pickPhoto(function (data) { st(id).photo = data; save(); render(true); toast("Cover aangepast."); });
    return;
  }
  if (a === "unphoto") { st(id).photo = null; save(); render(true); return; }
  if (a === "del") {
    openSheet('<h2 class="h2">Boek verwijderen?</h2><p class="sub">Je voortgang en nabespreking van dit boek gaan mee weg. Dit kan niet terug.</p>' +
      '<div class="btnrow"><button class="btn ghost" data-a="x">Nee</button>' +
      '<button class="btn danger" data-a="delyes" data-id="' + esc(id) + '">Verwijderen</button></div>');
    return;
  }
  if (a === "delyes") {
    S.custom = S.custom.filter(function (b) { return b.id !== id; });
    delete S.books[id];
    if (S.cur === id) S.cur = null;
    save(); closeSheet(); UI.screen = null; render(); toast("Verwijderd."); return;
  }

  if (a === "add") { sheetAdd(); return; }
  if (a === "where") {
    UI.draft.where = el.getAttribute("data-w");
    var chips = $("#sheet").querySelectorAll('[data-a="where"]');
    for (var q = 0; q < chips.length; q++) chips[q].classList.toggle("on", chips[q] === el);
    return;
  }
  if (a === "addphoto") {
    pickPhoto(function (data) {
      UI.draft.photo = data;
      var c2 = $("#addcov");
      if (c2) c2.innerHTML = '<div class="cover photo" style="--w:74px;background-image:url(' + data + ')"></div>';
    });
    return;
  }
  if (a === "addsave") { addSave(); return; }
  if (a === "backup") { backup(); return; }
  if (a === "restore") { sheetRestore(); return; }
  if (a === "dorestore") { doRestore(); return; }
  if (a === "copyq") { copyAnswers(id); return; }
});

$("#scrim").addEventListener("click", closeSheet);

/* invoer zonder her-tekenen, anders springt het toetsenbord dicht */
var saveT = null;
document.addEventListener("input", function (ev) {
  var el = ev.target, kind = el.getAttribute && el.getAttribute("data-in");
  if (!kind) return;
  var id = el.getAttribute("data-id"), s = st(id), b = byId(id);
  if (kind === "cur" && b) {
    s.cur = clamp(parseInt(el.value, 10) || 0, 0, pagesOf(b));
    updateDetail(id);
  } else if (kind === "pages" && b) {
    var v = parseInt(el.value, 10);
    if (v && v > 0) { s.pages = v; if (s.cur > v) s.cur = v; updateDetail(id); }
  } else if (kind === "ans") {
    s.ans[el.getAttribute("data-q")] = el.value;
  }
  clearTimeout(saveT);
  saveT = setTimeout(save, 400);
});
document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (el.getAttribute && el.getAttribute("data-in") === "cur") {
    var id = el.getAttribute("data-id"), b = byId(id);
    if (b) el.value = st(id).cur;
  }
});

/* de app is weer zichtbaar: klok bijwerken, dag kan veranderd zijn */
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    if (S.timer && S.timer.running) { runTick(); lockScreen(); }
    paintTimer();
  } else { stopTick(); }
});

/* ============================================================ start */
load();
render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(function () {});
  var reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
})();
