export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    DISCORD_BOT_TOKEN,
    ABOUT_US_CHANNEL_ID,
    SEND_ROLES_KEY
  } = process.env;

  if (req.query.key !== SEND_ROLES_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const embed = {
    title: "﹕𐔌・about-us〃・꒱",

    description:
      "**.gg/chuppys about us**\n\n" +

      "**.gg/chuppys**\n\n" +

      "→ **Welcome**\n" +
      "Welcome to .gg/chuppys! We are an irl married couple, not e-daters!!\n\n" +

      "→ **Our community**\n" +
      "We mainly play Baddies!! But we are always open to trying new games on Roblox. We also play Fortnite, Marvel Rivals, etc etc.\n\n" +

      "→ **Our goal**\n" +
      "Our goal is to keep .gg/chuppys active, welcoming, and enjoyable for everyone.",

    color: 0xffffff,

    footer: {
      text: ".gg/chuppys"
    }
  };

  const message = {
    embeds: [embed]
  };

  const response = await fetch(
    `https://discord.com/api/v10/channels/${ABOUT_US_CHANNEL_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  return res.status(200).json({
    success: true,
    messageId: data.id
  });
}
