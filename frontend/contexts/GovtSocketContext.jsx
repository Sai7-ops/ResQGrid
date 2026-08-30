import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const GovtSocketContext = createContext();

export const UserSocketProvider = ({ children }) => {
  const [govtSocket, setGovtSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dispatches, setDispatches] = useState([]);

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

    // socketInstance.on("SOS_ALERT_TRIGGERED", (payload) => {
    //   setAlertStatus(payload);
    // });

    // socketInstance.on("SOS_ALERT_ACKNOWLEDGED", (payload) => {
    //   if (payload.success) {
    //     setAlertStatus((prevData) => {
    //       return { ...prevData, status: "acknowledged" };
    //     });
    //   }
    // });

    // socketInstance.on("CITIZEN_UNIT_EN_ROUTE", (payload) => {
    //   setDispatchData((prevData) => {
    //     const alreadyExists = prevData.some(
    //       (data) => data.dispatch_id === payload.dispatch_id,
    //     );

    //     if (alreadyExists) {
    //       return prevData;
    //     }

    //     return [payload, ...prevData];
    //   });
    //   toast.success(`${payload.unit_type} is on the way!`);
    // });

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
        setDispatches
      }}
    >
      {children}
    </GovtSocketContext.Provider>
  );
};

export const useGovtSocket = () => useContext(GovtSocketContext);
