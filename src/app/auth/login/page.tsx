"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image"; // Import Next.js Image component

export default function LoginPage() {
  const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST;
  const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // Add cache-busting key
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      console.log(BACKEND_HOST);
      try {
        const res = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/user/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.role === "admin") {
            router.replace("/admin_dashboard/customer");
          } else if (data?.data?.role === "superadmin") {
            router.replace("/super_admin_dashboard/customer");
          }
        }
      } catch (err) {
        // Not authenticated or network error, do nothing
      }
    };
    checkSession();

    // Refresh image key every time component mounts
    setImageKey(Date.now());
  }, [router]);

  const validate = () => {
    let valid = true;
    const errors = { email: '', password: '' };
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }
    if (!password) {
      errors.password = 'Password is required.';
      valid = false;
    }
    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const data1 = {
        "email": email,
        "password": password
      };
      console.log(data1);
      const res = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data1),
        credentials: "include"
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        if (data.data.role === "admin") {
          router.push("/admin_dashboard/customer");
        } else if (data.data.role === "superadmin") {
          router.push("/super_admin_dashboard/customer");
        } else {
          setError("Unknown user type");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4" >
      <div className="w-full min-h-screen bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col ">
        
           <div className="flex items-center">
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                {/* Option 1: Using Next.js Image component (recommended) */}
                <Image
                  src="/images/logo.png"
                  alt="Bristol Tailors Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority // Ensures the logo loads immediately
                  unoptimized // Prevents Next.js optimization if causing issues
                />
              
              </div>
              <span className="text-xl font-bold text-blue-500">Bristol Tailors</span>
            </div>

        <div className="justify-center flex flex-col flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600">Please enter details to log in to your account.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 border ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                placeholder="Enter your email"
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 pr-12 border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">I agree to the Terms and Privacy Policy.</span>
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
          </div>
        </div>

        {/* Right side - Background Image */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden">
          {/* Option 1: Using Next.js Image component (recommended) */}
          <Image
            src="/images/login_background.png"
            alt="Background"
            fill
            className="object-cover rounded-4xl"
            priority
            sizes="50vw"
            unoptimized
          />
          
          
        </div>
      </div>
    </div>
  );
}