function ProductCard({ product, onAddToCart }) {
    return (
        <div className="product-card">
            <img
                src={product.image_url}
                alt={product.name}
                className="product-image"
            />

            <div className="product-info">
                <h2>{product.name}</h2>

                <p className="product-description">
                    {product.description}
                </p>

                <div className="product-bottom">
                    <span className="product-price">
                        ₹{product.price}
                    </span>

                    <span className="product-stock">
                        {product.stock_quantity} in stock
                    </span>
                </div>

                <button
                    className="add-cart-btn"
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock_quantity === 0}
                >
                    {product.stock_quantity === 0
                        ? "Out of Stock"
                        : "Add to Cart"}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;