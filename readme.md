# SN Traders - Store Management System

A comprehensive React Native application built with Expo for managing stores, sales, routes, and user operations. This app provides a complete solution for tracking store performance, managing orders, and handling user authentication.

## 🚀 Features

### 📱 Core Functionality
- **Cross-Platform**: Works on both iOS and Android
- **Dark/Light Theme**: Automatic theme switching support
- **Real-time Updates**: Firebase Firestore integration for live data sync
- **Offline Support**: Cached data for offline functionality

### 🔐 Authentication System
- **PIN-based Login**: Secure 4-digit PIN authentication
- **User Types**: Admin and Salesman roles with different permissions
- **Forgot PIN**: Cross-platform PIN reset using phone verification
- **Session Management**: Auto-logout and session persistence

### 🏪 Store Management
- **Store CRUD Operations**: Create, read, update, and delete stores
- **Location Integration**: GPS-based store location mapping
- **Route Assignment**: Assign stores to delivery routes
- **Store Status**: Active/Inactive store management
- **Credit Limits**: Set and manage store credit limits

### 📊 Sales & Orders
- **Order Creation**: Create sales orders with multiple payment types
- **Payment Tracking**: Partial and full payment management
- **Credit/Cash Sales**: Support for both credit and cash transactions
- **Order History**: Complete transaction history with filtering
- **Analytics**: Sales overview and performance metrics

### 👥 User Management (Admin Only)
- **User Creation**: Add new admins and salesmen
- **PIN Management**: Reset user PINs
- **Role Management**: Assign user types and permissions
- **User Monitoring**: Track user activities

### 🗺️ Route Management
- **Route Creation**: Create and manage delivery routes
- **Store Assignment**: Assign stores to specific routes
- **Route Status**: Enable/disable routes
- **Route Analytics**: Performance tracking per route

## 🛠️ Technology Stack

### Frontend
- **React Native** (0.79.3) - Mobile framework
- **Expo** (53.0.11) - Development platform
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **React Native Reanimated** - Smooth animations

### Backend & Database
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Storage** - File storage (if needed)

### UI/UX Libraries
- **@expo/vector-icons** - Icon library
- **react-native-modal** - Enhanced modals
- **react-native-maps** - Map integration
- **react-native-gesture-handler** - Touch gestures
- **react-native-gifted-charts** - Data visualization

### Utilities
- **AsyncStorage** - Local data persistence
- **expo-location** - GPS and location services
- **react-native-datetimepicker** - Date/time selection

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <https://github.com/Sayeed613/Store_Management.git>
cd Store_Management
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a `config.js` file in `app/services/firebase/`:





```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 4. Database Indexes Setup
For optimal query performance, configure the following indexes in your Firebase Console:

![Database Indexes](./assets/database-indexes.png)
![Database Indexes](./assets/database-rules.png)

**Required Indexes:**
- **outlets**: `status` (Ascending) + `storeName` (Ascending) + `__name__` (Ascending)
- **outlets**: `status` (Ascending) + `deactivatedAt` (Descending) + `__name__` (Ascendi ng)
- **sales**: `outletId` (Ascending) + `status` (Ascending) + `__name__` (Ascending)
- **sales**: `outletId` (Ascending) + `orderDate` (Descending) + `__name__` (Ascending)
- **sales**: `outletId` (Ascending) + `status` (Ascending) + `orderDate` (Descending) + `__name__` (Ascending)
- **sales**: `outletId` (Ascending) + `createdAt` (Descending) + `__name__` (Ascending)
- **sales**: `orderDate` (Descending) + `orderDate` (Ascending) + `__name__` (Ascending)

**Add Collection**
- first add users
document id random
users :[
  {
    fullName :"syed Nawaz",
    phone:"9008299613",
    pin:"9632",
    userType:"admin",
    username:"nawaz"
  },
  {
     fullName :"sayeed",
    phone:"9008299713",
    pin:"1111",
    userType:"salesman",
    username:"sayeed"
  }
]

- rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /outlets/{docId} {
      allow read, write: if true;
    }
    match /sales/{docId} {
      allow read, write: if true;
    }
    match /route/{docId} {
      allow read, write: if true;
    }
    match /users/{docId} {
      allow read, write: if true;
    }
  }
}

- add route
collection
route :[
  {
    id:
    route:Robertsonpet,
    status:boolean
  }
]

### 5. Start Development Server
```bash
npm start
# or
expo start
```

### 6. Run on Device/Simulator
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📱 App Structure

```
app/
├── (tabs)/                     # Tab-based navigation
│   ├── index.jsx              # Sales history/dashboard
│   ├── Stores.jsx             # Store listing and management
│   ├── add-outlet.jsx         # Add/edit store form
│   ├── admin.jsx              # Admin panel
│   └── settings.jsx           # App settings
├── components/                 # Reusable components
│   ├── analytics/             # Chart and analytics components
│   ├── Aunthentication/       # Auth-related components
│   ├── common/                # Common UI components
│   ├── forms/                 # Form input components
│   ├── maps/                  # Map-related components
│   ├── outlet/                # Store-specific components
│   └── transactions/          # Order and payment components
├── context/                   # React Context providers
│   ├── AuthContext.jsx        # Authentication state
│   └── ThemeContextProvider.jsx # Theme management
├── screens/                   # Full-screen components
│   ├── AnalyticsOverview.jsx  # Analytics dashboard
│   ├── InActiveStores.jsx     # Inactive store management
│   ├── MapScreen.jsx          # Location picker
│   ├── Route.jsx              # Route management
│   └── Users.jsx              # User management
├── services/                  # External service integrations
│   └── firebase/              # Firebase configuration
├── utils/                     # Utility functions
├── constants/                 # App constants
├── login.jsx                  # Login screen
└── index.jsx                  # App entry point
```

## 🔄 App Flow

### 1. Authentication Flow
```
Login Screen → PIN Entry → User Validation → Main App
     ↓
