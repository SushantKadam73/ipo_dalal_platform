cat > .env << EOF
CONVEX_DEPLOY_KEY=project:imdarkhorse73:my-project-chef-68fe0|eyJ2MiI6IjdkN2Q2YmQ2NDZmYzQ2ZDNiZTg2YWY5MmNlYjQ0MDlmIn0=

VITE_CONVEX_URL=https://confident-quail-785.convex.cloud
EOF
sed -i 's/"convex dev"/"convex dev --local"/g' package.json

echo "Updated package.json to use local Convex instance"

npm install
npm run dev