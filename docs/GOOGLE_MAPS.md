# Private Google Maps configuration

The local API credential is stored in `.env.local` under `GOOGLE_MAPS_API_KEY`. This file is ignored by Git and is not placed in `public/`. Keep its filesystem permissions at `0600`. `.env.example` contains only an empty placeholder.

Do not rename this variable with a `VITE_` prefix, inject it into JavaScript, or use it directly in a client-side Google Maps script URL. Vite exposes `VITE_` variables in the browser build. A GitHub Actions secret would also become public if substituted into frontend code.

The supplied credential was tested successfully against Google Maps Static API satellite imagery for Villacana and the Map Tiles API photorealistic 3D root tileset. No API response URLs or credential values were published. The credential exists only in the current private workspace; it is not configured in GitHub or production hosting.

The current deployment uses GitHub Pages, which serves static files and cannot run a private API endpoint. A live integration that keeps the key private needs a separate server-side service, with the credential set in that service’s environment. That service should return the permitted Google data to the site without returning the key. The alternative browser Maps JavaScript integration uses a visible, website-restricted key and does not satisfy a requirement that the key remain private.

The Google imagery layer is not enabled on the public site by this configuration change. No secret is committed or bundled.

Since 31 October 2026 (Dave) Google imagery itself may be used, traced from and published in this repo and on the site, credited "Imagery © Google" with the year. This changes nothing above about the key: it still stays private.
