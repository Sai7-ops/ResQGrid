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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  GovtSocketProvider,
  useGovtSocket,
} from "../contexts/GovtSocketContext";
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
import L from "leaflet";
import gsap from "gsap";

import {
  Search,
  Filter,
  Truck,
  Radio,
  Package,
  Mail,
  Phone,
  Crosshair,
  Navigation,
  Eye,
  EyeOff,
  Building,
  MessageSquare,
  Shield,
  MapPin,
  User,
  Landmark,
  ArrowRight,
  LayoutDashboard,
  Inbox,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  Siren,
  Users,
  Clock,
  ArrowUpRight,
  Download,
  Home as HomeIcon,
  AlertCircle,
  Menu,
  X,
  LogOut,
  Bell,
  Ambulance,
  AlertCircleIcon,
  HandHelping,
  ShieldCheck,
} from "lucide-react";

const queryClient = new QueryClient();

const ACCENT = "#0D9488";
const USER_ACCENT = "#2563EB";
const GOVT_ACCENT = "#4338CA";

const STEPS = [
  { id: 1, label: "Agency", Icon: Building },
  { id: 2, label: "Personnel", Icon: User },
  { id: 3, label: "SMS OTP", Icon: MessageSquare },
  { id: 4, label: "Email", Icon: Mail },
  { id: 5, label: "Email OTP", Icon: Shield },
  { id: 6, label: "Details", Icon: MapPin },
];

const USER_STEPS = [
  { id: 1, label: "Identity", Icon: User },
  { id: 2, label: "Verify", Icon: MessageSquare },
  { id: 3, label: "Details", Icon: MapPin },
];

const GOVT_STEPS = [
  { id: 1, label: "Identity", Icon: User },
  { id: 2, label: "Verify", Icon: Shield },
  { id: 3, label: "Secure", Icon: Landmark },
];

const PORTALS = [
  {
    key: "user",
    label: "User",
    desc: "Request help and track your response",
    to: "user/register",
    Icon: User,
    accent: "#2563EB",
    ring: "rgba(37,99,235,0.10)",
  },
  {
    key: "agency",
    label: "Agency",
    desc: "Dispatch teams and manage response",
    to: "agency/register",
    Icon: Shield,
    accent: "#0D9488",
    ring: "rgba(13,148,136,0.10)",
  },
  {
    key: "govt",
    label: "Government",
    desc: "Oversee regions and coordinate agencies",
    to: "govt/register",
    Icon: Landmark,
    accent: "#4338CA",
    ring: "rgba(67,56,202,0.10)",
  },
];

const DISASTER_TYPES = [
  { value: "flood", label: "Flood" },
  { value: "fire", label: "Fire" },
  { value: "earthquake", label: "Earthquake" },
  { value: "cyclone", label: "Cyclone" },
  { value: "medical_emergency", label: "Medical Emergency" },
  { value: "crowd_hazard", label: "Crowd Hazard" },
];

const FieldLabel = ({ children }) => (
  <span className="mb-1.5 block text-[0.8rem] font-medium text-[#334155]">
    {children}
  </span>
);

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-1.5 text-[0.75rem] font-medium text-[#DC2626]">
      {message}
    </p>
  ) : null;

const inputClass =
  "w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[0.92rem] text-[#0F172A] " +
  "placeholder:text-[#94A3B8] outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D948826]";

const userInputClass =
  "w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[0.92rem] text-[#0F172A] " +
  "placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB26]";

const PrimaryButton = ({ children, disabled, ...props }) => (
  <button
    disabled={disabled}
    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-[#0B7C72] disabled:cursor-not-allowed disabled:opacity-60"
    {...props}
  >
    {disabled && (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
    )}
    {children}
  </button>
);

const UserPrimaryButton = ({ children, disabled, ...props }) => (
  <button
    disabled={disabled}
    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
    {...props}
  >
    {disabled && (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
    )}
    {children}
  </button>
);

const GovtPrimaryButton = ({ children, disabled, ...props }) => (
  <button
    disabled={disabled}
    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4338CA] px-4 py-3.5 text-[0.9rem] font-bold text-white shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-800 hover:shadow-indigo-900/40 disabled:cursor-not-allowed disabled:opacity-70"
    {...props}
  >
    {disabled && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
    )}
    {children}
  </button>
);

const CapabilityCheckbox = ({ label, inputId, registerMethod, disabled }) => (
  <label
    htmlFor={inputId}
    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-[0.85rem] font-semibold text-[#0F172A] transition border-[#E2E8F0] bg-white hover:bg-[#F0FDFA] has-checked:border-[#0D9488] has-checked:bg-[#F0FDFA] ${
      disabled ? "cursor-not-allowed opacity-60" : ""
    }`}
  >
    <input
      id={inputId}
      type="checkbox"
      value={label}
      disabled={disabled}
      className="peer sr-only"
      {...registerMethod}
    />
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#CBD5E1] bg-white transition peer-checked:border-[#0D9488] peer-checked:bg-[#0D9488]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-3.5 w-3.5 hidden peer-checked:block"
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    {label}
  </label>
);

const hqIcon = new L.divIcon({
  className: "custom-hq-marker",
  html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const unitIcon = new L.divIcon({
  className: "custom-unit-marker",
  html: `<div style="background-color: #0D9488; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const userLocationIcon = new L.divIcon({
  className: "custom-user-marker",
  html: `<div style="background-color: #2563EB; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const sosAlertMarkerIcon = new L.divIcon({
  className: "custom-sos-marker",
  html: `<div style="background-color: #DC2626; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 1.5s infinite;"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="user/register" element={<UserRegister />} />
          <Route path="agency/register" element={<AgencyRegister />} />
          <Route path="govt/register" element={<GovtRegister />} />
          <Route path="user/login" element={<UserLogin />} />
          <Route path="agency/login" element={<AgencyLogin />} />
          <Route path="govt/login" element={<GovtLogin />} />
          {/* <Route element={<UserPublicRoute />}>
          </Route>
          <Route element={<AgencyPublicRoute />}>
          </Route>
          <Route element={<GovtPublicRoute />}>
          </Route> */}
          <Route element={<AgencyRouteProtector />}>
            <Route path="/agency" element={<AgencyLayout />}>
              <Route path="home" element={<AgencyHome />} />
              <Route path="dashboard" element={<AgencyDashboard />} />
              <Route path="inbox" element={<AgencyInbox />} />
              <Route path="sosInbox" element={<AgencySosInbox />} />
              <Route path="assistInbox" element={<AgencyAssistInbox />} />
              <Route path="units" element={<AgencyUnits />} />
              <Route
                path="unit/:unit_id/activeMission"
                element={<AgencyUnitActiveMission />}
              />
              <Route
                path="unit/:unit_id/trackRecords"
                element={<AgencyTrackRecords />}
              />
              <Route
                path="unit/:unit_id/activeMission/:sos_id/requestAssistance"
                element={<RequestAssistance />}
              />
            </Route>
          </Route>
          <Route element={<UserRouteProtector />}>
            <Route path="/user" element={<UserLayout />}>
              <Route path="home" element={<UserHome />} />
              <Route path="sosForm" element={<UserSOSForm />} />
              <Route path="nearbyAgencies" element={<NearbyAgencies />} />
              <Route
                path="viewNearbyAgencies"
                element={<ViewNearbyAgencies />}
              />
              <Route path="sosInbox" element={<UserSOSInbox />} />
              <Route path="inbox" element={<UserInbox />} />
            </Route>
          </Route>
          <Route element={<GovtRouteProtector />}>
            <Route path="/govt" element={<GovtLayout />}>
              <Route path="home" element={<GovtHome />} />
              <Route path="sosAlerts" element={<GovtSosInbox />} />
              <Route path="sosDispatches" element={<GovtDispatchesInbox />} />
              <Route path="pendingRequests" element={<GovtPendingRequests />} />
              <Route
                path="pendingRequests/:pending_id"
                element={<GovtPendingRequest />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// const GovtPublicRoute = () => {
//   const { official, isPending } = useGovtAuth();

//   if (isPending) {
//     return <FullScreenLoader />;
//   }

//   if (official) {
//     return <Navigate to="/govt/home" replace />;
//   }

//   return <Outlet />;
// };

// const AgencyPublicRoute = () => {
//   const { agency, isPending } = useAgencyAuth();

//   if (isPending) {
//     return <FullScreenLoader />;
//   }

//   if (agency) {
//     return <Navigate to="/agency/home" replace />;
//   }

//   return <Outlet />;
// };

// const UserPublicRoute = () => {
//   const { user, isPending } = useUserAuth();

//   if (isPending) {
//     return <FullScreenLoader />;
//   }

//   if (user) {
//     return <Navigate to="/user/home" replace />;
//   }

//   return <Outlet />;
// };

export const Home = () => {
  const root = useRef(null);
  const pingRefs = useRef([]);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set(
            [".rq-eyebrow", ".rq-headline", ".rq-subtitle", ".rq-portal"],
            { clearProps: "opacity,transform" },
          );
        },
      });

      tl.fromTo(
        ".rq-eyebrow",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6 },
      )
        .fromTo(
          ".rq-headline",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.35",
        )
        .fromTo(
          ".rq-subtitle",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4",
        )
        .fromTo(
          ".rq-portal",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
          "-=0.3",
        );

      gsap.to(".rq-status-dot", {
        boxShadow: "0 0 0 8px rgba(37,99,235,0)",
        repeat: -1,
        duration: 1.8,
        ease: "power1.out",
      });

      pingRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { scale: 0.4, opacity: 0.5 },
          {
            scale: 3,
            opacity: 0,
            duration: 3,
            repeat: -1,
            delay: i * 0.9,
            ease: "power1.out",
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-x-hidden bg-white text-[#0F172A]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 85%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(37,99,235,0.05), transparent 70%)",
        }}
      />

      {[
        { top: "22%", left: "16%", color: "#2563EB" },
        { top: "70%", left: "76%", color: "#0D9488" },
        { top: "78%", left: "20%", color: "#4338CA" },
        { top: "16%", left: "82%", color: "#0D9488" },
      ].map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute hidden h-1.5 w-1.5 rounded-full md:block"
          style={{ top: p.top, left: p.left, backgroundColor: p.color }}
        >
          <span
            ref={(el) => (pingRefs.current[i] = el)}
            className="absolute -inset-1.5 rounded-full border"
            style={{ borderColor: p.color }}
          />
        </span>
      ))}

      <div className="h-14 w-full" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="rq-eyebrow mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B] sm:mb-5 sm:text-[12px] sm:tracking-[0.28em]">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="rq-status-dot h-1.5 w-1.5 rounded-full bg-[#2563EB]"
              style={{ boxShadow: "0 0 0 0 rgba(37,99,235,0.5)" }}
            />
          </span>
          Live Coordination Network
        </div>

        <h1 className="rq-headline text-3xl font-bold leading-tight tracking-tight text-[#0F172A] sm:text-5xl md:text-[3.9rem] md:leading-[1.05]">
          Welcome to{" "}
          <span className="bg-linear-to-r from-[#2563EB] via-[#0D9488] to-[#4338CA] bg-clip-text text-transparent">
            ResQGrid
          </span>
        </h1>

        <p className="rq-subtitle mt-4 max-w-lg text-[0.95rem] leading-relaxed text-[#475569] sm:mt-5 sm:text-base">
          One grid connecting the people who need help, the teams who respond,
          and the agencies who coordinate it — in real time.
        </p>
        <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-4 sm:mt-12 sm:gap-5">
          {PORTALS.map(({ key, label, desc, to, Icon, accent, ring }) => (
            <Link
              key={key}
              to={to}
              className="rq-portal group relative w-full max-w-xs rounded-lg border border-[#E2E8F0] bg-white px-5 pb-5 pt-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 sm:w-48"
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = `0 14px 28px -16px ${accent}`)
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
            >
              <span
                className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 rounded-t-lg transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: accent }}
              />
              <span
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-md"
                style={{ backgroundColor: ring, color: accent }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>

              <div className="text-[1rem] font-semibold tracking-tight text-[#0F172A]">
                {label}
              </div>
              <div className="mt-1.5 text-[0.78rem] leading-snug text-[#64748B]">
                {desc}
              </div>

              <div
                className="mt-4 flex items-center gap-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-widest"
                style={{ color: accent }}
              >
                Enter
                <ArrowRight
                  size={11}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <footer className="relative z-10 flex h-14 w-full items-center justify-center px-4 font-mono text-[10px] tracking-[0.12em] text-[#94A3B8] sm:text-[11px]">
        RESQGRID // COORDINATED RESPONSE, ANY SCALE
      </footer>
    </div>
  );
};

