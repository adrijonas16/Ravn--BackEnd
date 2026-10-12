#!/bin/bash
API="http://127.0.0.1:3000/api/v1"

TOKEN=$(curl -s -X POST "$API/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"stress-$$-$RANDOM@t.com\",\"password\":\"S12345!\",\"firstName\":\"S\",\"lastName\":\"T\"}" \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

ADDR=$(curl -s -X POST "$API/addresses" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"recipientName":"S","recipientPhone":"+1","line1":"X","city":"Lima","countryCode":"PE"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")

VID=$(curl -s "$API/products?limit=10" | node -pe \
  "JSON.parse(require('fs').readFileSync(0,'utf8')).data.flatMap(p=>p.variants||[]).find(v=>v.stock>0)?.id||''")

curl -s -X POST "$API/cart/items" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"productVariantId\":$VID,\"quantity\":1}" > /dev/null

for i in $(seq 1 10); do
  curl -s -X POST "$API/orders" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "{\"addressId\":$ADDR}" -o "/tmp/stress_pw_$i.json" &
done
wait

OK=0; BLOCKED=0
for i in $(seq 1 10); do
  if grep -q orderNumber /tmp/stress_pw_$i.json 2>/dev/null; then
    OK=$((OK+1))
  else
    BLOCKED=$((BLOCKED+1))
  fi
done
echo "{\"ok\":$OK,\"blocked\":$BLOCKED}"
