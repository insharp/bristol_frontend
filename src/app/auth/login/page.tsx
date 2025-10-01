"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST;
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
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

    // Load saved email if "Remember Me" was previously checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }

    setImageKey(Date.now());
  }, []); // Empty dependency array means this only runs once on mount

  const validate = (): boolean => {
    let valid = true;
    const errors = { email: '', password: '' };
    
    if (!email) {
      errors.email = 'Email is required.';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
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

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    
    try {
      const requestData = {
        email: email,
        password: password,
        remember: remember
      };
      
      const res = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Save or remove email based on "Remember Me" checkbox
        if (remember) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Redirect based on role
        if (data.data.role === "admin") {
          router.push("/admin_dashboard/customer");
        } else if (data.data.role === "superadmin") {
          router.push("/super_admin_dashboard/customer");
        } else {
          setError("Unknown user type");
        }
      } else {
        // Show "Invalid credentials" for authentication failures
        if (res.status === 401 || res.status === 403) {
          setError("Invalid credentials");
        } else {
          setError(data.message || "Invalid credentials");
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full min-h-screen bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
          <div className="flex items-center">
            <div className="w-13 h-13 mr-3 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Bristol Tailors Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
                unoptimized
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
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    placeholder="Enter your password"
                    style={{
                      WebkitTextSecurity: showPassword ? 'none' : undefined
                    } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-700">Remember Me</span>
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