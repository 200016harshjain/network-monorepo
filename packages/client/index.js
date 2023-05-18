const DIDKit = require('@spruceid/didkit-wasm-node');
const axios = require('axios');

class Protocol {
  constructor(config) {
    this.axios_client  = axios.create({
      baseURL: "http://localhost:4000/"
    })
  }

  async generateDID(key) {
    var did = DIDKit.keyToDID('key', key);
    var doc = await DIDKit.resolveDID(did, "{}");

    return {did: did, doc: doc}
  }

  async registerUser(did, doc, profile) {
    await this.axios_client.post('/user', {did: did, doc: doc, profile: profile})
  }

  async registerApp(did, doc) {
    await this.axios_client.post('/app', {did: did, doc: doc})
  }

  async registerGraph(did, doc, app_did) {
    await this.axios_client.post('/graph', {did: did, doc: doc, app_did: app_did})
  }

  async readGraph(graph_did) {
    const response = await this.axios_client.get('/graph/' + graph_did)
      .then(function (response) {
        return response;
      })
      .catch(function (error) {
        console.log(error);
        return error
      });

    return response.data;
  }

  async insertGraph(graph_did, from, to, timestamp) {
    await this.axios_client.post('/graph/' + graph_did , {from: from, to: to, timestamp: timestamp})
  }
}

module.exports = Protocol
