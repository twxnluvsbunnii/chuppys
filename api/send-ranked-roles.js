export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const {
    DISCORD_BOT_TOKEN,
    SEND_ROLES_KEY
  } = process.env;

  if (
    !SEND_ROLES_KEY ||
    req.query.key !== SEND_ROLES_KEY
  ) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  if (!DISCORD_BOT_TOKEN) {
    return res.status(500).json({
      error: "Missing Discord bot token"
    });
  }

  // ==========================================
  // RANKED ROLES
  // ==========================================

  const RANKED_CHANNEL_ID = "1567178497917718568";

  const roles = [
    "1550374791217680485",
    "1562961485091573902",
    "1550374678449754163",
    "1561439464327483583",
    "1550374524640436235",
    "1550374377130827856",
    "1550374079385575454",
    "1550373983336144936",
    "1550373843170889728",
    "1550373695204360252",
    "1550373612144304219"
  ];

  // ==========================================
  // EMBED
  // ==========================================

  const embed = {
    title: "• .gg/chuppys ranked roles •",

    description:
      roles.map((role, index) =>
        `**${index + 1}.** <@&${role}>`
      ).join("\n\n"),

    color: 0xffffff,

    thumbnail: {
      url: "https://cdn.discordapp.com/emojis/1568404337154068618.png?size=128&quality=lossless"
    },

    footer: {
      text: ".gg/chuppys"
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${RANKED_CHANNEL_ID}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          embeds: [embed],
          allowed_mentions: {
            parse: []
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Discord could not send the ranked roles embed",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ranked roles embed sent successfully",
      messageId: data.id
    });

  } catch (error) {
    console.error("Ranked roles error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
