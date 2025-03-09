#!/bin/sh
# Replace placeholder with actual value from environment variable
sed -i "s|__BACKEND_URL_PLACEHOLDER__|${BACKEND_URL}|g" /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
