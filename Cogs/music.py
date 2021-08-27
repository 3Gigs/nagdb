import discord
from discord.ext import commands


class MusicPlayer(commands.Cog, name="Music Player"):
    def __init__(self, bot):
        self._bot = bot
    
    async def parseArgs(args: str):
        print("br")
    
    @commands.command(name="play")
    async def joinVC(self, ctx: commands.Context):
        if(ctx.args):
            await ctx.reply("You must provide something to play!")
        """Join Voice Channel"""
        channel: VoiceChannel = ctx.author.voice.channel
        await channel.connect()
        parseArgs(ctx.args)
        

def setup(_bot):
    _bot.add_cog(MusicPlayer(_bot))
