#!/bin/sh
# Nieuwe versie live zetten: stempelt een nieuw bouwnummer, zodat spelers die al open hebben staan vanzelf updaten.
set -e
cd "$(dirname "$0")"
B=$(date +%Y%m%d%H%M%S)
sed -i -E "s/\?v=[A-Za-z0-9]+/?v=$B/g" index.html *.js
sed -i -E "s#<meta name=\"build\" content=\"[^\"]*\">#<meta name=\"build\" content=\"$B\">#" index.html
printf '{"v":"%s"}\n' "$B" > version.json
echo "bouwnummer $B"
