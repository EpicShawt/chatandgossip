# ChatAndGossip.com - Random Chat Application

A modern, real-time random chat application built with React.js and Node.js. Connect with people around the world through anonymous chat with premium features for enhanced experience.

## 🌟 Features

### Free Features
- **Anonymous Random Chat**: Connect with random people instantly
- **No Registration Required**: Start chatting immediately with a username
- **Real-time Messaging**: Instant message delivery with Socket.io
- **Typing Indicators**: See when your partner is typing
- **Online Status**: Display user online/offline status
- **Gender-based Profile Pictures**: Blue for male, pink for female, white for not disclosed
- **Test User**: Automatic replies from "Sarah" for testing

### Premium Features
- **Gender Filter**: Connect with specific gender (₹10/day)
- **Chat Rooms**: Join group chat rooms (₹5/room)
- **Payment Testing**: Enter "pass" to test premium features

### User System
- **Anonymous Mode**: Chat without registration (username lost on site close)
- **Account Creation**: Claim username with email + OTP verification
- **Google OAuth**: Sign up with Google account
- **Profile Management**: Update user information and preferences

## 🛠️ Tech Stack

### Frontend
- **React.js** with Vite for fast development
- **JavaScript** for modern web development
- **Tailwind CSS** for beautiful, responsive design
- **Socket.io Client** for real-time communication
- **React Router DOM** for navigation
- **Lucide React** for beautiful icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express framework
- **Socket.io** for real-time features
- **Firebase** (recommended) for database and authentication
- **JWT** for session management
- **Bcryptjs** for password hashing
- **Nodemailer** for OTP verification
- **UUID** for unique identifiers
- **Helmet** for security headers
- **Express Rate Limit** for rate limiting
- **Compression** for performance optimization

### Database
- **Firebase Firestore** for real-time data synchronization
- **Firebase Authentication** for user management
- **In-memory storage** for demo purposes

## 📁 Project Structure

```
chatandgossip/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── postcss.config.js    # PostCSS configuration
├── backend/                  # Node.js backend
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/          # Express middleware
│   ├── config/              # Configuration files
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
├── README.md                # Project documentation
└── .gitignore              # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatandgossip
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

3. **Open your browser**
   Navigate to `http://localhost:3000` to start using the application

## 🎯 Usage

### Free Chat
1. Enter a username on the landing page
2. Select your gender (optional)
3. Click "Start Free Chat"
4. Get connected with a random person instantly

### Test User
- The application includes a test user named "Sarah"
- She automatically replies to messages with contextual responses
- Perfect for testing the chat functionality

### Premium Features
1. **Gender Filter**: Click the filter icon in chat to access gender-specific matching
2. **Chat Rooms**: Join group chat rooms for multiple conversations
3. **Payment Testing**: Enter "pass" in payment dialogs to test premium features

### User Registration
1. Click "Sign Up" on the landing page
2. Fill in your details and verify email with OTP
3. Create your account and claim your username permanently

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (Stripe)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 🎨 Features in Detail

### Online Status System
- Real-time online/offline indicators
- Last seen timestamps
- Visual status indicators on profile pictures

### Gender-based Profile Pictures
- **Male**: Blue gradient profile picture
- **Female**: Pink gradient profile picture  
- **Not Disclosed**: White/gray gradient profile picture

### Test User Functionality
- Automatic replies from "Sarah"
- Contextual responses based on message content
- Simulates real user interaction for testing

### Payment System
- Simulated payment processing
- Test with "pass" code
- Premium feature access control

## 🔒 Privacy & Safety

### Privacy Policy
- Anonymous chat without personal information
- No data collection for free users
- Optional account creation for username claiming
- Clear disclaimers about user responsibility

### Safety Features
- No personal information sharing encouraged
- Safety reminders in chat interface
- Report system for inappropriate behavior
- Community guidelines enforcement

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm start
# Deploy to your preferred hosting service (Heroku, Vercel, etc.)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the privacy policy

---

**Note**: This application is for demonstration purposes. In production, implement proper security measures, database integration, and payment processing. 