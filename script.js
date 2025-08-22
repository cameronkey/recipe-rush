// Cart operations now handled by RecipeRushCart manager
window.cartOperations = {
    getCart: () => window.RecipeRushCart.getItems(),
    getCartLength: () => window.RecipeRushCart.getCount(),
    getCartTotal: () => window.RecipeRushCart.getTotal()
};

// Cart will be loaded when DOM is ready, not immediately

// Stripe Configuration - Loaded securely from server configuration
// SECURITY: No hardcoded keys present - keys loaded from /api/config endpoint

// Configuration validation function
function validateConfiguration() {
    if (!window.RECIPE_RUSH_CONFIG) {
        throw new Error('RecipeRush configuration not loaded. Please refresh the page.');
    }

    if (!window.RECIPE_RUSH_CONFIG.stripe || !window.RECIPE_RUSH_CONFIG.stripe.publishableKey) {
        throw new Error('Stripe publishable key not found in configuration. Please check server configuration.');
    }

    console.log('✅ Stripe configuration validated successfully');
}

// Mobile Menu Functions
function openMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const burgerButton = document.querySelector('.burger-menu');

    mobileMenu.style.display = 'block';

    // Trigger animation
    setTimeout(() => {
        mobileMenu.classList.add('active');
    }, 10);

    // Update aria-expanded for accessibility
    if (burgerButton) {
        burgerButton.setAttribute('aria-expanded', 'true');
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const burgerButton = document.querySelector('.burger-menu');

    mobileMenu.classList.remove('active');

    // Wait for animation to complete before hiding
    setTimeout(() => {
        mobileMenu.style.display = 'none';
    }, 300);

    // Update aria-expanded for accessibility
    if (burgerButton) {
        burgerButton.setAttribute('aria-expanded', 'false');
    }

    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// DOM elements
const cartModal = document.getElementById('cartModal');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Validate configuration first
        validateConfiguration();

        // Check if Stripe is available (only log if we're on a page that needs it)
        if (typeof Stripe !== 'undefined') {
            console.log('✅ Stripe library loaded successfully');
        } else {
            // Only show error on pages that actually need Stripe (like checkout)
            if (window.location.pathname.includes('checkout') || window.location.pathname.includes('payment')) {
                console.error('❌ Stripe library not found! Check if script is loaded');
            }
        }

        // Cart is now managed by RecipeRushCart manager
        updateCartDisplay();
        setupEventListeners();

    } catch (error) {
        console.error('❌ Configuration validation failed:', error);
        // Show user-friendly error message
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
                <h1>Configuration Error</h1>
                <p>Failed to initialize application. Please refresh the page.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Run initialization immediately since config-loader.js handles the timing
initializeApp();

// Setup event listeners
function setupEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Prevent modal close when clicking inside modal content
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    });

    // Handle form submissions
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

// Cart functionality
function addToCart() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const product = {
        id: 'recipe-collection-001',
        name: 'The Complete Recipe Collection',
        price: 10.00,
        quantity,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=75&fit=crop'
    };

    // Use the cart manager to add the item
    window.RecipeRushCart.addItem(product);
    showNotification('Product added to cart!', 'success');
}

function removeFromCart(productId) {
    window.RecipeRushCart.removeItem(productId);
    showNotification('Product removed from cart!', 'info');
}

function updateQuantity(productId, newQuantity) {
    window.RecipeRushCart.updateQuantity(productId, newQuantity);
}

// Cart display is now handled by RecipeRushCart manager
function updateCartDisplay() {
function updateCartDisplay() {
    if (window.RecipeRushCart && typeof window.RecipeRushCart.updateDisplay === 'function') {
        window.RecipeRushCart.updateDisplay();
    } else {
        console.warn('⚠️ RecipeRushCart not available yet, skipping cart display update');
        // Retry after a short delay
        setTimeout(() => {
            if (window.RecipeRushCart && typeof window.RecipeRushCart.updateDisplay === 'function') {
                console.log('✅ RecipeRushCart now available, updating display');
                window.RecipeRushCart.updateDisplay();
            }
        }, 500);
    }
}

// Cart storage is now handled by RecipeRushCart manager

// Modal functions
function openCart() {
    if (!cartModal) {
        console.warn('⚠️ Cart modal not initialized yet, waiting for initialization...');
        // Wait for cart to be initialized
        const checkInterval = setInterval(() => {
            if (cartModal) {
                clearInterval(checkInterval);
                console.log('✅ Cart modal now available, opening cart...');
                cartModal.style.display = 'block';
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!cartModal) {
                console.error('❌ Cart modal failed to initialize after 5 seconds');
                alert('Cart system is still loading. Please refresh the page and try again.');
            }
        }, 5000);
        return;
    }
    cartModal.style.display = 'block';
}

function closeCart() {
    if (!cartModal) {
        console.error('❌ Cart modal not initialized. Please refresh the page.');
        return;
    }
    cartModal.style.display = 'none';
}

// Form handlers
function handleContactForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    // Simulate form submission
    showNotification('Message sent successfully!', 'success');

    // Reset form
    event.target.reset();
}

