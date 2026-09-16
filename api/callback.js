export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Missing OAuth code or state.");
  }

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

  const tokenResponse = await fetch(
    "https://discord.com/api/v10/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.PUBLIC_BASE_URL}/oauth/callback`,
      }),
    }
  );

  const token = await tokenResponse.json();

  if (!token.access_token) {
    return res.status(400).send("Discord authorization failed.");
  }

  const updateResponse = await fetch(
    `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform_name: "Chuppys",
        platform_username: "Verified",
        metadata: {
          verified: "1",
        },
      }),
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    return res.status(updateResponse.status).send(error);
  }

  res.status(200).send("Verification complete! You can return to Discord.");
}
