const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

// ==================================================
// RENDER WEB SERVER
// ==================================================

const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    res.end("Chuppys bot is running!");
  })
  .listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
  });

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==================================================
// CONFIG
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN?.trim();

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

const WELCOME_ROLE_ID = "1531039846871728248";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// PAYMENT INFORMATION
// ==================================================

const PAYMENT_INFO = {
  cashapp: "$yysluvv",
  paypal: "PayPal.me/twxnsrevenge",
  applepay: "929-554-5969",
  zelle: "631-401-8951"
};

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, (bot) => {
  console.log("====================================");
  console.log("✅ CHUPPYS BOT IS ONLINE");
  console.log(`🤖 Bot: ${bot.user.tag}`);
  console.log(`🆔 Bot ID: ${bot.user.id}`);
  console.log(`🏠 Servers: ${bot.guilds.cache.size}`);
  console.log("====================================");
});

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(
    `👋 MEMBER JOIN DETECTED: ${member.user.tag} (${member.id})`
  );

  try {
    const channel = await member.guild.channels
      .fetch(WELCOME_CHANNEL_ID)
      .catch(() => null);

    if (!channel) {
      console.error(
        `❌ Welcome channel ${WELCOME_CHANNEL_ID} was not found.`
      );
      return;
    }

    // ----------------------------------------------
    // ADD WELCOME ROLE
    // ----------------------------------------------

    try {
      const role = await member.guild.roles
        .fetch(WELCOME_ROLE_ID)
        .catch(() => null);

      if (role) {
        await member.roles.add(role);
        console.log(
          `✅ Added welcome role to ${member.user.tag}`
        );
      } else {
        console.error(
          `❌ Welcome role ${WELCOME_ROLE_ID} was not found.`
        );
      }
    } catch (roleError) {
      console.error("❌ Could not add welcome role:");
      console.error(roleError);
    }

    // ----------------------------------------------
    // WELCOME EMBED
    // ----------------------------------------------

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 welcome to .gg/chuppys")
      .setDescription(
        `welcome ${member}!\n\n` +
        `we hope you enjoy your stay here 🤍`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: `.gg/chuppys`
      })
      .setTimestamp();

    await channel.send({
      content: `<@&${WELCOME_ROLE_ID}> ${member}`,
      embeds: [welcomeEmbed]
    });

    console.log(
      `✅ Welcome message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error("❌ WELCOME ERROR:");
    console.error(error);
  }
});

// ==================================================
// GOODBYE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  console.log(
    `👋 MEMBER LEAVE DETECTED: ${member.user.tag} (${member.id})`
  );

  try {
    const channel = await member.guild.channels
      .fetch(GOODBYE_CHANNEL_ID)
      .catch(() => null);

    if (!channel) {
      console.error(
        `❌ Goodbye channel ${GOODBYE_CHANNEL_ID} was not found.`
      );
      return;
    }

    const goodbyeEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 goodbye")
      .setDescription(
        `${member.user} has left **.gg/chuppys**.\n\n` +
        `we'll miss you 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({ dynamic: true })
      )
      .setFooter({
        text: `.gg/chuppys`
      })
      .setTimestamp();

    await channel.send({
      embeds: [goodbyeEmbed]
    });

    console.log(
      `✅ Goodbye message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error("❌ GOODBYE ERROR:");
    console.error(error);
  }
});

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (message.content.toLowerCase() === "!testwelcome") {
    console.log(
      `🧪 !testwelcome used by ${message.author.tag}`
    );

    try {
      const channel = await message.guild.channels
        .fetch(WELCOME_CHANNEL_ID)
        .catch(() => null);

      if (!channel) {
        return message.reply(
          "❌ I couldn't find the welcome channel."
        );
      }

      const welcomeEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 welcome to .gg/chuppys")
        .setDescription(
          `welcome ${message.author}!\n\n` +
          `we hope you enjoy your stay here 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setImage(WELCOME_IMAGE)
        .setFooter({
          text: `.gg/chuppys`
        })
        .setTimestamp();

      await channel.send({
        content: `<@&${WELCOME_ROLE_ID}> ${message.author}`,
        embeds: [welcomeEmbed]
      });

      await message.reply(
        "✅ Test welcome message sent."
      );
    } catch (error) {
      console.error("❌ TEST WELCOME ERROR:");
      console.error(error);

      await message.reply(
        "❌ Something went wrong sending the test welcome."
      );
    }

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (message.content.toLowerCase() === "!testgoodbye") {
    console.log(
      `🧪 !testgoodbye used by ${message.author.tag}`
    );

    try {
      const channel = await message.guild.channels
        .fetch(GOODBYE_CHANNEL_ID)
        .catch(() => null);

      if (!channel) {
        return message.reply(
          "❌ I couldn't find the goodbye channel."
        );
      }

      const goodbyeEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 goodbye")
        .setDescription(
          `${message.author} has left **.gg/chuppys**.\n\n` +
          `we'll miss you 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setFooter({
          text: `.gg/chuppys`
        })
        .setTimestamp();

      await channel.send({
        embeds: [goodbyeEmbed]
      });

      await message.reply(
        "✅ Test goodbye message sent."
      );
    } catch (error) {
      console.error("❌ TEST GOODBYE ERROR:");
      console.error(error);

      await message.reply(
        "❌ Something went wrong sending the test goodbye."
      );
    }

    return;
  }

  // ==================================================
  // ,PAY COMMAND
  // Example:
  // ,pay 25
  // ==================================================

  if (message.content.toLowerCase().startsWith(",pay")) {
    console.log(
      `💰 PAY COMMAND USED BY ${message.author.tag}`
    );

    const args = message.content.trim().split(/\s+/);

    if (!args[1]) {
      return message.reply(
        "❌ Please enter an amount.\nExample: `,pay 25`"
      );
    }

    let amount = args[1].replace("$", "").trim();

    // Only allow valid money amounts
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      return message.reply(
        "❌ Invalid amount.\nExample: `,pay 25`"
      );
    }

    amount = Number(amount).toFixed(2);

    // ----------------------------------------------
    // PAYMENT BUTTONS
    // ----------------------------------------------

    const paymentRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_cashapp_${amount}`)
        .setLabel("﹕𐔌・cash app 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_paypal_${amount}`)
        .setLabel("﹕𐔌・paypal 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_applepay_${amount}`)
        .setLabel("﹕𐔌・apple pay 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_zelle_${amount}`)
        .setLabel("﹕𐔌・zelle 〃・꒱")
        .setStyle(ButtonStyle.Secondary)
    );

    // ----------------------------------------------
    // PAYMENT EMBED
    // ----------------------------------------------

    const paymentEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 payment methods")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `select your preferred payment method below.`
      )
      .setFooter({
        text: `.gg/chuppys`
      })
      .setTimestamp();

    try {
      await message.channel.send({
        embeds: [paymentEmbed],
        components: [paymentRow]
      });

      console.log(
        `✅ Payment menu sent for $${amount}`
      );
    } catch (error) {
      console.error("❌ PAYMENT MENU ERROR:");
      console.error(error);

      await message.reply(
        "❌ I couldn't send the payment menu."
      );
    }

    return;
  }
});

