import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false
  }
};

const ROLE_GROUPS = {
  chuppys_self_roles: {
    roles: [
      "1531039846871728248", // Welcome Ping
      "1531084435716571137", // Announcement Ping
      "1531104789075853472", // Services Ping
      "1531104886630907925", // Giveaway Ping
      "1531105107586973696", // Stock Ping
      "1551276593425682543", // Cash Out Ping
      "1558913216602706011"  // Flash Sale Ping
    ],
    success: "﹕𐔌・your roles have been updated〃・꒱ 🤍"
  },

  chuppys_second_roles: {
    roles: [
      "1531084465126772877", // Under 18
      "1531084550849954003", // 18–20
      "1531084611399188640"  // 21+
    ],
    success: "﹕𐔌・your age roles have been updated〃・꒱ 🤍"
  },

  chuppys_pronoun_roles: {
    roles: [
      "1531084942241697854", // She / Her
      "1531086100867842190", // He / Him
      "1531101006451048448"  // They / Them
    ],
    success: "﹕𐔌・your pronouns have been updated〃・꒱ 🤍"
  }
};

async function getRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function verifyDiscordSignature(
  body,
  signature,
  timestamp,
  publicKeyHex
) {
  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(publicKeyHex, "hex")
      ]),
      format: "der",
      type: "spki"
    });

    return crypto.verify(
      null,
      Buffer.from(timestamp + body),
      key,
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

async function updateOriginalResponse(interaction, content) {
  const url =
    `https://discord.com/api/v10/webhooks/` +
    `${interaction.application_id}/${interaction.token}/messages/@original`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    console.error(
      "Could not update interaction response:",
      response.status,
      await response.text()
    );
  }
}

async function changeRoles(interaction, group) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id;

  if (!botToken || !guildId || !userId) {
    throw new Error("Missing bot token, server ID, or user ID.");
  }

  const selectedRoles = new Set(
    interaction.data.values || []
  );

  // Update the group's roles concurrently to save time.
  const results = await Promise.all(
    group.roles.map(async (roleId) => {
      const shouldHaveRole = selectedRoles.has(roleId);

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
        {
          method: shouldHaveRole ? "PUT" : "DELETE",
          headers: {
            Authorization: `Bot ${botToken}`
          }
        }
      );

      // Discord returns 204 when a role change succeeds.
      if (!response.ok && response.status !== 204) {
        const details = await response.text();

        console.error(
          `Role update failed (${roleId}):`,
          response.status,
          details
        );

        throw new Error(
          `A role update failed with HTTP ${response.status}.`
        );
      }
    })
  );

  return results;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  let body;

  try {
    body = (await getRawBody(req)).toString("utf8");
  } catch (error) {
    console.error("Could not read request body:", error);
    return res.status(400).send("Invalid request body");
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    return res.status(401).send("Missing signature information");
  }

  if (
    !verifyDiscordSignature(
      body,
      signature,
      timestamp,
      publicKey
    )
  ) {
    return res.status(401).send("Invalid signature");
  }

  let interaction;

  try {
    interaction = JSON.parse(body);
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // Discord endpoint verification
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  const customId = interaction.data?.custom_id;
  const group = ROLE_GROUPS[customId];

  if (
    interaction.type !== 3 ||
    !group ||
    !Array.isArray(interaction.data?.values)
  ) {
    return res.status(400).json({
      error: "Unknown interaction"
    });
  }

  // Acknowledge immediately so Discord doesn't time out.
  res.status(200).json({
    type: 5,
    data: {
      flags: 64
    }
  });

  // Continue processing and edit the deferred response.
  try {
    await changeRoles(interaction, group);

    await updateOriginalResponse(
      interaction,
      group.success
    );
  } catch (error) {
    console.error("Role interaction failed:", error);

    await updateOriginalResponse(
      interaction,
      "﹕𐔌・role update failed. Please contact staff.〃・꒱ 🤍"
    );
  }
}
