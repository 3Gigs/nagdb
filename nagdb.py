from dotenv import load_dotenv
import os
import discord
import logging
from discord.ext import commands

load_dotenv()

logger = logging.getLogger("discord")
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename="discord.log", encoding="utf-8", mode="w")
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)

bot = commands.Bot(command_prefix='?> ')

extensions = os.listdir("./Cogs")
for xd in extensions:
    if xd.endswith(".py"):
        bot.load_extension(f"Cogs.{xd[:-3]}")

"""Function to hot reload cogs"""
@commands.command(name="reload")
async def reload(ctx):
    for xd in extensions:
        if xd.endswith(".py"):
            try:
                bot.reload_extension(f"Cogs.{xd[:-3]}")
            except ExtensionNotLoaded:
                bot.load_extension(f"Cogs.{xd[:-3]}")
    await ctx.send("Cogs reloaded")

bot.add_command(reload) 


@bot.event
async def on_ready():
    print('We have logged in as {0.user}'.format(bot))
    if(not discord.opus.is_loaded()):
        discord.opus.load_opus("libopus.so")

bot.run(os.getenv("DISCORD_TOKEN"), bot=True, reconnect=True)