// ==================================================
// PAYMENT BUTTONS
// ==================================================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  console.log(
    `🔘 BUTTON PRESSED: ${customId} by ${interaction.user.tag}`
  );

  // ==================================================
  // CASH APP
  // ==================================================

  if (customId.startsWith("payment_cashapp_")) {
    const amount = customId.replace(
      "payment_cashapp_",
      ""
    );

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 cash app")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**cash app:** ${PAYMENT_INFO.cashapp}\n\n` +
        `send **$${amount}** to the Cash App above.`
      )
      .setFooter({
        text: `.gg/chuppys`
      });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  // ==================================================
  // PAYPAL
  // ==================================================

  if (customId.startsWith("payment_paypal_")) {
    const amount = customId.replace(
      "payment_paypal_",
      ""
    );

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 paypal")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**paypal:** ${PAYMENT_INFO.paypal}\n\n` +
        `send **$${amount}** to the PayPal above.`
      )
      .setFooter({
        text: `.gg/chuppys`
      });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  // ==================================================
  // APPLE PAY
  // ==================================================

  if (customId.startsWith("payment_applepay_")) {
    const amount = customId.replace(
      "payment_applepay_",
      ""
    );

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 apple pay")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**apple pay:** ${PAYMENT_INFO.applepay}\n\n` +
        `send **$${amount}** to the Apple Pay number above.`
      )
      .setFooter({
        text: `.gg/chuppys`
      });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  // ==================================================
  // ZELLE
  // ==================================================

  if (customId.startsWith("payment_zelle_")) {
    const amount = customId.replace(
      "payment_zelle_",
      ""
    );

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 zelle")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**zelle:** ${PAYMENT_INFO.zelle}\n\n` +
        `send **$${amount}** to the Zelle number above.`
      )
      .setFooter({
        text: `.gg/chuppys`
      });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
});

