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

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Chuppys bot is running!");
});

server.listen(PORT, "0.0.0.0", () => {
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
// HELPER - GET CHANNEL
// ==================================================

async function getChannel(guild, channelId) {
  try {
    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      return null;
    }

    if (!channel.isTextBased()) {
      return null;
    }

    return channel;
  } catch (error) {
    console.error(
      `❌ Could not fetch channel ${channelId}:`
    );
    console.error(error);
    return null;
  }
}

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, (bot) => {
  console.log("");
  console.log("====================================");
  console.log("🤍 CHUPPYS BOT IS ONLINE");
  console.log("====================================");
  console.log(`🤖 Bot: ${bot.user.tag}`);
  console.log(`🆔 Bot ID: ${bot.user.id}`);
  console.log(`🏠 Servers: ${bot.guilds.cache.size}`);
  console.log("====================================");
  console.log("");
});

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(
    `👋 MEMBER JOIN DETECTED: ${member.user.tag}`
  );

  try {
    // ----------------------------------------------
    // GET WELCOME CHANNEL
    // ----------------------------------------------

    const channel = await getChannel(
      member.guild,
      WELCOME_CHANNEL_ID
    );

    if (!channel) {
      console.error(
        `❌ Welcome channel ${WELCOME_CHANNEL_ID} not found.`
      );
      return;
    }

    // ----------------------------------------------
    // ADD WELCOME ROLE
    // ----------------------------------------------

    try {
      const role = await member.guild.roles.fetch(
        WELCOME_ROLE_ID
      );

      if (!role) {
        console.error(
          `❌ Welcome role ${WELCOME_ROLE_ID} not found.`
        );
      } else {
        await member.roles.add(role);

        console.log(
          `✅ Welcome role added to ${member.user.tag}`
        );
      }
    } catch (roleError) {
      console.error(
        "❌ Could not add welcome role."
      );
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
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true,
          size: 256
        })
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
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
    `👋 MEMBER LEAVE DETECTED: ${member.user.tag}`
  );

  try {
    // ----------------------------------------------
    // GET GOODBYE CHANNEL
    // ----------------------------------------------

    const channel = await getChannel(
      member.guild,
      GOODBYE_CHANNEL_ID
    );

    if (!channel) {
      console.error(
        `❌ Goodbye channel ${GOODBYE_CHANNEL_ID} not found.`
      );
      return;
    }

    // ----------------------------------------------
    // GOODBYE EMBED
    // ----------------------------------------------

    const goodbyeEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 goodbye")
      .setDescription(
        `${member.user} has left **.gg/chuppys**.\n\n` +
        `we'll miss you 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true,
          size: 256
        })
      )
      .setFooter({
        text: ".gg/chuppys"
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

  if (!message.guild) return;

  const command = message.content.trim();

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (command.toLowerCase() === "!testwelcome") {
    console.log(
      `🧪 !testwelcome used by ${message.author.tag}`
    );

    try {
      const channel = await getChannel(
        message.guild,
        WELCOME_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "❌ I couldn't find the welcome channel."
        );
        return;
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
            dynamic: true,
            size: 256
          })
        )
        .setImage(WELCOME_IMAGE)
        .setFooter({
          text: ".gg/chuppys"
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
      console.error(
        "❌ TEST WELCOME ERROR:"
      );
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

  if (command.toLowerCase() === "!testgoodbye") {
    console.log(
      `🧪 !testgoodbye used by ${message.author.tag}`
    );

    try {
      const channel = await getChannel(
        message.guild,
        GOODBYE_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "❌ I couldn't find the goodbye channel."
        );
        return;
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
            dynamic: true,
            size: 256
          })
        )
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        embeds: [goodbyeEmbed]
      });

      await message.reply(
        "✅ Test goodbye message sent."
      );
    } catch (error) {
      console.error(
        "❌ TEST GOODBYE ERROR:"
      );
      console.error(error);

      await message.reply(
        "❌ Something went wrong sending the test goodbye."
      );
    }

    return;
  }

  // ==================================================
  // ,PAY
  //
  // Example:
  // ,pay 25
  // ==================================================

  if (
    command.toLowerCase() === ",pay" ||
    command.toLowerCase().startsWith(",pay ")
  ) {
    console.log(
      `💰 ,pay used by ${message.author.tag}`
    );

    const args = command.split(/\s+/);

    // ----------------------------------------------
    // NO AMOUNT
    // ----------------------------------------------

    if (!args[1]) {
      await message.reply(
        "❌ Please enter an amount.\n\n" +
        "Example: `,pay 25`"
      );

      return;
    }

    // ----------------------------------------------
    // CLEAN AMOUNT
    // ----------------------------------------------

    let amount = args[1]
      .replace("$", "")
      .trim();

    // ----------------------------------------------
    // VALIDATE AMOUNT
    // ----------------------------------------------

    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      await message.reply(
        "❌ Invalid amount.\n\n" +
        "Example: `,pay 25`"
      );

      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      await message.reply(
        "❌ The amount must be greater than $0."
      );

      return;
    }

    amount = numericAmount.toFixed(2);

    // ----------------------------------------------
    // PAYMENT BUTTONS
    // ----------------------------------------------

    const paymentRow =
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(
            `payment_cashapp_${amount}`
          )
          .setLabel(
            "﹕𐔌・cash app 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_paypal_${amount}`
          )
          .setLabel(
            "﹕𐔌・paypal 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_applepay_${amount}`
          )
          .setLabel(
            "﹕𐔌・apple pay 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_zelle_${amount}`
          )
          .setLabel(
            "﹕𐔌・zelle 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          )

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
        text: ".gg/chuppys"
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
      console.error(
        "❌ PAYMENT MENU ERROR:"
      );
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

client.on(
  Events.InteractionCreate,
  async (interaction) => {

    if (!interaction.isButton()) return;

    const customId =
      interaction.customId;

    console.log(
      `🔘 BUTTON PRESSED: ${customId}`
    );

    // ==================================================
    // CASH APP
    // ==================================================

    if (
      customId.startsWith(
        "payment_cashapp_"
      )
    ) {
      const amount =
        customId.replace(
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
          text: ".gg/chuppys"
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return;
    }

    // ==================================================
    // PAYPAL
    // ==================================================

    if (
      customId.startsWith(
        "payment_paypal_"
      )
    ) {
      const amount =
        customId.replace(
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
          text: ".gg/chuppys"
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return;
    }

    // ==================================================
    // APPLE PAY
    // ==================================================

    if (
      customId.startsWith(
        "payment_applepay_"
      )
    ) {
      const amount =
        customId.replace(
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
          text: ".gg/chuppys"
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return;
    }

    // ==================================================
    // ZELLE
    // ==================================================

    if (
      customId.startsWith(
        "payment_zelle_"
      )
    ) {
      const amount =
        customId.replace(
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
          text: ".gg/chuppys"
        });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      return;
    }
  }
);

// ==================================================
// DISCORD DEBUG
// ==================================================

client.on("debug", (info) => {
  console.log(
    `🔧 DISCORD DEBUG: ${info}`
  );
});

client.on("warn", (info) => {
  console.warn(
    `⚠️ DISCORD WARNING: ${info}`
  );
});

client.on("shardConnecting", (id) => {
  console.log(
    `🔌 Shard ${id} connecting to Discord...`
  );
});

client.on("shardReady", (id) => {
  console.log(
    `✅ Shard ${id} connected and ready.`
  );
});

client.on("shardReconnecting", (id) => {
  console.log(
    `🔄 Shard ${id} reconnecting...`
  );
});

client.on("shardError", (error, id) => {
  console.error(
    `❌ Shard ${id} error:`
  );

  console.error(error);
});

// ==================================================
// PROCESS ERRORS
// ==================================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "❌ UNHANDLED REJECTION:"
    );

    console.error(error);
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ UNCAUGHT EXCEPTION:"
    );

    console.error(error);
  }
);

// ==================================================
// TOKEN CHECK
// ==================================================

if (!TOKEN) {
  console.error("");
  console.error(
    "===================================="
  );
  console.error(
    "❌ DISCORD_BOT_TOKEN IS MISSING"
  );
  console.error(
    "===================================="
  );
  console.error(
    "Add DISCORD_BOT_TOKEN to Render Environment Variables."
  );
  console.error("");

  process.exit(1);
}

// ==================================================
// DIRECT DISCORD LOGIN
// ==================================================

console.log("");
console.log(
  "===================================="
);
console.log(
  "🔐 DISCORD TOKEN FOUND"
);
console.log(
  `TOKEN LENGTH: ${TOKEN.length}`
);
console.log(
  "🔌 CONNECTING DIRECTLY TO DISCORD..."
);
console.log(
  "===================================="
);
console.log("");

client
  .login(TOKEN)
  .then(() => {
    console.log(
      "✅ Discord login request completed."
    );
  })
  .catch((error) => {
    console.error("");
    console.error(
      "===================================="
    );
    console.error(
      "❌ DISCORD LOGIN FAILED"
    );
    console.error(error);
    console.error(
      "===================================="
    );
    console.error("");
  });
