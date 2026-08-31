#!/usr/bin/env python3
"""GSC login + scrape 'Pages' report reasons for 777111.com.ua / apple.cx.ua."""
import json, sys, time, re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path("/Users/aleksandr/Desktop/777111/agy-reports")
AUTH = OUT / "gsc-auth.json"
OUT.mkdir(parents=True, exist_ok=True)

EMAIL = "fit5667604@gmail.com"
PASSWORD = "Sasha5667604@"

def shot(page, name):
    p = OUT / f"shot-{name}.png"
    page.screenshot(path=str(p), full_page=False)
    print(f"[shot] {p}")

def dump_state(page, tag):
    print(f"[url:{tag}] {page.url}")
    txt = ""
    try:
        txt = page.inner_text("body")[:3000]
    except Exception:
        pass
    (OUT / f"state-{tag}.txt").write_text(txt)
    shot(page, tag)

def login(page, ctx):
    page.goto("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fsearch.google.com%2Fsearch-console%2Fwelcome&flowName=GlifWebSignIn&hl=ru", wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    dump_state(page, "01-identifier")
    # email
    email_field = page.locator('#identifierId, input[name="identifier"], input[type="email"]').first
    email_field.click()
    email_field.type(EMAIL, delay=60)
    page.wait_for_timeout(500)
    nxt = page.locator('#identifierNext button, #identifierNext').first
    try:
        nxt.click(timeout=4000)
    except Exception:
        page.keyboard.press("Enter")
    page.wait_for_timeout(4000)
    dump_state(page, "02-password")
    body = page.inner_text("body")
    if "Не удалось войти" in body:
        print("LOGIN_FAIL: blocked before password")
        return False
    # password
    pw = page.locator('input[name="Passwd"], input[type="password"]').first
    pw.click()
    pw.type(PASSWORD, delay=60)
    page.wait_for_timeout(500)
    try:
        page.locator('#passwordNext button, #passwordNext').first.click(timeout=4000)
    except Exception:
        page.keyboard.press("Enter")
    page.wait_for_timeout(6000)
    dump_state(page, "03-after-password")
    body = page.inner_text("body")
    if "Неверный пароль" in body or "Wrong password" in body:
        print("LOGIN_FAIL: wrong password")
        return False
    for marker in ["Двухэтапная аутентификация", "2-Step Verification", "Подтвердите, что это вы", "Verify it's you"]:
        if marker in body:
            print(f"LOGIN_2FA: '{marker}' — нужен человек")
            return False
    if "myaccount.google.com" in page.url or "gds.google.com" in page.url or "welcome" in page.url or "search-console" in page.url:
        print("LOGIN_OK")
        ctx.storage_state(path=str(AUTH))
        return True
    print("LOGIN_UNKNOWN")
    return False

PROPERTIES = [
    ("777111.com.ua", "sc-domain:777111.com.ua"),
    ("apple.cx.ua", "sc-domain:apple.cx.ua"),
]

def scrape_property(page, domain, rid, idx):
    url = f"https://search.google.com/search-console/index/pages?resource_id={rid.replace(':', '%3A').replace('/', '%2F')}"
    print(f"[property {idx}] {domain} -> {url}")
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(8000)
    shot(page, f"10-prop{idx}-pages")
    body = page.inner_text("body")
    (OUT / f"gsc-{domain}-pages-report.txt").write_text(page.inner_text("body"))
    if "Нет данных" in body and "Проиндексированные страницы" not in body:
        print(f"[property {idx}] NO DATA / no access")
        return
    # Find the "Why pages aren't indexed" table rows
    m = re.search(r"Почему страницы не проиндексированы(.*?)(?:Проиндексированные страницы|$)", body, re.S)
    section = m.group(1) if m else body
    print(f"[property {idx}] reasons section (first 1500 chars):\n{section[:1500]}")
    # Save drilldown item_keys by clicking each row link
    rows = page.locator("a[href*='item_key']") 
    n = rows.count()
    print(f"[property {idx}] drilldown links found: {n}")
    for i in range(n):
        href = rows.nth(i).get_attribute("href")
        txt = rows.nth(i).inner_text().replace("\n", " | ")[:120]
        print(f"  row {i}: {txt} -> {href[:150]}")

def main():
    import os
    from playwright_stealth import Stealth
    use_firefox = os.environ.get("BROWSER", "chrome") == "firefox"
    with sync_playwright() as pw:
        if use_firefox:
            browser = pw.firefox.launch(headless=False, firefox_user_prefs={
                "dom.webdriver.enabled": False,
                "privacy.resistFingerprinting": False,
                "general.useragent.override": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0",
            })
        else:
            browser = pw.chromium.launch(
                headless=False,
                channel="chrome",
                args=["--disable-blink-features=AutomationControlled", "--start-maximized", "--no-first-run", "--no-default-browser-check"],
            )
        stealth = Stealth()
        ctx = browser.new_context(viewport=None, locale="ru-RU")
        if not use_firefox:
            stealth.apply_stealth_sync(ctx)
        if AUTH.exists():
            print("[auth] reuse saved state")
            ctx = browser.new_context(viewport=None, locale="ru-RU", storage_state=str(AUTH))
            page = ctx.new_page()
            page.goto("https://search.google.com/search-console", wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
            if "accounts.google.com" in page.url:
                print("[auth] state expired, re-login")
                login(page, ctx)
        else:
            page = ctx.new_page()
            ok = login(page, ctx)
            if not ok:
                browser.close()
                sys.exit(2)
        # welcome page
        page.goto("https://search.google.com/search-console/welcome", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        dump_state(page, "05-welcome")
        body = page.inner_text("body")
        (OUT / "gsc-properties-list.txt").write_text(body)
        for idx, (domain, rid) in enumerate(PROPERTIES, 1):
            try:
                scrape_property(page, domain, rid, idx)
            except Exception as e:
                print(f"[property {idx}] ERROR: {e}")
        ctx.storage_state(path=str(AUTH))
        page.wait_for_timeout(3000)
        browser.close()

if __name__ == "__main__":
    main()
