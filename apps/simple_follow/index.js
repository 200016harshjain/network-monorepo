const express = require("express");
const DIDKit = require('@spruceid/didkit-wasm-node');
const Protocol = require('client');
const c = new Protocol();

const path = require("path");
const port = 3002;

const server = express();
const handlesTaken = [];
const handleDIDMap = new Map();

server.use(express.urlencoded({ extended: true }));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'public')));

var graph_did = "did:dcn:simple_follow"
c.registerGraph(graph_did,"uiolpasdfghjkjhgfdsasdfghjmknbvcxcvbnbvcxzfghudsdfyuy")

server.get("/", (req, res) => {
  res.render('pages/index')
});

server.post("/account", async (req, res) => {
  var handle = req.body.fhandle;
  var handleAlreadyTaken = await handleUniqueness(handle);

  if (handleAlreadyTaken == false) {
    var result = await createAccount(handle);
    console.log(`Account created for handle:${handle}, did:${result["did"]}`);
    res.redirect(`profile/${handle}`);
  } else {
    console.log(`Handle: ${handle} already taken`);
    res.status(404).send(`Handle: ${handle} already taken`);
  };
});

server.post("/signin", async (req, res) => {
  var handle = req.body.fhandle;
  var handleAlreadyTaken = await handleUniqueness(handle);

  if (handleAlreadyTaken == false) {
    console.log("Create an account first");
    res.status(404).send("Create an account first");
  } else {
    console.log(`Profile lookup for handle:${handle}`);
    res.redirect(`profile/${handle}`);
  };
});


server.get("/profile/:handle", async (req, res) => {
  var params = req.params;
  var handle = params["handle"];
  var did = handleDIDMap.get(handle);
  //var result = await db.get(did);
  //var followers = await db.get(`followers-${did}`);
  //var following = await db.get(`following-${did}`);

  res.render('pages/profile_v2',{
    did: did,
    //key: result["key"],
    handle: handle,
    //follower_count: followers.length,
    //following_count: following.length
  });
});

server.post("/follow", async (req, res) => {
  var followerHandle = req.body.fhandle;
  var followingHandle = req.body.phandle;
  var followerExists = await handleUniqueness(followerHandle);
  var followerDID = handleDIDMap.get(followerHandle);
  var followingDID = handleDIDMap.get(followingHandle);

  if (followerExists == false) {
    console.log("Create an account first");
    res.status(404).send("Create an account first");
  } else {
    c.insertGraph(graph_did, followerDID, followingDID, new Date())
    console.log(`User ${followerHandle} followed ${followingHandle}`);
    //res.redirect(`profile/${followingHandle}`);
    res.status(200).send(`You successfully followed ${followingHandle}`);
  };
});

server.listen(port, (err) => {
  if (err) throw err;
  console.log(
    `> Ready on ${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co port ${port}`
  );
});

async function handleUniqueness(handle) {
  return handlesTaken.includes(handle);
  console.log(handlesTaken.includes(handle));
};

async function createAccount(handle) {
  var key = DIDKit.generateEd25519Key();
  handlesTaken.push(handle);
  console.log(key);
  //call client to generate did and pass this key
  var result = await c.generateDID(key);
  console.log(result);
  var did = result["did"];
  var doc = result["doc"];
  c.registerUser(did, doc);

  handleDIDMap.set(handle, did);

  return {key: key, did: did}
};
