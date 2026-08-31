#!/bin/bash
# Deploy 777111.com.ua via wrangler OAuth (dead static token removed 31.08.2026 — auth error 10000)
cd ~/Desktop/777111
# Next 16 prerender writes RSC/segment .txt payloads (2x file count) — Pages limit is 20k files, and they are optional
find out -name "__next*" -type f -delete 2>/dev/null
find out -name "*.txt" -type f -not -name "robots.txt" -not -path "*static*" -delete 2>/dev/null
npx wrangler pages deploy out --project-name=777111-com-ua --commit-dirty=true 2>&1
