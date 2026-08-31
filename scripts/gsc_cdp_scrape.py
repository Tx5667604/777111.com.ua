#!/usr/bin/env python3
"""Attach to user's Chrome via CDP and scrape GSC indexing data."""
import json, time, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("/Users/aleksandr/Desktop/777111/agy-reports")
OUT.mkdir(parents=True, exist_ok=True)

def shot(page, name):
    p = OUT / f"shot-{name}.png"
    page.screenshot(path=str(p))
    print(f"[shot] {p}")

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.connect_over_cdp("http://localhost:9222")
        ctx = browser.contexts[0]
        pages = ctx.pages
        print(f"[cdp] pages open: {len(pages)}")
        for p in pages:
            print(f"  - {p.url[:120]}")
        # find a GSC page
        gsc = None
        for p in pages:
            if "search-console" in p.url:
                gsc = p
                break
        if not gsc:
            gsc = ctx.new_page()
            gsc.goto("https://search.google.com/search-console?resource_id=sc-domain%3A777111.com.ua&hl=ru")
            gsc.wait_for_timeout(8000)
        print(f"[gsc page] {gsc.url}")

        props = ["777111.com.ua", "apple.cx.ua"]
        for idx, dom in enumerate(props, 1):
            rid = f"sc-domain%3A{dom}"
            url = f"https://search.google.com/search-console/index/pages?resource_id={rid}&hl=ru"
            print(f"[prop {idx}] {dom}: {url}")
            gsc.goto(url)
            gsc.wait_for_timeout(10000)
            shot(gsc, f"20-prop{idx}-pages")
            body = gsc.inner_text("body")
            (OUT / f"gsc-{dom}-pages-report.txt").write_text(body)
            print(f"[prop {idx}] body head: {body[:400].replace(chr(10),' | ')}")
            # collect drilldown links
            links = []
            rows = gsc.locator("a[href*='item_key']")
            n = rows.count()
            for i in range(n):
                try:
                    href = rows.nth(i).get_attribute("href") or ""
                    txt = rows.nth(i).inner_text().replace("\n", " | ")[:150]
                    links.append({"text": txt, "href": href})
                except Exception:
                    pass
            (OUT / f"gsc-{dom}-drilldowns.json").write_text(json.dumps(links, ensure_ascii=False, indent=1))
            print(f"[prop {idx}] drilldowns: {n}")
            for l in links:
                print(f"   {l['text']}")
        browser.close()

if __name__ == "__main__":
    main()
