import discord
from discord.ext import commands


class MusicPlayer(commands.Cog, name="Music Player"):
    def __init__(self, bot):
        self._bot = bot
    
    async def parseArgs(args: str, userVC: VoiceClient):
        userVC.play(discord.FFmpegOpusAudio(pipe=True))
    
    @commands.command(name="play")
    async def joinVC(self, ctx: commands.Context):
        if(not ctx.args):
            await ctx.reply("You must provide something to play!")
        """Join Voice Channel"""
        channel: VoiceChannel = ctx.author.voice.channel
        vc: VoiceClient = await channel.connect()
        if(not vc.is_play()):
            await parseArgs(ctx.args, vc)
        

def setup(_bot):
    _bot.add_cog(MusicPlayer(_bot))
