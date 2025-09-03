VanilaCoin Frontend SPA

Files:
- index.html
- styles.css
- app.js
- README.md

How to use:
1. Unzip and serve the directory using any static server.
   Example: `npx http-server . -p 8080` or `python3 -m http.server 8080`
2. Open http://localhost:8080 in your browser.
3. Ensure your backend API is running at http://localhost:3000 (or adjust API_BASE in app.js).

Security notes:
- This demo stores JWT in localStorage for simplicity. For production, prefer httpOnly secure cookies for tokens.
- Serve the frontend over HTTPS in production.
- Backend enforces CORS and IP filtering.
