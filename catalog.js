// Catalog page specific functionality
// SECURITY: Stripe keys are loaded securely from /api/config endpoint
// No hardcoded keys are present in this file

// Access global functions (defined in script.js)
const showNotification = window.showNotification || function(message, type) { console.log(`${type}: ${message}`); };
const closeCart = window.closeCart || function() { console.log('closeCart called'); };

// Helper function to reset checkout button state
function resetCheckoutButton() {
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    if (submitButton && buttonText && spinner) {
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

// Mobile Menu Functions - These are now handled by script.js
// toggleMobileMenu, openMobileMenu, and closeMobileMenu are defined globally

// Checkout functionality
function showCheckoutForm() {
    // Access cart from global scope when function is called
-function showCheckoutForm() {
-    // Access cart from global scope when function is called
function showCheckoutForm(cart = window.cart) {
    // Accept cart as parameter with fallback to global
    if (!cart || cart.length === 0) {
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
            <div class="checkout-item-price">£${(Math.round(item.price * 100) * item.quantity / 100).toFixed(2)}</div>
        `;
        checkoutItems.appendChild(itemDiv);
    });

    const total = cart.reduce((sum, item) => sum + (Math.round(item.price * 100) * item.quantity), 0) / 100;
    checkoutTotal.textContent = `£${total.toFixed(2)}`;

    // Close cart and show checkout
    closeCart();
    document.getElementById('checkoutModal').style.display = 'block';
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

    // Validate required fields
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all required fields.', 'error');
        resetCheckoutButton(); // Use the new helper function
        return;
    }

    // Validate email format
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
        showNotification('Please enter a valid email address.', 'error');
        resetCheckoutButton(); // Use the new helper function
        return;
    }

    // Process payment directly - server will handle Stripe integration
    processPayment(firstName, lastName, email);
}

async function processPayment(firstName, lastName, email) {
    try {
        // Get CSRF token from meta tag
        const csrfToken = document.getElementById('csrf-token-meta').getAttribute('content');
        if (!csrfToken) {
            throw new Error('CSRF token not available');
        }

        // Access cart from cart manager
        const cart = window.RecipeRushCart.getItems();

        // Prepare order data
        const orderData = {
            items: cart,
            customerEmail: email,
            customerName: `${firstName} ${lastName}`,
            total: cart.reduce((sum, item) => sum + (Math.round(item.price * 100) * item.quantity), 0) / 100
        };

        // Send order to server to create Stripe checkout session
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.url) {
            // Validate Stripe checkout URL before redirecting
            try {
                const checkoutUrl = new URL(result.url);
                const allowedOrigins = [
                    'https://checkout.stripe.com',
                    'https://js.stripe.com'
                ];

                const isValidUrl = allowedOrigins.some(origin =>
                    checkoutUrl.origin === origin ||
                    checkoutUrl.href.startsWith(origin)
                );

                if (!isValidUrl) {
                    throw new Error(`Invalid checkout URL origin: ${checkoutUrl.origin}`);
                }

                // URL is valid, redirect to Stripe Checkout
                window.location.href = result.url;
            } catch (urlError) {
                console.error('URL validation error:', urlError);
                throw new Error('Invalid checkout URL received from server');
            }
        } else {
            throw new Error('No checkout URL received from server');
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        showNotification('Payment processing failed. Please try again.', 'error');

        // Re-enable button
        resetCheckoutButton(); // Use the new helper function
    }
}

// Load CSRF token when page loads
async function loadCSRFToken() {
    try {
        const response = await fetch('/csrf-token');
        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }
        const data = await response.json();
        let metaElement = document.getElementById('csrf-token-meta');
        if (!metaElement) {
            metaElement = document.createElement('meta');
            metaElement.id = 'csrf-token-meta';
            document.head.appendChild(metaElement);
        }
        metaElement.setAttribute('content', data.token);
        console.log('CSRF token loaded successfully');
    } catch (error) {
        console.error('Error loading CSRF token:', error);
        showNotification('Failed to load security token. Please refresh the page.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Catalog page is now simplified to just show the single product
    // All functionality is handled by the main script.js file
    console.log('Catalog page loaded - single product display');

    // Load CSRF token
    loadCSRFToken();

    // Set up checkout form event listener
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        console.log('Checkout form event listener attached');
    }
});

// Export functions for use in other scripts
window.catalogFunctions = {
    showCheckoutForm,
    handleCheckoutSubmit,
    processPayment,
    loadCSRFToken
};
