import json
import os

from flask import Flask
from flask import render_template
from flask import send_from_directory


app = Flask(__name__)
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(APP_ROOT, '/data')


@app.route("/")
def index():
    return render_template("index.html")


@app.route('/data/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(APP_ROOT, 'data'), filename)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)
