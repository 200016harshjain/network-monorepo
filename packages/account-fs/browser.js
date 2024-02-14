import { createBrowserNode } from './agent/helia_node.js';
import { Account } from './agent/account.js'
import { Agent, BROWSER_RUNTIME, AccountCapability, StorageCapability, MessageCapability, Runtime } from './agent/agent.js'
import { SearchCapability } from './people/search.js'
import { Contact, ContactRepository } from "./people/contacts.js";

const connection = {
  //"LOCAL": {network: "LOCAL"},
  "DEVNET": {network: "DEVNET", sync_host: "http://localhost:3000", dial_prefix: "/ip4/127.0.0.1/tcp/3001/ws/p2p/"},
  "TESTNET": {network: "TESTNET", sync_host: "https://testnet.shovel.company:8001", dial_prefix: "/dns4/testnet.shovel.company/tcp/443/tls/ws/p2p/"}
}

async function programInit(network, appHandle) {
  //TODO check for network to be present in connection keys

  const helia = await createBrowserNode()

  const runtime = new Runtime(BROWSER_RUNTIME, {})
  const agent =  new Agent(helia, connection[network].sync_host, connection[network].dial_prefix, runtime, appHandle)
  Object.assign(Agent.prototype, AccountCapability);
  Object.assign(Agent.prototype, MessageCapability);
  Object.assign(Agent.prototype, StorageCapability);
  Object.assign(Agent.prototype, SearchCapability);
  await agent.bootstrap()
  await agent.load()

  return  {
    helia: helia,
    agent: agent
  }
}

export { Account, programInit, Contact, ContactRepository }