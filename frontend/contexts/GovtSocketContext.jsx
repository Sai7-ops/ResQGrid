import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const GovtSocketContext = createContext();

export const UserSocketProvider = ({ children }) => {
  const [govtSocket, setGovtSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

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
      setAlerts((prevAlerts) => [...prevAlerts, payload]);
      toast.error("New SOS Alert", {
        icon: "⚠️",
      });
    });

    socketInstance.on("NEW_SOS_DISPATCH", (payload) => {
      setDispatches((prevData) => [...prevData, payload]);
      toast.success("New SOS Dispatch", {
        icon: "🚑",
      });
    });

    socketInstance.on("NEW_PENDING_REQUEST", (payload) => {
      setPendingRequests((prevRequests) => [...prevRequests, payload]);
      toast.error("New Pending Request", {
        icon: "🔔",
      });
    });

    setGovtSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <GovtSocketContext.Provider
      value={{
        govtSocket,
        alerts,
        setAlerts,
        dispatches,
        setDispatches,
        pendingRequests,
        setPendingRequests,
      }}
    >
      {children}
    </GovtSocketContext.Provider>
  );
};

export const useGovtSocket = () => useContext(GovtSocketContext);
