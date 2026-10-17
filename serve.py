#!/usr/bin/env python3
# English Kids - local server with correct MIME types + no-cache (always latest files)
import http.server, socketserver, mimetypes, os, sys

mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('audio/wav', '.wav')

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.woff2': 'font/woff2', '.woff': 'font/woff',
                      '.webmanifest': 'application/manifest+json', '.webp': 'image/webp'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True

with Server(('', PORT), Handler) as httpd:
    print(f'English Kids server -> http://localhost:{PORT}/')
    httpd.serve_forever()
