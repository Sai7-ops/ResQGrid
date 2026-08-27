import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [sosAlerts, setSosAlerts] = useState([]);

  useEffect(() => {
    const socketInstance = io("https://resqgrid-x51v.onrender.com", {
      withCredentials: true,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Connected with ID:", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🔴 SOCKET CONNECT ERROR:", error.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🟡 SOCKET DISCONNECTED:", reason);
    });
    
    socketInstance.on("NEW_SOS_ALERT", (payload) => {
      console.log("🚨 NEW SOS RECEIVED:", payload);

      setSosAlerts((prevAlerts) => {
        const alreadyExists = prevAlerts.some(
          (alert) => alert.sos_id === payload.sos_id,
        );

        if (alreadyExists) {
          return prevAlerts;
        }

        return [payload, ...prevAlerts];
      });

      try {
        const audio = new Audio("/alert.mp3");

        audio.play().catch((err) => {
          console.log("Audio could not autoplay:", err.message);
        });
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    });

    socketInstance.on("CAPABILITY_CLAIMED", ({ sos_id, claimed_unit_type }) => {
      setSosAlerts((prevAlerts) => {
        return prevAlerts
          .map((alert) => {
            if (alert.sos_id !== sos_id) {
              return alert;
            }

            const remainingCapabilities = alert.matched_capabilities.filter(
              (tag) => tag !== claimed_unit_type,
            );

            return {
              ...alert,
              matched_capabilities: remainingCapabilities,
            };
          })
          .filter((alert) => alert.matched_capabilities.length > 0);
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        sosAlerts,
        setSosAlerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
