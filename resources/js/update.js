// update.js
function startCountdown() {
    const box = document.getElementById('timeToShip');
    const tracker = document.getElementById('orderTracking');
    if (!box || !tracker) {
        return;
    }

    const toISO = (s) => {
        if (s && s.includes('T')) {
            return s;
        } else {
            if (s) {
                return s.replace(' ', 'T');
            } else {
                return ''.replace(' ', 'T');
            }
        }
    };

    function tick() {
        const status = tracker.dataset.status;
        const orderISO = tracker.dataset.orderDate;
        const delayMin = parseInt(tracker.dataset.shipDelay || "3", 10);

        if (status === "Cancelled") {
            box.textContent = "Order Cancelled";
            return;
        }
        if (!orderISO || Number.isNaN(delayMin)) {
            box.textContent = "";
            return;
        }

        const orderMs = new Date(toISO(orderISO)).getTime();
        const shipMs = orderMs + delayMin * 60 * 1000;
        const now = Date.now();
        const delta = shipMs - now;
        if (status === "Shipped" || status === "Delivered" || delta <= 0) {
            box.textContent = "Order shipped";
            return;
        }

        const totalSec = Math.floor(delta / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        // Fixed two-digit second to avoid width jittering
        box.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
        setTimeout(tick, 1000);
    }

    tick();
}

async function wireCancel() {
    const tracker = document.getElementById('orderTracking');
    const cancelBtn = document.getElementById('cancelBtn');
    const statusText = document.getElementById('statusText');
    const actions = document.getElementById('actions');
    const msg = document.getElementById('msg');
    if (!tracker || !cancelBtn) {
        return;
    }

    cancelBtn.addEventListener('click', async () => {
        msg.textContent = '';
        let id;
        if (tracker.dataset.id) {
            id = parseInt(tracker.dataset.id, 10);
        } else {
            id = parseInt("NaN", 10);
        }

        if (Number.isNaN(id)) {
            msg.textContent = 'Invalid order ID';
            return;
        }
        cancelBtn.disabled = true;

        try {
            const resp = await fetch('/api/cancel_order', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: id })
            });

            if (resp.status === 204) {
                // success
                tracker.dataset.status = "Cancelled";
                statusText.textContent = "Cancelled";
                document.getElementById('timeToShip').textContent = "Order Cancelled";
                actions.innerHTML = '';
                msg.textContent = 'order cancelled successfully';
                startCountdown();
            } else if (resp.status === 404) {
                msg.textContent = 'Failed.the order cannot be found';
            } else if (resp.status === 400) {
                msg.textContent = 'The order ID was invalid';
            } else {
                msg.textContent = 'Unknown error';
            }
        } catch (e) {
            msg.textContent = 'Network error';
        } finally {
            cancelBtn.disabled = false;
        }
    });
}

function wireUpdateForm() {
    const toggleBtn = document.getElementById('toggleUpdate');
    const form = document.getElementById('updateForm');
    if (!toggleBtn || !form) {
        return;
    }

    if (!form.style.display) {
        form.style.display = 'none';
    }

    toggleBtn.addEventListener('click', () => {
        if (form.style.display === 'none') {
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startCountdown();
    wireCancel();
    wireUpdateForm();
});

