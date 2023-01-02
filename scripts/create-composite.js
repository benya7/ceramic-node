import * as dotenv from 'dotenv'
dotenv.config()
import fs from "fs"
import { DID } from "dids"
import { fromString } from "uint8arrays"
import { getResolver } from "key-did-resolver"
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Ed25519Provider } from "key-did-provider-ed25519"
import { createComposite, writeEncodedCompositeRuntime } from '@composedb/devtools-node'
import { writeEncodedComposite } from '@composedb/devtools-node'
import { writeGraphQLSchema } from '@composedb/devtools-node'

// Create DID controller for ceramic client
const privateKey = fromString(
  process.env.PRIVATE_KEY,
  'base16'
)
const did = new DID({
  resolver: getResolver(),
  provider: new Ed25519Provider(privateKey),
})

await did.authenticate()
const ceramic = new CeramicClient('http://localhost:7007')
ceramic.did = did

console.log("Create composites from schemas...")
// Create Website composite from graphql schema
const websiteComposite = await createComposite(ceramic, './schemas/Website.graphql')
// Get model stream ID required to create others composites
const websiteModelID = websiteComposite.modelIDs[0]
// Create Content graphql schema
fs.writeFile('./schemas/Content.graphql', `type Website @loadModel(id: ${websiteModelID}) {
  id: ID!
}

type Content @createModel(accountRelation: LIST, description: "Content for a website") {
  websiteID: StreamID! @documentReference(model: "Website")
  website: Website! @relationDocument(property: "websiteID")
  content: [Piece]! @list(maxLength: 10000)
}

type Piece {
  name: String! @string(maxLength: 100)
  cid: String! @string(maxLength: 100)
}`, function (err) {
  if (err) return console.log(err);
  console.log('Content Model created!');
})

// Create Subscriptions graphql schema
fs.writeFile('./schemas/Subscriptions.graphql', `type Website @loadModel(id: ${websiteModelID}) {
  id: ID!
}

type Subscriptions @createModel(accountRelation: LIST, description: "Subscription IDs for a website") {
  websiteID: StreamID! @documentReference(model: "Website")
  website: Website! @relationDocument(property: "websiteID")
  subscribedIDs: [ID]! @list(maxLength: 100)
}`, function (err) {
  if (err) return console.log(err);
  console.log('Subscriptions Model created!');
})

// Create Content composite from graphql schema
const contentComposite = await createComposite(ceramic, './schemas/Content.graphql')
// Create Subscriptions composite from graphql schema
const subscriptionsComposite = await createComposite(ceramic, './schemas/Subscriptions.graphql')
// Merge all composites
const mergedComposite = websiteComposite.merge([contentComposite, subscriptionsComposite])

// Index the models into ceramic node
console.log("Indexing models...")
await mergedComposite.startIndexingOn(ceramic)

console.log("Writing config files...")
// Write encoded composite json file, definitions and composite granephql schema
await writeEncodedComposite(mergedComposite, './composites/merged-composite.json')
await writeEncodedCompositeRuntime(
  ceramic, 
  './composites/merged-composite.json', 
  './composites/definitions.ts'
)
await writeEncodedCompositeRuntime(
  ceramic,
  './composites/merged-composite.json',
  './composites/definitions.js'
)
await writeGraphQLSchema(mergedComposite.toRuntime(), './composites/Composite.graphql')
