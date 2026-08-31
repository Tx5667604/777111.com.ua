#!/bin/bash
cd ~/Desktop/777111
export CLOUDFLARE_API_TOKEN=cfut_Tcb6a7MN1vfW5ECB9m73sOYaZE6MD0dtvbEPls8M3df70e34
wrangler pages deploy out --project-name=777111-com-ua --commit-dirty=true 2>&1
