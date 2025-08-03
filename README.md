# 🚀 ChatAndGossip - Real-Time Chat Application

A modern, responsive real-time chat application built with React, Node.js, and MongoDB. Connect with users worldwide through anonymous or registered accounts.

## ✨ Features

### 🔐 Authentication System
- **User Registration**: Create accounts with unique usernames and 6-character IDs
- **Email/Password Login**: Secure authentication with JWT tokens
- **Anonymous Chat**: Start chatting immediately without registration
- **Auto-Login**: Seamless experience after signup

### 💬 Real-Time Chat
- **Instant Messaging**: Real-time message delivery
- **Partner Matching**: Find chat partners automatically
- **Typing Indicators**: See when your partner is typing
- **Message History**: View conversation history
- **Next Partner**: Switch to new partners easily

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on all screen sizes
- **Glass Morphism**: Beautiful glass effect design
- **Smooth Animations**: Engaging user interactions
- **Dark/Light Theme**: Adaptive color schemes
- **Mobile-First**: Optimized for mobile devices

### 🔧 Technical Features
- **MongoDB Database**: Persistent user and message storage
- **Socket.io**: Real-time communication
- **JWT Authentication**: Secure token-based auth
- **CORS Enabled**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error management

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Socket.io**: Real-time communication
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chatandgossip.git
   cd chatandgossip
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm start
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:5000

## 📱 Responsive Design

The application is fully responsive and optimized for all screen sizes:

- **Mobile (320px+)**: Optimized touch interface
- **Tablet (768px+)**: Enhanced layout with more space
- **Desktop (1024px+)**: Full-featured experience
- **Large Screens (1440px+)**: Maximum content width

### Responsive Features
- **Fluid Typography**: Text scales with screen size
- **Adaptive Spacing**: Padding and margins adjust automatically
- **Flexible Grids**: Content reflows for different screens
- **Touch-Friendly**: Large touch targets on mobile
- **Optimized Images**: Responsive image loading

## 🎯 Usage

### For Users
1. **Anonymous Chat**: Enter a username and start chatting immediately
2. **Create Account**: Sign up with email and password for persistent features
3. **Find Partners**: Automatically matched with other users
4. **Send Messages**: Real-time messaging with typing indicators
5. **Switch Partners**: Find new chat partners anytime

### For Developers
1. **API Documentation**: RESTful endpoints for user management
2. **WebSocket Events**: Real-time communication protocols
3. **Database Schema**: MongoDB collections and relationships
4. **Component Structure**: React component hierarchy

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/debug/users` - List all users (debug)

### Chat
- `GET /api/health` - Server health check
- WebSocket events for real-time chat

## 📊 Database Schema

### Users Collection
```javascript
{
  uniqueId: "ABC123",        // 6-char unique identifier
  username: "john_doe",      // Unique username
  email: "john@example.com", // Unique email
  password: "hashed_password", // bcrypt hashed
  gender: "male|female|not_disclosed",
  isOnline: true,
  isVerified: true,
  isAnonymous: false,
  lastSeen: Date,
  createdAt: Date
}
```

### Messages Collection
```javascript
{
  from: "user_id",
  to: "partner_id",
  content: "message text",
  messageType: "text",
  timestamp: Date
}
```

## 🎨 Design System

### Color Palette
- **Primary**: Orange (#f59e0b)
- **Secondary**: Orange variants
- **Background**: Gradient orange tones
- **Text**: Gray scale (#1f2937)

### Typography
- **Font Family**: Inter, system fonts
- **Responsive Sizing**: Scales with screen size
- **Font Weights**: 400, 500, 600, 700

### Components
- **Buttons**: Primary, secondary, outline variants
- **Cards**: Glass morphism effect
- **Inputs**: Rounded with focus states
- **Chat Bubbles**: Sent/received styling

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist folder
```

### Backend (Railway/Render)
```bash
cd backend
# Set environment variables
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS
- **Socket.io**: For real-time communication
- **MongoDB**: For the database solution

## 📞 Support

For support, email support@chatandgossip.com or create an issue in the repository.

---

**Made with ❤️ by the ChatAndGossip Team** 