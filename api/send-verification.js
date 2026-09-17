export default async function handler(req, res) {
  // Protect this endpoint with your private key
  const { key } = req.query;

  if (key !== process.env.SEND_VERIFICATION_KEY) {
    return res.status(403).send("Unauthorized.");
  }

  const channelId = process.env.VERIFICATION_CHANNEL_ID;

  if (!channelId) {
    return res
      .status(500)
      .send("VERIFICATION_CHANNEL_ID is not configured.");
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "🤍 Verification required",
            description:
              "To gain access to **.gg/chuppys** 🤍 you need to prove you are a human by completing verification. Click the button below to get started!",
            color: 15158332,
            image: {
              url: "https://cdn.discordapp.com/attachments/1531043582348230767/1550233909134889020/IMG_2558.jpg?ex=6aad9755&is=6aac45d5&hm=783d4627cf35b79e7a96477fc8f3f4ae29d4a1dedb01b97db6b6b0e4bf4f0d94"
            },
            footer: {
              text: "🤍 .gg/chuppys verification 🤍"
            }
          }
        ],

        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "Verify now",
                emoji: {
                  name: "🤍"
                },
                url: "https://chuppys.vercel.app/linked-role"
              },
              {
                type: 2,
                style: 5,
                label: "Why?",
                emoji: {
                  name: "🤍"
                },
                url: "https://twxnluvsbunnii.github.io/privacy-policy.html"
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();

    return res
      .status(response.status)
      .send(error);
  }

  return res.status(200).send("Verification message sent!");
}
