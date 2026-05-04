import * as signalR from "@microsoft/signalr";
import { HubConnectionState } from "@microsoft/signalr";
import { getSignalRHubUrl } from "../api/axios";
import { getStoredToken } from "../utils/auth";

class SignalRService {
  constructor() {
    this.connection = null;
    this.currentUserId = null;
  }

  async start(userId) {
    if (!userId) {
      return null;
    }

    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(getSignalRHubUrl(), {
          accessTokenFactory: () => getStoredToken(),
        })
        .withAutomaticReconnect()
        .build();
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.connection.start();
    }

    if (this.currentUserId !== userId) {
      if (this.currentUserId) {
        await this.connection.invoke("LeaveUserGroup", String(this.currentUserId));
      }

      await this.connection.invoke("JoinUserGroup", String(userId));
      this.currentUserId = userId;
    }

    return this.connection;
  }

  async stop() {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }

    this.currentUserId = null;
  }

  onNotification(callback) {
    this.connection?.off("ReceiveNotification");
    this.connection?.on("ReceiveNotification", callback);
    return () => this.connection?.off("ReceiveNotification", callback);
  }

  onTaskMoved(callback) {
    this.connection?.off("TaskMoved");
    this.connection?.on("TaskMoved", callback);
    return () => this.connection?.off("TaskMoved", callback);
  }
}

export default new SignalRService();
