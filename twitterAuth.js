const { Client, auth } = require("twitter-api-sdk");
const express = require("express");

const baseUrl = `https://ominous-space-barnacle-p94prv4g4r9f6pwx-3000.app.github.dev`;
const callback = `${baseUrl}/callback`;
const state = "my-state";
const port = 3000;

const app = express();

const client_id = "WEVnblkwYzNyS2ZDUXI1T3llYmc6MTpjaQ";
const client_secret = "-6bddJ4RU8u-z3vvO5I9VBCE8wAe3gAnnG9Au-6hX3dQztNrp7";

if (!client_id) throw "Please add a CLIENT_ID environment variable in the Secrets section";
if (!client_secret) throw "Please add a CLIENT_SECRET environment variable in the Secrets section";

const authClient = new auth.OAuth2User({
    client_id,
    client_secret,
    callback,
    scopes: ["users.read", "tweet.read"],
});

const client = new Client(authClient);

function renderProfile(profile_image_url, name, description) {
    return `
<head>
  <style>
    .profile {
      width: 20%;
      margin: auto;
    }
    .profile img {
      width: 100%;
    }
    .container {
      padding: 4px 15px;
    }
  </style>
</head>

<body>
<div class="profile">
  <img src="${profile_image_url}" alt="profile_image_url">
  <div class="container">
    <h4><b>${name}</b></h4>
    <p>${description}</p>
  </div>
</div>
</body>
`;
}

app.get("/", async function (req, res) {
    const authUrl = authClient.generateAuthURL({
        state,
        code_challenge_method: "s256",
    });
    res.redirect(authUrl);
});

app.get("/callback", async function (req, res) {
    try {
        const { code, state } = req.query;
        if (state !== state) return res.status(500).send("State isn't matching");
        if (typeof code !== "string")
            return res.status(500).send("Code isn't a string");
        await authClient.requestAccessToken(code);

              // Fetch Twitter user profile information
              const { data } = await client.users.findMyUser({
                "user.fields": ["profile_image_url", "description", "name"],
            });
    
            // Pass user data to the KeyPom drop function
            await simpleDropKeypom({
                twitterProfile: {
                    username: data.name,
                    bio: data.description,
                    profileImageUrl: data.profile_image_url,
                },
            });
    

        res.redirect("/me");


    } catch (error) {
        console.log(error);
    }
});

app.get("/me", async function (req, res) {
    const { data } = await client.users.findMyUser({
        "user.fields": ["profile_image_url", "description", "name"],
    });
    res.send(renderProfile(data.profile_image_url, data.name, data.description));
});

app.get("/revoke", async function (req, res) {
    try {
        const response = await authClient.revokeAccessToken();
        res.send(response);
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log(`Open this link in a new window to login: ${baseUrl}`);
});
