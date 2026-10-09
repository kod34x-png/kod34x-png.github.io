(() => {
  "use strict";

  const CAMS = window.SEYR_CAMS || [];
  const $ = (s, el = document) => el.querySelector(s);

  // ---------- küçük depolama yardımcıları (tarayıcı izin vermezse sessizce geçer) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- dil ----------
  const T = {
    tr: {
      live: n => `${n} yerde şu an canlı`,
      go: "Beni bir yere götür",
      all: "Tümü", avrupa: "Avrupa", asya: "Asya", afrika: "Afrika", amerika: "Amerika", okyanusya: "Okyanusya",
      fav: "Favoriler", golden: "Gün doğumu ve batımı",
      emptyFav: "Henüz favorin yok. İzlerken kalbe dokun, burada görünür.",
      emptyGolden: "Şu an gün doğumu ya da batımı yaşanan bir yer yok. Biraz sonra tekrar bak.",
      day: "Gündüz", night: "Gece", sunrise: "Gün doğuyor", sunset: "Gün batıyor",
      favBtn: "Favori", share: "Paylaş", random: "Rastgele", soundOn: "Sesi aç", soundOff: "Sesi kapat",
      hint: "Yukarı kaydır, sonraki yer",
      down: "Bu yayın şu an kapalı. Sıradakine geçiliyor.",
      endTitle: "Bu listeyi bitirdin", again: "Baştan başla", toMap: "Haritaya dön",
      copied: "Link kopyalandı", added: "Favorilere eklendi", removed: "Favorilerden çıkarıldı",
      source: s => `Yayın: ${s}`, shareText: c => `Şu an ${c} canlı, Seyr'de izliyorum:`,
      langBtn: "EN", back: "Geri", home: "Haritaya dön",
    },
    en: {
      live: n => `${n} places live right now`,
      go: "Take me somewhere",
      all: "All", avrupa: "Europe", asya: "Asia", afrika: "Africa", amerika: "Americas", okyanusya: "Oceania",
      fav: "Favourites", golden: "Sunrise and sunset",
      emptyFav: "No favourites yet. Tap the heart while watching and it shows up here.",
      emptyGolden: "Nowhere on the list is at sunrise or sunset right now. Check back soon.",
      day: "Daytime", night: "Night", sunrise: "Sunrise", sunset: "Sunset",
      favBtn: "Favourite", share: "Share", random: "Random", soundOn: "Sound on", soundOff: "Sound off",
      hint: "Swipe up for the next place",
      down: "This stream is offline right now. Moving to the next one.",
      endTitle: "You've seen this whole list", again: "Start over", toMap: "Back to map",
      copied: "Link copied", added: "Added to favourites", removed: "Removed from favourites",
      source: s => `Stream: ${s}`, shareText: c => `${c} is live right now, watching on Seyr:`,
      langBtn: "TR", back: "Back", home: "Back to map",
    },
  };
  let lang = store.get("seyr.lang", (navigator.language || "tr").toLowerCase().startsWith("tr") ? "tr" : "en");
  const t = k => T[lang][k];
  const cityName = c => (lang === "tr" ? c.city : c.cityEn);
  const spotName = c => (lang === "tr" ? c.spot : c.spotEn);
  const countryName = c => (lang === "tr" ? c.country : c.countryEn);

  // ---------- güneş hesabı ----------
  const RAD = Math.PI / 180;
  function sunNow(date = new Date()) {
    const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 864e5;
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD;
    const dec = Math.asin(Math.sin(e) * Math.sin(L)) / RAD;
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    let lon = ra - gmst * 15;
    lon = ((lon + 540) % 360) - 180;
    return { dec, lon };
  }
  function sunState(c, sun = sunNow()) {
    let H = c.lon - sun.lon;
    H = ((H + 540) % 360) - 180;
    const alt = Math.asin(Math.sin(c.lat * RAD) * Math.sin(sun.dec * RAD) + Math.cos(c.lat * RAD) * Math.cos(sun.dec * RAD) * Math.cos(H * RAD)) / RAD;
    if (alt > 7) return "day";
    if (alt > -5) return H < 0 ? "sunrise" : "sunset";
    return "night";
  }
  const sunClass = s => (s === "day" ? "sun-day" : s === "night" ? "sun-night" : "sun-twilight");
  const localTime = c => new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: c.tz }).format(new Date());
  const thumb = c => `https://i.ytimg.com/vi/${c.yt}/hqdefault.jpg`;

  // ---------- favoriler ve kapalı yayınlar ----------
  let favs = new Set(store.get("seyr.favs", []));
  const saveFavs = () => store.set("seyr.favs", [...favs]);
  let broken = store.get("seyr.broken", {});
  const DOWN_MS = 30 * 60e3;
  const bkey = c => `${c.id}:${c.yt}`;
  const isUp = c => !c.serverDown && (!broken[bkey(c)] || Date.now() - broken[bkey(c)] > DOWN_MS);

  // Günlük yayın bekçisinin (GitHub Actions) yazdığı durum: yeni adresler ve kapalı yayınlar.
  function applyStatus(st) {
    if (!st || !st.cams) return;
    CAMS.forEach(c => {
      const s = st.cams[c.id]; if (!s) return;
      if (s.yt) c.yt = s.yt;
      c.serverDown = s.ok === false;
    });
  }
  const upCams = () => CAMS.filter(isUp);

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  // ---------- ana sayfa ----------
  const CHIPS = ["all", "avrupa", "asya", "afrika", "amerika", "okyanusya", "golden", "fav"];
  let filter = "all";

  function filtered() {
    const sun = sunNow();
    let list = upCams();
    if (filter === "fav") list = list.filter(c => favs.has(c.id));
    else if (filter === "golden") list = list.filter(c => { const s = sunState(c, sun); return s === "sunrise" || s === "sunset"; });
    else if (filter !== "all") list = list.filter(c => c.continent === filter);
    const rank = { day: 0, sunrise: 1, sunset: 1, night: 2 };
    return list.slice().sort((a, b) => rank[sunState(a, sun)] - rank[sunState(b, sun)]);
  }

  function renderHome() {
    document.documentElement.lang = lang;
    $("#langBtn").textContent = t("langBtn");
    $("#liveLine").innerHTML = `<span class="live-dot"></span>${t("live")(upCams().length)}`;
    $("#goRandom").innerHTML = `<span>${t("go")}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`;
    $("#chips").innerHTML = CHIPS.map(k => `<button class="chip" role="tab" data-k="${k}" aria-selected="${k === filter}">${t(k)}</button>`).join("");
    const list = filtered();
    const sun = sunNow();
    $("#strip").innerHTML = list.map((c, i) => {
      const s = sunState(c, sun);
      return `<button class="card" data-i="${i}" type="button">
        <div class="card-img"><img src="${thumb(c)}" alt="" loading="lazy"><span class="card-sun ${sunClass(s)}"></span>${favs.has(c.id) ? '<span class="card-fav">❤️</span>' : ""}</div>
        <div class="card-city">${c.flag} ${cityName(c)}</div>
        <div class="card-time">${localTime(c)} · ${t(s)}</div>
      </button>`;
    }).join("");
    const empty = $("#empty");
    if (!list.length) { empty.hidden = false; empty.textContent = filter === "fav" ? t("emptyFav") : t("emptyGolden"); }
    else empty.hidden = true;
    renderPins();
  }

  $("#chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    filter = b.dataset.k; renderHome();
    $("#strip").scrollTo({ left: 0 });
  });
  $("#strip").addEventListener("click", e => {
    const b = e.target.closest(".card"); if (!b) return;
    openPlayer(filtered(), +b.dataset.i);
  });
  $("#goRandom").addEventListener("click", () => openPlayer(shuffle(upCams()), 0));
  $("#langBtn").addEventListener("click", () => {
    lang = lang === "tr" ? "en" : "tr"; store.set("seyr.lang", lang); renderHome();
  });

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- harita ----------
  let map, pinLayer, nightLayer;
  function initMap() {
    if (!window.L) return;
    map = L.map("map", {
      zoomControl: false, minZoom: 1, maxZoom: 6, zoomSnap: 0.1, attributionControl: true,
      maxBounds: [[-75, -200], [85, 200]], maxBoundsViscosity: 0.8,
    });
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
    // Dünya haritası uygulamanın içinde: dış servise ve anahtara bağlı değil.
    fetch("lib/land.json").then(r => r.json()).then(land => {
      L.geoJSON(land, { interactive: false, style: { fillColor: "#2B4262", fillOpacity: 1, color: "#3A5679", weight: 0.6 } }).addTo(map).bringToBack();
    }).catch(() => {});
    nightLayer = L.layerGroup().addTo(map);
    pinLayer = L.layerGroup().addTo(map);
    fitWorld();
    window.addEventListener("resize", fitWorld);
  }
  function fitWorld() {
    if (!map) return;
    const sheetH = $(".sheet").offsetHeight || 260;
    const wide = innerWidth >= 720;
    map.fitBounds([[-45, -130], [58, 150]], { paddingTopLeft: [wide ? 560 : 10, 90], paddingBottomRight: [10, wide ? 20 : sheetH - 10] });
  }
  function renderNight() {
    if (!map) return;
    nightLayer.clearLayers();
    const sun = sunNow();
    const dec = Math.abs(sun.dec) < 0.1 ? 0.1 : sun.dec;
    const pts = [];
    for (let lon = -540; lon <= 540; lon += 2) {
      const lat = Math.atan(-Math.cos((lon - sun.lon) * RAD) / Math.tan(dec * RAD)) / RAD;
      pts.push([Math.max(-85, Math.min(85, lat)), lon]);
    }
    const pole = dec > 0 ? -85 : 85;
    const poly = pts.concat([[pole, 540], [pole, -540]]);
    L.polygon(poly, { stroke: false, fillColor: "#030A16", fillOpacity: 0.6, interactive: false }).addTo(nightLayer);
    // alacakaranlık şeridi
    const band = pts.map(([la, lo]) => [la, lo]);
    L.polyline(band, { color: "#E07A8F", weight: 1.2, opacity: 0.45, interactive: false }).addTo(nightLayer);
  }
  function renderPins() {
    if (!map) return;
    renderNight();
    pinLayer.clearLayers();
    const sun = sunNow();
    const list = filtered();
    list.forEach((c, i) => {
      const icon = L.divIcon({ className: "", html: `<div class="pin ${sunClass(sunState(c, sun))}" title="${cityName(c)}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
      L.marker([c.lat, c.lon], { icon, keyboard: true, title: cityName(c) }).on("click", () => openPlayer(list, i)).addTo(pinLayer);
    });
  }

  // ---------- YouTube ----------
  let ytReady;
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(res => {
      if (window.YT && window.YT.Player) return res();
      window.onYouTubeIframeAPIReady = () => res();
      const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(s);
    });
    return ytReady;
  }

  // ---------- izleme ----------
  let feedList = [], active = -1, ytPlayer = null, soundOn = false, playerOpen = false;
  const feed = $("#feed");
  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.4 5c2 0 3.3 1.1 4.1 2.4h3c.8-1.3 2.1-2.4 4.1-2.4 3.4 0 5.1 3.4 3.6 6.4C19 15.6 12 20 12 20z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/></svg>',
    dice: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8.5a5 5 0 010 7M19.5 6a8.5 8.5 0 010 12"/></svg>',
  };

  function slideHTML(c, i) {
    return `<section class="slide" data-i="${i}" aria-label="${cityName(c)}">
      <div class="slide-bg" style="background-image:url('${thumb(c)}')"></div>
      <div class="frame"><img class="frame-thumb" src="${thumb(c)}" alt=""><div class="yt-holder"></div></div>
      <div class="info">
        <h2 class="info-place">${c.flag} ${cityName(c)}</h2>
        <p class="info-spot">${spotName(c)}, ${countryName(c)}</p>
        <div class="facts"><span class="fact f-time"></span><span class="fact f-weather" hidden></span></div>
        <a class="source" href="https://www.youtube.com/watch?v=${c.yt}" target="_blank" rel="noopener">${t("source")(c.source)}</a>
      </div>
      <div class="actions">
        <button class="act a-fav ${favs.has(c.id) ? "on" : ""}" type="button" aria-pressed="${favs.has(c.id)}"><span class="ic">${ICON.heart}</span>${t("favBtn")}</button>
        <button class="act a-share" type="button"><span class="ic">${ICON.share}</span>${t("share")}</button>
        <button class="act a-random" type="button"><span class="ic">${ICON.dice}</span>${t("random")}</button>
        <button class="act a-sound" type="button"><span class="ic">${soundOn ? ICON.sound : ICON.mute}</span><span class="lbl">${soundOn ? t("soundOff") : t("soundOn")}</span></button>
      </div>
    </section>`;
  }
  function endHTML() {
    return `<section class="slide end" data-end="1"><div>
      <h2>${t("endTitle")}</h2>
      <button class="go e-again" type="button">${t("again")}</button>
      <button class="ghost e-map" type="button">${t("toMap")}</button>
    </div></section>`;
  }

  function openPlayer(list, start, push = true) {
    feedList = list.length ? list : upCams();
    start = Math.max(0, Math.min(start, feedList.length - 1));
    feed.innerHTML = feedList.map(slideHTML).join("") + endHTML();
    $("#player").hidden = false; playerOpen = true;
    active = -1;
    requestAnimationFrame(() => {
      feed.scrollTop = start * feed.clientHeight;
      observeSlides();
      activate(start);
    });
    $("#backBtn").setAttribute("aria-label", t("back"));
    $("#homeBtn").setAttribute("aria-label", t("home"));
    if (push) history.pushState({ seyr: "player" }, "", `?cam=${feedList[start].id}`);
    if (!store.get("seyr.hinted", false)) { const h = $("#hint"); h.textContent = t("hint"); h.hidden = false; }
    loadYT();
  }

  function closePlayer(fromPop = false) {
    stopPlayer();
    playerOpen = false; active = -1;
    $("#player").hidden = true; feed.innerHTML = "";
    if (!fromPop && history.state && history.state.seyr === "player") history.back();
    else if (!fromPop) history.replaceState(null, "", location.pathname);
    renderHome();
  }

  function stopPlayer() {
    if (ytPlayer) { try { ytPlayer.destroy(); } catch {} ytPlayer = null; }
  }

  let io;
  function observeSlides() {
    if (io) io.disconnect();
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          const el = en.target;
          if (el.dataset.end) { stopPlayer(); active = feedList.length; $("#topTitle").textContent = ""; return; }
          activate(+el.dataset.i);
        }
      });
    }, { root: feed, threshold: [0.6] });
    feed.querySelectorAll(".slide").forEach(s => io.observe(s));
  }

  function slideEl(i) { return feed.querySelector(`.slide[data-i="${i}"]`); }
  function resetFrame(el) {
    const f = el.querySelector(".frame");
    f.querySelectorAll("iframe, .yt-holder").forEach(n => n.remove());
    const h = document.createElement("div"); h.className = "yt-holder";
    f.insertBefore(h, f.querySelector(".down"));
    return h;
  }

  async function activate(i) {
    if (i === active || !feedList[i]) return;
    if (active >= 0 && i !== active && !store.get("seyr.hinted", false)) { store.set("seyr.hinted", true); $("#hint").hidden = true; }
    stopPlayer();
    const prev = slideEl(active);
    if (prev) resetFrame(prev);
    active = i;
    const c = feedList[i];
    $("#topTitle").textContent = `${c.flag} ${cityName(c)}`;
    if (playerOpen && history.state && history.state.seyr === "player") history.replaceState({ seyr: "player" }, "", `?cam=${c.id}`);
    updateFacts(i);
    loadWeather(i);
    await loadYT();
    if (active !== i || !playerOpen) return;
    const holder = resetFrame(slideEl(i));
    ytPlayer = new YT.Player(holder, {
      videoId: c.yt,
      playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1 },
      events: {
        onReady: e => { if (soundOn) e.target.unMute(); e.target.playVideo(); },
        onError: () => markDown(i),
      },
    });
  }

  function updateFacts(i) {
    const c = feedList[i], el = slideEl(i); if (!el) return;
    const s = sunState(c);
    el.querySelector(".f-time").innerHTML = `<span class="dot ${sunClass(s)}"></span>${localTime(c)} · ${t(s)}`;
  }

  // ---------- hava durumu ----------
  const wxCache = {};
  function wxLabel(code, s) {
    const night = s === "night";
    const m = [
      [[0], night ? "🌙" : "☀️", "Açık", "Clear"], [[1, 2], night ? "🌙" : "🌤️", "Az bulutlu", "Partly cloudy"], [[3], "☁️", "Bulutlu", "Cloudy"],
      [[45, 48], "🌫️", "Sisli", "Foggy"], [[51, 53, 55, 56, 57], "🌦️", "Çisenti", "Drizzle"], [[61, 63, 65, 66, 67, 80, 81, 82], "🌧️", "Yağmurlu", "Rain"],
      [[71, 73, 75, 77, 85, 86], "🌨️", "Karlı", "Snow"], [[95, 96, 99], "⛈️", "Fırtınalı", "Storm"],
    ].find(r => r[0].includes(code));
    return m ? `${m[1]} ${lang === "tr" ? m[2] : m[3]}` : "";
  }
  async function loadWeather(i) {
    const c = feedList[i];
    try {
      let w = wxCache[c.id];
      if (!w || Date.now() - w.at > 15 * 60e3) {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code`);
        const j = await r.json();
        w = wxCache[c.id] = { at: Date.now(), temp: Math.round(j.current.temperature_2m), code: j.current.weather_code };
      }
      const el = slideEl(i); if (!el) return;
      const f = el.querySelector(".f-weather");
      f.textContent = `${wxLabel(w.code, sunState(c))} ${w.temp}°`;
      f.hidden = false;
    } catch {}
  }

  // ---------- kapalı yayın ----------
  function markDown(i) {
    const c = feedList[i]; if (!c) return;
    broken[bkey(c)] = Date.now(); store.set("seyr.broken", broken);
    const el = slideEl(i); if (!el) return;
    const d = document.createElement("div"); d.className = "down"; d.textContent = t("down");
    el.querySelector(".frame").appendChild(d);
    setTimeout(() => { if (active === i && playerOpen) goTo(i + 1); }, 1800);
  }

  function goTo(i) { feed.scrollTo({ top: i * feed.clientHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }

  // ---------- izleme ekranı düğmeleri ----------
  feed.addEventListener("click", async e => {
    const slide = e.target.closest(".slide"); if (!slide) return;
    if (e.target.closest(".e-again")) { feed.scrollTo({ top: 0 }); return; }
    if (e.target.closest(".e-map")) { closePlayer(); return; }
    const i = +slide.dataset.i, c = feedList[i]; if (!c) return;
    if (e.target.closest(".a-fav")) {
      const b = e.target.closest(".a-fav");
      if (favs.has(c.id)) { favs.delete(c.id); toast(t("removed")); } else { favs.add(c.id); toast(t("added")); }
      saveFavs(); b.classList.toggle("on", favs.has(c.id)); b.setAttribute("aria-pressed", favs.has(c.id));
    } else if (e.target.closest(".a-share")) {
      const url = `${location.origin}${location.pathname}?cam=${c.id}`;
      const text = t("shareText")(cityName(c));
      if (navigator.share) { try { await navigator.share({ title: "Seyr", text, url }); } catch {} }
      else { try { await navigator.clipboard.writeText(`${text} ${url}`); toast(t("copied")); } catch {} }
    } else if (e.target.closest(".a-random")) {
      if (feedList.length < 2) return;
      let j; do { j = Math.floor(Math.random() * feedList.length); } while (j === i);
      feed.scrollTo({ top: j * feed.clientHeight });
    } else if (e.target.closest(".a-sound")) {
      soundOn = !soundOn;
      if (ytPlayer) { try { soundOn ? ytPlayer.unMute() : ytPlayer.mute(); if (soundOn) ytPlayer.playVideo(); } catch {} }
      feed.querySelectorAll(".a-sound").forEach(b => { b.querySelector(".ic").innerHTML = soundOn ? ICON.sound : ICON.mute; b.querySelector(".lbl").textContent = soundOn ? t("soundOff") : t("soundOn"); });
    }
  });

  $("#backBtn").addEventListener("click", () => closePlayer());
  $("#homeBtn").addEventListener("click", () => { filter = "all"; closePlayer(); fitWorld(); });
  window.addEventListener("popstate", () => { if (playerOpen && !(history.state && history.state.seyr === "player")) closePlayer(true); });
  document.addEventListener("keydown", e => {
    if (!playerOpen) return;
    if (e.key === "Escape") closePlayer();
    if (e.key === "ArrowDown") { e.preventDefault(); goTo(active + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); goTo(Math.max(0, active - 1)); }
  });

  // ---------- saat ve harita güncelleme ----------
  setInterval(() => {
    if (playerOpen && active >= 0 && active < feedList.length) updateFacts(active);
    else if (!playerOpen) renderHome();
  }, 60e3);

  // ---------- başlat ----------
  initMap();
  renderHome();
  // Bekçinin son sonucu GitHub'dan doğrudan okunur (site yeniden yayınlanmayı beklemeden), olmazsa yerel kopya.
  const STATUS_URL = "https://raw.githubusercontent.com/kod34x-png/kod34x-png.github.io/main/seyr/status.json";
  fetch(STATUS_URL, { cache: "no-store" }).then(r => r.ok ? r : fetch("status.json", { cache: "no-store" }))
    .catch(() => fetch("status.json", { cache: "no-store" }))
    .then(r => r.ok ? r.json() : null).then(st => {
    applyStatus(st);
    if (!playerOpen) renderHome();
  }).catch(() => {});
  const want = new URLSearchParams(location.search).get("cam");
  if (want) {
    const list = upCams();
    const idx = list.findIndex(c => c.id === want);
    history.replaceState(null, "", location.pathname);
    if (idx >= 0) openPlayer(list, idx);
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
