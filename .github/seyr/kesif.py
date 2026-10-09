"""Seyr keşif: dünya genelinde resmi açık veri kamera kaynaklarını tarar.

Her kaynak için: erişilebiliyor mu, kaç kamera var, şehir merkezi / meydan / cadde
anahtar kelimelerine uyanlar hangileri. Sonuç .github/seyr/adaylar.json dosyasına yazılır.
Seçimi insan yapar, cams.js'e eklenir.
"""
import json
import re
import traceback
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path(__file__).with_name("adaylar.json")
UA = {"User-Agent": "Seyr/1.0 (+https://kod34x-png.github.io/seyr/)"}


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def jget(url):
    return json.loads(fetch(url))


def match(name, keys):
    n = (name or "").lower()
    return any(k in n for k in keys)


def probe_image(url):
    """Görüntü gerçekten geliyor mu, https mi, boyutu ne?"""
    if not url or not url.startswith("https://"):
        return "not-https"
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r:
            ct = r.headers.get("Content-Type", "")
            n = len(r.read())
            return f"ok {ct} {n}B" if n > 3000 else f"small {ct} {n}B"
    except Exception as e:
        return f"err {e}"


SOURCES = {}


def source(name):
    def deco(fn):
        SOURCES[name] = fn
        return fn
    return deco


# ---------------- Avrupa ----------------
@source("londra_tfl")
def londra():
    keys = ["trafalgar", "piccadilly", "oxford", "regent", "leicester", "parliament", "westminster", "whitehall",
            "strand", "tower bridge", "covent", "haymarket", "charing", "marble arch", "camden", "soho", "bank"]
    data = jget("https://api.tfl.gov.uk/Place/Type/JamCam")
    out = []
    for p in data:
        props = {x.get("key"): x.get("value") for x in p.get("additionalProperties", [])}
        if match(p.get("commonName"), keys) and props.get("available") == "true":
            out.append({"name": p.get("commonName"), "lat": p.get("lat"), "lon": p.get("lon"),
                        "img": props.get("imageUrl"), "video": props.get("videoUrl")})
    return len(data), out


@source("madrid")
def madrid():
    keys = ["sol", "gran v", "cibeles", "alcal", "callao", "castellana", "mayor", "atocha", "col", "neptuno",
            "plaza", "espa", "princesa", "serrano", "recoletos", "prado"]
    text = fetch("https://datos.madrid.es/egob/catalogo/202088-0-trafico-camaras.kml")
    out, total = [], 0
    for pm in re.findall(r"<Placemark>(.*?)</Placemark>", text, re.S):
        total += 1
        name = re.sub(r"<.*?>", "", (re.search(r"<name>(.*?)</name>", pm, re.S) or [None, ""])[1] if re.search(r"<name>(.*?)</name>", pm, re.S) else "")
        desc = (re.search(r"<description>(.*?)</description>", pm, re.S) or [None, ""])
        desc = desc[1] if desc else ""
        img = re.search(r"(https?://[^\s\"'<>]+\.jpg)", pm)
        coords = re.search(r"<coordinates>\s*([-\d.]+),([-\d.]+)", pm)
        label = name + " " + re.sub(r"<.*?>", " ", desc)
        if match(label, keys):
            out.append({"name": label.strip()[:120], "lat": coords and float(coords.group(2)), "lon": coords and float(coords.group(1)),
                        "img": img and img.group(1).replace("http://", "https://")})
    return total, out


@source("finlandiya_digitraffic")
def finlandiya():
    data = jget("https://tie.digitraffic.fi/api/weathercam/v1/stations")
    feats = data.get("features", [])
    keys = ["helsinki", "tampere", "turku"]
    out = []
    for f in feats:
        nm = f.get("properties", {}).get("name", "")
        if match(nm, keys):
            c = f["geometry"]["coordinates"]
            pres = f["properties"].get("presets", [])
            if pres:
                out.append({"name": nm, "lat": c[1], "lon": c[0],
                            "img": f"https://weathercam.digitraffic.fi/{pres[0]['id']}.jpg"})
    return len(feats), out[:15]


# ---------------- Kuzey Amerika ----------------
@source("newyork_dot")
def newyork():
    keys = ["times sq", "broadway @ 4", "7 ave @ 4", "herald", "union sq", "columbus c", "rockefeller", "5 ave @ 5",
            "canal st @ ch", "wall st", "grand central", "brooklyn bridge ent"]
    data = jget("https://webcams.nyctmc.org/api/cameras")
    out = [{"name": c.get("name"), "lat": c.get("latitude"), "lon": c.get("longitude"), "img": c.get("imageUrl")}
           for c in data if match(c.get("name"), keys)]
    return len(data), out


