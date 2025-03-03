const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const logFilePath = process.env.LOG_PATH;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const log = (message) => {
    console.log(message);
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
};

app.use(express.json());

app.put('/api/rest/version/81/merchant/:merchantId/order/:orderId/transaction/:transactionId', async (req, res) => {
    const { merchantId, orderId, transactionId } = req.params;
    const { apiOperation, order, sourceOfFunds } = req.body;
    const { card } = sourceOfFunds.provided;
    const { amount, currency } = order;
    const { number, securityCode, expiry } = card;
    const maskedCardNumber = number.replace(/(\d{6})\d{6}(\d{4})/, '$1******$2');
    let response;
    let gatewayCode;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Check if the merchant exists
        const [merchantRows] = await connection.query('SELECT id FROM merchants WHERE merchant_id = ?', [merchantId]);
        let merchantDbId;
        if (merchantRows.length === 0) {
            // Insert the merchant if it does not exist
            const [result] = await connection.query('INSERT INTO merchants (merchant_id, name) VALUES (?, ?)', [merchantId, merchantId]);
            merchantDbId = result.insertId;
            log(`Inserted new merchant with ID: ${merchantDbId}`);
        } else {
            merchantDbId = merchantRows[0].id;
            log(`Merchant ID ${merchantDbId} already exists.`);
        }

        // Determine the card brand and gateway code based on the card number and expiry date
        const currentDate = new Date();
        const expiryYear = expiry.year.length === 2 ? (parseInt(expiry.year, 10) < 50 ? `20${expiry.year}` : `19${expiry.year}`) : expiry.year;
        const expiryDate = new Date(`${expiryYear}-${expiry.month}-01`);
        let cardBrand;

        if (number.startsWith('2') || number.startsWith('5')) {
            cardBrand = 'MASTERCARD';
        } else if (number.startsWith('4')) {
            cardBrand = 'VISA';
        } else {
            gatewayCode = 'ERROR';
            response = {
                "response": {
                    "acquirerCode": "99",
                    "acquirerMessage": "Unknown card",
                    "gatewayCode": gatewayCode,
                    "gatewayRecommendation": "CONTACT_SUPPORT"
                },
                "result": "ERROR",
                "sourceOfFunds": {
                    "provided": {
                        "card": {
                            "brand": "UNKNOWN",
                            "expiry": {
                                "month": expiry.month,
                                "year": expiry.year
                            },
                            "fundingMethod": "UNKNOWN",
                            "number": number,
                            "scheme": "UNKNOWN",
                            "storedOnFile": "NOT_STORED"
                        }
                    },
                    "type": "CARD"
                }
            };
        }

        if (!gatewayCode) {
            // Adjust the expiry date to the end of the month for comparison
            const adjustedExpiryDate = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0);
            if (adjustedExpiryDate < currentDate) {
                gatewayCode = 'DECLINED';
                response = {
                    "response": {
                        "acquirerCode": "05",
                        "acquirerMessage": "Do not honour",
                        "gatewayCode": gatewayCode,
                        "gatewayRecommendation": "RESUBMIT_WITH_ALTERNATIVE_PAYMENT_DETAILS"
                    },
                    "result": "FAILURE",
                    "sourceOfFunds": {
                        "provided": {
                            "card": {
                                "brand": cardBrand,
                                "expiry": {
                                    "month": expiry.month,
                                    "year": expiry.year
                                },
                                "fundingMethod": "CREDIT",
                                "number": maskedCardNumber,
                                "scheme": cardBrand,
                                "storedOnFile": "NOT_STORED"
                            }
                        },
                        "type": "CARD"
                    }
                };
            } else {
                gatewayCode = 'APPROVED';
                response = {
                    "response": {
                        "acquirerCode": "00",
                        "acquirerMessage": "Approved",
                        "gatewayCode": gatewayCode,
                        "gatewayRecommendation": "NO_ACTION"
                    },
                    "result": "SUCCESS",
                    "sourceOfFunds": {
                        "provided": {
                            "card": {
                                "brand": cardBrand,
                                "expiry": {
                                    "month": expiry.month,
                                    "year": expiry.year
                                },
                                "fundingMethod": "CREDIT",
                                "number": maskedCardNumber,
                                "scheme": cardBrand,
                                "storedOnFile": "NOT_STORED"
                            }
                        },
                        "type": "CARD"
                    }
                };
            }
        }

        // Save the transaction details in the payments table
        await connection.query(
            `INSERT INTO payments (order_id, merchant_id, transaction_id, card_number, amount, currency, expiry_month, expiry_year, security_code, api_version, gateway_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, merchantDbId, transactionId, maskedCardNumber, amount, currency, expiry.month, expiry.year, securityCode, '81', gatewayCode]
        );
        log(`Saved transaction for order ID: ${orderId}`);

    } catch (err) {
        log(`Error processing transaction: ${err}`);
        response = {
            "response": {
                "acquirerCode": "99",
                "acquirerMessage": "Internal server error",
                "gatewayCode": "ERROR",
                "gatewayRecommendation": "CONTACT_SUPPORT"
            },
            "result": "ERROR"
        };
    } finally {
        if (connection) {
            await connection.end();
            log('Database connection closed.');
        }
    }

    res.json(response);
});

app.listen(port, () => {
    log(`Server running at http://localhost:${port}/`);
});