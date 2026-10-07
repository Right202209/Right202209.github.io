(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  var modal = document.getElementById('search');
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var index = null, sel = 0;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(window.SEARCH_INDEX).then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; });
  }
  function open() { modal.hidden = false; input.value = ''; list.innerHTML = ''; input.focus(); load(); }
  function close() { modal.hidden = true; }
  function render(q) {
    q = q.trim().toLowerCase();
    if (!q || !index) { list.innerHTML = ''; return; }
    var hits = index.filter(function (p) {
      return (p.title + ' ' + p.text).toLowerCase().indexOf(q) > -1;
    }).slice(0, 8);
    sel = 0;
    list.innerHTML = hits.length ? hits.map(function (p, i) {
      return '<li><a href="' + p.url + '"' + (i === 0 ? ' class="sel"' : '') + '>' + p.title + '<small>' + p.date + '</small></a></li>';
    }).join('') : '<li style="padding:10px 14px;color:var(--muted)">Nothing yet. Perhaps that is the answer.</li>';
  }

  document.getElementById('search-open').addEventListener('click', open);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  input.addEventListener('input', function () { load().then(function () { render(input.value); }); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modal.hidden ? open() : close(); }
    if (modal.hidden) return;
    var links = list.querySelectorAll('a');
    if (e.key === 'Escape') close();
    if (!links.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      links[sel].classList.remove('sel');
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[sel].classList.add('sel');
    }
    if (e.key === 'Enter') links[sel].click();
  });
})();
