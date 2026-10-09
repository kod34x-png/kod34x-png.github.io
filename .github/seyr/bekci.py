"""Seyr yayın bekçisi.

Her kamerayı YouTube'dan kontrol eder:
- Video gömülebiliyor mu (oEmbed)?
- Şu an canlı mı?
- Değilse, aynı kanalın şu anki canlı yayını var mı? Varsa yeni adresi kullan.
Sonucu seyr/status.json dosyasına yazar. Uygulama açılırken bu dosyayı okur.
Sadece Python standart kütüphanesi kullanır.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAMS_JS = ROOT / "seyr" / "cams.js"
STATUS = ROOT / "seyr" / "status.json"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.8", "Cookie": "SOCS=CAI; CONSENT=YES+cb"}


def get(url, timeout=20):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.geturl(), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, url, ""
    except Exception as e:  # ağ hatası
        return 0, url, str(e)


def oembed(vid):
    code, _, body = get("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}"))
    info = {}
    if code == 200:
        try:
            info = json.loads(body)
        except ValueError:
            pass
    return code, info


def watch_state(html):
    """Sayfadan canlılık bilgisini çıkar. Bilinmiyorsa None döner."""
    if not html or "ytInitialPlayerResponse" not in html:
        return None
    if re.search(r'"isLiveNow"\s*:\s*true', html):
        return "live"
    if re.search(r'"isLiveNow"\s*:\s*false', html):
        return "ended"
    if re.search(r'"status"\s*:\s*"(ERROR|UNPLAYABLE)"', html):
        return "dead"
    return None


def channel_live(channel_url):
    """Kanalın şu anki canlı yayınının video kimliğini bul."""
    if not channel_url:
        return None
    code, final, html = get(channel_url.rstrip("/") + "/live")
    if code != 200:
        return None
    m = re.search(r'<link rel="canonical" href="https://www\.youtube\.com/watch\?v=([\w-]{11})"', html)
    if not m:
        m = re.search(r"[?&]v=([\w-]{11})", final)
    if not m or watch_state(html) != "live":
        return None
    return m.group(1)


def load_cams():
    text = CAMS_JS.read_text(encoding="utf-8")
    cams = []
    for line in text.splitlines():
        mid = re.search(r'\bid:\s*"([^"]+)"', line)
        myt = re.search(r'\byt:\s*"([\w-]{11})"', line)
        mimg = re.search(r'\bimg:\s*"([^"]+)"', line)
        mvid = re.search(r'\bvideo:\s*"([^"]+)"', line)
        if mid and myt:
            cams.append({"id": mid.group(1), "yt": myt.group(1)})
        elif mid and mimg:
            cams.append({"id": mid.group(1), "img": mimg.group(1), "video": mvid.group(1) if mvid else None})
    return cams


def check_image(url, tries=3):
    """Tarayıcı gibi (site adresiyle) art arda birkaç kez ister; hepsinde gerçek bir görüntü gelmeli."""
    hdr = dict(HEADERS, Referer="https://kod34x-png.github.io/seyr/", Accept="image/avif,image/webp,image/*,*/*")
    hdr.pop("Cookie", None)
    for n in range(tries):
        sep = "&" if "?" in url else "?"
        req = urllib.request.Request(f"{url}{sep}t={int(time.time() * 1000)}", headers=hdr)
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                ct = r.headers.get("Content-Type", "")
                size = len(r.read())
                if r.status != 200 or size < 6000 or not (ct.startswith("image") or ct == "application/octet-stream"):
                    return False, f"{r.status} {ct} {size}B (deneme {n + 1})"
        except urllib.error.HTTPError as e:
            return False, f"HTTP {e.code} (deneme {n + 1})"
        except Exception as e:
            return False, f"{type(e).__name__} (deneme {n + 1})"
        time.sleep(2)
    return True, "ok"


def main():
    cams = load_cams()
    prev = {}
    if STATUS.exists():
        try:
            prev = json.loads(STATUS.read_text(encoding="utf-8")).get("cams", {})
        except ValueError:
            prev = {}

    out = {}
    for cam in cams:
        if "img" in cam:
            ok, why = check_image(cam["img"])
            if ok and cam.get("video"):
                code, _, _ = get(cam["video"])
                ok, why = (code == 200), f"video {code}"
            out[cam["id"]] = {"ok": ok, "state": "img", "why": why}
            print(f'{cam["id"]:24} {"OK " if ok else "YOK"} {why}')
            continue
        p = prev.get(cam["id"], {})
        # Daha önce bulunmuş güncel adres varsa önce onu dene.
        candidates = [v for v in [p.get("yt"), cam["yt"]] if v]
        channel = p.get("channel")
        result = None
        for vid in dict.fromkeys(candidates):
            code, info = oembed(vid)
            if info.get("author_url"):
                channel = info["author_url"]
            if code != 200:
                continue
            _, _, html = get(f"https://www.youtube.com/watch?v={vid}&hl=en")
            state = watch_state(html)
            if state in ("live", None):  # None: YouTube sayfayı göstermedi, gömme izni var, açık say
                result = {"ok": True, "yt": vid, "state": state or "unknown", "title": info.get("title", "")}
                break
        if not result:
            new = channel_live(channel)
            if new:
                code, info = oembed(new)
                if code == 200:
                    result = {"ok": True, "yt": new, "state": "live", "title": info.get("title", ""), "replaced": True}
        if not result:
            result = {"ok": False, "yt": cam["yt"], "state": "down"}
        result["channel"] = channel
        out[cam["id"]] = result
        print(f'{cam["id"]:24} {"OK " if result["ok"] else "YOK"} {result["yt"]} {result.get("state")}{" (yeni adres)" if result.get("replaced") else ""}')
        time.sleep(1)

    STATUS.write_text(json.dumps({"checkedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "cams": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = sum(1 for v in out.values() if v["ok"])
    print(f"\n{ok}/{len(out)} yayın açık")
    return 0


if __name__ == "__main__":
    sys.exit(main())
