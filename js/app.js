/* BPRE Force Builder. Plain JavaScript, no build step. Game data lives in data/data.js. */
(function () {
  'use strict';

  var D = window.BPRE_DATA;
  if (!D) {
    document.body.innerHTML = '<p style="padding:16px">Could not load data/data.js. Check that the file exists and has no syntax errors.</p>';
    return;
  }

  // ---------- helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function index(arr) { var o = {}; (arr || []).forEach(function (x) { o[x.id] = x; }); return o; }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function sum(arr, fn) { return arr.reduce(function (n, x) { return n + fn(x); }, 0); }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  var PL = D.pointsLabel || 'CP';
  var SETS = index(D.sets);
  var MODES = index(D.modes);
  var FACTIONS = index(D.factions);
  var UNITS = index(D.units);
  var CARDS = index(D.cards);
  var OPTIONS = index(D.options);
  var QRF = D.qrf || null;

  var EMBEDDED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  var LS_CURRENT = 'bpre-roster:current:v2';
  var LS_SAVED = 'bpre-roster:saved:v2';
  var LS_UI = 'bpre-roster:ui';

  var storage = {
    get: function (k, fallback) {
      try { var v = window.localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
    }
  };

  // ---------- data queries (pure, take a state) ----------
  function modeOf(s) { return MODES[s.mode]; }

  function factionHasUnits(fid, mid) {
    var m = MODES[mid];
    return D.units.some(function (u) { return u.faction === fid && m.unitSets.indexOf(u.set) !== -1; });
  }
  function allyChoices(fid, mid) {
    var f = FACTIONS[fid];
    if (!f) return [];
    return (f.allies || []).filter(function (a) { return FACTIONS[a] && factionHasUnits(a, mid); });
  }
  function forceFactions(s) {
    var out = [];
    if (s.faction) out.push(s.faction);
    if (s.ally) out.push(s.ally);
    return out;
  }
  function unitsAvailable(s) {
    var m = modeOf(s);
    var fs = forceFactions(s);
    return D.units.filter(function (u) { return fs.indexOf(u.faction) !== -1 && m.unitSets.indexOf(u.set) !== -1; });
  }
  function optionsFor(u, s) {
    return (u.options || []).map(function (id) { return OPTIONS[id]; }).filter(function (o) {
      return o && (!o.modes || o.modes.indexOf(s.mode) !== -1);
    });
  }
  function cardAllowed(c, s) {
    if (!c.factions || !c.factions.length) return true;
    var fs = forceFactions(s);
    return c.factions.some(function (f) { return fs.indexOf(f) !== -1; });
  }

  function qrfAllowed(s) { return !!QRF && modeOf(s).qrf !== false; }
  function fireSlots(s) { return (modeOf(s).fireSlots || []).filter(function (sl) { return !sl.optional || s.on[sl.id]; }); }
  function slotShort(sl) { return sl.short || sl.name; }
  function slotCards(s) {
    return D.cards.filter(function (c) { return c.slot && cardAllowed(c, s); });
  }

  // Deployments: the CP pools a force is built in.
  function deployments(s) {
    var m = modeOf(s);
    var list = [{ id: 'main', name: m.mainName || (m.id === 'phaseline' ? 'Initial deployment' : 'Kill team'), points: s.points, budget: 'main' }];
    if (qrfAllowed(s) && s.on.qrf) list.push({ id: 'qrf', name: 'Quick Reaction Force', budget: 'main', qrf: true, note: 'Held off the battlespace. Units cost ' + QRF.discount + ' ' + PL + ' less (minimum ' + QRF.minimum + ').' });
    (m.deployments || []).forEach(function (d) {
      if (!d.optional || s.on[d.id]) list.push({ id: d.id, name: d.name, points: d.points, budget: d.id, note: d.note, optional: d.optional, reserve: !!d.reserve, allowedUnits: d.allowedUnits || null });
    });
    return list;
  }
  function budgets(s) {
    return deployments(s).filter(function (d) { return d.budget === d.id; }).map(function (d) {
      var deps = deployments(s).filter(function (x) { return x.budget === d.id; });
      return { id: d.id, name: d.name, limit: d.points, deps: deps, used: sum(deps, function (x) { return depTotal(s, x); }) };
    });
  }
  function unitCost(u, dep) {
    if (u.cost == null) return 0;
    if (dep && dep.qrf && QRF) return Math.max(QRF.minimum, u.cost - QRF.discount);
    return u.cost;
  }
  function qty(s, depId, unitId) { return (s.units[depId] && s.units[depId][unitId]) || 0; }
  function optQty(s, depId, unitId, optId) {
    var o = s.opts[depId] && s.opts[depId][unitId];
    return (o && o[optId]) || 0;
  }
  function depRows(s, dep) {
    return D.units.filter(function (u) { return qty(s, dep.id, u.id) > 0; }).map(function (u) {
      var q = qty(s, dep.id, u.id);
      var opts = optionsFor(u, s).map(function (o) { return { o: o, n: Math.min(q, optQty(s, dep.id, u.id, o.id)) }; }).filter(function (x) { return x.n > 0; });
      return { u: u, q: q, opts: opts, cost: unitCost(u, dep) * q + sum(opts, function (x) { return x.o.cost * x.n; }) };
    });
  }
  function depTotal(s, dep) { return sum(depRows(s, dep), function (r) { return r.cost; }); }
  // Units actually fielded (reserve pools don't count towards ratios).
  function totalQty(s, unitId) { return sum(deployments(s).filter(function (d) { return !d.reserve; }), function (d) { return qty(s, d.id, unitId); }); }
  function modelCount(s) { return sum(deployments(s), function (d) { return sum(depRows(s, d), function (r) { return r.q; }); }); }

  function perPointsCap(s, u, budget) {
    if (!u.perPoints) return Infinity;
    return Math.floor(budget.used / u.perPoints);
  }
  function budgetOf(s, depId) {
    var dep = deployments(s).filter(function (d) { return d.id === depId; })[0];
    return budgets(s).filter(function (b) { return dep && b.id === dep.budget; })[0];
  }
  function ratioFor(unitId) {
    return (D.ratios || []).filter(function (r) { return r.members.indexOf(unitId) !== -1; })[0] || null;
  }
  function ratioState(s, r) {
    var have = sum(r.members, function (id) { return totalQty(s, id); });
    var base = sum(r.per, function (id) { return totalQty(s, id); });
    return { have: have, cap: base * r.max };
  }

  function grantedFires(s) {
    var out = {};
    deployments(s).filter(function (d) { return !d.reserve; }).forEach(function (d) {
      depRows(s, d).forEach(function (r) {
        (r.u.fires || []).forEach(function (f) {
          if (!CARDS[f.card]) return;
          if (!out[f.card]) out[f.card] = { c: CARDS[f.card], n: 0, from: [] };
          out[f.card].n += f.count * r.q;
          if (out[f.card].from.indexOf(r.u.name) === -1) out[f.card].from.push(r.u.name);
        });
      });
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  }
  function pickedCards(s, type) {
    return D.cards.filter(function (c) { return c.type === type && s.cards[c.id] > 0; }).map(function (c) { return { c: c, q: s.cards[c.id] }; });
  }
  function pickedCount(s, type) { return sum(pickedCards(s, type), function (r) { return r.q; }); }
  function cardLimit(s, type) {
    var v = type === 'intervention' ? modeOf(s).interventionLimit : type === 'fires' ? modeOf(s).firesLimit : null;
    return typeof v === 'number' ? v : null;
  }

  function issues(s) {
    var list = [];
    if (!s.faction) { list.push({ level: 'info', text: 'Pick a faction to start your team.' }); return list; }
    if (!modelCount(s)) list.push({ level: 'info', text: 'Add units in step 3.' });
    budgets(s).forEach(function (b) {
      if (b.used > b.limit) list.push({ level: 'error', text: b.name + ' is over by ' + (b.used - b.limit) + ' ' + PL + '.' });
    });
    deployments(s).forEach(function (d) {
      if (d.id === 'qrf' && !depRows(s, d).length) list.push({ level: 'info', text: 'QRF is switched on but empty.' });
    });
    budgets(s).forEach(function (b) {
      if (b.deps.some(function (d) { return d.reserve; })) return;
      var seen = {};
      b.deps.forEach(function (d) { depRows(s, d).forEach(function (r) { seen[r.u.id] = (seen[r.u.id] || 0) + r.q; }); });
      Object.keys(seen).forEach(function (id) {
        var u = UNITS[id];
        var cap = perPointsCap(s, u, b);
        if (seen[id] > cap) {
          list.push({ level: 'error', text: u.name + ': one per ' + u.perPoints + ' ' + PL + ' of warfighting units. ' + b.name + ' has ' + b.used + ' ' + PL + ', so ' + (cap === 0 ? 'none are' : cap + ' ' + (cap === 1 ? 'is' : 'are')) + ' allowed; you have ' + seen[id] + '.' });
        }
      });
    });
    (D.ratios || []).forEach(function (r) {
      var st = ratioState(s, r);
      if (st.have > st.cap) list.push({ level: 'error', text: r.label + '. You have ' + st.have + ' and room for ' + st.cap + '.' });
    });
    ['intervention', 'fires'].forEach(function (t) {
      var lim = cardLimit(s, t);
      if (lim != null && pickedCount(s, t) > lim) list.push({ level: 'error', text: (t === 'fires' ? 'Fires' : 'Intervention') + ': ' + pickedCount(s, t) + ' picked, limit is ' + lim + '.' });
    });
    var open = fireSlots(s).filter(function (sl) { return !s.slots[sl.id]; });
    if (open.length && modelCount(s)) list.push({ level: 'info', text: 'Phase Line Fires still to choose: ' + open.map(function (sl) { return sl.name; }).join(', ') + '.' });
    var il = cardLimit(s, 'intervention');
    if (il != null && pickedCount(s, 'intervention') < il && modelCount(s)) list.push({ level: 'info', text: 'Pick ' + (il - pickedCount(s, 'intervention')) + ' more Intervention ' + (il - pickedCount(s, 'intervention') === 1 ? 'card' : 'cards') + ' for a full hand of ' + il + '.' });
    return list;
  }

  // ---------- state ----------
  function blankState() {
    var m = D.modes[0];
    return { id: uid(), name: '', mode: m.id, points: m.defaultPoints, faction: null, ally: null, on: {}, units: {}, opts: {}, cards: {}, slots: {} };
  }

  function sanitize(raw) {
    var s = blankState();
    if (!isObj(raw)) return s;
    if (typeof raw.id === 'string') s.id = raw.id;
    if (typeof raw.name === 'string') s.name = raw.name.slice(0, 60);
    if (MODES[raw.mode]) s.mode = raw.mode;
    var p = parseInt(raw.points, 10);
    s.points = p > 0 && p <= 5000 ? p : modeOf(s).defaultPoints;
    if (isObj(raw.on)) {
      if (raw.on.qrf && qrfAllowed(s)) s.on.qrf = true;
      (modeOf(s).deployments || []).concat(modeOf(s).fireSlots || []).forEach(function (d) { if (d.optional && raw.on[d.id]) s.on[d.id] = true; });
    }
    if (FACTIONS[raw.faction] && factionHasUnits(raw.faction, s.mode)) s.faction = raw.faction;
    if (s.faction && allyChoices(s.faction, s.mode).indexOf(raw.ally) !== -1) s.ally = raw.ally;

    var allowed = {};
    unitsAvailable(s).forEach(function (u) { allowed[u.id] = true; });
    deployments(s).forEach(function (d) {
      var src = isObj(raw.units) && isObj(raw.units[d.id]) ? raw.units[d.id] : {};
      Object.keys(src).forEach(function (id) {
        var q = parseInt(src[id], 10);
        if (allowed[id] && q > 0 && (!d.allowedUnits || d.allowedUnits.indexOf(id) !== -1)) {
          (s.units[d.id] = s.units[d.id] || {})[id] = Math.min(q, 99);
          var osrc = isObj(raw.opts) && isObj(raw.opts[d.id]) && isObj(raw.opts[d.id][id]) ? raw.opts[d.id][id] : {};
          optionsFor(UNITS[id], s).forEach(function (o) {
            var n = parseInt(osrc[o.id], 10);
            if (n > 0) {
              s.opts[d.id] = s.opts[d.id] || {};
              s.opts[d.id][id] = s.opts[d.id][id] || {};
              s.opts[d.id][id][o.id] = Math.min(n, s.units[d.id][id]);
            }
          });
        }
      });
    });
    if (isObj(raw.cards)) {
      Object.keys(raw.cards).forEach(function (id) {
        var c = CARDS[id];
        var q = parseInt(raw.cards[id], 10);
        if (c && !c.granted && !c.slot && q > 0 && cardAllowed(c, s)) s.cards[id] = Math.min(q, c.maxCopies || 1);
      });
    }
    if (isObj(raw.slots)) {
      var used = {};
      fireSlots(s).forEach(function (sl) {
        var c = CARDS[raw.slots[sl.id]];
        if (c && c.slot && cardAllowed(c, s) && !used[c.id]) { s.slots[sl.id] = c.id; used[c.id] = true; }
      });
    }
    return s;
  }

  var state = sanitize(storage.get(LS_CURRENT, null));
  var savedUi = storage.get(LS_UI, {}) || {};
  var ui = {
    dep: 'main',
    cardTab: ['fires', 'special'].indexOf(savedUi.cardTab) !== -1 ? savedUi.cardTab : 'intervention',
    setFilter: Array.isArray(savedUi.setFilter) ? savedUi.setFilter.filter(function (id) { return SETS[id]; }) : [],
    undo: null,
    pendingDelete: null,
    openCards: {}
  };
  if (!ui.setFilter.length) ui.setFilter = D.sets.map(function (s) { return s.id; });

  function currentDep() {
    var d = deployments(state).filter(function (x) { return x.id === ui.dep; })[0];
    if (!d) { ui.dep = 'main'; d = deployments(state)[0]; }
    return d;
  }

  // ---------- rendering ----------
  function setBadge(setId) {
    var s = SETS[setId];
    return '<span class="badge" title="' + esc(s ? s.name : setId) + '">' + esc(s ? s.short : setId) + '</span>';
  }

  function renderMode() {
    $('#mode-options').innerHTML = D.modes.map(function (m) {
      var on = m.id === state.mode;
      var sets = m.unitSets.map(function (id) { return SETS[id] ? SETS[id].short : id; }).join(' + ');
      return '<button type="button" role="radio" class="mode-card" aria-checked="' + on + '" data-action="set-mode" data-id="' + esc(m.id) + '">' +
        '<span class="mode-name">' + esc(m.name) + '</span>' +
        '<span class="mode-blurb">' + esc(m.blurb || '') + '</span>' +
        '<span class="mode-sets">Units: ' + esc(sets) + '</span>' +
        '</button>';
    }).join('');

    var m = modeOf(state);
    $('#points-label').textContent = (m.id === 'phaseline' ? 'Initial deployment' : 'Kill team') + ' CP';
    var isPreset = m.presets.some(function (p) { return p.points === state.points; });
    $('#points-options').innerHTML = m.presets.map(function (p) {
      return '<button type="button" role="radio" class="preset" aria-checked="' + (p.points === state.points) + '" data-action="set-points" data-value="' + p.points + '">' +
        '<span class="preset-pts mono">' + p.points + ' ' + PL + '</span><span class="preset-label">' + esc(p.label) + '</span></button>';
    }).join('');
    var ci = $('#custom-points');
    if (document.activeElement !== ci) ci.value = isPreset ? '' : state.points;

    var extras = [];
    (m.deployments || []).forEach(function (d) {
      if (d.optional) {
        extras.push('<label class="toggle"><input type="checkbox" data-toggle="' + esc(d.id) + '"' + (state.on[d.id] ? ' checked' : '') + '><span><b>' + esc(d.name) + '</b> +' + d.points + ' ' + PL + '. ' + esc(d.note || '') + '</span></label>');
      } else {
        extras.push('<div class="fixed-dep"><span class="mono">+' + d.points + '</span><span><b>' + esc(d.name) + '</b> reinforcements, ' + d.points + ' ' + PL + '. ' + esc(d.note || '') + '</span></div>');
      }
    });
    (m.fireSlots || []).forEach(function (sl) {
      if (sl.optional) extras.push('<label class="toggle"><input type="checkbox" data-toggle="' + esc(sl.id) + '"' + (state.on[sl.id] ? ' checked' : '') + '><span><b>' + esc(sl.name) + '</b>. ' + esc(sl.note || '') + '</span></label>');
    });
    if (qrfAllowed(state)) {
      extras.push('<label class="toggle"><input type="checkbox" data-toggle="qrf"' + (state.on.qrf ? ' checked' : '') + '><span><b>Quick Reaction Force</b> (defending player). Set aside part of the kill team CP; QRF units cost ' + QRF.discount + ' ' + PL + ' less, minimum ' + QRF.minimum + '.</span></label>');
    }
    var total = state.points + sum(deployments(state).filter(function (d) { return d.budget === d.id && d.id !== 'main'; }), function (d) { return d.points; });
    $('#extras').innerHTML = extras.join('') + (total !== state.points ? '<div class="total-line mono">Total ' + total + ' ' + PL + '</div>' : '');
  }

  function renderFaction() {
    var blocs = [];
    D.factions.forEach(function (f) { if (blocs.indexOf(f.bloc) === -1) blocs.push(f.bloc); });
    $('#faction-options').innerHTML = blocs.map(function (b) {
      return '<div class="bloc"><div class="bloc-name">' + esc(b) + '</div><div class="bloc-grid">' +
        D.factions.filter(function (f) { return f.bloc === b; }).map(function (f) {
          var ok = factionHasUnits(f.id, state.mode);
          var on = f.id === state.faction;
          return '<button type="button" role="radio" class="faction-card" aria-checked="' + on + '" data-action="set-faction" data-id="' + esc(f.id) + '"' + (ok ? '' : ' disabled') + '>' +
            '<span class="faction-name">' + esc(f.name) + '</span>' +
            '<span class="faction-sub">' + esc(f.subtitle || '') + '</span>' +
            (ok ? '' : '<span class="why">No units in ' + esc(modeOf(state).name) + '</span>') +
            '</button>';
        }).join('') + '</div></div>';
    }).join('');

    var choices = state.faction ? allyChoices(state.faction, state.mode) : [];
    $('#ally-block').hidden = !choices.length;
    if (choices.length) {
      $('#ally-options').innerHTML = ['<button type="button" role="radio" class="chip" aria-checked="' + (!state.ally) + '" data-action="set-ally" data-id="">None</button>']
        .concat(choices.map(function (a) {
          return '<button type="button" role="radio" class="chip" aria-checked="' + (state.ally === a) + '" data-action="set-ally" data-id="' + esc(a) + '">' + esc(FACTIONS[a].name) + '</button>';
        })).join('');
      var notes = [];
      if (choices.length > 1) notes.push(FACTIONS[state.faction].name + ' can field with ' + choices.map(function (a) { return FACTIONS[a].name; }).join(' or ') + ', never both.');
      [state.faction].concat(choices).forEach(function (id) { if (FACTIONS[id].note && notes.indexOf(FACTIONS[id].note) === -1 && (id === state.faction || id === state.ally)) notes.push(FACTIONS[id].note); });
      $('#ally-note').textContent = notes.join(' ');
    }
  }

  function renderTeam() {
    var box = $('#unit-list');
    var tabs = $('#dep-tabs');
    if (!state.faction) {
      tabs.innerHTML = '';
      $('#dep-note').textContent = '';
      box.innerHTML = '<div class="empty">Choose a faction in step 2 to see its units.</div>';
      return;
    }
    var deps = deployments(state);
    var dep = currentDep();
    tabs.hidden = deps.length < 2;
    tabs.innerHTML = deps.map(function (d) {
      var b = budgetOf(state, d.id);
      var used = depTotal(state, d);
      var label = d.budget === d.id ? used + '/' + d.points : String(used);
      var over = b && b.used > b.limit;
      return '<button type="button" role="tab" class="dep-tab' + (over ? ' over' : '') + '" aria-selected="' + (d.id === dep.id) + '" data-action="set-dep" data-id="' + esc(d.id) + '">' +
        '<span class="dep-name">' + esc(d.name) + '</span><span class="mono dep-pts">' + label + ' ' + PL + '</span></button>';
    }).join('');
    $('#dep-note').textContent = dep.note || (deps.length > 1 ? 'Adding units to ' + dep.name + '.' : '');

    var budget = budgetOf(state, dep.id);
    var groups = [];
    forceFactions(state).forEach(function (fid) {
      modeOf(state).unitSets.forEach(function (sid) {
        var list = unitsAvailable(state).filter(function (u) { return u.faction === fid && u.set === sid && (!dep.allowedUnits || dep.allowedUnits.indexOf(u.id) !== -1); });
        if (list.length) groups.push({ fid: fid, sid: sid, list: list });
      });
    });

    box.innerHTML = groups.map(function (g) {
      var f = FACTIONS[g.fid];
      var heading = f.name + ' · ' + SETS[g.sid].name + (g.fid !== state.faction ? ' (ally)' : '');
      return '<div class="unit-group"><h3>' + esc(heading) + '</h3><div class="unit-rows">' +
        g.list.map(function (u) { return unitRow(u, dep, budget); }).join('') + '</div></div>';
    }).join('');
  }

  function unitRow(u, dep, budget) {
    var q = qty(state, dep.id, u.id);
    var rule = [];
    if (u.move) rule.push(u.move + '" move');
    if (u.perPoints && !dep.reserve) {
      var cap = perPointsCap(state, u, budget);
      rule.push('1 per ' + u.perPoints + ' ' + PL + ' (' + (cap === Infinity ? '' : cap + ' allowed now') + ')');
    }
    var r = ratioFor(u.id);
    if (r && !dep.reserve) { var st = ratioState(state, r); rule.push('Shurta ' + st.have + '/' + st.cap); }
    (u.fires || []).forEach(function (fr) { if (CARDS[fr.card]) rule.push('+' + fr.count + ' ' + CARDS[fr.card].name); });

    var ratioBlocked = r && !dep.reserve && ratioState(state, r).have >= ratioState(state, r).cap;
    var cost = unitCost(u, dep);
    var costHtml = '<span>' + cost + ' ' + PL + '</span>' + (dep.qrf && cost !== u.cost ? '<span class="was">' + u.cost + '</span>' : '');

    var opts = optionsFor(u, state);
    var optHtml = '';
    if (q && opts.length) {
      optHtml = '<div class="unit-opts">' + opts.map(function (o) {
        var n = Math.min(q, optQty(state, dep.id, u.id, o.id));
        return '<div class="opt"><span class="opt-name" title="' + esc(o.notes || '') + '">' + esc(o.name) + ' <span class="mono">+' + o.cost + '</span></span>' +
          '<div class="stepper small" role="group" aria-label="' + esc(u.name + ' ' + o.name) + '">' +
          '<button type="button" data-action="opt-dec" data-id="' + esc(u.id) + '" data-opt="' + esc(o.id) + '" aria-label="Remove ' + esc(o.name) + '"' + (n ? '' : ' disabled') + '>−</button>' +
          '<span class="qty">' + n + '</span>' +
          '<button type="button" data-action="opt-inc" data-id="' + esc(u.id) + '" data-opt="' + esc(o.id) + '" aria-label="Add ' + esc(o.name) + '"' + (n < q ? '' : ' disabled') + '>+</button></div></div>';
      }).join('') + '</div>';
    }

    return '<div class="unit-row' + (q ? ' in-team' : '') + '">' +
      '<div class="unit-main"><div class="unit-name">' + esc(u.name) + setBadge(u.set) + '</div>' +
      (u.notes ? '<div class="unit-notes">' + esc(u.notes) + '</div>' : '') +
      (rule.length ? '<div class="unit-rule">' + esc(rule.join(' · ')) + '</div>' : '') +
      '</div>' +
      '<div class="unit-cost">' + costHtml + '</div>' +
      '<div class="stepper" role="group" aria-label="' + esc(u.name) + ' quantity">' +
      '<button type="button" data-action="unit-dec" data-id="' + esc(u.id) + '" aria-label="Remove one ' + esc(u.name) + '"' + (q ? '' : ' disabled') + '>−</button>' +
      '<span class="qty">' + q + '</span>' +
      '<button type="button" data-action="unit-inc" data-id="' + esc(u.id) + '" aria-label="Add one ' + esc(u.name) + '"' + (ratioBlocked || q >= 99 ? ' disabled title="' + esc(r ? r.label : 'Limit reached') + '"' : '') + '>+</button>' +
      '</div>' + optHtml + '</div>';
  }

  function renderCards() {
    ['intervention', 'special', 'fires'].forEach(function (t) {
      $('#tab-' + t).setAttribute('aria-selected', String(ui.cardTab === t));
      var lim = cardLimit(state, t);
      var n = pickedCount(state, t) + (t === 'fires' ? sum(grantedFires(state), function (g) { return g.n; }) + Object.keys(state.slots).length : 0);
      $('#count-' + t).textContent = (t === 'intervention' && lim != null) ? pickedCount(state, t) + '/' + lim : String(n);
    });

    $('#set-filter').innerHTML = D.sets.map(function (s) {
      var on = ui.setFilter.indexOf(s.id) !== -1;
      return '<button type="button" class="chip" aria-pressed="' + on + '" data-action="set-filter" data-id="' + esc(s.id) + '">' + esc(s.name) + '</button>';
    }).join('');

    var type = ui.cardTab;
    var lim = cardLimit(state, type);
    var full = lim != null && pickedCount(state, type) >= lim;
    var hint;
    if (type === 'intervention') {
      hint = 'Choose a hand of ' + (lim || 3) + ' unique Intervention cards from any set. Cards with a faction emblem only appear when that faction is in your force.';
    } else if (type === 'special') {
      hint = 'Special Intervention cards are earned: by winning an Operation in a Night Raid, as a tasking reward, or in Phase Line by choosing two instead of firing a Phase Line Fires card. Mark the ones you hold.';
    } else {
      hint = 'Unit Fires (Scoria RS, FengHuang-918, Quadrotor) come with the units that carry them and are added for you.';
      hint += fireSlots(state).length
        ? ' Place one Phase Line Fires card face down at each phase line.'
        : ' Phase Line Fires are placed in Phase Line games, or held in the Spearhead Forward Observer Post tasking.';
      if (fireSlots(state).length && modeOf(state).id !== 'phaseline') hint = hint.replace(' Place one Phase Line Fires card face down at each phase line.', ' Hold one Phase Line Fires card for the Forward Observer Post.');
    }
    $('#card-hint').textContent = hint;


    var html = '';
    if (type === 'fires') {
      var g = grantedFires(state);
      html += g.map(function (x) {
        return cardHtml(x.c, x.n, '<span class="granted">From ' + esc(x.from.join(', ')) + '</span>', true);
      }).join('');
      var slots = fireSlots(state);
      if (slots.length) {
        html += slotCards(state).filter(function (c) { return ui.setFilter.indexOf(c.set) !== -1; }).map(function (c) {
          var placed = slots.filter(function (sl) { return state.slots[sl.id] === c.id; });
          var control = '<div class="slot-btns">' + slots.map(function (sl) {
            var on = state.slots[sl.id] === c.id;
            var taken = state.slots[sl.id] && !on;
            return '<button type="button" class="pick-btn' + (taken ? ' swap' : '') + '" data-action="slot-toggle" data-id="' + esc(c.id) + '" data-slot="' + esc(sl.id) + '" aria-pressed="' + on + '"' + (placed.length && !on ? ' disabled' : '') + ' title="' + esc(taken ? 'Replace ' + CARDS[state.slots[sl.id]].name + ' at ' + sl.name : sl.name) + '">' + esc(slotShort(sl)) + '</button>';
          }).join('') + '</div>';
          return cardHtml(c, placed.length, control, false);
        }).join('');
      }
    }
    var list = D.cards.filter(function (c) {
      return c.type === type && !c.granted && !c.slot && ui.setFilter.indexOf(c.set) !== -1 && cardAllowed(c, state);
    });
    html += list.map(function (c) {
      var q = state.cards[c.id] || 0;
      var control = '<button type="button" class="pick-btn" data-action="card-toggle" data-id="' + esc(c.id) + '" aria-pressed="' + (q > 0) + '"' + (!q && full ? ' disabled title="Hand is full"' : '') + '>' + (q ? 'Picked' : 'Pick') + '</button>';
      return cardHtml(c, q, control, false);
    }).join('');
    $('#card-list').innerHTML = html || '<div class="empty">No cards match these sets' + (state.faction ? '' : '. Faction cards appear once you pick a faction') + '.</div>';
    syncExpandAll();
  }

  function visibleCardIds() {
    return Array.prototype.map.call(document.querySelectorAll('#card-list [data-action="card-text"]'), function (el) { return el.getAttribute('data-id'); });
  }
  function syncExpandAll() {
    var ids = visibleCardIds();
    var btn = $('#expand-all');
    btn.hidden = !ids.length;
    var allOpen = ids.length && ids.every(function (id) { return ui.openCards[id]; });
    btn.textContent = allOpen ? 'Collapse all' : 'Expand all';
  }

  function cardTextHtml(c) {
    var open = !!ui.openCards[c.id];
    var tid = 'ct-' + c.id;
    var body = c.text
      ? '<p>' + esc(c.text) + '</p>'
      : '<p class="tbc">Full effect not added yet. Check the printed card.</p>';
    return '<div class="card-text">' +
      '<button type="button" class="text-toggle" data-action="card-text" data-id="' + esc(c.id) + '" aria-expanded="' + open + '" aria-controls="' + esc(tid) + '">' +
      '<span>' + (open ? 'Hide effect' : 'Full effect') + '</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
      '<div class="text-body" id="' + esc(tid) + '"' + (open ? '' : ' hidden') + '>' + body + '</div></div>';
  }

  function cardHtml(c, q, control, granted) {
    var emblem = (c.factions || []).map(function (f) { return FACTIONS[f] ? FACTIONS[f].name : f; }).join(', ');
    return '<div class="game-card' + (q ? ' picked' : '') + (granted ? ' granted-card' : '') + (ui.openCards[c.id] ? ' text-open' : '') + '">' +
      '<div class="card-type"><span>' + esc(c.subtype || ({ fires: 'Fires', special: 'Special Intervention' }[c.type] || 'Intervention')) + '</span><span title="' + esc(SETS[c.set] ? SETS[c.set].name : c.set) + '">' + esc(SETS[c.set] ? SETS[c.set].short : c.set) + '</span></div>' +
      '<div class="card-name">' + esc(c.name) + (granted ? ' <span class="mono">×' + q + '</span>' : '') + '</div>' +
      (c.notes ? '<div class="card-notes">' + esc(c.notes) + '</div>' : '') +
      cardTextHtml(c) +
      '<div class="card-foot"><span class="count">' + (emblem ? esc(emblem) + ' only' : '') + '</span>' + control + '</div>' +
      '</div>';
  }

  function dtg(d) {
    var mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getUTCMonth()];
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getUTCDate()) + p(d.getUTCHours()) + p(d.getUTCMinutes()) + 'Z ' + mon + ' ' + String(d.getUTCFullYear()).slice(-2);
  }

  function forceLabel(s) {
    var f = FACTIONS[s.faction];
    if (!f) return 'No faction';
    return f.name + (s.ally && FACTIONS[s.ally] ? ' + ' + FACTIONS[s.ally].name : '');
  }

  function renderSummary() {
    var m = modeOf(state);
    $('#h-summary').textContent = state.name || 'Untitled force';
    $('#sheet-meta').textContent = m.name + ' · ' + forceLabel(state);
    $('#dtg').textContent = dtg(new Date());

    var bs = budgets(state);
    $('#budgets').innerHTML = bs.map(function (b, i) {
      var over = b.used > b.limit;
      var pct = Math.min(100, b.limit ? (b.used / b.limit) * 100 : 0);
      var left = b.limit - b.used;
      return '<div class="meter' + (over ? ' over' : '') + (i ? ' minor' : '') + '">' +
        (bs.length > 1 ? '<div class="meter-name">' + esc(b.name) + '</div>' : '') +
        '<div class="meter-nums"><span class="mono big">' + b.used + '</span><span class="mono">/ ' + b.limit + ' ' + PL + '</span>' +
        '<span class="meter-left">' + (left >= 0 ? left + ' left' : Math.abs(left) + ' over') + '</span></div>' +
        '<div class="meter-track"><div class="meter-fill" style="width:' + pct + '%"></div></div></div>';
    }).join('');

    var iss = issues(state);
    $('#issues').innerHTML = iss.map(function (i) { return '<li class="issue ' + i.level + '">' + esc(i.text) + '</li>'; }).join('');

    var deps = deployments(state);
    $('#sheet-units').innerHTML = deps.map(function (d) {
      var rows = depRows(state, d);
      if (!rows.length && d.id !== 'main') return '';
      return '<h3 class="sheet-h">' + esc(deps.length > 1 ? d.name : 'Team') + '</h3><ul class="sheet-list">' +
        (rows.length ? rows.map(function (r) {
          var extra = r.opts.map(function (x) { return x.o.name + (x.n < r.q || r.q > 1 ? ' ×' + x.n : ''); }).join(', ');
          return '<li><span class="q">' + r.q + '×</span><span class="n">' + esc(r.u.name) + (extra ? '<span class="sub">' + esc(extra) + '</span>' : '') + '</span><span class="p">' + r.cost + '</span></li>';
        }).join('') : '<li><span class="none">No units yet</span></li>') + '</ul>';
    }).join('');

    var il = cardLimit(state, 'intervention');
    var ic = pickedCards(state, 'intervention');
    $('#sheet-intervention').innerHTML = ic.length ? ic.map(function (r) {
      return '<li><span class="q">1×</span><span class="n">' + esc(r.c.name) + '</span><span class="p">' + esc(SETS[r.c.set] ? SETS[r.c.set].short : '') + '</span></li>';
    }).join('') : '<li><span class="none">None picked' + (il != null ? ' (hand of ' + il + ')' : '') + '</span></li>';

    var sc = pickedCards(state, 'special');
    $('#sheet-special-wrap').hidden = !sc.length;
    $('#sheet-special').innerHTML = sc.map(function (r) {
      return '<li><span class="q">1×</span><span class="n">' + esc(r.c.name) + '</span><span class="p">' + esc(SETS[r.c.set] ? SETS[r.c.set].short : '') + '</span></li>';
    }).join('');

    var fc = grantedFires(state).map(function (g) { return { c: g.c, q: g.n }; }).concat(pickedCards(state, 'fires'));
    var fireHtml = fc.map(function (r) {
      return '<li><span class="q">' + r.q + '×</span><span class="n">' + esc(r.c.name) + '</span><span class="p">' + esc(SETS[r.c.set] ? SETS[r.c.set].short : '') + '</span></li>';
    }).join('');
    fireHtml += fireSlots(state).map(function (sl) {
      var c = CARDS[state.slots[sl.id]];
      return '<li><span class="q">' + esc(slotShort(sl)) + '</span><span class="n">' + (c ? esc(c.name) : '<span class="tbc">Not placed</span>') + '</span><span class="p">' + (c ? 'PL' : '') + '</span></li>';
    }).join('');
    $('#sheet-fires').innerHTML = fireHtml || '<li><span class="none">None</span></li>';

    var errors = iss.filter(function (i) { return i.level === 'error'; }).length;
    var main = bs[0];
    var bar = $('#mobile-bar');
    bar.classList.toggle('over', errors > 0);
    $('#mb-used').textContent = main.used;
    $('#mb-limit').textContent = main.limit;
    $('#mb-status').textContent = errors ? plural(errors, 'problem') : plural(modelCount(state), 'model') + ' · ' + pickedCount(state, 'intervention') + ' Int';

    var nameInput = $('#roster-name');
    if (document.activeElement !== nameInput) nameInput.value = state.name;
  }

  function renderSaved() {
    var saved = storage.get(LS_SAVED, []) || [];
    $('#saved-count').textContent = saved.length ? String(saved.length) : '';
    var listEl = $('#saved-list');
    if (!saved.length) {
      listEl.innerHTML = '<li class="saved-empty">No saved forces yet. Press Save to keep the current one on this device.</li>';
      return;
    }
    listEl.innerHTML = saved.slice().sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); }).map(function (r) {
      var s = sanitize(r.state);
      var when = r.savedAt ? new Date(r.savedAt).toLocaleString() : '';
      var confirming = ui.pendingDelete === s.id;
      return '<li><span class="saved-name">' + esc(s.name || 'Untitled force') + '</span>' +
        '<span class="saved-meta">' + esc(modeOf(s).name + ' · ' + forceLabel(s) + ' · ' + when) + '</span>' +
        '<button type="button" class="btn" data-action="load-saved" data-id="' + esc(s.id) + '">Open</button>' +
        '<button type="button" class="btn danger" data-action="delete-saved" data-id="' + esc(s.id) + '">' + (confirming ? 'Confirm delete' : 'Delete') + '</button></li>';
    }).join('');
  }

  function renderFooter() {
    var links = [];
    if (D.repoUrl) links.push('<a href="' + esc(D.repoUrl) + '" target="_blank" rel="noopener">Source and issues on GitHub</a>');
    links.push('Data version ' + esc(D.version || ''));
    $('#footer-links').innerHTML = links.join(' · ');
  }

  function render() {
    renderMode();
    renderFaction();
    renderTeam();
    renderCards();
    renderSummary();
    storage.set(LS_CURRENT, state);
    storage.set(LS_UI, { cardTab: ui.cardTab, setFilter: ui.setFilter });
  }

  // ---------- toast and undo ----------
  var toastTimer = null;
  function toast(msg, undoState) {
    ui.undo = undoState || null;
    $('#toast-msg').textContent = msg;
    $('#toast-undo').hidden = !undoState;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('#toast').hidden = true; ui.undo = null; }, undoState ? 7000 : 3500);
  }

  // ---------- roster code / text ----------
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encodeRoster(s) {
    var compact = { v: 2, n: s.name, m: s.mode, p: s.points, f: s.faction, a: s.ally, on: s.on, u: s.units, o: s.opts, c: s.cards, s: s.slots };
    return 'BPRE2.' + b64encode(JSON.stringify(compact));
  }
  function decodeRoster(code) {
    code = String(code || '').trim();
    var m = code.match(/BPRE2\.([A-Za-z0-9_-]+)/);
    if (!m) throw new Error('That does not look like a force code. Codes start with BPRE2.');
    var o = JSON.parse(b64decode(m[1]));
    return sanitize({ name: o.n, mode: o.m, points: o.p, faction: o.f, ally: o.a, on: o.on, units: o.u, opts: o.o, cards: o.c, slots: o.s });
  }
  function rosterText(s) {
    var m = modeOf(s);
    var lines = [];
    lines.push((s.name || 'Untitled force').toUpperCase());
    lines.push(m.name + ' | ' + forceLabel(s));
    budgets(s).forEach(function (b) { lines.push(b.name + ': ' + b.used + '/' + b.limit + ' ' + PL); });
    deployments(s).forEach(function (d) {
      var rows = depRows(s, d);
      if (!rows.length && d.id !== 'main') return;
      lines.push('');
      lines.push(d.name.toUpperCase());
      if (!rows.length) lines.push('  none');
      rows.forEach(function (r) {
        var extra = r.opts.map(function (x) { return x.o.name + ' x' + x.n; }).join(', ');
        lines.push('  ' + r.q + 'x ' + r.u.name + (extra ? ' (' + extra + ')' : '') + ' [' + r.cost + ']');
      });
    });
    lines.push('');
    lines.push('INTERVENTION');
    var ic = pickedCards(s, 'intervention');
    if (!ic.length) lines.push('  none');
    ic.forEach(function (r) { lines.push('  ' + r.c.name + ' (' + SETS[r.c.set].name + ')'); });
    var sc = pickedCards(s, 'special');
    if (sc.length) {
      lines.push('');
      lines.push('SPECIAL INTERVENTION');
      sc.forEach(function (r) { lines.push('  ' + r.c.name); });
    }
    lines.push('');
    lines.push('FIRES');
    var g = grantedFires(s);
    var pf = pickedCards(s, 'fires');
    if (!g.length && !pf.length) lines.push('  none');
    g.forEach(function (x) { lines.push('  ' + x.n + 'x ' + x.c.name + ' (from units)'); });
    pf.forEach(function (r) { lines.push('  ' + r.c.name + ' (' + SETS[r.c.set].name + ')'); });
    fireSlots(s).forEach(function (sl) {
      var c = CARDS[s.slots[sl.id]];
      lines.push('  ' + sl.name + ': ' + (c ? c.name : 'not placed'));
    });
    return lines.join('\n');
  }

  function copy(text, okMsg) {
    function fallback() {
      var box = $('#import-box');
      var ta = $('#import-code');
      box.hidden = false;
      ta.value = text;
      ta.focus();
      ta.select();
      toast('Copy was blocked. The text is selected in the box below; copy it from there.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else fallback();
  }

  function replaceState(next, msg) {
    var prev = clone(state);
    state = next;
    render();
    toast(msg, prev);
  }

  // Re-run sanitize after a structural change and report what was dropped.
  function reshape(next, prev, why) {
    var before = modelCount(prev);
    state = sanitize(next);
    var after = modelCount(state);
    render();
    if (after < before) toast('Removed ' + plural(before - after, 'unit') + ' ' + why + '.', prev);
  }

  // ---------- theme ----------
  var LS_THEME = 'bpre-roster:theme';
  var THEMES = ['auto', 'light', 'dark'];
  var THEME_ICONS = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
  };
  var THEME_LABELS = { auto: 'Theme: match device', light: 'Theme: light', dark: 'Theme: dark' };
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  }
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try { if (t === 'auto') window.localStorage.removeItem(LS_THEME); else window.localStorage.setItem(LS_THEME, t); } catch (e) { /* ignore */ }
    var btn = $('#theme-btn');
    btn.innerHTML = THEME_ICONS[t];
    btn.setAttribute('aria-label', THEME_LABELS[t]);
    btn.title = THEME_LABELS[t];
  }

  // ---------- actions ----------
  function bump(map, depId, unitId, delta) {
    map[depId] = map[depId] || {};
    var v = (map[depId][unitId] || 0) + delta;
    if (v > 0) map[depId][unitId] = v; else delete map[depId][unitId];
  }

  var actions = {
    'set-mode': function (id) {
      if (!MODES[id] || id === state.mode) return;
      var prev = clone(state);
      var next = clone(state);
      var m = MODES[id];
      next.mode = id;
      var wasPreset = MODES[prev.mode].presets.some(function (p) { return p.points === prev.points; });
      if (wasPreset || !m.presets.some(function (p) { return p.points === next.points; })) next.points = m.defaultPoints;
      if (next.faction && !factionHasUnits(next.faction, id)) {
        state = sanitize(next);
        render();
        toast(FACTIONS[prev.faction].name + ' has no units in ' + m.name + '. Faction cleared.', prev);
        return;
      }
      reshape(next, prev, 'not available in ' + m.name);
    },
    'set-points': function (_, el) {
      var v = parseInt(el.getAttribute('data-value'), 10);
      if (v > 0) { state.points = v; render(); }
    },
    'set-faction': function (id) {
      if (!FACTIONS[id] || id === state.faction || !factionHasUnits(id, state.mode)) return;
      var prev = clone(state);
      var next = clone(state);
      next.faction = id;
      // Keep the old faction as ally when the pairing is legal.
      next.ally = allyChoices(id, state.mode).indexOf(prev.faction) !== -1 ? prev.faction : null;
      ui.dep = 'main';
      reshape(next, prev, 'that ' + FACTIONS[id].name + ' cannot field');
    },
    'set-ally': function (id) {
      var prev = clone(state);
      var next = clone(state);
      next.ally = id || null;
      reshape(next, prev, 'from the previous ally');
    },
    'set-dep': function (id) { ui.dep = id; render(); },
    'unit-inc': function (id) {
      var u = UNITS[id];
      if (!u) return;
      var r = ratioFor(id);
      var cd = currentDep();
      if (cd.allowedUnits && cd.allowedUnits.indexOf(id) === -1) return;
      if (r && !cd.reserve && ratioState(state, r).have >= ratioState(state, r).cap) return;
      bump(state.units, currentDep().id, id, 1);
      render();
    },
    'unit-dec': function (id) {
      var d = currentDep().id;
      if (!qty(state, d, id)) return;
      bump(state.units, d, id, -1);
      var q = qty(state, d, id);
      if (state.opts[d] && state.opts[d][id]) {
        Object.keys(state.opts[d][id]).forEach(function (o) {
          state.opts[d][id][o] = Math.min(state.opts[d][id][o], q);
          if (!state.opts[d][id][o]) delete state.opts[d][id][o];
        });
      }
      render();
    },
    'opt-inc': function (id, el) {
      var d = currentDep().id;
      var o = el.getAttribute('data-opt');
      if (optQty(state, d, id, o) >= qty(state, d, id)) return;
      state.opts[d] = state.opts[d] || {};
      state.opts[d][id] = state.opts[d][id] || {};
      state.opts[d][id][o] = optQty(state, d, id, o) + 1;
      render();
    },
    'opt-dec': function (id, el) {
      var d = currentDep().id;
      var o = el.getAttribute('data-opt');
      if (!optQty(state, d, id, o)) return;
      state.opts[d][id][o]--;
      if (!state.opts[d][id][o]) delete state.opts[d][id][o];
      render();
    },
    'card-tab': function (id) { ui.cardTab = id; render(); },
    'card-text': function (id) {
      if (ui.openCards[id]) delete ui.openCards[id]; else ui.openCards[id] = true;
      renderCards();
    },
    'expand-all': function () {
      var shown = visibleCardIds().map(function (id) { return CARDS[id]; });
      var allOpen = shown.every(function (c) { return ui.openCards[c.id]; });
      shown.forEach(function (c) { if (allOpen) delete ui.openCards[c.id]; else ui.openCards[c.id] = true; });
      renderCards();
    },
    'set-filter': function (id) {
      var i = ui.setFilter.indexOf(id);
      if (i === -1) ui.setFilter.push(id);
      else if (ui.setFilter.length > 1) ui.setFilter.splice(i, 1);
      render();
    },
    'card-toggle': function (id) {
      var c = CARDS[id];
      if (!c || c.granted) return;
      if (state.cards[id]) delete state.cards[id];
      else {
        var lim = cardLimit(state, c.type);
        if (lim != null && pickedCount(state, c.type) >= lim) return;
        state.cards[id] = 1;
      }
      render();
    },
    'slot-toggle': function (id, el) {
      var sl = el.getAttribute('data-slot');
      var c = CARDS[id];
      if (!c || !c.slot) return;
      if (state.slots[sl] === id) delete state.slots[sl];
      else {
        Object.keys(state.slots).forEach(function (k) { if (state.slots[k] === id) delete state.slots[k]; });
        state.slots[sl] = id;
      }
      render();
    },
    'new-roster': function () {
      var next = blankState();
      next.mode = state.mode;
      next.points = state.points;
      ui.dep = 'main';
      replaceState(next, 'Started a new force.');
    },
    'save-roster': function () {
      var saved = storage.get(LS_SAVED, []) || [];
      var i = saved.findIndex(function (r) { return r.state && r.state.id === state.id; });
      var entry = { savedAt: Date.now(), state: clone(state) };
      if (i === -1) saved.push(entry); else saved[i] = entry;
      if (storage.set(LS_SAVED, saved)) toast('Saved "' + (state.name || 'Untitled force') + '" on this device.');
      else toast('This browser blocked saving. Use Copy force code to keep it.');
      renderSaved();
    },
    'toggle-saved': function (_, el) {
      var p = $('#saved-panel');
      p.hidden = !p.hidden;
      el.setAttribute('aria-expanded', String(!p.hidden));
      ui.pendingDelete = null;
      renderSaved();
    },
    'load-saved': function (id) {
      var saved = storage.get(LS_SAVED, []) || [];
      var r = saved.filter(function (x) { return x.state && x.state.id === id; })[0];
      if (!r) return;
      $('#saved-panel').hidden = true;
      ui.dep = 'main';
      replaceState(sanitize(r.state), 'Opened "' + (r.state.name || 'Untitled force') + '".');
    },
    'delete-saved': function (id) {
      if (ui.pendingDelete !== id) { ui.pendingDelete = id; renderSaved(); return; }
      var saved = (storage.get(LS_SAVED, []) || []).filter(function (x) { return !(x.state && x.state.id === id); });
      storage.set(LS_SAVED, saved);
      ui.pendingDelete = null;
      renderSaved();
      toast('Deleted.');
    },
    'copy-text': function () { copy(rosterText(state), 'Force copied as text.'); },
    'copy-code': function () { copy(encodeRoster(state), 'Force code copied. Paste it into BPRE Force Builder to load it.'); },
    'toggle-import': function () {
      var box = $('#import-box');
      box.hidden = !box.hidden;
      if (!box.hidden) { $('#import-code').value = ''; $('#import-code').focus(); }
    },
    'load-code': function () {
      try {
        var next = decodeRoster($('#import-code').value);
        next.id = uid();
        $('#import-box').hidden = true;
        ui.dep = 'main';
        replaceState(next, 'Loaded "' + (next.name || 'Untitled force') + '".');
      } catch (e) {
        toast(e && e.message && e.message.indexOf('BPRE2') !== -1 ? e.message : 'That code could not be read. Check you copied all of it.');
      }
    },
    'share-link': function () {
      copy(location.href.split('#')[0] + '#' + encodeRoster(state), 'Share link copied.');
    },
    'export-json': function () {
      var blob = new Blob([JSON.stringify({ app: 'bpre-force-builder', dataVersion: D.version, force: state }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.name || 'bpre-force').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    },
    'print': function () { window.print(); },
    'cycle-theme': function () {
      var next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
      applyTheme(next);
      toast(THEME_LABELS[next] + '.');
    },
    'jump-summary': function () { $('#summary').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'undo': function () {
      if (!ui.undo) return;
      state = ui.undo;
      ui.undo = null;
      $('#toast').hidden = true;
      render();
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    var fn = actions[el.getAttribute('data-action')];
    if (fn) fn(el.getAttribute('data-id'), el, e);
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-toggle]')) {
      var id = t.getAttribute('data-toggle');
      var prev = clone(state);
      var next = clone(state);
      if (t.checked) next.on[id] = true; else delete next.on[id];
      if (t.checked && deployments(sanitize(next)).some(function (d) { return d.id === id; })) ui.dep = id;
      else if (ui.dep === id) ui.dep = 'main';
      reshape(next, prev, 'from ' + (id === 'qrf' ? 'the QRF' : 'that deployment'));
    }
  });

  $('#roster-name').addEventListener('input', function (e) {
    state.name = e.target.value.slice(0, 60);
    renderSummary();
    storage.set(LS_CURRENT, state);
  });

  $('#custom-points').addEventListener('change', function (e) {
    var v = parseInt(e.target.value, 10);
    if (v > 0 && v <= 5000) { state.points = v; render(); }
    else if (e.target.value !== '') { toast('Enter a points limit between 5 and 5000.'); e.target.value = ''; }
  });

  $('#import-file').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var o = JSON.parse(reader.result);
        var next = sanitize(o.force || o.roster || o);
        next.id = uid();
        ui.dep = 'main';
        replaceState(next, 'Imported "' + (next.name || 'Untitled force') + '".');
      } catch (err) {
        toast('That file is not a BPRE Force Builder export.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // Hide features the embedded preview frame cannot use.
  if (EMBEDDED) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-standalone]'), function (el) { el.hidden = true; });
  }

  // Load a roster from a share link (#BPRE2.xxxx).
  if (location.hash.indexOf('BPRE2.') !== -1) {
    try {
      var fromLink = decodeRoster(decodeURIComponent(location.hash.slice(1)));
      fromLink.id = uid();
      var prev = clone(state);
      state = fromLink;
      setTimeout(function () { toast('Loaded a shared force.', prev); }, 0);
    } catch (e) { /* ignore a bad link */ }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  }

  applyTheme(currentTheme());
  renderFooter();
  renderSaved();
  render();

  // Small API for tests and the console.
  window.BPRERoster = {
    getState: function () { return clone(state); },
    encode: function () { return encodeRoster(state); },
    decode: decodeRoster,
    text: function () { return rosterText(state); },
    issues: function () { return issues(state); },
    budgets: function () { return budgets(state).map(function (b) { return { id: b.id, used: b.used, limit: b.limit }; }); },
    granted: function () { return grantedFires(state).map(function (g) { return { card: g.c.id, n: g.n }; }); }
  };
})();
