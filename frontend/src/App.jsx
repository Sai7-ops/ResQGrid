import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  Outlet,
  NavLink,
  useParams,
} from "react-router-dom";
import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  AgencySocketProvider,
  useAgencySocket,
} from "../contexts/AgencySocketContext";
import {
  UserSocketProvider,
  useUserSocket,
} from "../contexts/UserSocketContext";
import {
  useMutation,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useForm } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="user/register" element={<UserRegister />} />
          <Route path="user/login" element={<UserLogin />} />
          <Route path="agency/register" element={<AgencyRegister />} />
          <Route path="agency/login" element={<AgencyLogin />} />
          <Route path="gov/register" element={<GovRegister />} />
          <Route path="gov/login" element={<GovLogin />} />
          <Route element={<AgencyRouteProtector />}>
            <Route path="/agency" element={<AgencyLayout />}>
              <Route path="home" element={<AgencyHome />} />
              <Route path="dashboard" element={<AgencyDashboard />} />
              <Route path="inbox" element={<AgencyInbox />} />
              <Route path="sosInbox" element={<AgencySosInbox />} />
              <Route path="units" element={<AgencyUnits />} />
              <Route
                path="unit/:unit_id/activeMission"
                element={<AgencyUnitActiveMission />}
              />
            </Route>
          </Route>
          <Route element={<UserRouteProtector />}>
            <Route path="/user" element={<UserLayout />}>
              <Route path="home" element={<UserHome />} />
              <Route path="sosForm" element={<UserSOSForm />} />
              <Route path="sosInbox" element={<UserSOSInbox />} />
              <Route path="inbox" element={<UserInbox />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export const Home = () => {
  return (
    <div>
      <h1>Welcome To ResQGrid</h1>
      <Link to="/user/register">User</Link>
      <Link to="/agency/register">Agency</Link>
      <Link to="/gov/register">Government</Link>
    </div>
  );
};

const useGeolocation = (options = {}) => {
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return setError("Geolocation is not supported by the browser.");
    }
    setLoading(true);
    setError(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to retrieve location");
        setLoading(false);
      },
      geoOptions,
    );
  }, [options]);

  return { coordinates, loading, error, fetchLocation };
};

const apiGetAlertStatus = async (user_id) => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/user/${user_id}/activeSos`,
    {
      withCredentials: true,
    },
  );

  return response.data;
};

const useGetAlertStatus = () => {
  const { user } = useUserAuth();
  const { user_id } = user;
  const { data: alert_status, isPending } = useQuery({
    queryKey: ["activeSos", user_id],
    queryFn: () => apiGetAlertStatus(user_id),
  });
  const sosId = alert_status?.[0]?.sos_id;
  return { alert_status, sosId, isPending };
};

const apiGetDispatchData = async (sos_id) => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/user/dispatchData/${sos_id}`,
    {
      withCredentials: true,
    },
  );

  return response.data;
};

const useGetDispatchData = (sosId) => {
  const { data: dispatch_data, isPending } = useQuery({
    queryKey: ["dispatchData", sosId],
    queryFn: () => apiGetDispatchData(sosId),
    enabled: !!sosId,
  });

  return { dispatch_data, isPending };
};

