const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Store for download tokens (in production, use a database)
const downloadTokens = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate secure download token
function generateDownloadToken(customerEmail, orderId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    downloadTokens.set(token, {
        email: customerEmail,
        orderId: orderId,
        expiry: expiry,
        downloads: 0,
        maxDownloads: 5
    });
    
    return token;
}

// Send e-book delivery email
async function sendEbookEmail(customerEmail, customerName, downloadToken, orderId) {
    const downloadUrl = `${process.env.BASE_URL}/download/${downloadToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'Your RecipeRush E-Book is Ready! 📚',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 2rem;">🎉 Thank You for Your Purchase!</h1>
                    <p style="margin: 1rem 0 0 0; font-size: 1.1rem;">Your Complete Recipe Collection is ready for download</p>
                </div>
                
                <div style="padding: 2rem; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #2c3e50; margin-bottom: 1rem;">Hello ${customerName}!</h2>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 1.5rem;">
                        Thank you for purchasing <strong>The Complete Recipe Collection</strong> from RecipeRush! 
                        Your e-book is now ready for download.
                    </p>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e9ecef; margin: 1.5rem 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">📖 What You'll Get:</h3>
                        <ul style="color: #555; line-height: 1.6;">
                            <li>100+ exclusive recipes from world-class chefs</li>
                            <li>Step-by-step cooking instructions</li>
                            <li>Professional food photography</li>
                            <li>Nutritional information and tips</li>
                            <li>Chef techniques and substitutions</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 2rem 0;">
                        <a href="${downloadUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            📥 Download Your E-Book
                        </a>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
                        <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                            <strong>Important:</strong> This download link expires in 7 days and can be used up to 5 times. 
                            Please save your e-book to your device for future access.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9rem; margin-top: 2rem;">
                        <strong>Order ID:</strong> ${orderId}<br>
                        <strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}<br>
                        <strong>Download Link:</strong> <a href="${downloadUrl}" style="color: #667eea;">${downloadUrl}</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 2rem 0;">
                    
                    <p style="color: #666; font-size: 0.9rem; text-align: center;">
                        If you have any questions, please contact us at 
                        <a href="mailto:reciperush01@gmail.com" style="color: #667eea;">reciperush01@gmail.com</a>
                    </p>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`E-book delivery email sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending e-book email:', error);
        return false;
    }
}

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, customerEmail, customerName, total } = req.body;
        
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: item.name,
                        description: 'Digital Recipe Collection',
                        images: [item.image],
                    },
                    unit_amount: Math.round(item.price * 100), // Convert to pence
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
            customer_email: customerEmail,
            metadata: {
                customerName: customerName,
                customerEmail: customerEmail,
            },
        });
        
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Stripe webhook endpoint
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Extract customer information
        const customerEmail = session.customer_details.email;
        const customerName = session.customer_details.name;
        const orderId = session.id;
        
        // Generate download token
        const downloadToken = generateDownloadToken(customerEmail, orderId);
        
        // Send e-book delivery email
        const emailSent = await sendEbookEmail(customerEmail, customerName, downloadToken, orderId);
        
        if (emailSent) {
            console.log(`Order ${orderId} completed successfully. E-book sent to ${customerEmail}`);
        } else {
            console.error(`Failed to send e-book for order ${orderId}`);
        }
    }
    
    res.json({ received: true });
});

// Download endpoint
app.get('/download/:token', (req, res) => {
    const token = req.params.token;
    const tokenData = downloadTokens.get(token);
    
    if (!tokenData) {
        return res.status(404).send('Download link not found or expired.');
    }
    
    if (Date.now() > tokenData.expiry) {
        downloadTokens.delete(token);
        return res.status(410).send('Download link has expired.');
    }
    
    if (tokenData.downloads >= tokenData.maxDownloads) {
        return res.status(429).send('Maximum download limit reached.');
    }
    
    // Increment download count
    tokenData.downloads++;
    downloadTokens.set(token, tokenData);
    
    // Serve the e-book file
    const ebookPath = path.join(__dirname, 'ebooks', 'complete-recipe-collection.pdf');
    res.download(ebookPath, 'RecipeRush-Complete-Recipe-Collection.pdf', (err) => {
        if (err) {
            console.error('Error downloading e-book:', err);
            res.status(500).send('Error downloading e-book.');
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'RecipeRush E-Book Delivery'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RecipeRush server running on port ${PORT}`);
    console.log(`📚 E-book delivery system ready`);
    console.log(`💳 Stripe webhooks enabled`);
    console.log(`📧 Email delivery configured`);
});

module.exports = app;
