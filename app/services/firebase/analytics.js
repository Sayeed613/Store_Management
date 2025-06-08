// firebase/analytics.ts

import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from './config';

const getDateRangeForDays = (daysBack: number) => {
  const now = new Date();

  const endDate = new Date(now); // Today at 23:59:59
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack); // include full `daysBack` period
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

const snapshotToAnalytics = (snapshot) => {
  let total = 0;
  let cash = 0;
  let credit = 0;
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const amount = parseFloat(data.amount) || 0;
    const type = data.purchaseType?.toLowerCase();

    total += amount;
    count++;

    if (type === 'cash') cash += amount;
    else if (type === 'credit') credit += amount;
  });

  return { total, cash, credit, count };
};

export const fetchAnalytics = async (daysBack?: number) => {
  try {
    const ordersRef = collection(db, 'sales');
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let filteredSnapshot;

    if (daysBack) {
      const range = getDateRangeForDays(daysBack);
      startDate = range.startDate;
      endDate = range.endDate;

      const filteredQuery = query(
        ordersRef,
        where('orderDate', '>=', Timestamp.fromDate(startDate)),
        where('orderDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('orderDate', 'asc')  // IMPORTANT: orderBy asc with range filters
      );

      filteredSnapshot = await getDocs(filteredQuery);
    }

    const allOrdersSnapshot = await getDocs(ordersRef);

    const filteredStats = filteredSnapshot
      ? snapshotToAnalytics(filteredSnapshot)
      : snapshotToAnalytics(allOrdersSnapshot);
    const allStats = snapshotToAnalytics(allOrdersSnapshot);

    return {
      analytics: {
        filterDays: daysBack || 'all',
        range: daysBack
          ? {
              from: startDate?.toISOString(),
              to: endDate?.toISOString()
            }
          : null,
        cashAmount: filteredStats.cash,
        creditAmount: filteredStats.credit,
        totalAmount: filteredStats.total,
        orderCount: filteredStats.count,
        allTimeTotal: allStats.total
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};
