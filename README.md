# Store Management App

## Overview
A React Native mobile application for managing store sales, credit tracking, payment collections, and user administration. Built with Expo and Firebase.

## Features

### 1. Admin Dashboard
- Secure PIN-based authentication
- User management system
- Route configuration
- Store activation controls
- Real-time statistics and metrics

### 2. User Management
- Create and manage admin users
- Secure PIN authentication
- User activity tracking
- PIN reset functionality
- Role-based access control

### 3. Order Management
- Track daily, weekly, and monthly orders
- Filter orders by date ranges:
  - Today's orders
  - Last 5 days
  - 6-14 days history
  - 15+ days history
- Track payment status (Cash/Credit)
- View order details and history

### 4. Store Management
- Add and manage stores
- Store activation/deactivation
- Store information tracking:
  - Store name and owner details
  - Contact information
  - Location mapping
  - Route assignment
- Track pending credits per store

### 5. Sales & Payments
- Record new sales with:
  - Multiple payment types (Cash/Credit)
  - Sales categories (Godown/Salesman/Store)
  - Partial payments
  - Balance tracking
- Payment collection management
- Real-time balance updates

### 6. Analytics
- Sales tracking over time
- Credit vs Cash analysis
- Payment collection status
- Store performance metrics
- Date-wise order analysis
- User activity metrics

## Technical Stack

### Frontend
- React Native / Expo
- TailwindCSS (NativeWind)
- Expo Router v2
- Modern UI/UX with dark mode support

### Backend
- Firebase
  - Firestore Database
  - Real-time updates
  - User authentication
  - Secure data access

### Location Services
- React Native Maps
- Expo Location Services

## Project Structure
```
app/
├── (tabs)/              # Main screens (Orders, Stores, Admin, Settings)
├── components/          # UI Components
│   ├── analytics/       # Analytics components
│   ├── authentication/ # Auth components
│   ├── common/         # Shared components
│   ├── forms/          # Form elements
│   ├── maps/           # Map components
│   ├── outlet/         # Store components
│   └── transactions/   # Order components
├── constants/          # App constants
├── context/           # Theme and auth context
├── hooks/             # Custom hooks
├── screens/           # Feature screens
├── services/          # Firebase config
└── utils/             # Helper functions
```

## Data Models

### User
```javascript
{
  name: string,
  pin: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastActive: timestamp
}
```

### Store
```javascript
{
  storeName: string,
  propName: string,
  phoneNumber: string,
  route: string,
  street: string,
  locality: string,
  landmark: string,
  isActive: boolean,
  deactivatedAt: timestamp,
  location: {
    latitude: number,
    longitude: number
  }
}
```

### Order/Sale
```javascript
{
  outletId: string,
  storeName: string,
  salesType: 'Godown' | 'Salesman' | 'Store',
  purchaseType: 'Cash' | 'Credit',
  amount: number,
  totalPaid: number,
  remainingBalance: number,
  status: 'Completed' | 'Pending',
  orderDate: timestamp,
  payments: Array<{
    amount: number,
    date: timestamp,
    paymentType: string
  }>
}
```

## Firebase Operations

### Daily Operations
| Operation | Collection | Reads | Writes | Frequency | Daily Total |
|-----------|------------|--------|---------|-----------|-------------|
| User Auth | `users` | 1 | 0 | ~50 times | 50 reads |
| List Stores | `stores` | 1 query | 0 | ~10 times | 10 reads |
| View Store | `stores` | 1 | 0 | ~20 times | 20 reads |
| Add/Edit Store | `stores` | 1 | 1 | ~2 times | 2 reads, 2 writes |
| Create Sale | `sales` | 1 | 1 | ~30 times | 30 reads, 30 writes |
| Update Payment | `sales` | 1 | 1 | ~15 times | 15 reads, 15 writes |
| View Orders | `sales` | 1 query | 0 | ~50 times | 50 reads |
| User Management | `users` | 1 | 1 | ~5 times | 5 reads, 5 writes |

### Monthly Estimate
| Type | Daily Average | Monthly Total | Firebase Tier |
|------|---------------|---------------|---------------|
| Reads | ~182 | ~5,460 | Free tier (50K/day) |
| Writes | ~52 | ~1,560 | Free tier (20K/day) |

## Installation
```bash
git clone https://github.com/Sayeed613/Store_Management.git
cd Store_Management
npm install
npx expo start
```

## Environment Setup
1. Set up a Firebase project
2. Configure Firestore Database
3. Update Firebase configuration in `app/services/firebase/config.js`
4. Set up initial admin user

## Security
- PIN-based authentication
- Secure data access
- Role-based permissions
- Activity logging

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT License

## Support
For support, email: Sayeedahmed90082@gmail.com