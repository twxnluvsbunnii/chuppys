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

const SECOND_ROLES = [
  "1531084465126772877", // -18
  "1531084550849954003", // 18-20
  "1531084611399188640"  // 21+
];

const PRONOUN_ROLES = [
  "1531084942241697854", // she/her
  "1531086100867842190", // he/him
  "1531101006451048448"  // they/them
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
    return res.status(401).send("Missing Discord signature information");
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

  // Discord PING
  if (interaction.type === 1) {
    return res.status(200).json({
      type: 1
    });
  }

  // ==========================================
  // SELF ROLES
  // ==========================================

  if (
    interaction.type === 3 &&
    interaction.data?.custom_id === "chuppys_self_roles"
  ) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id;

    const selectedRoles = interaction.data.values || [];

    for (const roleId of SELF_ROLES) {
      const shouldHaveRole = selectedRoles.includes(roleId);

      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: shouldHaveRole ? "PUT" : "DELETE",
          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );
    }

    return res.status(200).json({
      type: 4,
      data: {
        content: "﹕𐔌・your roles have been updated〃・꒱ 🤍",
        flags: 64
      }
    });
  }

  // ==========================================
  // AGE ROLES
  // ==========================================

  if (
    interaction.type === 3 &&
    interaction.data?.custom_id === "chuppys_second_roles"
  ) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id;

    const selectedRoles = interaction.data.values || [];

    for (const roleId of SECOND_ROLES) {
      const shouldHaveRole = selectedRoles.includes(roleId);

      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: shouldHaveRole ? "PUT" : "DELETE",
          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );
    }

    return res.status(200).json({
      type: 4,
      data: {
        content: "﹕𐔌・your age roles have been updated〃・꒱ 🤍",
        flags: 64
      }
    });
  }

  // ==========================================
  // PRONOUN ROLES
  // ==========================================

  if (
    interaction.type === 3 &&
    interaction.data?.custom_id === "chuppys_pronoun_roles"
  ) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;
    const userId = interaction.member?.user?.id;

    const selectedRoles = interaction.data.values || [];

    for (const roleId of PRONOUN_ROLES) {
      const shouldHaveRole = selectedRoles.includes(roleId);

      await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: shouldHaveRole ? "PUT" : "DELETE",
          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );
    }

    return res.status(200).json({
      type: 4,
      data: {
        content: "﹕𐔌・your pronouns have been updated〃・꒱ 🤍",
        flags: 64
      }
    });
  }

  // ==========================================
  // UNKNOWN INTERACTION
  // ==========================================

  return res.status(400).json({
    error: "Unknown interaction"
  });
}
