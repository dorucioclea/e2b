import asyncio
from os import getenv
from e2b import Session

# Get your API key here https://e2b.dev/docs/getting-started/api-key
E2B_API_KEY = getenv("E2B_API_KEY")

rootdir = "/code"
filepath = "/code/index.js"
code = """console.log('Hello World!')
"""

# async def init_npm(session):
#   npm_init = "npm init es6 -y"
#   proc = await session.process.start(npm_init, rootdir=rootdir, on_stdout=print, on_stderr=print)
#   await proc

async def run_code(session):
  await session.filesystem.write(filepath, code)
  proc = await session.process.start("node " + filepath, on_stdout=print, on_stderr=print)
  await proc

async def main():
  # `id` can also be one of:
  # 'Nodejs', 'Bash', 'Python3', 'Java', 'Go', 'Rust', 'PHP', 'Perl', 'DotNET'
  # We're working on custom environments.
  session = await Session.create(id="Nodejs", api_key=E2B_API_KEY)

  # await init_npm(session)
  await run_code(session)

  await session.close()

asyncio.run(main())