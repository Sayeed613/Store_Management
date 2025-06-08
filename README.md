# Store Management App

## Overview
A React Native mobile application for managing store sales, credit tracking, and payment collections. Built with Expo and Firebase.

## Features

### 1. Order Management
- Track daily, weekly, and monthly orders
- Filter orders by date ranges:
  - Today's orders
  - Last 5 days
  - 6-14 days history
  - 15+ days history
- Track payment status (Cash/Credit)
- View order details and history

### 2. Store Management
- Add and manage stores
- Store information tracking:
  - Store name and owner details
  - Contact information
  - Location mapping
  - Route assignment
- Track pending credits per store

### 3. Sales & Payments
- Record new sales with:
  - Multiple payment types (Cash/Credit)
  - Sales categories (Godown/Salesman/Store)
  - Partial payments
  - Balance tracking
- Payment collection management
- Real-time balance updates

### 4. Analytics
- Sales tracking over time
- Credit vs Cash analysis
- Payment collection status
- Store performance metrics
- Date-wise order analysis

## Technical Stack

### Frontend
- React Native / Expo
- TailwindCSS (NativeWind)
- Expo Router v2

### Backend
- Firebase
  - Firestore Database
  - Real-time updates

### Location Services
- React Native Maps
- Expo Location Services

## Project Structure
```
app/
├── (tabs)/              # Main screens (Orders, Stores, Settings)
├── components/          # UI Components
│   ├── analytics/       # Analytics components
│   ├── common/         # Shared components
│   ├── forms/          # Form elements
│   ├── maps/           # Map components
│   ├── outlet/         # Store components
│   └── transactions/   # Order components
├── constants/          # App constants
├── context/            # Theme context
├── hooks/              # Custom hooks
├── services/           # Firebase config
└── utils/              # Helper functions
```

## Data Models

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
| List Stores | `stores` | 1 query | 0 | ~10 times | 10 reads |
| View Store | `stores` | 1 | 0 | ~20 times | 20 reads |
| Add/Edit Store | `stores` | 1 | 1 | ~2 times | 2 reads, 2 writes |
| Create Sale | `sales` | 1 | 1 | ~30 times | 30 reads, 30 writes |
| Update Payment | `sales` | 1 | 1 | ~15 times | 15 reads, 15 writes |
| View Orders | `sales` | 1 query | 0 | ~50 times | 50 reads |
| Filter by Date | `sales` | 1 query | 0 | ~20 times | 20 reads |

### Monthly Estimate
| Type | Daily Average | Monthly Total | Firebase Tier |
|------|---------------|---------------|---------------|
| Reads | ~147 | ~4,410 | Free tier (50K/day) |
| Writes | ~47 | ~1,410 | Free tier (20K/day) |

## Installation
```bash
git clone <https://github.com/Sayeed613/Store_Management.git>n

npm install

npx expo start
```

## Environment Setup
1. Set up a Firebase project
2. Configure Firestore Database
3. Update Firebase configuration in `app/services/firebase/config.js`

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT License

## Support
For support, email: Sayeedahmed90082@gmail.com