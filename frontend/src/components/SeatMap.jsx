import React, { useEffect, useState } from 'react';
import { User, Briefcase, CalendarClock, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const SeatMap = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedZone, setSelectedZone] = useState('A');
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/seats?floor=${selectedFloor}&zone=${selectedZone}`)
      .then(res => res.json())
      .then(data => {
        setSeats(data);
        setLoading(false);
        setSelectedSeat(null); // Reset selection on floor/zone change
      })
      .catch(err => {
        console.error("Error fetching seats:", err);
        setLoading(false);
      });
  }, [selectedFloor, selectedZone]);

  const handleDeallocate = async (seatId) => {
    if (!window.confirm("Are you sure you want to deallocate this seat?")) return;
    try {
      const res = await fetch('http://localhost:5000/api/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId })
      });
      if (res.ok) {
        // Re-fetch the seats from the server to update the grid
        const response = await fetch(`http://localhost:5000/api/seats?floor=${selectedFloor}&zone=${selectedZone}`);
        const data = await response.json();
        setSeats(data);
        setSelectedSeat(null); // Clear selection
      } else {
        alert("Failed to deallocate seat");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSeats = seats
    .filter(s => s.floor === selectedFloor && s.zone === selectedZone)
    .sort((a, b) => {
      const numA = parseInt(a.seatNumber.split('-')[1]) || 0;
      const numB = parseInt(b.seatNumber.split('-')[1]) || 0;
      return numA - numB;
    });
  
  // Hardcoded for now since we generated 10 floors and A-J zones
  const floors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <div className="seat-map">
      <h1>Seat Explorer</h1>
      
      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Floor</label>
          <select value={selectedFloor} onChange={(e) => setSelectedFloor(Number(e.target.value))} style={{ marginBottom: 0 }}>
            {floors.map(f => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Zone</label>
          <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} style={{ marginBottom: 0 }}>
            {zones.map(z => (
              <option key={z} value={z}>Zone {z}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Seat Grid */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Floor {selectedFloor} - Zone {selectedZone} Layout</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#ecfdf5', border: '1px solid #a7f3d0' }}></span> Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#fef2f2', border: '1px solid #fecdd3' }}></span> Occupied
              </span>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading seats...</div>
          ) : (
            <div className="seat-grid">
              {filteredSeats.map(seat => (
                <div 
                  key={seat._id} 
                  onClick={() => setSelectedSeat(seat)}
                  className={`seat ${seat.status === 'Available' ? 'available' : 'occupied'} ${selectedSeat?._id === seat._id ? 'selected' : ''}`}
                >
                  {seat.seatNumber}
                </div>
              ))}
              {filteredSeats.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)' }}>No seats found.</p>}
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="glass-panel" style={{ alignSelf: 'start', position: 'sticky', top: '2rem' }}>
          <h2>Seat Details</h2>
          
          {!selectedSeat ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Info size={32} opacity={0.5} />
              <p>Click on any seat in the layout to view occupancy details.</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{selectedSeat.seatNumber}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Floor {selectedSeat.floor}, Zone {selectedSeat.zone}</div>
                
                <div style={{ marginTop: '0.75rem' }}>
                  {selectedSeat.status === 'Available' ? (
                     <span className="badge success">Available for Allocation</span>
                  ) : (
                     <span className="badge warning">Currently Occupied</span>
                  )}
                </div>
              </div>

              {selectedSeat.status === 'Occupied' && selectedSeat.assignedTo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupant</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontWeight: 500 }}>
                      <User size={18} className="text-indigo-500" /> {selectedSeat.assignedTo.name}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role / Email</label>
                    <div style={{ marginTop: '0.25rem', color: 'var(--text-main)' }}>
                      {selectedSeat.assignedTo.role} <br />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedSeat.assignedTo.email}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => handleDeallocate(selectedSeat._id)} 
                      style={{ width: '100%', background: '#ef4444', color: 'white' }}
                    >
                      Deallocate Seat
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>This seat is completely empty and ready to be used.</p>
                  <Link to="/allocate">
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} /> Allocate Someone Here
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SeatMap;
