import os

SESSION_REFRESH_PERIOD = 5  # seconds
WS_RECONNECT_INTERVAL = 6  # seconds

TIMEOUT = 60

API_DOMAIN = "api.e2b.dev"
API_HOST = f"https://{API_DOMAIN}"

if os.getenv("DEBUG"):
    API_HOST = "http://localhost:3000"

SESSION_DOMAIN = "e2b.dev"
WS_PORT = 49982
WS_ROUTE = "/ws"
