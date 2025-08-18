// Global variables
let cart = [];

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
    
    console.log('Checkout modal displayed, initializing Stripe...');
    
    // Initialize Stripe immediately and also after a delay as backup
    initializeStripe();
    setTimeout(() => {
        console.log('Backup Stripe initialization...');
        if (!window.stripe || !document.querySelector('#card-element .StripeElement')) {
            console.log('Re-initializing Stripe...');
            initializeStripe();
        }
    }, 500);
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
    // Reset form
    document.getElementById('checkoutForm').reset();
    // Clear any errors
    document.getElementById('card-errors').textContent = '';
}

function initializeStripe() {
    try {
        console.log('Creating Stripe instance...');
        
        // Stripe publishable key for RecipeRush (LIVE)
        window.stripe = Stripe('pk_live_51RuwBlFSn63qgmcHtd7LdeT7SuT23AzWE0BPDucH5hVpbrVnsnAEoFU6odPchzz7UPgdVFRcBjNCFvo4P3m6b4rg00kmv89OFc');
        
        console.log('Stripe instance created successfully');
        
        // Set up payment field formatting and validation
        setupPaymentFields();
        
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
        
        console.log('Stripe initialized successfully - payment fields ready');
        
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showNotification('Payment system initialization failed. Please refresh and try again.', 'error');
    }
}

function setupPaymentFields() {
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            e.target.value = value;
        });
    }
    
    // CVC formatting
    const cvcInput = document.getElementById('cardCvc');
    if (cvcInput) {
        cvcInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
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
    
    // Check if Stripe is initialized
    if (!window.stripe) {
        showNotification('Payment system not ready. Please try again.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }
    
    // Get payment data
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvc = document.getElementById('cardCvc').value;
    
    // Validate payment fields
    if (!cardNumber || !cardExpiry || !cardCvc) {
        showNotification('Please fill in all payment fields.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }
    
    // Basic card validation
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        showNotification('Please enter a valid card number.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showNotification('Please enter expiry date in MM/YY format.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }
    
    if (cardCvc.length < 3 || cardCvc.length > 4) {
        showNotification('Please enter a valid CVC.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }
    
    // Create payment method using Stripe Elements
    const elements = window.stripe.elements();
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
            },
        },
    });
    
    // Create a temporary container to mount the card element
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);
    
    cardElement.mount(tempContainer);
    
    // Create payment method
    window.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
            name: `${firstName} ${lastName}`,
            email: email,
        },
    }).then(function(result) {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        if (result.error) {
            // Show error
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
            
            // Re-enable button
            submitButton.disabled = false;
            buttonText.textContent = 'Pay Now';
            spinner.classList.add('hidden');
        } else {
            // Payment method created successfully
            processPayment(result.paymentMethod, firstName, lastName, email);
        }
    }).catch(function(error) {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        console.error('Payment error:', error);
        showNotification('Payment processing failed. Please try again.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    });
}

function processPayment(paymentMethod, firstName, lastName, email) {
    // In a real implementation, you would send this to your server
    // to create a payment intent and complete the payment
    
    // For now, we'll simulate a successful payment
    setTimeout(() => {
        // Simulate successful payment
        showNotification('Payment successful! Processing your order...', 'success');
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartDisplay();
        
        // Close checkout
        closeCheckout();
        
        // Show success message
        showNotification('Order completed! Check your email for your e-book download link.', 'success');
        
        // In production, you would:
        // 1. Send order details to your server
        // 2. Process payment with Stripe
        // 3. Generate secure download link
        // 4. Send confirmation email with download link
        
    }, 2000);
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
