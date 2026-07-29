#!/usr/bin/env python3
"""Build the scoped Hong Kong Link retail-property dataset from official pages.

Authority:
- Link REIT sitemap and English/Traditional Chinese property detail pages
- Hong Kong Lands Department GeoInfo Map locationSearch API for coordinates

Scope B includes Hong Kong assets whose official Asset Type contains Retail.
It excludes car-park-only, car service, office, logistics and non-Hong-Kong assets.
"""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "link-hk-retail-properties.json"
SITEMAP = "https://www.linkreit.com/sitemap.xml"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; XKONG-BDmap/1.0; property-data-verification)"}
GEO_API = "https://www.map.gov.hk/gs/api/v1.0.0/locationSearch"
TRANSFORMER = Transformer.from_crs("EPSG:2326", "EPSG:4326", always_xy=True)


def get(url: str, attempts: int = 4) -> requests.Response:
    last = None
    for attempt in range(attempts):
        try:
            response = requests.get(url, timeout=45, headers=HEADERS)
            response.raise_for_status()
            return response
        except Exception as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last}")


def labelled_value(soup: BeautifulSoup, labels: set[str]) -> str:
    for paragraph in soup.find_all("p"):
        strong = paragraph.find("strong")
        if strong and strong.get_text(" ", strip=True) in labels:
            label = strong.get_text(" ", strip=True)
            text = " ".join(paragraph.get_text(" ", strip=True).split())
            return text[len(label):].strip()
    return ""


def page_name(soup: BeautifulSoup) -> str:
    meta = soup.find("meta", {"property": "og:title"})
    content = meta.get("content", "") if meta else ""
    value = content if isinstance(content, str) else ""
    return re.sub(r"\s*\|\s*(Link|領展)\s*$", "", value).strip()


def parse_property(url: str) -> dict:
    en = BeautifulSoup(get(url).text, "html.parser")
    tc_url = url.replace("/en/", "/tc/", 1)
    tc = BeautifulSoup(get(tc_url).text, "html.parser")
    tags = [tag.get_text(" ", strip=True) for tag in en.select(".tag")]
    return {
        "slug": url.rstrip("/").split("/")[-1],
        "nameEN": page_name(en),
        "nameZH": page_name(tc),
        "addressEN": labelled_value(en, {"Address"}),
        "addressZH": labelled_value(tc, {"地址"}),
        "assetTypeEN": labelled_value(en, {"Asset Type"}),
        "assetTypeZH": labelled_value(tc, {"資產類別"}),
        "officialUrl": url,
        "officialUrlZH": tc_url,
        "tags": tags,
    }


def is_hk_retail(row: dict) -> bool:
    address = row["addressEN"].lower()
    is_hk = any(marker in address for marker in ("hong kong", "kowloon", "new territories"))
    return is_hk and "retail" in row["assetTypeEN"].lower()


def geocode(row: dict) -> dict:
    queries = [row["addressEN"], row["nameZH"], row["nameEN"]]
    candidates = []
    query_used = ""
    for query in queries:
        if not query:
            continue
        response = requests.get(GEO_API, params={"q": query}, timeout=30, headers=HEADERS)
        response.raise_for_status()
        candidates = response.json()
        if candidates:
            query_used = query
            break
    if not candidates:
        raise RuntimeError(f"No coordinate result for {row['nameEN']}")

    def score(item: dict) -> int:
        fields = " ".join(str(item.get(k, "")) for k in ("nameEN", "nameZH", "addressEN", "addressZH")).lower()
        wanted = [row["nameEN"].lower(), row["nameZH"].lower()]
        return max((len(value) for value in wanted if value and value in fields), default=0)

    best = max(candidates[:20], key=score)
    lng, lat = TRANSFORMER.transform(float(best["x"]), float(best["y"]))
    row.update({
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "districtZH": best.get("districtZH", ""),
        "districtEN": best.get("districtEN", ""),
        "geocodeNameZH": best.get("nameZH", ""),
        "geocodeSource": "香港地政總署 GeoInfo Map",
        "geocodeQuery": query_used,
    })
    return row


def main() -> None:
    xml = get(SITEMAP).text
    urls = sorted(set(re.findall(r"<loc>(https://www\.linkreit\.com/en/business/properties/[^<]+/)</loc>", xml)))
    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(parse_property, url): url for url in urls}
        for future in as_completed(futures):
            rows.append(future.result())
    scoped = [row for row in rows if is_hk_retail(row)]
    geocoded = []
    for index, row in enumerate(sorted(scoped, key=lambda item: item["nameEN"])):
        geocoded.append(geocode(row))
        time.sleep(0.08)
    for number, row in enumerate(geocoded, start=1):
        row["id"] = f"link_hk_{row['slug'].replace('-', '_')}"
        row["no"] = number
        row["name"] = row["nameZH"] or row["nameEN"]
        row["address"] = row["addressZH"] or row["addressEN"]
        row["developer"] = "領展"
        district = row.get("districtZH", "")
        row["area"] = "港島" if district in {"中西區", "灣仔區", "東區", "南區"} else ("九龍" if district in {"油尖旺區", "深水埗區", "九龍城區", "黃大仙區", "觀塘區"} else "新界")
        row["propertyType"] = "街市及零售" if "fresh market" in row["assetTypeEN"].lower() else ("屋邨商業設施" if "retail and car park" in row["assetTypeEN"].lower() and row["nameEN"].lower().endswith("retail and car park") else "商場／零售物業")
    payload = {
        "version": "link-hk-retail-2026-07-30-v1",
        "generatedAt": "2026-07-30",
        "scope": "領展香港零售物業：含商場、屋邨商業設施及鮮活街市；排除純停車場、汽車服務中心、寫字樓及香港以外物業。",
        "officialSource": SITEMAP,
        "coordinateSource": "https://www.map.gov.hk/",
        "count": len(geocoded),
        "properties": geocoded,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(geocoded)} properties to {OUTPUT}")


if __name__ == "__main__":
    main()
