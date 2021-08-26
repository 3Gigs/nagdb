from dotenv import load_dotenv
import os
import discord

load_dotenv()

client = discord.Client()

@client.event
async def on_ready():
    print('We have logged in as {0.user}'.format(client))

client.run(os.getenv("DISCORD_TOKEN"))