import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io("https://resqgrid-x51v.onrender.com", {
      withCredentials: true,
      autoConnect: true,
    });
    socketInstance.on("connect", () => {
      console.log("Connected with ID:", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🔴 SOCKET CONNECT ERROR:", error.message);
      console.error(error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🟡 SOCKET DISCONNECTED:", reason);
    });
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
