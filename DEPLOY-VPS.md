# Deploying TSD on the Contabo Linux VPS

## Dokploy setup

1. **Push the code to GitHub** (the `Dockerfile` is in the repo root).
2. In Dokploy: **Create Project → Create Service → Application**.
3. **Provider:** GitHub → repo `chirath1231/TSD`, branch `main`.
4. **Build Type:** `Dockerfile`, Docker File = `Dockerfile`, Build Path / context = `/`.
5. **Environment** tab: paste the variables below (JWT_SECRET and OCI_* copied from your local `.env`):
   ```env
   PORT=5000
   FRONTEND_URL=https://YOUR_DOMAIN
   DB_HOST=169.58.246.233
   DB_PORT=5432
   DB_NAME=tsd_db
   DB_USER=<postgres username>
   DB_PASSWORD=<postgres password>
   DB_SSL=false
   JWT_SECRET=...
   OCI_TENANCY_OCID=...
   OCI_USER_OCID=...
   OCI_FINGERPRINT=...
   OCI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   OCI_PRIVATE_KEY_PASSPHRASE=
   OCI_NAMESPACE=axz8nar3k6bi
   OCI_BUCKET=property-images
   OCI_REGION=ap-singapore-1
   ```
   If the Postgres was created *inside Dokploy*, you can instead use its **internal host**
   (shown on the database's page in Dokploy) as `DB_HOST`, and then stop exposing port 5432 publicly.
6. **Deploy**, then check **Logs**. You should see `✓ Server running on port 5000` and `✓ Database initialized`.
7. **Domains** tab: add your domain, **Container Port = 5000**, enable HTTPS (Let's Encrypt).
   Point the domain's DNS A record at `169.58.246.233`.
8. Optional: turn on **Auto Deploy** so every `git push` to `main` redeploys.

Dokploy handles the reverse proxy and SSL itself (Traefik).

---

