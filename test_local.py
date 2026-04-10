# -*- coding: utf-8 -*-
"""
Point HVAC App - Yerel Test Sunucusu
www/ klasorunu tarayicida test etmek icin.
Kullanim: python test_local.py
Tarayicide: http://localhost:8082
"""

import http.server
import os
import webbrowser
import threading

PORT = 8082
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'www')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


def main():
    with http.server.HTTPServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Point HVAC Test Sunucusu')
        print(f'Adres: http://localhost:{PORT}')
        print(f'Telefon: http://<IP_ADRESINIZ>:{PORT}')
        print(f'Kapatmak icin Ctrl+C')
        print()

        # Tarayiciyi ac
        threading.Timer(0.5, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nSunucu kapatildi.')


if __name__ == '__main__':
    main()
