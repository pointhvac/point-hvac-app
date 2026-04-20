# -*- coding: utf-8 -*-
"""
Point HVAC App - Yerel Test Sunucusu
www/ klasorunu tarayicida test etmek icin.
Kullanim: python test_local.py
Tarayicide: http://localhost:8090
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading

PORT = 8092
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'www')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    # Port mesgulse once eski process'i oldurelim
    try:
        import subprocess
        result = subprocess.run(
            ['netstat', '-ano'],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            if f':{PORT}' in line and 'LISTENING' in line:
                pid = line.strip().split()[-1]
                if pid.isdigit() and int(pid) != os.getpid():
                    subprocess.run(['taskkill', '/PID', pid, '/F'],
                                   capture_output=True, timeout=5)
                    print(f'Eski sunucu (PID {pid}) kapatildi.')
    except Exception:
        pass

    httpd = ReusableTCPServer(('0.0.0.0', PORT), Handler)

    print(f'Point HVAC Test Sunucusu')
    print(f'Adres: http://localhost:{PORT}')
    print(f'Telefon: http://<IP_ADRESINIZ>:{PORT}')
    print(f'Kapatmak icin Ctrl+C veya terminali kapat')
    print()

    threading.Timer(0.5, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print('\nSunucu kapatildi.')
        sys.exit(0)


if __name__ == '__main__':
    main()
