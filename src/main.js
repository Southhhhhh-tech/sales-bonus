/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - (discount / 100));
   // @TODO: Расчет выручки от операции
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    switch (index) {
        case 0:
            return profit * (0.15);
        case 1:
        case 2:
            return profit * (0.10);
        case total - 1:
            return 0;
        default:
            return profit * (0.05);
    }
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    if (!data 
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
        || !data.purchase_records
        || data.purchase_records.length === 0
        || !Array.isArray(data.purchase_records)
        || !options
    ) {
        throw new Error(`Неверные входные данные`);
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== "function" 
        || typeof calculateBonus !== "function"
    ) {
        throw new Error('Нет функций в объекте options');
    }

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = sellerStats.reduce((result, seller) => ({
        ...result,
        [seller.id]: seller
    }), {}); 

    const productIndex = data.products.reduce((result, product) => ({
        ...result,
        [product.sku]: product
    }), {});

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        // Увеличить количество продаж 
        // Увеличить общую сумму выручки всех продаж

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            const cost = product.purchase_price * item.quantity;
            const profit = calculateRevenue(item) - cost;
            seller.profit += profit;
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            // Посчитать прибыль: выручка минус себестоимость
        // Увеличить общую накопленную прибыль (profit) у продавца  

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
            // По артикулу товара увеличить его проданное количество у продавца
        });
    });
    
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller),
        seller.top_products = Object.fromEntries(Object.entries(seller.products_sold).sort((a, b) => b[1] - a[1]).slice(0, 10));
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,
        top_products: Object.entries(seller.top_products).reduce((acc, curr) => {
            return [...acc, {
                sku: curr[0],
                quantity: curr[1]
            }];
        }, []), // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2) // Число с двумя знаками после точки, бонус продавца
    }));
}
