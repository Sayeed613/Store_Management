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
├── context/           # Theme context
├── hooks/             # Custom hooks
├── services/          # Firebase config
└── utils/             # Helper functions
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

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start the development server
npx expo start
```

## Environment Setup
1. Set up a Firebase project
2. Configure Firestore Database
3. Update Firebase configuration in `app/services/firebase/config.js`

## Key Features
- Real-time order tracking
- Flexible date filtering
- Payment status monitoring
- Store credit management
- Location-based store mapping
- Route-based organization

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT License

## Support
For support, email: Sayeedahmed90082@gmail.com