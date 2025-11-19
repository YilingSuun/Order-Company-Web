const PRODUCTS = { "Angry Queen": 110.00, "One Bee": 5.00, "Keepers Dozen": 15.50, "Strawberry Cake": 100.00 };
const productSelect = document.getElementById('productSelect');
const quantityWrap = document.getElementById('quantityWrap');
const quantityInput = document.getElementById('quantityInput');
const totalCost = document.getElementById('totalCost');
const prefillButton = document.getElementById('prefill');
const orderDateInput = document.getElementById('order_date');
const orderForm = document.getElementById('orderForm');
const resultBox = document.getElementById('orderResult');

// Dynamically add/remove the quantity input field based on product selection
function updateVisibility() {
    if (!productSelect.value) quantityWrap.style.display = 'none';
    else quantityWrap.style.display = 'block';
}

// Calculate and display total cost (product cost × quantity), updating the value in real-time
function updateTotal() {
    let selectedProduct = productSelect.value;
    let productPrice = PRODUCTS[selectedProduct];
    if (!selectedProduct) {
        productPrice = 0;
    }

    let quantity = parseInt(quantityInput.value);
    if (isNaN(quantity) || quantityInput.value === "" || quantity < 1) {
        quantity = 1;
    }

    let total = productPrice * quantity;
    let formattedTotal = total.toFixed(2);
    totalCost.textContent = "$" + formattedTotal;
}

//Listen for changes to the product dropdown
productSelect.addEventListener('change', () => { updateVisibility(); updateTotal(); });
quantityInput.addEventListener('input', updateTotal);

// Create a "Prefill" button on load that fills the form with order information
prefillButton.addEventListener('click', () => {
    document.querySelector('input[name="name"]').value = 'A Test Buyer';
    document.querySelector('textarea[name="address"]').value = '123 Test St\nCity, ST 12345';
    productSelect.value = 'One Bee';
    updateVisibility();
    quantityInput.value = 2;
    document.querySelector('input[name="shipping"][value="Flat Rate"]').checked = true;
    document.querySelector('textarea[name="notes"]').value = 'Please ring bell';
    orderDateInput.value = new Date().toISOString();
    updateTotal();
});

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultBox.textContent = '';
    const product = productSelect.value;
    const fromName = document.getElementById('name').value.trim();
    const remember = document.getElementById('remember')?.checked === true;
    const quantity = parseInt(quantityInput.value || "0", 10);
    const address = document.getElementById('address').value;
    const shipping = (document.querySelector('input[name="shipping"]:checked') || {}).value || '';

    const resp = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, from_name: fromName, quantity, address, shipping, remember }),
        credentials: 'include'
    });

    let data = {};
    try {
        data = await resp.clone().json();
    } catch {
        data = {};
    }

    if (resp.status === 201 && data.status === 'success') {
        const id = data.order_id;
        resultBox.innerHTML = `order placed successfully! Check <a href="/tracking/${id}">Order #${id}</a>`;
        orderForm.reset();
        updateVisibility();
        updateTotal();
        return;
    }
    const errs = (data && Array.isArray(data.errors)) ? data.errors : ['Unknown error'];
    resultBox.innerHTML = `fail to place order: <ul>${errs.map(e => `<li>${e}</li>`).join('')}</ul>`;
});

updateVisibility();
updateTotal();

