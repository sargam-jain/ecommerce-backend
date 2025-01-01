const express = require('express');
    const PayPal = require('paypal-rest-sdk');

    const app = express();
    app.use(express.json());

    // Configure PayPal environment
    const clientId = 'YOUR_CLIENT_ID';
    const clientSecret = 'YOUR_CLIENT_SECRET';
    const environment = new PayPal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new PayPal.core.PayPalHttpClient(environment);

    app.post('/create-order', async (req, res) => {
        const items = req.body.items.map(item => ({
            name: item.product,
            unit_amount: {
                currency_code: 'USD',
                value: item.price.toFixed(2),
            },
            quantity: '1',
        }));

        const order = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: items.reduce((sum, item) => sum + parseFloat(item.unit_amount.value), 0).toFixed(2),
                    breakdown: { item_total: { currency_code: 'USD', value: items.reduce((sum, item) => sum + parseFloat(item.unit_amount.value), 0).toFixed(2) } },
                },
                items,
            }],
        };

        const request = new PayPal.orders.OrdersCreateRequest();
        request.requestBody(order);

        try {
            const orderResult = await client.execute(request);
            const approvalUrl = orderResult.result.links.find(link => link.rel === 'approve').href;
            res.json({ approvalUrl });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(3000, () => console.log('Server is running on http://localhost:3000'));