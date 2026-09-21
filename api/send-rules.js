export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    DISCORD_BOT_TOKEN,
    RULES_CHANNEL_ID,
    SEND_ROLES_KEY
  } = process.env;

  if (req.query.key !== SEND_ROLES_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const embed = {
    title: ".gg/chuppys rules",
    description:
      "**.gg/chuppys rules you must follow**\n\n" +

      "→ **Racism & homophobia**\n" +
      "Any racism or homophobia is prohibited in this server. You will be warned once. If you break this rule again, you will be banned from this server.\n\n" +

      "→ **Bullying & harassment**\n" +
      "Bullying or harassment is prohibited in this server. If you're caught bullying or harassing someone, you will be automatically banned with no warning.\n\n" +

      "→ **Advertising & promotion**\n" +
      "Do not promote or advertise any other server or your own businesses. If caught doing so, you will be banned without any warning.\n\n" +

      "→ **Pic perms**\n" +
      "Pic perms will be granted only to loyal customers or those with buyer roles. If you're caught going against pic perm rules, you will be banned from this server.\n\n" +

      "→ **Personal information / doxxing**\n" +
      "Do not leak or send another person's personal information (doxxing). Otherwise, you will be permanently banned from the server with no appeal.\n\n" +

      "→ **Threats & illegal content**\n" +
      "Do not threaten to harm another individual or group of people. Do not create, post, solicit, or attempt to distribute content on Discord that depicts, promotes, or attempts to normalize child sexual abuse.\n\n" +

      "→ **Sexually explicit content**\n" +
      "Do not make sexually explicit content available to anyone under the age of 18. You will be banned automatically if caught breaking this rule.",

    color: 0xffffff,

    footer: {
      text: ".gg/chuppys"
    }
  };

  const message = {
    embeds: [embed]
  };

  const response = await fetch(
    `https://discord.com/api/v10/channels/${RULES_CHANNEL_ID}/messages`,
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
