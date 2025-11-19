const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 4131;

app.set('view engine', 'pug');
app.set('views', 'templates');

app.use(express.static('resources'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


let orders = [
    {
        id: 0,
        status: "Shipped",
        cost: 110.00,
        from: "The bossman",
        address: "D. Kluver\n143 Fake Blbd.\nSaint Paul, MN 55123",
        product: "Angry Queen",
        quantity: 1,
        notes: "Left at front door as requested",
        shipping: "Expedited",
        order_date: "2025-09-15 15:30:00",
    },
    {
        id: 1,
        status: "Delivered",
        cost: 5.00,
        from: "Ian",
        address: "1037 W. Fake Street\nMinneapolis, MN 55444",
        product: "One Bee",
        quantity: 1,
        notes: "",
        shipping: "Flat Rate",
        order_date: "2025-09-20 11:00:00",
    },
    {
        id: 2,
        status: "Cancelled",
        cost: 15.50,
        from: "Daniel Kluver",
        address: "Daniel Kluver\n143 Fake Blbd.\nSaint Paul MN 55123",
        product: "Keepers Dozen",
        quantity: 1,
        notes: "Customer requested expedited shipping",
        shipping: "Ground",
        order_date: "2025-09-24 05:19:20",
    },
    {
        id: 3,
        status: "Delivered",
        cost: 100.00,
        from: "Alex",
        address: "900 Washington Ave",
        product: "Strawberry Cake",
        quantity: 1,
        notes: "Hand it to the receptionist",
        shipping: "Ground",
        order_date: "2025-09-30 05:00:20",
    },
    {
        id: 4,
        status: "Placed",
        cost: 5.00,
        from: "Test Placed",
        address: "123 Test St\nMinneapolis, MN 55455",
        product: "One Bee",
        quantity: 1,
        notes: "For modify test",
        shipping: "Flat Rate",
        order_date: "2025-12-14 23:51:00"
    },
];

const PRODUCTS = {
    "Angry Queen": 110.00,
    "One Bee": 5.00,
    "Keepers Dozen": 15.50,
    "Strawberry Cake": 100.00
};

const ALLOWED_SHIPPING = new Set(["Flat Rate", "Ground", "Expedited"]);

// Extra credits
app.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode;

        const totalOrders = orders.length;
        const activeOrders = orders.filter(o => !['Shipped', 'Delivered', 'Cancelled'].includes(o.status)).length;

        console.log(
            `${method} ${url} -> ${status} | orders=${totalOrders}, active=${activeOrders}`
        );
    });

    next();
});


function typesetDollars(number) {
    return `$${number.toFixed(2)}`;
}

// Update order status automatically based on order date
function autoUpdateStatus(order) {
    if (!order.order_date) {
        return;
    }
    const s = String(order.order_date).trim();
    let dt;

    if (s.includes('T')) {
        dt = new Date(s.replace('Z', ''));
    } else {
        dt = new Date(s.replace(' ', 'T'));
    }
    const orderDate = new Date(order.order_date);
    if (isNaN(orderDate.getTime())) {
        return;
    }

    const shipTime = dt.getTime() + 180 * 1000;
    const currentTime = Date.now();
    const statuses = ["Shipped", "Delivered", "Cancelled"];
    if (statuses.includes(order.status) && currentTime >= shipTime) {
        order.status = "Shipped";
    }
}


app.get(['/', '/about'], (req, res) => {
    res.render('about', { title: 'All Game' });
});


app.get('/admin/orders', (req, res) => {
    let { query, status } = req.query;
    if (!query) {
        query = '';
    }
    if (!status) {
        status = 'all';
    }

    const filtered = orders.filter(o => {
        if (!query || o.from.includes(query)) {
            if (status === 'all' || !status || o.status === status) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    });

    res.render('orders', {
        title: 'All Orders',
        orders: filtered,
        query,
        status,
        typesetDollars,
    });
});


app.get('/tracking/:id', (req, res) => {
    const rawId = req.params.id;
    const id = Number(rawId);
    if (Number.isInteger(id === false)) {
        return res.status(404).render('404', { title: 'Page Not Found' });
    }
    let order = null;
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].id === id) {
            order = orders[i];
            break;
        }
    }
    if (!order) {
        return res.status(404).render('404', { title: 'Page Not Found' });
    }

    autoUpdateStatus(order);
    res.render('tracking', {
        title: `Tracking Order #${order.id}`,
        order,
        typesetDollars,
    });
});


app.get('/order', (req, res) => {
    const customerName = req.cookies.customer_name || '';
    res.render('order', {
        title: 'Place Order',
        products: Object.keys(PRODUCTS),
        customerName,
    });
});


