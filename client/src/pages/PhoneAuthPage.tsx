import { useNavigate, useLocation } from "react-router-dom";
import PhoneAuth from "../components/auth/PhoneAuth";
import { useAuth } from "../hooks/useAuth";

export default function PhoneAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  // Determine mode based on current route
  const mode = location.pathname === "/register" ? "register" : "login";

  const handleAuthSuccess = async (
    token: string,
    user: any,
    redirectPath?: string
  ) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    await refreshUser();
    navigate(redirectPath || "/dashboard");
  };

  return (
    <div className="min-h-screen bg-layered-warm flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-pattern-dots"></div>
      <div className="relative">
        <PhoneAuth onSuccess={handleAuthSuccess} mode={mode} />
      </div>
    </div>
  );
}
