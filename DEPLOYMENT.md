# TSD Properties Backend Deployment Guide

Your frontend is deployed on Vercel, but the Express API server needs to be hosted somewhere. Here are your options:

## Option 1: Deploy to Railway.app (RECOMMENDED - Same as your database)

### Steps:

1. **Connect your GitHub repository to Railway.app:**
   - Go to https://railway.app and log in
   - Click "Create Project" > "Deploy from GitHub"
   - Select your repository
   - Choose the branch to deploy

2. **Configure the server directory:**
   - In Railway settings, set the root directory to `/server`

3. **Add Environment Variables in Railway:**
   - Go to your project > Variables
   - Add:
     ```
     DB_HOST=crossover.proxy.rlwy.net
     DB_PORT=39666
     DB_NAME=railway
     DB_USER=postgres
     DB_PASSWORD=lm8KAzkC9t5tbBhflaoSMVkjMM0RGS2H
     JWT_SECRET=tsd_properties_jwt_secret_2026_secure
     PORT=5000
     NODE_ENV=production
     ```

4. **Deploy:**
   - Railway will automatically detect `server/package.json` and `server/index.js`
   - It will run `npm start` automatically

5. **Get your backend URL:**
   - Your deployed backend will be at `https://your-service-name.railway.app`

---

## Option 2: Deploy to Render.com

### Steps:

1. **Push code to GitHub**
2. **Go to https://render.com and sign up**
3. **Create New > Web Service**
4. **Connect your GitHub repository**
5. **Configure settings:**
   - Name: `tsd-properties-api`
   - Environment: `Node`
   - Start Command: `cd server && npm start`
   - Root Directory: (leave blank)

6. **Add Environment Variables:**
   - Same as Option 1 above

7. **Deploy**
   - Your URL will be `https://tsd-properties-api.onrender.com`

---

## Option 3: Deploy to Heroku

Heroku has moved to a paid model but the process is similar to above.

---

## Update Frontend with Backend URL

Once you have deployed the backend, update your Vercel deployment:

1. **In Vercel Dashboard:**
   - Select your TSD Properties project
   - Go to Settings > Environment Variables
   - Add:
     ```
     VITE_API_BASE_URL=https://your-deployed-backend-url.com/api
     ```
   - Example: `VITE_API_BASE_URL=https://tsd-properties-api.railway.app/api`

2. **Redeploy:**
   - Vercel will automatically redeploy when you save ENV variables
   - Or push a new commit to trigger redeploy

---

## Testing the Deployment

After deploying backend and updating the frontend ENV variable:

1. Visit your Vercel frontend URL
2. Open browser DevTools Console
3. Check if API calls to `/api/public/featured` and `/api/public/properties` work
4. Try logging into admin panel with `username: admin` / `password: admin123`

---

## Troubleshooting

If you still get 404 errors:

1. **Check that backend is running:**

   ```bash
   curl https://your-backend-url.com/api
   ```

   Should return an error, not 404 on a different path

2. **Verify VITE_API_BASE_URL is set correctly:**
   - Check Vercel settings
   - Make sure it ends with `/api`

3. **Check CORS issues:**
   - Your backend already has CORS enabled in `server/index.js`

4. **Backend logs:**
   - In Railway: go to your service > Logs
   - In Render: go to service > Logs
   - Look for database connection errors

---

## Current Local Setup (Not affected)

Your local development setup works fine with:

- Frontend: `npm run client` (port 3000, proxies to localhost:5000)
- Backend: `npm run server` (port 5000, uses local PostgreSQL credentials)

Continue using `npm run dev` locally to test changes.