const UserSOSInbox = () => {
  const { coordinates, fetchLocation } = useGeolocation();

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const {
    userSocket,
    alertStatus,
    dispatchData,
    setAlertStatus,
    setDispatchData,
  } = useUserSocket();

  const { alert_status, sosId, isPending } = useGetAlertStatus();
  const { dispatch_data, isPending: fetching } = useGetDispatchData(sosId);

  useEffect(() => {
    if (!isPending && alert_status?.length > 0) {
      setAlertStatus(alert_status[0]);
    }
  }, [alert_status, setAlertStatus, isPending]);

  useEffect(() => {
    if (!fetching && dispatch_data?.length > 0) setDispatchData(dispatch_data);
  }, [dispatch_data, setDispatchData, fetching]);

  if (isPending || fetching) return <h1>Loading...</h1>;

  if (!alert_status || alert_status?.length === 0)
    return <h1>No Active SOS triggered at the moment</h1>;

  return (
    <div>
      <div>
        <h3>SOS ID : {alertStatus.sos_id}</h3>
        <p>Triggered At: {alertStatus.triggered_at}</p>
        <h3>Status: {alertStatus.status}</h3>
        <p>Disaster Type: {alertStatus.disaster_type}</p>
        <p>Provided Description: {alertStatus.description}</p>
      </div>
      <div>
        {dispatchData.map((dispatch) => {
          return (
            <div>
              <h3>Dispatch Id: {dispatch.dispatch_id}</h3>
              <p>Agency Name: {dispatch.agency_name}</p>
              <p>Unit Name: {dispatch.unit_name}</p>
              <p>Unit Type: {dispatch.unit_type}</p>
              <h3>Status: {dispatch.status}</h3>
              <p>Assigned at: {dispatch.assigned_at}</p>
            </div>
          );
        })}
      </div>
      <div>
        {coordinates.latitude !== null && coordinates.longitude !== null ? (
          <MapContainer
            center={[coordinates.latitude, coordinates.longitude]}
            zoom={13}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {dispatchData.map((dispatch) => {
              const [longitude, latitude] = dispatch.unit_location.coordinates;
              return (
                <Marker
                  key={dispatch.dispatch_id}
                  position={[latitude, longitude]}
                >
                  <Popup>
                    <strong>{dispatch.unit_type}</strong>
                    <br />
                    Status: {dispatch.status}
                    <br />
                    Unit Name: {dispatch.unit_name}
                  </Popup>
                </Marker>
              );
            })}

            <Marker position={[coordinates.latitude, coordinates.longitude]}>
              <Popup>
                <strong>Your Location</strong>
                <br />
                <p>SOS ID: {alertStatus.sos_id}</p>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

const UserInbox = () => {
  return (
    <div>
      <div>
        <h1>Inbox</h1>
      </div>
    </div>
  );
};

const apiGetSosAlerts = async () => {
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/agency/sosAlerts",
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useSosAlerts = () => {
  const { data, isPending: fetching } = useQuery({
    queryKey: ["sos_alerts"],
    queryFn: apiGetSosAlerts,
  });
  return { sos_alerts: data, fetching };
};

const AgencySosInbox = () => {
  const { agencySocket, sosAlerts, setSosAlerts } = useAgencySocket();
  const { sos_alerts, fetching } = useSosAlerts();

  const { agencyUnits, isPending } = useGetAgencyUnits();

  const [claimingUnitId, setClaimingUnitId] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (Array.isArray(sos_alerts)) {
      setSosAlerts((prevAlerts) => {
        const map = new Map();
        sos_alerts.forEach((alert) => map.set(alert.sos_id, alert));
        (prevAlerts || []).forEach((alert) => map.set(alert.sos_id, alert));
        return Array.from(map.values());
      });
    }
  }, [sos_alerts, setSosAlerts]);

  const handleClaimSos = ({ unit_id, sos_id, unit_type, agency_id }) => {
    if (!agencySocket) {
      toast.error("Socket is not connected!");
      return;
    }

    setClaimingUnitId(unit_id);

    const payload = {
      sos_id,
      unit_type,
      unit_id,
      agency_id,
    };

    agencySocket.emit("CLAIM_SOS_CAPABILITY", payload, (response) => {
      setClaimingUnitId(null);

      if (response?.success) {
        toast.success(
          `Successfully claimed SOS #${sos_id}! Unit ${unit_id} is dispatched.`,
        );

        queryClient.invalidateQueries({
          queryKey: ["agencyUnits"],
        });
        queryClient.invalidateQueries({
          queryKey: ["sos_alerts"],
        });
      } else {
        toast.error(`Failed to claim: ${response?.message || "Unknown error"}`);
      }
    });
  };

  if (isPending || fetching) {
    return <h1>Loading...</h1>;
  }

  const availableUnits = agencyUnits.filter(
    (unit) => unit.status === "AVAILABLE",
  );

  return (
    <div>
      <h1>SOS Alerts</h1>
      {sosAlerts.length === 0 ? (
        <p>No active SOS alerts in your area at the moment</p>
      ) : (
        <div>
          {sosAlerts.map((alert) => (
            <div key={alert.sos_id}>
              <p>
                {alert.sos_id} - {alert.disaster_type}
              </p>
              <p>{(alert.distance_meters / 1000).toFixed(2)} km away</p>
              <p>{alert.description || "No description provided."}</p>
              <div>
                Matched Roles:{" "}
                {(alert.matched_capabilities || []).map((tag) => (
                  <p>{tag}</p>
                ))}
              </div>
              <div>
                <h1>STATUS: {alert.status}</h1>
              </div>
              {(alert.matched_capabilities || []).map((tag) => {
                const matching_units = availableUnits.filter(
                  (unit) => unit.unit_type === tag,
                );
                return (
                  <div>
                    {matching_units.map((unit) => (
                      <div key={unit.unit_id}>
                        <p>{unit.unit_name}</p>
                        <p>{unit.unit_id}</p>
                        <button
                          disabled={claimingUnitId === unit.unit_id}
                          onClick={() =>
                            handleClaimSos({
                              unit_id: unit.unit_id,
                              sos_id: alert.sos_id,
                              unit_type: unit.unit_type,
                              agency_id: unit.agency_id,
                            })
                          }
                        >
                          Claim SOS
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const apiLogoutUser = async () => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/logout",
    null,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useLogoutUser = () => {
  const navigate = useNavigate();
  const { mutate: logoutUser, isPending } = useMutation({
    mutationFn: apiLogoutUser,
    onSuccess: () => {
      navigate("/", { replace: true });
      toast.error("Logged out successfully");
    },
    onError: () => toast.error("An error occured while logging out"),
  });
  return { logoutUser, isPending };
};
const UserLayout = () => {
  const { logoutUser, isPending } = useLogoutUser();
  const logoutHandler = () => {
    logoutUser();
  };
  return (
    <UserSocketProvider>
      <header>
        header
        <button
          disabled={isPending}
          onClick={logoutHandler}
          className="btn btn-primary"
        >
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>footer</footer>
    </UserSocketProvider>
  );
};

const UserHome = () => {
  const { user, isPending } = useUserAuth();
  if (isPending) return <h1>Loading...</h1>;
  return (
    <div>
      <p>Welcome {user.name}</p>
      <p>
        <NavLink to="/user/sosForm">Trigger SOS</NavLink>
      </p>
      <p>
        <NavLink to="/user/sosInbox">User SOS Inbox</NavLink>
      </p>
      <p>
        <NavLink to="/user/inbox">User Inbox</NavLink>
      </p>
    </div>
  );
};

const apiTriggerSos = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/triggerSos",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useTriggerSos = () => {
  const queryClient = useQueryClient();
  const { mutate: triggerSos, isPending } = useMutation({
    mutationFn: apiTriggerSos,
    onSuccess: (data) => {
      queryClient.setQueryData(["activeSos"], {
        ...data,
        active: true,
      });
    },
  });
  return { triggerSos, isPending };
};

const UserSOSForm = () => {
  const { coordinates, loading, error, fetchLocation } = useGeolocation();
  const { triggerSos, isPending } = useTriggerSos();
  const queryClient = useQueryClient();
  const { alert_status, isPending: fetching } = useGetAlertStatus();
  const [active, setActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const submitHandler = (data) => {
    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      disaster_type: data.disaster_type,
      is_victim: data.is_victim || false,
      description: data.description || null,
    };
    triggerSos(payload, {
      onSuccess: (data) => {
        toast.success("SOS triggered successfully");
        queryClient.setQueryData(["activeSos", data.user_id], {
          ...data,
          active: true,
        });
        setActive(true);
        reset();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to trigger SOS");
      },
    });
  };
  useEffect(() => {
    if (coordinates?.latitude) {
      setValue("latitude", coordinates.latitude);
      setValue("longitude", coordinates.longitude);
    }
  }, [coordinates, setValue]);

  if (fetching) return <h1>Loading...</h1>;
  if (alert_status?.length > 0) {
    return <h1>You already have an active SOS triggered</h1>;
  }

  if (active) return <h1>You already have an active sos triggered</h1>;

  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Disaster Type</span>
            <select
              className="select select-primary"
              {...register("disaster_type", {
                required: "This field is required!",
              })}
            >
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="earthquake">Earthquake</option>
              <option value="cyclone">Cyclone</option>
              <option value="medical_emergency">Medical Emergency</option>
              <option value="crowd_hazard">Crowd Hazard</option>
            </select>
          </label>
          {errors?.disaster_type ? <p>{errors.disaster_type.message}</p> : ""}
        </div>
        <div>
          <label>Location Coordinates</label>
          <input
            type="text"
            disabled={isPending}
            placeholder="latitude"
            {...register("latitude", {
              required: "Both the fields are required!",
            })}
          />
          <input
            type="text"
            disabled={isPending}
            placeholder="longitude"
            {...register("longitude", {
              required: "Both the fields are required!",
            })}
          />
          <button type="button" disabled={loading} onClick={fetchLocation}>
            {loading ? "Fetching..." : "Get Location"}
          </button>
          {error ? <p>{error}</p> : ""}
          {errors?.latitude || errors?.longitude ? (
            <p>{errors?.latitude?.message || errors?.longitude?.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <label htmlFor="is_victim">Are you the victim?</label>
          <input id="is_victim" type="checkbox" {...register("is_victim")} />
        </div>
        <div>
          <label className="floating-label">
            <span>Description (Optional)</span>
            <input type="text" {...register("description")} />
          </label>
        </div>
        <div>
          <button className="btn btn-danger">Trigger SOS</button>
        </div>
      </form>
    </div>
  );
};

const useAgencyAuth = () => {
  const {
    data: agency,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["agency"],
    queryFn: apiGetMyAgency,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  return {
    agency,
    isPending,
    isAuthenticated: !isError && Boolean(agency),
  };
};

const apiGetMe = async () => {
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/user/me",
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useUserAuth = () => {
  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: apiGetMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  return {
    user,
    isPending,
    isAuthenticated: !isError && Boolean(user),
  };
};

const UserRouteProtector = () => {
  const { isPending, isAuthenticated } = useUserAuth();
  if (isPending) {
    return <h1>Checking authentication...</h1>;
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

const AgencyRouteProtector = () => {
  const { isPending, isAuthenticated } = useAgencyAuth();
  if (isPending) {
    return <h1>Checking authentication...</h1>;
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

const apiVerifyUser = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/verifyUser",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyUser = () => {
  const { mutate: verifyUser, isPending } = useMutation({
    mutationFn: apiVerifyUser,
  });
  return { verifyUser, isPending };
};

const VerifyUserCredentials = ({
  setStep,
  setAadhaar_no,
  setMaskedPhone,
  setUser,
}) => {
  const { verifyUser, isPending } = useVerifyUser();
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();
  const submitHandler = (payload) => {
    verifyUser(payload, {
      onSuccess: (data) => {
        setStep(2);
        localStorage.setItem("step", 2);
        setAadhaar_no(data.user.aadhaar_no);
        setMaskedPhone(data.user.maskedPhone);
        setUser(data.user);
        reset();
      },
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };
  return (
    <>
      <div>
        <form onSubmit={handleSubmit(submitHandler)}>
          <div>
            <label className="floating-label">
              <span>Name</span>
              <input
                type="text"
                disabled={isPending}
                {...register("full_name", {
                  required: "This field is required",
                })}
              />
            </label>
            {errors?.full_name ? <p>{errors?.full_name.message}</p> : ""}
          </div>
          <div>
            <label className="floating-label">
              <span>Date of Birth</span>
              <input
                type="date"
                disabled={isPending}
                {...register("dob", {
                  required: "This field is required",
                })}
              />
            </label>
            {errors?.dob ? <p>{errors?.dob.message}</p> : ""}
          </div>
          <div>
            <label className="floating-label">
              <span>Aadhaar No.</span>
              <input
                type="text"
                disabled={isPending}
                {...register("aadhaar_no", {
                  required: "This field is required",
                  maxLength: {
                    value: 12,
                    message: "Aadhaar number must be exactly 12 digits",
                  },
                  minLength: {
                    value: 12,
                    message: "Aadhaar number must be exactly 12 digits",
                  },
                })}
              />
            </label>
            {errors?.aadhaar_no ? <p>{errors?.aadhaar_no.message}</p> : ""}
          </div>
          <div>
            <label className="floating-label">
              <span>Mobile No.</span>
              <input
                type="text"
                disabled={isPending}
                {...register("mobile_no", {
                  required: "This field is required",
                  maxLength: {
                    value: 10,
                    message: "Mobile number must be exactly 10 digits",
                  },
                  minLength: {
                    value: 10,
                    message: "Mobile number must be exactly 10 digits",
                  },
                })}
              />
            </label>
            {errors?.mobile_no ? <p>{errors?.mobile_no.message}</p> : ""}
          </div>
          <div>
            <button className="btn btn-primary uppercase">next</button>
          </div>
        </form>
      </div>
      <Link to="/user/login">Already registered? then login...</Link>
    </>
  );
};

const apiVerifyUserSms = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/verifyUserSmsOtp",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyUserSmsOtp = () => {
  const { mutate: verifyUserSmsOtp, isPending } = useMutation({
    mutationFn: apiVerifyUserSms,
  });
  return { verifyUserSmsOtp, isPending };
};

export const UserSMSOtp = ({ setStep, maskedPhone, aadhaar_no }) => {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [serverError, setServerError] = useState(null);

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const handleChange = (index, e) => {
    const val = e.target.value;

    if (val && !/^\d+$/.test(val)) return;

    const newOtp = [...otpValues];
    newOtp[index] = val ? val.slice(-1) : "";
    setOtpValues(newOtp);

    const fullOtp = newOtp.join("");
    setValue("otp", fullOtp);

    if (fullOtp.length === 6) {
      clearErrors("otp");
    }

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otpValues];

      digits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });

      setOtpValues(newOtp);
      setValue("otp", newOtp.join(""));
      clearErrors("otp");

      const targetIdx = Math.min(digits.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const { verifyUserSmsOtp, isPending } = useVerifyUserSmsOtp();

  const onOtpSubmit = async () => {
    const fullOtpString = otpValues.join("");

    if (fullOtpString.length !== 6) {
      setError("otp", {
        type: "manual",
        message: "Please enter the full 6-digit code",
      });
      return;
    }

    const payload = { otp: fullOtpString, aadhaar_no };

    verifyUserSmsOtp(payload, {
      onSuccess: () => {
        setStep(3);
        localStorage.setItem("step", 3);
      },
      onError: (err) => {
        setServerError(err.response?.data?.message || "Invalid OTP entered.");
      },
      onSettled: () => reset(),
    });
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-xl font-bold justify-center">
          Verify User
        </h2>
        <p className="text-sm text-base-content/70 text-center">
          Enter the 6-digit code sent to registered mobile{" "}
          <span className="font-semibold text-primary">{maskedPhone}</span>
        </p>

        {serverError && (
          <div role="alert" className="alert alert-error text-sm py-2 mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onOtpSubmit)} className="mt-4 space-y-4">
          <div className="flex justify-center gap-2">
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`input input-bordered w-12 h-14 text-center text-xl font-bold rounded-lg focus:input-primary ${
                  errors.otp || serverError ? "input-error" : ""
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {errors.otp && (
            <p className="text-error text-xs text-center font-medium">
              {errors.otp.message}
            </p>
          )}

          <div className="card-actions justify-between items-center pt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setStep(2)}
              disabled={isPending}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {isPending ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const apiRegisterUser = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/register",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useRegisterUser = () => {
  const { mutate: registerUser, isPending } = useMutation({
    mutationFn: apiRegisterUser,
  });
  return { registerUser, isPending };
};

const UserRegistration = ({ setStep, user }) => {
  const { registerUser, isPending } = useRegisterUser();
  const navigate = useNavigate();
  const { coordinates, loading, fetchLocation } = useGeolocation();

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation, loading]);
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    getValues,
  } = useForm();

  const submitHandler = (data) => {
    if (!coordinates?.latitude || !coordinates?.longitude) {
      toast.error("Please wait for your location to be fetched.");
      return;
    }
    const payload = {
      aadhaar_no: user.aadhaar_no,
      mobile_no: user.mobile_no,
      name: user.full_name,
      dob: user.dob,
      age: data.age,
      address: data.address,
      state: data.state,
      email: data.email,
      password: data.password,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
    };
    registerUser(payload, {
      onSuccess: () => {
        reset();
        setStep(1);
        localStorage.removeItem("step");
        navigate("/user/home", { replace: true });
      },
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Detailed Address</span>
            <input
              type="text"
              disabled={isPending}
              {...register("address", {
                required: "This field is required",
                minLength: {
                  value: 15,
                  message: "Minimum of 15 characters is required",
                },
              })}
            />
          </label>
          {errors?.address ? <p>{errors.address.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Home State</span>
            <input
              type="text"
              disabled={isPending}
              {...register("state", {
                required: "This field is required!",
              })}
            />
          </label>
          {errors?.state ? <p>{errors.state.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Age</span>
            <input
              type="number"
              disabled={isPending}
              {...register("age", {
                required: "This field is required!",
              })}
            />
          </label>
          {errors?.age ? <p>{errors.age.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Email</span>
            <input
              type="text"
              disabled={isPending}
              {...register("email", {
                required: "This field is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
          </label>
          {errors?.email ? <p>{errors.email.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Password</span>
            <input
              type="password"
              disabled={isPending}
              {...register("password", {
                required: "This field is required!",
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character",
                },
              })}
            />
          </label>
          {errors?.password ? <p>{errors.password.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Confirm Password</span>
            <input
              type="password"
              disabled={isPending}
              {...register("confirmPassword", {
                required: "This field is required!",
                validate: (value) =>
                  value === getValues("password") || "Passwords don't match",
              })}
            />
          </label>
          {errors?.confirmPassword ? (
            <p>{errors.confirmPassword.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <button disabled={isPending} className="btn btn-primary uppercase">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export const UserRegister = () => {
  const [step, setStep] = useState(1);
  const [aadhaar_no, setAadhaar_no] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState(null);
  const [user, setUser] = useState("");
  return (
    <div>
      <h1>User Registration</h1>
      {step === 1 ? (
        <VerifyUserCredentials
          setStep={setStep}
          setMaskedPhone={setMaskedPhone}
          setAadhaar_no={setAadhaar_no}
          setUser={setUser}
        />
      ) : (
        ""
      )}
      {step === 2 ? (
        <UserSMSOtp
          maskedPhone={maskedPhone}
          aadhaar_no={aadhaar_no}
          setStep={setStep}
        />
      ) : (
        ""
      )}
      {step === 3 ? <UserRegistration setStep={setStep} user={user} /> : ""}
    </div>
  );
};

const apiLoginUser = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/user/login",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useLoginUser = () => {
  const { mutate: loginUser, isPending } = useMutation({
    mutationFn: apiLoginUser,
  });
  return { loginUser, isPending };
};

export const UserLogin = () => {
  const { loginUser, isPending } = useLoginUser();
  const navigate = useNavigate();
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const submitHandler = (data) => {
    loginUser(data, {
      onSuccess: () => {
        reset();
        navigate("/user/home", { replace: true });
      },
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };
  return (
    <div>
      <h1>User Login</h1>
      <div>
        <form onSubmit={handleSubmit(submitHandler)}>
          <div>
            <label className="floating-label">
              <span>Aadhaar Number</span>
              <input
                type="text"
                disabled={isPending}
                {...register("aadhaar_no", {
                  required: "This field is required",
                  minLength: {
                    value: 12,
                    message: "Aadhaar number must be exactly 12 characters",
                  },
                  maxLength: {
                    value: 12,
                    message: "Aadhaar number must be exactly 12 characters",
                  },
                })}
              />
            </label>
            {errors?.aadhaar_no ? <p>{errors?.aadhaar_no?.message}</p> : ""}
          </div>
          <div>
            <label className="floating-label">
              <span>Password</span>
              <input
                type="password"
                disabled={isPending}
                {...register("password", {
                  required: "This field is required",
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message:
                      "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character",
                  },
                })}
              />
            </label>
            {errors?.password ? <p>{errors?.password?.message}</p> : ""}
          </div>
          <div>
            <button disabled={isPending} className="btn btn-primary uppercase">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const apiLogoutAgency = async () => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/logout",
    null,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useLogoutAgency = () => {
  const navigate = useNavigate();
  const { mutate: logoutAgency, isPending } = useMutation({
    mutationFn: apiLogoutAgency,
    onSuccess: () => {
      navigate("/", { replace: true });
      toast.error("Logged out successfully");
    },
    onError: () => toast.error("An error occured while logging out"),
  });
  return { logoutAgency, isPending };
};

const AgencyLayout = () => {
  const { logoutAgency, isPending } = useLogoutAgency();
  const logoutHandler = () => {
    logoutAgency();
  };
  return (
    <AgencySocketProvider>
      <header>
        <NavLink to="/agency/home">Home</NavLink>
        <NavLink to="/agency/dashboard">Dashboard</NavLink>
        <NavLink to="/agency/inbox">Inbox</NavLink>
        <NavLink to="/agency/units">Units</NavLink>
        <NavLink to="/agency/sosInbox">SOS Inbox</NavLink>
        <button disabled={isPending} onClick={logoutHandler}>
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>footer</footer>
    </AgencySocketProvider>
  );
};

const AgencyDashboard = () => {
  return <h1>Dashboard</h1>;
};

const AgencyInbox = () => {
  return (
    <div>
      <h1>Inbox</h1>
    </div>
  );
};

const apiGetAgencyUnits = async () => {
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/agency/units",
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetAgencyUnits = () => {
  const { data: agencyUnits = [], isPending } = useQuery({
    queryKey: ["agencyUnits"],
    queryFn: apiGetAgencyUnits,
    staleTime: 5 * 60 * 1000,
  });
  return { agencyUnits, isPending };
};

const AgencyUnits = () => {
  const { agencyUnits, isPending } = useGetAgencyUnits();
  const navigate = useNavigate();

  if (isPending) return <h1>Loading...</h1>;
  const formatAssetName = (name) => {
    return name
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };
  return (
    <div>
      <h1>Units</h1>
      {agencyUnits.map((unit) => {
        return (
          <div>
            <p>{unit.unit_id}</p>
            <p>{unit.unit_name}</p>
            <p>{unit.unit_type}</p>

            <div>
              {Object.entries(unit.equipped_assets).map(([asset, quantity]) => {
                return (
                  <div>
                    <span>{formatAssetName(asset)}</span>
                    <span>{quantity}</span>
                  </div>
                );
              })}
            </div>
            <p>{unit.status}</p>
            <p>{unit.unit_coverage_radius_km}</p>
            <p>{unit.unit_email}</p>
            <p>{unit.unit_contact_no}</p>
            <div>
              <button
                onClick={() =>
                  navigate(`/agency/unit/${unit.unit_id}/activeMission`)
                }
                className="btn btn-primary"
              >
                Track Active Mission
              </button>
              <button
                onClick={() =>
                  navigate(`/agency/unit/${unit.unit_id}/trackRecords`)
                }
                className="btn btn-accent"
              >
                View Track Records
              </button>
            </div>
          </div>
        );
      })}
      <AgencyUnitsMap />
    </div>
  );
};

const AgencyUnitsMap = () => {
  const { agencyUnits, isPending } = useGetAgencyUnits();
  const { agency, isPending: agencyPending } = useGetMyAgency();

  if (isPending || agencyPending) {
    return <h1>Loading...</h1>;
  }

  const [longitude, latitude] = agency.hq_location.coordinates;
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {agencyUnits.map((unit) => {
        const [longitude, latitude] = unit.location.coordinates;
        return (
          <Marker key={unit.unit_id} position={[latitude, longitude]}>
            <Popup>
              <strong>{unit.unit_name}</strong>
              <br />
              Status: {unit.status}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

const apigetUnitActiveMission = async (unit_id) => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/agency/unit/${unit_id}/activeMission`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetUnitActiveMission = () => {
  const params = useParams();
  const unit_id = params.unit_id;

  const { data, isPending } = useQuery({
    queryKey: ["activeMission", unit_id],
    queryFn: () => apigetUnitActiveMission(unit_id),
  });

  return { data, isPending };
};

const AgencyUnitActiveMission = () => {
  const { data, isPending } = useGetUnitActiveMission();
  if (isPending) return <h1>Loading...</h1>;

  if (!data || data.length === 0) return <h1>No active missions currently</h1>;

  const activeMission = data[0];

  const {
    triggered_at,
    sos_id,
    sos_status,
    sos_location,
    assigned_at,
    updated_at,
    dispatch_status,
    unit_name,
    unit_type,
    unit_id,
    unit_location,
  } = activeMission;

  const [unit_longitude, unit_latitude] = unit_location.coordinates;
  const [sos_longitude, sos_latitude] = sos_location.coordinates;

  return (
    <>
      <div>
        <p>Unit ID: {unit_id}</p>
        <p>Unit Name: {unit_name}</p>
        <p>Unit Type: {unit_type}</p>
        <p>{sos_id}</p>
        <p>SOS Triggered At: {triggered_at}</p>
        <p>SOS Status: {sos_status}</p>
        <p>Assigned At: {assigned_at}</p>
        <p>Last Updated: {updated_at}</p>
        <p>Dispatch Status: {dispatch_status}</p>
      </div>
      <div>
        <MapContainer
          center={[unit_latitude, unit_longitude]}
          zoom={13}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker key={unit_id} position={[unit_latitude, unit_longitude]}>
            <Popup>
              <strong>{unit_name}</strong>
              <br />
              Status: {dispatch_status}
            </Popup>
          </Marker>
          <Marker key={sos_id} position={[sos_latitude, sos_longitude]}>
            <Popup>
              <strong>{sos_id}</strong>
              <br />
              Status: {sos_status}
              <p>Triggered from this location at {triggered_at}</p>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </>
  );
};

const apiVerifyAgency = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/verifyAgency",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyAgency = () => {
  const { mutate: verifyAgency, isPending } = useMutation({
    mutationFn: apiVerifyAgency,
  });
  return { verifyAgency, isPending };
};

export const AgencyVerification = ({ setStep, setAgency }) => {
  const { verifyAgency, isPending } = useVerifyAgency();
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm();

  const submitHandler = (payload) => {
    verifyAgency(payload, {
      onSuccess: (data) => {
        setStep(2);
        localStorage.setItem("step", 2);
        setAgency(data.agency);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Invalid Credentials");
      },
      onSettled: () => reset(),
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Agency Type</span>
            <select
              className="select select-primary"
              disabled={isPending}
              {...register("category", {
                required: "This field is required!",
              })}
            >
              <option value="GOVT_UNIT">Government Unit</option>
              <option value="NGO">Non-Profit Organisation</option>
              <option value="PVT_CORP">Private Corporation</option>
              <option value="LOGISTICS">Logistics</option>
            </select>
          </label>
          {errors?.category ? <p>{errors.category.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Agency ID</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("agency_id", {
                required: "This field is required!",
              })}
            />
          </label>
          {errors?.agency_id ? <p>{errors.agency_id.message}</p> : ""}
        </div>
        <div>
          <button disabled={isPending} className="btn btn-primary uppercase">
            next
          </button>
        </div>
      </form>
      <Link to="/agency/login">Already registered? then login...</Link>
    </div>
  );
};

export const PersonnelVerification = ({
  setStep,
  setOfficialId,
  setMaskedPhone,
}) => {
  const { verifyPersonnel, isPending } = useVerifyAgencyPersonnel();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const submitHandler = (data) => {
    verifyPersonnel(data, {
      onSuccess: (data, variables) => {
        setStep(3);
        localStorage.setItem("step", 3);
        setOfficialId(variables.official_id);
        setMaskedPhone(data.maskedPhone);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Invalid Credentials");
      },
      onSettled: () => reset(),
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Official ID</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("official_id", {
                required: "This field is required!",
              })}
            />
          </label>
          {errors?.official_id ? <p>{errors.official_id.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Aadhaar No.</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("aadhaar_no", {
                required: "This field is required!",
                // maxLength: {
                //   value: 12,
                //   message: "Aadhaar number must be exactly 12 digits",
                // },
                // minLength: {
                //   value: 12,
                //   message: "Aadhaar number must be exactly 12 digits",
                // },
              })}
            />
          </label>
          {errors?.aadhaar_no ? <p>{errors.aadhaar_no.message}</p> : ""}
        </div>
        <div>
          <button disabled={isPending} className="btn btn-primary uppercase">
            {isPending ? "verifying..." : "verify"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const SMSOtp = ({ setStep, maskedPhone, officialId }) => {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [serverError, setServerError] = useState(null);

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const handleChange = (index, e) => {
    const val = e.target.value;

    if (val && !/^\d+$/.test(val)) return;

    const newOtp = [...otpValues];
    newOtp[index] = val ? val.slice(-1) : "";
    setOtpValues(newOtp);

    const fullOtp = newOtp.join("");
    setValue("otp", fullOtp);

    if (fullOtp.length === 6) {
      clearErrors("otp");
    }

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otpValues];

      digits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });

      setOtpValues(newOtp);
      setValue("otp", newOtp.join(""));
      clearErrors("otp");

      const targetIdx = Math.min(digits.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const { verifySmsOtp, isPending } = useVerifySmsOtp();

  const onOtpSubmit = async () => {
    const fullOtpString = otpValues.join("");

    if (fullOtpString.length !== 6) {
      setError("otp", {
        type: "manual",
        message: "Please enter the full 6-digit code",
      });
      return;
    }

    const payload = { otp: fullOtpString, official_id: officialId };

    verifySmsOtp(payload, {
      onSuccess: () => {
        setStep(4);
        localStorage.setItem("step", 4);
      },
      onError: (err) => {
        setServerError(err.response?.data?.message || "Invalid OTP entered.");
      },
      onSettled: () => reset(),
    });
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-xl font-bold justify-center">
          Verify Authorized Signatory
        </h2>
        <p className="text-sm text-base-content/70 text-center">
          Enter the 6-digit code sent to registered mobile{" "}
          <span className="font-semibold text-primary">{maskedPhone}</span>
        </p>

        {serverError && (
          <div role="alert" className="alert alert-error text-sm py-2 mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onOtpSubmit)} className="mt-4 space-y-4">
          <div className="flex justify-center gap-2">
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`input input-bordered w-12 h-14 text-center text-xl font-bold rounded-lg focus:input-primary ${
                  errors.otp || serverError ? "input-error" : ""
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {errors.otp && (
            <p className="text-error text-xs text-center font-medium">
              {errors.otp.message}
            </p>
          )}

          <div className="card-actions justify-between items-center pt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setStep(2)}
              disabled={isPending}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {isPending ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmailVerification = ({ setStep, setEmail }) => {
  const { verifyEmail, isPending } = useVerifyEmail();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const submitHandler = (data) => {
    verifyEmail(data, {
      onSuccess: (data, variables) => {
        setStep(5);
        localStorage.setItem("step", 5);
        setEmail(variables.email);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Invalid Credentials");
      },
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Agency Official Email Id</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("email", {
                required: "This field is required!",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
          </label>
          {errors?.email ? <p>{errors.email.message}</p> : ""}
        </div>
        <div>
          <button disabled={isPending} className="uppercase btn btn-primary">
            verify
          </button>
        </div>
      </form>
    </div>
  );
};

const apiVerifyEmailOtp = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/verifyEmailOtp",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );

  return response.data;
};

const useVerifyEmailOtp = () => {
  const { mutate: verifyEmailOtp, isPending } = useMutation({
    mutationFn: apiVerifyEmailOtp,
  });
  return { verifyEmailOtp, isPending };
};

export const EmailOtp = ({ setStep, email }) => {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const {
    verifyEmailOtp,
    isPending,
    error: mutationError,
  } = useVerifyEmailOtp();

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (val && !/^\d+$/.test(val)) return;

    const newOtp = [...otpValues];
    newOtp[index] = val ? val.slice(-1) : "";
    setOtpValues(newOtp);

    const fullOtp = newOtp.join("");
    setValue("otp", fullOtp);

    if (fullOtp.length === 6) {
      clearErrors("otp");
    }

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newOtp = [...otpValues];

      digits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });

      setOtpValues(newOtp);
      setValue("otp", newOtp.join(""));
      clearErrors("otp");

      const targetIdx = Math.min(digits.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const onSubmit = () => {
    const fullOtp = otpValues.join("");

    if (fullOtp.length !== 6) {
      setError("otp", {
        type: "manual",
        message: "Please enter the complete 6-digit verification code.",
      });
      return;
    }

    verifyEmailOtp(
      {
        email,
        otp: fullOtp,
      },
      {
        onSuccess: () => {
          setStep(6);
          localStorage.setItem("step", 6);
        },
        onSettled: () => reset(),
      },
    );
  };

  const serverErrorMessage =
    mutationError?.response?.data?.message || mutationError?.message;

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-200 mx-auto">
      <div className="card-body">
        <h2 className="card-title text-xl font-bold justify-center">
          Verify Official Email
        </h2>
        <p className="text-sm text-base-content/70 text-center">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-semibold text-primary">{email}</span>
        </p>

        {serverErrorMessage && (
          <div role="alert" className="alert alert-error text-sm py-2 mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{serverErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5">
          <div className="flex justify-center gap-2">
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={isPending}
                className={`input input-bordered w-12 h-14 text-center text-xl font-bold rounded-lg focus:input-primary ${
                  errors.otp || serverErrorMessage ? "input-error" : ""
                }`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {errors.otp && (
            <p className="text-error text-xs text-center font-medium">
              {errors.otp.message}
            </p>
          )}

          <div className="card-actions justify-between items-center pt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setStep((prev) => prev - 1)}
              disabled={isPending}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {isPending ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const apiRegisterAgency = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/register",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useRegisterAgency = () => {
  const queryClient = useQueryClient();
  const { mutate: registerAgency, isPending } = useMutation({
    mutationFn: apiRegisterAgency,
    onSuccess: (data) => {
      queryClient.setQueryData(["agency"], data.agency);
    },
  });
  return { registerAgency, isPending };
};

export const AgencyRegistration = ({ agency, setStep }) => {
  const { coordinates, loading, error, fetchLocation } = useGeolocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm();
  const { registerAgency, isPending } = useRegisterAgency();
  console.log(agency);
  const submitHandler = (data) => {
    const payload = {
      agency_id: agency.agency_id,
      agency_name: agency.legal_name,
      category: agency.category,
      authorized_state: agency.authorized_state,
      official_email: agency.official_agency_email,
      hotline_no: data.hotline_no,
      password: data.password,
      hq_location_address: data.hq_location_address,
      coverage_radius_km: data.coverage_radius_km,
      latitude: data.latitude,
      longitude: data.longitude,
      primary_capabilities_tags: data.primary_capabilities_tags,
    };
    registerAgency(payload, {
      onSuccess: () => {
        setStep(1);
        localStorage.removeItem("step");
        navigate("/agency/home", { replace: true });
        reset();
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ||
            "An error occured during registration. Try again later!",
        );
      },
    });
  };

  useEffect(() => {
    if (coordinates?.latitude) {
      setValue("latitude", coordinates.latitude);
      setValue("longitude", coordinates.longitude);
    }
  }, [coordinates, setValue]);
  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Operational Coverage Radius in km</span>
            <input
              type="number"
              disabled={isPending}
              className="input input-primary"
              {...register("coverage_radius_km", {
                required: "This field is required",
              })}
            />
          </label>
          {errors?.coverage_radius_km ? (
            <p>{errors?.coverage_radius_km.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <label className="floating-label">
            <span>Emergency Hotline No.</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("hotline_no", {
                required: "This field is required!",
              })}
            />
          </label>
          {errors?.hotline_no ? <p>{errors?.hotline_no.message}</p> : ""}
        </div>
        <div>
          <h2>Primary Capabilities</h2>
          <div>
            <label htmlFor="med">MEDICAL</label>
            <input
              id="med"
              value="MEDICAL"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          <div>
            <label htmlFor="water">WATER RESCUE</label>
            <input
              id="water"
              value="WATER RESCUE"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          <div>
            <label htmlFor="fire">FIRE RESCUE</label>
            <input
              id="fire"
              value="FIRE RESCUE"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          <div>
            <label htmlFor="food">FOOD DISTRIBUTION</label>
            <input
              id="food"
              value="FOOD DISTRIBUTION"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          <div>
            <label htmlFor="shelter">SHELTER</label>
            <input
              id="shelter"
              value="SHELTER"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          <div>
            <label htmlFor="clearance">HEAVY CLEARANCE</label>
            <input
              id="clearance"
              value="HEAVY CLEARANCE"
              disabled={isPending}
              type="checkbox"
              {...register("primary_capabilities_tags", {
                validate: (value) =>
                  value.length > 0 || "Select at least one of these tags",
              })}
            />
          </div>
          {errors?.primary_capabilities_tags ? (
            <p>{errors?.primary_capabilities_tags.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <label className="floating-label">
            <span>Full Address</span>
            <input
              type="text"
              disabled={isPending}
              className="input input-primary"
              {...register("hq_location_address", {
                required: "This filed is required",
                minLength: {
                  value: 15,
                  message: "Minimum 15 chartacters address has to be entered",
                },
              })}
            />
          </label>
          {errors?.hq_location_address ? (
            <p>{errors?.hq_location_address.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <label>Location Coordinates</label>
          <input
            type="text"
            disabled={isPending}
            placeholder="latitude"
            {...register("latitude", {
              required: "Both the fields are required!",
            })}
          />
          <input
            type="text"
            disabled={isPending}
            placeholder="longitude"
            {...register("longitude", {
              required: "Both the fields are required!",
            })}
          />
          <button type="button" disabled={loading} onClick={fetchLocation}>
            {loading ? "Fetching..." : "Get Location"}
          </button>
          {error ? <p>{error}</p> : ""}
          {errors?.latitude || errors?.longitude ? (
            <p>{errors?.latitude?.message || errors?.longitude?.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <label className="floating-label">
            <span>Password For Future Login</span>
            <input
              type="password"
              disabled={isPending}
              {...register("password", {
                required: "This field is required",
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
                },
              })}
            />
          </label>
          {errors?.password ? <p>{errors?.password.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Confirm Password</span>
            <input
              type="password"
              disabled={isPending}
              {...register("confirmPassword", {
                required: "This field is required!",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match",
              })}
            />
          </label>
          {errors?.confirmPassword ? (
            <p>{errors?.confirmPassword.message}</p>
          ) : (
            ""
          )}
        </div>
        <div>
          <button className="btn btn-primary" disabled={isPending}>
            register
          </button>
        </div>
      </form>
    </div>
  );
};

const apiVerifyAgencyPersonnel = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/verifyAgencyPersonnel",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyAgencyPersonnel = () => {
  const { mutate: verifyPersonnel, isPending } = useMutation({
    mutationFn: apiVerifyAgencyPersonnel,
  });
  return { verifyPersonnel, isPending };
};

const apiVerifyEmail = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/verifyEmail",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyEmail = () => {
  const { mutate: verifyEmail, isPending } = useMutation({
    mutationFn: apiVerifyEmail,
  });
  return { verifyEmail, isPending };
};

const apiVerifySmsOtp = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/verifyDigiOtp",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifySmsOtp = () => {
  const { mutate: verifySmsOtp, isPending } = useMutation({
    mutationFn: apiVerifySmsOtp,
  });
  return { verifySmsOtp, isPending };
};

export const AgencyRegister = () => {
  const [step, setStep] = useState(() => {
    const step = localStorage.getItem("step") || 1;
    return Number(step);
  });
  const [officialId, setOfficialId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("XXXXXXXXXX");
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");

  return (
    <div>
      <h1>Agency Registration</h1>
      {step === 1 ? (
        <AgencyVerification setStep={setStep} setAgency={setAgency} />
      ) : (
        ""
      )}
      {step === 2 ? (
        <PersonnelVerification
          setStep={setStep}
          setOfficialId={setOfficialId}
          setMaskedPhone={setMaskedPhone}
        />
      ) : (
        ""
      )}
      {step === 3 ? (
        <SMSOtp
          setStep={setStep}
          officialId={officialId}
          maskedPhone={maskedPhone}
        />
      ) : (
        ""
      )}
      {step === 4 ? (
        <EmailVerification setStep={setStep} setEmail={setEmail} />
      ) : (
        ""
      )}
      {step === 5 ? <EmailOtp setStep={setStep} email={email} /> : ""}
      {step === 6 ? (
        <AgencyRegistration setStep={setStep} agency={agency} />
      ) : (
        ""
      )}
    </div>
  );
};

const apiAgencyLogin = async (payload) => {
  const response = await axios.post(
    "https://resqgrid-x51v.onrender.com/api/agency/login",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useAgencyLogin = () => {
  const { mutate: agencyLogin, isPending } = useMutation({
    mutationFn: apiAgencyLogin,
  });
  return { agencyLogin, isPending };
};

export const AgencyLogin = () => {
  const { agencyLogin, isPending } = useAgencyLogin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const submitHandler = (payload) => {
    agencyLogin(payload, {
      onSuccess: (data) => {
        queryClient.setQueryData(["agency"], data.agency);
        navigate("/agency/home", { replace: true });
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Invalid Credentials"),
      onSettled: () => reset(),
    });
  };
  return (
    <div>
      <h1>Agency Login</h1>
      <form onSubmit={handleSubmit(submitHandler)}>
        <div>
          <label className="floating-label">
            <span>Agency ID</span>
            <input
              type="text"
              disabled={isPending}
              {...register("agency_id", {
                required: "This field is required",
              })}
            />
          </label>
          {errors?.agency_id ? <p>{errors.agency_id.message}</p> : ""}
        </div>
        <div>
          <label className="floating-label">
            <span>Password</span>
            <input
              type="password"
              disabled={isPending}
              {...register("password", {
                required: "This field is required!",
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
                },
              })}
            />
          </label>
          {errors?.password ? <p>{errors.password.message}</p> : ""}
        </div>
        <div>
          <button className="btn btn-primary uppercase" disabled={isPending}>
            login
          </button>
        </div>
      </form>
    </div>
  );
};

const apiGetMyAgency = async () => {
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/agency/me",
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetMyAgency = () => {
  const { data: agency, isPending } = useQuery({
    queryKey: ["agency"],
    queryFn: apiGetMyAgency,
    staleTime: 1000 * 60 * 5,
  });
  return { agency, isPending };
};

export const AgencyHome = () => {
  const { agency, isPending } = useGetMyAgency();
  if (isPending) return <h1>Loading...</h1>;
  return (
    <div>
      <h1>{agency.agency_name}</h1>
      <p>{agency.authorized_state}</p>
      <p>{agency.hotline_no}</p>
      <p>{agency.coverage_radius_km}</p>
    </div>
  );
};

export const GovRegister = () => {
  return (
    <div>
      <h1>Government Registration</h1>
      <Link to="/gov/login">Already registered? then login...</Link>
    </div>
  );
};
export const GovLogin = () => {
  return (
    <div>
      <h1>Government Login</h1>
    </div>
  );
};

export default App;
