import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

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

// ==================================================
// READ RAW DISCORD REQUEST
// ==================================================

async function getRawBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;

    if (total > 100000) {
      throw new Error("Request body too large.");
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

// ==================================================
// VERIFY DISCORD SIGNATURE
// ==================================================

function verifyDiscordSignature(
  body,
  signature,
  timestamp,
  publicKeyHex
) {
  try {
    if (
      typeof signature !== "string" ||
      typeof timestamp !== "string" ||
      !/^[0-9a-f]+$/i.test(signature) ||
      signature.length !== 128 ||
      !/^[0-9a-f]{64}$/i.test(publicKeyHex)
    ) {
      return false;
    }

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
      Buffer.concat([
        Buffer.from(timestamp, "utf8"),
        body
      ]),
      key,
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    console.error("Signature verification error:", error.message);
    return false;
  }
}

// ==================================================
// DISCORD API REQUEST
// ==================================================

async function discordFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();

    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Discord API request timed out after 8 seconds.");
    }

    throw new Error(`Discord API network error: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

// ==================================================
// UPDATE ORIGINAL DISCORD RESPONSE
// ==================================================

async function updateOriginalResponse(interaction, content) {
  const url =
    `https://discord.com/api/v10/webhooks/` +
    `${interaction.application_id}/` +
    `${interaction.token}/messages/@original`;

  const result = await discordFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  if (!result.ok) {
    throw new Error(
      `Could not update Discord response: HTTP ${result.status} ` +
      JSON.stringify(result.data)
    );
  }
}

// ==================================================
// ASSIGN OR REMOVE SELECTED ROLES
// ==================================================

async function changeRoles(interaction, group) {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  const guildId = interaction.guild_id;
  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;

  if (!botToken || !guildId || !userId) {
    throw new Error(
      "Missing bot token, server ID, or member ID."
    );
  }

  const values = interaction.data.values;
  const selectedRoles = new Set(values);

  // Only accept role IDs belonging to this dropdown.
  for (const roleId of selectedRoles) {
    if (!group.roles.includes(roleId)) {
      throw new Error(`Unexpected role ID: ${roleId}`);
    }
  }

  // Process one request at a time to simplify troubleshooting.
  for (const roleId of group.roles) {
    const shouldHaveRole = selectedRoles.has(roleId);

    const url =
      `https://discord.com/api/v10/guilds/${guildId}` +
      `/members/${userId}/roles/${roleId}`;

    console.log(
      `Attempting to ${shouldHaveRole ? "assign" : "remove"} ` +
      `role ${roleId} for member ${userId}`
    );

    const result = await discordFetch(url, {
      method: shouldHaveRole ? "PUT" : "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });

    if (!result.ok) {
      throw new Error(
        `Role ${roleId} failed: HTTP ${result.status} ` +
        JSON.stringify(result.data)
      );
    }

    console.log(
      `Role ${roleId} ${shouldHaveRole ? "assigned" : "removed"} successfully.`
    );
  }
}

// ==================================================
// PROCESS THE INTERACTION IN THE BACKGROUND
// ==================================================

async function processInteraction(interaction, group) {
  try {
    await changeRoles(interaction, group);

    await updateOriginalResponse(
      interaction,
      group.success
    );

    console.log(
      `Completed ${interaction.data.custom_id} for member ` +
      `${interaction.member?.user?.id || interaction.user?.id}`
    );
  } catch (error) {
    console.error("Role interaction failed:", error.message);

    try {
      await updateOriginalResponse(
        interaction,
        "﹕𐔌・role update failed. Please contact staff.〃・꒱ 🤍"
      );
    } catch (updateError) {
      console.error(
        "Could not display role error:",
        updateError.message
      );
    }
  }
}

// ==================================================
// VERCEL HANDLER
// ==================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  let body;

  try {
    body = await getRawBody(req);
  } catch (error) {
    console.error("Could not read request:", error.message);
    return res.status(400).send("Invalid request body");
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    console.error("Discord signature settings are missing.");
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
    interaction = JSON.parse(body.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // Discord endpoint verification.
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

  // Reject unexpected values before acknowledging the interaction.
  if (
    interaction.data.values.some(
      roleId => !group.roles.includes(roleId)
    )
  ) {
    return res.status(400).json({
      error: "Invalid selected role"
    });
  }

  // Acknowledge Discord immediately.
  res.status(200).json({
    type: 5,
    data: {
      flags: 64
    }
  });

  // Ask Vercel to keep the background task alive after the response.
  waitUntil(processInteraction(interaction, group));
}
