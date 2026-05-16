#!/usr/bin/env python3
"""Generate Google Merchant Center XML feed. 
Uses brace-counting to extract each model block from the TS file."""

import re, os, hashlib
import xml.etree.ElementTree as ET
from xml.dom import minidom
from collections import Counter

DATA_FILE = os.path.expanduser("~/Desktop/777111/src/app/phone-parts-data.ts")
OUTPUT = os.path.expanduser("~/Desktop/777111/public/merchant-feed.xml")
SITE_URL = "https://777111.com.ua"

GOOGLE_CATS = {"display":"267","battery":"3605","back_cover":"5121","speaker":"5070",
    "glass":"3033","charging_flex":"5070","camera":"6808","microphone":"5070","buttons":"5070","connector":"5070"}

PART_NAMES = {"display":"Дисплей","battery":"Акумулятор","back_cover":"Задня кришка",
    "speaker":"Динамік","glass":"Скло екрану","charging_flex":"Шлейф зарядки",
    "camera":"Камера","microphone":"Мікрофон","buttons":"Кнопки","connector":"Конектори"}

QUALITY_LABELS = {"copy":"Копія","original":"Оригінал","original_with_frame":"Оригінал з рамкою"}


def extract_nested_block(text, start):
    """From position `start` (which should be at or near `{`), find the matching `}`.
    Returns (content, end_pos) where content is the text inside { ... }."""
    if text[start] == "{":
        start += 1
    depth = 1
    i = start
    while depth > 0 and i < len(text):
        if text[i] == "{": depth += 1
        elif text[i] == "}": depth -= 1
        i += 1
    return text[start:i-1], i


