# GCP Migration Guide - Flamemitra Application

## 📋 Overview
This guide covers the complete migration of the Flamemitra application from a GCP Ubuntu VM to GCP managed services (Cloud Storage + Cloud Run) for cost optimization and scalability.

---

## 🎯 Migration Summary

### Current Setup (VM-based)
- **VM IP**: 34.100.216.87
- **Frontend**: Angular app served by Nginx
- **Backend**: .NET 9.0 API on port 5027
- **Database**: MS SQL Server on localhost:1433
- **Deployment**: Manual via `deploy.sh` script

### Target Setup (Managed Services)
- **Frontend**: Cloud Storage bucket (`flamemitra-frontend`) + CDN
- **Backend**: Cloud Run service (`flamemitra-api`)
- **Database**: MS SQL Server (Cloud SQL migration planned for later)
- **CI/CD**: Cloud Build automated pipelines
- **Domain**: flamemitra.in (frontend) | api.flamemitra.in (backend)

---

## ✅ Prerequisites Checklist

### 1. GCP Account & Project Setup
- [ ] GCP project created: `flamemitra-prod`
- [ ] Project ID confirmed: `project-2d8a14e5-82f9-4683-bba`
- [ ] Billing enabled on the project
- [ ] Required APIs enabled (see commands below)

