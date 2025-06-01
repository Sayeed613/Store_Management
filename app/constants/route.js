// route.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export const fetchRoutes = async () => {
  try {
    const routeCollection = collection(db, 'route');
    const snapshot = await getDocs(routeCollection);

    const routes = snapshot.docs
      .map(doc => doc.data())
      .filter(route => route.status === true)
      .map(route => ({
        label: route.route,
        value: route.route.toLowerCase().replace(/\s+/g, '_'),
      }));

    return routes;
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
};