const apiGetOfficial = async () => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/govt/govtOfficial`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGovtAuth = () => {
  const {
    data: official,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["govtOfficial"],
    queryFn: apiGetOfficial,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  return {
    official,
    isPending,
    isAuthenticated: !isError && Boolean(official),
    error,
    isError,
  };
};

const GovtRouteProtector = () => {
  const { isPending, isAuthenticated, isError, error } = useGovtAuth();

  useEffect(() => {
    if (isError) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  }, [isError, error]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2563EB] bg-blue-50">
            <span className="text-2xl font-bold">🇮🇳</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Verifying Government Portal
          </h1>
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2563EB]"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

const AgencyRouteProtector = () => {
  const { isPending, isAuthenticated } = useAgencyAuth();
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0D9488] bg-teal-50">
            <span className="text-2xl font-bold">🇮🇳</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Verifying Authentication
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we verify your agency credentials.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0D9488]"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

const useGeolocation = () => {
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);

        setError(err.message || "Failed to retrieve location");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

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
  const { data: alert_status = [], isPending } = useQuery({
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

  const { alertStatus, dispatchData, setAlertStatus, setDispatchData } =
    useUserSocket();

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

  if (isPending || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
      </div>
    );
  }

  if (!alert_status || alert_status?.length === 0) {
    return (
      <div className="rounded-4xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center backdrop-blur-sm max-w-4xl mx-auto">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
          <Shield size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800">No Active SOS</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">
          You have no active emergency alerts currently in transit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-red-50/40 p-6 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                  SOS #{alertStatus?.sos_id}
                </h3>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {alertStatus?.disaster_type}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Clock size={13} className="text-slate-400" /> Triggered:{" "}
                {alertStatus?.triggered_at}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-red-200 bg-red-100 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-red-700">
            {alertStatus?.status}
          </span>
        </div>

        <div className="p-6">
          <p className="text-sm font-medium text-slate-600">
            {alertStatus?.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Truck size={20} className="text-[#2563EB]" /> Responding Dispatches (
          {dispatchData.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {dispatchData.map((dispatch) => (
            <div
              key={dispatch.dispatch_id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    ID: {dispatch.dispatch_id}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {dispatch.unit_name}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500">
                    {dispatch.agency_name}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                  {dispatch.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700">
                  {dispatch.unit_type}
                </span>
                <span>Assigned: {dispatch.assigned_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MapPin size={18} className="text-[#2563EB]" /> Live Response Map
          </h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          </span>
        </div>

        {coordinates.latitude !== null && coordinates.longitude !== null ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer
              center={[coordinates.latitude, coordinates.longitude]}
              zoom={13}
              style={{ height: "450px", width: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {dispatchData.map((dispatch) => {
                const [lng, lat] = dispatch.unit_location.coordinates;
                return (
                  <Marker
                    key={dispatch.dispatch_id}
                    position={[lat, lng]}
                    icon={unitIcon}
                  >
                    <Popup>
                      <div className="p-1 text-center">
                        <strong className="block text-sm font-bold text-slate-900">
                          {dispatch.unit_name}
                        </strong>
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {dispatch.unit_type}
                        </span>
                        <p className="mt-1 text-xs text-slate-500">
                          Status: {dispatch.status}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              <Marker
                position={[coordinates.latitude, coordinates.longitude]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="p-1 text-center">
                    <strong className="block text-sm font-bold text-slate-900">
                      Your Reported Location
                    </strong>
                    <p className="text-xs text-slate-500">
                      SOS ID: {alertStatus?.sos_id}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
            Locating coordinates for map tracking...
          </div>
        )}
      </div>
    </div>
  );
};

const apiGetNearbyAgencies = async (payload) => {
  const { latitude, longitude, disaster_type } = payload;
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/user/nearbyAgencies",
    {
      params: {
        latitude,
        longitude,
        disaster_type,
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useNearbyAgencies = ({ latitude, longitude, disaster_type }) => {
  const payload = {
    latitude,
    longitude,
    disaster_type,
  };
  const { data: nearbyAgencies = [], isPending } = useQuery({
    queryKey: ["nearbyAgencies", latitude, longitude, disaster_type],
    queryFn: () => apiGetNearbyAgencies(payload),
    enabled: latitude != null && longitude != null && !!disaster_type,
  });
  return { nearbyAgencies, isPending };
};

const apiAlertAgency = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/user/alertAgency`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useAlertAgency = () => {
  const { mutate: alertAgency, isPending } = useMutation({
    mutationFn: apiAlertAgency,
  });
  return { alertAgency, isPending };
};