// Checkout functionality
function showCheckoutForm() {
    const cart = window.RecipeRushCart.getItems();
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    console.log('Opening checkout form...');

    // Populate checkout items
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    checkoutItems.innerHTML = '';
    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checkout-item';
        itemDiv.innerHTML = `
            <div class="checkout-item-info">
                <strong>${item.name}</strong>
                <span>Qty: ${item.quantity}</span>
            </div>
            <div class="checkout-item-price">£${(item.price * item.quantity).toFixed(2)}</div>
        `;
        checkoutItems.appendChild(itemDiv);
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `£${total.toFixed(2)}`;

    // Close cart and show checkout
    closeCart();
    document.getElementById('checkoutModal').style.display = 'block';

    console.log('Checkout modal displayed, initializing checkout form...');

    // Initialize checkout form
    initializeStripe();
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
    // Reset form
    document.getElementById('checkoutForm').reset();
}

function initializeStripe() {
    try {
        console.log('Setting up checkout form...');

        // Handle form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            console.log('Checkout form found, setting up event listener...');
            // Remove existing listener to prevent duplicates
            checkoutForm.removeEventListener('submit', handleCheckoutSubmit);
            checkoutForm.addEventListener('submit', handleCheckoutSubmit);
            console.log('Event listener attached successfully');
        } else {
            console.error('Checkout form not found!');
        }

        console.log('Checkout form initialized successfully');

    } catch (error) {
        console.error('Error initializing checkout form:', error);
        showNotification('Checkout system initialization failed. Please refresh and try again.', 'error');
    }
}



function handleCheckoutSubmit(event) {
    event.preventDefault();

    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('hidden');

    // Get form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;

    // Basic validation
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all customer details.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }

    // Email validation
    if (!email.includes('@')) {
        showNotification('Please enter a valid email address.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }

    // Process payment directly (no card details needed for Stripe Checkout)
    processPayment(firstName, lastName, email);
}

async function processPayment(firstName, lastName, email) {
    try {
        // Validate configuration before proceeding
        validateConfiguration();

        showNotification('Creating checkout session...', 'info');

        // Get cart items from cart manager
        const cart = window.RecipeRushCart.getItems();
        
        // Prepare cart items for Stripe
        const items = cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || 'https://via.placeholder.com/150x150?text=Recipe'
        }));

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create checkout session via your backend
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items,
                customerEmail: email,
                customerName: `${firstName} ${lastName}`,
                total: total
            })
        }).catch(error => {
            console.error('Network error:', error);
            throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.url) {
            showNotification('Redirecting to secure payment...', 'success');
            window.location.href = data.url;
        } else if (data && data.sessionId) {
            // Back-compat if server still returns only sessionId
            showNotification('Redirecting to secure payment...', 'success');
            window.location.href = `/checkout-session/${data.sessionId}`;
        } else {
            throw new Error('No checkout URL or sessionId received');
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        showNotification('Payment setup failed. Please try again.', 'error');

        // Re-enable button
        const submitButton = document.getElementById('submit-button');
        const buttonText = document.getElementById('button-text');
        const spinner = document.getElementById('spinner');

        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

// Utility functions
function showNotification(message, type = 'info', duration = 4000) {
    // Remove existing notifications to prevent stacking
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Create icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    // Create notification content
    // Create notification content safely
    const iconSpan = document.createElement('span');
    iconSpan.className = 'notification-icon';
    iconSpan.textContent = icons[type] || icons.info;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.textContent = '×';
    
    // Create a named handler function to avoid memory leaks
    const closeHandler = function() {
        const parentElement = this.parentElement;
        if (parentElement) {
            parentElement.remove();
        }
        // Clean up the event listener to prevent memory leaks
        closeButton.removeEventListener('click', closeHandler);
    };
    
    closeButton.addEventListener('click', closeHandler);

    notification.appendChild(iconSpan);
    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);

    // Add to page
    document.body.appendChild(notification);

    // Animate in from top
    notification.style.transform = 'translateY(-100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 100);

    // Auto-remove after specified duration
    if (duration > 0) {
        setTimeout(() => {
            notification.style.transform = 'translateY(-100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Product image functionality
function changeImage(src) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === src) {
            thumb.classList.add('active');
        }
    });
}

// Quantity controls
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    quantityInput.value = parseInt(quantityInput.value) + 1;
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

// Export functions for use in other scripts
window.recipeRush = {
    addToCart,
    removeFromCart,
    updateQuantity,
    openCart,
    closeCart,
    changeImage,
    increaseQuantity,
    decreaseQuantity
};

// Make functions globally available for HTML onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openCart = openCart;
window.closeCart = closeCart;
window.changeImage = changeImage;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.showCheckoutForm = showCheckoutForm;
window.closeCheckout = closeCheckout;
