# Deploying TSD on the Contabo Linux VPS

Images are stored **on the server's disk** (no cloud bucket). Express serves them at `/uploads/...`.

## Dokploy setup

1. **Push the code to GitHub** (the `Dockerfile` is in the repo root).
2. In Dokploy: **Create Project → Create Service → Application**.
3. **Provider:** GitHub → repo `chirath1231/TSD`, branch `main`.
4. **Build Type:** `Dockerfile`, Docker File = `Dockerfile`, Docker Context Path = `.`, Build Stage = *(empty)*.
5. **Environment** tab:
   ```env
   PORT=5000
   FRONTEND_URL=https://YOUR_DOMAIN
   DB_HOST=169.58.246.233
   DB_PORT=5432
   DB_NAME=tsd_db
   DB_USER=<postgres username>
   DB_PASSWORD=<postgres password>
   DB_SSL=false
   JWT_SECRET=<copy from your local .env>
   ```
   No `OCI_*` variables are needed any more.
   If the Postgres was created *inside Dokploy*, you can use its **internal host** as `DB_HOST`
   and stop exposing port 5432 publicly.
6. **Advanced → Volumes → Add Volume** (**required**, otherwise every redeploy deletes all uploaded images):
   - Mount type: **Volume mount**
   - Volume name: `tsd-uploads`
   - Mount path: `/app/server/uploads`
7. **Deploy**, then check **Logs**. You should see `✓ Server running on port 5000` and `✓ Database initialized`.
8. **Domains** tab: Container Port = `5000`. For a real domain enable HTTPS (Let's Encrypt) and point its
   DNS A record at `169.58.246.233`.
9. Optional: turn on **Auto Deploy** so every `git push` to `main` redeploys.

## One-time: move existing images from Oracle Cloud to the server

Existing images (~210 MB) are still on the OCI bucket. After the first deploy with the volume mounted,
open the app's **Terminal** in Dokploy (or `docker exec -it <container> sh` over SSH) and run:

```sh
node server/scripts/migrate-oci-to-local.js
```

It downloads every image into the volume and rewrites the database URLs to `/uploads/...`.
It should end with `0 failed`. It is safe to re-run. Once the site shows all images, you can delete the OCI bucket.

## Backups

All images live in the Docker volume `tsd-uploads`. Back it up together with the database, e.g. over SSH:

```sh
docker run --rm -v tsd-uploads:/data -v /root/backups:/backup alpine \
  tar czf /backup/tsd-uploads-$(date +%F).tar.gz -C /data .
```

(The real volume name may have a prefix; check with `docker volume ls | grep tsd`.)
