export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing OAuth code or state.");
  }

  // Check saved OAuth state
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/chuppys_state=([^;]+)/);

  if (!match) {
    return res.status(400).send("Missing verification state.");
  }

  const [savedState, signature] = decodeURIComponent(match[1]).split(".");

  const crypto = await import("crypto");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.STATE_SECRET)
    .update(savedState)
    .digest("hex");

  if (state !== savedState || signature !== expectedSignature) {
    return res.status(400).send("Invalid verification state.");
  }

  // Exchange Discord OAuth code for access token
  const tokenResponse = await fetch(
    "https://discord.com/api/v10/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://chuppys.vercel.app/oauth/callback"
      })
    }
  );

  const token = await tokenResponse.json();

  if (!tokenResponse.ok || !token.access_token) {
    return res.status(400).send(`
      <h1>Discord OAuth Error</h1>
      <pre>${JSON.stringify(token, null, 2)}</pre>
    `);
  }

  // Get the Discord user's ID
  const userResponse = await fetch(
    "https://discord.com/api/v10/users/@me",
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );

  const user = await userResponse.json();

  if (!userResponse.ok || !user.id) {
    return res.status(400).send(`
      <h1>Could not get Discord user</h1>
      <pre>${JSON.stringify(user, null, 2)}</pre>
    `);
  }

  // Update the Discord Linked Role connection
  const updateResponse = await fetch(
    `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        platform_name: "Chuppys",
        platform_username: "Verified",
        metadata: {
          verified: "1"
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();

    return res.status(updateResponse.status).send(`
      <h1>Linked Role Error</h1>
      <pre>${error}</pre>
    `);
  }

  // Give the normal Verified server role
  const roleResponse = await fetch(
    `https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${user.id}/roles/${process.env.VERIFIED_ROLE_ID}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!roleResponse.ok && roleResponse.status !== 204) {
    const error = await roleResponse.text();

    return res.status(roleResponse.status).send(`
      <h1>Verified Role Error</h1>
      <pre>${error}</pre>
    `);
  }

  // Success
  res.setHeader(
    "Content-Type",
    "text/html; charset=UTF-8"
  );

  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chuppys Verified</title>

  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: #100d1c;
      color: #eeeafa;
      font-family: Arial, Helvetica, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
    }

    .card {
      max-width: 400px;
      background: #211e28;
      border: 1px solid #35313d;
      border-radius: 18px;
      padding: 30px;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
    }

    h1 {
      color: #e9c9dc;
      font-size: 24px;
    }

    p {
      color: #c8c4ce;
      line-height: 1.6;
    }

    .heart {
      color: #e9c9dc;
    }
  </style>
</head>

<body>

  <div class="card">

    <h1>
      <span class="heart">♡</span>
      Verification Complete!
      <span class="heart">♡</span>
    </h1>

    <p>
      You have successfully verified your Discord account
      with Chuppys.
    </p>

    <p>
      <strong>Your Verified role has been added!</strong>
    </p>

    <p>
      You can now go back to Discord.
    </p>

    <p class="heart">
      ୨୧ enjoy Chuppys! ୨୧
    </p>

  </div>

</body>
</html>
  `);
}
