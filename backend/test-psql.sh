DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project="delux-plus-staging-488508")
if [ -z "$DB_PASSWORD" ]; then echo "Failed to get password"; exit 1; fi
export DB_HOST="127.0.0.1"
export DB_PORT="5435"
export DB_USER="postgres"
export DB_PASSWORD="$DB_PASSWORD"
export DB_NAME="delux_plus_staging"

/Users/kelvin/Documents/GitHub/delux/cloud_sql_proxy --port 5435 delux-plus-staging-488508:asia-east1:delux-plus-db-staging &
PROXY_PID=$!
sleep 5

cd /Users/kelvin/Documents/GitHub/delux/backend
npm run migrate

kill $PROXY_PID
