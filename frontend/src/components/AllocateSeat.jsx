import React, { useState, useEffect } from 'react';
import { UserPlus, Search, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const AllocateSeat = ({ selectedEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [seats, setSeats] = useState([]);
  const [floor, setFloor] = useState(1);
  const [zone, setZone] = useState('A');
  const [selectedSeat, setSelectedSeat] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedEmployee) {
      setSelectedUser(selectedEmployee);
      setSearchTerm(selectedEmployee.name);
    }
  }, [selectedEmployee]);

  const handleDeallocateCurrent = async () => {
    if (!selectedUser || !selectedUser.seat) return;
    if (!window.confirm(`Are you sure you want to deallocate ${selectedUser.name}'s current seat?`)) return;
    try {
      const res = await api.post('/api/deallocate', { userId: selectedUser._id });
      if (res.status === 200) {
        setMessage({ text: `Successfully deallocated current seat for ${selectedUser.name}`, type: 'success' });
        setSelectedUser({ ...selectedUser, seat: null });
        // Re-fetch seats for selected floor/zone
        api.get(`/api/seats?floor=${floor}&zone=${zone}`)
          .then(res => {
            const sorted = res.data.sort((a, b) => {
              const numA = parseInt(a.seatNumber.split('-')[1]) || 0;
              const numB = parseInt(b.seatNumber.split('-')[1]) || 0;
              return numA - numB;
            });
            setSeats(sorted);
          });
      } else {
        setMessage({ text: 'Failed to deallocate seat', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to deallocate seat', type: 'error' });
    }
  };

  // Search unassigned employees (we just use the standard search and filter on frontend for simplicity)
  const searchEmployees = (e) => {
    e.preventDefault();
    setLoading(true);
    api.get(`/api/employees?search=${searchTerm}&limit=10`)
      .then(res => {
        // Filter those who don't have a seat or let HR reassign them
        setEmployees(res.data.employees);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  // Fetch initial employees on mount
  useEffect(() => {
    setLoading(true);
    api.get(`/api/employees?limit=10`)
      .then(res => {
        setEmployees(res.data.employees);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  // Fetch seats for selected floor/zone
  useEffect(() => {
    api.get(`/api/seats?floor=${floor}&zone=${zone}`)
      .then(res => {
        const sorted = res.data.sort((a, b) => {
          const numA = parseInt(a.seatNumber.split('-')[1]) || 0;
          const numB = parseInt(b.seatNumber.split('-')[1]) || 0;
          return numA - numB;
        });
        setSeats(sorted);
      })
      .catch(console.error);
  }, [floor, zone]);

  const handleAllocate = async () => {
    if (!selectedUser || !selectedSeat) return;
    
    setLoading(true);
    try {
      const res = await api.post('/api/allocate', { userId: selectedUser._id, seatId: selectedSeat._id });
      const data = res.data;
      
      setMessage({ type: 'success', text: `Successfully allocated Seat ${selectedSeat.seatNumber} to ${selectedUser.name}` });
      
      // Re-fetch the seats from the server to ensure the old seat is shown as Available
      api.get(`/api/seats?floor=${floor}&zone=${zone}`)
        .then(res => setSeats(res.data))
        .catch(console.error);

      setSelectedUser(null);
      setSelectedSeat(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server error';
      setMessage({ type: 'error', text: errorMsg });
    }
    setLoading(false);
  };

  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const floors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="allocate-seat">
      <h1>Allocate / Update Seat</h1>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#059669' : '#e11d48', border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecdd3'}` }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Step 1: Select Employee */}
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h2>1. Select Employee</h2>
          <form onSubmit={searchEmployees} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Search name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ marginBottom: 0 }}
            />
            <button type="submit" className="secondary"><Search size={18} /></button>
          </form>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            {employees.length > 0 ? (
              employees.map(emp => (
                <div 
                  key={emp._id} 
                  onClick={() => setSelectedUser(emp)}
                  style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    background: selectedUser?._id === emp._id ? '#eff6ff' : 'white',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontWeight: 600, color: selectedUser?._id === emp._id ? 'var(--primary)' : 'inherit' }}>{emp.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Project: {emp.project ? emp.project.name : 'None'} | Current: {emp.seat ? `F${emp.seat.floor}-Z${emp.seat.zone}` : 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found</div>
            )}
          </div>
        </div>

        {/* Step 2 & 3: Select Floor/Zone and Seat */}
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>2. Select Seat</h2>
            {selectedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge info">Allocating for: {selectedUser.name}</span>
                {selectedUser.seat && (
                  <button 
                    onClick={handleDeallocateCurrent}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: 0 }}
                  >
                    Deallocate Current
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1 }}>
              <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Floor</label>
              <select value={floor} onChange={(e) => setFloor(Number(e.target.value))} style={{ marginBottom: 0 }}>
                {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} style={{ marginBottom: 0 }}>
                {zones.map(z => <option key={z} value={z}>Zone {z}</option>)}
              </select>
            </div>
          </div>

          <div className="seat-grid" style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
            {seats.map(seat => (
              <div 
                key={seat._id} 
                onClick={() => seat.status === 'Available' && setSelectedSeat(seat)}
                className={`seat ${seat.status === 'Available' ? 'available' : 'occupied'} ${selectedSeat?._id === seat._id ? 'selected' : ''}`}
                title={seat.assignedTo ? `Occupied by: ${seat.assignedTo.name}` : 'Available'}
                style={{ cursor: seat.status === 'Available' ? 'pointer' : 'not-allowed', opacity: seat.status === 'Available' ? 1 : 0.6 }}
              >
                {seat.seatNumber}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
             <button disabled={!selectedUser || !selectedSeat || loading} onClick={handleAllocate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> {selectedUser?.seat ? 'Update Allocation to' : 'Allocate'} {selectedSeat ? `Seat ${selectedSeat.seatNumber}` : ''}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AllocateSeat;