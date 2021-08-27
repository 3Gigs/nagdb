import discord
from discord.ext import commands


class MusicPlayer(commands.Cog, name="Music Player"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None
    
    @commands.command(name="play")
    async def joinVC(self, ctx: commands.Context, arg):
        """Join Voice Channel"""
        channel: VoiceChannel = ctx.author.voice.channel
        await channel.connect()
        

def setup(bot):
    bot.add_cog(MusicPlayer(bot))