def parse():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()
    
    products = []
    
    # Step 1: Find all brand blocks (top-level { ... } after "brandPartsData")
    brands_start = text.find("export const brandPartsData: BrandParts[] = [")
    if brands_start < 0:
        brands_start = text.find("brandPartsData: BrandParts[] = [")
    
    # Find the opening [ of the array — it's the [ right after "= ["
    if brands_start >= 0:
        eq_idx = text.find("= [", brands_start)
        arr_start = text.find("[", eq_idx) if eq_idx > 0 else -1
    else:
        arr_start = -1
    if arr_start < 0:
        print("ERROR: Could not find brands array start")
        return []
    # The brands are the top-level { } inside this array
    
    i = arr_start + 1
    while i < len(text):
        # Skip whitespace, comments, commas
        while i < len(text) and text[i] in " \n\r\t,":
            i += 1
        # Skip comments
        if i < len(text) and text[i] == "/":
            if text[i:i+2] == "//":
                nl = text.find("\n", i)
                i = nl + 1 if nl > 0 else len(text)
                continue
            elif text[i:i+2] == "/*":
                end = text.find("*/", i+2)
                i = end + 2 if end > 0 else len(text)
                continue
        
        if i >= len(text) or text[i] == "]":
            break  # end of brands array
        
        if text[i] == "{":
            # Extract this brand block
            brand_content, end = extract_nested_block(text, i)
            
            # Get brand id and name
            bid = re.search(r"id:\s*'([^']+)'", brand_content)
            bname = re.search(r"name:\s*'([^']+)'", brand_content)
            if not (bid and bname):
                i = end
                continue
            
            brand_id = bid.group(1)
            brand_name = bname.group(1)
            
            # Find models array within this brand
            models_start = brand_content.find("models: [")
            if models_start < 0:
                i = end
                continue
            
            mi = brand_content.find("[", models_start) + 1
            
            # Extract each model: find { ... } within models array
            while mi < len(brand_content):
                while mi < len(brand_content) and brand_content[mi] in " \n\r\t,":
                    mi += 1
                if mi >= len(brand_content) or brand_content[mi] == "]":
                    break
                
                if brand_content[mi] == "{":
                    model_content, mend = extract_nested_block(brand_content, mi)
                    
                    # Extract modelCode and modelName
                    mc = re.search(r"modelCode:\s*'([^']+)'", model_content)
                    mn = re.search(r"modelName:\s*'([^']+)'", model_content)
                    if not (mc and mn):
                        mi = mend
                        continue
                    
                    code = mc.group(1)
                    mname = mn.group(1)
                    
                    # Extract parts block
                    parts_start = model_content.find("parts:")
                    if parts_start < 0:
                        mi = mend
                        continue
                    
                    ps = model_content.find("{", parts_start)
                    if ps < 0:
                        mi = mend
                        continue
                    
                    parts_content, _ = extract_nested_block(model_content, ps)
                    
                    # Parse each part
                    for pm in re.finditer(r"(\w+):\s*(display|two|only)\(([^)]*)\)", parts_content):
                        part_id = pm.group(1)
                        func = pm.group(2)
                        args = [int(a.strip()) for a in pm.group(3).split(",") if a.strip()]
                        
                        if part_id not in PART_NAMES or len(args) < 2:
                            continue
                        
                        if func == "display":
                            v = [("copy",args[0],args[2]), ("original",args[1],args[2]),
                                 ("original_with_frame",int(args[1]*1.3),args[2]+100)]
                        elif func == "two":
                            v = [("copy",args[0],args[2]), ("original",args[1],args[2])]
                        elif func == "only":
                            v = [("original",args[0],args[1])]
                        else:
                            continue
                        
                        for quality, pc, lc in v:
                            ql = QUALITY_LABELS.get(quality, quality)
                            # Strip color/size suffixes from code for short ID
                            clean = code
                            # Remove color words (uk/ru/en)
                            for w in ['чорний','чорна','білий','біла','синій','синя','зелений','зелена','червоний','червона','жовтий','жовта','сірий','сіра','фіолетовий','фіолетова','рожевий','рожева','золотий','золота','срібний','срібна','бронзова','серебрянная','черная','белая','синяя','зеленая','красная','желтая','серая','фиолетовая','розовая','золотая','серебряная','коричневая']:
                                clean = re.sub(rf'\b{re.escape(w)}\b', '', clean, flags=re.I)
                            for w in ['Global','China','Dual Sim','OLED','TFT','Version','на 2 Sim','Blue','Black','White','Red','Green','Gold','Silver','Gray','Grey','Purple','Pink','Bronze','Graphite','Titanium','Mint','Denim','Orchid','Misty','Metal','Polar','Atlantic','Sunset','Sleek','Starry','Pacific','Ocean','Midnight','Fresh']:
                                clean = re.sub(rf'\b{re.escape(w)}\b', '', clean, flags=re.I)
                            clean = re.sub(r'\s+', ' ', clean).strip().rstrip('-_,.')
                            # Build unique ID: brand + hash of full code + part + quality
                            code_hash = hashlib.md5(code.encode()).hexdigest()[:6]
                            suffix = f"{part_id}-{quality}"
                            max_model_len = 50 - len(brand_id) - len(suffix) - len(code_hash) - 3  # -3 for dashes
                            model_part = clean.replace(" ", "_").lower()[:max_model_len].strip("-_")
                            pid = f"{brand_id}-{model_part}-{code_hash}-{suffix}"[:50].strip("-_")
                            # Use real images for iPhone, product-style for others
                            if brand_id == 'apple':
                                img_url = f"{SITE_URL}/part-images/iphone/{part_id}.jpg"
                            else:
                                img_url = f"{SITE_URL}/part-images/generic/{part_id}.jpg"
                            title = f"{PART_NAMES[part_id]} {brand_name} {mname} ({ql})"
                            products.append({
                                "id": pid,
                                "title": title,
                                "description": f"{PART_NAMES[part_id]} для {brand_name} {mname} ({ql}). Ремонт телефонів у Вознесенську",
                                "link": f"{SITE_URL}/#calculator",
                                "price": f"{pc + lc} UAH",
                                "availability": "in_stock",
                                "brand": brand_name,
                                "condition": "refurbished" if quality=="copy" else "new",
                                "google_product_category": GOOGLE_CATS.get(part_id, "5070"),
                                "product_type": f"Ремонт телефонів > {PART_NAMES[part_id]} > {brand_name}",
                                "image_link": img_url,
                                "mpn": f"{brand_id.upper()}-{code}-{part_id}".replace(" ",""),
                            })
                    
                    mi = mend
                else:
                    mi += 1
            
            i = end
        else:
            i += 1
    
    return products


def generate_xml(products):
    rss = ET.Element("rss", {"xmlns:g":"http://base.google.com/ns/1.0","version":"2.0"})
    ch = ET.SubElement(rss, "channel")
    ET.SubElement(ch,"title").text = "777111.com.ua"
    ET.SubElement(ch,"link").text = SITE_URL
    ET.SubElement(ch,"description").text = "Запчастини та ремонт телефонів у Вознесенську"
    ns = "{http://base.google.com/ns/1.0}"
    for p in products:
        item = ET.SubElement(ch,"item")
        for k,v in p.items():
            if v:
                ET.SubElement(item,ns+k).text = str(v)
    raw = ET.tostring(rss, encoding="utf-8")
    return minidom.parseString(raw).toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")


if __name__ == "__main__":
    prods = parse()
    print(f"Total: {len(prods)} products from {len(Counter(p['brand'] for p in prods))} brands")
    for b,c in Counter(p["brand"] for p in prods).most_common(10):
        print(f"  {b}: {c}")
    
    xml = generate_xml(prods)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write(xml)
    sz = len(xml)
    print(f"\nSaved: {OUTPUT} ({sz//1024} KB, ~{len(prods)//sz*1000 if sz else 0} items/KB)")