Forgot PIN → Phone Verification → New PIN Setup → Login
```

### 2. Store Management Flow
```
Store List → Add/Edit Store → Location Selection → Route Assignment → Save
     ↓
Store Details → View Transactions → Edit Info → Deactivate Store
```

### 3. Order Creation Flow
```
Order Modal → Select Store → Enter Details → Payment Type → Save Order
     ↓
Order History → Payment Tracking → Order Completion
```

### 4. Admin Operations Flow
```
Admin Panel → User Management → Route Management → Analytics → Settings
```

## 📊 Database Structure

### Users Collection
```javascript
{
  id: "auto-generated",
  fullName: "John Doe",
  username: "johndoe",
  pin: "1234",
  phone: "1234567890",
  userType: "admin" | "salesman",
  createdAt: timestamp
}
```

### Outlets Collection
```javascript
{
  id: "auto-generated",
  storeName: "ABC Store",
  propName: "Store Owner",
  phoneNumber: "+911234567890",
  route: "Route A",
  street: "Main Street",
  locality: "Downtown",
  landmark: "Near Bank",
  location: {
    latitude: 12.34567,
    longitude: 78.91234
  },
  creditLimit: 50000,
  status: "active" | "inactive",
  totalOrders: 0,
  totalAmount: 0,
  pendingAmount: 0,
  lastOrderDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sales Collection
```javascript
{
  id: "auto-generated",
  outletId: "outlet-id",
  amount: 1000,
  salesType: "Godown" | "Salesman" | "Store",
  purchaseType: "Credit" | "Cash",
  status: "Pending" | "Completed",
  customerName: "Customer Name",
  orderDate: timestamp,
  payments: [
    {
      amount: 500,
      date: timestamp,
      paymentType: "Cash"
    }
  ],
  totalPaid: 500,
  createdAt: timestamp
}
```

### Routes Collection
```javascript
{
  id: "auto-generated",
  name: "Route A",
  status: true,
  createdAt: timestamp
}
```

## 🔧 Configuration

### Theme Configuration
The app supports automatic dark/light theme switching based on system preferences. Themes can be manually controlled through the settings screen.

### Location Services
- Requires location permissions for store mapping
- Uses Google Maps for location visualization
- GPS coordinates stored for each store

### Offline Support
- Uses AsyncStorage for local data caching
- Form data persistence during navigation
- Automatic sync when connection restored

## 🚀 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

## 📱 Features by User Type

### Admin Features
- ✅ Full store management (CRUD operations)
- ✅ User management and PIN resets
- ✅ Route creation and management
- ✅ Complete analytics dashboard
- ✅ Inactive store management
- ✅ Order creation and management
- ✅ All payment operations

### Salesman Features
- ✅ View store listings
- ✅ Create and manage orders
- ✅ Process payments
- ✅ View order history
- ✅ Basic analytics
- ❌ User management
- ❌ Route management
- ❌ Store deletion

## 🔐 Security Features

- **PIN-based Authentication**: 4-digit secure PIN system
- **Role-based Access Control**: Different permissions for admin/salesman
- **Phone Verification**: PIN reset via phone number verification
- **Session Management**: Automatic logout after inactivity
- **Data Validation**: Input sanitization and validation

## 📈 Performance Optimizations

- **Real-time Updates**: Firestore listeners for live data sync
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Optimized image loading and caching
- **Animation Performance**: Native driver for smooth animations
- **Memory Management**: Proper cleanup of listeners and subscriptions

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Android build errors**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build errors**
   ```bash
   cd ios && xcodebuild clean && cd ..
   ```

4. **Firebase connection issues**
   - Verify Firebase configuration
   - Check internet connectivity
   - Ensure Firestore rules are properly set

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For any contributions or modifications, please contact the development team.

## 📞 Support

For technical support or queries, please contact:
- **Email**: [sayeedahmed90082@gmail.com]
- **Phone**: [+91-9008299613]

---

**Version**: 1.0.0
**Last Updated**: June 2025
**Platform**: React Native with Expo
**Minimum OS**: iOS 12.0, Android 7.0