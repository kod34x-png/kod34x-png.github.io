"""Seyr keşif: açık veri kamera kaynaklarını tarar, meydan ve cadde kameralarını listeler.

Kaynaklar:
- TfL JamCam (Londra, açık veri, "Powered by TfL Open Data")
- NYC DOT trafik kameraları (New York, kamu verisi)
Sonucu .github/seyr/adaylar.json dosyasına yazar; insan seçer, cams.js'e eklenir.
"""
import json
import urllib.request
from pathlib import Path

OUT = Path(__file__).with_name("adaylar.json")
UA = {"User-Agent": "Seyr/1.0 (+https://kod34x-png.github.io/seyr/)"}

LONDON_KEYS = ["trafalgar", "piccadilly", "oxford circus", "oxford st", "regent st", "leicester", "parliament",
               "westminster", "whitehall", "strand", "tower bridge", "covent", "haymarket", "shaftesbury",
               "charing", "aldwych", "marble arch", "hyde park corner", "bank", "london bridge", "camden", "soho"]
NYC_KEYS = ["times sq", "42 st", "broadway", "7 ave", "5 ave", "herald", "34 st", "union sq", "columbus",
            "brooklyn bridge", "canal st", "houston", "14 st", "57 st", "rockefeller", "grand central", "wall st"]


def get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def tfl():
    out = []
    try:
        data = get_json("https://api.tfl.gov.uk/Place/Type/JamCam")
    except Exception as e:
        return [{"error": str(e)}]
    for p in data:
        name = p.get("commonName", "")
        props = {x.get("key"): x.get("value") for x in p.get("additionalProperties", [])}
        if any(k in name.lower() for k in LONDON_KEYS) and props.get("available") == "true":
            out.append({"src": "tfl", "id": p.get("id"), "name": name, "lat": p.get("lat"), "lon": p.get("lon"),
                        "image": props.get("imageUrl"), "video": props.get("videoUrl")})
    return out


def nyc():
    out = []
    try:
        data = get_json("https://webcams.nyctmc.org/api/cameras")
    except Exception as e:
        return [{"error": str(e)}]
    for c in data:
        name = c.get("name", "")
        if any(k in name.lower() for k in NYC_KEYS) and c.get("isOnline") in (True, "true", None):
            out.append({"src": "nyc", "id": c.get("id"), "name": name, "lat": c.get("latitude"), "lon": c.get("longitude"),
                        "image": c.get("imageUrl")})
    return out


if __name__ == "__main__":
    res = {"tfl": tfl(), "nyc": nyc()}
    OUT.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print({k: len(v) for k, v in res.items()})
