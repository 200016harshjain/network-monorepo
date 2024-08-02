import axios from 'axios';
import _ from 'lodash';
import { programInit, AccountV1 } from 'account-fs';
import { createAppClient, viemConnector } from '@farcaster/auth-client';

const farcasterClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

const NETWORK = import.meta.env.VITE_NETWORK || "DEVNET"

const program = await programInit(NETWORK)
window.shovel = program

const account = new AccountV1(program.agent)
await account.loadRepositories()

shovel.account = account

const axios_client  = axios.create({
  baseURL: `${window.location.origin}`,
})

async function farcasterSignup(accountDID, siweMessage, siweSignature, profileData, fid) {
  await account.create(accountDID, siweMessage, siweSignature)
  await account.repositories.profile.set(profileData)
  await account.agent.appendName(fid, 'farcaster')
}

async function followFarcasterUsersBasedOnFID(signerUuid, targetFids) {
  try {
    const data = {
      signerUuid: signerUuid,
      targetFids: targetFids
    };
    const response = await axios_client.post('/farcaster-follow-users/',data);
    return response.data;
  } catch (error) {
    console.error('Error following Farcaster users:', error);
    throw error;
  }
}

async function getCommunityMembers(community) {
  return await account.search({personUID: community.UID})
}

async function getProfile(communityDID = null) {
  return account.getProfile(communityDID)
}

async function getContacts() {
  var list = await account.repositories.people.list()
  console.log("all", list)
  return {contactList: list}
}

async function getContactByUID(uid) {
  return await account.repositories.people.find(uid)
}

