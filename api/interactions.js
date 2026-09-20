import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false
  }
};

const SELF_ROLES = [
  "1531039846871728248", // Welcome Ping
  "1531084435716571137", // Announcement Ping
  "1531104789075853472", // Streaming Ping
  "1531104886630907925", // Giveaway Ping
  "1531105107586973696", // Stock Ping
  "1551276593425682543"  // Cash Out
];

async function getRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function verifyDiscordSignature(body, signature, timestamp, publicKeyHex) {
  try {
    const publicKeyDer = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(publicKeyHex, "hex")
    ]);

    const publicKey = crypto.createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki"
    });

    return crypto.verify(
      null,
      Buffer.from(timestamp + body),
      publicKey,
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    console.error("Discord signature verification error:", error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const rawBody = await getRawBody(req);
  const body = rawBody.toString("utf8");

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    console.error("Missing Discord signature information");

    return res.status(401).send(
      "Missing Discord signature information"
    );
  }

  const valid = verifyDiscordSignature(
    body,
    signature,
    timestamp,
    publicKey
  );

  if (!valid) {
    console.error("Invalid Discord signature");

    return res.status(401).send("Invalid Discord signature");
  }

  let interaction;

  try {
    interaction = JSON.parse(body);
  } catch (error) {
    return res.status(400).send("Invalid JSON");
  }

  // Discord verification PING
  if (interaction.type === 1) {
    return res.status(200).json({
      type: 1
    });
  }

  // Self-role dropdown
  if (
    interaction.type === 3 &&
    interaction.data?.custom_id === "chuppys_self_roles"
  ) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id;

    if (!botToken || !guildId || !userId) {
      return res.status(500).json({
        error: "Missing Discord information"
      });
    }

    const selectedRoles = interaction.data.values || [];

    for (const roleId of SELF_ROLES) {
      const shouldHaveRole = selectedRoles.includes(roleId);

      const method = shouldHaveRole ? "PUT" : "DELETE";

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method,
          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        console.error(
          `Role ${roleId} failed:`,
          response.status,
          await response.text()
        );
      }
    }

    return res.status(200).json({
      type: 4,
      data: {
        content:
          "﹕𐔌・your roles have been updated〃・꒱ 🤍",
        flags: 64
      }
    });
  }

  return res.status(400).json({
    error: "Unknown interaction"
  });
}
