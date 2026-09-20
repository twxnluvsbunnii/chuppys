export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    DISCORD_BOT_TOKEN,
    ROLES_CHANNEL_ID,
    SEND_ROLES_KEY
  } = process.env;

  if (req.query.key !== SEND_ROLES_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const roles = {
    welcome: "1531039846871728248",
    announcement: "1531084435716571137",
    streaming: "1531104789075853472",
    giveaway: "1531104886630907925",
    stock: "1531105107586973696",
    cashout: "1551276593425682543"
  };

  const embed = {
    title: "• pings // •",
    description:
      `<@&${roles.welcome}>\n\n` +
      `<@&${roles.announcement}>\n\n` +
      `<@&${roles.streaming}>\n\n` +
      `<@&${roles.giveaway}>\n\n` +
      `<@&${roles.stock}>\n\n` +
      `<@&${roles.cashout}>\n\n` +
      `please choose your roles below ♡`,
    color: 0xf3dce8,
    footer: {
      text: ".gg/chuppys"
    }
  };

  const message = {
    embeds: [embed],

    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "chuppys_self_roles",
            placeholder: "♡ choose your roles // • 3",
            min_values: 0,
            max_values: 6,
            options: [
              {
                label: "Welcome Ping",
                value: roles.welcome,
                description: "Receive welcome pings"
              },
              {
                label: "Announcement Ping",
                value: roles.announcement,
                description: "Receive announcement pings"
              },
              {
                label: "Streaming Ping",
                value: roles.streaming,
                description: "Receive streaming pings"
              },
              {
                label: "Giveaway Ping",
                value: roles.giveaway,
                description: "Receive giveaway pings"
              },
              {
                label: "Stock Ping",
                value: roles.stock,
                description: "Receive stock pings"
              },
              {
                label: "Cash Out",
                value: roles.cashout,
                description: "Receive cash out pings"
              }
            ]
          }
        ]
      }
    ]
  };

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
    return res.status(response.status).json(data);
  }

  return res.status(200).json({
    success: true,
    messageId: data.id
  });
}
