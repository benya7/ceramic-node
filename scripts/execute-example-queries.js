import * as dotenv from 'dotenv'
dotenv.config()
import fs from "fs"
import { DID } from "dids"
import { fromString } from "uint8arrays"
import { getResolver } from "key-did-resolver"
import { CeramicClient } from '@ceramicnetwork/http-client'
import { ComposeClient } from '@composedb/client'
import { Ed25519Provider } from "key-did-provider-ed25519"
import { definition } from "../composites/definitions.js"

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

const compose = new ComposeClient({
  ceramic: ceramic,
  definition,
})

const CREATE_WEBSITE = `
  mutation CreateWebsite($input: CreateWebsiteInput!) {
      createWebsite(input: $input) {
				document {
					id
					websiteName
				}
    }
  }
`
const CREATE_PIECE = `
  mutation CreatePiece($input: CreatePieceInput!) {
		createPiece(input: $input) {
			document {
        websiteID
        id
        name
        approved
			}
    }
  }
`
const CREATE_SUBSCRIPTION = `
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
    document {
        id
        websiteID
        subscribedID
      }
    }
  }
`

console.log("Executing queries...")
// Create websites
const { data: testWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: {  websiteName: "Test Website"  }}})
const { data: musicWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: { websiteName: "Music Website" }}})
const { data: moviesWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: { websiteName: "Movies Website" }}})
const { data: dumpDocumentData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: { websiteName: "Dump Document" } } })


const testWebsite = testWebsiteData.createWebsite.document
const musicWebsite = musicWebsiteData.createWebsite.document
const moviesWebsite = moviesWebsiteData.createWebsite.document
const dumpDocument = dumpDocumentData.createWebsite.document


// Create pieces

await compose.executeQuery(CREATE_PIECE, { 
  input: { 
    content: { 
      websiteID: testWebsite.id,
      name: "Aguile",
      cid: "bafkreifwanxptzn7jct56yl7q3h633ymn7bb2bjut6sxyulnas3skyg47e",
      approved: true
    } 
  } 
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      websiteID: testWebsite.id,
      name: "ryan cat meme",
      cid: "bafkreiaakxh74mhjx2bflfv34rcpo27ynqbny3pg5nzrg6wjkw7qti2bmq",
      approved: false
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      websiteID: musicWebsite.id,
      name: "The Dark Side Of The Moon - Pink Floyd",
      cid: "bafkreidybluf5b6o4mb345lnpgrpa5g3e2ztbndou4lj7y3crts4yqy53u",
      approved: false
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      websiteID: musicWebsite.id,
      name: "The King Of Limbs - Radiohead",
      cid: "bafkreibgighuh2i2ndn4vk4iustoveexry2nshjekgnebhfxvgkptu4yw4",
      approved: true
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      websiteID: moviesWebsite.id,
      name: "Avatar (2009)",
      cid: "bafkreiff5rexqbzrcr4dmwh5vkbhpidkuauxwlqjvs4d4f3h62tplqqefu",
      approved: true
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      websiteID: moviesWebsite.id,
      name: "The Terminator (1984)",
      cid: "bafkreie5vk3pum2xseuvfzszjalzn54vxprhq4ftkvdpirllf4zvyc7uza",
      approved: false
    }
  }
})

// Create subscriptions

await compose.executeQuery(CREATE_SUBSCRIPTION, {
  input: {
    content: {
      websiteID: testWebsite.id,
      subscribedID: musicWebsite.id
    }
  }
})

await compose.executeQuery(CREATE_SUBSCRIPTION, {
  input: {
    content: {
      websiteID: testWebsite.id,
      subscribedID: moviesWebsite.id
    }
  }
})


console.log(`${testWebsite.websiteName} ID: ${testWebsite.id}`)
console.log(`${dumpDocument.websiteName} ID: ${dumpDocument.id}`)

