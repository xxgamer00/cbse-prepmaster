# CBSE PrepMaster

A comprehensive mobile application for CBSE Class 8 & 9 students and teachers to manage tests, track progress, and improve learning outcomes.

## Features

### For Students
- Take online tests with automatic scoring
- Track progress with detailed analytics
- View chapter-wise performance
- Access study materials and previous tests
- Offline test-taking capability
- Push notifications for new tests

### For Teachers/Admins
- Create and manage tests
- Import questions from OpenTrivia DB
- Assign tests to specific students
- View detailed student analytics
- Monitor class performance

## Tech Stack

### Frontend (Mobile App)
- React 18 with Material-UI
- Redux Toolkit for state management
- Capacitor for native Android features
- PWA support with offline functionality
- Chart.js for analytics visualization

### Backend
- Node.js with Express
- MongoDB for database
- JWT authentication
- RESTful API design
- Socket.IO for real-time updates

## Prerequisites

1. Development Environment:
   - Node.js v16+ and npm v8+
   - Android Studio (latest version)
   - JDK 11+
   - Android SDK Platform 33 (Android 13.0)
   - Android SDK Build-Tools 33.0.0
   - MongoDB (local or Atlas)

2. Required API Keys:
   - MongoDB Atlas connection string
   - OpenTrivia DB API key
   - Firebase project configuration (optional)

## Quick Start

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/yourusername/cbse-prepmaster.git
cd cbse-prepmaster

# Install server dependencies
cd server
npm install
cp .env.example .env  # Update with your credentials

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Environment Variables

Server (.env):
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
OPENTDB_API_URL=https://opentdb.com/api.php
```

Client (.env):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Initialize Android Project
```bash
cd client
node scripts/init-android.js
```

This script will:
- Set up Capacitor configuration
- Initialize Android project
- Generate app icons and splash screens
- Create necessary Android resources
- Set up build configurations

### 4. Development Workflow

Start Backend Server:
```bash
cd server
npm run dev
```

Start Frontend Development Server:
```bash
cd client
npm start
```

Run Android Development Build:
```bash
cd client
npm run android
```

### 5. Building Release APK

1. Generate Keystore:
```bash
cd client/android/app
keytool -genkey -v -keystore keystore/release.keystore -alias prepmaster -keyalg RSA -keysize 2048 -validity 10000
```

2. Set Environment Variables:
```bash
export KEYSTORE_PASSWORD=your_keystore_password
export KEY_ALIAS=prepmaster
export KEY_PASSWORD=your_key_password
```

3. Build Release APK:
```bash
cd client
npm run build:android-release
```

The APK will be available at: `client/android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
cbse-prepmaster/
├── client/                 # Frontend React Native application
│   ├── android/           # Android specific files
│   ├── public/            # Static assets
│   ├── scripts/           # Build and utility scripts
│   └── src/
│       ├── components/    # Reusable React components
│       ├── pages/         # Screen components
│       ├── store/         # Redux store configuration
│       ├── theme/         # UI theme configuration
│       └── utils/         # Helper functions
│
└── server/                # Backend Node.js application
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Custom middleware
    ├── models/          # Mongoose models
    ├── routes/          # API routes
    └── utils/           # Utility functions
```

## API Documentation

The API documentation is available at `/api-docs` when running the server in development mode.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@cbseprepmaster.com or create an issue in the repository.
