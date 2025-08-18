// Global variables
let cart = [];

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RuwBlFSn63qgmcHtd7LdeT7SuT23AzWE0BPDucH5hVpbrVnsnAEoFU6odPchzz7UPgdVFRcBjNCFvo4P3m6b4rg00kmv89OFc';

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    
    if (mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const burgerButton = document.querySelector('.burger-menu');
    
    mobileMenu.style.display = 'block';
    mobileMenuOverlay.style.display = 'block';
    
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
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const burgerButton = document.querySelector('.burger-menu');
    
    mobileMenu.classList.remove('active');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        mobileMenu.style.display = 'none';
        mobileMenuOverlay.style.display = 'none';
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
    // Check if Stripe is available (only log if we're on a page that needs it)
    if (typeof Stripe !== 'undefined') {
        console.log('✅ Stripe library loaded successfully');
    } else {
        // Only show error on pages that actually need Stripe (like checkout)
        if (window.location.pathname.includes('checkout') || window.location.pathname.includes('payment')) {
            console.error('❌ Stripe library not found! Check if script is loaded');
        }
    }
    
    loadCartFromStorage();
    updateCartDisplay();
    setupEventListeners();
});

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
        quantity: quantity,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=75&fit=crop'
    };

    // Check if product already exists in cart
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += quantity;
    } else {
        cart.push(product);
    }

    saveCartToStorage();
    updateCartDisplay();
    showNotification('Product added to cart!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartDisplay();
    showNotification('Product removed from cart!', 'info');
}

function updateQuantity(productId, newQuantity) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            product.quantity = newQuantity;
            saveCartToStorage();
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Update cart items display
    if (cartItems) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Your cart is empty</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        <div>
                            <h4>${item.name}</h4>
                            <p>£${item.price.toFixed(2)} x ${item.quantity}</p>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">×</button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
        }
    }

    // Update cart total
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `£${total.toFixed(2)}`;
    }
}

function saveCartToStorage() {
    localStorage.setItem('recipeRushCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('recipeRushCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Modal functions
function openCart() {
    cartModal.style.display = 'block';
}

function closeCart() {
    cartModal.style.display = 'none';
}

// Form handlers
function handleContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // Simulate form submission
    showNotification('Message sent successfully!', 'success');
    
    // Reset form
    event.target.reset();
}

// Checkout functionality
function showCheckoutForm() {
    if (cart.length === 0) {
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
    processPayment(null, firstName, lastName, email);
}

async function processPayment(paymentMethod, firstName, lastName, email) {
    try {
        showNotification('Creating checkout session...', 'info');
        
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
            const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            const { error } = await stripe.redirectToCheckout({
                sessionId: sessionId
            });
            
            if (error) {
                throw new Error(error.message);
            }
        } else if (sessionId) {
            // Fallback: redirect to the session URL if Stripe is not available
            const sessionUrl = `/checkout-session/${sessionId}`;
            showNotification('Redirecting to secure payment...', 'success');
            window.location.href = sessionUrl;
        } else {
            throw new Error('No session ID received');
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
    closeButton.onclick = function() { this.parentElement.remove(); };

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
