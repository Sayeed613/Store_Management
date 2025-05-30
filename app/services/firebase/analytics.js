import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from './config';

export const fetchAnalytics = async () => {
  try {
    const now = new Date();

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const ordersRef = collection(db, 'sales');

    const monthQuery = query(
      ordersRef,
      where('orderDate', '>=', Timestamp.fromDate(firstDayOfMonth)),
      where('orderDate', '<', Timestamp.fromDate(firstDayNextMonth)),
      orderBy('orderDate', 'desc')
    );

    const allOrdersQuery = query(ordersRef);

    const [monthSnapshot, allOrdersSnapshot] = await Promise.all([
      getDocs(monthQuery),
      getDocs(allOrdersQuery)
    ]);

    let monthlyTotal = 0;
    let cashTotal = 0;
    let creditTotal = 0;
    let orderCount = 0;

    monthSnapshot.forEach(doc => {
      const data = doc.data();
      const amount = parseFloat(data.amount) || 0;

      monthlyTotal += amount;
      orderCount++;

      if (data.purchaseType?.toLowerCase() === 'cash') {
        cashTotal += amount;
      } else if (data.purchaseType?.toLowerCase() === 'credit') {
        creditTotal += amount;
      }
    });

    const allTimeTotal = allOrdersSnapshot.docs.reduce((total, doc) => {
      return total + (parseFloat(doc.data().amount) || 0);
    }, 0);

    return {
      analytics: {
        monthlyData: [{
          month: firstDayOfMonth.toLocaleString('default', { month: 'long' }),
          cashAmount: cashTotal,
          creditAmount: creditTotal,
          totalAmount: monthlyTotal,
          orderCount: orderCount,
          allTimeTotal: allTimeTotal
        }]
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};
