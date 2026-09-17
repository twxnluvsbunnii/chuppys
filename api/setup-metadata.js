export default async function handler(req, res) {
  const secret = req.query.secret;

  if (secret !== process.env.SETUP_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  return res.status(200).json({
    client_id: process.env.DISCORD_CLIENT_ID
  });
}
