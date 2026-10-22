
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

export const config = {
  api: {
    bodyParser: false
  }
};

// ==================================================
// VOUCH CHANNEL SETTINGS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";

const PERSONAL_SELLER_IDS = [
  "1530733554869473320", // Bunnii
  "1490962480963260466"  // Twxn
];

const VOUCH_EMOJI_URL =
  "https://cdn.discordapp.com/emojis/1561197586554036318.png";

// ==================================================
// SELECT THE CORRECT VOUCH CHANNEL
// ==================================================

function getVouchChannelId(sellerId) {
  if (PERSONAL_SELLER_IDS.includes(sellerId)) {
    return PERSONAL_VOUCH_CHANNEL_ID;
  }

  return VOUCH_CHANNEL_ID;
}

// ==================================================
// ROLE GROUPS
// ==================================================

const ROLE_GROUPS = {
  chuppys_self_roles: {
    roles: [
      "1531039846871728248",
      "1531084435716571137",
      "1531104789075853472",
      "1531104886630907925",
      "1531105107586973696",
      "1551276593425682543",
      "1558913216602706011"
    ],
    success: "﹕𐔌・your roles have been updated〃・꒱ 🤍"
  },

  chuppys_second_roles: {
    roles: [
      "1531084465126772877",
      "1531084550849954003",
      "1531084611399188640"
    ],
    success: "﹕𐔌・your age roles have been updated〃・꒱ 🤍"
  },

  chuppys_pronoun_roles: {
    roles: [
      "1531084942241697854",
      "1531086100867842190",
      "1531101006451048448"
    ],
    success: "﹕𐔌・your pronouns have been updated〃・꒱ 🤍"
  }
};

// ==================================================
// DEBUG
// ==================================================

console.log("[INTERACTIONS DEBUG] api/interactions.js loaded.");

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
      typeof publicKeyHex !== "string" ||
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
    console.error(
      "[INTERACTIONS DEBUG] Signature error:",
      error.message
    );

    return false;
  }
}

// ==================================================
// DISCORD API REQUEST
// ==================================================

async function discordFetch(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000);

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
      throw new Error(
        "Discord API request timed out after 8 seconds."
      );
    }

    throw new Error(
      `Discord API network error: ${error.message}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ==================================================
// UPDATE ORIGINAL INTERACTION RESPONSE
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
      `Could not update interaction response: HTTP ${result.status} ` +
      JSON.stringify(result.data)
    );
  }
}

// ==================================================
// ROLE MENU HANDLER
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

  for (const roleId of selectedRoles) {
    if (!group.roles.includes(roleId)) {
      throw new Error(`Unexpected role ID: ${roleId}`);
    }
  }

  for (const roleId of group.roles) {
    const shouldHaveRole = selectedRoles.has(roleId);

    const url =
      `https://discord.com/api/v10/guilds/${guildId}` +
      `/members/${userId}/roles/${roleId}`;

    console.log(
      `[ROLE DEBUG] ${shouldHaveRole ? "Adding" : "Removing"} ` +
      `${roleId} for ${userId}`
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

    console.log(`[ROLE DEBUG] Role ${roleId} updated.`);
  }
}

async function processRoleInteraction(interaction, group) {
  try {
    await changeRoles(interaction, group);

    await updateOriginalResponse(
      interaction,
      group.success
    );

    console.log(
      `[ROLE DEBUG] Completed ${interaction.data.custom_id}`
    );
  } catch (error) {
    console.error("[ROLE DEBUG] Failed:", error);

    try {
      await updateOriginalResponse(
        interaction,
        "﹕𐔌・role update failed. Please contact staff.〃・꒱ 🤍"
      );
    } catch (updateError) {
      console.error(
        "[ROLE DEBUG] Could not show error:",
        updateError.message
      );
    }
  }
}

// ==================================================
// VOUCH SLASH COMMAND HANDLER
// ==================================================

