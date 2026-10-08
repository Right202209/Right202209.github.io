/* Life in Weeks — ported from weeks.ginatrapani.org (Gina Trapani, after Buster Benson). */
(function () {
  var root = document.getElementById("weeks");
  var data = JSON.parse(document.getElementById("weeks-data").textContent);
  var zh = (root.dataset.lang || "").indexOf("zh") === 0;
  var DAY = 864e5, WEEK = 7 * DAY;

  var parse = function (s) { var p = String(s).slice(0, 10).split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); };
  var addYears = function (t, n) { var d = new Date(t); return Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var fmt = function (t) {
    var d = new Date(t);
    return zh ? d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate())
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  };
  var label = function (o) { return (zh ? o.zh : o.en) || o.zh || o.en || ""; };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  var born = parse(data.birthday), years = Number(data.life_expectancy) || 80;
  var n = new Date(), today = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  var startOf = function (o) { return o.start ? parse(o.start) : addYears(born, Number(o.age) || 0); };
  var timeline = function (list) { return (list || []).map(function (o) { return { t: startOf(o), o: o }; }).sort(function (a, b) { return a.t - b.t; }); };
  var at = function (line, t) { var hit = null; line.forEach(function (x) { if (x.t <= t) hit = x.o; }); return hit; };
  var eras = timeline(data.eras), places = timeline(data.places);
  var events = (data.events || []).map(function (e) { return { t: parse(e.date), o: e }; }).sort(function (a, b) { return a.t - b.t; });

  var grid = root.querySelector(".weeks-grid"), nav = root.querySelector(".weeks-nav"), tip = root.querySelector(".weeks-tip");
  var frag = document.createDocumentFragment(), ei = 0;

  var chip = function (text, t, cls, info) {
    var c = el("button", "wk-chip" + (cls ? " " + cls : ""), text);
    c.type = "button"; c.dataset.tip = info; if (t > today) c.classList.add("is-future");
    frag.appendChild(c); return c;
  };

  for (var age = 0; age <= years; age++) {
    var from = addYears(born, age), to = addYears(born, age + 1);
    var year = new Date(from).getUTCFullYear();
    var c = age === 0
      ? chip(zh ? "🐣 出生" : "🐣 I was born", from, "is-birth", fmt(from) + (zh ? " · 来到这个世界" : " · Born"))
      : chip(zh ? "🎂 " + age + " 岁 · " + year : "🎂 " + age + " in " + year, from, "is-birthday",
             fmt(from) + (zh ? " · 满 " + age + " 岁" : " · Turned " + age));
    if (age % 10 === 0) {
      c.id = "decade-" + age;
      var a = el("a", null, age === 0 ? (zh ? "出生" : "Birth") : age === 10 ? (zh ? "十几岁" : "Teens") : zh ? age + " 岁" : age + "s");
      a.href = "#decade-" + age; nav.appendChild(a);
    }
    if (age === years) { chip(zh ? "☠️ 预期寿命" : "☠️ Life expectancy", from, "is-end", fmt(from)); break; }

    for (var w = from, wi = 1; w < to; w += WEEK, wi++) {
      var end = Math.min(w + WEEK, to);
      while (ei < events.length && events[ei].t < end) {
        var e = events[ei++].o;
        if (parse(e.date) >= born) chip((e.emoji ? e.emoji + " " : "") + label(e), parse(e.date), "is-event", fmt(parse(e.date)) + " · " + label(e));
      }
      var era = at(eras, w), place = at(places, w);
      var b = el("button", "wk");
      b.type = "button"; b.setAttribute("aria-label", fmt(w));
      if (era && era.color) b.style.setProperty("--era", era.color);
      if (place && place.color) b.style.setProperty("--place", place.color);
      if (w > today) b.classList.add("is-future");
      else {
        if (today < w + WEEK) b.classList.add("is-now");
        var bits = [era && label(era), place && (zh ? "在" + label(place) : "in " + label(place))].filter(Boolean);
        b.dataset.tip = fmt(w) + (zh ? " · " + age + " 岁第 " + wi + " 周" : " · age " + age + ", week " + wi) + (bits.length ? " · " + bits.join(zh ? "，" : ", ") : "");
      }
      frag.appendChild(b);
    }
  }
  grid.appendChild(frag);

  // Tooltip: hover on desktop, tap anywhere.
  var show = function (t) {
    if (!t || !t.dataset.tip || t.classList.contains("is-future")) { tip.hidden = true; return; }
    tip.textContent = t.dataset.tip; tip.hidden = false;
    var r = t.getBoundingClientRect(), w = tip.offsetWidth;
    var x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, document.documentElement.clientWidth - w - 8));
    tip.style.left = x + window.scrollX + "px"; tip.style.top = r.bottom + window.scrollY + 8 + "px";
  };
  grid.addEventListener("mouseover", function (e) { if (matchMedia("(hover: hover)").matches) show(e.target.closest("button")); });
  grid.addEventListener("mouseleave", function () { tip.hidden = true; });
  grid.addEventListener("click", function (e) { show(e.target.closest("button")); });
  grid.addEventListener("focusin", function (e) { show(e.target.closest("button")); });
  document.addEventListener("click", function (e) { if (!grid.contains(e.target)) tip.hidden = true; });

  var now = grid.querySelector(".is-now");
  if (now && !location.hash) setTimeout(function () { now.scrollIntoView({ block: "center", behavior: "smooth" }); }, 400);
})();
