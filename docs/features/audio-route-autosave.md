# Route playlist autosave

The Audio App route playlist saves automatically two seconds after the last audio addition, removal, reorder, or stop-name edit. Route metadata dialogs and route creation retain their explicit submit actions.

## Operator experience

- A status bar above the route editor stays below the app header while scrolling. It announces pending edits, saving, success, and failure through a polite live region.
- **Save now** flushes immediately. **Back to all routes** waits for the latest edits to save before closing the editor.
- Switching Audio App tabs keeps the route editor state alive and lets the pending save finish.
- Failed saves retain the draft and offer **Retry save**. There is no continuous retry loop; another edit can restart autosave after a non-conflict failure.
- A version conflict pauses autosave. **Reload route** asks before discarding local edits and fetching the current server version. Failed reloads preserve the draft.
- Navigating to another application page offers keeping the editor open, saving and leaving, or discarding unsaved edits. Reloading/closing the browser uses its native unsaved-changes prompt. The draft is held in memory, so choosing to discard or force-close does not persist it locally.
- Primary actions use the shared `Button` primary color tokens in light and dark themes instead of purple overrides.

## Persistence and concurrency

The existing `PUT /announcements/routes/:routeId/audios` service contract is unchanged:

```json
{
  "expectedVersion": 3,
  "items": [
    { "audioId": "audio-1", "stopLabel": "Central stand" },
    { "audioId": "audio-2" }
  ]
}
```

The hook pins the version at the first local edit. A background refresh cannot silently replace that version. Requests are serialized; each successful response supplies the version for the next request. A response only clears the exact draft it saved, preserving edits made during the request. Subsequent autosaves respect the last edit time, including when the preceding request takes more than two seconds.

Route publishing, archiving, and metadata editing wait until playlist saves finish. Playlist edits are disabled during publish/archive requests, avoiding competing writes to the same route version. Assignment permission is checked before changes and saves.

## Verification

```sh
npm test
npm run test:coverage
npm run test:audio
npm run build
```

The initial Vitest coverage threshold applies specifically to the new autosave hook; it is not a repository-wide coverage claim. Hook tests use fake timers and independent query clients. Page interaction tests exercise the real announcement service with a mocked API client, including action payloads, tab switching, failures, conflicts, and navigation.

Browser smoke checks should cover desktop and narrow mobile viewports, sticky status placement while scrolling, light/dark primary colors, keyboard announcement selection, and browser close/reload prompts. These tests do not write to the production API.