// ==================================================
// DISCORD DEBUG EVENTS
// ==================================================

client.on("debug", (info) => {
  console.log(`🔧 DISCORD DEBUG: ${info}`);
});

client.on("warn", (info) => {
  console.warn(`⚠️ DISCORD WARNING: ${info}`);
});

client.on("shardConnecting", (id) => {
  console.log(`🔌 Shard ${id} connecting to Discord...`);
});

client.on("shardReady", (id) => {
  console.log(`✅ Shard ${id} connected and ready.`);
});

client.on("shardReconnecting", (id) => {
  console.log(`🔄 Shard ${id} reconnecting...`);
});

client.on("shardError", (error, id) => {
  console.error(`❌ Shard ${id} error:`);
  console.error(error);
});

// ==================================================
// PROCESS ERRORS
// ==================================================

process.on("unhandledRejection", (error) => {
  console.error("❌ UNHANDLED REJECTION:");
  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:");
  console.error(error);
});

// ==================================================
// DISCORD CONNECTION
// ==================================================

if (!TOKEN) {
  console.error("====================================");
  console.error("❌ DISCORD_BOT_TOKEN IS MISSING");
  console.error("Add DISCORD_BOT_TOKEN to Render Environment Variables.");
  console.error("====================================");

  process.exit(1);
}

console.log("====================================");
console.log("🔐 DISCORD TOKEN FOUND");
console.log(`TOKEN LENGTH: ${TOKEN.length}`);
console.log("====================================");

// ==================================================
// TEST DISCORD REST API FIRST
// ==================================================

async function connectToDiscord() {
  try {
    console.log("🌐 Testing Discord REST API...");

    const userResponse = await fetch(
      "https://discord.com/api/v10/users/@me",
      {
        method: "GET",
        headers: {
          Authorization: `Bot ${TOKEN}`
        }
      }
    );

    console.log(
      `DISCORD REST STATUS: ${userResponse.status}`
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();

      console.error(
        "❌ DISCORD REST TOKEN TEST FAILED"
      );

      console.error(
        `Discord response: ${errorText}`
      );

      if (userResponse.status === 401) {
        console.error(
          "❌ The bot token is invalid or expired."
        );
      }

      return;
    }

    const botUser = await userResponse.json();

    console.log("✅ DISCORD REST TOKEN TEST PASSED");
    console.log(`🤖 Discord account: ${botUser.username}`);
    console.log(`🆔 Discord ID: ${botUser.id}`);

    // ==================================================
    // TEST GATEWAY REST ENDPOINT
    // ==================================================

    console.log("🌐 Testing Discord Gateway API...");

    const gatewayResponse = await fetch(
      "https://discord.com/api/v10/gateway/bot",
      {
        method: "GET",
        headers: {
          Authorization: `Bot ${TOKEN}`
        }
      }
    );

    console.log(
      `DISCORD GATEWAY API STATUS: ${gatewayResponse.status}`
    );

    if (!gatewayResponse.ok) {
      const gatewayError =
        await gatewayResponse.text();

      console.error(
        "❌ Discord Gateway API test failed:"
      );
      console.error(gatewayError);

      return;
    }

    const gatewayData =
      await gatewayResponse.json();

    console.log("✅ DISCORD GATEWAY API TEST PASSED");
    console.log(
      `Gateway URL: ${gatewayData.url}`
    );

    // ==================================================
    // CONNECT THROUGH DISCORD.JS
    // ==================================================

    console.log("🔌 Connecting to Discord Gateway...");
    console.log("⏳ Waiting for Discord clientReady...");

    await client.login(TOKEN);

    console.log(
      "✅ client.login() completed successfully."
    );
  } catch (error) {
    console.error("====================================");
    console.error("❌ DISCORD CONNECTION ERROR");
    console.error(error);
    console.error("====================================");
  }
}

// ==================================================
// START BOT
// ==================================================

connectToDiscord();
