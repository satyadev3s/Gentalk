import sys
from pathlib import Path

# Ensure root directory is on the python module search path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app import app

# Vercel looks for the WSGI application object 'app'
if __name__ == "__main__":
    app.run()