@source("toronto")
def toronto():
    pkg = jget("https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=traffic-cameras")
    res = pkg["result"]["resources"]
    info = [{"name": r.get("name"), "format": r.get("format"), "url": r.get("url")} for r in res]
    out = []
    for r in res:
        if (r.get("format") or "").lower() in ("geojson", "json"):
            try:
                d = jget(r["url"])
                feats = d.get("features", d if isinstance(d, list) else [])
                keys = ["yonge", "dundas", "queen", "king", "bay", "spadina", "front", "bloor", "university", "nathan"]
                for f in feats:
                    p = f.get("properties", f)
                    nm = " ".join(str(p.get(k, "")) for k in ("MAINROAD", "CROSSROAD", "NAME", "name", "LOCATION"))
                    if match(nm, keys):
                        g = f.get("geometry", {}).get("coordinates") or [p.get("LONGITUDE"), p.get("LATITUDE")]
                        if g and isinstance(g[0], list):
                            g = g[0]
                        out.append({"name": nm.strip(), "lat": g[1] if g else None, "lon": g[0] if g else None,
                                    "img": p.get("IMAGEURL") or p.get("MAIN") or p.get("imageUrl"), "raw": {k: p[k] for k in list(p)[:12]}})
                break
            except Exception as e:
                info.append({"err": str(e)})
    return len(out), {"resources": info, "candidates": out[:30]}


@source("seattle_sdot")
def seattle():
    d = jget("https://web.seattle.gov/Travelers/api/Map/Data?zoomId=13&type=2")
    feats = d.get("Features") or d.get("features") or []
    keys = ["pike", "pine", "1st", "3rd", "4th", "westlake", "mercer", "denny", "jackson", "occidental"]
    out = []
    for f in feats:
        for cam in f.get("PointCoordinate") and f.get("Cameras", []) or []:
            if match(cam.get("Description"), keys):
                out.append({"name": cam.get("Description"), "lat": f["PointCoordinate"][0], "lon": f["PointCoordinate"][1],
                            "img": "https://www.seattle.gov/trafficcams/images/" + cam.get("ImageUrl", "") if cam.get("Type") == "sdot" else cam.get("ImageUrl")})
    return len(feats), out[:20]


# ---------------- Asya ----------------
@source("hongkong_td")
def hongkong():
    text = fetch("https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.xml")
    root = ET.fromstring(text)
    keys = ["nathan", "queen's road", "des voeux", "hennessy", "causeway", "mong kok", "tsim sha tsui", "central", "connaught", "salisbury", "canton", "jordan"]
    out, total = [], 0
    for img in root.iter():
        if img.tag.lower().endswith("image"):
            total += 1
            d = {c.tag.split("}")[-1].lower(): (c.text or "") for c in img}
            label = f"{d.get('district', '')} {d.get('description', '')}"
            if match(label, keys):
                out.append({"name": label.strip(), "lat": d.get("latitude"), "lon": d.get("longitude"), "img": d.get("url")})
    return total, out


@source("singapur_lta")
def singapur():
    d = jget("https://api.data.gov.sg/v1/transport/traffic-images")
    cams = d["items"][0]["cameras"]
    return len(cams), [{"name": c["camera_id"], "lat": c["location"]["latitude"], "lon": c["location"]["longitude"], "img": c["image"]} for c in cams[:5]]


# ---------------- Okyanusya ----------------
@source("sidney_nsw")
def sidney():
    d = jget("https://www.livetraffic.com/datajson/all-feeds-web.json")
    out, total = [], 0
    for f in d if isinstance(d, list) else d.get("features", []):
        p = f.get("properties", {})
        if p.get("type") == "LIVE_CAM" or "camera" in json.dumps(p).lower()[:200]:
            total += 1
            nm = p.get("title") or p.get("view") or ""
            if match(nm, ["sydney", "george", "harbour", "circular", "cbd", "william", "oxford", "parramatta"]):
                g = f.get("geometry", {}).get("coordinates", [None, None])
                out.append({"name": nm, "lat": g[1], "lon": g[0], "img": p.get("href")})
    return total, out[:20]


@source("queensland")
def queensland():
    d = jget("https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=3e83add325cbb69ac4d8e5bf433d770b")
    feats = d.get("features", [])
    out = []
    for f in feats:
        p = f.get("properties", {})
        nm = f"{p.get('locality', '')} {p.get('description', '')}"
        if match(nm, ["brisbane", "gold coast", "surfers", "south bank", "cairns"]):
            g = f.get("geometry", {}).get("coordinates", [None, None])
            out.append({"name": nm.strip(), "lat": g[1], "lon": g[0], "img": p.get("image_url") or p.get("imageUrl")})
    return len(feats), out[:20]


if __name__ == "__main__":
    report = {}
    for name, fn in SOURCES.items():
        try:
            total, cands = fn()
            if isinstance(cands, list):
                for c in cands[:6]:
                    c["probe"] = probe_image(c.get("img"))
            report[name] = {"ok": True, "total": total, "candidates": cands}
            print(name, "OK", total, len(cands) if isinstance(cands, list) else "")
        except Exception as e:
            report[name] = {"ok": False, "error": f"{type(e).__name__}: {e}", "trace": traceback.format_exc()[-600:]}
            print(name, "HATA", e)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
