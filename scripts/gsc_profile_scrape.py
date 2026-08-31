#!/usr/bin/env python3
"""GSC scrape using copied real-Chrome profile (no login needed)."""
import json, sys, time, re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/aleksandr/Desktop/777111/agy-reports")
PROFILE = "/Users/aleksandr/Desktop/777111/.chrome-gsc"
OUT.mkdir(parents=True, exist_ok=True)

def shot(page, name):
    p = OUT / f"shot-{name}.png"
    page.screenshot(path=str(p), full_page=False)
    print(f"[shot] {p}")

PROPERTIES = [
    ("777111.com.ua", "sc-domain:777111.com.ua"),
    ("apple.cx.ua", "sc-domain:apple.cx.ua"),
]

def scrape_property(page, domain, rid, idx):
    url = f"https://search.google.com/search-console/index/pages?resource_id={rid}"
    print(f"[property {idx}] {domain} -> {url}")
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(12000)
    shot(page, f"10-prop{idx}-pages")
    body = page.inner_text("body")
    (OUT / f"gsc-{domain}-pages-report.txt").write_text(body)
    if "Не удалось" in body and "Страницы" not in body:
        print(f"[property {idx}] no access/no data")
        return
    m = re.search(r"Почему страницы не проиндексированы(.*?)(?:Проиндексированные страницы|$)", body, re.S)
    section = m.group(1) if m else body
    print(f"[property {idx}] === REASONS SECTION ===\n{section[:2500]}")
    rows = page.locator("a[href*='item_key']")
    n = rows.count()
    print(f"[property {idx}] drilldown links: {n}")
    links = []
    for i in range(n):
        try:
            href = rows.nth(i).get_attribute("href") or ""
            txt = rows.nth(i).inner_text().replace("\n", " | ")[:150]
            links.append({"text": txt, "href": href})
        except Exception:
            pass
    (OUT / f"gsc-{domain}-drilldowns.json").write_text(json.dumps(links, ensure_ascii=False, indent=1))
    for l in links:
        print(f"  {l['text']}")

def main():
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            PROFILE,
            channel="chrome",
            headless=False,
            viewport=None,
            locale="ru-RU",
            args=["--start-maximized", "--no-first-run", "--no-default-browser-check"],
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto("https://search.google.com/search-console", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        shot(page, "00-gsc-entry")
        url = page.url
        print(f"[entry] {url}")
        if "accounts.google.com" in url:
            print("NOT LOGGED IN — profile has no google session")
            body = page.inner_text("body")[:1500]
            (OUT / "profile-not-logged-in.txt").write_text(body)
            ctx.close()
            sys.exit(3)
        (OUT / "gsc-welcome.txt").write_text(page.inner_text("body"))
        for idx, (domain, rid) in enumerate(PROPERTIES, 1):
            try:
                scrape_property(page, domain, rid, idx)
            except Exception as e:
                print(f"[property {idx}] ERROR: {e}")
        ctx.close()

if __name__ == "__main__":
    main()
