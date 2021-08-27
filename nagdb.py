from dotenv import load_dotenv
import os
import discord
from discord.ext import commands

load_dotenv()

bot = commands.Bot(command_prefix='?> ')

extensions = os.listdir("./Cogs")
for xd in extensions:
    if xd.endswith(".py"):
        bot.load_extension(f"Cogs.{xd[:-3]}")

@bot.event
async def on_ready():
    print('We have logged in as {0.user}'.format(bot))

bot.run(os.getenv("DISCORD_TOKEN"), bot=True, reconnect=True)