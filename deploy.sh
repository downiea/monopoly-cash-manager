#!/bin/bash

echo "Monopoly Cash Manager - Docker Deployment"
echo "=========================================="

HOST_IP=$(hostname -I | awk '{print $1}')

if [ -z "$HOST_IP" ]; then
    echo "Could not detect host IP. Please enter your server's LAN IP address:"
    read HOST_IP
fi

echo ""
echo "Detected/Using IP: $HOST_IP"
echo ""
echo "The app will be accessible at:"
echo "  Frontend: http://$HOST_IP"
echo "  Backend API: http://$HOST_IP:8000"
echo ""

read -p "Is this correct? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please enter the correct IP address:"
    read HOST_IP
fi

export HOST_IP

echo ""
echo "Building and starting containers..."
echo ""

docker compose down 2>/dev/null
docker compose build
docker compose up -d

echo ""
echo "=========================================="
echo "Deployment complete!"
echo ""
echo "Access the app at: http://$HOST_IP"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose logs -f"
echo "  Stop app:      docker compose down"
echo "  Restart app:   docker compose restart"
echo "=========================================="
