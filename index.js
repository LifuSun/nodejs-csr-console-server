const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const logFilePath = process.env.LOG_PATH;

const log = (message) => {
    console.log(message);
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
};

app.use(express.json());

app.put('/api/rest/version/81/merchant/:merchantId/order/:orderId/transaction/:transactionId', (req, res) => {
    const { card } = req.body.sourceOfFunds.provided;
    let response;

    if (card.number === '5123450000000008') {
        response = {
            "response": {
                "acquirerCode": "00",
                "acquirerMessage": "Approved",
                "gatewayCode": "APPROVED",
                "gatewayRecommendation": "NO_ACTION"
            },
            "result": "SUCCESS",
            "sourceOfFunds": {
                "provided": {
                    "card": {
                        "brand": "MASTERCARD",
                        "expiry": {
                            "month": "1",
                            "year": "39"
                        },
                        "fundingMethod": "CREDIT",
                        "number": "512345xxxxxx0008",
                        "scheme": "MASTERCARD",
                        "storedOnFile": "NOT_STORED"
                    }
                },
                "type": "CARD"
            }
        };
    } else if (card.number === '4508750015741019') {
        response = {
            "response": {
                "acquirerCode": "05",
                "acquirerMessage": "Do not honour",
                "gatewayCode": "DECLINED",
                "gatewayRecommendation": "RESUBMIT_WITH_ALTERNATIVE_PAYMENT_DETAILS"
            },
            "result": "FAILURE",
            "sourceOfFunds": {
                "provided": {
                    "card": {
                        "brand": "VISA",
                        "expiry": {
                            "month": "5",
                            "year": "39"
                        },
                        "fundingMethod": "CREDIT",
                        "number": "450875xxxxxx1019",
                        "scheme": "VISA",
                        "storedOnFile": "NOT_STORED"
                    }
                },
                "type": "CARD"
            }
        };
    } else {
        response = {
            "response": {
                "acquirerCode": "99",
                "acquirerMessage": "Unknown card",
                "gatewayCode": "ERROR",
                "gatewayRecommendation": "CONTACT_SUPPORT"
            },
            "result": "ERROR",
            "sourceOfFunds": {
                "provided": {
                    "card": {
                        "brand": "UNKNOWN",
                        "expiry": {
                            "month": card.expiry.month,
                            "year": card.expiry.year
                        },
                        "fundingMethod": "UNKNOWN",
                        "number": card.number,
                        "scheme": "UNKNOWN",
                        "storedOnFile": "NOT_STORED"
                    }
                },
                "type": "CARD"
            }
        };
    }

    log(`Processed transaction for card number: ${card.number}`);
    res.json(response);
});

app.listen(port, () => {
    log(`Server running at http://localhost:${port}/`);
});
