import nacl from "tweetnacl";

export const config = {
  api: {
    bodyParser: false
  }
};

// =========================
// SELF ROLE IDs
// =========================

const SELF_ROLES = [
  "1531039846871728248", // Welcome Ping
  "1531084435716571137", // Announcement Ping
  "1531104789075853472", // Streaming Ping
  "1531104886630907925", // Giveaway Ping
  "1531105107586973696", // Stock Ping
  "1551276593425682543"  // Cash Out
];

// =========================
// GET RAW REQUEST BODY
// =========================

async function getRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

// =========================
// DISCORD INTERACTIONS
// =========================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const rawBody = await getRawBody(req);

  const body = rawBody.toString("utf8");

  // =========================
  // DISCORD SIGNATURE
  // =========================

  const signature = req.headers["x-signature-ed25519"];

  const timestamp = req.headers["x-signature-timestamp"];

  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    return res.status(401).send(
      "Missing Discord signature information"
    );
  }

  const isValid = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );

  if (!isValid) {
    return res.status(401).send(
      "Invalid Discord signature"
    );
  }

  const interaction = JSON.parse(body);

  // =========================
  // DISCORD PING
  // =========================

  if (interaction.type === 1) {
    return res.status(200).json({
      type: 1
    });
  }

  // =========================
  // SELF ROLE DROPDOWN
  // =========================

  if (
    interaction.type === 3 &&
    interaction.data &&
    interaction.data.custom_id === "chuppys_self_roles"
  ) {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    const guildId = interaction.guild_id;

    const userId =
      interaction.member?.user?.id;

    if (!botToken || !guildId || !userId) {
      return res.status(500).json({
        error: "Missing Discord information"
      });
    }

    // Roles currently selected in the dropdown
    const selectedRoles =
      interaction.data.values || [];

    // =========================
    // UPDATE EVERY SELF ROLE
    // =========================

    for (const roleId of SELF_ROLES) {
      const wantsRole =
        selectedRoles.includes(roleId);

      const method =
        wantsRole ? "PUT" : "DELETE";

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method,

          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );

      if (!response.ok) {
        console.error(
          `Failed to ${wantsRole ? "add" : "remove"} role ${roleId}`,
          response.status,
          await response.text()
        );
      }
    }

    // =========================
    // PRIVATE CONFIRMATION
    // =========================

    return res.status(200).json({
      type: 4,

      data: {
        content:
          "﹕𐔌・your roles have been updated〃・꒱ 🤍",

        flags: 64
      }
    });
  }

  // =========================
  // UNKNOWN INTERACTION
  // =========================

  return res.status(400).json({
    error: "Unknown interaction"
  });

  
