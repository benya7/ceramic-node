# ceramic-node

## Requeriements 

Install hotfix version ceramic/cli

```bash
yarn global add @ceramicnetwork/cli@hotfix
```
```bash
npm install -g @ceramicnetwork/cli@hotfix
```

## Usage

Install project packages.

```bash
yarn install
```

Generate DID private key

```bash
yarn run generate:private-key
```

Rename .env.example to .env and fill PRIVATE_KEY
```bash
PRIVATE_KEY=
```

Create DID key from private key
```bash
yarn run generate:did-key <PRIVATE_KEY>
```

Update node config file with DID key

> If you don't have a config file in your directory yet, simply start the node once via **ceramic daemon** and exit again. This will create a default config file:

```json
{
  "anchor": {},
  "http-api": {
    "cors-allowed-origins": [
      ".*"
    ],
    "admin-dids": [
      "did:key:<INSERT_DID_KEY_HERE>"
    ]
  },
  "ipfs": {
    "mode": "bundled"
  },
  "logger": {
    "log-level": 2,
    "log-to-files": false
  },
  "metrics": {
    "metrics-exporter-enabled": false
  },
  "network": {
    "name": "testnet-clay"
  },
  "node": {},
  "state-store": {
    "mode": "fs",
    "local-directory": "/home/user/.ceramic/statestore/"
  },
  "indexing": {
    "db": "sqlite:///home/user/.ceramic/indexing.sqlite",
    "allow-queries-before-historical-sync": true
  }
}
```

Run ceramic node.

```bash
yarn run ceramic-node
```

Generate graphql schemas and composites.

```bash
yarn run generate:composites
```

Fill ADMIN_ETH_ADDRESS on .env file to create an website admin. Must be a valid Ethereum Address
```bash
ADMIN_ETH_ADDRESS=
```

Execute graphql example queries.

```bash
yarn run graphql:example-queries
```
> This script show Test WebsiteID, must be pasted in **riff.cc-data-manager-poc/.env.local**


Copy required files in **riff.cc-data-manager-poc/lib**
```bash
composites/Composite.graphql
composites/definitions.ts
```
> Note: These files are required for run composedb client and execute graphql queries

Optionally you can run graphql server with Graphiql interface
```bash
yarn run graphql:server
```