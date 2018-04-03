# Blockchain.info receive payments API express middleware

[![Travis](https://img.shields.io/travis/kallaspriit/blockchain-express-middleware.svg)](https://travis-ci.org/kallaspriit/blockchain-express-middleware)
[![Coverage](https://img.shields.io/coveralls/kallaspriit/blockchain-express-middleware.svg)](https://coveralls.io/github/kallaspriit/blockchain-express-middleware)
[![Downloads](https://img.shields.io/npm/dm/blockchain-express-middleware.svg)](http://npm-stat.com/charts.html?package=blockchain-express-middleware&from=2015-08-01)
[![Version](https://img.shields.io/npm/v/blockchain-express-middleware.svg)](http://npm.im/blockchain-express-middleware)
[![License](https://img.shields.io/npm/l/blockchain-express-middleware.svg)](http://opensource.org/licenses/MIT)

**Express middleware for receiving bitcoin payments using blockchain.info payments receiving API.**

- Requires API key and extended public key (xPub).
- Generates unique payment addresses for each transaction.
- Displays QR code for payment.
- Keeps track of payment progress.
- Written in TypeScript, no need for extra typings.

## Installation

This package is distributed via npm

```cmd
npm install blockchain-express-middleware
```

## Configuration

The example application requires API key (see [this](https://api.blockchain.info/customer/signup)) and extended public key to work.

To set these, create a ".env" file in the project root directory with contents like:

```
API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
XPUB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Commands

- `yarn start` to start the example application.
- `yarn build` to build the production version.
- `yarn test` to run tests.
- `yarn coverage` to gather code coverage.
- `yarn lint` to lint the codebase.
- `yarn prettier` to run prettier.