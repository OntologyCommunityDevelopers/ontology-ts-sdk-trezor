
# Trezor extension for Ontology blockchain TypeScript SDK

## Overview

This is an extension of Ontology TypeScript SDK adding the support for managing private keys on Trezor Hardware wallet.

## Installation

### Required Tools and Dependencies

* Node
* Yarn (https://yarnpkg.com/lang/en/docs/install/)

### Developing and Running

Execute these commands in the project's root directory:

Setup:

#### Install yarn
For faster building process and development experience install Yarn

```
npm install --global yarn
```

#### Download
```
git clone 'https://github.com/OntologyCommunityDevelopers/ontology-ts-sdk-trezor.git'
```

#### Development build
This will build the extension with minimum polyfilling for better debug experience.

````
yarn build:dev
````

#### Production build

````
yarn build:prod
````

#### Trezor support
Trezor allows communication with the Trezor Bridge v2 only from https://*.trezor.io page and Node environment, therefore it is not usable from web pages. But it is usable from Web extensions using WebRequest API.

To use your Trezor, you also needs custom firmware located at https://github.com/backslash47/trezor-core . Ontology support is is not yet in official firmware. 

## Built With

* [TypeScript](https://www.typescriptlang.org/) - Used language
* [Node.js](https://nodejs.org) - JavaScript runtime for building and ingest
* [Ontology TypeScript SDK](https://github.com/ontio/ontology-ts-sdk) - The framework used

## Authors

* **Matus Zamborsky** - *Initial work* - [Backslash47](https://github.com/backslash47)

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

Many thanks to the whole Ontology team, who done a great job bringing Ontology to life.
