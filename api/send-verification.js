export default async function handler(req, res) {
  const { key } = req.query;

  if (key !== process.env.SEND_VERIFICATION_KEY) {
    return res.status(403).send("Unauthorized.");
  }

  const channelId = process.env.VERIFICATION_CHANNEL_ID;

  if (!channelId) {
    return res.status(500).send("VERIFICATION_CHANNEL_ID is not configured.");
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "🤖 Verification required",
            description:
              "To gain access to **Chuppys** 💰 you need to prove you are a human by completing verification. Click the button below to get started!",
            color: 11632895
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
                  name: "↗️"
                },
                url: "https://chuppys.vercel.app/linked-role"
              },
              {
                type: 2,
                style: 5,
                label: "Why?",
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
    return res.status(response.status).send(error);
  }

  res.status(200).send("Verification message sent!");
}
