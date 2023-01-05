import * as dotenv from 'dotenv'
dotenv.config()
import fs from "fs"
import { DID } from "dids"
import { fromString } from "uint8arrays"
import { getResolver } from "key-did-resolver"
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Ed25519Provider } from "key-did-provider-ed25519"
import { createComposite, writeEncodedCompositeRuntime, writeEncodedComposite, writeGraphQLSchema } from '@composedb/devtools-node'

if (!process.env.PRIVATE_KEY) throw new Error("ENVIROMENT VARIABLE PRIVATE KEY UNDEFINED")

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

// Create Website graphql schema
fs.writeFile('./schemas/Website.graphql', `type Website @createModel(accountRelation: LIST, description: "A Website") {
  websiteName: String! @string(maxLength: 50)
  description: String @string(maxLength: 150)
  image: String @string(maxLength: 100)
  metadata: Metadata!
}

type Metadata {
  createdAt: String! @string(maxLength: 100)
  updatedAt: String! @string(maxLength: 100)
}
`, function (err) {
  if (err) return console.log(err);
  console.log('Website schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))

// Create Website composite from graphql schema
const websiteComposite = await createComposite(ceramic, './schemas/Website.graphql')
// Get model stream ID required to create others composites
const websiteModelID = websiteComposite.modelIDs[0]

// Create EthAccount graphql schema
fs.writeFile('./schemas/EthAccount.graphql', `type Website @loadModel(id: "${websiteModelID}") {
  id: ID!
}

type EthAccount @createModel(accountRelation: LIST, description: "An Ethereum Account") {
  address: String! @string(maxLength: 66)
  ensName: String @string(maxLength: 100)
  websiteID: StreamID! @documentReference(model: "Website")
  metadata: Metadata!
}

type Metadata {
  createdAt: String! @string(maxLength: 100)
  updatedAt: String! @string(maxLength: 100)
}
`, function (err) {
  if (err) return console.log(err);
  console.log('EthAccount schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))

// Create EthAccount composite from graphql schema
const ethAccountComposite = await createComposite(ceramic, './schemas/EthAccount.graphql')
// Get model stream ID required to create others composites
const ethAccountModelID = ethAccountComposite.modelIDs[1]

// Create Piece graphql schema
fs.writeFile('./schemas/Piece.graphql', `type Website @loadModel(id: "${websiteModelID}") {
  id: ID!
}

type EthAccount @loadModel(id: "${ethAccountModelID}") {
  id: ID!
}

type Piece @createModel(accountRelation: LIST, description: "Piece of content") {
  websiteID: StreamID! @documentReference(model: "Website")
  website: Website @relationDocument(property: "websiteID")
  ownerID: StreamID! @documentReference(model: "EthAccount")
  owner: EthAccount @relationDocument(property: "ownerID")
  name: String @string(maxLength: 100)
  cid: String @string(maxLength: 100)
  approved: Boolean
  rejected: Boolean
  metadata: Metadata!
}

type Metadata {
  createdAt: String! @string(maxLength: 100)
  updatedAt: String! @string(maxLength: 100)
}
`, function (err) {
  if (err) return console.log(err);
  console.log('Piece schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))
// Create Piece composite from graphql schema
const pieceComposite = await createComposite(ceramic, './schemas/Piece.graphql')
const pieceModelID = pieceComposite.modelIDs[2]

fs.writeFile('./schemas/Admin.graphql', `type Website @loadModel(id: "${websiteModelID}") {
  id: ID!
}

type EthAccount @loadModel(id: "${ethAccountModelID}") {
  id: ID!
}

type Admin @createModel(accountRelation: LIST, description: "Admin Website") {
  websiteID: StreamID! @documentReference(model: "Website")
  website: Website! @relationDocument(property: "websiteID")
	adminID: StreamID! @documentReference(model: "EthAccount")
	admin: EthAccount! @relationDocument(property: "adminID")
  metadata: Metadata!
}

type Metadata {
  createdAt: String! @string(maxLength:100)
  updatedAt: String! @string(maxLength:100)
}
`, function (err) {
  if (err) return console.log(err);
  console.log('Admin schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))
// Create Subscription composite from graphql schema
const adminComposite = await createComposite(ceramic, './schemas/Admin.graphql')
const adminCompositeModelID = adminComposite.modelIDs[2]


fs.writeFile('./schemas/Subscription.graphql', `type Website @loadModel(id: "${websiteModelID}") {
  id: ID!
}

type Subscription @createModel(accountRelation: LIST, description: "Subcription Website") {
  websiteID: StreamID! @documentReference(model: "Website")
  website: Website! @relationDocument(property: "websiteID")
	subscribedID: StreamID! @documentReference(model: "Website")
	subcribedWebsite: Website! @relationDocument(property: "subscribedID")
  metadata: Metadata!
}

type Metadata {
  createdAt: String! @string(maxLength:100)
  updatedAt: String! @string(maxLength:100)
}
`, function (err) {
  if (err) return console.log(err);
  console.log('Subscription schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))
// Create Subscription composite from graphql schema
const subscriptionComposite = await createComposite(ceramic, './schemas/Subscription.graphql')
const subscriptionModelID = subscriptionComposite.modelIDs[1]

// Create FinalModel graphql schema
fs.writeFile('./schemas/FinalModel.graphql', `type Piece @loadModel(id: "${pieceModelID}") {
  id: ID!
}

type Subscription @loadModel(id: "${subscriptionModelID}") {
  id: ID!
}

type Admin @loadModel(id: "${adminCompositeModelID}") {
  id: ID!
}

type EthAccount @loadModel(id: "${ethAccountModelID}") {
  pieces: [Piece] @relationFrom(model: "Piece", property: "ownerID")
  piecesCount: Int! @relationCountFrom(model: "Piece", property: "ownerID")
  managedWebsites: [Admin] @relationFrom(model: "Admin", property: "adminID")
  managedWebsitesCount: Int! @relationCountFrom(model: "Admin", property: "adminID")
}

type Website @loadModel(id: "${websiteModelID}") {
  pieces: [Piece] @relationFrom(model: "Piece", property: "websiteID")
  piecesCount: Int! @relationCountFrom(model: "Piece", property: "websiteID")
  subscriptions: [Subscription] @relationFrom(model: "Subscription", property: "websiteID")
  subscriptionsCount: Int! @relationCountFrom(model: "Subscription", property: "websiteID")
  admins: [Admin] @relationFrom(model: "Admin", property: "websiteID")
  adminsCount: Int! @relationCountFrom(model: "Admin", property: "websiteID")
  users: [EthAccount] @relationFrom(model: "EthAccount", property: "websiteID")
  usersCount: Int! @relationCountFrom(model: "EthAccount", property: "websiteID")
}
`, function (err) {
  if (err) return console.log(err);
  console.log('FinalModel schema created!');
})

await new Promise((resolve) => setTimeout(() => resolve(), 2000))
// Create FinalModel composite from graphql schema. Merge all composites
const mergedComposite = await createComposite(ceramic, './schemas/FinalModel.graphql')

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
