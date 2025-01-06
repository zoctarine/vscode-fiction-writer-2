export function increment(order: number[], level?: number) {

    if (level === undefined) level = order.length - 1;
    const newOrder = [...order];
    if (newOrder.length > 0 && level >= 0 && level < newOrder.length) {
        // Increment the last item of the array
        newOrder[level] += 1;
    }
    return newOrder;
}

export function ensureLength(order: number[], length: number) {
    if (length === undefined || length < order.length) return order;

    const newOrder = [...order];
    while (newOrder.length <= length) {
        newOrder.push(1);
    }

    return newOrder;
}