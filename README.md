[![Travis CI status](https://www.travis-ci.org/stellarchat/desktop-client.svg?branch=master)](https://travis-ci.org/stellarchat/desktop-client)

# Monoeci Wallet (A Desktop Client for Monoeci)

This application allows you to encrypt your secret key and store it as a file locally on your computer. You can use it on Windows, Linux and Mac.

## Key Features

- No registration. Secret key and login information stored locally.
- Offline transaction signing. Protect the secret key from exposure to the Internet.
- Send/receive/convert lumens, assets and tokens.
- Buy/sell lumens, assets and tokens.
- Merge account.
- Create your own tokens.
- View balances and history.
- Manage trust lines, account data, inflation destination.
- Federation protocol support.
- Contacts support.
- Deposit/withdraw CNY, BTC.
- Participate ICO

## Build yourself

You have to have 8.x.x Node.js installed (latest 8.11.3 recommended). For that you can use either [n](https://www.npmjs.com/package/n) or [nvm](https://github.com/creationix/nvm/blob/master/README.md).

Also, [yarn](https://yarnpkg.com/) is recommended over [npm](https://www.npmjs.com/) due it's strict lockfile and other features.

To build yourself, do the following

```sh
yarn install
yarn build
# Or only one package with "build:linux", "build:mac" or "build:win".
```


## Development

```sh
yarn install
yarn start
# ... do stuff ...
yarn lintfix
```

Monoeci Wallet uses [Electron](http://electronjs.org/) to create an application. Common shortcuts and tips:
- CTRL+SHIFT+I to open development console
- reload UI with CTRL+R to refresh front-end code
- restart `yarn start` process to refresh back-end code

## Ledger

If you have permission problems on Linux, this may help:
```sh
echo 'KERNEL=="hidraw*", SUBSYSTEM=="hidraw", MODE="0664", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/99-hidraw-permissions.rules
```

If you have more problems, make sure that:
1. Ledger is connected.
2. Ledger is unlocked.
3. Ledger has Monoeci app installed.
4. Ledger currently is in the Monoeci app.
5. Ledger Monoeci app settings has "browser support" set to "No".