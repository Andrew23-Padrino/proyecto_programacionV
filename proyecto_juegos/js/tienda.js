// Educational Store Frontend JavaScript
// Using arrow functions and _ap suffix for variables

const API_BASE_URL_ap = 'http://localhost:3000/api';

// DOM Elements
const cartButton_ap = document.getElementById('cartButton');
const cartModal_ap = document.getElementById('cartModal');
const cartItems_ap = document.getElementById('cartItems');
const cartEmpty_ap = document.getElementById('cartEmpty');
const cartTotal_ap = document.getElementById('cartTotal');
const totalPrice_ap = document.getElementById('totalPrice');
const cartCount_ap = document.getElementById('cartCount');
const productsGrid_ap = document.getElementById('productsGrid');
const loadingState_ap = document.getElementById('loadingState');
const errorState_ap = document.getElementById('errorState');
const successModal_ap = document.getElementById('successModal');

// Load products on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts_ap();
    updateCartCount_ap();
});

// Load products from API
const loadProducts_ap = async () => {
    try {
        showLoading_ap();
        const response_ap = await fetch(`${API_BASE_URL_ap}/products`);
        
        if (!response_ap.ok) {
            throw new Error('Error al cargar productos');
        }
        
        const products_ap = await response_ap.json();
        displayProducts_ap(products_ap);
        hideLoading_ap();
    } catch (error_ap) {
        console.error('Error:', error_ap);
        showError_ap();
    }
};

// Display products in grid
const displayProducts_ap = (products) => {
    if (!productsGrid_ap) return;
    
    productsGrid_ap.innerHTML = '';
    products.forEach(product_ap => {
        const productCard_ap = createProductCard_ap(product_ap);
        productsGrid_ap.appendChild(productCard_ap);
    });
    
    productsGrid_ap.classList.remove('hidden');
};

// Create product card element
const createProductCard_ap = (product) => {
    const card_ap = document.createElement('div');
    card_ap.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
    
    card_ap.innerHTML = `
        <div class="aspect-w-16 aspect-h-12 bg-gray-200">
            <img src="${product.imagen}" alt="${product.nombre}" 
                 class="w-full h-48 object-cover" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Producto+Educativo'">
        </div>
        <div class="p-6">
            <div class="flex items-start justify-between mb-2">
                <h4 class="text-lg font-semibold text-gray-800 line-clamp-2">${product.nombre}</h4>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">${product.categoria}</span>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.descripcion}</p>
            <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-green-600">$${product.precio.toFixed(2)}</span>
                <button onclick="addToCart_ap(${product.id}, 1)" 
                        class="btn-primary text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                    Agregar
                </button>
            </div>
        </div>
    `;
    
    return card_ap;
};

// Add product to cart
const addToCart_ap = async (productId, quantity) => {
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId, quantity })
        });
        
        if (!response_ap.ok) {
            throw new Error('Error al agregar al carrito');
        }
        
        const result_ap = await response_ap.json();
        console.log(result_ap.message);
        
        // Update cart display
        updateCartCount_ap();
        
        // Show success feedback
        showSuccessFeedback_ap('Producto agregado al carrito');
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
        alert('Error al agregar producto al carrito');
    }
};

