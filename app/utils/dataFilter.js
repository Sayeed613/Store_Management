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
    thirtyDays: {
      start: getStartOfDay(new Date(today.getTime() - (30 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (16 * MS_PER_DAY))),
      label: '30 Days',
    },
    fifteenDays: {
      start: getStartOfDay(new Date(today.getTime() - (15 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (8 * MS_PER_DAY))),
      label: '15 Days',
    },
    sevenDays: {
      start: getStartOfDay(new Date(today.getTime() - (7 * MS_PER_DAY))),
      end: getStartOfDay(new Date(today.getTime() - (6 * MS_PER_DAY))),
      label: '7 Days',
    },
    fiveDays: {
      start: getStartOfDay(new Date(today.getTime() - (5 * MS_PER_DAY))),
      end: getEndOfDay(now),
      label: 'Last 5 Days',
    },
  };
};

export const filterOrdersByDateRange = (orders, selectedRangeKey) => {
  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const getDaysAgo = (date) => {
    const diff = now - new Date(date).setHours(0, 0, 0, 0);
    return Math.floor(diff / MS_PER_DAY);
  };

  // First, group orders by outletId
  const outletOrders = orders.reduce((acc, order) => {
    if (!order.orderDate) return acc;

    if (!acc[order.outletId]) {
      acc[order.outletId] = [];
    }
    acc[order.outletId].push(order);
    return acc;
  }, {});

  // Get the most recent order for each outlet
  const latestOrders = Object.values(outletOrders).map(orderGroup => {
    return orderGroup.reduce((latest, current) => {
      if (!latest.orderDate) return current;
      return new Date(current.orderDate) > new Date(latest.orderDate) ? current : latest;
    });
  });

  // Filter based on the selected date range
  const ranges = {
    fiveDays: (daysAgo) => daysAgo <= 5,
    sevenDays: (daysAgo) => daysAgo > 5 && daysAgo <= 7,
    fifteenDays: (daysAgo) => daysAgo > 7 && daysAgo <= 15,
    thirtyDays: (daysAgo) => daysAgo > 15 ,
  };

  return latestOrders
    .filter(order => {
      const daysAgo = getDaysAgo(order.orderDate);
      return ranges[selectedRangeKey](daysAgo);
    })
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
};


