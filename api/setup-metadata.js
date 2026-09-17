export default async function handler(req, res) {
  const secret = req.query.secret;

  if (secret !== process.env.SETUP_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  const response = await fetch(
    `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/role-connections/metadata`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          key: "verified",
          name: "Verified",
          description: "Has completed Chuppys verification",
          type: 7
        }
      ])
    }
  );

  const data = await response.text();

  return res.status(response.status).send(data);
}
