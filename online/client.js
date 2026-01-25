export class OnlineChess {
  constructor(roomId, onStateChange) {
    this.roomId = roomId;
    this.onStateChange = onStateChange; // Callback(state)
    this.interval = null;
    this.myRole = null;
    this.lastFen = "";
  }

  static async getRoomsInfo() {
    try {
      const res = await fetch("online/api.php?action=rooms_info");
      return await res.json();
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async join(colorPreference = "w") {
    const data = await this.request("join", { color: colorPreference });
    if (data && !data.error) {
      this.startPolling();
    }
    return data;
  }

  async leave() {
    this.stopPolling();
    const res = await this.request("leave");
    return res;
  }

  startPolling() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.poll(), 1000); // 1s polling
  }

  stopPolling() {
    if (this.interval) clearInterval(this.interval);
  }

  async poll() {
    const data = await this.request("status");
    if (data) {
      this.handleState(data);
    }
  }

  async move(fen, moveSan) {
    return await this.request("move", { fen, move: moveSan });
  }

  async reset() {
    return await this.request("reset");
  }

  async request(action, params = {}) {
    try {
      const query = new URLSearchParams({
        action,
        room: this.roomId,
        ...params,
      });
      const res = await fetch(`online/api.php?${query}`);

      if (!res.ok) {
        return null;
      }

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return null;
      }
    } catch (e) {
      console.error("Online Error:", e);
      return null;
    }
  }

  handleState(data) {
    if (data.error) return;
    this.myRole = data.my_role;
    if (this.onStateChange) {
      this.onStateChange(data);
    }
  }
}
window.OnlineChess = OnlineChess;
