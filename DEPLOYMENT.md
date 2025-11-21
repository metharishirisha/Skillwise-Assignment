# Deployment Guide

## Step 1: Push to GitHub

### Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it: `inventory-management-app` (or your preferred name)
4. Choose **Public** (as per assignment requirements)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Push Your Code

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/inventory-management-app.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

---

## Step 2: Deploy Backend (Render/Heroku/Railway)

### Option A: Deploy to Render (Recommended)

1. Go to [Render](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `inventory-management-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if deploying only backend folder)
5. Add Environment Variables (if needed):
   - `PORT`: `5000` (or leave default)
   - `NODE_ENV`: `production`
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy the service URL (e.g., `https://inventory-management-backend.onrender.com`)

### Option B: Deploy to Railway

1. Go to [Railway](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add service → Select the `backend` folder
5. Set start command: `npm start`
6. Deploy and copy the URL

### Option C: Deploy to Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Create app: `heroku create inventory-management-backend`
4. Set buildpack: `heroku buildpacks:set heroku/nodejs`
5. Deploy: `git subtree push --prefix backend heroku main`
6. Or use: `cd backend && git push heroku main`

---

## Step 3: Deploy Frontend (Netlify/Vercel)

### Option A: Deploy to Netlify (Recommended)

1. Go to [Netlify](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api`
   (Replace with your actual backend URL from Step 2)
6. Click "Deploy site"
7. Wait for deployment
8. Your site will be available at: `https://random-name.netlify.app`

### Option B: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api`
6. Click "Deploy"
7. Your site will be available at: `https://your-project.vercel.app`

---

## Step 4: Update Frontend API URL

After deploying the backend, update the frontend to use the production API URL:

### For Netlify:
1. Go to Site settings → Environment variables
2. Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
3. Redeploy the site

### For Vercel:
1. Go to Project settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
3. Redeploy

### Or update in code:
Edit `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.onrender.com/api';
```

---

## Step 5: Important Notes

### Backend Considerations:
- **SQLite on Render**: SQLite files may not persist on free tiers. Consider:
  - Using Render's PostgreSQL (free tier available)
  - Or use a service that supports persistent file storage
  - Or migrate to a cloud database

### Database Migration (If needed):
If SQLite doesn't work on your hosting platform, you may need to:
1. Use PostgreSQL instead of SQLite
2. Update database connection in `backend/server.js`
3. Update table creation queries for PostgreSQL syntax

### CORS Configuration:
Make sure your backend allows requests from your frontend domain:
```javascript
app.use(cors({
  origin: ['https://your-frontend.netlify.app', 'http://localhost:3000']
}));
```

---

## Submission Checklist

- [ ] GitHub repository is public and accessible
- [ ] Backend is deployed and accessible
- [ ] Frontend is deployed and accessible
- [ ] Frontend can communicate with backend API
- [ ] All features are working (CRUD, Import/Export, History)
- [ ] Test the application end-to-end

---

## Quick Commands Reference

```bash
# GitHub
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Backend (if using Heroku)
cd backend
heroku create your-app-name
git push heroku main

# Frontend build
cd frontend
npm run build
```

---

## Troubleshooting

### Backend not starting:
- Check build logs in deployment platform
- Ensure `package.json` has correct start script
- Verify all dependencies are in `dependencies` (not `devDependencies`)

### Frontend can't connect to backend:
- Check CORS settings in backend
- Verify `REACT_APP_API_URL` environment variable
- Check browser console for errors
- Verify backend URL is correct and accessible

### Database issues:
- SQLite may not work on some platforms
- Consider migrating to PostgreSQL or MongoDB
- Check file permissions for database file

