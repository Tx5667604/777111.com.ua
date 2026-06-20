#!/bin/bash
cd ~/Desktop/777111
export CLOUDFLARE_API_TOKEN=cfat_uXsTjbFBGDWWJTAvR9LfXeZZUYBeXfMuNVv8P1CI3aace6bb
wrangler pages deploy out --project-name=777111-com-ua --commit-dirty=true 2>&1
