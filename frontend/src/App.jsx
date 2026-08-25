import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [orders, setOrders] = useState([]);

    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );

    const [page, setPage] = useState("products");
    const [authMode, setAuthMode] = useState("login");

    const [authForm, setAuthForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [addressId, setAddressId] = useState("1");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // -----------------------------
    // LOAD PRODUCTS
    // -----------------------------

    const loadProducts = async () => {
        try {
            const response = await api.get("/products");

            // Supports {products: []} or {items: []} or direct []
            const data = response.data;

            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts(data.products || data.items || []);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load products");
        }
    };

    // -----------------------------
    // LOAD CART
    // -----------------------------

    const loadCart = async () => {
        if (!localStorage.getItem("token")) {
            setCart({ items: [], total: 0 });
            return;
        }

        try {
            const response = await api.get("/cart");
            setCart(response.data);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                logout();
            }
        }
    };

    // -----------------------------
    // LOAD ORDERS
    // -----------------------------

    const loadOrders = async () => {
        if (!localStorage.getItem("token")) return;

        try {
            const response = await api.get("/orders");

            setOrders(response.data.orders || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadProducts();

        if (user) {
            loadCart();
            loadOrders();
        }
    }, [user]);

    // -----------------------------
    // LOGIN / REGISTER
    // -----------------------------

    const handleAuth = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        try {
            let response;

            if (authMode === "login") {
                response = await api.post("/auth/login", {
                    email: authForm.email,
                    password: authForm.password,
                });
            } else {
                response = await api.post("/auth/register", {
                    name: authForm.name,
                    email: authForm.email,
                    password: authForm.password,
                });

                // After registration, automatically login
                response = await api.post("/auth/login", {
                    email: authForm.email,
                    password: authForm.password,
                });
            }

            const { token, user: loggedUser } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(loggedUser));

            setUser(loggedUser);

            setAuthForm({
                name: "",
                email: "",
                password: "",
            });

            setMessage("Login successful");

            setPage("products");
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Authentication failed"
            );
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // LOGOUT
    // -----------------------------

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setCart({ items: [], total: 0 });
        setOrders([]);

        setPage("products");
    };

    // -----------------------------
    // ADD TO CART
    // -----------------------------

    const addToCart = async (productId) => {
        if (!user) {
            setPage("login");
            setError("Please login before adding products to cart");
            return;
        }

        try {
            setError("");
            setMessage("");

            await api.post("/cart", {
                product_id: productId,
                quantity: 1,
            });

            await loadCart();

            setMessage("Product added to cart");
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to add product to cart"
            );
        }
    };

    // -----------------------------
    // UPDATE CART
    // -----------------------------

    const updateQuantity = async (productId, quantity) => {
        if (quantity < 1) return;

        try {
            await api.put(`/cart/${productId}`, {
                quantity,
            });

            await loadCart();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to update cart"
            );
        }
    };

    // -----------------------------
    // REMOVE CART ITEM
    // -----------------------------

    const removeFromCart = async (productId) => {
        try {
            await api.delete(`/cart/${productId}`);

            await loadCart();

            setMessage("Product removed from cart");
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to remove product"
            );
        }
    };

    // -----------------------------
    // PLACE ORDER
    // -----------------------------

    const placeOrder = async () => {
        if (!user) {
            setPage("login");
            return;
        }

        if (!cart.items.length) {
            setError("Your cart is empty");
            return;
        }

        if (!addressId) {
            setError("Shipping address ID is required");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            await api.post("/orders", {
                shipping_address_id: Number(addressId),
            });

            await loadCart();
            await loadOrders();

            setMessage("Order placed successfully");

            setPage("orders");
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to place order"
            );
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // CLEAR MESSAGE
    // -----------------------------

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    // -----------------------------
    // CART COUNT
    // -----------------------------

    const cartCount = cart.items.reduce(
        (sum, item) => sum + Number(item.quantity),
        0
    );

    // -----------------------------
    // RENDER AUTH
    // -----------------------------

    const renderAuth = () => {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>
                        {authMode === "login"
                            ? "Welcome Back"
                            : "Create Account"}
                    </h2>

                    <form onSubmit={handleAuth}>
                        {authMode === "register" && (
                            <input
                                type="text"
                                placeholder="Name"
                                value={authForm.name}
                                onChange={(e) =>
                                    setAuthForm({
                                        ...authForm,
                                        name: e.target.value,
                                    })
                                }
                                required
                            />
                        )}

                        <input
                            type="email"
                            placeholder="Email"
                            value={authForm.email}
                            onChange={(e) =>
                                setAuthForm({
                                    ...authForm,
                                    email: e.target.value,
                                })
                            }
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={authForm.password}
                            onChange={(e) =>
                                setAuthForm({
                                    ...authForm,
                                    password: e.target.value,
                                })
                            }
                            required
                        />

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Please wait..."
                                : authMode === "login"
                                ? "Login"
                                : "Register"}
                        </button>
                    </form>

                    <button
                        className="link-button"
                        onClick={() => {
                            setAuthMode(
                                authMode === "login"
                                    ? "register"
                                    : "login"
                            );
                            clearMessages();
                        }}
                    >
                        {authMode === "login"
                            ? "Create an account"
                            : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        );
    };

    // -----------------------------
    // PRODUCTS
    // -----------------------------

    const renderProducts = () => {
        return (
            <section className="products-section">
                <h2>Latest Products</h2>

                {products.length === 0 ? (
                    <p>No products available.</p>
                ) : (
                    <div className="product-grid">
                        {products.map((product) => (
                            <div className="product-card" key={product.id}>
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    onError={(e) => {
                                        e.currentTarget.style.display =
                                            "none";
                                    }}
                                />

                                <div className="product-content">
                                    <h3>{product.name}</h3>

                                    <p className="description">
                                        {product.description}
                                    </p>

                                    <div className="product-info">
                                        <strong>
                                            ₹
                                            {Number(
                                                product.price
                                            ).toFixed(2)}
                                        </strong>

                                        <span className="stock">
                                            {product.stock_quantity} in stock
                                        </span>
                                    </div>

                                    <button
                                        className="primary-button"
                                        disabled={
                                            product.stock_quantity <= 0
                                        }
                                        onClick={() =>
                                            addToCart(product.id)
                                        }
                                    >
                                        {product.stock_quantity <= 0
                                            ? "Out of Stock"
                                            : "Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    };

    // -----------------------------
    // CART
    // -----------------------------

    const renderCart = () => {
        if (!user) {
            return (
                <div className="empty-state">
                    <h2>Please login</h2>
                    <button
                        className="primary-button small-button"
                        onClick={() => setPage("login")}
                    >
                        Login
                    </button>
                </div>
            );
        }

        return (
            <section className="page-section">
                <h2>Your Cart</h2>

                {cart.items.length === 0 ? (
                    <div className="empty-state">
                        <p>Your cart is empty.</p>

                        <button
                            className="primary-button small-button"
                            onClick={() => setPage("products")}
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="cart-list">
                            {cart.items.map((item) => (
                                <div
                                    className="cart-item"
                                    key={item.product_id}
                                >
                                    <div>
                                        <h3>{item.name}</h3>
                                        <p>
                                            ₹
                                            {Number(
                                                item.price
                                            ).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="quantity-controls">
                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product_id,
                                                    item.quantity - 1
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product_id,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    <strong>
                                        ₹
                                        {Number(
                                            item.subtotal
                                        ).toFixed(2)}
                                    </strong>

                                    <button
                                        className="remove-button"
                                        onClick={() =>
                                            removeFromCart(
                                                item.product_id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <h2>
                                Total: ₹
                                {Number(cart.total).toFixed(2)}
                            </h2>

                            <button
                                className="primary-button checkout-button"
                                onClick={() => setPage("checkout")}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </section>
        );
    };

    // -----------------------------
    // CHECKOUT
    // -----------------------------

    const renderCheckout = () => {
        return (
            <section className="page-section checkout">
                <h2>Checkout</h2>

                <div className="checkout-card">
                    <h3>Shipping Address</h3>

                    <p>
                        Enter your saved shipping address ID.
                    </p>

                    <input
                        type="number"
                        min="1"
                        value={addressId}
                        onChange={(e) =>
                            setAddressId(e.target.value)
                        }
                        placeholder="Address ID"
                    />

                    <div className="order-summary">
                        <h3>Order Summary</h3>

                        {cart.items.map((item) => (
                            <div
                                className="summary-row"
                                key={item.product_id}
                            >
                                <span>
                                    {item.name} × {item.quantity}
                                </span>

                                <span>
                                    ₹
                                    {Number(
                                        item.subtotal
                                    ).toFixed(2)}
                                </span>
                            </div>
                        ))}

                        <hr />

                        <div className="summary-row total-row">
                            <strong>Total</strong>

                            <strong>
                                ₹
                                {Number(cart.total).toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <button
                        className="primary-button"
                        onClick={placeOrder}
                        disabled={loading}
                    >
                        {loading
                            ? "Placing Order..."
                            : "Place Order"}
                    </button>
                </div>
            </section>
        );
    };

    // -----------------------------
    // ORDERS
    // -----------------------------

    const renderOrders = () => {
        return (
            <section className="page-section">
                <h2>My Orders</h2>

                {orders.length === 0 ? (
                    <div className="empty-state">
                        <p>No orders yet.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div
                                className="order-card"
                                key={order.id}
                            >
                                <div className="order-header">
                                    <div>
                                        <h3>
                                            Order #{order.id}
                                        </h3>

                                        <p>
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>

                                    <span className="status">
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-items">
                                    {order.items?.map((item) => (
                                        <div
                                            className="summary-row"
                                            key={`${order.id}-${item.product_id}`}
                                        >
                                            <span>
                                                {item.product_name} ×{" "}
                                                {item.quantity}
                                            </span>

                                            <span>
                                                ₹
                                                {Number(
                                                    item.price_at_purchase
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-total">
                                    Total: ₹
                                    {Number(
                                        order.total_amount
                                    ).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    };

    // -----------------------------
    // MAIN UI
    // -----------------------------

    return (
        <div className="app">
            <header className="navbar">
                <div
                    className="logo"
                    onClick={() => setPage("products")}
                >
                    ShopEasy
                </div>

                <nav>
                    <button
                        className="nav-button"
                        onClick={() => setPage("products")}
                    >
                        Products
                    </button>

                    <button
                        className="nav-button"
                        onClick={() => {
                            if (!user) {
                                setPage("login");
                            } else {
                                loadCart();
                                setPage("cart");
                            }
                        }}
                    >
                        Cart 🛒 ({cartCount})
                    </button>

                    {user && (
                        <button
                            className="nav-button"
                            onClick={() => {
                                loadOrders();
                                setPage("orders");
                            }}
                        >
                            My Orders
                        </button>
                    )}

                    {user ? (
                        <>
                            <span className="user-name">
                                Hi, {user.name}
                            </span>

                            <button
                                className="login-button"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            className="login-button"
                            onClick={() => {
                                setAuthMode("login");
                                setPage("login");
                            }}
                        >
                            Login
                        </button>
                    )}
                </nav>
            </header>

            {message && (
                <div className="message" onClick={clearMessages}>
                    {message}
                </div>
            )}

            {error && (
                <div className="error" onClick={clearMessages}>
                    {error}
                </div>
            )}

            {page === "products" && (
                <>
                    <section className="hero">
                        <h1>Find What You Love</h1>
                        <p>Quality products at great prices.</p>
                    </section>

                    {renderProducts()}
                </>
            )}

            {page === "login" && renderAuth()}

            {page === "cart" && renderCart()}

            {page === "checkout" && renderCheckout()}

            {page === "orders" && renderOrders()}

            <footer>
                <p>© 2026 ShopEasy • E-Commerce Store</p>
            </footer>
        </div>
    );
}

export default App;