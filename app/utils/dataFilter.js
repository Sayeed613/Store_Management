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

  const ranges = {
    fiveDays: (daysAgo) => daysAgo <= 5,
    sevenDays: (daysAgo) => daysAgo > 5 && daysAgo <= 7,
    fifteenDays: (daysAgo) => daysAgo > 7 && daysAgo <= 15,
    thirtyDays: (daysAgo) => daysAgo > 15,
  };

  const seenOutletIds = new Set();
  const filtered = [];

  const sorted = [...orders].sort((a, b) => b.orderDate - a.orderDate);

  for (const order of sorted) {
    if (!order.orderDate || seenOutletIds.has(order.outletId)) continue;

    const daysAgo = getDaysAgo(order.orderDate);
    const matches = ranges[selectedRangeKey];

    if (matches(daysAgo)) {
      filtered.push(order);
      seenOutletIds.add(order.outletId);
    }
  }

  return filtered;
};


