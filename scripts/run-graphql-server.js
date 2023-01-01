import * as dotenv from 'dotenv'
dotenv.config()
import { DID } from 'dids'
import { getResolver } from 'key-did-resolver';
import { fromString } from 'uint8arrays/from-string'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { serveEncodedDefinition } from '@composedb/devtools-node'

const privateKey = fromString(
  process.env.PRIVATE_KEY,
  'base16'
)
const did = new DID({
  resolver: getResolver(),
  provider: new Ed25519Provider(privateKey),
})
await did.authenticate()

const server = await serveEncodedDefinition({
  ceramicURL: 'http://localhost:7007',
  graphiql: true,
  path: new URL('../composites/merged-composite.json', import.meta.url),
  port: 5001,
})

console.log(`Server started on ${server.url}`)

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server stopped')
  })
})
