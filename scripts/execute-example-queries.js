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

if (!process.env.PRIVATE_KEY) throw new Error("ENVIROMENT VAR PRIVATE_KEY UNDEFINED")
if (!process.env.ADMIN_ETH_ADDRESS) throw new Error("ENVIROMENT VAR ADMIN_ETH_ADDRESS UNDEFINED")

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

const CREATE_ETH_ACCOUNT = `
  mutation CreateEthAccount($input: CreateEthAccountInput!) {
    createEthAccount(input: $input) {
        document {
        id
        address
        ensName
      }
    }
  }
`
const CREATE_WEBSITE = `
  mutation CreateWebsite($input: CreateWebsiteInput!) {
      createWebsite(input: $input) {
				document {
					id
					websiteName
          ownerID
          owner {
            address
          }
				}
    }
  }
`
const CREATE_ADMIN = `
  mutation CreateAdmin($input: CreateAdminInput!) {
    createAdmin(input: $input) {
      document {
        id
        adminID
        websiteID
      }
    }
  }
`
const CREATE_PIECE = `
  mutation CreatePiece($input: CreatePieceInput!) {
		createPiece(input: $input) {
			document {
        id
        cid
        name
        ownerID
        owner {
          address
          ensName
        }
        websiteID
        approved
        rejected
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
const { data: testWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, {
  input: {
    content: {
      websiteName: "Test Website",
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: musicWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, {
  input: {
    content: {
      websiteName: "Music Website",
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: moviesWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, {
  input: {
    content: {
      websiteName: "Movies Website",
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: gamesWebsiteData } = await compose.executeQuery(CREATE_WEBSITE, {
  input: {
    content: {
      websiteName: "Games Website",
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

const testWebsite = testWebsiteData.createWebsite.document
const musicWebsite = musicWebsiteData.createWebsite.document
const moviesWebsite = moviesWebsiteData.createWebsite.document
const gamesWebsite = gamesWebsiteData.createWebsite.document

// Create users eth accounts

const { data: admintEthAccountData } = await compose.executeQuery(CREATE_ETH_ACCOUNT, {
  input: {
    content: {
      address: process.env.ADMIN_ETH_ADDRESS,
      websiteID: testWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: testUser1EthAccountData } = await compose.executeQuery(CREATE_ETH_ACCOUNT, {
  input: {
    content: {
      address: "0x5e164849Ed48E8e1B592C2d332D069753A14b572",
      websiteID: testWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: testUser2EthAccountData } = await compose.executeQuery(CREATE_ETH_ACCOUNT, {
  input: {
    content: {
      address: "0xBe0789733CbaDd3F91e7cf6630d6F3d7acDAC10a",
      websiteID: musicWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})
const { data: testUser3EthAccountData } = await compose.executeQuery(CREATE_ETH_ACCOUNT, {
  input: {
    content: {
      address: "0xD0825C04a6FADf8Fba6e01E8bC5fdbe994a3f5a4",
      websiteID: moviesWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

const adminEthAccount = admintEthAccountData.createEthAccount.document
const testUser1EthAccount = testUser1EthAccountData.createEthAccount.document
const testUser2EthAccount = testUser2EthAccountData.createEthAccount.document
const testUser3EthAccount = testUser3EthAccountData.createEthAccount.document


// Create admin for Test Website
await compose.executeQuery(CREATE_ADMIN, {
  input: {
    content: {
      adminID: adminEthAccount.id,
      websiteID: adminEthAccount.websiteID,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

// Create pieces

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser1EthAccount.id,
      websiteID: testUser1EthAccount.websiteID,
      name: "Aguile",
      cid: "bafkreifwanxptzn7jct56yl7q3h633ymn7bb2bjut6sxyulnas3skyg47e",
      approved: true,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser1EthAccount.id,
      websiteID: testUser1EthAccount.websiteID,
      name: "ryan cat meme",
      cid: "bafkreiaakxh74mhjx2bflfv34rcpo27ynqbny3pg5nzrg6wjkw7qti2bmq",
      approved: false,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser2EthAccount.id,
      websiteID: testUser2EthAccount.websiteID,
      name: "The Dark Side Of The Moon - Pink Floyd",
      cid: "bafkreidybluf5b6o4mb345lnpgrpa5g3e2ztbndou4lj7y3crts4yqy53u",
      approved: false,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser2EthAccount.id,
      websiteID: testUser2EthAccount.websiteID,
      name: "The King Of Limbs - Radiohead",
      cid: "bafkreibgighuh2i2ndn4vk4iustoveexry2nshjekgnebhfxvgkptu4yw4",
      approved: true,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser3EthAccount.id,
      websiteID: testUser3EthAccount.websiteID,
      name: "Avatar (2009)",
      cid: "bafkreiff5rexqbzrcr4dmwh5vkbhpidkuauxwlqjvs4d4f3h62tplqqefu",
      approved: true,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_PIECE, {
  input: {
    content: {
      ownerID: testUser3EthAccount.id,
      websiteID: testUser3EthAccount.websiteID,
      name: "The Terminator (1984)",
      cid: "bafkreie5vk3pum2xseuvfzszjalzn54vxprhq4ftkvdpirllf4zvyc7uza",
      approved: false,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

// Create subscriptions

await compose.executeQuery(CREATE_SUBSCRIPTION, {
  input: {
    content: {
      websiteID: testWebsite.id,
      subscribedID: musicWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})

await compose.executeQuery(CREATE_SUBSCRIPTION, {
  input: {
    content: {
      websiteID: testWebsite.id,
      subscribedID: moviesWebsite.id,
      metadata: {
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      }
    }
  }
})


console.log(`${testWebsite.websiteName} ID: ${testWebsite.id}`)

