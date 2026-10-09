"""Aday kameraların anlık görüntülerini indirip kaynak başına bir önizleme tablosu yapar.
Sonuç 'onizleme' dalına yazılır (ana dal temiz kalır)."""
import io
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

UA = {"User-Agent": "Seyr/1.0 (+https://kod34x-png.github.io/seyr/)"}
OUT = Path("onizleme"); OUT.mkdir(exist_ok=True)


def fetch(url, timeout=30):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


def madrid():
    ids = ["01314", "01318", "01315", "01316", "01302", "01324", "01322", "01303", "01317", "01305", "01332", "09301", "01323", "01304", "01331", "07306"]
    return [(f"Madrid {i}", f"https://informo.madrid.es/cameras/Camara{i}.jpg") for i in ids]


def hongkong():
    ids = ["K101F", "K102F", "K104F", "K121F", "K108F", "K205F", "H107F", "H108F", "H109F", "H106F", "H201F", "H203F", "H305F", "TDSIEC10001"]
    return [(f"HK {i}", f"https://tdcctv.data.one.gov.hk/{i}.JPG") for i in ids]


def newyork():
    ids = {"Union Sq": "d47d2f63-cdc1-4f28-bc4c-e64ac07e4f1d", "Columbus Cr": "c880d0c4-db84-44c2-9f00-62f21a83b5d0",
           "B'way 46 N": "f3d82b25-6b10-44c7-ae89-30df075a7ac8", "B'way 46 E": "dbbf45f6-7d87-46fa-825f-454a7e2bbcad",
           "B'way 46 W": "8cd15417-5b79-4065-9165-4b6ff0ff3f53", "B'way 46": "0c9a2836-c408-48d3-85c7-1977c33d9133",
           "B'way 43": "d8122408-7092-41ba-a9db-ef8847edeaef", "7Ave 44": "19789499-03ac-45de-9401-a7a71ea60d1e",
           "B'way 45": "053e8995-f8cb-4d02-a659-70ac7c7da5db", "B'way 42": "9565e94d-66f2-4965-9c13-82d5500d6cfd",
           "Rockef 49": "09d9335c-097e-47ef-af1d-122eb3206f7c", "Herald": "8ee72946-49e0-4f49-991d-4f52b1206ed7",
           "5Ave 50": "482e6d35-2a67-4bbf-b36f-fdf7e031d607", "Canal": "8cc75cbc-e050-4947-aee8-639f63fe4ca7"}
    return [(f"NY {k}", f"https://webcams.nyctmc.org/api/cameras/{v}/image") for k, v in ids.items()]


def seattle():
    d = json.loads(fetch("https://web.seattle.gov/Travelers/api/Map/Data?zoomId=13&type=2"))
    keys = ["pike", "pine", "union st", "university", "westlake", "seneca", "madison", "yesler", "jackson"]
    out = []
    for f in d.get("Features", []):
        for cam in f.get("Cameras", []):
            desc = cam.get("Description", "")
            if any(k in desc.lower() for k in keys) and cam.get("Type") == "sdot":
                out.append((f"SEA {desc}"[:40], "https://www.seattle.gov/trafficcams/images/" + cam["ImageUrl"], f["PointCoordinate"]))
    meta = [{"name": n, "url": u, "coord": c} for n, u, c in out]
    (OUT / "seattle.json").write_text(json.dumps(meta, indent=1))
    return [(n, u) for n, u, _ in out[:16]]


def toronto():
    gj = json.loads(fetch("https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/a3309088-5fd4-4d34-8297-77c8301840ac/resource/4a568300-c7f8-496d-b150-dff6f5dc6d4f/download/traffic-camera-list-4326.geojson"))
    feats = gj.get("features", [])
    (OUT / "toronto_sample.json").write_text(json.dumps(feats[:3], indent=1))
    keys = ["yonge", "dundas", "queen st", "king st", "bay st", "spadina", "front st", "university"]
    out, meta = [], []
    for f in feats:
        p = f.get("properties", {})
        txt = json.dumps(p).lower()
        if any(k in txt for k in keys):
            img = next((v for v in p.values() if isinstance(v, str) and v.lower().endswith(".jpg")), None)
            name = " ".join(str(p.get(k, "")) for k in p if "road" in k.lower() or "street" in k.lower() or "name" in k.lower())[:60]
            if img:
                out.append((f"TOR {name}"[:40], img.replace("http://", "https://")))
                meta.append({"name": name, "img": img, "geometry": f.get("geometry")})
    (OUT / "toronto.json").write_text(json.dumps(meta, indent=1))
    return out[:16]


def sheet(name, items):
    tiles = []
    for label, url in items:
        try:
            im = Image.open(io.BytesIO(fetch(url))).convert("RGB")
            im.thumbnail((360, 240))
        except Exception as e:
            im = Image.new("RGB", (360, 240), (60, 0, 0)); label += f" ERR {str(e)[:30]}"
        tile = Image.new("RGB", (360, 264), (20, 20, 20)); tile.paste(im, (0, 0))
        ImageDraw.Draw(tile).text((4, 244), label[:58], fill=(255, 255, 0))
        tiles.append(tile)
    if not tiles:
        return
    cols = 4; rows = (len(tiles) + cols - 1) // cols
    S = Image.new("RGB", (cols * 364, rows * 268), (0, 0, 0))
    for i, t in enumerate(tiles):
        S.paste(t, ((i % cols) * 364, (i // cols) * 268))
    S.save(OUT / f"{name}.jpg", quality=80)


if __name__ == "__main__":
    for name, fn in [("madrid", madrid), ("hongkong", hongkong), ("newyork", newyork), ("seattle", seattle), ("toronto", toronto)]:
        try:
            sheet(name, fn())
            print(name, "ok")
        except Exception as e:
            (OUT / f"{name}_error.txt").write_text(repr(e))
            print(name, "HATA", e)
