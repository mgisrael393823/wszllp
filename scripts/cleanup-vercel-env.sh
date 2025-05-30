#!/bin/bash

# Script to clean up unused Vercel environment variables

echo "🧹 Cleaning up unused Vercel environment variables..."
echo ""

# List of POSTGRES variables to remove
POSTGRES_VARS=(
  "POSTGRES_URL"
  "POSTGRES_PRISMA_URL"
  "POSTGRES_URL_NON_POOLING"
  "POSTGRES_USER"
  "POSTGRES_HOST"
  "POSTGRES_PASSWORD"
  "POSTGRES_DATABASE"
)

# Remove each POSTGRES variable
for var in "${POSTGRES_VARS[@]}"; do
  echo "Removing $var..."
  echo "y" | vercel env rm "$var" production
  echo ""
done

echo "✅ Cleanup complete!"
echo ""
echo "Remaining environment variables:"
vercel env ls production