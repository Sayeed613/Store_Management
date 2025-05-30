const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getDateRanges = () => {
  const now = new Date();

  const getStartOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const getEndOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  const today = getStartOfDay(now);

  return {
    fiveDays: {
      start: getStartOfDay(new Date(today.getTime() - (5 * MS_PER_DAY))),
      end: getEndOfDay(now),
      label: 'Last 5 Days'
    },
    sevenDays: {
      start: getStartOfDay(new Date(today.getTime() - (7 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (6 * MS_PER_DAY))),
      label: '7 Days'
    },
    fifteenDays: {
      start: getStartOfDay(new Date(today.getTime() - (15 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (8 * MS_PER_DAY))),
      label: '15 Days'
    },
    thirtyDays: {
      start: getStartOfDay(new Date(today.getTime() - (30 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (16 * MS_PER_DAY))),
      label: '30 Days'
    }
  };
};

export const filterOrdersByDateRange = (orders, startDate, endDate) => {
  const outletOrders = new Map();

  orders.forEach(order => {
    if (!order.orderDate || isNaN(order.orderDate.getTime())) return;

    const orderTime = order.orderDate.getTime();
    const currentOrders = outletOrders.get(order.outletId) || [];
    currentOrders.push({ ...order, orderTime });
    outletOrders.set(order.outletId, currentOrders);
  });

  const filteredOrders = [];

  outletOrders.forEach((outletOrderList, outletId) => {
    outletOrderList.sort((a, b) => b.orderTime - a.orderTime);

    const latestOrder = outletOrderList[0];
    const orderTime = latestOrder.orderTime;

    if (orderTime >= startDate.getTime() && orderTime <= endDate.getTime()) {
      filteredOrders.push(latestOrder);
    }
  });

  return filteredOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
};