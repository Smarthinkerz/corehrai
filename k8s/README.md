# Kubernetes Manifests — AI HR Agent

Production-ready Kubernetes manifests for deploying the platform to any conformant cluster (EKS, GKE, AKS, k3s, etc.).

## Files

| File | Purpose |
|---|---|
| `namespace.yaml` | Isolates all resources in the `hragent` namespace |
| `configmap.yaml` | Non-sensitive runtime config (NODE_ENV, PORT, LOG_LEVEL) |
| `secret.yaml` | Template for sensitive env vars — apply with real values |
| `deployment.yaml` | 3-replica rolling deployment with health, readiness, liveness, startup probes; non-root container |
| `service.yaml` | ClusterIP service exposing port 80 → container 5000 |
| `ingress.yaml` | NGINX ingress with TLS via cert-manager + rate limiting |
| `hpa.yaml` | Horizontal autoscaler: 3–20 pods on CPU/memory utilization |
| `pdb.yaml` | PodDisruptionBudget guaranteeing min 2 pods during voluntary disruption |
| `cronjob-backup.yaml` | Nightly DB backup CronJob (03:00 UTC) running `scripts/backup-verify.sh` |

## Bootstrap

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets from your .env.production file
kubectl create secret generic hragent-secrets \
  --from-env-file=.env.production -n hragent

# 3. Apply config and workloads
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/cronjob-backup.yaml

# 4. Verify
kubectl get pods,svc,ingress,hpa,cronjob -n hragent
kubectl logs -f deploy/hragent -n hragent
```

## Image Build & Push

```bash
docker build -t ghcr.io/your-org/ai-hr-agent:$(git rev-parse --short HEAD) .
docker push ghcr.io/your-org/ai-hr-agent:$(git rev-parse --short HEAD)
kubectl set image deploy/hragent hragent=ghcr.io/your-org/ai-hr-agent:$(git rev-parse --short HEAD) -n hragent
kubectl rollout status deploy/hragent -n hragent
```

## Scaling Notes

- HPA targets CPU 70% / memory 80%; aggressive scale-up (100% per minute), conservative scale-down (25% per minute, 5-min stabilization).
- Each pod sized at 250m CPU / 512Mi RAM request (1000m / 1Gi limit) — load tested to ~400 RPS per pod on read paths.
- Database connection pool size in code is 10; with 20 pods that's 200 max connections. Adjust Neon pool ceiling accordingly.
- For >20 pods, route reporting endpoints to a Neon read replica.