async function processVouchInteraction(interaction) {
  try {
    console.log("[VOUCH DEBUG] Processing /vouch.");

    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      throw new Error(
        "DISCORD_BOT_TOKEN is missing from Vercel Environment Variables."
      );
    }

    if (!interaction.guild_id) {
      throw new Error(
        "Use /vouch inside your Discord server."
      );
    }

    // Read slash-command options.
    const options = Object.fromEntries(
      (interaction.data.options || []).map(option => [
        option.name,
        option.value
      ])
    );

    const resolved = interaction.data.resolved || {};

    const sellerId = options.seller;

    const buyerId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    const rating = options.rating;
    const order = options.order?.trim();

    const proof = resolved.attachments?.[options.proof];
    const seller = resolved.users?.[sellerId];

    console.log("[VOUCH DEBUG] Command options received:", {
      sellerId,
      buyerId,
      rating,
      hasOrder: Boolean(order),
      hasProof: Boolean(proof)
    });

    // Validate buyer and seller.
    if (!sellerId || !buyerId) {
      throw new Error(
        "Could not identify the buyer or seller."
      );
    }

    if (seller?.bot) {
      throw new Error(
        "You cannot vouch for a bot."
      );
    }

    if (sellerId === buyerId) {
      throw new Error(
        "You cannot vouch for yourself."
      );
    }

    // Validate rating.
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5."
      );
    }

    // Validate order description.
    if (!order) {
      throw new Error(
        "Please enter what you purchased."
      );
    }

    if (order.length > 500) {
      throw new Error(
        "Your order description must be 500 characters or fewer."
      );
    }

    // Validate proof attachment.
    if (!proof) {
      throw new Error(
        "Please attach proof of your purchase."
      );
    }

    const isImage =
      (
        proof.content_type &&
        proof.content_type.startsWith("image/")
      ) ||
      /\.(png|jpe?g|gif|webp)$/i.test(
        proof.filename || ""
      );

    if (!isImage) {
      throw new Error(
        "Proof must be a PNG, JPG, GIF, or WEBP image."
      );
    }

    // Create the same vouch embed.
    const embed = {
      color: 0xffffff,
      title: "NEW VOUCH",

      thumbnail: {
        url: VOUCH_EMOJI_URL
      },

      description:
        `**seller:** <@${sellerId}>\n` +
        `**buyer:** <@${buyerId}>\n` +
        `**items purchased:** ${order}\n` +
        `**rating:** ${rating}/5\n` +
        `**proof:** 📎 ${proof.filename || "Purchase proof"}\n\n` +
        "*thank you for vouching! shop again ♡*",

      image: {
        url: proof.url
      },

      timestamp: new Date().toISOString()
    };

    // ==================================================
    // ROUTE BASED ON THE SELECTED SELLER'S USER ID
    // ==================================================

    const targetChannelId = getVouchChannelId(sellerId);

    const isPersonalVouch =
      targetChannelId === PERSONAL_VOUCH_CHANNEL_ID;

    console.log(
      `[VOUCH DEBUG] Selected seller ID: ${sellerId}`
    );

    console.log(
      `[VOUCH DEBUG] Vouch destination: ${
        isPersonalVouch ? "PERSONAL" : "REGULAR"
      } channel (${targetChannelId})`
    );

    // Send the vouch to exactly one selected channel.
    const result = await discordFetch(
      `https://discord.com/api/v10/channels/${targetChannelId}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          embeds: [embed],

          allowed_mentions: {
            parse: [],
            users: [sellerId, buyerId]
          }
        })
      }
    );

    if (!result.ok) {
      throw new Error(
        `Could not post the vouch: HTTP ${result.status} ` +
        JSON.stringify(result.data)
      );
    }

    console.log(
      `[VOUCH DEBUG] Vouch posted successfully. ` +
      `Message ID: ${result.data?.id || "unknown"} | ` +
      `Channel: ${targetChannelId}`
    );

    // Confirm privately to the person who submitted the vouch.
    await updateOriginalResponse(
      interaction,
      "Your vouch was submitted successfully! ♡"
    );

    console.log(
      "[VOUCH DEBUG] Completed /vouch successfully."
    );
  } catch (error) {
    console.error(
      "[VOUCH DEBUG] /vouch failed:",
      error
    );

    try {
      await updateOriginalResponse(
        interaction,
        `❌ ${error.message || "Your vouch could not be submitted."}`
      );
    } catch (updateError) {
      console.error(
        "[VOUCH DEBUG] Could not update Discord response:",
        updateError.message
      );
    }
  }
}

// ==================================================
// VERCEL INTERACTIONS ENDPOINT
// ==================================================

export default async function handler(req, res) {
  console.log(
    `[INTERACTIONS DEBUG] Received ${req.method} request.`
  );

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).send(
      "Method not allowed"
    );
  }

  let body;

  try {
    body = await getRawBody(req);
  } catch (error) {
    console.error(
      "[INTERACTIONS DEBUG] Could not read request:",
      error.message
    );

    return res.status(400).send(
      "Invalid request body"
    );
  }

  const signature =
    req.headers["x-signature-ed25519"];

  const timestamp =
    req.headers["x-signature-timestamp"];

  const publicKey =
    process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    console.error(
      "[INTERACTIONS DEBUG] Missing signature settings."
    );

    return res.status(401).send(
      "Missing signature information"
    );
  }

  if (
    !verifyDiscordSignature(
      body,
      signature,
      timestamp,
      publicKey
    )
  ) {
    console.error(
      "[INTERACTIONS DEBUG] Invalid Discord signature."
    );

    return res.status(401).send(
      "Invalid signature"
    );
  }

  let interaction;

  try {
    interaction = JSON.parse(
      body.toString("utf8")
    );
  } catch {
    return res.status(400).send(
      "Invalid JSON"
    );
  }

  console.log(
    "[INTERACTIONS DEBUG] Interaction received:",
    {
      type: interaction.type,
      command: interaction.data?.name || null,
      customId: interaction.data?.custom_id || null
    }
  );

  // ==================================================
  // DISCORD ENDPOINT VERIFICATION
  // ==================================================

  if (interaction.type === 1) {
    console.log(
      "[INTERACTIONS DEBUG] Discord PING verified."
    );

    return res.status(200).json({
      type: 1
    });
  }

  // ==================================================
  // SLASH COMMANDS
  // ==================================================

  if (interaction.type === 2) {
    const commandName = interaction.data?.name;

    if (commandName !== "vouch") {
      console.log(
        `[INTERACTIONS DEBUG] Unhandled slash command: ${commandName}`
      );

      return res.status(200).json({
        type: 4,

        data: {
          content:
            "This slash command is not configured on the Vercel endpoint.",
          flags: 64
        }
      });
    }

    console.log(
      "[VOUCH DEBUG] Acknowledging /vouch."
    );

    // Acknowledge immediately to avoid Discord timing out.
    res.status(200).json({
      type: 5,

      data: {
        flags: 64
      }
    });

    // Process the vouch after acknowledging Discord.
    waitUntil(
      processVouchInteraction(interaction)
    );

    return;
  }

  // ==================================================
  // SELECT MENUS AND OTHER MESSAGE COMPONENTS
  // ==================================================

  if (interaction.type === 3) {
    const customId =
      interaction.data?.custom_id;

    const group = ROLE_GROUPS[customId];

    if (
      !group ||
      !Array.isArray(interaction.data?.values)
    ) {
      return res.status(200).json({
        type: 4,

        data: {
          content:
            "This role menu is not configured.",
          flags: 64
        }
      });
    }

    if (
      interaction.data.values.some(
        roleId => !group.roles.includes(roleId)
      )
    ) {
      return res.status(200).json({
        type: 4,

        data: {
          content:
            "Invalid role selection.",
          flags: 64
        }
      });
    }

    // Acknowledge immediately and process role changes.
    res.status(200).json({
      type: 5,

      data: {
        flags: 64
      }
    });

    waitUntil(
      processRoleInteraction(interaction, group)
    );

    return;
  }

  // ==================================================
  // UNSUPPORTED INTERACTION TYPES
  // ==================================================

  console.log(
    `[INTERACTIONS DEBUG] Unsupported interaction type: ${interaction.type}`
  );

  return res.status(200).json({
    type: 4,

    data: {
      content:
        "This interaction type is not supported.",
      flags: 64
    }
  });
}
