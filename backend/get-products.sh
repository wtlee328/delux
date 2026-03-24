DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project="delux-plus-staging-488508")
export PGPASSWORD="$DB_PASSWORD"

/Users/kelvin/Documents/GitHub/delux/cloud_sql_proxy --port 5435 delux-plus-staging-488508:asia-east1:delux-plus-db-staging &
PROXY_PID=$!
sleep 5

psql -h 127.0.0.1 -p 5435 -U delux_admin -d delux_plus_staging -c "SELECT id, title, address FROM products ORDER BY created_at DESC LIMIT 5;"

kill $PROXY_PID
