// Contact page specific functionality
// SECURITY: Stripe keys are loaded securely from /api/config endpoint
// No hardcoded keys are present in this file

// Configuration constants for fetch timeout and retry behavior
const FETCH_CONFIG = {
    TIMEOUT_MS: 30000,        // 30 seconds timeout
    MAX_RETRIES: 3,           // Maximum number of retry attempts
    BASE_DELAY_MS: 1000,      // Base delay for exponential backoff (1 second)
    MAX_DELAY_MS: 10000       // Maximum delay cap (10 seconds)
};

// EmailJS configuration cache
let emailjsConfig = null;
let emailjsInitialized = false;

// EmailJS Configuration Functions
async function getEmailJSConfig() {
    // Check if we already have the config cached
    if (emailjsConfig) {
        return emailjsConfig;
    }

    try {
        console.log('🔄 Fetching EmailJS configuration...');

        // Check if config is already available globally from config-loader
        if (window.RECIPE_RUSH_CONFIG && window.RECIPE_RUSH_CONFIG.emailjs) {
            emailjsConfig = window.RECIPE_RUSH_CONFIG.emailjs;
            console.log('✅ EmailJS config loaded from global config');
            return emailjsConfig;
        }

        // Fallback: fetch config directly if not available globally
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
        }

        const config = await response.json();

        if (!config.emailjs || !config.emailjs.publicKey) {
            throw new Error('EmailJS public key not found in configuration');
        }

        // Cache the config
        emailjsConfig = config.emailjs;
        console.log('✅ EmailJS config fetched and cached successfully');
        return emailjsConfig;

    } catch (error) {
        console.error('❌ Failed to load EmailJS configuration:', error);

        // Don't fallback to hardcoded keys - let the application handle missing config gracefully
        throw new Error('EmailJS configuration is required and could not be loaded');
    }
}

async function initializeEmailJS() {
    if (emailjsInitialized) {
        console.log('✅ EmailJS already initialized');
        return;
    }

    try {
        const config = await getEmailJSConfig();

        if (!config.publicKey) {
            throw new Error('EmailJS public key is missing');
        }

        // Initialize EmailJS with the fetched key
        emailjs.init(config.publicKey);
        emailjsInitialized = true;
        console.log('✅ EmailJS initialized successfully with dynamic key');

    } catch (error) {
        console.error('❌ EmailJS initialization failed:', error);
        throw error;
    }
}

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
    const cart = window.RecipeRushCart.getItems();
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error', 3000);
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
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.reset();
    }
    // Reset button state
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    if (submitButton && buttonText && spinner) {
        submitButton.disabled = false;
        buttonText.textContent = 'Proceed to Secure Checkout';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function initializeStripe() {
    try {
        // Check if configuration is available
        if (!window.RECIPE_RUSH_CONFIG || !window.RECIPE_RUSH_CONFIG.stripe || !window.RECIPE_RUSH_CONFIG.stripe.publishableKey) {
            throw new Error('Stripe configuration not available');
        }

        // Initialize Stripe with configuration from server
        window.stripe = Stripe(window.RECIPE_RUSH_CONFIG.stripe.publishableKey);

        console.log('Stripe instance created successfully');

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

        console.log('Stripe initialized successfully - checkout form ready');

    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showNotification('Payment system initialization failed. Please refresh and try again.', 'error');
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
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validate required fields
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all required fields.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Proceed to Secure Checkout';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Proceed to Secure Checkout';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    // Check if cart has items
    const cart = window.RecipeRushCart.getItems();
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Proceed to Secure Checkout';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    // Process payment with Stripe Checkout
    processPayment(firstName, lastName, email);
}

function processPayment(firstName, lastName, email) {
    // Show loading state
    showNotification('Creating secure checkout session...', 'info');

    // Prepare cart items for Stripe
    const items = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || 'https://via.placeholder.com/150x150?text=Recipe'
    }));

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create checkout session via backend with timeout and retry behavior
    createCheckoutSessionWithRetry(items, email, firstName, lastName, total);
}

