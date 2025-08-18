// Contact page specific functionality

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
    document.getElementById('checkoutForm').reset();
    // Clear any errors
    document.getElementById('card-errors').textContent = '';
}

function initializeStripe() {
    try {
        // Initialize Stripe
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
            const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
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
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');

    // Get form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;

    // Check if Stripe is initialized
    if (!window.stripe) {
        showNotification('Payment system not ready. Please try again.', 'error', 4000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    // Get payment data
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvc = document.getElementById('cardCvc').value;

    // Validate payment fields
    if (!cardNumber || !cardExpiry || !cardCvc) {
        showNotification('Please fill in all payment fields.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    // Basic card validation
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        showNotification('Please enter a valid card number.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showNotification('Please enter expiry date in MM/YY format.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        return;
    }

    if (cardCvc.length < 3 || cardCvc.length > 4) {
        showNotification('Please enter a valid CVC.', 'error', 3000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
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
            email,
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
            buttonText.classList.remove('hidden');
            spinner.classList.add('hidden');
        } else {
            // Payment method created successfully
            processPayment(result.paymentMethod, firstName, lastName, email);
        }
    }).catch(function(error) {
        // Clean up temporary container
        document.body.removeChild(tempContainer);

        console.error('Payment error:', error);

        // Show specific error messages
        let errorMessage = 'Payment processing failed. Please try again.';

        if (error.message && error.message.includes('timeout')) {
            errorMessage = 'Payment request timed out. Please check your connection and try again.';
        } else if (error.message && error.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }

        showNotification(errorMessage, 'error', 5000);
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        buttonText.classList.remove('hidden');
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
    setupContactForm();
    setupFormValidation();
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
function submitContactForm(data) {
    // Show loading state
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Initialize EmailJS
    emailjs.init("3yTB8siz9rVmr9gRu");

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
