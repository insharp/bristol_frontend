'use client';

interface Props {
  formData: {
    email: string;
    username: string;
    password: string;
    role: string;
  };
  loading: boolean;
  message: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateUserForm({
  formData,
  loading,
  message,
  onChange,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-bold">Create User</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full border px-3 py-2 rounded-md"
          value={formData.email}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          name="username"
          required
          className="w-full border px-3 py-2 rounded-md"
          value={formData.username}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          name="password"
          required
          className="w-full border px-3 py-2 rounded-md"
          value={formData.password}
          onChange={onChange}
        />
      </div>

      {/* Hidden role */}
      <input type="hidden" name="role" value="admin" />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        {loading ? 'Creating...' : 'Create User'}
      </button>

      {message && <p className="mt-2 text-sm text-center">{message}</p>}
    </form>
  );
}
