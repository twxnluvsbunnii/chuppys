export default async function handler(req, res) {
  if (req.method !== "GET") {
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
    role1: "1531084942241697854",
    role2: "1531086100867842190",
    role3: "1531101006451048448"
  };

  const embed = {
    title: "• pronouns // •",
    description:
      `<@&${roles.role1}>\n\n` +
      `<@&${roles.role2}>\n\n` +
      `<@&${roles.role3}>\n\n` +
      `please choose your roles below ♡`,
    color: 0xffffff,
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
            custom_id: "chuppys_pronoun_roles",
            placeholder: "♡ choose your pronouns",
            min_values: 0,
            max_values: 3,
            options: [
              {
                label: "﹕𐔌・she / her〃・꒱",
                value: roles.role1
              },
              {
                label: "﹕𐔌・he / him〃・꒱",
                value: roles.role2
              },
              {
                label: "﹕𐔌・they / them〃・꒱",
                value: roles.role3
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
