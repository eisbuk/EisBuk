#!/bin/bash



# curl -v https://gatewayapi.com/rest/mtsms?token=$GATEWAYAPI_TOKEN \
#     -H "Content-Type: application/json" \
#     -d '{"message":"Per gestire le tue prenotazioni clicca qui: https://igorice.web.app/customer_area/b26a80b8-0ff8-46d3-b23b-dc5b7d284556/book_ice", "sender": "IgorIceTeam", "recipients": [{"msisdn": "393283220018"}]}'

curl -s https://gatewayapi.com/rest/me?token=$GATEWAYAPI_TOKEN | jq .
