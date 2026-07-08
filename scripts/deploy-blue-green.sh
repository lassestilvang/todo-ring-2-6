#!/bin/bash

# TaskPlanner Blue-Green Deployment Script
set -e

# Configuration
NAMESPACE="taskplanner"
APP_NAME="taskplanner-app"
NEW_VERSION="${1:-latest}"
KUBE_CONFIG="${KUBE_CONFIG:-~/.kube/config}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Starting Blue-Green Deployment for $APP_NAME"

# Load Kubernetes config
export KUBECONFIG=$KUBE_CONFIG

# Determine current active deployment
CURRENT_DEPLOYMENT=$(kubectl get deployment -n $NAMESPACE -o jsonpath="{range .items[?(@.metadata.labels.app=='$APP_NAME')]}{.metadata.name}{end}")
CURRENT_COLOR=$(echo $CURRENT_DEPLOYMENT | grep -o 'green\|blue' || echo "blue")

# Toggle deployment color
if [ "$CURRENT_COLOR" == "blue" ]; then
    DEPLOYMENT_COLOR="green"
    OLD_DEPLOYMENT="$APP_NAME-blue"
else
    DEPLOYMENT_COLOR="blue"
    OLD_DEPLOYMENT="$APP_NAME-green"
fi

NEW_DEPLOYMENT="$APP_NAME-$DEPLOYMENT_COLOR"

echo "Current active: $CURRENT_DEPLOYMENT (color: $CURRENT_COLOR)"
echo "New deployment: $NEW_DEPLOYMENT (color: $DEPLOYMENT_COLOR)"

# Deploy new version
echo "📦 Deploying new version to $DEPLOYMENT_COLOR environment..."
kubectl apply -f k8s/ -n $NAMESPACE
kubectl set image deployment/$NEW_DEPLOYMENT $APP_NAME=taskplanner:$NEW_VERSION -n $NAMESPACE

# Wait for deployment to stabilize
echo "⏳ Waiting for pods to be ready..."
kubectl rollout status deployment/$NEW_DEPLOYMENT -n $NAMESPACE --timeout=300s

# Health check
echo "🩺 Performing health checks..."
for i in {1..30}; do
    if kubectl exec -n $NAMESPACE deployment/$NEW_DEPLOYMENT -- curl -f http://localhost:3000/api/health; then
        echo -e "${GREEN}Health check passed!${NC}"
        break
    fi
    echo "Waiting for health check... ($i/30)"
    sleep 5
done

# Switch traffic
echo "🔄 Switching traffic to $DEPLOYMENT_COLOR..."
kubectl patch service/taskplanner-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"app\":\"$APP_NAME\",\"color\":\"$DEPLOYMENT_COLOR}}}"

# Wait for service update
sleep 10

# Clean up old deployment
echo "🧹 Removing old deployment ($OLD_DEPLOYMENT)..."
kubectl delete deployment/$OLD_DEPLOYMENT -n $NAMESPACE --ignore-not-found=true

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "Active deployment: $NEW_DEPLOYMENT"