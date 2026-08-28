import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const AgencySocketContext = createContext();

export const AgencySocketProvider = ({ children }) => {
  const [agencySocket, setAgencySocket] = useState(null);
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

      socketInstance.emit("SOS_ALERT_RECEIVED", {
        success: true,
        message: "SOS received successfully",
        sos_id: payload.sos_id,
        user_id: payload.user_id,
      });

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

    setAgencySocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <AgencySocketContext.Provider
      value={{
        agencySocket,
        sosAlerts,
        setSosAlerts,
      }}
    >
      {children}
    </AgencySocketContext.Provider>
  );
};

export const useAgencySocket = () => useContext(AgencySocketContext);
