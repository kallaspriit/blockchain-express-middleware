# Blockchain.info receive payments API express middleware

[![Travis](https://img.shields.io/travis/kallaspriit/blockchain-express-middleware.svg)](https://travis-ci.org/kallaspriit/blockchain-express-middleware)
[![Coverage](https://img.shields.io/coveralls/kallaspriit/blockchain-express-middleware.svg)](https://coveralls.io/github/kallaspriit/blockchain-express-middleware)
[![Downloads](https://img.shields.io/npm/dm/blockchain-express-middleware.svg)](http://npm-stat.com/charts.html?package=blockchain-express-middleware&from=2015-08-01)
[![Version](https://img.shields.io/npm/v/blockchain-express-middleware.svg)](http://npm.im/blockchain-express-middleware)
[![License](https://img.shields.io/npm/l/blockchain-express-middleware.svg)](http://opensource.org/licenses/MIT)

**Express middleware for receiving bitcoin payments using blockchain.info payments receiving API without any fees.**

- Generates unique payment addresses for each transaction using [HD wallet](https://medium.com/vault0x/hierarchically-deterministic-wallets-the-concepts-3aa487e71235).
- Displays payment request QR code with custom message.
- Provides payment state.
- Keeps track of state transitions.
- Supports multiple transactions to a single address.
- Supports underpayment and overpayment (amount state).
- Provides a working example express server application.
- Requires Blockchain.info receive API key and extended public key (xPub).
- Written in TypeScript, no need for extra typings.

![Example application](https://raw.githubusercontent.com/kallaspriit/blockchain-express-middleware/master/example/screenshot.jpg)

## Installation

This package is distributed via npm

```cmd
npm install blockchain-express-middleware
```

## Configuration

The example application requires API key (see [this](https://api.blockchain.info/customer/signup)) and extended public key to work.

To set these, create a ".env" file in the project root directory with contents like:

```
SERVER_PORT=3000
SERVER_USE_SSL=false
SERVER_CERT=fullchain.pem
SERVER_KEY=privkey.pem

API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
XPUB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

APP_SECRET=XWzk3tMcPw8JTGfjZzDHdPKguAhh2Adw
APP_REQUIRED_CONFIRMATIONS=4
```

## Commands

- `yarn start` to start the example application.
- `yarn build` to build the production version.
- `yarn test` to run tests.
- `yarn coverage` to gather code coverage.
- `yarn lint` to lint the codebase.
- `yarn prettier` to run prettier.