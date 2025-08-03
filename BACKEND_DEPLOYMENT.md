# Backend Deployment Guide - Railway

## Step 1: Prepare Backend for Deployment

### 1.1 Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Create a new project

### 1.2 Add Environment Variables
In Railway dashboard, add these environment variables:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=production
```

### 1.3 Deploy Backend
1. Connect your GitHub repository to Railway
2. Set the root directory to `backend`
3. Railway will automatically detect it's a Node.js app
4. Deploy!

## Step 2: Get Your Backend URL
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

## Step 3: Update Frontend
Add this environment variable to your Vercel deployment:
```
VITE_SOCKET_URL=https://your-app-name.railway.app
```

## Step 4: Test
1. Deploy backend to Railway
2. Update frontend with the backend URL
3. Test real-time chat!

---

## Quick Deploy Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from backend directory
cd backend
railway up
```

## Environment Variables Needed
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A random secret key for JWT tokens
- `PORT`: 5000 (Railway will override this)
- `NODE_ENV`: production 