const NearbyAgencies = () => {
  const { coordinates, loading, fetchLocation } = useGeolocation();
  const [disasterType, setDisasterType] = useState("medical_emergency");
  const { user } = useUserAuth();
  const { alert_status, isPending: fetching } = useGetAlertStatus();
  const [active, setActive] = useState(false);
  const [description, setDescription] = useState("");
  const [isVictim, setIsVictim] = useState(false);
  const { alertAgency, isPending: alerting } = useAlertAgency();
  const { nearbyAgencies, isPending } = useNearbyAgencies({
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    disaster_type: disasterType,
  });

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const reset = () => {
    setDescription("");
    setIsVictim(false);
  };

  const submitHandler = (agency) => {
    const payload = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      description,
      is_victim: isVictim,
      disaster_type: disasterType,
      agency,
    };
    alertAgency(payload, {
      onSuccess: (data) => {
        toast.success("SOS triggered successfully");
        queryClient.setQueryData(["activeSos", data.user_id], {
          ...data,
          active: true,
        });
        queryClient.invalidateQueries({
          queryKey: [
            "nearbyAgencies",
            coordinates.latitude,
            coordinates.longitude,
            disasterType,
          ],
        });
        setActive(true);
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Failed to trigger SOS"),
      onSettled: reset,
    });
  };

  if (loading || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
      </div>
    );
  }
  if (alert_status?.length > 0 || active) {
    return (
      <div className="rounded-4xl border border-amber-200 bg-amber-50/60 p-12 text-center max-w-xl mx-auto shadow-sm backdrop-blur-xl mt-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Active Emergency Pending
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You already have an active SOS broadcast in progress. Track the
          response progress in your alert portal.
        </p>
        <Link
          to="/user/sosInbox"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
        >
          View Alert Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Siren className="text-red-600" /> Alert Nearby Agencies
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your emergency details. This data will be sent directly to
            the responding agency when you trigger an SOS.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              Disaster Type
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
            >
              <option value="medical_emergency">MEDICAL EMERGENCY</option>
              <option value="fire">FIRE</option>
              <option value="flood">FLOOD</option>
              <option value="cyclone">CYCLONE</option>
              <option value="earthquake">EARTHQUAKE</option>
              <option value="crowd_hazard">CROWD HAZARD</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              Description (Optional)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Need ambulance at main gate..."
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 h-11.5">
            <input
              id="is_victim"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              checked={isVictim}
              onChange={(e) => setIsVictim(e.target.checked)}
            />
            <label
              htmlFor="is_victim"
              className="text-sm font-semibold text-slate-800 cursor-pointer select-none"
            >
              I am the victim
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Building size={20} className="text-[#2563EB]" /> Available Responders
        </h2>

        {isPending ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
          </div>
        ) : nearbyAgencies.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-400 shadow-inner">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700">
              No Agencies Found
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              There are no agencies matching your criteria within immediate
              range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4">Agency ID</th>
                  <th className="p-4">Agency Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Hotline No</th>
                  <th className="p-4">HQ Address</th>
                  <th className="p-4">Official Email</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nearbyAgencies.map((agency, index) => (
                  <tr
                    key={`${agency.agency_id}-${index}`}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {agency.agency_id}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {agency.agency_name}
                    </td>
                    <td className="p-4">
                      <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                        {agency.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {agency.distance_km} km away
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {agency.hotline_no}
                    </td>
                    <td
                      className="p-4 truncate max-w-50"
                      title={agency.hq_location_address}
                    >
                      {agency.hq_location_address}
                    </td>
                    <td className="p-4 text-[#2563EB] font-medium">
                      {agency.official_email}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        disabled={alerting}
                        onClick={() => submitHandler(agency)}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                      >
                        {alerting ? "Triggering..." : "Trigger SOS"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MapPin size={18} className="text-[#2563EB]" /> Target Agencies Map
          </h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          </span>
        </div>

        {coordinates?.latitude !== null && coordinates?.longitude !== null ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer
              center={[coordinates.latitude, coordinates.longitude]}
              zoom={13}
              style={{ height: "450px", width: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {!isPending &&
                nearbyAgencies.map((agency, index) => {
                  const lng =
                    agency.hq_coordinates.coordinates[0] + index * 0.00015;
                  const lat =
                    agency.hq_coordinates.coordinates[1] + index * 0.00015;

                  return (
                    <Marker
                      key={`${agency.agency_id}-${index}`}
                      position={[lat, lng]}
                      icon={unitIcon}
                    >
                      <Popup>
                        <div className="p-1 text-center">
                          <strong className="block text-sm font-bold text-slate-900">
                            {agency.agency_name}
                          </strong>
                          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {agency.category}
                          </span>
                          <p className="mt-1 mb-2 text-xs text-slate-500">
                            Distance: {agency.distance_km}km away
                          </p>

                          <button
                            disabled={alerting}
                            onClick={() => submitHandler(agency)}
                            className="mt-1 w-full rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Trigger SOS
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              <Marker
                position={[coordinates.latitude, coordinates.longitude]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="p-1 text-center">
                    <strong className="block text-sm font-bold text-slate-900">
                      Your Location
                    </strong>
                    <p className="text-xs text-slate-500">
                      USER ID: {user?.user_id}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
            Locating coordinates for map tracking...
          </div>
        )}
      </div>
    </div>
  );
};

const apiViewNearbyAgencies = async (payload) => {
  const { latitude, longitude, disaster_type } = payload;
  const response = await axios.get(
    "https://resqgrid-x51v.onrender.com/api/user/viewNearbyAgencies",
    {
      params: {
        latitude,
        longitude,
        disaster_type,
      },
      withCredentials: true,
    },
  );
  return response.data;
};

const useViewNearbyAgencies = ({ latitude, longitude, disaster_type }) => {
  const payload = {
    latitude,
    longitude,
    disaster_type,
  };
  const { data: nearbyAgencies = [], isPending } = useQuery({
    queryKey: ["nearbyAgencies", latitude, longitude, disaster_type],
    queryFn: () => apiViewNearbyAgencies(payload),
    enabled: !!latitude && !!longitude && !!disaster_type,
  });
  return { nearbyAgencies, isPending };
};

const ViewNearbyAgencies = () => {
  const { coordinates, loading, fetchLocation } = useGeolocation();
  const [disasterType, setDisasterType] = useState("medical_emergency");
  const { user } = useUserAuth();
  const { nearbyAgencies, isPending } = useViewNearbyAgencies({
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    disaster_type: disasterType,
  });

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full">
      <div className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Eye className="text-[#2563EB]" /> View Nearby Agencies
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse emergency response agencies in your vicinity based on
            disaster readiness.
          </p>
        </div>

        <div className="w-full md:w-72 shrink-0">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <AlertTriangle size={14} className="text-[#2563EB]" /> Filter
            Capability
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
          >
            <option value="medical_emergency">MEDICAL EMERGENCY</option>
            <option value="fire">FIRE</option>
            <option value="flood">FLOOD</option>
            <option value="cyclone">CYCLONE</option>
            <option value="earthquake">EARTHQUAKE</option>
            <option value="crowd_hazard">CROWD HAZARD</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Building size={20} className="text-[#2563EB]" /> Available Responders
        </h2>

        {isPending ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
          </div>
        ) : nearbyAgencies.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-400 shadow-inner">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700">
              No Agencies Found
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              There are no agencies matching your criteria within immediate
              range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4">Agency ID</th>
                  <th className="p-4">Agency Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Hotline No</th>
                  <th className="p-4">HQ Address</th>
                  <th className="p-4">Official Email</th>
                  <th className="p-4">Updated On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nearbyAgencies.map((agency, index) => (
                  <tr
                    key={`${agency.agency_id}-${index}`}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {agency.agency_id}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {agency.agency_name}
                    </td>
                    <td className="p-4">
                      <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                        {agency.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {agency.distance_km} km away
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {agency.hotline_no}
                    </td>
                    <td
                      className="p-4 truncate max-w-50"
                      title={agency.hq_location_address}
                    >
                      {agency.hq_location_address}
                    </td>
                    <td className="p-4 text-[#2563EB] font-medium">
                      {agency.official_email}
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-500">
                      {agency.updated_on}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MapPin size={18} className="text-[#2563EB]" /> Nearby Agencies Map
          </h3>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
          </span>
        </div>

        {coordinates?.latitude !== null && coordinates?.longitude !== null ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer
              center={[coordinates.latitude, coordinates.longitude]}
              zoom={13}
              style={{ height: "450px", width: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {!isPending &&
                nearbyAgencies.map((agency, index) => {
                  const lng =
                    agency.hq_coordinates.coordinates[0] + index * 0.00015;
                  const lat =
                    agency.hq_coordinates.coordinates[1] + index * 0.00015;

                  return (
                    <Marker
                      key={`${agency.agency_id}-${index}`}
                      position={[lat, lng]}
                      icon={unitIcon}
                    >
                      <Popup>
                        <div className="p-1 text-center">
                          <strong className="block text-sm font-bold text-slate-900">
                            {agency.agency_name}
                          </strong>
                          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {agency.category}
                          </span>
                          <p className="mt-1 text-xs text-slate-500">
                            Distance: {agency.distance_km}km away
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              <Marker
                position={[coordinates.latitude, coordinates.longitude]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="p-1 text-center">
                    <strong className="block text-sm font-bold text-slate-900">
                      Your Location
                    </strong>
                    <p className="text-xs text-slate-500">
                      USER ID: {user?.user_id}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
            Locating coordinates for map tracking...
          </div>
        )}
      </div>
    </div>
  );
};

const UserInbox = () => {
  const inboxRef = useRef(null);
  useEffect(() => {
    gsap.fromTo(
      inboxRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 },
    );
  }, []);
  return (
    <div
      ref={inboxRef}
      className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
        Inbox
      </h1>
      <p className="mt-2 text-sm text-[#64748B]">
        View incoming messages and alerts from dispatchers.
      </p>
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
    if (sos_alerts) setSosAlerts(sos_alerts);
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
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );
  }

  const availableUnits = agencyUnits.filter(
    (unit) =>
      ["AVAILABLE", "EN_ROUTE", "ON_SCENE"].includes(unit.status) &&
      unit.active_sos_count < unit.sos_capacity,
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0F172A]">
            <Siren className="text-[#0D9488]" /> SOS Alerts
          </h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">
            Live emergency alerts matched to your agency's capabilities.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          {sosAlerts.length} Active
        </span>
      </div>

      {sosAlerts.length === 0 ? (
        <div className="rounded-4xl border-2 border-dashed border-slate-200 bg-white/50 p-16 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
            <Siren size={32} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-700">All Clear</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            No active SOS alerts in your area at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sosAlerts.map((alert) => (
            <div
              key={alert.sos_id}
              className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-red-50/40 p-6 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                        {alert.sos_id}
                      </h3>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {alert.disaster_type}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <MapPin size={14} className="text-[#0D9488]" />
                      {(alert.distance_meters / 1000).toFixed(2)} km away
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-orange-700">
                  {alert.status}
                </span>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm font-medium text-slate-600">
                  {alert.description || "No description provided."}
                </p>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Matched Roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(alert.matched_capabilities || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {(alert.matched_capabilities || []).map((tag) => {
                  const matching_units = availableUnits.filter(
                    (unit) => unit.unit_type === tag,
                  );
                  if (matching_units.length === 0) return null;
                  return (
                    <div
                      key={tag}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                    >
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Available {tag} Units
                      </p>
                      <div className="space-y-2">
                        {matching_units.map((unit) => (
                          <div
                            key={unit.unit_id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {unit.unit_name}
                              </p>
                              <p className="font-mono text-[11px] font-semibold text-slate-500">
                                {unit.unit_id}
                              </p>
                            </div>
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B7C72] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {claimingUnitId === unit.unit_id && (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              )}
                              {claimingUnitId === unit.unit_id
                                ? "Claiming..."
                                : "Claim SOS"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const apiGetAssistRequests = async () => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/agency/assistRequests`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetAssistRequests = () => {
  const { data: assist_requests = [], isPending } = useQuery({
    queryKey: ["assistRequests"],
    queryFn: apiGetAssistRequests,
  });
  return { assist_requests, isPending };
};

const AgencyAssistInbox = () => {
  const { agencySocket, assistRequests, setAssistRequests } = useAgencySocket();

  const { assist_requests, isPending } = useGetAssistRequests();
  const { agencyUnits, isPending: fetching } = useGetAgencyUnits();

  const [assistingUnitId, setAssistingUnitId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (assist_requests) {
      setAssistRequests(assist_requests);
    }
  }, [assist_requests, setAssistRequests]);

  const handleAssistRequest = ({
    assist_id,
    sos_id,
    unit_id,
    agency_id,
    assisting_unit_id,
  }) => {
    if (!agencySocket) {
      toast.error("Socket is not connected!");
      return;
    }

    setAssistingUnitId(assisting_unit_id);

    const payload = {
      assist_id,
      sos_id,
      unit_id,
      agency_id,
      assisting_unit_id,
    };

    agencySocket.emit("ASSIST_SOS_REQUEST", payload, (response) => {
      setAssistingUnitId(null);

      if (response?.success) {
        toast.success(`Unit ${assisting_unit_id} is assisting SOS #${sos_id}.`);

        setAssistRequests((prev) =>
          prev.filter((request) => request.assist_id !== assist_id),
        );

        queryClient.invalidateQueries({
          queryKey: ["agencyUnits"],
        });

        queryClient.invalidateQueries({
          queryKey: ["assistRequests"],
        });
      } else {
        toast.error(
          `Failed to assist: ${response?.message || "Unknown error"}`,
        );
      }
    });
  };

  if (isPending || fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );
  }

  const activeUnits = agencyUnits.filter(
    (unit) =>
      unit.status === "AVAILABLE" ||
      unit.status === "EN_ROUTE" ||
      unit.status === "ON_SCENE",
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0F172A]">
            <HandHelping className="text-[#0D9488]" />
            Assistance Requests
          </h1>

          <p className="mt-1 text-[0.9rem] text-[#64748B]">
            Live assistance requests from units handling active emergencies.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          {assistRequests.length} Active
        </span>
      </div>

      {assistRequests.length === 0 ? (
        <div className="rounded-4xl border-2 border-dashed border-slate-200 bg-white/50 p-16 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
            <HandHelping size={32} />
          </div>

          <h3 className="text-xl font-extrabold text-slate-700">All Clear</h3>

          <p className="mt-2 text-sm font-medium text-slate-500">
            No active assistance requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {assistRequests.map((request) => {
            const matchingUnits = activeUnits.filter(
              (unit) => unit.unit_type === request.unit_type,
            );

            return (
              <div
                key={request.assist_id}
                className="overflow-hidden rounded-4xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-orange-50/40 p-6 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <HandHelping size={24} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                          SOS #{request.sos_id}
                        </h3>

                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          {request.unit_type}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Assistance requested by{" "}
                        <span className="font-bold text-slate-700">
                          {request.agency_name}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-orange-700">
                    {request.status}
                  </span>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Requesting Unit
                      </p>

                      <p className="text-sm font-bold text-slate-900">
                        {request.unit_name}
                      </p>

                      <p className="mt-1 font-mono text-[11px] font-semibold text-slate-500">
                        Unit #{request.unit_id}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Unit Type
                      </p>

                      <p className="text-sm font-bold text-slate-900">
                        {request.unit_type}
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        Dispatch: {request.dispatch_status}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Assistance Required
                    </p>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-sm font-medium leading-relaxed text-slate-600">
                        {request.description ||
                          "No additional description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-wider">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                      SOS: {request.sos_status}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                      Dispatch: {request.dispatch_status}
                    </span>
                  </div>

                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Units Available For Assistance
                    </p>

                    {matchingUnits.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-sm font-semibold text-slate-500">
                          No {request.unit_type} units currently have capacity
                          to assist.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {matchingUnits.map((unit) => (
                          <div
                            key={unit.unit_id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {unit.unit_name}
                              </p>

                              <p className="font-mono text-[11px] font-semibold text-slate-500">
                                {unit.unit_id}
                              </p>

                              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {unit.status} · {unit.active_sos_count ?? 0}/
                                {unit.sos_capacity} SOS
                              </p>
                            </div>

                            <button
                              disabled={
                                assistingUnitId === unit.unit_id ||
                                (unit.active_sos_count ?? 0) >=
                                  unit.sos_capacity
                              }
                              onClick={() =>
                                handleAssistRequest({
                                  assist_id: request.assist_id,
                                  sos_id: request.sos_id,
                                  unit_id: request.unit_id,
                                  agency_id: request.agency_id,
                                  assisting_unit_id: unit.unit_id,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B7C72] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {assistingUnitId === unit.unit_id && (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              )}

                              {assistingUnitId === unit.unit_id
                                ? "Assisting..."
                                : "Assist"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
  const queryClient = useQueryClient();
  const { mutate: logoutUser, isPending } = useMutation({
    mutationFn: apiLogoutUser,
    onSuccess: () => {
      navigate("/", { replace: true });
      queryClient.clear();
      toast.success("Logged out successfully");
    },
    onError: () => toast.error("An error occured while logging out"),
  });
  return { logoutUser, isPending };
};

const UserLayout = () => {
  const { logoutUser, isPending } = useLogoutUser();
  const layoutRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinks = [
    { to: "/user/home", label: "Home", Icon: HomeIcon },
    { to: "/user/sosForm", label: "Trigger SOS", Icon: AlertTriangle },
    {
      to: "/user/nearbyAgencies",
      label: "Alert Agency",
      Icon: AlertCircleIcon,
    },
    { to: "/user/viewNearbyAgencies", label: "View Agencies", Icon: Eye },
    { to: "/user/sosInbox", label: "My Alerts", Icon: Siren },
    { to: "/user/inbox", label: "Inbox", Icon: Inbox },
  ];

  const logoutHandler = () => {
    logoutUser();
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ul-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
      gsap.fromTo(
        ".ul-nav-item",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2,
        },
      );
      gsap.fromTo(
        ".ul-content",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.3 },
      );
    }, layoutRef);
    return () => ctx.revert();
  }, []);
  return (
    <UserSocketProvider>
      <div
        ref={layoutRef}
        className="relative z-0 min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#0F172A]"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(37,99,235,0.04), transparent 70%)",
          }}
        />

        <header className="ul-header relative z-30 border-b border-[#E2E8F0] bg-white shadow-sm">
          <div className="bg-[#0F172A]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[0.75rem] font-medium uppercase tracking-wide text-slate-300 sm:px-6">
              <span>Citizen Emergency Portal</span>
              <span>Official Platform</span>
            </div>
          </div>

          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: USER_ACCENT }}
                />
                Citizen Portal
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                ResQGrid <span style={{ color: USER_ACCENT }}>Citizen</span>
              </h1>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {navLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `ul-nav-item flex items-center gap-2 rounded-lg px-4 py-2.5 text-[0.88rem] font-semibold transition-all ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-md shadow-blue-900/10"
                        : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={logoutHandler}
                disabled={isPending}
                className="ul-nav-item ml-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-[0.88rem] font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
              >
                {isPending ? "Logging out..." : "Logout"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] lg:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </header>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 right-0 z-60 flex h-full w-72 flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div className="mb-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: USER_ACCENT }}
                />
                Citizen Portal
              </div>
              <h2 className="text-base font-bold text-slate-900">
                ResQGrid <span style={{ color: USER_ACCENT }}>Citizen</span>
              </h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
            {navLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logoutHandler();
              }}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <LogOut size={16} />
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <main className="ul-content relative z-10 mx-auto min-h-[calc(100vh-180px)] max-w-7xl px-6 py-8">
          <Outlet />
        </main>

        <footer className="relative z-10 border-t border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-[#64748B]">
            © ResQGrid Disaster Management Platform. All Rights Reserved.
          </div>
        </footer>
      </div>
    </UserSocketProvider>
  );
};

const UserHome = () => {
  const { user, isPending } = useUserAuth();
  const homeRef = useRef(null);

  useEffect(() => {
    if (!isPending) {
      let ctx = gsap.context(() => {
        gsap.fromTo(
          ".user-card",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        );
      }, homeRef);
      return () => ctx.revert();
    }
  }, [isPending]);

  if (isPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
      </div>
    );
  return (
    <div ref={homeRef} className="space-y-6">
      <div className="user-card rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[0.75rem] font-bold text-blue-700">
            <User size={14} /> Identity Verified
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
          Welcome, {user?.name}
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          You are connected to the ResQGrid emergency network.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-6 shadow-sm transition hover:border-red-200 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Need Immediate Help?
            </h2>
            <p className="mt-1 text-sm text-slate-600 mb-6">
              Dispatch an emergency response team directly to your location.
            </p>
            <Link
              to="/user/sosForm"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 shadow-lg shadow-red-600/20"
            >
              Trigger Emergency SOS
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Siren size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Your Active Alerts
            </h2>
            <p className="mt-1 text-sm text-slate-600 mb-6">
              Check the status of your previously reported emergencies.
            </p>
            <Link
              to="/user/sosInbox"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              View Active Alerts
            </Link>
          </div>
        </div>
      </div>
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
      is_victim: data.is_victim || true,
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

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]"></span>
      </div>
    );
  }
  if (alert_status?.length > 0 || active) {
    return (
      <div className="rounded-4xl border border-amber-200 bg-amber-50/60 p-12 text-center max-w-xl mx-auto shadow-sm backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Active Emergency Pending
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You already have an active SOS broadcast in progress. Track the
          response progress in your alert portal.
        </p>
        <Link
          to="/user/sosInbox"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
        >
          View Alert Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Siren size={32} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Trigger Emergency SOS
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Provide accurate details to dispatch the correct agency to your
          location immediately.
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <AlertTriangle size={14} className="text-[#2563EB]" /> Emergency
              Type
            </label>
            <select
              defaultValue=""
              disabled={isPending}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
              {...register("disaster_type", {
                required: "Select an emergency type",
              })}
            >
              <option value="" disabled>
                Select emergency type...
              </option>
              {DISASTER_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors?.disaster_type && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.disaster_type.message}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={16} className="text-[#2563EB]" /> Exact Location
              Coordinates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  disabled={isPending}
                  placeholder="Latitude"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  {...register("latitude", {
                    required: "Required",
                  })}
                />
              </div>
              <div>
                <input
                  type="text"
                  disabled={isPending}
                  placeholder="Longitude"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  {...register("longitude", {
                    required: "Required",
                  })}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={fetchLocation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB] px-4 py-2 text-xs font-bold text-[#2563EB] transition hover:bg-blue-50 disabled:opacity-60"
              >
                <Crosshair size={14} />{" "}
                {loading ? "Detecting GPS..." : "Auto-Detect Location"}
              </button>
              {error && (
                <span className="text-xs font-semibold text-red-600">
                  {error}
                </span>
              )}
              {(errors?.latitude || errors?.longitude) && !error && (
                <span className="text-xs font-semibold text-red-600">
                  Please provide coordinates
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input
              id="is_victim"
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              {...register("is_victim")}
            />
            <label
              htmlFor="is_victim"
              className="text-sm font-semibold text-slate-800 cursor-pointer"
            >
              I am the victim (Check if you are personally in danger)
            </label>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <MessageSquare size={14} className="text-[#2563EB]" /> Description
              (Optional)
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 min-h-25 resize-none"
              placeholder="Provide any additional details about the situation..."
              {...register("description")}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 hover:shadow-red-600/40 disabled:opacity-70"
          >
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            <Radio size={18} />{" "}
            {isPending ? "Transmitting..." : "BROADCAST SOS"}
          </button>
        </form>
      </div>
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2563EB] bg-blue-50">
            <span className="text-2xl font-bold">🇮🇳</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Verifying Citizen Portal
          </h1>
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2563EB]"></div>
          </div>
        </div>
      </div>
    );
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
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Full Name</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="Enter full name"
          {...register("full_name", {
            required: "This field is required",
          })}
        />
        <FieldError message={errors?.full_name?.message} />
      </div>
      <div>
        <FieldLabel>Date of Birth</FieldLabel>
        <input
          type="date"
          disabled={isPending}
          className={userInputClass}
          {...register("dob", {
            required: "This field is required",
          })}
        />
        <FieldError message={errors?.dob?.message} />
      </div>
      <div>
        <FieldLabel>Aadhaar No.</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="12-digit number"
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
        <FieldError message={errors?.aadhaar_no?.message} />
      </div>
      <div>
        <FieldLabel>Mobile No.</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="10-digit number"
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
        <FieldError message={errors?.mobile_no?.message} />
      </div>

      <UserPrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Checking..." : "Continue"}
      </UserPrimaryButton>

      <p className="text-center text-[0.82rem] text-[#64748B]">
        Already registered?{" "}
        <Link
          to="/user/login"
          className="font-medium text-[#2563EB] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
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
    <div className="space-y-4">
      <p className="text-center text-[0.85rem] text-[#64748B]">
        Enter the 6-digit code sent to{" "}
        <span className="font-semibold text-[#2563EB]">{maskedPhone}</span>
      </p>

      {serverError && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[0.82rem] font-medium text-[#DC2626]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onOtpSubmit)} className="space-y-4">
        <div className="flex justify-center gap-2.5">
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
              className={`h-12 w-11 rounded-lg border text-center text-lg font-semibold outline-none transition focus:ring-2 focus:ring-[#2563EB26] ${
                errors.otp || serverError
                  ? "border-[#DC2626]"
                  : "border-[#E2E8F0] focus:border-[#2563EB]"
              }`}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {errors.otp && (
          <p className="text-center text-[0.75rem] font-medium text-[#DC2626]">
            {errors.otp.message}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[0.85rem] font-medium text-[#64748B] transition hover:text-[#0F172A]"
            onClick={() => setStep(1)}
            disabled={isPending}
          >
            ← Back
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isPending ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </form>
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      toast.error("Please wait for your GPS coordinates to be acquired.");
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
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Detailed Address</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="Enter address"
          {...register("address", {
            required: "This field is required",
            minLength: {
              value: 15,
              message: "Minimum of 15 characters is required",
            },
          })}
        />
        <FieldError message={errors?.address?.message} />
      </div>
      <div>
        <FieldLabel>Home State</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="State"
          {...register("state", {
            required: "This field is required!",
          })}
        />
        <FieldError message={errors?.state?.message} />
      </div>
      <div>
        <FieldLabel>Age</FieldLabel>
        <input
          type="number"
          disabled={isPending}
          className={userInputClass}
          placeholder="Age"
          {...register("age", {
            required: "This field is required!",
          })}
        />
        <FieldError message={errors?.age?.message} />
      </div>
      <div>
        <FieldLabel>Email</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={userInputClass}
          placeholder="you@email.com"
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Please enter a valid email address",
            },
          })}
        />
        <FieldError message={errors?.email?.message} />
      </div>
      <div>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            className={`${userInputClass} pr-10`}
            placeholder="Create a strong password"
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2563EB] focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError message={errors?.password?.message} />
      </div>
      <div>
        <FieldLabel>Confirm Password</FieldLabel>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            disabled={isPending}
            className={`${userInputClass} pr-10`}
            placeholder="Confirm password"
            {...register("confirmPassword", {
              required: "This field is required!",
              validate: (value) =>
                value === getValues("password") || "Passwords don't match",
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2563EB] focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError message={errors?.confirmPassword?.message} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin size={14} className="text-[#2563EB]" />
          {coordinates.latitude
            ? `GPS Acquired: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
            : "Acquiring GPS location..."}
        </span>
        <button
          type="button"
          onClick={fetchLocation}
          className="font-bold text-[#2563EB] hover:underline"
        >
          Refresh
        </button>
      </div>

      <UserPrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Registering..." : "Register"}
      </UserPrimaryButton>
    </form>
  );
};

export const UserRegister = () => {
  const [step, setStep] = useState(1);
  const [aadhaar_no, setAadhaar_no] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState(null);
  const [user, setUser] = useState("");

  const root = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ur-card",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, x: 14 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
    );
  }, [step]);

  return (
    <div
      ref={root}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-10 text-[#0F172A]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(37,99,235,0.06), transparent 70%)",
        }}
      />

      <div className="ur-card relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: USER_ACCENT }}
            />
            Citizen Portal
          </div>
          <h1 className="text-[1.6rem] font-bold tracking-tight">
            Register as a <span style={{ color: USER_ACCENT }}>user</span>
          </h1>
        </div>

        <div className="mb-8 flex w-full items-center justify-between">
          {USER_STEPS.map(({ id, label, Icon }, i) => {
            const isDone = step > id;
            const isActive = step === id;
            return (
              <div key={id}>
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border text-[0.75rem] font-semibold transition-colors"
                    style={{
                      borderColor: isDone || isActive ? USER_ACCENT : "#E2E8F0",
                      backgroundColor: isDone ? USER_ACCENT : "white",
                      color: isDone
                        ? "white"
                        : isActive
                          ? USER_ACCENT
                          : "#94A3B8",
                    }}
                  >
                    {Icon && <Icon size={14} strokeWidth={2.2} />}
                  </div>
                  <span
                    className="hidden text-center text-[0.65rem] font-bold sm:block"
                    style={{ color: isActive ? USER_ACCENT : "#94A3B8" }}
                  >
                    {label}
                  </span>
                </div>

                {i < USER_STEPS.length - 1 && (
                  <div
                    className="mx-1 h-px flex-1 transition-colors duration-300 sm:mx-2"
                    style={{
                      backgroundColor: isDone ? USER_ACCENT : "#E2E8F0",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={panelRef}
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          {step === 1 && (
            <VerifyUserCredentials
              setStep={setStep}
              setMaskedPhone={setMaskedPhone}
              setAadhaar_no={setAadhaar_no}
              setUser={setUser}
            />
          )}
          {step === 2 && (
            <UserSMSOtp
              maskedPhone={maskedPhone}
              aadhaar_no={aadhaar_no}
              setStep={setStep}
            />
          )}
          {step === 3 && <UserRegistration setStep={setStep} user={user} />}
        </div>

        <p className="mt-6 text-center text-[0.8rem] text-[#94A3B8]">
          <Link to="/" className="hover:text-[#64748B]">
            ← Back to ResQGrid home
          </Link>
        </p>
      </div>
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 text-[#0F172A]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(37,99,235,0.06), transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-all">
        <div className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-linear-to-br from-blue-400/20 to-transparent blur-3xl"></div>

        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#2563EB" }}
            />
            Secure Authentication
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Citizen <span style={{ color: "#2563EB" }}>Login</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Enter your credentials to access the emergency portal
          </p>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Aadhaar Number
            </span>
            <input
              type="text"
              placeholder="12-digit number"
              className={userInputClass}
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
            {errors?.aadhaar_no && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.aadhaar_no.message}
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                disabled={isPending}
                className={`${userInputClass} pr-10`}
                placeholder="Enter your password"
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2563EB] focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors?.password && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <UserPrimaryButton type="submit" disabled={isPending}>
            {isPending ? "Authenticating..." : "Access Portal"}
          </UserPrimaryButton>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            ← Back to ResQGrid home
          </Link>
        </div>
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
  const queryClient = useQueryClient();
  const { mutate: logoutAgency, isPending } = useMutation({
    mutationFn: apiLogoutAgency,
    onSuccess: () => {
      navigate("/", { replace: true });
      queryClient.clear();
      toast.success("Logged out successfully");
    },
    onError: () => toast.error("An error occured while logging out"),
  });
  return { logoutAgency, isPending };
};

const AgencyLayout = () => {
  const layoutRef = useRef(null);
  const { logoutAgency, isPending } = useLogoutAgency();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinks = [
    { to: "/agency/home", label: "Home", Icon: HomeIcon },
    {
      to: "/agency/dashboard",
      label: "Dashboard",
      Icon: LayoutDashboard,
    },
    { to: "/agency/inbox", label: "Inbox", Icon: Inbox },
    { to: "/agency/units", label: "Units", Icon: Navigation },
    { to: "/agency/sosInbox", label: "SOS Inbox", Icon: Siren },
    { to: "/agency/assistInbox", label: "Assist Inbox", Icon: HandHelping },
  ];

  const logoutHandler = () => {
    logoutAgency();
  };
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".al-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
      gsap.fromTo(
        ".al-nav-item",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2,
        },
      );
      gsap.fromTo(
        ".al-content",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.3 },
      );
    }, layoutRef);
    return () => ctx.revert();
  }, []);
  return (
    <AgencySocketProvider>
      <div
        ref={layoutRef}
        className="relative z-0 min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#0F172A]"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(13,148,136,0.04), transparent 70%)",
          }}
        />

        <header className="al-header relative z-30 border-b border-[#E2E8F0] bg-white shadow-sm">
          <div className="bg-[#0F172A]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[0.75rem] font-medium uppercase tracking-wide text-slate-300 sm:px-6">
              <span>Government Agency Portal</span>
              <span>Official Website</span>
            </div>
          </div>

          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
                Agency Portal
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                ResQGrid <span style={{ color: ACCENT }}>Command</span>
              </h1>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {navLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `al-nav-item flex items-center gap-2 rounded-lg px-4 py-2.5 text-[0.88rem] font-semibold transition-all ${
                      isActive
                        ? "bg-[#0D9488] text-white shadow-md shadow-teal-900/10"
                        : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={logoutHandler}
                disabled={isPending}
                className="al-nav-item ml-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-[0.88rem] font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
              >
                {isPending ? "Logging out..." : "Logout"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D9488] lg:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </header>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 right-0 z-60 flex h-full w-72 flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div className="mb-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
                Agency Portal
              </div>
              <h2 className="text-base font-bold text-slate-900">
                ResQGrid <span style={{ color: ACCENT }}>Command</span>
              </h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
            {navLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#0D9488] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logoutHandler();
              }}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <LogOut size={16} />
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <main className="al-content relative z-10 mx-auto min-h-[calc(100vh-180px)] max-w-7xl px-6 py-8">
          <Outlet />
        </main>

        <footer className="relative z-10 border-t border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-[#64748B]">
            © ResQGrid Disaster Management Platform. All Rights Reserved.
          </div>
        </footer>
      </div>
    </AgencySocketProvider>
  );
};

export const AgencyDashboard = () => {
  const dashRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(
        ".dash-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      );
    }, dashRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={dashRef} className="space-y-6">
      <div className="dash-card flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0F172A]">
            <BarChart3 className="text-[#0D9488]" /> Analytics Dashboard
          </h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">
            Real-time overview of agency operations and resource allocation.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="dash-card rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-slate-600">
            <h3 className="text-sm font-semibold">Active Missions</h3>
            <div className="rounded-md bg-blue-100 p-2 text-blue-600">
              <Siren size={18} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-[#0F172A]">12</p>
            <span className="flex items-center text-sm font-medium text-emerald-600">
              <ArrowUpRight size={16} /> 2 since yesterday
            </span>
          </div>
        </div>

        <div className="dash-card rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-slate-600">
            <h3 className="text-sm font-semibold">Deployed Personnel</h3>
            <div className="rounded-md bg-teal-100 p-2 text-teal-600">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-[#0F172A]">84</p>
            <span className="text-sm font-medium text-slate-500">
              Across 5 zones
            </span>
          </div>
        </div>

        <div className="dash-card rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-slate-600">
            <h3 className="text-sm font-semibold">Avg. Response Time</h3>
            <div className="rounded-md bg-orange-100 p-2 text-orange-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-[#0F172A]">
              14<span className="text-xl text-slate-500">m</span>
            </p>
            <span className="flex items-center text-sm font-medium text-emerald-600">
              <ArrowUpRight size={16} className="rotate-90" /> -2m improvement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgencyInbox = () => {
  const inboxRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(
        ".inbox-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      );
    }, inboxRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={inboxRef} className="space-y-6">
      <div className="inbox-card rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Inbox
        </h1>
        <p className="mt-2 text-[0.9rem] text-[#64748B]">
          View and manage incoming agency messages and regional dispatches.
        </p>
      </div>
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
  const { agency, isPending: agencyPending } = useGetMyAgency();
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (isPending || agencyPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );
  }

  const [hqLng, hqLat] = agency.hq_location.coordinates;
  const currentCenter = mapCenter || [hqLat, hqLng];

  const formatAssetName = (name) => {
    return name
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const filteredUnits = agencyUnits.filter((unit) => {
    const query = searchQuery.toLowerCase();
    return (
      unit.unit_name?.toLowerCase().includes(query) ||
      unit.unit_id?.toLowerCase().includes(query) ||
      unit.unit_type?.toLowerCase().includes(query) ||
      unit.unit_email?.toLowerCase().includes(query)
    );
  });

  const activeCount = agencyUnits.filter(
    (u) => u.status === "AVAILABLE",
  ).length;
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-5 rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0F172A]">
            <Navigation className="text-[#0D9488]" /> Fleet Command
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
              Total: {agencyUnits.length}
            </span>
            <span className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
              Ready: {activeCount}
            </span>
          </div>
        </div>

        <div className="flex w-full gap-3 md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search units or assets..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>
          <button className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
        {filteredUnits.map((unit) => {
          const isAvailable = unit.status === "AVAILABLE";
          const statusColor = isAvailable
            ? "text-emerald-700 bg-emerald-100 border-emerald-200"
            : "text-slate-700 bg-slate-100 border-slate-200";
          const dotColor = isAvailable ? "bg-emerald-500" : "bg-slate-400";
          const [lng, lat] = unit.location.coordinates;

          return (
            <div
              key={unit.unit_id}
              className="group relative flex flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-teal-300/50 hover:shadow-[0_20px_40px_rgba(13,148,136,0.12)] w-full md:w-[calc(50%-1rem)] xl:w-[calc(33.333%-1.41rem)] max-w-md"
            >
              <div className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-linear-to-br from-teal-400/20 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-150"></div>

              <div className="mb-6 flex items-start justify-between">
                <div className="pr-4">
                  <h3 className="mb-1 text-xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-teal-700 line-clamp-1">
                    {unit.unit_name}
                  </h3>
                  <p className="font-mono text-[11px] font-semibold text-slate-500">
                    {unit.unit_id}
                  </p>
                </div>
                <div
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-sm ${statusColor}`}
                >
                  <span className="relative flex h-2 w-2">
                    {isAvailable && (
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`}
                      ></span>
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}
                    ></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {unit.status}
                  </span>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Classification
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {unit.unit_type}
                  </p>
                </div>

                <div className="text-center">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Active SOS
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {unit.active_sos_count} / {unit.sos_capacity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Op. Radius
                  </p>
                  <p className="flex items-center justify-end gap-1 text-sm font-bold text-slate-800">
                    <Radio size={14} className="text-teal-600" />
                    {unit.unit_coverage_radius_km} km
                  </p>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <Package size={14} className="text-teal-600" /> Equipped
                  Assets
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(unit.equipped_assets).map(
                    ([asset, quantity]) => (
                      <div
                        key={asset}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-colors group-hover:border-teal-100 group-hover:bg-teal-50/30"
                      >
                        <span className="truncate pr-2 text-xs font-semibold text-slate-600">
                          {formatAssetName(asset)}
                        </span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-black text-teal-800">
                          {quantity}
                        </span>
                      </div>
                    ),
                  )}
                  {Object.keys(unit.equipped_assets).length === 0 && (
                    <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-3 text-center text-xs italic font-medium text-slate-400">
                      No assets registered to this unit.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">
                      {unit.unit_email || "No email provided"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>
                        {unit.unit_contact_no || "No contact provided"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMapCenter([lat, lng]);
                        toast.success(`Panning map to ${unit.unit_name}`);
                      }}
                      className="flex-1 group/btn flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-[#0D9488] hover:text-white hover:shadow-md cursor-pointer"
                    >
                      <Crosshair
                        size={13}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                      Pan
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/agency/unit/${unit.unit_id}/activeMission`)
                      }
                      className="flex-1 group/btn flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-md cursor-pointer"
                    >
                      <Activity
                        size={13}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                      Mission
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/agency/unit/${unit.unit_id}/trackRecords`)
                      }
                      className="flex-1 group/btn flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 transition-all hover:bg-purple-600 hover:text-white hover:shadow-md cursor-pointer"
                    >
                      <Clock
                        size={13}
                        className="transition-transform group-hover/btn:scale-110"
                      />
                      Records
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredUnits.length === 0 && (
          <div className="col-span-full rounded-4xl border-2 border-dashed border-slate-200 p-16 text-center bg-white/50 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700">
              No Matching Units
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              No units match your search query "{searchQuery}".
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between px-2">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F172A]">
            <Navigation size={20} className="text-[#0D9488]" /> Live Tactical
            Map
          </h2>
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
          <AgencyUnitsMap centerCoordinates={currentCenter} />
        </div>
      </div>
    </div>
  );
};

const AgencyUnitsMap = ({ centerCoordinates }) => {
  const { agencyUnits, isPending } = useGetAgencyUnits();
  const { agency, isPending: agencyPending } = useGetMyAgency();

  if (isPending || agencyPending) {
    return (
      <div className="flex h-112.5 w-full items-center justify-center bg-slate-50">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );
  }

  const [hqLng, hqLat] = agency.hq_location.coordinates;
  const initialCenter = centerCoordinates || [hqLat, hqLng];

  return (
    <MapContainer
      key={`${initialCenter[0]}-${initialCenter[1]}`}
      center={initialCenter}
      zoom={14}
      style={{ height: "450px", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[hqLat, hqLng]} icon={hqIcon}>
        <Popup>
          <div className="p-1 text-center">
            <strong className="block text-sm font-bold text-slate-900">
              {agency.agency_name} (HQ)
            </strong>
          </div>
        </Popup>
      </Marker>

      {agencyUnits.map((unit) => {
        const [lng, lat] = unit.location.coordinates;
        return (
          <Marker key={unit.unit_id} position={[lat, lng]} icon={unitIcon}>
            <Popup>
              <div className="p-1 text-center">
                <strong className="block text-sm font-bold text-slate-800">
                  {unit.unit_name}
                </strong>
                <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  {unit.status}
                </span>
              </div>
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

const apiRequestAssistance = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/agency/unit/requestAssistance`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useRequestAssistance = () => {
  const { mutate: requestAssistance, isPending } = useMutation({
    mutationFn: apiRequestAssistance,
  });
  return { requestAssistance, isPending };
};

const RequestAssistance = () => {
  const { requestAssistance, isPending } = useRequestAssistance();
  const { sos_id, unit_id } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const submitHandler = (data) => {
    const payload = {
      sos_id,
      unit_id,
      unit_type: data.unit_type,
      description: data.description,
    };
    requestAssistance(payload, {
      onSuccess: () => {
        toast.success("Assistance requested successfully");
        reset();
      },
      onError: () => toast.error("Failed to request!"),
    });
  };
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: GOVT_ACCENT }}
          />
          Emergency Assistance
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Request Assistance
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Request additional agency support for the active incident.{" "}
        </p>
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <form onSubmit={handleSubmit(submitHandler)} className="p-6 sm:p-7">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">
                Unit Type
              </label>
              <select
                {...register("unit_type", {
                  required: "This field is required",
                })}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition-all focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10"
              >
                <option value=""></option>
                <option value="MEDICAL">MEDICAL</option>
                <option value="FIRE RESCUE">FIRE RESCUE</option>
                <option value="WATER RESCUE">WATER RESCUE</option>
                <option value="POLICE">POLICE</option>
                <option value="EVACUATION">EVACUATION</option>
                <option value="SEARCH RESCUE">SEARCH RESCUE</option>
              </select>
              {errors?.unit_type ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.unit_type.message}
                </p>
              ) : (
                ""
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">
                Description
              </label>
              <textarea
                placeholder="Mention necessary equipments or describe the situation..."
                {...register("description", {
                  required: "This field is required!",
                })}
                rows={6}
                className="w-full resize-none rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm leading-6 text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10"
              />
              {errors?.description ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.description.message}
                </p>
              ) : (
                ""
              )}
            </div>
            <div className="flex justify-end border-t border-[#E2E8F0] pt-5">
              <button
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: GOVT_ACCENT }}
              >
                {isPending ? "REQUESTING..." : "REQUEST"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const AgencyTrackRecords = () => {
  return (
    <div>
      <h1>Track Records</h1>
    </div>
  );
};

const AgencyUnitActiveMission = () => {
  const { data, isPending } = useGetUnitActiveMission();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-4xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center backdrop-blur-sm max-w-4xl mx-auto">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-inner">
          <Activity size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800">
          No Active Mission
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-500">
          This unit is currently not deployed on an active incident response.
        </p>
        <button
          onClick={() => navigate("/agency/units")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
        >
          ← Return to Units
        </button>
      </div>
    );
  }

  const activeMission = data;

  const {
    assigned_at,
    dispatch_status,
    unit_name,
    unit_type,
    unit_id,
    unit_location,
  } = activeMission[0];

  const [unit_longitude, unit_latitude] = unit_location.coordinates;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#0D9488]">
            Mission Telemetry
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {unit_name} Active Deployment
          </h1>
        </div>
        <button
          onClick={() => navigate("/agency/units")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          ← Back to Units
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Radio size={18} className="text-[#0D9488]" /> Unit Specification
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Unit ID
              </p>
              <p className="font-mono font-semibold text-slate-800">
                {unit_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Classification
              </p>
              <p className="font-semibold text-slate-800">{unit_type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Dispatch Status
              </p>
              <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                {dispatch_status}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">
                Assigned At
              </p>
              <p className="text-xs font-medium text-slate-700">
                {assigned_at}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" /> Target SOS
            Details
          </h3>
          {activeMission.map((alert) => {
            return (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Incident ID
                  </p>
                  <p className="font-mono font-semibold text-slate-800">
                    {alert.sos_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Incident Status
                  </p>
                  <span className="inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                    {alert.sos_status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Triggered Time
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {alert.triggered_at}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Last Synchronization
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {alert.updated_at}
                  </p>
                </div>

                <div className="col-span-2 mt-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Need additional support?
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Request an available unit from another agency.
                      </p>
                    </div>

                    <Link
                      to={`/agency/unit/${unit_id}/activeMission/${alert.sos_id}/requestAssistance`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700 ring-1 ring-red-200 transition-all hover:bg-red-100 hover:shadow-sm"
                    >
                      <AlertTriangle size={15} strokeWidth={2.5} />
                      Request Assistance
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Navigation size={18} className="text-[#0D9488]" /> Tactical GPS
          Visualization
        </h3>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <MapContainer
            center={[unit_latitude, unit_longitude]}
            zoom={13}
            style={{ height: "480px", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[unit_latitude, unit_longitude]} icon={unitIcon}>
              <Popup>
                <div className="p-1 text-center">
                  <strong className="block text-sm font-bold">
                    {unit_name}
                  </strong>
                  <span className="text-xs text-slate-500">
                    Status: {dispatch_status}
                  </span>
                </div>
              </Popup>
            </Marker>
            {activeMission.map((alert) => {
              const [sos_longitude, sos_latitude] =
                alert.sos_location.coordinates;
              return (
                <Marker
                  position={[sos_latitude, sos_longitude]}
                  icon={sosAlertMarkerIcon}
                >
                  <Popup>
                    <div className="p-1 text-center">
                      <strong className="block text-sm font-bold text-red-600">
                        Incident #{alert.sos_id}
                      </strong>
                      <span className="text-xs text-slate-500">
                        Status: {alert.sos_status}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Triggered: {alert.triggered_at}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
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
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Agency Type</FieldLabel>
        <select
          disabled={isPending}
          className={inputClass}
          {...register("category", { required: "This field is required!" })}
        >
          <option value="GOVT_UNIT">Government Unit</option>
          <option value="NGO">Non-Profit Organisation</option>
          <option value="PVT_CORP">Private Corporation</option>
          <option value="LOGISTICS">Logistics</option>
        </select>
        <FieldError message={errors?.category?.message} />
      </div>

      <div>
        <FieldLabel>Agency ID</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={inputClass}
          placeholder="e.g. AG-04213"
          {...register("agency_id", { required: "This field is required!" })}
        />
        <FieldError message={errors?.agency_id?.message} />
      </div>

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Checking..." : "Continue"}
      </PrimaryButton>

      <p className="text-center text-[0.82rem] text-[#64748B]">
        Already registered?{" "}
        <Link
          to="/agency/login"
          className="font-medium text-[#0D9488] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
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
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Official ID</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={inputClass}
          placeholder="e.g. OFF-9912"
          {...register("official_id", { required: "This field is required!" })}
        />
        <FieldError message={errors?.official_id?.message} />
      </div>
      <div>
        <FieldLabel>Aadhaar No.</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={inputClass}
          placeholder="12-digit number"
          {...register("aadhaar_no", { required: "This field is required!" })}
        />
        <FieldError message={errors?.aadhaar_no?.message} />
      </div>
      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Verifying..." : "Verify"}
      </PrimaryButton>
    </form>
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
    <div className="space-y-4">
      <p className="text-center text-[0.85rem] text-[#64748B]">
        Enter the 6-digit code sent to{" "}
        <span className="font-semibold text-[#0D9488]">{maskedPhone}</span>
      </p>

      {serverError && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[0.82rem] font-medium text-[#DC2626]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onOtpSubmit)} className="space-y-4">
        <div className="flex justify-center gap-2.5">
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
              className={`h-12 w-11 rounded-lg border text-center text-lg font-semibold outline-none transition focus:ring-2 focus:ring-[#0D948826] ${
                errors.otp || serverError
                  ? "border-[#DC2626]"
                  : "border-[#E2E8F0] focus:border-[#0D9488]"
              }`}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {errors.otp && (
          <p className="text-center text-[0.75rem] font-medium text-[#DC2626]">
            {errors.otp.message}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[0.85rem] font-medium text-[#64748B] transition hover:text-[#0F172A]"
            onClick={() => setStep(2)}
            disabled={isPending}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#0B7C72] disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isPending ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </form>
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
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Agency Official Email Id</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={inputClass}
          placeholder="you@agency.gov"
          {...register("email", {
            required: "This field is required!",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        <FieldError message={errors?.email?.message} />
      </div>
      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Verify"}
      </PrimaryButton>
    </form>
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
    <div className="space-y-4">
      <p className="text-center text-[0.85rem] text-[#64748B]">
        Enter the 6-digit verification code sent to{" "}
        <span className="font-semibold text-[#0D9488]">{email}</span>
      </p>

      {serverErrorMessage && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[0.82rem] font-medium text-[#DC2626]">
          {serverErrorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex justify-center gap-2.5">
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
              className={`h-12 w-11 rounded-lg border text-center text-lg font-semibold outline-none transition focus:ring-2 focus:ring-[#0D948826] ${
                errors.otp || serverErrorMessage
                  ? "border-[#DC2626]"
                  : "border-[#E2E8F0] focus:border-[#0D9488]"
              }`}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {errors.otp && (
          <p className="text-center text-[0.75rem] font-medium text-[#DC2626]">
            {errors.otp.message}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[0.85rem] font-medium text-[#64748B] transition hover:text-[#0F172A]"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={isPending}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#0B7C72] disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isPending ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </form>
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
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-bold text-[#0F172A]">
          Agency Registration
        </h2>
        <p className="mt-1 text-[0.85rem] text-[#64748B]">
          Provide your operational details to complete registration.
        </p>
      </div>
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
        <div>
          <FieldLabel>Operational Coverage Radius in km</FieldLabel>
          <input
            type="number"
            disabled={isPending}
            className={inputClass}
            placeholder="Enter coverage radius"
            {...register("coverage_radius_km", {
              required: "This field is required",
            })}
          />
          <FieldError message={errors?.coverage_radius_km?.message} />
        </div>
        <div>
          <FieldLabel>Emergency Hotline No.</FieldLabel>
          <input
            type="text"
            disabled={isPending}
            className={inputClass}
            placeholder="Enter emergency hotline number"
            {...register("hotline_no", { required: "This field is required!" })}
          />
          <FieldError message={errors?.hotline_no?.message} />
        </div>
        <div>
          <h3 className="text-[0.95rem] font-bold text-[#0F172A]">
            Primary Capabilities
          </h3>
          <p className="mb-3 mt-1 text-[0.8rem] text-[#64748B]">
            Select all services your agency can provide.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              "MEDICAL",
              "WATER RESCUE",
              "FIRE RESCUE",
              "FOOD DISTRIBUTION",
              "SHELTER",
              "HEAVY CLEARANCE",
            ].map((label, i) => (
              <CapabilityCheckbox
                key={label}
                label={label}
                inputId={`cap-${i}`}
                disabled={isPending}
                registerMethod={register("primary_capabilities_tags", {
                  validate: (value) =>
                    value.length > 0 || "Select at least one of these tags",
                })}
              />
            ))}
          </div>
          <FieldError message={errors?.primary_capabilities_tags?.message} />
        </div>
        <div>
          <FieldLabel>Full Address</FieldLabel>
          <input
            type="text"
            disabled={isPending}
            className={inputClass}
            placeholder="Enter complete headquarters address"
            {...register("hq_location_address", {
              required: "This field is required",
              minLength: {
                value: 15,
                message: "Minimum 15 characters address has to be entered",
              },
            })}
          />
          <FieldError message={errors?.hq_location_address?.message} />
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
          <h3 className="text-[0.95rem] font-bold text-[#0F172A]">
            Location Coordinates
          </h3>
          <p className="mb-4 mt-1 text-[0.8rem] text-[#64748B]">
            Enter coordinates manually or fetch your current location.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <input
                type="text"
                disabled={isPending}
                placeholder="latitude"
                className={inputClass}
                {...register("latitude", {
                  required: "Both the fields are required!",
                })}
              />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <input
                type="text"
                disabled={isPending}
                placeholder="longitude"
                className={inputClass}
                {...register("longitude", {
                  required: "Both the fields are required!",
                })}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={fetchLocation}
            disabled={loading || isPending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#0D9488] px-4 py-2 text-[0.82rem] font-semibold text-[#0D9488] transition hover:bg-[#F0FDFA] disabled:opacity-60"
          >
            📍 {loading ? "Fetching..." : "Get Location"}
          </button>
          {error && <FieldError message={error} />}
          <FieldError message={errors?.latitude?.message} />
          <FieldError message={errors?.longitude?.message} />
        </div>
        <div>
          <FieldLabel>Password For Future Login</FieldLabel>
          <input
            type="password"
            disabled={isPending}
            className={inputClass}
            placeholder="Create a strong password"
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
          <FieldError message={errors?.password?.message} />
        </div>
        <div>
          <FieldLabel>Confirm Password</FieldLabel>
          <input
            type="password"
            disabled={isPending}
            className={inputClass}
            placeholder="Confirm your password"
            {...register("confirmPassword", {
              required: "This field is required!",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
            })}
          />
          <FieldError message={errors?.confirmPassword?.message} />
        </div>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Registering..." : "Register"}
        </PrimaryButton>
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

  const root = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ar-card",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, x: 14 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
    );
  }, [step]);

  return (
    <div
      ref={root}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 py-10 text-[#0F172A]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(13,148,136,0.06), transparent 70%)",
        }}
      />

      <div className="ar-card relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
            Agency Portal
          </div>
          <h1 className="text-[1.6rem] font-bold tracking-tight">
            Register your <span style={{ color: ACCENT }}>agency</span>
          </h1>
        </div>

        <div className="mb-8 flex w-full items-center justify-between">
          {STEPS.map(({ id, label, Icon }, i) => {
            const isDone = step > id;
            const isActive = step === id;
            return (
              <div key={id}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border text-[0.75rem] font-semibold transition-colors"
                    style={{
                      borderColor: isDone || isActive ? ACCENT : "#E2E8F0",
                      backgroundColor: isDone ? ACCENT : "white",
                      color: isDone ? "white" : isActive ? ACCENT : "#94A3B8",
                    }}
                  >
                    {Icon && <Icon size={14} strokeWidth={2.2} />}
                  </div>
                  <span
                    className="hidden text-center text-[0.65rem] font-medium sm:block"
                    style={{ color: isActive ? ACCENT : "#94A3B8" }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="mx-1 h-px flex-1 transition-colors duration-300 sm:mx-2"
                    style={{ backgroundColor: isDone ? ACCENT : "#E2E8F0" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={panelRef}
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          {step === 1 && (
            <AgencyVerification setStep={setStep} setAgency={setAgency} />
          )}
          {step === 2 && (
            <PersonnelVerification
              setStep={setStep}
              setOfficialId={setOfficialId}
              setMaskedPhone={setMaskedPhone}
            />
          )}
          {step === 3 && (
            <SMSOtp
              setStep={setStep}
              officialId={officialId}
              maskedPhone={maskedPhone}
            />
          )}
          {step === 4 && (
            <EmailVerification setStep={setStep} setEmail={setEmail} />
          )}
          {step === 5 && <EmailOtp setStep={setStep} email={email} />}
          {step === 6 && (
            <AgencyRegistration setStep={setStep} agency={agency} />
          )}
        </div>

        <p className="mt-6 text-center text-[0.8rem] text-[#94A3B8]">
          <Link to="/" className="hover:text-[#64748B]">
            ← Back to ResQGrid home
          </Link>
        </p>
      </div>
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 text-[#0F172A]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(13,148,136,0.06), transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-all">
        <div className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-linear-to-br from-teal-400/20 to-transparent blur-3xl"></div>

        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#0D9488" }}
            />
            Secure Authentication
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Agency <span style={{ color: "#0D9488" }}>Login</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your credentials to access the command portal
          </p>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Agency ID
            </span>
            <input
              type="text"
              placeholder="e.g. AG-04213"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20"
              disabled={isPending}
              {...register("agency_id", { required: "Agency ID is required" })}
            />
            {errors?.agency_id && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.agency_id.message}
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-sm font-medium outline-none transition focus:border-[#0D9488] focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20"
                disabled={isPending}
                {...register("password", { required: "Password is required!" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors?.password && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0D9488] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-teal-600/40 disabled:opacity-70"
            disabled={isPending}
          >
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isPending ? "Authenticating..." : "Access Portal"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            ← Back to ResQGrid home
          </Link>
        </div>
      </div>
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
  const { agencyUnits, isPending: unitsPending } = useGetAgencyUnits();
  const homeRef = useRef(null);

  useEffect(() => {
    if (!isPending && !unitsPending) {
      let ctx = gsap.context(() => {
        gsap.fromTo(
          ".home-card",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        );
      }, homeRef);
      return () => ctx.revert();
    }
  }, [isPending, unitsPending]);

  if (isPending || unitsPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"></span>
      </div>
    );

  const activeUnitsCount = agencyUnits?.length || 0;

  return (
    <div ref={homeRef} className="space-y-6">
      <div className="home-card rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F0FDFA] px-3 py-1 text-[0.75rem] font-bold text-[#0D9488]">
            <Building size={14} /> Official Command Center
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Verified Registry
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
          {agency?.agency_name}
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-[#64748B]">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {agency?.authorized_state}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Radio size={14} /> ID: {agency?.agency_id}
          </span>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Primary Capabilities
          </p>
          <div className="flex flex-wrap gap-2">
            {agency?.primary_capabilities_tags?.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
            {(!agency?.primary_capabilities_tags ||
              agency?.primary_capabilities_tags.length === 0) && (
              <span className="text-sm text-slate-400">
                No capabilities listed.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="home-card flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-slate-600">
            <Radio size={20} className="text-blue-500" />
            <h3 className="text-sm font-semibold">Active Units</h3>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">
            {activeUnitsCount}
          </p>
        </div>

        <div className="home-card flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-slate-600">
            <Activity size={20} className="text-emerald-500" />
            <h3 className="text-sm font-semibold">Coverage Area</h3>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">
            {agency?.coverage_radius_km}{" "}
            <span className="text-lg text-slate-500">km</span>
          </p>
        </div>

        <div className="home-card flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-slate-600">
            <AlertTriangle size={20} className="text-orange-500" />
            <h3 className="text-sm font-semibold">Ongoing Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">0</p>
        </div>

        <div className="home-card flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-slate-600">
            <ShieldAlert size={20} className="text-purple-500" />
            <h3 className="text-sm font-semibold">Hotline</h3>
          </div>
          <p className="text-xl font-bold text-[#0F172A]">
            {agency?.hotline_no}
          </p>
        </div>
      </div>
    </div>
  );
};

const apiVerifyGovtCredentials = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/verifyCredentials`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyGovtCredentials = () => {
  const { mutate: verifyGovtCredentials, isPending } = useMutation({
    mutationFn: apiVerifyGovtCredentials,
  });
  return { verifyGovtCredentials, isPending };
};

const VerifyGovtCredentials = ({
  setStep,
  setMaskedPhone,
  setOfficialData,
}) => {
  const { verifyGovtCredentials, isPending } = useVerifyGovtCredentials();
  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm();
  const [status, setStatus] = useState(null);

  const submitHandler = (payload) => {
    verifyGovtCredentials(payload, {
      onSuccess: (data) => {
        if (data.status) {
          setStatus(data.status);
        } else {
          const maskedPhone = data.mobile_no.replace(/\d(?=\d{4})/g, "X");
          setMaskedPhone(maskedPhone);
          setOfficialData(data);
          localStorage.setItem("step", 2);
          reset();
          setStep(2);
        }
      },
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };

  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Application Pending
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You have already applied. Your role is yet to be assigned by an
          administrator.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <X size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your request for official access has been rejected by an
          administrator.
        </p>
      </div>
    );
  }

  if (status === "assigned") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Already Registered</h2>
        <p className="mt-2 text-sm text-slate-600 mb-6">
          Your account is active and a role has been assigned.
        </p>
        <Link
          to="/govt/login"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Proceed to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Official ID</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={govtInputClass}
          placeholder="e.g. GOV-2281"
          {...register("official_id", {
            required: "This field is required!",
          })}
        />
        <FieldError message={errors?.official_id?.message} />
      </div>
      <div>
        <FieldLabel>Full Legal Name</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={govtInputClass}
          placeholder="As per government records"
          {...register("name", {
            required: "This field is required!",
          })}
        />
        <FieldError message={errors?.name?.message} />
      </div>
      <div>
        <FieldLabel>Aadhaar No.</FieldLabel>
        <input
          type="text"
          disabled={isPending}
          className={govtInputClass}
          placeholder="12-digit number"
          {...register("aadhaar_no", {
            required: "This field is required!",
            minLength: {
              value: 12,
              message: "Aadhaar no. must be exactly 12 digits",
            },
            maxLength: {
              value: 12,
              message: "Aadhaar no. must be exactly 12 digits",
            },
          })}
        />
        <FieldError message={errors?.aadhaar_no?.message} />
      </div>

      <GovtPrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Verifying..." : "Verify Identity"}
      </GovtPrimaryButton>

      <p className="text-center text-[0.82rem] text-[#64748B]">
        Already registered?{" "}
        <Link
          to="/govt/login"
          className="font-medium text-[#4338CA] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
};

const apiVerifyGovOtp = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/verifyOtp`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useVerifyGovOtp = () => {
  const { mutate: verifyGovOtp, isPending } = useMutation({
    mutationFn: apiVerifyGovOtp,
  });
  return { verifyGovOtp, isPending };
};

const VerifyGovOtp = ({ setStep, maskedPhone, officialData }) => {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const { verifyGovOtp, isPending, error: mutationError } = useVerifyGovOtp();

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

    verifyGovOtp(
      {
        otp: fullOtp,
        official_id: officialData.official_id,
      },
      {
        onSuccess: () => {
          setStep(3);
          localStorage.setItem("step", 3);
        },
        onSettled: () => reset(),
      },
    );
  };

  const serverErrorMessage =
    mutationError?.response?.data?.message || mutationError?.message;

  return (
    <div className="space-y-4">
      <p className="text-center text-[0.85rem] text-[#64748B]">
        Enter the 6-digit verification code sent to{" "}
        <span className="font-semibold text-[#4338CA]">{maskedPhone}</span>
      </p>

      {serverErrorMessage && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[0.82rem] font-medium text-[#DC2626]">
          {serverErrorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex justify-center gap-2.5">
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
              className={`h-12 w-11 rounded-lg border text-center text-lg font-semibold outline-none transition focus:ring-2 focus:ring-[#4338CA26] ${
                errors.otp || serverErrorMessage
                  ? "border-[#DC2626]"
                  : "border-[#E2E8F0] focus:border-[#4338CA]"
              }`}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {errors.otp && (
          <p className="text-center text-[0.75rem] font-medium text-[#DC2626]">
            {errors.otp.message}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[0.85rem] font-medium text-[#64748B] transition hover:text-[#0F172A]"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={isPending}
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isPending ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </form>
    </div>
  );
};

const apiRegisterOfficial = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/register`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useRegisterOfficial = () => {
  const { mutate: registerOfficial, isPending } = useMutation({
    mutationFn: apiRegisterOfficial,
  });
  return { registerOfficial, isPending };
};

const GovtRegistration = ({ officialData }) => {
  const { registerOfficial, isPending } = useRegisterOfficial();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm();
  const { coordinates, fetchLocation } = useGeolocation();
  const [check, setCheck] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const submitHandler = (data) => {
    setCheck(true);
    if (coordinates.latitude === null || coordinates.longitude === null) {
      return;
    }
    const payload = {
      password: data.password,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      official_id: officialData.official_id,
    };
    registerOfficial(payload, {
      onSuccess: () => {
        toast.success(
          "Your response is recorded and you will be able to login once your role is assigned",
        );
        reset();
        localStorage.removeItem("step");
        navigate("/govt/login", { replace: true });
      },
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <FieldLabel>Official ID</FieldLabel>
        <input
          type="text"
          value={officialData.official_id}
          readOnly
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] text-slate-500 font-mono outline-none cursor-not-allowed"
        />
      </div>
      <div>
        <FieldLabel>Official Email</FieldLabel>
        <input
          type="text"
          value={officialData.official_email}
          readOnly
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] text-slate-500 outline-none cursor-not-allowed"
        />
      </div>

      <p className="pt-2 text-sm font-semibold text-slate-700">
        Set a password for future logins
      </p>

      <div>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            className={`${govtInputClass} pr-10`}
            placeholder="Create a strong password"
            {...register("password", {
              required: "This field is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                message:
                  "Password must contain uppercase, lowercase, number and special character",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4338CA] focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError message={errors?.password?.message} />
      </div>

      <div>
        <FieldLabel>Confirm Password</FieldLabel>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            disabled={isPending}
            className={`${govtInputClass} pr-10`}
            placeholder="Confirm password"
            {...register("confirmPassword", {
              required: "This field is required",
              validate: (value) =>
                value === getValues("password") || "Passwords must match",
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4338CA] focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError message={errors?.confirmPassword?.message} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between mt-2">
        <span className="flex items-center gap-1.5 font-medium">
          <MapPin size={14} className="text-[#4338CA]" />
          {coordinates.latitude
            ? `GPS Acquired: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
            : "Acquiring GPS location..."}
        </span>
        <button
          type="button"
          onClick={fetchLocation}
          className="font-bold text-[#4338CA] hover:underline"
        >
          Refresh
        </button>
      </div>

      {check &&
        (coordinates.latitude === null || coordinates.longitude === null) && (
          <FieldError message="Please wait until we fetch your location" />
        )}

      <GovtPrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Submitting Request..." : "Submit Registration Request"}
      </GovtPrimaryButton>
    </form>
  );
};

const GovtRegister = () => {
  const [step, setStep] = useState(() => {
    const storedStep = Number(localStorage.getItem("step")) || 1;
    return storedStep;
  });
  const [maskedPhone, setMaskedPhone] = useState("XXXXXXXXXX");
  const [officialData, setOfficialData] = useState(null);

  const root = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gr-card",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, x: 14 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
    );
  }, [step]);

  return (
    <div
      ref={root}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-10 text-[#0F172A]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(67,56,202,0.06), transparent 70%)",
        }}
      />

      <div className="gr-card relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: GOVT_ACCENT }}
            />
            Government Portal
          </div>
          <h1 className="text-[1.6rem] font-bold tracking-tight">
            Official <span style={{ color: GOVT_ACCENT }}>Registration</span>
          </h1>
        </div>

        <div className="mb-8 flex w-full items-center justify-between">
          {GOVT_STEPS.map(({ id, label, Icon }, i) => {
            const isDone = step > id;
            const isActive = step === id;
            return (
              <div key={id}>
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border text-[0.75rem] font-semibold transition-colors"
                    style={{
                      borderColor: isDone || isActive ? GOVT_ACCENT : "#E2E8F0",
                      backgroundColor: isDone ? GOVT_ACCENT : "white",
                      color: isDone
                        ? "white"
                        : isActive
                          ? GOVT_ACCENT
                          : "#94A3B8",
                    }}
                  >
                    {Icon && <Icon size={14} strokeWidth={2.2} />}
                  </div>
                  <span
                    className="hidden text-center text-[0.65rem] font-bold sm:block"
                    style={{ color: isActive ? GOVT_ACCENT : "#94A3B8" }}
                  >
                    {label}
                  </span>
                </div>
                {i < GOVT_STEPS.length - 1 && (
                  <div
                    className="mx-1 h-px flex-1 transition-colors duration-300 sm:mx-2"
                    style={{
                      backgroundColor: isDone ? GOVT_ACCENT : "#E2E8F0",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={panelRef}
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          {step === 1 && (
            <VerifyGovtCredentials
              setStep={setStep}
              setMaskedPhone={setMaskedPhone}
              setOfficialData={setOfficialData}
            />
          )}
          {step === 2 && (
            <VerifyGovOtp
              setStep={setStep}
              maskedPhone={maskedPhone}
              officialData={officialData}
            />
          )}
          {step === 3 && <GovtRegistration officialData={officialData} />}
        </div>

        <p className="mt-6 text-center text-[0.8rem] text-[#94A3B8]">
          <Link to="/" className="hover:text-[#64748B]">
            ← Back to ResQGrid home
          </Link>
        </p>
      </div>
    </div>
  );
};

const apiLoginOfficial = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/login`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useLoginOfficial = () => {
  const { mutate: loginOfficial, isPending } = useMutation({
    mutationFn: apiLoginOfficial,
  });
  return { loginOfficial, isPending };
};

export const GovtLogin = () => {
  const { loginOfficial, isPending } = useLoginOfficial();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const submitHandler = (data) => {
    loginOfficial(data, {
      onSuccess: (data) => {
        if (data.status) {
          setStatus(data.status);
        } else {
          toast.success(`Welcome back ${data.name}`);
          navigate("/govt/home");
        }
      },
      onError: (err) => toast.error(err?.response?.data?.message),
      onSettled: () => reset(),
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 text-[#0F172A]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(67,56,202,0.06), transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-all">
        <div className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-linear-to-br from-indigo-400/20 to-transparent blur-3xl"></div>

        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#4338CA" }}
            />
            Secure Authentication
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Government <span style={{ color: "#4338CA" }}>Login</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Enter your official credentials to access oversight portal
          </p>
        </div>

        {status === "pending" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center backdrop-blur-sm">
            <Clock size={28} className="mx-auto mb-2 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Role Unassigned
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              You have no roles assigned yet. Please wait for an administrator
              to approve your request.
            </p>
          </div>
        ) : status === "rejected" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-center backdrop-blur-sm">
            <X size={28} className="mx-auto mb-2 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
            <p className="mt-1 text-xs text-slate-600">
              Your request for official portal access was rejected.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Official ID
              </span>
              <input
                type="text"
                placeholder="e.g. GOV-2281"
                className={govtInputClass}
                disabled={isPending}
                {...register("official_id", {
                  required: "This field is required",
                })}
              />
              {errors?.official_id && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.official_id.message}
                </p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  disabled={isPending}
                  className={`${govtInputClass} pr-10`}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "This field is required!",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                      message:
                        "Password must contain uppercase, lowercase, number and special character",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4338CA] focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors?.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <GovtPrimaryButton type="submit" disabled={isPending}>
              {isPending ? "Authenticating..." : "Access Portal"}
            </GovtPrimaryButton>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            ← Back to ResQGrid home
          </Link>
        </div>
      </div>
    </div>
  );
};

const apiLogoutOfficial = async () => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/logout`,
    null,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useLogoutOfficial = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: logoutOfficial, isPending } = useMutation({
    mutationFn: apiLogoutOfficial,
    onSuccess: () => {
      navigate("/", { replace: true });
      queryClient.clear();
      toast.success("Logged out successfully!");
    },
    onError: (err) => toast.error(err.response?.data?.message),
  });
  return { logoutOfficial, isPending };
};

const GovtLayout = () => {
  const { logoutOfficial, isPending } = useLogoutOfficial();
  const { official } = useGovtAuth();
  const role = official.role;
  const layoutRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  let navLinks;
  if (role === "SUPER_ADMIN") {
    navLinks = [
      { to: "/govt/home", label: "Home", Icon: HomeIcon },
      { to: "/govt/sosAlerts", label: "SOS Alerts", Icon: Siren },
      { to: "/govt/sosDispatches", label: "SOS Dispatches", Icon: Ambulance },
      { to: "/govt/pendingRequests", label: "Pending Requests", Icon: Bell },
    ];
  } else if (role === "ADMIN") {
    navLinks = [
      { to: "/govt/home", label: "Home", Icon: HomeIcon },
      { to: "/govt/sosAlerts", label: "SOS Alerts", Icon: Siren },
      { to: "/govt/sosDispatches", label: "SOS Dispatches", Icon: Ambulance },
    ];
  } else if (role === "USER_ADMIN") {
    navLinks = [
      { to: "/govt/home", label: "Home", Icon: HomeIcon },
      { to: "/govt/sosAlerts", label: "SOS Alerts", Icon: Siren },
    ];
  } else {
    navLinks = [
      { to: "/govt/home", label: "Home", Icon: HomeIcon },
      { to: "/govt/sosDispatches", label: "SOS Dispatches", Icon: Ambulance },
    ];
  }

  const logoutHandler = () => {
    logoutOfficial();
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ul-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );
      gsap.fromTo(
        ".ul-nav-item",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2,
        },
      );
      gsap.fromTo(
        ".ul-content",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.3 },
      );
    }, layoutRef);
    return () => ctx.revert();
  }, []);
  return (
    <GovtSocketProvider>
      <div
        ref={layoutRef}
        className="relative z-0 min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[#0F172A]"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(37,99,235,0.04), transparent 70%)",
          }}
        />

        <header className="ul-header relative z-30 border-b border-[#E2E8F0] bg-white shadow-sm">
          <div className="bg-[#0F172A]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[0.75rem] font-medium uppercase tracking-wide text-slate-300 sm:px-6">
              <span>Government Portal</span>
              <span>Official Platform</span>
            </div>
          </div>

          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#64748B]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: GOVT_ACCENT }}
                />
                Government Portal
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                ResQGrid <span style={{ color: GOVT_ACCENT }}>Government</span>
              </h1>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {navLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `ul-nav-item flex items-center gap-2 rounded-lg px-4 py-2.5 text-[0.88rem] font-semibold transition-all ${
                      isActive
                        ? "bg-[#4338CA] text-white shadow-md shadow-indigo-900/10"
                        : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={logoutHandler}
                disabled={isPending}
                className="ul-nav-item ml-2 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-[0.88rem] font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
              >
                {isPending ? "Logging out..." : "Logout"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] lg:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </header>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 right-0 z-60 flex h-full w-72 flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div className="mb-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: GOVT_ACCENT }}
                />
                Government Portal
              </div>
              <h2 className="text-base font-bold text-slate-900">
                ResQGrid <span style={{ color: GOVT_ACCENT }}>Govt</span>
              </h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
            {navLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#4338CA] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logoutHandler();
              }}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <LogOut size={16} />
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <main className="ul-content relative z-10 mx-auto min-h-[calc(100vh-180px)] max-w-7xl px-6 py-8">
          <Outlet />
        </main>

        <footer className="relative z-10 border-t border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-[#64748B]">
            © ResQGrid Disaster Management Platform. All Rights Reserved.
          </div>
        </footer>
      </div>
    </GovtSocketProvider>
  );
};

const GovtHome = () => {
  const { official } = useGovtAuth();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[0.75rem] font-bold text-indigo-700">
            <Landmark size={14} /> Official Verified
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {official.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You are securely logged into the ResQGrid Government oversight
          network.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Assigned Role
            </p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <Shield size={16} className="text-[#4338CA]" /> {official.role}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Designation
            </p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <User size={16} className="text-[#4338CA]" />{" "}
              {official.designation}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Oversight Zone
            </p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-[#4338CA]" />{" "}
              {official.zone_name}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              State Level
            </p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <Building size={16} className="text-[#4338CA]" /> {official.state}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const apiGetSosDispatches = async () => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/govt/sosDispatches`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetSosDispatches = () => {
  const { official } = useGovtAuth();
  const { data: sos_dispatches, isPending } = useQuery({
    queryKey: ["sosDispatches", official?.zone_id],
    queryFn: apiGetSosDispatches,
    enabled: !!official,
  });
  return { sos_dispatches, isPending };
};

const apiGetGovtSosAlerts = async () => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/govt/sosAlerts`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetGovtSosAlerts = () => {
  const { official } = useGovtAuth();
  const { data: sos_alerts, isPending } = useQuery({
    queryKey: ["sosAlerts", official?.zone_id],
    queryFn: apiGetGovtSosAlerts,
    enabled: !!official,
  });
  return { sos_alerts, isPending };
};

const GovtSosInbox = () => {
  const { sos_alerts, isPending } = useGetGovtSosAlerts();
  const { alerts, setAlerts } = useGovtSocket();
  const [status, setStatus] = useState("pending");
  const [disasterType, setDisasterType] = useState("");
  const [sortBy, setSortBy] = useState("earlier");
  const { official } = useGovtAuth();

  useEffect(() => {
    if (sos_alerts) {
      setAlerts(sos_alerts);
    }
  }, [sos_alerts, setAlerts]);

  if (official.role === "AGENCY_ADMIN")
    return <Navigate to="/govt/home" replace />;
  if (isPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#4338CA]"></span>
      </div>
    );

  const sortedAlerts = [...alerts]
    .filter((alert) => alert.status === status)
    .filter((alert) => !disasterType || alert.disaster_type === disasterType)
    .sort((a, b) =>
      sortBy === "earlier"
        ? new Date(a.triggered_at) - new Date(b.triggered_at)
        : new Date(b.triggered_at) - new Date(a.triggered_at),
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Siren className="text-[#4338CA]" /> Region SOS Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and oversee emergency alerts generated within your
            jurisdiction.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <FieldLabel>Status Filter</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <FieldLabel>Disaster Type</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="medical_emergency">Medical Emergency</option>
            <option value="fire">Fire</option>
            <option value="flood">Flood</option>
            <option value="cyclone">Cyclone</option>
            <option value="earthquake">Earthquake</option>
            <option value="crowd_hazard">Crowd Hazard</option>
          </select>
        </div>
        <div>
          <FieldLabel>Sort Order</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="earlier">Earliest First</option>
            <option value="latest">Latest First</option>
          </select>
        </div>
      </div>

      {sortedAlerts.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">SOS ID</th>
                <th className="p-4">Disaster Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Triggered At</th>
                <th className="p-4 text-right">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAlerts.map((alert) => (
                <tr
                  key={alert.sos_id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="p-4 font-mono font-bold text-slate-900">
                    {alert.sos_id}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-wider border border-slate-200">
                      {alert.disaster_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-700 border border-orange-100">
                      {alert.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium">
                    {alert.triggered_at}
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono text-xs text-slate-500">
                      {alert.user_id}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Siren size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            No matching SOS alerts
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            There are currently no alerts matching your selected filters.
          </p>
        </div>
      )}
    </div>
  );
};
const GovtDispatchesInbox = () => {
  const { sos_dispatches, isPending } = useGetSosDispatches();
  const { dispatches, setDispatches } = useGovtSocket();
  const [status, setStatus] = useState("EN ROUTE");
  const [sortBy, setSortBy] = useState("earlier");
  const { official } = useGovtAuth();

  useEffect(() => {
    if (sos_dispatches) {
      setDispatches(sos_dispatches);
    }
  }, [sos_dispatches, setDispatches]);

  if (official.role === "USER_ADMIN")
    return <Navigate to="/govt/home" replace />;
  if (isPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#4338CA]"></span>
      </div>
    );

  let sortedDispatches = [...dispatches]
    .filter((dispatch) => dispatch.status === status)
    .sort((a, b) =>
      sortBy === "earlier"
        ? new Date(a.assigned_at) - new Date(b.assigned_at)
        : new Date(b.assigned_at) - new Date(a.assigned_at),
    );
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Ambulance className="text-[#4338CA]" /> Active Dispatches
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track responding agency units currently deployed in your zone.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl">
        <div>
          <FieldLabel>Status Filter</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="EN ROUTE">En Route</option>
            <option value="ON SCENE">On Scene</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <FieldLabel>Sort Order</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="earlier">Earliest First</option>
            <option value="latest">Latest First</option>
          </select>
        </div>
      </div>
      {sortedDispatches.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Dispatch ID</th>
                <th className="p-4">SOS ID</th>
                <th className="p-4">Agency ID</th>
                <th className="p-4">Unit Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDispatches.map((dispatch) => (
                <tr
                  key={dispatch.dispatch_id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="p-4 font-mono font-bold text-slate-900">
                    {dispatch.dispatch_id}
                  </td>
                  <td className="p-4 font-mono text-red-600 font-semibold">
                    {dispatch.sos_id}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {dispatch.agency_id}
                  </td>
                  <td className="p-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                      {dispatch.unit_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                      {dispatch.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium">
                    {dispatch.assigned_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Ambulance size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            No active dispatches
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            There are currently no agency units dispatched matching the filters.
          </p>
        </div>
      )}
    </div>
  );
};

const apiGetPendingRequests = async () => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/govt/pendingRequests`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetPendingRequests = () => {
  const { official } = useGovtAuth();
  const { data: pending_requests, isPending } = useQuery({
    queryKey: ["pendingRequests", official?.zone_id],
    queryFn: apiGetPendingRequests,
    enabled: !!official,
  });

  return { pending_requests, isPending };
};

const GovtPendingRequests = () => {
  const { official } = useGovtAuth();
  const { pendingRequests, setPendingRequests } = useGovtSocket();
  const { pending_requests, isPending } = useGetPendingRequests();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [sortBy, setSortBy] = useState("earlier");

  useEffect(() => {
    if (pending_requests) {
      setPendingRequests(pending_requests);
    }
  }, [pending_requests, setPendingRequests]);

  if (official.role != "SUPER_ADMIN")
    return <Navigate to="/govt/home" replace />;
  if (isPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#4338CA]"></span>
      </div>
    );

  const sortedRequests = [...pendingRequests]
    .filter((request) => request.status === status)
    .sort((a, b) =>
      sortBy === "earlier"
        ? new Date(a.registered_on) - new Date(b.registered_on)
        : new Date(b.registered_on) - new Date(a.registered_on),
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Bell className="text-[#4338CA]" /> Access Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage pending registration requests from other government
            officials.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl">
        <div>
          <FieldLabel>Status Filter</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending Review</option>
            <option value="assigned">Approved / Assigned</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <FieldLabel>Sort Order</FieldLabel>
          <select
            className={govtInputClass + " cursor-pointer"}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="earlier">Earliest First</option>
            <option value="latest">Latest First</option>
          </select>
        </div>
      </div>

      {sortedRequests.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Pending ID</th>
                <th className="p-4">Official Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRequests.map((request) => (
                <tr
                  key={request.pending_id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`${request.pending_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 border border-indigo-100"
                    >
                      Review <ArrowRight size={12} />
                    </button>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-800">
                    {request.pending_id}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {request.name}
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    {request.department}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        request.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : request.status === "assigned"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    {request.registered_on}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bell size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            No requests found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            There are no {status} official access requests right now.
          </p>
        </div>
      )}
    </div>
  );
};

const apiGetPendingRequest = async (pending_id) => {
  const response = await axios.get(
    `https://resqgrid-x51v.onrender.com/api/govt/pendingRequest/${pending_id}`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useGetPendingRequest = () => {
  const params = useParams();
  const { pending_id } = params;
  const { data: pendingRequest, isPending } = useQuery({
    queryKey: ["pendingRequest", pending_id],
    queryFn: () => apiGetPendingRequest(pending_id),
  });
  return { pendingRequest, isPending };
};

const apiRejectRequest = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/rejectRequest/`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useRejectRequest = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  const { mutate: rejectRequest, isPending } = useMutation({
    mutationFn: apiRejectRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["pendingRequest", params.pending_id],
      }),
  });
  return { rejectRequest, isPending };
};

const apiApproveRequest = async (payload) => {
  const response = await axios.post(
    `https://resqgrid-x51v.onrender.com/api/govt/approveRequest`,
    payload,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const useApproveRequest = () => {
  const queryClient = useQueryClient();
  const params = useParams();
  const { mutate: approveRequest, isPending } = useMutation({
    mutationFn: apiApproveRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["pendingRequest", params.pending_id],
      }),
  });
  return { approveRequest, isPending };
};

const GovtPendingRequest = () => {
  const { official } = useGovtAuth();
  const { name } = official;
  const { pendingRequest, isPending } = useGetPendingRequest();
  const { rejectRequest, isPending: rejecting } = useRejectRequest();
  const { approveRequest, isPending: approving } = useApproveRequest();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (isPending)
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#4338CA]"></span>
      </div>
    );

  const rejectHandler = () => {
    const pending_id = pendingRequest.pending_id;
    const payload = {
      pending_id,
      name,
    };
    rejectRequest(payload, {
      onSuccess: () => toast.success("Action executed"),
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };

  const approveHandler = (data) => {
    const payload = {
      pending_id: pendingRequest.pending_id,
      role: data.role,
      name,
    };
    approveRequest(payload, {
      onSuccess: () => toast.success("Action executed"),
      onError: (err) => toast.error(err.response?.data?.message),
    });
  };

  if (!pendingRequest) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-slate-700">Request not found</h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#4338CA]">
            Request Review
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {pendingRequest.pending_id}
          </h1>
        </div>
        <button
          onClick={() => navigate("/govt/pendingRequests")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          ← Back to List
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {pendingRequest.name}
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                {pendingRequest.official_email}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border uppercase tracking-wider ${
              pendingRequest.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : pendingRequest.status === "assigned"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {pendingRequest.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Official ID
            </p>
            <p className="font-mono font-semibold text-slate-900">
              {pendingRequest.official_id}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Department
            </p>
            <p className="font-semibold text-slate-900">
              {pendingRequest.department}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Designation
            </p>
            <p className="font-semibold text-slate-900">
              {pendingRequest.designation}
            </p>
          </div>
        </div>

        {pendingRequest.action_taker && (
          <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-center gap-2 text-sm">
            <Shield size={16} className="text-slate-400" />
            <span className="font-medium text-slate-600">
              Action taken by:{" "}
              <strong className="text-slate-900">
                {pendingRequest.action_taker}
              </strong>
            </span>
          </div>
        )}

        {pendingRequest.status === "pending" && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">
                  Immediate Rejection
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Deny this user access to the portal.
                </p>
              </div>
              <button
                disabled={rejecting}
                onClick={rejectHandler}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-70 shadow-sm"
              >
                {rejecting ? "Rejecting..." : "Reject Request"}
              </button>
            </div>

            <form
              onSubmit={handleSubmit(approveHandler)}
              className="flex items-end justify-between gap-4"
            >
              <div className="flex-1">
                <FieldLabel>Assign Authority Role</FieldLabel>
                <select
                  className={govtInputClass + " cursor-pointer"}
                  {...register("role", {
                    required: "You must assign a role to approve",
                  })}
                >
                  <option value="" disabled selected>
                    Select an access level...
                  </option>
                  <option value="SUPER_ADMIN">Super Admin (All Access)</option>
                  <option value="ADMIN">Admin (Zone Level)</option>
                  <option value="USER_ADMIN">User Admin</option>
                  <option value="AGENCY_ADMIN">Agency Admin</option>
                </select>
                <FieldError message={errors?.role?.message} />
              </div>
              <button
                disabled={approving}
                className="inline-flex h-12.5 items-center justify-center rounded-xl bg-[#4338CA] px-8 text-sm font-bold text-white transition hover:bg-indigo-800 disabled:opacity-70 shadow-sm"
              >
                {approving ? "Approving..." : "Approve & Assign"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const govtInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.92rem] text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20";

export const FullScreenLoader = ({
  title = "Verifying Secure Connection",
  subtitle = "Authenticating your credentials...",
  accentColor = "#2563EB",
  accentBg = "bg-blue-50",
}) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F8FAFC]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 85%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-4xl border border-slate-200/80 bg-white/80 p-10 shadow-xl backdrop-blur-xl">
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-2xl ${accentBg} shadow-inner`}
        >
          <span
            className="absolute inset-0 animate-ping rounded-2xl opacity-20"
            style={{ backgroundColor: accentColor }}
          ></span>
          <ShieldCheck
            size={36}
            className="animate-pulse"
            style={{ color: accentColor }}
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {subtitle}
          </p>
        </div>

        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default App;
