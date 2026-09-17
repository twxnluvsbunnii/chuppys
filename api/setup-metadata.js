export default async function handler(req, res) {
  const secret = req.query.secret;

  if (secret !== process.env.SETUP_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  const response = await fetch(
    "https://discord.com/api/v10/users/@me",
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  const data = await response.text();

  return res.status(response.status).send(data);
}
