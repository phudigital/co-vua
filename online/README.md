# Online Module Documentation

This module provides a simple, "pure PHP" online Multiplayer backend using JSON files for storage.

## Structure

- `api.php`: The single endpoint handling all logic (Join, Move, Status, Reset).
- `client.js`: A Javascript class `OnlineChess` to interact with the API.
- `data/`: Stores `room1.json` and `room2.json`.

## API Usage

**Endpoint:** `online/api.php`

### 1. Get Status (Polling)

`GET ?action=status&room=room1`

### 2. Join Room

`GET ?action=join&room=room1&side=white` (or `black`, `random`)

### 3. Make Move

`POST ?action=move&room=room1`
Params:

- `fen`: The new FEN string.
- `move`: The SAN move string (e.g., "e4").

### 4. Reset Room

`GET ?action=reset&room=room1`

## Integration Logic

1. **Frontend**: Import `OnlineChess` from `client.js`.
2. **Setup**: When user clicks "Room 1", call `online.join()`.
3. **Loop**: The `client.js` automatically polls every 1s.
4. **Events**: Pass a callback to `new OnlineChess(roomId, callback)` to update your board when state changes.
