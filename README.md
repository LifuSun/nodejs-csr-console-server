# Node.js CSR Console Server

This project is a Node.js console server that handles API requests for payment processing. It includes scripts to create and clear the database, and logs activities to a specified log file.

## Prerequisites

- Node.js
- MySQL or MariaDB

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd nodejs-csr-console-server
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory with the following content:
    ```properties
    # Database configuration
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=nodejs_csr_console_server
    DB_PASSWORD="9yp0Ws85sv4!Q$"
    DB_NAME=nodejs_csr_console_server

    # Server configuration
    PORT=3001
    LOG_PATH=payment_errors.log

    # Delay in milliseconds between each API call
    APICallDelay=10000
    ```

4. Create the database and tables:
    ```sh
    node create_database.js
    ```

5. Clear the database tables (if needed):
    ```sh
    node clear_database.js
    ```

## Running the Server

Start the server:
```sh
node index.js
```

The server will run at `http://localhost:3001/`.

## API Endpoints

### PUT /api/rest/version/81/merchant/:merchantId/order/:orderId/transaction/:transactionId

Processes a payment transaction.

#### Request Body
```json
{
    "apiOperation": "PAY",
    "order": {
        "amount": 15.00,
        "currency": "NZD"
    },
    "sourceOfFunds": {
        "type": "CARD",
        "provided": {
            "card": {
                "number": "5123450000000008",
                "securityCode": "001",
                "expiry": {
                    "month": "01",
                    "year": "39"
                }
            }
        }
    }
}
```

#### Responses

- **Successful Payment Response:**
    ```json
    {
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
    }
    ```

- **Failed Payment Response (invalid card details):**
    ```json
    {
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
    }
    ```

## Logging

All activities are logged to the console and to the specified log file (`payment_errors.log`).

## Scripts

### create_database.js

Creates the database and tables.

### clear_database.js

Clears the database tables and resets the primary keys.

## SQL Scripts

### scripts/create_database.sql

Creates the database and tables.

### scripts/clear_database.sql

Clears the database tables and resets the primary keys.

### scripts/init_database.sql

Initializes the database.

### scripts/use_database.sql

Selects the database for use.

## License

This project is licensed under the MIT License.