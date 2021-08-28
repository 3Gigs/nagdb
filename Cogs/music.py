# For type hinting reasons
from discord import VoiceClient
from discord import VoiceChannel
from discord.ext import commands

class MusicPlayer(commands.Cog, name="Music Player"):
    def __init__(self, bot: commands.Bot):
        self._bot = bot
    
    """Decides what to do from args string provided
    Args: 
        args: An argument from a discord command
        userVC: Discord VoiceClient returned by VoiceChannel.connect()

    Returns:
        void
    """
    async def parseArgs(args: str, userVC: VoiceClient):
        userVC.play(discord.FFmpegOpusAudio())

    @commands.command(name="play")
    async def joinVC(self, ctx: commands.Context):
        if(not ctx.args):
            await ctx.reply("You must provide something to play!")
        """Join Voice Channel"""
        channel: VoiceChannel = ctx.author.voice.channel
        vc: VoiceClient = await channel.connect()
        if(not vc.is_playing()):
            await self.parseArgs(ctx.args, vc)
        

def setup(_bot):
    _bot.add_cog(MusicPlayer(_bot))
