'use client'; // for app router — skip if using `pages/`

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignupPage() {
  const router=useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
  });
  
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: '', email: '', password: '', role: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let valid = true;
    const errors = { username: '', email: '', password: '', role: '' };
    if (!form.username || form.username.trim().length < 2) {
      errors.username = 'Name must be at least 2 characters.';
      valid = false;
    }
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }
    if (!form.password || form.password.length < 6 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      errors.password = 'Password must be at least 6 characters, include a letter and a number.';
      valid = false;
    }
    if (!form.role) {
      errors.role = 'Please select a role.';
      valid = false;
    }
    setFieldErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!agree) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }
    setError("");
    const res = await fetch(`http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    
    });
    console.log(form);

    if (res.ok) {
      router.push("/auth/login");
      alert("Signup success!");
    } else {
      const err = await res.json();
      alert(err.detail || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center mb-4">
          {/* <Image src="/images/logo.png" alt="Logo" width={90} height={90} /> */}
          <h2 className="mt-2 text-xl font-bold text-center text-gray-900">Create your Account</h2>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-gray-700">Name</label>
            <input
              name="username"
              id="username"
              placeholder="Name"
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            />
            {fieldErrors.username && <div className="text-red-500 text-xs mt-1">{fieldErrors.username}</div>}
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">Email</label>
            <input
              name="email"
              id="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            />
            {fieldErrors.email && <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>}
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700">Password</label>
            <input
              name="password"
              id="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
              required
            />
            {fieldErrors.password && <div className="text-red-500 text-xs mt-1">{fieldErrors.password}</div>}
          </div>
          <div>
            <label htmlFor="role" className="block text-xs font-medium text-gray-700">Role</label>
            <select
              name="role"
              id="role"
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-amber-400 focus:border-blue-500 text-sm`}
              value={form.role}
              required
            >
              <option value="admin" >admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            {fieldErrors.role && <div className="text-red-500 text-xs mt-1">{fieldErrors.role}</div>}
          </div>
          <div className="flex items-center text-xs">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={e => setAgree(e.target.checked)}
              className="mr-2"
              required
            />
            <label htmlFor="agree" className="text-gray-700">
              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </label>
          </div>
          {error && <div className="text-red-500 text-xs text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
          >
            Sign Up
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <div className="flex gap-2 mb-2">
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-50">
             <img
              src="/google-icon.svg"  
              alt="Google"
              className="w-4 h-4"
            />
            Sign up with Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24h11.495v-9.294H9.692v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0"/></svg>
            Sign up with Facebook
          </button>
        </div>
        <div className="text-center text-xs text-gray-600 mt-2">
          Already have an account? <a href="/auth/login" className="text-blue-700 font-semibold hover:underline">Sign in</a>
        </div>
      </div>
    </div>
  );
}
