#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Running database migrations..."
npx prisma migrate deploy

echo "Creating DM users if they don't exist..."
node dist/cli/create-dm-users.js || true

echo "Starting server..."
exec node dist/server.js
