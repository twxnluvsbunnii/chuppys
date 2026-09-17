export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization;

  if (auth !== `Bearer ${process.env.SETUP_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
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

  const data = await response.json();

  return res.status(response.status).json(data);
}
