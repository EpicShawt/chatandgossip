# 🚀 Deployment Guide - ChatAndGossip

This guide will help you deploy your ChatAndGossip application to various platforms.

## 📋 Prerequisites

- Git repository set up
- Node.js and npm installed
- MongoDB database (local or Atlas)
- Environment variables configured

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from project root**
   ```bash
   vercel
   ```

3. **Configure build settings**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

4. **Set environment variables in Vercel dashboard**
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

### Option 2: Netlify

1. **Connect your Git repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository

2. **Configure build settings**
   - Build Command: `cd frontend && npm run build`
   - Publish Directory: `frontend/dist`

3. **Set environment variables**
   - Go to Site Settings > Environment Variables
   - Add `VITE_API_URL`

### Option 3: GitHub Pages

1. **Add homepage to package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/chatandgossip"
   }
   ```

2. **Install gh-pages**
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

3. **Add deploy script**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. **Connect your repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository

2. **Set environment variables**
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=production
   ```

3. **Deploy automatically**
   - Railway will auto-deploy on push to main branch

### Option 2: Render

1. **Create new Web Service**
   - Go to [Render](https://render.com)
   - Connect your GitHub repository

2. **Configure settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`

3. **Set environment variables**
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Atlas account**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create free cluster

2. **Configure network access**
   - Add IP: `0.0.0.0/0` (allow all IPs)
   - Or add specific IPs for security

3. **Create database user**
   - Username: `chatandgossip`
   - Password: `secure_password`
   - Role: `Read and write to any database`

4. **Get connection string**
   ```
   mongodb+srv://chatandgossip:secure_password@cluster.mongodb.net/chatandgossip?retryWrites=true&w=majority
   ```

### Local MongoDB

1. **Install MongoDB**
   ```bash
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   
   # macOS
   brew install mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   ```

2. **Start MongoDB**
   ```bash
   mongod
   ```

3. **Connection string**
   ```
   mongodb://localhost:27017/chatandgossip
   ```

## 🔐 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
```

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatandgossip
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

## 🚀 Quick Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy Backend
```bash
# Choose your platform (Railway recommended)
# Follow platform-specific instructions above
```

### 3. Deploy Frontend
```bash
# Choose your platform (Vercel recommended)
# Follow platform-specific instructions above
```

### 4. Update Environment Variables
- Update frontend environment variables with backend URL
- Update backend environment variables with frontend URL

### 5. Test Deployment
- Test user registration
- Test login functionality
- Test chat features
- Test responsive design

## 🔧 Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Real-time chat works
- [ ] Responsive design works on mobile
- [ ] Environment variables are set correctly
- [ ] Database connection is stable
- [ ] SSL certificates are valid
- [ ] Error handling is working

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check CORS configuration in `server.js`

2. **Database Connection Issues**
   - Verify MongoDB Atlas network access
   - Check connection string format
   - Ensure database user has correct permissions

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors in code

4. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match code
   - Verify no typos in values

### Debug Commands

```bash
# Check backend logs
heroku logs --tail
railway logs
render logs

# Check frontend build
npm run build
npm run preview

# Test API endpoints
curl https://your-backend-url.com/api/health
```

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Check application logs for errors
4. Verify environment variables are correct
5. Test locally before deploying

---

**Happy Deploying! 🚀** 