#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lumber & Fishery Empire Tycoon 3D - Universal Launcher
Tự động khởi động máy chủ game và mở trình duyệt web.
Tương thích hoàn hảo với cả môi trường Node.js và Python thuần.
"""

import os
import sys
import shutil
import subprocess
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = 8000
HOST = "127.0.0.1"

def run_node_server():
    """Khởi động Node.js backend với đầy đủ tính năng WebSocket Multiplayer và MongoDB Atlas"""
    node_bin = shutil.which("node")
    if not node_bin:
        return False
    
    server_js = os.path.join(BASE_DIR, "server.js")
    if not os.path.exists(server_js):
        return False

    print("===================================================================")
    print("  🌲 KHỞI ĐỘNG MÁY CHỦ LUMBER & EMPIRE TYCOON 3D (NODE.JS) 🌲")
    print("===================================================================")
    print(f"[*] Đang thực thi: node server.js")
    try:
        subprocess.run([node_bin, server_js])
        return True
    except KeyboardInterrupt:
        print("\n[*] Đã dừng máy chủ Node.js.")
        return True
    except Exception as e:
        print(f"[!] Lỗi khi chạy Node.js: {e}. Đang chuyển sang chế độ Python HTTP...")
        return False

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        public_dir = os.path.join(BASE_DIR, "public")
        directory = public_dir if os.path.exists(public_dir) else BASE_DIR
        self.extensions_map.update({
            '.glb': 'model/gltf-binary',
            '.gltf': 'model/gltf+json',
        })
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Giảm thiểu log rác terminal
        pass

def run_python_server():
    """Dự phòng máy chủ Python HTTP nếu máy tính chưa cài Node.js"""
    global PORT
    for p in range(PORT, PORT + 20):
        try:
            httpd = HTTPServer((HOST, p), CustomHandler)
            PORT = p
            break
        except OSError:
            continue

    url = f"http://{HOST}:{PORT}/index.html"
    print("===================================================================")
    print("  🌲 MÁY CHỦ LUMBER TYCOON 3D (PYTHON HTTP ENGINE) 🌲")
    print("===================================================================")
    print(f"  [+] Đang chạy tại: {url}")
    print("  [*] Trình duyệt web sẽ tự động mở trong giây lát...")
    print("  [*] Nhấn Ctrl + C để dừng máy chủ bất cứ lúc nào.")
    print("===================================================================")

    def open_browser():
        time.sleep(1.0)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Đã dừng máy chủ Python HTTP.")

if __name__ == "__main__":
    if not run_node_server():
        run_python_server()

