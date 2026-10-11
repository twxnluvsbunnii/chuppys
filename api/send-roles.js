
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const {
    DISCORD_BOT_TOKEN,
    ROLES_CHANNEL_ID,
    SEND_ROLES_KEY
  } = process.env;

  // Check the secret key
  if (
    !SEND_ROLES_KEY ||
    req.query.key !== SEND_ROLES_KEY
  ) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  // Check required environment variables
  if (!DISCORD_BOT_TOKEN || !ROLES_CHANNEL_ID) {
    return res.status(500).json({
      error: "Missing bot token or roles channel ID"
    });
  }

  // ==========================================
  // ROLE IDS
  // ==========================================

  const roles = {
    welcome: "1531039846871728248",
    announcement: "1531084435716571137",
    streaming: "1531104789075853472",
    giveaway: "1531104886630907925",
    stock: "1531105107586973696",
    cashout: "1551276593425682543",
    flashsale: "1558913216602706011"
  };

  // ==========================================
  // EMBED
  // ==========================================

  const embed = {
    title: "• pings // •",

    description:
      `<@&${roles.welcome}>\n\n` +
      `<@&${roles.announcement}>\n\n` +
      `<@&${roles.streaming}>\n\n` +
      `<@&${roles.giveaway}>\n\n` +
      `<@&${roles.stock}>\n\n` +
      `<@&${roles.cashout}>\n\n` +
      `<@&${roles.flashsale}>\n\n` +
      `please choose your roles below ♡`,

    color: 0xffffff,

    footer: {
      text: ".gg/chuppys"
    }
  };

  // ==========================================
  // ROLE DROPDOWN MENU
  // ==========================================

  const message = {
    embeds: [embed],

    components: [
      {
        type: 1,

        components: [
          {
            type: 3,

            custom_id: "chuppys_self_roles",

            placeholder: "♡ choose your roles",

            min_values: 0,
            max_values: 7,

            options: [
              {
                label: "Welcome Ping",
                value: roles.welcome
              },
              {
                label: "Announcement Ping",
                value: roles.announcement
              },
              {
                label: "Services Ping",
                value: roles.streaming
              },
              {
                label: "Giveaway Ping",
                value: roles.giveaway
              },
              {
                label: "Stock Ping",
                value: roles.stock
              },
              {
                label: "Cash Out",
                value: roles.cashout
              },
              {
                label: "Flash Sale Ping",
                value: roles.flashsale
              }
            ]
          }
        ]
      }
    ]
  };

  // ==========================================
  // SEND MESSAGE TO DISCORD
  // ==========================================

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${ROLES_CHANNEL_ID}/messages`,
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
      console.error(
        "Discord API error:",
        response.status,
        data
      );

      return res.status(response.status).json({
        error: "Discord could not send the roles message",
        details: data
      });
    }

    console.log(
      "Chuppys ping roles message sent:",
      data.id
    );

    return res.status(200).json({
      success: true,
      message: "Ping roles message sent successfully",
      messageId: data.id
    });

  } catch (error) {
    console.error(
      "Failed to send ping roles message:",
      error
    );

    return res.status(500).json({
      error: "Internal server error while sending roles"
    });
  }
}
