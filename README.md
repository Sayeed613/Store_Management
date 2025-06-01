# Store Management App

## Overview
A comprehensive mobile application for managing stores, sales tracking, and payment collections. Built with React Native, Expo, and Firebase.

## Features

### 1. Store Management
- Add/Edit/Delete stores
- Store details tracking:
  - Store name and owner information
  - Contact details
  - Location mapping
  - Route assignment
  - Payment history

### 2. Sales Operations
- Record new sales transactions
- Multiple payment types:
  - Cash payments
  - Credit sales
- Sales categorization:
  - Godown sales
  - Salesman sales
  - Store sales

### 3. Payment Management
- Track pending payments
- Record partial payments
- Payment history
- Dynamic balance calculation
- Status updates (Completed/Pending)

### 4. Analytics & Reporting
- Monthly sales overview
- Credit vs Cash analysis
- Store-wise performance
- Route-wise analysis
- Payment collection trends

### 5. Location Features
- Store location mapping
- Route optimization
- Direction support
- Address management

## Technical Stack

### Frontend
- React Native / Expo
- TailwindCSS (NativeWind)
- Expo Router

### Backend
- Firebase
  - Firestore Database
  - Authentication
  - Cloud Functions

### Maps & Location
- React Native Maps
- Expo Location

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

1. Create a Firebase project
2. Add your Firebase configuration in `app/services/firebase/config.js`
3. Enable necessary Firebase services:
   - Firestore Database
   - Authentication
   - Cloud Functions (optional)

## Project Structure

```
app/
├── (tabs)/              # Main tab screens
├── components/          # Reusable components
│   ├── analytics/      # Analytics components
│   ├── common/         # Common UI components
│   ├── forms/          # Form components
│   ├── maps/          # Map related components
│   ├── outlet/        # Store management components
│   └── transactions/  # Transaction components
├── constants/          # App constants
├── context/           # Context providers
├── hooks/             # Custom hooks
├── screens/           # Additional screens
├── services/          # Firebase services
└── utils/             # Utility functions
```

## Key Features Implementation

### Store Management
- CRUD operations for stores
- Location tracking
- Payment history
- Status management

### Sales Process
1. Select store
2. Choose sale type
3. Enter amount
4. Process payment
5. Update store status

### Payment Collection
1. View pending payments
2. Record new payments
3. Update payment status
4. Generate payment history

## Data Structure

### Store Document
```javascript
{
  storeName: string,
  propName: string,
  phoneNumber: string,
  route: string,
  address: string,
  location: {
    latitude: number,
    longitude: number
  },
  lastOrderAmount: number,
  pendingAmount: number,
  totalOrders: number
}
```

### Transaction Document
```javascript
{
  outletId: string,
  amount: number,
  purchaseType: 'Cash' | 'Credit',
  salesType: 'Godown' | 'Salesman' | 'Store',
  status: 'Completed' | 'Pending',
  payments: Array<Payment>,
  orderDate: timestamp
}
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License

## Support
For support, email [your-email@example.com]




