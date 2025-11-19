# 🧰 All Game – Order and Tracking System

This project is a small web application for managing orders for a fictional company **“All Game”**.  
It was developed to demonstrate a **modern Express + Pug** web stack.  

- Users can place orders, view and track existing orders, and (before shipping) cancel or update shipping information.  
- Admins can search and filter orders.  

---


## 🌐 Tech Stack

- **Node.js + Express** — Web server and routing (`server.js`)
- **Pug** — Template engine for rendering dynamic views (`pugs/` directory)
- **HTML / CSS / JS** — Frontend logic and static resources (`static/` directory)
  - `order.js`: handles order form interactions and AJAX submission  
  - `update.js`: handles countdown and cancellation logic on tracking pages
- **Python (optional)** — `server.py` is an earlier assignment version using `http.server`, included for comparison

---

## 🚀 Running the Server

1. **Requirements**
   - Node.js (v18 or higher)
   - npm

2. **Install dependencies**
  
    Installed via `npm`:
    
    - [`express`](https://www.npmjs.com/package/express) – web framework  
    - [`cookie-parser`](https://www.npmjs.com/package/cookie-parser) – parse request cookies  
    - [`pug`](https://www.npmjs.com/package/pug) – template engine
    
    Install them:
     ```bash
     npm install
     ```

3. **Start the server**
   ```bash
   npm run start
   ```
    Then visit:
  
    👉 http://localhost:4131/

---

## 📂 Main Features

### 1. About Page

![main page](/demo/mainPage.png)

**Description:**
- Displays company information and staff profiles.
- Provides navigation links to:
  - **About Us:** `/`
  - **Orders (admin view):** `/admin/orders`
  - **Place Order:** `/order`

---


### 2. Place Order Page

![page](/demo/placeOrderPage.png)

**Features:**

- Live total price calculation.
- “Prefill” button for test data.

---

### 3. Orders Page (Admin View)

![page](/demo/ordersPage.png)

**Features:**
- Displays a table of all existing orders.
- Allows filtering and searching by:
  - **Customer name**
  - **Order status** (`Placed`, `Shipped`, `Delivered`, `Cancelled`)
- Each order ID in the table links to its tracking page (`/tracking/:id`).
- The total cost is formatted and displayed in U.S. dollar notation (e.g., `$29.99`).

---

### 4. Tracking Page

![page](/demo/trackingPage.png)

**Features:**
- Displays detailed information for a single order.
- Shows **live countdown to shipment** (based on order date + 3 minutes).
- Automatically updates the order’s status:
  - From **Placed → Shipped** after the countdown reaches zero.
  - Optionally from **Shipped → Delivered** later (depending on implementation).
- Displays clear messages:
  - “Order Placed”
  - “Order Shipped”
  - “Order Delivered”
  - “Order Cancelled”

- **Countdown Timer:**  
  Updates every second using `update.js` based on `data-order-date` and a shipping delay constant.

- **Cancel Order Button:**  
  - Sends a `DELETE` request to `/api/cancel_order` with JSON body:
    ```json
    { "order_id": 3 }
    ```
  - Success response: `204 No Content`  
    → Updates page to show “Order Cancelled.”
  - Error responses:  
    `400 Bad Request` (invalid request) or `404 Not Found` (no such order).

- **Update Shipping Form:**

![page](/demo/updatePage.png)

  - Submits via standard POST form to `/update_shipping`.
  - Fields:
    - Address
    - Shipping method (`Flat Rate`, `Ground`, or `Expedited`)
  - Success → renders `order_success.pug`.  
  - Failure → renders `order_fail.pug`.

---

