export const validResult = (oldResult, result) => {
  // If the old result contains an error, just use the new one
  if (oldResult.error) {
    return result;
  }

  if (result.error) {
    return oldResult;
  }

  // Shallow compare on the items string arrays
  for (let i = 0; i < result.items.length; ++i) {
    for (let j = 0; j < result.items[i].length; ++j) {
      if (!oldResult.items[i][j] || result.items[i][j] !== oldResult.items[i][j]) {
        return result;
      }
    }
  }

  return oldResult;
};

export const success = (restaurant, items) => ({
  items,
  name: restaurant.name,
  date: Date.now(),
});

export const fail = (restaurant, error) => ({
  error,
  name: restaurant.name,
  items: [],
  date: Date.now(),
});
