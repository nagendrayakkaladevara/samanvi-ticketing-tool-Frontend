# Announcement audio uploads

The Audio App uploads files to Cloudflare R2 through the backend's signed upload flow:

1. POST /announcements/audios/upload with audio metadata using the existing JWT.
2. PUT the raw file to the returned uploadUrl using the returned headers. The browser provides Content-Length. No backend JWT or R2 credentials are sent with this request.
3. POST /announcements/audios/:audioId/upload-complete using the JWT. The backend checks the stored object before making it ready.

The upload dialog shows byte progress and only reports success after verification. If verification fails after the PUT succeeds, Retry verification completes the same audio record without uploading a duplicate. Keep the dialog open to retry; closing it discards its local retry state.

The backend must be deployed with R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_BASE_URL. No R2 credentials or new storage environment variables belong in the frontend.

Configure the bucket CORS to permit the frontend origin, PUT/GET/HEAD and Content-Type/If-None-Match/Range headers. Use a public custom domain for production audio playback. Existing Vercel audio URLs continue to play while the old objects remain available; migration of those objects is separate.

Coordinate this frontend release with the backend R2 upload endpoints. Existing audio library, route playlists and welcome settings keep their playback URL fields.
