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
        contentID
        subscriptionsID
      }
    }
  }
`
const CREATE_CONTENT = `
  mutation CreateContent($input: CreateContentInput!) {
      createContent(input: $input) {
        document {
        id
        websiteID
        content {
          name
          cid
        }
      }
    }
  }
`
const CREATE_SUBSCRIPTIONS = `
  mutation CreateSubscriptions($input: CreateSubscriptionsInput!) {
      createSubscriptions(input: $input) {
        document {
        id
        websiteID
        subscribedIDs
      }
    }
  }
`
const UPDATE_WEBSITE = `
  mutation UpdateWebsite($input: UpdateWebsiteInput!) {
    updateWebsite(input: $input) {
      document {
        id
        websiteName
        contentID
        subscriptionsID
      }
    }
  }
`
console.log("Executing queries...")
// Create websites
const { data: testWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: {  websiteName: "Test Website"  }}})
const { data: musicWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: { websiteName: "Music Website" }}})
const { data: moviesWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, { input: { content: { websiteName: "Movies Website" }}})

const testWebsite = testWebsiteData.createWebsite.document
const musicWebsite = musicWebsiteData.createWebsite.document
const moviesWebsite = moviesWebsiteData.createWebsite.document

// Create contents

const { data: testWebsiteContentData } = await compose.executeQuery(CREATE_CONTENT, { 
  input: { 
    content: { 
      websiteID: testWebsite.id,
      content: [
        { name: "aguila", cid: "bafkreifwanxptzn7jct56yl7q3h633ymn7bb2bjut6sxyulnas3skyg47e"},
        { name: "1inch logo", cid: "bafkreie5oy362ozvorrmynw5ej42kzvnd6bsnyt5aoofcw4mo4likcgymu"}
      ]
    } 
  } 
})
const { data: musicWebsiteContentData } = await compose.executeQuery(CREATE_CONTENT, {
  input: {
    content: {
      websiteID: musicWebsite.id,
      content: [
        { name: "In Rainbows - Radiohead", cid: "bafybeiast2bhqqkcku2hvvrgo7t4bro7poucouszoq7oludpug2fixkrnm" },
        { name: "The Dark Side Of The Moon - Pink Floyd", cid: "bafkreidybluf5b6o4mb345lnpgrpa5g3e2ztbndou4lj7y3crts4yqy53u" }
      ]
    }
  }
})
const { data: moviesWebsiteContentData } = await compose.executeQuery(CREATE_CONTENT, {
  input: {
    content: {
      websiteID: moviesWebsite.id,
      content: [
        { name: "Avatar (2009)", cid: "bafkreiff5rexqbzrcr4dmwh5vkbhpidkuauxwlqjvs4d4f3h62tplqqefu" },
        { name: "The Terminator (1984)", cid: "bafkreie5vk3pum2xseuvfzszjalzn54vxprhq4ftkvdpirllf4zvyc7uza" }
      ]
    }
  }
})

const testWebsiteContent = testWebsiteContentData.createContent.document
const musicWebsiteContent = musicWebsiteContentData.createContent.document
const moviesWebsiteContent = moviesWebsiteContentData.createContent.document

// Create subscriptions

const { data: testWebsiteSubscriptionsData } = await compose.executeQuery(CREATE_SUBSCRIPTIONS, {
  input: {
    content: {
      websiteID: testWebsite.id,
      subscribedIDs: [musicWebsite.id, moviesWebsite.id]
    }
  }
})

//Update websites

await compose.executeQuery(UPDATE_WEBSITE, {
  input: {
    id: testWebsite.id,
    content: {
      contentID: testWebsiteContent.id,
      subscriptionsID: testWebsiteSubscriptionsData.createSubscriptions.document.id
    }
  }
})

await compose.executeQuery(UPDATE_WEBSITE, {
  input: {
    id: musicWebsite.id,
    content: {
      contentID: musicWebsiteContent.id
    }
  }
})

await compose.executeQuery(UPDATE_WEBSITE, {
  input: {
    id: moviesWebsite.id,
    content: {
      contentID: moviesWebsiteContent.id,
    }
  }
})

console.log(`${testWebsite.websiteName} ID: ${testWebsite.id}`)