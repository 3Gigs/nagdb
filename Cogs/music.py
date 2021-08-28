# For type hinting reasons
from discord import VoiceClient
from discord import VoiceChannel
from discord import FFmpegPCMAudio
from discord import utils
from discord.ext import commands
from asyncio import get_event_loop
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
        if ctx.voice_client is None:
            if ctx.author.voice:
                channel: VoiceChannel = ctx.author.voice.channel
                return await channel.connect() 
            else:
                await ctx.reply("No voice channel to connect to")
                return None
        else:
            return ctx.voice_client

    @commands.command(name="play")
    async def playCommand(self, ctx: commands.Context, arg1):
        """Command activated when play is called"""
        vc = await self.joinVC(ctx)
        if vc is None:
            return

        if vc.is_playing():
            vc.stop()
            
        ydl_opts= {
        'format': 'bestaudio/best',
        'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
        'restrictfilenames': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'quiet': True,
        'no_warnings': True,
        'default_search': 'auto',
        'source_address': '0.0.0.0'
        }
        ffmpeg_options = {
            'options': '-vn'
        }
        with youtube_dl.YoutubeDL(ydl_opts) as ytdl:
            data = ytdl.extract_info(arg1, download = False)
            url = data['url']
            vc.play(FFmpegPCMAudio(url))

def setup(_bot):
    _bot.add_cog(MusicPlayer(_bot))
