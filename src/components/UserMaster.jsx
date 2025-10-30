import { useState, useEffect } from "react";
import { getUsers, addUser } from "../services/api";

const UserMaster = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      console.log("Fetched users:", data);
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch users");
      setLoading(false);
    }
  };
  // Add User UI state and handlers
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", passwordhash: "", createdat: "", isactive: true });
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setForm({ userid:0 ,username: "", email: "", passwordhash: "", createdat: "", isactive: true });
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Normalize radio boolean for isactive and keep other values as-is
    if (type === 'radio' && name === 'isactive') {
      setForm((s) => ({ ...s, [name]: value === 'true' }));
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addUser(form);
      await fetchUsers();
      closeAdd();
    } catch (err) {
      console.error("Failed to add user", err);
      alert("Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Ensure we have an array to map over. Some backends return objects like { data: [...] } or { value: [...] }.
  const list = Array.isArray(users)
    ? users
    : Array.isArray(users?.data)
    ? users.data
    : Array.isArray(users?.value)
    ? users.value
    : [];

  return (
    <div className="user-list">
      <h2>Users</h2>
      <button onClick={openAdd}>Add User</button>
      {showAdd && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal" style={{ background: '#992222ff', padding: 20, maxWidth: 420, margin: '60px auto', borderRadius: 6 }}>
            <h3>Add User</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 8 }}>
                <label>
                  Username
                  <input name="username" value={form.username} onChange={handleChange} required />
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>
                  Email
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>
                  Password
                  <input name="passwordhash" type="password" value={form.passwordhash} onChange={handleChange} required />
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>
                  Joined Date
                  <input name="createdat" type="date" value={form.createdat} onChange={handleChange} required />
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Status</label>
                <div>
                  <input
                    type="radio"
                    id="status-true"
                    name="isactive"
                    value="true"
                    checked={form.isactive === true}
                    onChange={handleChange}
                  />
                  <label htmlFor="status-true">Active</label>
                  <br />
                  <input
                    type="radio"
                    id="status-false"
                    name="isactive"
                    value="false"
                    checked={form.isactive === false}
                    onChange={handleChange}
                  />
                  <label htmlFor="status-false">Inactive</label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</button>
                <button type="button" onClick={closeAdd}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {list.length === 0 && <p>No users found.</p>}
      {list.map((u, idx) => {
        // Use a stable, more-unique key: prefer id or username, fall back to index.
        const key = u?.userid ? `user-${u.userid}` : u?.username ? `user-${u.username}` : `user-${idx}`;
        return (
          <div className="transaction-item bg-red text-success" key={key}>
                        <div>
              <h3>{u.username ?? 'Unknown User'}</h3>
              <p>Email: {u.email ?? 'N/A'}</p>
              <p>Password: {u.passwordhash ?? 'N/A'}</p>
              <p>Status: {u.isactive ? "Active":"InActive"}</p>
              <p>Joined: {u.createdat ? new Date(u.createdat).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default UserMaster;