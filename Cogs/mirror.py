from discord.ext import commands

class mirror(commands.Cog, name="Mirror Msg"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None
    
    @commands.command(name="mirror")
    async def send_message(self, ctx: commands.Context, arg):
        """Sends a message specified by command"""
        await ctx.send(arg)

def setup(bot):
    bot.add_cog(mirror(bot))