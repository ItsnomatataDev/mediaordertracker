#!/bin/sh
set -e

echo "Applying database migrations..."
prisma migrate deploy

echo "Syncing bootstrap admin..."
node prisma/seed.mjs

echo "Starting IT's No Matata Media Portal..."
exec node server.js
