import axios from 'axios';
import _ from 'lodash';
import {vCardParser} from './vcard_parser.js';
import { ContactTable } from "./contact_table";
import { MemberTable } from "./member_table";
import { programInit, Person, AccountV1 } from 'account-fs';
import * as uint8arrays from 'uint8arrays';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { save } from '@tauri-apps/api/dialog';
import { writeTextFile } from '@tauri-apps/api/fs';
import { SiweMessage } from 'siwe';


const farcasterClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

const NETWORK = import.meta.env.VITE_NETWORK || "DEVNET"

// TODO - remove passing of App handle, instead infer from IndexDB after join handshake from app agent
const program = await programInit(NETWORK, "rolodex")
window.shovel = program

const account = new AccountV1(program.agent)
await account.loadRepositories()
const contactRepo = account.repositories.people 
const accountv1 = account
shovel.account = account

customElements.define('contact-table', ContactTable);
customElements.define('member-table', MemberTable);

const axios_client  = axios.create({
  baseURL: `${window.location.origin}`,
})

async function farcasterSignup(accountDID, siweMessage, siweSignature, profileData, fid) {
  await accountv1.create(accountDID, siweMessage, siweSignature)
  await accountv1.repositories.profile.set(profileData)
  await accountv1.agent.appendName(fid, 'farcaster')
}

async function ethereumSignup(accountDID,siweMessage, siweSignature, profileData,fid) {
  await accountv1.create(accountDID, siweMessage, siweSignature)
  await accountv1.repositories.profile.set(profileData)
  await accountv1.agent.appendName(fid, 'ethereum')
}





async function getNonce() {
  try {
    const response = await axios_client.get('/nonce');
    return response.data;  
  } catch (error) {
    console.error('Error fetching nonce:', error);
    throw error;  
  }
}

async function createSiweMessage(address, nonce, requestId, chainId) {
  const message = new SiweMessage({
      domain: window.location.host,
      address: address,
      statement : 'Sign in via ethereum',
      uri: window.location.origin,
      version: '1',
      chainId: chainId,
      nonce: nonce,
      requestId: requestId
  });
  return message.prepareMessage();
}

async function verifySiweMessage(message,signature,nonce) {
  let SiweObject = new SiweMessage(message)
  try {
    var publicKey, result = await SiweObject.verify({signature: signature, nonce: nonce});
    return result.success;
  }
  catch(e) {
    console.error("SIWE Message verfication failed", e);
  }
}

async function getMembers() {
  if (account.repositories.members) {
    var list = await account.repositories.members.list()
    console.log("all", list)
    return {memberList: list}
  }
  return {memberList: undefined}
}

async function getCommunityMembers(community) {
  return await account.search({personUID: community.UID})
}

async function filterMembers(filter, profiles, communityUID) {
  return await account.search({query: filter, personUID: communityUID})
}

async function getProfile(communityDID = null) {
  return account.getProfile(communityDID)
}

async function getContacts() {
  var list = await contactRepo.list()
  console.log("all", list)
  return {contactList: list}
}

async function getContactByUID(uid) {
  return await contactRepo.find(uid)
}

async function filterContacts(filter) {
  return { contactList: await account.search({query: filter, depth: 1}) }
}


async function updateProfile(handle, name, tags = [], text = '') {
  await account.editProfile({handle: handle, name: name, tags: tags, text: text})
}

//updates given params with new values while keeping rest of the keys in Profile Object the same
async function updateCommunityProfile(inputs, communityDID, profileSchema) {
  return await accountv1.repositories.profile.updateCommunityProfile(communityDID, profileSchema, inputs)
}

async function createCommunityProfile(params, communityDID, profileSchema) {
  await accountv1.repositories.profile.createCommunityProfile(communityDID, profileSchema, params)
  return await accountv1.repositories.profile.set(params)
}

async function addContact(name, email='', tags = [], text = "", links = []) {
  
  let person = new Person({FN: name, EMAIL: convertEmailStringToEmailArray(email), CATEGORIES: tags.join(), NOTE: text, URL: links.join(), PRODID: "DCN:rolodex", UID: crypto.randomUUID()})
  return contactRepo.create(person)
}

function convertEmailStringToEmailArray(emailString) {
  if (typeof emailString === 'string' && emailString.trim() !== '') {
    return emailString.split(',').map(email => email.trim());
  }
  return [];
}

// TODO - fix bug where contact edit clears PRODID etc.
async function editContact(id, name, email='', tags = [], text='', links = []) {
  let person = new Person({FN: name,  EMAIL:convertEmailStringToEmailArray(email), CATEGORIES: tags.join(), NOTE: text, URL: links.join(), PRODID: "DCN:rolodex", UID: id})
  return contactRepo.edit(person)
}

async function deleteContact(id) {
  return contactRepo.delete(id)
}

async function signout() {
  if(window.ethereum) {
    await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [
            {
              eth_accounts: {},
            },
          ],
        });

  }
  await account.signout()

}

async function downloadContactsDataLocally() {
  let filename = "contacts.json"
  const content = await getContacts()
  console.log("content: ", content)
  
  if (window.__TAURI__) {
    const filePath = await save({ defaultPath: filename });
    await writeTextFile(filePath, JSON.stringify(content));
  } else {
    const data = new Blob([JSON.stringify(content, null, 4)], { type: 'application/json' })
    var fileURL = window.URL.createObjectURL(data);
    var tempLink = document.createElement('a');
    tempLink.href = fileURL;
    tempLink.setAttribute('download', `${filename}`);
    tempLink.click();
    window.URL.revokeObjectURL(fileURL);
  }
}

