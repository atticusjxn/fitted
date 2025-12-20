import { FastifyInstance } from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function embeddedAppRoutes(app: FastifyInstance) {
  // Serve the embedded merchant dashboard at the root
  app.get('/', async (_request, reply) => {
    try {
      // For now, redirect to the merchant dashboard hosted on tryfitted.com
      // In production, you'd serve the HTML file directly
      return reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fitted - Merchant Dashboard</title>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
        }
        .welcome {
            background: #f4f6f8;
            padding: 24px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #5c6ac4;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Fitted</h1>
        <div class="welcome">
            <h2>Your installation booking app is ready!</h2>
            <p>Connect your customers with professional installers at checkout.</p>
            <p><strong>Next steps:</strong></p>
            <ul>
                <li>Configure which products require installation</li>
                <li>Add installers to your network</li>
                <li>Test the checkout experience</li>
            </ul>
            <a href="https://tryfitted.com/merchant/dashboard" class="button" target="_blank">
                Open Full Dashboard
            </a>
        </div>
    </div>

    <script>
        // Initialize Shopify App Bridge
        var AppBridge = window['app-bridge'];
        var merchantData = null;

        if (AppBridge) {
            var createApp = AppBridge.default;
            var app = createApp({
                apiKey: '55cff46b87909fddd4280d1a41253bbd',
                host: new URLSearchParams(window.location.search).get('host')
            });
            console.log('Shopify App Bridge initialized', app);

            // Get session token and verify with backend
            var utils = AppBridge.actions;
            if (utils && utils.getSessionToken) {
                utils.getSessionToken(app).then(function(token) {
                    console.log('Session token retrieved');
                    window.sessionToken = token;

                    // Verify session and get/create merchant
                    return fetch('/api/merchants/session', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        }
                    });
                }).then(function(response) {
                    if (!response.ok) {
                        throw new Error('Session verification failed');
                    }
                    return response.json();
                }).then(function(data) {
                    console.log('Merchant session verified:', data);
                    merchantData = data.merchant;

                    // Store shop domain for future API calls
                    window.shopDomain = merchantData.shopDomain;

                    // Update UI with merchant data if needed
                    console.log('Shop domain:', merchantData.shopDomain);
                    console.log('Settings:', merchantData.settings);
                }).catch(function(err) {
                    console.error('Failed to verify session:', err);
                });
            }
        }
    </script>
</body>
</html>
      `);
    } catch (err) {
      app.log.error({ err }, 'Failed to serve embedded app');
      return reply.status(500).send('Failed to load app');
    }
  });
}