### 2. Local Development Environment
- [ ] Google Cloud SDK installed ([Download](https://cloud.google.com/sdk/docs/install))
- [ ] Authenticated with GCP: `gcloud auth login`
- [ ] Node.js 18+ installed
- [ ] Angular CLI installed: `npm install -g @angular/cli`
- [ ] Docker installed (optional, for local testing)

### 3. Access & Permissions
- [ ] Owner or Editor role on `flamemitra-prod` project
- [ ] Permissions to create Cloud Storage buckets
- [ ] Permissions to deploy Cloud Run services
- [ ] Access to domain DNS settings for `flamemitra.in`

### 4. Database Access
- [ ] Database connection string available
- [ ] Database accessible from Cloud Run IP ranges
- [ ] Firewall rules configured to allow Cloud Run → Database

---

## 🚀 One-Time GCP Setup

### Step 1: Enable Required APIs
```bash
# Set your project
gcloud config set project flamemitra-prod

# Enable required GCP services
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  storage.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### Step 2: Create Cloud Storage Bucket for Frontend
```bash
# Create bucket
gsutil mb -p flamemitra-prod -c STANDARD -l asia-south1 gs://flamemitra-frontend

# Enable static website hosting
gsutil web set -m index.html -e index.html gs://flamemitra-frontend

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://flamemitra-frontend

# Enable CORS (if needed for API calls)
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://flamemitra-frontend
rm cors.json
```

### Step 3: Store Database Connection String in Secret Manager
```bash
# Create secret for database connection string
echo -n "Server=34.100.216.87,1433;Database=YourDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True" | \
  gcloud secrets create db-connection-string \
    --data-file=- \
    --replication-policy="automatic"

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding db-connection-string \
  --member="serviceAccount:$(gcloud iam service-accounts list --filter='displayName:Compute Engine default service account' --format='value(email)')" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 4: Configure Cloud Build Triggers (Optional - for CI/CD)

#### Frontend Trigger
```bash
gcloud builds triggers create github \
  --name="deploy-frontend" \
  --repo-name="sandhyaflames-UI" \
  --repo-owner="neurocraft-admin" \
  --branch-pattern="^main$" \
  --build-config="gcp-migration/cloudbuild.yaml"
```

#### Backend Trigger
```bash
gcloud builds triggers create github \
  --name="deploy-backend" \
  --repo-name="Ssandhyaflames-WebAPI" \
  --repo-owner="neurocraft-admin" \
  --branch-pattern="^main$" \
  --build-config="gcp-migration/cloudbuild.yaml" \
  --substitutions="_DB_CONNECTION_STRING=\$(gcloud secrets versions access latest --secret=db-connection-string)"
```

---

## 📦 Manual Deployment Instructions

### Deploy Frontend to Cloud Storage

1. **Navigate to frontend repository:**
   ```bash
   cd gas-agency-ui
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x gcp-migration/deploy-to-gcs.sh
   ```

3. **Run the deployment:**
   ```bash
   ./gcp-migration/deploy-to-gcs.sh
   ```

4. **Verify deployment:**
   ```bash
   # List files in bucket
   gsutil ls gs://flamemitra-frontend

   # Test in browser
   open https://storage.googleapis.com/flamemitra-frontend/index.html
   ```

### Deploy Backend to Cloud Run

1. **Navigate to backend repository:**
   ```bash
   cd ../WebAPI
   ```

2. **Set the database connection string:**
   ```bash
   export DB_CONNECTION_STRING="Server=34.100.216.87,1433;Database=YourDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True"
   ```

   **OR** edit `gcp-migration/deploy-to-cloudrun.sh` and set it directly in the file.

3. **Make the deployment script executable:**
   ```bash
   chmod +x gcp-migration/deploy-to-cloudrun.sh
   ```

4. **Run the deployment:**
   ```bash
   ./gcp-migration/deploy-to-cloudrun.sh
   ```

5. **Verify deployment:**
   ```bash
   # Get Cloud Run service URL
   gcloud run services describe flamemitra-api \
     --region=asia-south1 \
     --format='value(status.url)'

   # Test API health endpoint
   curl $(gcloud run services describe flamemitra-api --region=asia-south1 --format='value(status.url)')/api/health
   ```

---

## 🔧 Managing Database Connection String

### Option 1: Using Environment Variables (Current Method)
The connection string is passed during deployment via `--set-env-vars` flag.

**To update the connection string:**
```bash
gcloud run services update flamemitra-api \
  --region=asia-south1 \
  --update-env-vars="ConnectionStrings__DefaultConnection=NEW_CONNECTION_STRING"
```

### Option 2: Using Secret Manager (Recommended)
Reference the secret directly in Cloud Run:

```bash
gcloud run services update flamemitra-api \
  --region=asia-south1 \
  --update-secrets="ConnectionStrings__DefaultConnection=db-connection-string:latest"
```

### Verify Current Environment Variables
```bash
gcloud run services describe flamemitra-api \
  --region=asia-south1 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

## 🌐 DNS Setup Instructions

### Frontend (flamemitra.in)

#### Option 1: Using Cloud Load Balancer (Recommended for Production)
1. Create a load balancer with Cloud Storage backend
2. Point domain to load balancer IP
3. Enable Cloud CDN for better performance

```bash
# Reserve static IP
gcloud compute addresses create flamemitra-frontend-ip \
  --global

# Get the IP address
gcloud compute addresses describe flamemitra-frontend-ip \
  --global --format='value(address)'
```

4. **Configure DNS A Record:**
   - Type: `A`
   - Name: `@` (or `flamemitra.in`)
   - Value: `<STATIC_IP_FROM_ABOVE>`
   - TTL: `3600`

#### Option 2: Using CNAME (Quick Setup)
1. **Configure DNS CNAME Record:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `c.storage.googleapis.com`
   - TTL: `3600`

2. **Bucket configuration:**
   ```bash
   gsutil web set -m index.html gs://flamemitra-frontend
   ```

### Backend (api.flamemitra.in)

1. **Get Cloud Run service URL:**
   ```bash
   gcloud run services describe flamemitra-api \
     --region=asia-south1 \
     --format='value(status.url)'
   ```

2. **Map custom domain to Cloud Run:**
   ```bash
   gcloud run domain-mappings create \
     --service=flamemitra-api \
     --domain=api.flamemitra.in \
     --region=asia-south1
   ```

3. **Get DNS records to configure:**
   ```bash
   gcloud run domain-mappings describe \
     --domain=api.flamemitra.in \
     --region=asia-south1
   ```

4. **Add DNS records** shown in the output to your DNS provider.

5. **Verify domain mapping:**
   ```bash
   curl https://api.flamemitra.in/api/health
   ```

---

## 🔄 Rollback Plan (Revert to VM)

If you need to rollback to the VM-based deployment:

### Quick Rollback
1. **Update frontend environment:**
   ```bash
   cd gas-agency-ui/src/environments
   # Edit environment.prod.ts and change:
   # apiUrl: 'https://api.flamemitra.in' → apiUrl: '/api'
   ```

2. **Deploy to VM using existing script:**
   ```bash
   cd ../..
   ./deploy.sh
   ```

3. **Update DNS:**
   - Point `flamemitra.in` → `34.100.216.87`
   - Remove `api.flamemitra.in` record

### Verify VM Deployment
```bash
ssh user@34.100.216.87
sudo systemctl status nginx
sudo systemctl status kestrel-webapi  # Or your API service name
```

### Cleanup GCP Resources (Optional)
```bash
# Stop Cloud Run service (to avoid charges)
gcloud run services delete flamemitra-api --region=asia-south1

# Delete frontend bucket
gsutil rm -r gs://flamemitra-frontend
```

---

## 💰 Cost Comparison

### Current VM Setup (Monthly)
| Resource | Specification | Cost (USD) |
|----------|--------------|------------|
| VM Instance | e2-medium (2 vCPU, 4GB RAM) | ~$24.27 |
| External IP | Static IP | ~$7.30 |
| Disk Storage | 50 GB SSD | ~$8.50 |
| **Total** | | **~$40.07/month** |

### Managed Services Setup (Monthly)

#### Cloud Storage (Frontend)
| Resource | Estimation | Cost (USD) |
|----------|-----------|------------|
| Storage | 1 GB (Angular app) | ~$0.02 |
| Class A Operations | 10,000 requests | ~$0.05 |
| Class B Operations | 100,000 requests | ~$0.40 |
| Network Egress | 10 GB (India) | ~$0.80 |
| **Subtotal** | | **~$1.27/month** |

#### Cloud Run (Backend)
| Resource | Estimation | Cost (USD) |
|----------|-----------|------------|
| CPU | 1 vCPU @ 10% average | ~$2.40 |
| Memory | 512 MB @ 10% average | ~$0.27 |
| Requests | 100,000/month | ~$0.40 |
| Network Egress | 10 GB | ~$0.80 |
| **Subtotal** | | **~$3.87/month** |

#### Cloud Build (CI/CD)
| Resource | Estimation | Cost (USD) |
|----------|-----------|------------|
| Build Time | 120 mins/month (free tier) | $0.00 |
| **Subtotal** | | **$0.00/month** |

### Total Managed Services Cost
**~$5.14/month** (excluding database)

### Savings
- **Monthly Savings**: ~$35/month (~87% reduction)
- **Annual Savings**: ~$420/year
- **Additional Benefits**:
  - Auto-scaling (pay only for what you use)
  - Zero downtime deployments
  - Built-in SSL/TLS certificates
  - Automatic DDoS protection
  - No server maintenance overhead

---

## 🧪 Testing Checklist

After deployment, verify the following:

### Frontend Tests
- [ ] Website loads at `https://flamemitra.in`
- [ ] All pages navigate correctly
- [ ] Images and assets load properly
- [ ] No console errors in browser
- [ ] API calls work correctly

### Backend Tests
- [ ] API health endpoint responds: `https://api.flamemitra.in/api/health`
- [ ] Authentication works correctly
- [ ] Database queries execute successfully
- [ ] All API endpoints return expected data
- [ ] Error handling works as expected

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (average)
- [ ] No timeout errors under normal load

### Security Tests
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Authentication tokens work
- [ ] Unauthorized access blocked

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem**: 404 errors on page refresh
- **Cause**: Cloud Storage doesn't handle SPA routing
- **Solution**: Use Cloud Load Balancer with URL rewrite rules OR use Firebase Hosting

**Problem**: Assets not loading (404 on JS/CSS)
- **Cause**: Incorrect base href in Angular build
- **Solution**: Verify `angular.json` has correct base href: `"/"`

### Backend Issues

**Problem**: Cloud Run service returns 503
- **Cause**: Container not listening on correct port
- **Solution**: Verify `ASPNETCORE_URLS=http://+:8080` in Dockerfile

**Problem**: Database connection failures
- **Cause**: Cloud Run IP not whitelisted in database firewall
- **Solution**: Whitelist Cloud Run IP range for `asia-south1`: [IP Ranges](https://cloud.google.com/run/docs/reference/rest/v1/namespaces.services/list)

**Problem**: Environment variables not set
- **Cause**: Variables not passed during deployment
- **Solution**: Run update command:
  ```bash
  gcloud run services update flamemitra-api \
    --region=asia-south1 \
    --update-env-vars="KEY=VALUE"
  ```

### DNS Issues

**Problem**: Domain not resolving
- **Cause**: DNS propagation delay
- **Solution**: Wait 24-48 hours, verify DNS records with `dig` or `nslookup`

**Problem**: SSL certificate errors
- **Cause**: Domain mapping not complete
- **Solution**: Verify domain ownership and wait for certificate provisioning

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Storage Static Website Hosting](https://cloud.google.com/storage/docs/hosting-static-website)
- [Cloud Build Configuration](https://cloud.google.com/build/docs/configuring-builds/create-basic-configuration)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)

---

## 🎓 Support & Maintenance

### Regular Maintenance Tasks
- Monitor Cloud Run logs: `gcloud run services logs read flamemitra-api --region=asia-south1`
- Review billing: [GCP Console Billing](https://console.cloud.google.com/billing)
- Update dependencies: Rebuild and redeploy monthly
- Review security: Check vulnerability scans in Container Registry

### Getting Help
- GCP Support: [console.cloud.google.com/support](https://console.cloud.google.com/support)
- Stack Overflow: Tag questions with `google-cloud-run` or `google-cloud-storage`
- GitHub Issues: Open issues in respective repositories

---

## ✨ Next Steps (Future Enhancements)

1. **Migrate Database to Cloud SQL**
   - Better performance and managed backups
   - Estimated additional cost: ~$30/month for db-f1-micro

2. **Add Cloud CDN**
   - Faster content delivery globally
   - Estimated additional cost: ~$0.50/month

3. **Implement Cloud Armor**
   - DDoS protection and WAF
   - Estimated additional cost: ~$10/month

4. **Set up Cloud Monitoring & Alerting**
   - Proactive issue detection
   - Free tier available

5. **Implement Blue-Green Deployments**
   - Zero-downtime deployments
   - Traffic splitting for gradual rollouts

---

*Last Updated: April 25, 2026*  
*Version: 1.0*