const didsToFids = {
  'did:pkh:eip155:10:0x003587d91f8aa5db5913E8A14F353Df12A767fDE': 657052,
  'did:pkh:eip155:10:0x0346704223b790E2eaaA13b9175752E07D6951c3': 344145,
  'did:pkh:eip155:10:0x095479578B3FC4750F1d0458a310cEF83A7e6E32': 190968,
  'did:pkh:eip155:10:0x0E929F202ac3ce8f78E516aeF672FEC5C8B591ab': 2727,
  'did:pkh:eip155:10:0x0c15a9BEfE87F647B003a2241684603628443f8b': 17979,
  'did:pkh:eip155:10:0x0dA3e99cb6C3D5514134AbbD2565643D0AD5AFF6': 880,
  'did:pkh:eip155:10:0x0ebA332fb5ac9cE29A16C6f24BB68324878C3487': 197340,
  'did:pkh:eip155:10:0x0f3B692AA9135d044C5a91e150b8Bc4307b76d4D': 239200,
  'did:pkh:eip155:10:0x0f3e6cD7A4f5586CC364e8330620d3E3F25b995d': 379972,
  'did:pkh:eip155:10:0x10FeEC8c62552e697c0e1f838d4489057F96Fe83': 505763,
  'did:pkh:eip155:10:0x15A16B1A8402dAA814BF4eEd11cf826462c60457': 525499,
  'did:pkh:eip155:10:0x18b800af53BECE985F11d0A407c9Cdb1b30C74b9': 4027,
  'did:pkh:eip155:10:0x19D7F99d7fE1626806dBCa946Cc7a0A41b5909D8': 9176,
  'did:pkh:eip155:10:0x1A94e90bC4CE76B347E922baA64231a289ea563a': 2329,
  'did:pkh:eip155:10:0x1C4254700461488A177e1d173a2ADaF99EE981f3': 19033,
  'did:pkh:eip155:10:0x1f5A7EE2A1f66C038B7dE68847FdbfcC6F6E53b9': 1350,
  'did:pkh:eip155:10:0x269F446b785117424032c1a7692646A2029A0CE5': 1962,
  'did:pkh:eip155:10:0x2C4d8339749A75f74E76672B63785B23c1Aaa0dA': 417524,
  'did:pkh:eip155:10:0x2b0642c976D18706Ad2d6D1545b84d8BF80428C7': 20762,
  'did:pkh:eip155:10:0x2b218Bf824B2ddeF802AA2d881bA864daa8b853c': 500605,
  'did:pkh:eip155:10:0x2c72E51e85Bd730D75F5360a343201c4Dc4601Ed': 6554,
  'did:pkh:eip155:10:0x2e5BBF76522d73504D43Fa439aEfb932203B98bE': 244416,
  'did:pkh:eip155:10:0x343Cc5C3b4fAFe3d533FA7fae0fd5757ed2b96E5': 1425,
  'did:pkh:eip155:10:0x34Fa4Fcdb1dc98bc4fD987ED486BF72040A81DEA': 3609,
  'did:pkh:eip155:10:0x354025d5da52C42B73A915013da312f1e7336D28': 347901,
  'did:pkh:eip155:10:0x36F4eE4Dd4de71D658292B0f35DBB45537940A6C': 341438,
  'did:pkh:eip155:10:0x3712B2200F8AF158f70Df967D6c5101B9c379A4A': 309516,
  'did:pkh:eip155:10:0x382E8A19212Eae2D0353C0927b473594E52826f3': 2233,
  'did:pkh:eip155:10:0x39Eb1E09e13639B695f8C2825f679BF1d370c1A1': 964,
  'did:pkh:eip155:10:0x3EE31fceda25bDfA558C04AD7Cbe7B4Fc0CC4697': 263303,
  'did:pkh:eip155:10:0x3aAd03a3a3D7784d3089Fc4EAcB1b32E442aEcAe': 2911,
  'did:pkh:eip155:10:0x3fBe001a34e4eB8d17554F8bce3Db4C82c9CcF4d': 625219,
  'did:pkh:eip155:10:0x3fd57Eea6E0b65c3010f050A96fe962Ff3E5A3cE': 263664,
  'did:pkh:eip155:10:0x433CeFe01751C3e828D3386AD32f7a2d64ab3189': 18673,
  'did:pkh:eip155:10:0x478f21B2ADe8eE25923fBf3f96c045a7Fd54BA93': 14520,
  'did:pkh:eip155:10:0x4EfE22f647996FB45Ec2944894F72A38162Ca4C3': 381695,
  'did:pkh:eip155:10:0x4F09BcBC633Fac4eD1821119641c133D815888F5': 2904,
  'did:pkh:eip155:10:0x4dD45374275D2F2898DD2eF00C23CEEeB44E3f9a': 2783,
  'did:pkh:eip155:10:0x4f71B76fe0699cEda44bf4772472381F3e4c838C': 3107,
  'did:pkh:eip155:10:0x4fbE7C1bE4A7DB651374D7b3b7a6EBB206DD2821': 14932,
  'did:pkh:eip155:10:0x4fbaa4a6ff2cd67309bd3FDD9FD95B31b3C09294': 438268,
  'did:pkh:eip155:10:0x51eb8752dB4a46164825B70aBea9a30139E6bc1F': 360159,
  'did:pkh:eip155:10:0x52c99f564D804184771Fc29Ce412787f284adc8a': 388416,
  'did:pkh:eip155:10:0x53A8F68479327F4E4A2Ab85f5cCB3cc0009C84F2': 479,
  'did:pkh:eip155:10:0x551b0455312b8427bD862d65a486f68AF44749FB': 559339,
  'did:pkh:eip155:10:0x585740e41e143dA2fcFe04D2d3D73bc68bCe2B97': 19652,
  'did:pkh:eip155:10:0x59Df90f6D79730B82b79dDEC03C715007eC76Cb9': 244457,
  'did:pkh:eip155:10:0x5B434609B2B9fc88dD34cC376f3363fEC9750580': 369341,
  'did:pkh:eip155:10:0x5ce69F31D1ed3Ed403ea6C3b15B53DAD8040E222': 813640,
  'did:pkh:eip155:10:0x677eA54133545DBe4726eEe38400559e6E5BeD15': 4753,
  'did:pkh:eip155:10:0x6856c1D5A1ed9EeF4537884A41F44114D15D32B3': 233843,
  'did:pkh:eip155:10:0x697e22e83dABFB5033Cd5c63191E592Ae4e708c2': 3206,
  'did:pkh:eip155:10:0x697eF45d788b7c318528298aDe8EB658a15b7fab': 321089,
  'did:pkh:eip155:10:0x6E3c23ad0d5388f5B2903A81d7b86A3f08b36E0B': 226690,
  'did:pkh:eip155:10:0x6f96e50410e329Bb25587481B585A9378aa6E17c': 9369,
  'did:pkh:eip155:10:0x7217a07C230de31a432e136C9cc48F80Aef4C969': 2915,
  'did:pkh:eip155:10:0x7385E1A824A405cBB13B64829BF1509cd2A471f7': 213310,
  'did:pkh:eip155:10:0x740663923Ed690EF91db915A5fF0ff199460D92a': 375245,
  'did:pkh:eip155:10:0x74BC821EdD8bd38fbE1c4177AD48abA1910F8E9D': 2467,
  'did:pkh:eip155:10:0x771E45e81A7D7b721C6A8D0A5a106887cC3dFfE0': 14364,
  'did:pkh:eip155:10:0x7D1CB987953e124590b17F2Eb12581b594fc8451': 9050,
  'did:pkh:eip155:10:0x827f62f0eE880B7e3cEAB4B969CFe3879c052792': 272717,
  'did:pkh:eip155:10:0x870eecB57dE0903D5E8f187441190c3e83cd94bd': 9367,
  'did:pkh:eip155:10:0x8844501933180Ce39Aa7D3B956f7fB531EdCf12c': 4215,
  'did:pkh:eip155:10:0x897AcEB60D84c403688Af11a9ED021Eec6b75613': 4914,
  'did:pkh:eip155:10:0x8BC8863356EbB1cc73b2d68376254728e25e98Fb': 13626,
  'did:pkh:eip155:10:0x8c60d61FbaFeC22fB223Fb6CfB4ec702dF5C4F3F': 4715,
  'did:pkh:eip155:10:0x8e3d893Aaf34ED2Ea3d6D384b8111cab7f3FBE62': 196957,
  'did:pkh:eip155:10:0x8f8a5B25fFf9C6875fbdBA4f3c6f4c695B78ce10': 1389,
  'did:pkh:eip155:10:0x92653a6e7f713028b20bB5B67497BAd21D63d133': 422384,
  'did:pkh:eip155:10:0x9612f0682a4051892aC1e360b5bfE5F72a97d193': 354491,
  'did:pkh:eip155:10:0x97674B4bf14C357b3B6E83cB061e3F773e10c47d': 429919,
  'did:pkh:eip155:10:0x9Bcded575e283436e162ac27CAE503e12bEb591e': 2276,
  'did:pkh:eip155:10:0x9d1DB2991cfbefC00bAb44FE6Bf319f71Ac600Ce': 16085,
  'did:pkh:eip155:10:0xA4dEdCfB643e5F5D337F8Becb9c94D59323d576a': 211159,
  'did:pkh:eip155:10:0xA6ac39B220a328529C34F02E37F2B5CC5ade442A': 315655,
  'did:pkh:eip155:10:0xAA358664132a21318eE2dc5cbCa1830C31c04B10': 2566,
  'did:pkh:eip155:10:0xAdf16059d1b24A0c400Ad62313AE0c8C31A9CA71': 418755,
  'did:pkh:eip155:10:0xB876dFf1C9aB02822b1D477D2A6C6Cfb2F9D1e7C': 10857,
  'did:pkh:eip155:10:0xBE67BeC244EC12A4F5E69eea67BD7a7E51b02c4c': 231603,
  'did:pkh:eip155:10:0xBdaCd791C37247864D19ff37691B7eD122Bd3E28': 2248,
  'did:pkh:eip155:10:0xC02D2c2F9095b99801DE8De256DB1636A2820b98': 8010,
  'did:pkh:eip155:10:0xC06a4968F516A3C7fA5BD101beec2e9763E47753': 377,
  'did:pkh:eip155:10:0xC1705301EceBEDB3F85Cb79330A855B847F80016': 15732,
  'did:pkh:eip155:10:0xC838388Af0A7438C20B8487a3aE940Aa860fbd8F': 467975,
  'did:pkh:eip155:10:0xCd77817A4FA7c6bdE8B09adEbA927be7dBCab8b4': 380638,
  'did:pkh:eip155:10:0xD04E431836B6B5407ac54F0DA37194fE1d4b47f1': 403619,
  'did:pkh:eip155:10:0xD6BCB71d82d668cC5Db704Df71EF3D3519aeeE19': 5297,
  'did:pkh:eip155:10:0xD8CD5f3D2b881AEBf0E21fA22E26D06653c06172': 431,
  'did:pkh:eip155:10:0xDa4ae0B9e0b783dF4926e3Ec68a34F51d24eA701': 638988,
  'did:pkh:eip155:10:0xDf055eB92e2C97D7DA4036278D145458EB11811c': 1265,
  'did:pkh:eip155:10:0xE1731273c1262e458251ABf722cf64C52f558C2a': 270504,
  'did:pkh:eip155:10:0xE41253FEBEbf1b2BF48f5a2acFb3D9Dd43d2aF16': 469678,
  'did:pkh:eip155:10:0xE5F5426400123D6fdB9e0cEe6A068835196B3Ff8': 754,
  'did:pkh:eip155:10:0xE6F7636b1DC6D3B8948bAC9327C4fFec1ea64Fcd': 728179,
  'did:pkh:eip155:10:0xE76936b7EcB7a20A07784ddc2bfF0531eDDCa2B5': 277051,
  'did:pkh:eip155:10:0xFb1BC6fFd9474B2C6D84061656F5758CB5ec0493': 7674,
  'did:pkh:eip155:10:0xFed8b1034262Ff01325f2c6ca8EfB43155EFbE62': 189052,
  'did:pkh:eip155:10:0xa8bC0B3A04D4b5Bd0970D1037DcD3634b24a16F8': 15604,
  'did:pkh:eip155:10:0xa96D1A9ad7804dB9Afce3356064Fc3f475C32685': 5087,
  'did:pkh:eip155:10:0xaCeD7e0e0576a41F6aEFfF6F88BB4416C3557582': 380266,
  'did:pkh:eip155:10:0xaa428f48C5490F664C5c543cF686d83D0C164Cf8': 314559,
  'did:pkh:eip155:10:0xb3b4c5D8A76B33D5DB8F94b44444563b9038A7A3': 2802,
  'did:pkh:eip155:10:0xb43575d58C49d2Be880e0F821DDF51d15C13c376': 12,
  'did:pkh:eip155:10:0xb46082442512cED5EAAb458e41bbb2bbDF7574D8': 296583,
  'did:pkh:eip155:10:0xc09568dDb2980366EBA130BfccA7c9B321C42C30': 6292,
  'did:pkh:eip155:10:0xcD1DF681702FeC52aCa8fB6e50c11361bCFAdF71': 399712,
  'did:pkh:eip155:10:0xcbBE25C3FEdFcaca2db7b10B7Ae283F59E651509': 7055,
  'did:pkh:eip155:10:0xd1A6114fD0974B79151280a2c84870A88a72a304': 1855,
  'did:pkh:eip155:10:0xd4631B058c0B0220a21950b449587B1558746806': 533603,
  'did:pkh:eip155:10:0xe0C82F24C60eb01E894B6518455F500F8025A661': 11155,
  'did:pkh:eip155:10:0xe2062274b5b3F802D5c983005ef9e4b1969A4121': 190081,
  'did:pkh:eip155:10:0xe38BFBe0B055C55cd8E951a87Dae3411f0617340': 3046,
  'did:pkh:eip155:10:0xe4Db060e0Dcff60224111dB658bFA9d8ab167527': 740661,
  'did:pkh:eip155:10:0xe5DA60c1263678d13cf4De7130DCd5A64D2e704A': 4626,
  'did:pkh:eip155:10:0xe89937d4BfFA2d2c3bD5F5426aEcF1818075BE39': 14539,
  'did:pkh:eip155:10:0xf062988a8b7Ed9E65535D99d12CA135A23cD4F2f': 373714,
  'did:pkh:eip155:10:0xf7d4041e751E0b4f6eA72Eb82F2b200D278704A4': 265504,
  'did:pkh:eip155:10:0xffE946D9C24ca4D6F785447A923C9e812E4e7B95': 9856
}

export { 
  account,
  farcasterClient,
  didsToFids,
  farcasterSignup,
  getProfile, 
  getContacts, 
  getContactByUID,
  getCommunityMembers,
  followFarcasterUsersBasedOnFID
};