// Load and display cart
const displayCart_ap = async () => {
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart`);
        
        if (!response_ap.ok) {
            throw new Error('Error al cargar carrito');
        }
        
        const cartItems_ap = await response_ap.json();
        renderCartItems_ap(cartItems_ap);
        updateCartTotal_ap(cartItems_ap);
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
        cartItems_ap.innerHTML = '<p class="text-red-500">Error al cargar el carrito</p>';
    }
};

// Render cart items
const renderCartItems_ap = (items) => {
    if (!cartItems_ap) return;
    
    cartItems_ap.innerHTML = '';
    
    if (items.length === 0) {
        cartEmpty_ap.style.display = 'block';
        cartTotal_ap.classList.add('hidden');
        return;
    }
    
    cartEmpty_ap.style.display = 'none';
    cartTotal_ap.classList.remove('hidden');
    
    items.forEach(item_ap => {
        const cartItem_ap = createCartItem_ap(item_ap);
        cartItems_ap.appendChild(cartItem_ap);
    });
};

// Create cart item element
const createCartItem_ap = (item) => {
    const item_ap = document.createElement('div');
    item_ap.className = 'flex items-center space-x-4 p-4 bg-gray-50 rounded-lg';
    
    item_ap.innerHTML = `
        <img src="${item.imagen}" alt="${item.nombre}" 
             class="w-16 h-16 object-cover rounded-lg" 
             onerror="this.src='https://via.placeholder.com/64x64?text=Producto'">
        <div class="flex-1">
            <h5 class="font-semibold text-gray-800">${item.nombre}</h5>
            <p class="text-sm text-gray-600">$${item.precio.toFixed(2)}</p>
        </div>
        <div class="flex items-center space-x-2">
            <button onclick="updateQuantity_ap(${item.product_id}, ${item.quantity - 1})" 
                    class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
            </button>
            <span class="w-8 text-center font-semibold">${item.quantity}</span>
            <button onclick="updateQuantity_ap(${item.product_id}, ${item.quantity + 1})" 
                    class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
            </button>
        </div>
        <button onclick="removeFromCart_ap(${item.product_id})" 
                class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        </button>
    `;
    
    return item_ap;
};

// Update quantity
const updateQuantity_ap = async (productId, quantity) => {
    if (quantity < 0) return;
    
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart/update/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity })
        });
        
        if (!response_ap.ok) {
            throw new Error('Error al actualizar cantidad');
        }
        
        const result_ap = await response_ap.json();
        console.log(result_ap.message);
        
        // Refresh cart display
        displayCart_ap();
        updateCartCount_ap();
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
        alert('Error al actualizar cantidad');
    }
};

// Remove from cart
const removeFromCart_ap = async (productId) => {
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart/remove/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response_ap.ok) {
            throw new Error('Error al eliminar del carrito');
        }
        
        const result_ap = await response_ap.json();
        console.log(result_ap.message);
        
        // Refresh cart display
        displayCart_ap();
        updateCartCount_ap();
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
        alert('Error al eliminar del carrito');
    }
};

// Update cart total
const updateCartTotal_ap = (items) => {
    if (!totalPrice_ap) return;
    
    const total_ap = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    totalPrice_ap.textContent = `$${total_ap.toFixed(2)}`;
};

// Update cart count
const updateCartCount_ap = async () => {
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart`);
        
        if (!response_ap.ok) {
            throw new Error('Error al cargar carrito');
        }
        
        const cartItems_ap = await response_ap.json();
        const count_ap = cartItems_ap.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount_ap) {
            cartCount_ap.textContent = count_ap;
            cartCount_ap.style.display = count_ap > 0 ? 'block' : 'none';
        }
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
    }
};

// Checkout
const checkout = async () => {
    try {
        const response_ap = await fetch(`${API_BASE_URL_ap}/cart/checkout`, {
            method: 'POST'
        });
        
        if (!response_ap.ok) {
            throw new Error('Error al procesar checkout');
        }
        
        const result_ap = await response_ap.json();
        console.log(result_ap.message);
        
        // Close cart and show success modal
        closeCart();
        showSuccessModal_ap();
        
        // Update cart count
        updateCartCount_ap();
        
    } catch (error_ap) {
        console.error('Error:', error_ap);
        alert('Error al procesar la compra');
    }
};

// UI Helper Functions

const showLoading_ap = () => {
    if (loadingState_ap) loadingState_ap.style.display = 'block';
    if (errorState_ap) errorState_ap.classList.add('hidden');
    if (productsGrid_ap) productsGrid_ap.classList.add('hidden');
};

const hideLoading_ap = () => {
    if (loadingState_ap) loadingState_ap.style.display = 'none';
};

const showError_ap = () => {
    if (loadingState_ap) loadingState_ap.style.display = 'none';
    if (errorState_ap) errorState_ap.classList.remove('hidden');
    if (productsGrid_ap) productsGrid_ap.classList.add('hidden');
};

const openCart = () => {
    if (cartModal_ap) {
        cartModal_ap.classList.add('active');
        displayCart_ap();
    }
};

const closeCart = () => {
    if (cartModal_ap) {
        cartModal_ap.classList.remove('active');
    }
};

const showSuccessModal_ap = () => {
    if (successModal_ap) {
        successModal_ap.classList.add('active');
    }
};

const closeSuccessModal = () => {
    if (successModal_ap) {
        successModal_ap.classList.remove('active');
    }
};

const showSuccessFeedback_ap = (message) => {
    // Create a temporary success notification
    const notification_ap = document.createElement('div');
    notification_ap.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification_ap.textContent = message;
    
    document.body.appendChild(notification_ap);
    
    // Animate in
    setTimeout(() => {
        notification_ap.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification_ap.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification_ap);
        }, 300);
    }, 3000);
};

const scrollToProducts = () => {
    const productsSection_ap = document.getElementById('products');
    if (productsSection_ap) {
        productsSection_ap.scrollIntoView({ behavior: 'smooth' });
    }
};

// Event Listeners
if (cartButton_ap) {
    cartButton_ap.addEventListener('click', openCart);
}

// Close modal when clicking outside
cartModal_ap?.addEventListener('click', (e) => {
    if (e.target === cartModal_ap) {
        closeCart();
    }
});

successModal_ap?.addEventListener('click', (e) => {
    if (e.target === successModal_ap) {
        closeSuccessModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCart();
        closeSuccessModal();
    }
});