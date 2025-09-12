// pages/UsersPage.tsx
"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import ReusableTable from "@/components/ui/ReusableTable";
import SlideModal from "@/components/ui/SlideModal";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

type UserRole = "all"  | "admin" | "superadmin";

// Message Modal Component
const MessageModal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message 
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-50/70  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={`${
                type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin"
  });

  // Message Modal State
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Form Validation State
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: ''
  });

  // Show Success Message
  const showSuccessMessage = (title: string, message: string) => {
    setMessageModal({
      isOpen: true,
      type: 'success',
      title,
      message
    });
  };

  // Show Error Message
  const showErrorMessage = (title: string, message: string) => {
    setMessageModal({
      isOpen: true,
      type: 'error',
      title,
      message
    });
  };

  // Close Message Modal
  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  // Form Validation
  const validateForm = () => {
    const errors = {
      username: '',
      email: '',
      password: ''
    };

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation (only for create mode)
    if (modalMode === 'create') {
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
    }

    setFormErrors(errors);
    return !errors.username && !errors.email && !errors.password;
  };

  // Clear form errors when form data changes
  useEffect(() => {
    if (formErrors.username || formErrors.email || formErrors.password) {
      setFormErrors({ username: '', email: '', password: '' });
    }
  }, [formData]);


  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/users`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || data);
        } else {
          showErrorMessage('Fetch Error', 'Failed to load users. Please try again.');
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        showErrorMessage('Connection Error', 'Unable to connect to the server. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on selected role and search query
  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesSearch = searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) 
  
    return matchesRole && matchesSearch;
  });

  // Get user count for each role
  const getUserCount = (role: UserRole) => {
    if (role === "all") return users.length;
    return users.filter(user => user.role === role).length;
  };

  // Role filter options
  const roleFilters = [
    { key: "all" as UserRole, label: "All Users", count: getUserCount("all") },
    { key: "admin" as UserRole, label: "Admins", count: getUserCount("admin") },
    { key: "superadmin" as UserRole, label: "Super Admins", count: getUserCount("superadmin") },
  ];

  // Table columns
  const columns = [
    { key: "id", label: "User ID" },
    { key: "username", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (value: string) => {
        const roleColors = {
          admin: "bg-green-100 text-green-800",
          superadmin: "bg-purple-100 text-purple-800"
        };
        const roleLabels = {
          admin: "Admin",
          superadmin: "Super Admin"
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[value as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}`}>
            {roleLabels[value as keyof typeof roleLabels] || value}
          </span>
        );
      },
    },
  ];

  // Table actions
  const actions = [
    {
      label: "View",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: (user: User) => {
        setSelectedUser(user);
        setFormData({ username: user.username, email: user.email, password: "", role: user.role });
        setModalMode("view");
        setIsModalOpen(true);
      },
    },
    {
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (user: User) => {
        setSelectedUser(user);
        setFormData({ username: user.username, email: user.email, password: "", role: user.role });
        setModalMode("edit");
        setIsModalOpen(true);
      },
    },
    {
      label: "Delete",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: (user: User) => {
        if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
          deleteUser(user.id);
        }
      },
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  // Modal handlers
  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData({ username: "", email: "", password: "", role: "admin" });
    setFormErrors({ username: '', email: '', password: '' });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormErrors({ username: '', email: '', password: '' });
  };

  // CRUD operations
  const createUser = async () => {
    try {
      const res = await fetch(
        `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      

      if (res.ok) {
        const newUser = await res.json();
        console.log("Create user response",newUser.user);

        setUsers([...users, newUser.user || newUser]);
        closeModal();
        showSuccessMessage('Success!', `User "${formData.username}" has been created successfully.`);
      } else {
        const errorData = await res.json();
        showErrorMessage('Creation Failed', errorData.message || 'Failed to create user. Please try again.');
      }
    } catch (err) {
      console.error("Error creating user:", err);
      showErrorMessage('Error', 'Unable to create user. Please check your connection and try again.');
    }
  };


  const updateUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(
        `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...(updatedUser.data || updatedUser) } : u));
        closeModal();
        showSuccessMessage('Success!', `User "${formData.username}" has been updated successfully.`);
      } else {
        const errorData = await res.json();
        showErrorMessage('Update Failed', errorData.message || 'Failed to update user. Please try again.');
      }
    } catch (err) {
      console.error("Error updating user:", err);
      showErrorMessage('Error', 'Unable to update user. Please check your connection and try again.');
    }
  };



  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    try {
      const res = await fetch(
        `http://${process.env.NEXT_PUBLIC_BACKEND_HOST}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/user/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        showSuccessMessage('Success!', `User "${userToDelete?.username || 'User'}" has been deleted successfully.`);
      } else {
        const errorData = await res.json();
        showErrorMessage('Deletion Failed', errorData.message || 'Failed to delete user. Please try again.');
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      showErrorMessage('Error', 'Unable to delete user. Please check your connection and try again.');
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (modalMode === "create") {
      createUser();
    } else if (modalMode === "edit") {
      updateUser();
    }
  };


  const getModalTitle = () => {
    switch (modalMode) {
      case "create": return "Add New User";
      case "edit": return "Edit User";
      case "view": return "View User";
    }
  };


  return (
    <div className="flex">
      <main className="flex-1 p-8 bg-blue-50/40 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-500">Users</h1>
          <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
            + Add User
          </Button>
        </div>

        {/* Filter and Search Section */}
        <div className="mb-6 flex items-center justify-between gap-6">
          {/* Role Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {roleFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedRole(filter.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedRole === filter.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {filter.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  selectedRole === filter.key
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>


          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>


        <ReusableTable
          data={filteredUsers}
          columns={columns}
          actions={actions}
          loading={loading}
          emptyMessage={selectedRole === "all" ? "No users found." : `No ${selectedRole === "superadmin" ? "super admin" : selectedRole} users found.`}
        />


        <SlideModal isOpen={isModalOpen} onClose={closeModal} title={getModalTitle()}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.username && (
                <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2`}
                readOnly={modalMode === "view"}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {modalMode !== "view" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password {modalMode === "create" && "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  required={modalMode === "create"}
                  placeholder={modalMode === "edit" ? "Leave empty to keep current password" : ""}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            )}



            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={modalMode === "view"}
                required
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            

            {modalMode !== "view" && (
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {modalMode === "create" ? "Create User" : "Update User"}
                </Button>
              </div>
            )}
          </form>
        </SlideModal>

        {/* Message Modal */}
        <MessageModal
          isOpen={messageModal.isOpen}
          onClose={closeMessageModal}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
        />
      </main>
    </div>
  );
};

export default UsersPage;