async function importContacts(username, password){
  //fetch creds from store if already present
  console.log("import triggered")
  var credsPresence = await appleCredsPresent()
  if (credsPresence.response) {
    var user = credsPresence.value.username
    var pass = credsPresence.value.password
  } else {
    account.editProfile({appleCreds: {username: username, password: password}});
    var user = username
    var pass = password
  }

  const response = await axios_client.get('/apple_contacts', { params: { username: user, password: pass } })
  .then(function (response) {
    return response;
  });

  //insert appleContacts to contactList
  await addAppleContactsToContactList(response.data)
  console.log("import done")
}

async function appleCredsPresent(){
  var profileData = await getProfile()
  var credsPresent =  !(_.isEmpty(profileData.appleCreds) || profileData.appleCreds.username === "")
  console.log("creds present: ", credsPresent)
  return {response: credsPresent, value: profileData.appleCreds} 
}

async function addAppleContactsToContactList(appleContacts){
  //check if the uid to appleContacts[i] is == to any of the appleContactIDs in contactList
  //if not, add it to contactList
  var contacts = await contactRepo.list()
  var existingAppleContactIDs = Object.values(contacts).filter((contact) => !contact.archived).map(contact => contact.UID)
  var contactList = []
  for (var i = 0; i < appleContacts.length; i++) {
    var appleContact = appleContacts[i]
    try {
      var parsedAppleContact = vCardParser.parse(appleContact.data)[0]
    } catch (error) {
      console.log("error for contact: ", appleContact, "error: ", error)
      continue
    }
    var name = parsedAppleContact.displayName
    var uid = parsedAppleContact.UID
    var TEL = parsedAppleContact.telephone ? parsedAppleContact.telephone[0].value : undefined
    var EMAIL = parsedAppleContact.email ? parsedAppleContact.email[0].value : undefined
    if (!existingAppleContactIDs.includes(uid)) {
      // TODO set PROPID from vcard parsing
      contactList.push(new Person({FN: name, PRODID: "APPLE", UID: uid, EMAIL: convertEmailStringToEmailArray(EMAIL), TEL: TEL}))
    }
  }
  await contactRepo.bulkCreate(contactList)
  console.log("Imported Contacts Count: ", contactList.length)
}

async function importGoogleContacts(refresh) {
  google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email',
    callback: async (tokenResponse) => {
      const profile = await axios_client.get('https://www.googleapis.com/oauth2/v2/userinfo', {headers: { Authorization: `Bearer ${tokenResponse.access_token}`}})
      const response = await axios_client.get('https://people.googleapis.com/v1/people/me/connections',
        {params: { personFields: 'names,emailAddresses,phoneNumbers', sortOrder: 'LAST_MODIFIED_DESCENDING', pageSize: 200 }, headers: { Authorization: `Bearer ${tokenResponse.access_token}` }}
      )
      console.log("google contacts ", response.data);

      await addGoogleContactsToContactList(response.data.connections)
      console.log("import done")

      refresh()
    },
  }).requestAccessToken();
}

async function addGoogleContactsToContactList(googleContacts){
  var contacts = await contactRepo.list()
  var existingGoogleContactIDs = Object.values(contacts).filter((contact) => !contact.archived).map(contact => contact.UID)

  var contactList = []
  for (var i = 0; i < googleContacts.length; i++) {
    var googleContact = googleContacts[i]

    try {
      var name = googleContact.names[0].displayName
    } catch (error) {
      console.log("error for contact: ", googleContact, "error: ", error)
      continue
    }
    // TODO search for primary fields
    var EMAIL = googleContact.emailAddresses ? googleContact.emailAddresses[0].value : undefined
    var TEL = googleContact.phoneNumbers ? googleContact.phoneNumbers[0].canonicalForm : undefined
    var uid = googleContact.resourceName
    if (!existingGoogleContactIDs.includes(uid)) {
      contactList.push(new Person({FN: name, PRODID: "GOOGLE", UID: uid, EMAIL: convertEmailStringToEmailArray(EMAIL), TEL: TEL}))
    }
  }

  await contactRepo.bulkCreate(contactList)
  console.log("Imported Contacts Count: ", contactList.length)
}

async function portOldContacts(contacts){
  list = []
  Object.values(contacts.contactList).forEach(async (value) =>
    list.push(new Person({FN: value.name, CATEGORIES: value.tags.join(), NOTE: value.text, URL: value.links.join(), PRODID: "DCN:rolodex", UID: crypto.randomUUID()}))
  )
  await contactRepo.bulkCreate(list)
}



export { 
  account,
  farcasterClient,
  farcasterSignup,
  signout, 
  getProfile, 
  updateProfile, 
  getContacts, 
  getContactByUID,
  addContact, 
  editContact, 
  deleteContact, 
  filterContacts, 
  importContacts,
  importGoogleContacts,
  appleCredsPresent,
  downloadContactsDataLocally,
  portOldContacts,
  createSiweMessage,
  getNonce,
  verifySiweMessage,
  ethereumSignup,
  updateCommunityProfile,
  createCommunityProfile,
  getMembers,
  getCommunityMembers,
  filterMembers,
  uint8arrays,

  
};
