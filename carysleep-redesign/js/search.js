// Site search: ranks the sections in search-index.json against the words in ?q= and lists the best matches.
(function () {
  var form = document.querySelector(".search-big");
  var input = document.getElementById("q");
  var status = document.querySelector(".search-status");
  var list = document.querySelector(".search-results");
  var query = (new URLSearchParams(location.search).get("q") || "").trim();
  input.value = query;
  if (!query) {
    status.textContent = "Type a word or two, like “sleep study” or “inhaler”.";
    input.focus();
    return;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  // "inhalers" should find "inhaler": compare on a rough word stem
  function stem(w) {
    return w.length > 4 ? w.replace(/(ies|es|s|ing|ed)$/, "") : w;
  }
  var terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; }).map(stem);

  function count(haystack, term) {
    var n = 0, i = haystack.indexOf(term);
    while (i !== -1) { n++; i = haystack.indexOf(term, i + term.length); }
    return n;
  }

  function snippet(text) {
    var lower = text.toLowerCase(), at = -1;
    terms.forEach(function (t) { var i = lower.indexOf(t); if (i !== -1 && (at === -1 || i < at)) at = i; });
    var start = Math.max(0, at - 70);
    var cut = text.slice(start, start + 220);
    var out = (start > 0 ? "…" : "") + escapeHtml(cut) + (start + 220 < text.length ? "…" : "");
    terms.forEach(function (t) {
      out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[a-z]*)", "gi"), "<mark>$1</mark>");
    });
    return out;
  }

  fetch("search-index.json")
    .then(function (r) { return r.json(); })
    .then(function (pages) {
      var hits = [];
      pages.forEach(function (page) {
        var title = page.title.toLowerCase();
        page.sections.forEach(function (sec) {
          var heading = sec.heading.toLowerCase(), text = sec.text.toLowerCase();
          var score = 0, matched = 0;
          terms.forEach(function (t) {
            var s = count(title, t) * 8 + count(heading, t) * 5 + Math.min(count(text, t), 6);
            if (s) matched++;
            score += s;
          });
          // every word must appear somewhere in the section, its heading or its page title
          if (matched === terms.length && score) {
            hits.push({ page: page, sec: sec, score: score });
          }
        });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      // at most three results per page, so one long page can't fill the list
      var perPage = {}, shown = hits.filter(function (h) {
        perPage[h.page.url] = (perPage[h.page.url] || 0) + 1;
        return perPage[h.page.url] <= 3;
      }).slice(0, 15);

      if (!shown.length) {
        status.innerHTML = "No results for “" + escapeHtml(query) + "”. Try a different word, or call us at " +
          '<a href="tel:+19194398580">(919) 439 8580</a>.';
        return;
      }
      status.textContent = shown.length + (shown.length === 1 ? " result" : " results") + " for “" + query + "”";
      list.innerHTML = shown.map(function (h) {
        var href = h.page.url + (h.sec.id ? "#" + h.sec.id : "");
        var heading = h.sec.heading !== h.page.title ? " › " + escapeHtml(h.sec.heading) : "";
        return '<li class="search-hit"><a href="' + href + '"><span class="hit-title">' + escapeHtml(h.page.title) + heading +
          '</span><span class="hit-text">' + snippet(h.sec.text || h.sec.heading) + "</span></a></li>";
      }).join("");
    })
    .catch(function () {
      status.textContent = "Search isn't available right now. Please browse the menu or call us at (919) 439 8580.";
    });

  form.addEventListener("submit", function () { input.blur(); });
})();
