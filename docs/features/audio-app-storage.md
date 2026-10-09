# Announcement audio uploads

The Audio App uploads files to Cloudflare R2 through the backend's signed upload flow:

1. POST /announcements/audios/upload with audio metadata using the existing JWT.
2. PUT the raw file to the returned uploadUrl using the returned headers. The browser provides Content-Length. No backend JWT or R2 credentials are sent with this request.
3. POST /announcements/audios/:audioId/upload-complete using the JWT. The backend checks the stored object before making it ready.

The upload dialog shows byte progress and only reports success after verification. If verification fails after the PUT succeeds, Retry verification completes the same audio record without uploading a duplicate. Keep the dialog open to retry; closing it discards its local retry state.

Starting an upload or retry automatically scrolls the popup to its progress panel after it mounts. The scroll is smooth unless reduced motion is enabled, and is not repeated for every percentage update.

For Dinner Break and Toilet Break, choose **Dinner Break** or **Toilet Break** in the upload Category dropdown and click **Upload and map**. The file is uploaded as Common audio, verified, then mapped to that app button using `PUT /announcements/audios/:audioId/break-mapping`. This replaces only that button's selection and keeps the old audio in the library. Configuring mappings requires the Mobile settings permission; users without it can still upload regular Common audio.

For an already-uploaded Common audio file, click **Map to app**, choose the button and **Save mapping**. The dialog also supports both buttons or Not mapped. Moving one file from one break button to the other removes its previous mapping, without clearing mappings belonging to other files. Mobile settings remains an alternative way to configure the same assignments.

If upload verification succeeds but mapping fails, the ready file remains in the library. **Retry mapping** retries completion (idempotently) and mapping without another storage upload; **Map to app** can also finish the mapping later. Deploy the backend mapping endpoint before this frontend. There is no new category enum or database migration for this feature.

The backend must be deployed with R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_BASE_URL. No R2 credentials or new storage environment variables belong in the frontend.

Configure the bucket CORS to permit the frontend origin, PUT/GET/HEAD and Content-Type/If-None-Match/Range headers. Use a public custom domain for production audio playback. Existing Vercel audio URLs continue to play while the old objects remain available; migration of those objects is separate.

Coordinate this frontend release with the backend R2 upload endpoints. Existing audio library, route playlists and welcome settings keep their playback URL fields.

## Delete and restore

The Audio library now has **Audio library** and **Recently deleted** views. Delete asks for confirmation, then moves an unused audio file to Recently deleted. The file stays in storage and can be previewed and restored; there is no permanent-delete action or automatic expiry.

Recently deleted uses `GET /announcements/audios?status=archived`, with server-side search, category filtering and pagination. Restore calls `POST /announcements/audios/:audioId/restore`; both actions require the existing `announcements:audios:delete` permission. View-only users can browse deleted audio but cannot restore it. Successful actions refresh both lists and the ready-audio choices used by routes and mobile settings.

Deploy the backend restore endpoint and apply its `20261009120000_audio_delete_restore` migration before releasing this frontend. Existing archives also appear in Recently deleted. Restoring an unfinished or failed upload preserves its previous status rather than making it ready.