app.post('/api/order', (req, res) => {
    let contentType = '';
    if (req.headers['content-type']) {
        contentType = req.headers['content-type'].toLowerCase();
    }
    if (!contentType.includes('application/json')) {
        return res.status(400).json({
            status: 'error',
            errors: ['Content-Type must be application/json']
        });
    }

    const data = req.body || {};
    const errors = [];
    const product = data.product;
    const fromName = data.from_name;
    const quantity = data.quantity;
    const address = data.address;
    const shipping = data.shipping;
    const required = [
        ['product', product],
        ['from_name', fromName],
        ['quantity', quantity],
        ['address', address],
        ['shipping', shipping],
    ];

    const missing = [];
    for (let i = 0; i < required.length; i++) {
        const [name, value] = required[i];
        if (value === null || value === undefined || value === '') {
            missing.push(name);
        }
    }
    if (missing.length > 0) {
        errors.push('Missing properties: ' + missing.join(', '));
    }
    if (product != null && !Object.prototype.hasOwnProperty.call(PRODUCTS, product)) {
        errors.push('Not a valid product');
    }
    if (!Number.isInteger(quantity)) {
        errors.push('Quantity must be an integer');
    } else if (quantity <= 0) {
        errors.push('Quantity must be positive');
    }
    if (shipping != null && !ALLOWED_SHIPPING.has(shipping)) {
        errors.push('Invalid shipping method');
    }

    if (typeof fromName === 'string' && fromName.length >= 64) {
        return res.status(413).json({
            status: 'error',
            errors: ['from_name too long']
        });
    }
    if (typeof address === 'string' && address.length >= 1024) {
        return res.status(413).json({
            status: 'error',
            errors: ['address too long']
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', errors });
    }

    let newId;
    if (orders.length > 0) {
        let maxId = orders[0].id;
        for (let i = 1; i < orders.length; i++) {
            if (orders[i].id > maxId) {
                maxId = orders[i].id;
            }
        }
        newId = maxId + 1;
    } else {
        newId = 0;
    }
    const cost = PRODUCTS[product] * quantity;
    const newOrder = {
        id: newId,
        status: 'Placed',
        cost,
        from: fromName,
        address,
        product,
        quantity,
        shipping,
    };
    if (typeof data.notes === 'string') {
        newOrder.notes = data.notes;
    } else {
        newOrder.notes = '';
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (data.order_date) {
        newOrder.order_date = data.order_date;
    } else {
        newOrder.order_date = nowStr;
    }
    orders.push(newOrder);

    return res.status(201).json({
        status: 'success',
        order_id: newId,
    });
});


app.delete('/api/cancel_order', (req, res) => {
    let contentType = '';
    if (req.headers['content-type']) {
        contentType = req.headers['content-type'].toLowerCase();
    }
    if (!contentType.includes('application/json')) {
        return res.status(400).json({
            status: 'error',
            errors: ['Content-Type must be application/json']
        });
    }

    const data = req.body || {};
    let oid = data.order_id;
    if (oid === undefined) oid = data.id;
    if (!Number.isInteger(oid)) {
        return res.status(400).json({
            status: 'error',
            errors: ['id must be an integer']
        });
    }

    let order = null;
    for (let i = 0; i < orders.length; i++) {
        if (orders[i].id === oid) {
            order = orders[i];
            break;
        }
    }
    if (!order) {
        return res.status(404).json({
            status: 'error',
            errors: ['Order not found']
        });
    }

    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
        return res.status(400).json({
            status: 'error',
            errors: ['Order cannot be cancelled']
        });
    }
    order.status = 'Cancelled';
    return res.status(204).end();
});


app.post('/update_shipping', (req, res) => {
    let id, address, shipping;
    if (req.body) {
        id = req.body.id;
        address = req.body.address;
        shipping = req.body.shipping;
    }

    const oid = Number(id);
    if (!Number.isInteger(oid)) {
        return res.status(400).render('order_fail', { title: 'Order Failed' });
    }

    const addr = (address || '').trim();
    const ship = (shipping || '').trim();
    if (!addr || !ALLOWED_SHIPPING.has(ship)) {
        return res.status(400).render('order_fail', { title: 'Order Failed' });
    }

    const order = orders.find(o => o.id === oid);
    if (!order) {
        return res.status(404).render('404', { title: 'Page Not Found' });
    }

    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
        return res.status(400).render('order_fail', { title: 'Order Failed' });
    }

    order.address = addr;
    order.shipping = ship;
    return res.status(200).render('order_success', {
        title: 'Order Updated',
        order,
    });
});


app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});


app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}/`);
});