// Enhanced fetch function with timeout and retry behavior
async function createCheckoutSessionWithRetry(items, email, firstName, lastName, total) {
    const requestBody = {
        items: items,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`,
        total: total
    };

    const requestHeaders = {
        'Content-Type': 'application/json',
    };

    let lastError;
    
    for (let attempt = 0; attempt <= FETCH_CONFIG.MAX_RETRIES; attempt++) {
        // Create a new AbortController for each attempt
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, FETCH_CONFIG.TIMEOUT_MS);

        try {
            console.log(`Attempt ${attempt + 1}/${FETCH_CONFIG.MAX_RETRIES + 1} to create checkout session`);
            
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody),
                signal: abortController.signal,
                credentials: 'same-origin'
            });

            // Clear timeout on success
            clearTimeout(timeoutId);

            if (!response.ok) {
                const err = new Error(`HTTP ${response.status} ${response.statusText}`);
                // carry status to catch/final handling
                err.status = response.status;
                throw err;
            }

            const data = await response.json();
            
            // Handle successful response
            if (data.url) {
                // Prefer data.url and redirect to it
                window.location.href = data.url;
                return;
            } else if (data.sessionId) {
                // Use Stripe client-side redirect flow for backward compatibility
                if (window.stripe) {
                    const result = await window.stripe.redirectToCheckout({ sessionId: data.sessionId });
                    if (result && result.error) {
                        const err = new Error(result.error.message || 'Stripe redirect failed');
                        err.status = 499; // client-side redirect failure
                        throw err;
                    }
                    return; // navigation initiated
                } else {
                    throw new Error('Stripe library not loaded. Please refresh the page and try again.');
                }
            } else {
                throw new Error('No checkout URL or session ID received from server');
            }

        } catch (error) {
            // Clear timeout on error
            clearTimeout(timeoutId);
            
            lastError = error;
            
            // Don't retry on client errors (4xx) or AbortError (timeout)
            if (error.name === 'AbortError') {
                console.log(`Attempt ${attempt + 1} timed out after ${FETCH_CONFIG.TIMEOUT_MS}ms`);
                if (attempt === FETCH_CONFIG.MAX_RETRIES) {
                    throw new Error(`Request timed out after ${FETCH_CONFIG.TIMEOUT_MS / 1000} seconds. Please check your connection and try again.`);
                }
            } else if (typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
                console.log(`Client error on attempt ${attempt + 1}, not retrying:`, error.message);
                throw error;
            } else if (attempt < FETCH_CONFIG.MAX_RETRIES) {
                // Calculate exponential backoff delay
                const delay = Math.min(
                    FETCH_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt),
                    FETCH_CONFIG.MAX_DELAY_MS
                );
                
                console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // If we've exhausted all retries or hit a non-retryable error
            break;
        }
    }

    // Handle final failure after all retries
    console.error('Payment setup failed after all retry attempts:', lastError);
    
    let errorMessage = 'Failed to create checkout session after multiple attempts. Please try again.';
    
    if (lastError.name === 'AbortError') {
        errorMessage = `Request timed out after ${FETCH_CONFIG.TIMEOUT_MS / 1000} seconds. Please check your connection and try again.`;
    } else if (typeof lastError.status === 'number' && lastError.status >= 400 && lastError.status < 500) {
        errorMessage = 'Invalid request. Please check your information and try again.';
    } else if (typeof lastError.status === 'number' && lastError.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
    } else if (lastError.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
    }

    showNotification(errorMessage, 'error', 5000);

    // Re-enable button
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    submitButton.disabled = false;
    buttonText.textContent = 'Proceed to Secure Checkout';
    buttonText.classList.remove('hidden');
    spinner.classList.add('hidden');
}
    submitButton.disabled = false;
    buttonText.textContent = 'Proceed to Secure Checkout';
    buttonText.classList.remove('hidden');
    spinner.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    setupContactForm();
    setupFormValidation();
    
    // Pre-initialize EmailJS for better user experience
    initializeEmailJS().catch(error => {
        console.warn('⚠️ EmailJS pre-initialization failed (will retry on form submission):', error);
    });
});

// Setup contact form functionality
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {return;}

    // Handle form submission
    contactForm.addEventListener('submit', handleContactFormSubmission);
}

// Setup form validation - simplified
function setupFormValidation() {
    // HTML5 validation is sufficient for basic required field validation
    console.log('Form validation setup complete');
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();

    console.log('Validating field:', field.name, 'Value:', value, 'Required:', field.hasAttribute('required'));

    // Remove existing error
    clearFieldError(event);

    // Check if required
    if (field.hasAttribute('required') && !value) {
        console.log('Field is required but empty:', field.name);
        showFieldError(field, 'This field is required');
        return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            console.log('Email validation failed:', field.name);
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }

    // Name validation (letters and spaces only)
    if (field.id === 'firstName' || field.id === 'lastName') {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (value && !nameRegex.test(value)) {
            console.log('Name validation failed:', field.name);
            showFieldError(field, 'Please enter only letters and spaces');
            return false;
        }
    }

    // Subject validation (must select an option)
    if (field.id === 'subject' && field.hasAttribute('required')) {
        if (!value || value === '') {
            console.log('Subject validation failed:', field.name);
            showFieldError(field, 'Please select a subject');
            return false;
        }
    }

    // Message length validation
    if (field.id === 'message' && value.length < 10) {
        console.log('Message validation failed:', field.name, 'Length:', value.length);
        showFieldError(field, 'Message must be at least 10 characters long');
        return false;
    }

    console.log('Field validation passed:', field.name);
    return true;
}

// Show field error
function showFieldError(field, message) {
    // Remove existing error
    clearFieldError({ target: field });

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #e74c3c;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        font-weight: 500;
    `;

    // Add error class to field
    field.classList.add('error');
    field.style.borderColor = '#e74c3c';

    // Insert error after field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

// Clear field error
function clearFieldError(event) {
    const field = event.target;

    // Remove error class
    field.classList.remove('error');
    field.style.borderColor = '#ddd';

    // Remove error message
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Handle contact form submission
function handleContactFormSubmission(event) {
    event.preventDefault();

    console.log('Form submission started');

    // Get the form element
    const form = event.target;

    // Check if form is valid using HTML5 validation
    if (!form.checkValidity()) {
        console.log('HTML5 validation failed');

        // Show specific error messages for common validation issues
        const requiredFields = form.querySelectorAll('[required]');
        const emptyFields = Array.from(requiredFields).filter(field => !field.value.trim());

        if (emptyFields.length > 0) {
            const fieldName = emptyFields[0].placeholder || emptyFields[0].name || 'required field';
            showNotification(`Please fill in ${fieldName}`, 'error', 3000);
        } else {
            showNotification('Please check all required fields', 'error', 3000);
        }

        form.reportValidity();
        return;
    }

    console.log('Form validation passed, collecting data');

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log('Form data collected:', data);

    // Add timestamp
    data.timestamp = new Date().toISOString();

    // Submit form directly
    submitContactForm(data);
}

// Submit contact form
async function submitContactForm(data) {
    // Show loading state
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Initialize EmailJS with dynamic configuration
    try {
        await initializeEmailJS();
    } catch (error) {
        console.error('❌ EmailJS initialization failed:', error);
        showNotification('Email service configuration error. Please try again later.', 'error', 5000);
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    // Prepare email template parameters to match the EmailJS template
    const templateParams = {
        name: `${data.firstName} ${data.lastName}`,
        message: data.message,
        time: new Date().toLocaleString()
    };

    // Send email using EmailJS
    emailjs.send('service_hngth6v', 'template_nme9xdx', templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);

            // Success response
            showNotification('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');

            // Reset form
            document.getElementById('contactForm').reset();

            // Clear any error states
            const fields = document.querySelectorAll('#contactForm input, #contactForm select, #contactForm textarea');
            fields.forEach(field => {
                field.classList.remove('error');
                field.style.borderColor = '#ddd';
            });

            // Remove error messages
            const errors = document.querySelectorAll('.field-error');
            errors.forEach(error => error.remove());

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Track the submission
            trackContactSubmission(data);

        }, function(error) {
            console.log('FAILED...', error);

            // Show specific error messages based on error type
            let errorMessage = 'Sorry, there was an error sending your message.';

            if (error.status === 0) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.status === 400) {
                errorMessage = 'Invalid form data. Please check your inputs.';
            } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.text && error.text.includes('quota')) {
                errorMessage = 'Email service limit reached. Please try again later.';
            }

            showNotification(errorMessage, 'error', 5000);

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Track contact form submission
function trackContactSubmission(data) {
    // This would typically send data to analytics or CRM
    // For demo purposes, we'll just log it
    console.log('Contact submission tracked:', {
        type: 'contact_form',
        subject: data.subject,
        timestamp: data.timestamp,
        hasNewsletter: data.newsletter ? 'yes' : 'no'
    });

    // In a real application, you might:
    // - Send to Google Analytics
    // - Send to CRM system
    // - Send to email marketing platform
    // - Create support ticket
}

// Newsletter subscription handling
function handleNewsletterSubscription(email) {
    if (!email) {return;}

    // Simulate newsletter subscription
    console.log('Newsletter subscription:', email);

    // In a real application, you would:
    // - Add to email list
    // - Send confirmation email
    // - Track subscription metrics

    showNotification('Thank you for subscribing to our newsletter!', 'success');
}


// Contact method interactions
function setupContactMethods() {
    const contactMethods = document.querySelectorAll('.contact-method');

    contactMethods.forEach(method => {
        method.addEventListener('click', function() {
            const type = this.querySelector('h3').textContent.toLowerCase();

            switch(type) {
                case 'email':
                    window.open('mailto:info@reciperush.com?subject=RecipeRush%20Inquiry', '_blank');
                    break;
                case 'phone':
                    window.open('tel:+15551234567', '_blank');
                    break;
                case 'address':
                    // Could open Google Maps
                    console.log('Address clicked - could open map');
                    break;
                case 'business hours':
                    // Could show detailed hours
                    console.log('Business hours clicked');
                    break;
            }
        });

        // Add hover effect
        method.style.cursor = 'pointer';
        method.style.transition = 'transform 0.2s ease';

        method.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        method.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Form auto-save functionality
function setupFormAutoSave() {
    const form = document.getElementById('contactForm');
    if (!form) {return;}

    const fields = form.querySelectorAll('input, select, textarea');

    // Load saved data
    loadFormData();

    // Auto-save on input
    fields.forEach(field => {
        field.addEventListener('input', function() {
            saveFormData();
        });
    });
}

// Save form data to localStorage
function saveFormData() {
    const form = document.getElementById('contactForm');
    if (!form) {return;}

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Save to localStorage
    localStorage.setItem('recipeRushContactForm', JSON.stringify(data));
}

// Load form data from localStorage
function loadFormData() {
    const savedData = localStorage.getItem('recipeRushContactForm');
    if (!savedData) {return;}

    try {
        const data = JSON.parse(savedData);
        const form = document.getElementById('contactForm');

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && data[key]) {
                field.value = data[key];
            }
        });
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

// Clear saved form data
function clearSavedFormData() {
    localStorage.removeItem('recipeRushContactForm');
}

// Initialize additional functionality
document.addEventListener('DOMContentLoaded', function() {
    setupContactMethods();
    setupFormAutoSave();

    // Clear saved data when form is successfully submitted
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function() {
            // Clear saved data after successful submission
            setTimeout(clearSavedFormData, 2000);
        });
    }
});

// Enhanced notification helper functions
function showQuickNotification(message, type = 'info') {
    showNotification(message, type, 2000); // Quick notifications for minor actions
}

function showPersistentNotification(message, type = 'info') {
    showNotification(message, type, 8000); // Longer notifications for important info
}

function showErrorNotification(message, duration = 4000) {
    showNotification(message, 'error', duration);
}

function showSuccessNotification(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

// Export functions for use in other scripts
window.contactFunctions = {
    validateField,
    showFieldError,
    clearFieldError,
    handleContactFormSubmission,
    submitContactForm,
    trackContactSubmission,
    handleNewsletterSubscription,
    showQuickNotification,
    showPersistentNotification,
    showErrorNotification,
    showSuccessNotification
};
