/**
 * RecipeRush Cart Manager
 * Handles cart persistence across page navigation
 * Uses IIFE pattern to avoid global namespace pollution
 */

(function() {
    'use strict';

    // Check if namespace already exists to prevent overwrites
    if (window.RecipeRushApp && window.RecipeRushApp.cart) {
        console.warn('⚠️ RecipeRush cart already exists, skipping initialization');
        return;
    }

    // Create or extend the main namespace
    if (!window.RecipeRushApp) {
        window.RecipeRushApp = {};
    }

    // Cart implementation
    const cart = {
        items: [],

        // Initialize cart from localStorage
        init() {
            this.loadFromStorage();
            this.updateDisplay();
            console.log('🛒 Cart manager initialized with', this.items.length, 'items');
        },

        // Add item to cart
        addItem(product) {
            if (!product || typeof product.id === 'undefined' || typeof product.quantity !== 'number' || product.quantity <= 0) {
                console.error('❌ Invalid product data:', product);
                return;
            }

            const existingIndex = this.items.findIndex(item => item.id === product.id);

            if (existingIndex > -1) {
                this.items[existingIndex].quantity += product.quantity;
            } else {
                this.items.push(product);
            }

            this.saveToStorage();
            this.updateDisplay();
            console.log('✅ Item added to cart:', product.name);
        },

        // Remove item from cart
        removeItem(productId) {
            this.items = this.items.filter(item => item.id !== productId);
            this.saveToStorage();
            this.updateDisplay();
            console.log('🗑️ Item removed from cart');
        },

        // Update item quantity
        updateQuantity(productId, newQuantity) {
            const item = this.items.find(item => item.id === productId);
            if (item) {
                if (newQuantity <= 0) {
                    this.removeItem(productId);
                } else {
                    item.quantity = newQuantity;
                    this.saveToStorage();
                    this.updateDisplay();
                }
            }
        },

        // Get cart items
        getItems() {
            return [...this.items];
        },

        // Get cart total
        getTotal() {
            return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        // Get cart count
        getCount() {
            return this.items.reduce((sum, item) => sum + item.quantity, 0);
        },

        // Save cart to localStorage
        saveToStorage() {
            try {
                localStorage.setItem('recipeRushCart', JSON.stringify(this.items));
            } catch (error) {
                console.error('❌ Failed to save cart to localStorage:', error);
            }
        },

        // Load cart from localStorage
        loadFromStorage() {
            try {
                const savedCart = localStorage.getItem('recipeRushCart');
                if (savedCart) {
                    this.items = JSON.parse(savedCart);
                }
            } catch (error) {
                console.error('❌ Failed to load cart from localStorage:', error);
                this.items = [];
            }
        },

        // Update cart display
        updateDisplay() {
            // Update cart count
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = this.getCount();
            }

            // Update cart items display
            const cartItems = document.getElementById('cartItems');
            if (cartItems) {
                cartItems.innerHTML = '';

                if (this.items.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'cart-empty';
                    emptyMessage.textContent = 'Your cart is empty';
                    cartItems.appendChild(emptyMessage);
                } else {
                    this.items.forEach(item => {
                        const cartItem = document.createElement('div');
                        cartItem.className = 'cart-item';

                        // Create elements safely to prevent XSS
                        const itemInfo = document.createElement('div');
                        itemInfo.className = 'cart-item-info';

                        const img = document.createElement('img');
                        img.src = item.image;
                        img.alt = item.name;
                        img.style.cssText = 'width: 50px; height: 50px; object-fit: cover; border-radius: 5px;';

                        const textDiv = document.createElement('div');
                        const nameHeader = document.createElement('h4');
                        nameHeader.textContent = item.name;
                        const priceP = document.createElement('p');
                        priceP.textContent = `£${item.price.toFixed(2)} x ${item.quantity}`;

                        textDiv.appendChild(nameHeader);
                        textDiv.appendChild(priceP);
                        itemInfo.appendChild(img);
                        itemInfo.appendChild(textDiv);

                        const controls = document.createElement('div');
                        controls.className = 'cart-item-controls';

                        const decreaseBtn = document.createElement('button');
                        decreaseBtn.textContent = '-';
                        decreaseBtn.onclick = () => window.RecipeRushApp.cart.updateQuantity(item.id, item.quantity - 1);

                        const quantitySpan = document.createElement('span');
                        quantitySpan.className = 'quantity';
                        quantitySpan.textContent = item.quantity;

                        const increaseBtn = document.createElement('button');
                        increaseBtn.textContent = '+';
                        increaseBtn.onclick = () => window.RecipeRushApp.cart.updateQuantity(item.id, item.quantity + 1);

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-btn';
                        removeBtn.textContent = '×';
                        removeBtn.onclick = () => window.RecipeRushApp.cart.removeItem(item.id);

                        controls.appendChild(decreaseBtn);
                        controls.appendChild(quantitySpan);
                        controls.appendChild(increaseBtn);
                        controls.appendChild(removeBtn);

                        cartItem.appendChild(itemInfo);
                        cartItem.appendChild(controls);
                        cartItems.appendChild(cartItem);
                    });
                }
            }

            // Update cart total
            const cartTotal = document.getElementById('cartTotal');
            if (cartTotal) {
                cartTotal.textContent = `£${this.getTotal().toFixed(2)}`;
            }
        },

        // Clear cart
        clear() {
            this.items = [];
            this.saveToStorage();
            this.updateDisplay();
            console.log('🧹 Cart cleared');
        }
    };

    // Assign cart to namespace
    window.RecipeRushApp = window.RecipeRushApp || {};
    window.RecipeRushApp.cart = cart;

    // Export cart for external access (maintains backward compatibility)
    window.RecipeRushCart = cart;

    // Deferred initialization function
    function initializeCart() {
        console.log('🛒 Initializing cart manager...');
        
        if (document.readyState === 'loading') {
            console.log('🔄 DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ DOM ready, initializing cart...');
                cart.init();
            });
        } else {
            // DOM is already ready
            console.log('✅ DOM already ready, initializing cart immediately...');
            cart.init();
        }
    }

    // Initialize cart with proper timing
    initializeCart();
    
    // Log the cart availability for debugging
    console.log('🛒 Cart manager loaded, RecipeRushCart available:', !!window.RecipeRushCart);
    console.log('🛒 Cart manager loaded, RecipeRushApp.cart available:', !!window.RecipeRushApp?.cart);

})();
