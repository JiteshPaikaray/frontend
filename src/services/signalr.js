import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
  }

  async start(userId) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7240/hubs/notifications", {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    await this.connection.start();
    console.log("SignalR Connected");

    await this.connection.invoke("JoinUserGroup", userId);
  }

  onNotification(callback) {
    this.connection.on("ReceiveNotification", callback);
  }

  onTaskMoved(callback) {
    this.connection.on("TaskMoved", callback);
  }
}

export default new SignalRService();