// Catalog page specific functionality
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
    
    mobileMenu.style.display = 'block';
    mobileMenuOverlay.style.display = 'block';
    
    // Trigger animation
    setTimeout(() => {
        mobileMenu.classList.add('active');
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    
    mobileMenu.classList.remove('active');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        mobileMenu.style.display = 'none';
        mobileMenuOverlay.style.display = 'none';
    }, 300);
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Checkout functionality
function showCheckoutForm() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
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
    
    // Initialize Stripe - always reinitialize to ensure proper setup
    setTimeout(() => {
        initializeStripe();
    }, 100);
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

document.addEventListener('DOMContentLoaded', function() {
    // Catalog page is now simplified to just show the single product
    // All functionality is handled by the main script.js file
    console.log('Catalog page loaded - single product display');
});

// Export functions for use in other scripts
window.catalogFunctions = {
    // Simplified catalog functions
};
