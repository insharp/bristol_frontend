'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateUserForm from "@/components/forms/createuserform"; // Adjust the path

export default function ParentComponent() {
  const router = useRouter();

  const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST;
  const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'admin',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ User created successfully!');
        setFormData({ email: '', username: '', password: '', role: 'admin' });
      } else {
        setMessage(`❌ Error: ${result.message || 'Failed to create user'}`);
      }
    } catch (error) {
      setMessage('❌ Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back(); // Navigate to the previous page
  };

  return (
    <div className="py-6 px-4 ">
      <div className="mb-4 ">
        <button
          onClick={handleBack}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
        >
          ← Back
        </button>
      </div>

      <CreateUserForm
        formData={formData}
        loading={loading}
        message={message}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
