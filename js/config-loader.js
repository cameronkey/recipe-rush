/**
 * RecipeRush Configuration Loader
 * Handles configuration loading, script loading with proper order, and error handling
 */

(function() {
    'use strict';

    // Error UI template
    function showErrorUI(error, title = 'Configuration Error') {
        console.error('❌ Configuration loader error:', error);
        const container = document.createElement('div');
        container.style.cssText = 'padding: 2rem; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 2rem auto;';

        const heading = document.createElement('h1');
        heading.style.color = '#dc3545';
        heading.textContent = title;

        const message = document.createElement('p');
        message.textContent = 'Failed to load application configuration. Please try refreshing the page.';

        const errorBox = document.createElement('p');
        errorBox.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 1rem; border-radius: 4px; color: #721c24; margin: 1rem 0;';
        const errorLabel = document.createElement('strong');
        errorLabel.textContent = 'Error: ';
        errorBox.appendChild(errorLabel);
        errorBox.appendChild(document.createTextNode(error.message));

        const button = document.createElement('button');
        button.style.cssText = 'background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;';
        button.textContent = 'Refresh Page';
        button.onclick = () => window.location.reload();

        container.appendChild(heading);
        container.appendChild(message);
        container.appendChild(errorBox);
        container.appendChild(button);

        document.body.innerHTML = '';
        document.body.appendChild(container);
    }

    // Load script with error handling
    function loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;

            // Set async to false for deterministic loading order
            script.async = false;

            const timeoutMs = options.timeoutMs ?? 10000; // default 10s
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Script loading timeout: ${src}`));
            }, timeoutMs);

            function cleanup() {
                clearTimeout(timeoutId);
                script.onload = null;
                script.onerror = null;
            }

            script.onload = () => {
                cleanup();
                console.log(`✅ Script loaded successfully: ${src}`);
                resolve();
            };

            script.onerror = (error) => {
                cleanup();
                console.error(`❌ Failed to load script: ${src}`, error);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.body.appendChild(script);
        });
    }

    // Main configuration loading function
    async function loadConfiguration() {
        // Create AbortController for network timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000); // 10 second timeout
        try {
            console.log('🔄 Loading RecipeRush configuration...');

            const response = await fetch('https://recipe-rush.onrender.com/api/config', {
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
            }

            const config = await response.json();

            // Validate required configuration
            if (!config.stripe || !config.stripe.publishableKey) {
                throw new Error('Stripe publishable key not found in configuration');
            }

            if (!config.emailjs || !config.emailjs.publicKey) {
                throw new Error('EmailJS public key not found in configuration');
            }

            // Freeze the configuration object to prevent accidental mutation
            const frozenConfig = Object.freeze(config);

            // Make configuration available globally
            window.RECIPE_RUSH_CONFIG = frozenConfig;
            console.log('✅ Configuration loaded and frozen successfully');

            return frozenConfig;

        } catch (error) {
            // Handle AbortError specifically for timeout cases
            if (error.name === 'AbortError') {
                throw new Error('Configuration loading timed out after 10 seconds. Please check your network connection and try again.');
            }
            throw new Error(`Configuration loading failed: ${error.message}`, { cause: error });
        } finally {
            // Always clean up the timeout
            clearTimeout(timeoutId);
        }
    }

    // Service Worker Registration
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('✅ Service Worker registered successfully:', registration.scope);
                    })
                    .catch(error => {
                        console.warn('⚠️ Service Worker registration failed:', error);
                    });
            });
        }
    }

    // Main initialization function
    async function initialize() {
        try {
            // Register service worker for offline support
            registerServiceWorker();

            // Load configuration first
            await loadConfiguration();

            // Determine which scripts to load based on current page
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const scriptsToLoad = ['js/cart-manager.js', 'script.js'];

            // Try to get page-specific scripts from data attribute first
            const bodyElement = document.body;
            const pageScriptsAttr = bodyElement?.getAttribute('data-page-scripts');

            if (pageScriptsAttr && pageScriptsAttr.trim()) {
                // Split the attribute value and add non-empty script names
                const pageScripts = pageScriptsAttr.split(',').map(s => s.trim()).filter(s => s);
                scriptsToLoad.push(...pageScripts);
                console.log(`📜 Page scripts detected from data attribute: ${pageScripts.join(', ')}`);
            } else {
                // Fallback to hardcoded logic if data attribute is missing
                console.log('⚠️ No data-page-scripts attribute found, using fallback logic');
                if (currentPage === 'contact.html') {
                    scriptsToLoad.push('contact.js');
                } else if (currentPage === 'catalog.html') {
                    scriptsToLoad.push('catalog.js');
                }
            }

            console.log(`🔄 Loading scripts for ${currentPage}:`, scriptsToLoad);

            // Load scripts in order with proper error handling
            for (const scriptSrc of scriptsToLoad) {
                await loadScript(scriptSrc);
            }

            console.log('✅ All scripts loaded successfully');

        } catch (error) {
            showErrorUI(error, 'Application Initialization Error');
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
