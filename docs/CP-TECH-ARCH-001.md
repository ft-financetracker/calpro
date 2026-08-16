# CALPRO LOCKED TECHNOLOGY ARCHITECTURE

**Document ID:** `CP-TECH-ARCH-001`  
**Version:** `1.0.0`  
**Status:** `LOCKED`

```text
GitHub Pages PWA
        ↕ HTTPS POST
Google Apps Script Web App
        ↕ Spreadsheet Service
Google Spreadsheet Database
```

- Frontend: semantic HTML, modular CSS, vanilla ES modules.
- Calculation: client-side for instant results.
- Offline: Service Worker plus localStorage queue.
- Backend: Apps Script validation, idempotency, locking, audit.
- Database: separate CalPro Spreadsheet.
- Identity fields: `USER_ID`, `TENANT_ID`, `APP_ID` from first release.
- Responsive: one codebase, desktop ≥901px, tablet 641–900px, mobile ≤640px.
