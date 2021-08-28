# For type hinting reasons
from discord import VoiceClient
from discord import VoiceChannel
from discord import FFmpegPCMAudio
from discord import utils
from discord.ext import commands
from validators import url
import youtube_dl
import os

class Logger(object):
    def error(self, msg):
        pass
    def debug(self, msg):
        print(msg)
    def warning(self, msg):
        print(msg)

class MusicPlayer(commands.Cog, name="Music Player"):
    """A Discord.py cog for connecting to playing music

    __init__:
        bot::commands.Bot
            The bot from discord.ext.commands
        
    Note:
        This is a cog is and therefore you probably should not use 
        any of the methods for any other uses, might break stuff.

    """
    def __init__(self, bot: commands.Bot):
        self._bot = bot
    
    async def parseArgs(self, args: str, userVC: VoiceClient) -> str:
        """Describes what the string provided is

        Args: 
            args::str
                An argument from a discord command
            userVC::VoiceClient 
                Discord VoiceClient returned by VoiceChannel.connect()

        Returns:
            A string describing what the arg is
            Here's a list of all the possible options:
                "link",
                "searchQuery",

        """
        LINK: str = "link"
        SEARCHQUERY: str = "searchQuery"

        if(url(args)):
            return SEARCHQUERY
        else:
            return LINK

    async def joinVC(self, ctx: commands.Context) -> VoiceClient:
        """Joins a voice channel given by context

        Args:
            ctx::commands.Context
        
        Returns:
            Returns the VoiceClient provided by connect(), or None if already
            connected to the channel

        """
        if ctx.voice_client is not None:
            channel: VoiceChannel = ctx.author.voice.channel
            channel.connect()
            return vc
        else:
            ctx.reply("No voice channel to connect to")
            return None

    @commands.command(name="play")
    async def playCommand(self, ctx: commands.Context, arg1):
        """Command activated when play is called"""
        vc = await self.joinVC(ctx)
        if vc is None:
            return

        ydl_opts = {
            "prefer_ffmpeg": True,
            "logger": Logger()
        }
        """
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([arg1])
        """
        vc.play(FFmpegPCMAudio("output.mp3"))

def setup(_bot):
    _bot.add_cog(MusicPlayer(_bot))
