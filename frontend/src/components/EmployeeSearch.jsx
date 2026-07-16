import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import api from '../api/axios';

const EmployeeSearch = ({ onNavigate, setSelectedEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const handleDeallocate = async (userId) => {
    if (!window.confirm("Are you sure you want to deallocate this employee's seat?")) return;
    try {
      await api.post('/api/deallocate', { userId });
      fetchEmployees(searchTerm, page);
    } catch (err) {
      console.error(err);
      alert("Failed to deallocate seat");
    }
  };

  const fetchEmployees = (searchQuery = '', pageNum = 1) => {
    setLoading(true);
    api.get(`/api/employees?search=${searchQuery}&page=${pageNum}&limit=15`)
      .then(res => {
        const data = res.data;
        setEmployees(data.employees);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);
        setTotalRecords(data.totalEmployees);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching employees:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees('', 1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees(searchTerm, 1);
  };

  const handlePrevPage = () => {
    if (page > 1) fetchEmployees(searchTerm, page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) fetchEmployees(searchTerm, page + 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="employee-search">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Employee Directory <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>({totalRecords} Total)</span></h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by employee name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
          </div>
          <button type="submit" style={{ margin: 0 }}>Search</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Project</th>
                    <th>Seat Assignment</th>
                    <th>Allocated On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map(emp => (
                      <tr key={emp._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </td>
                        <td>{emp.role}</td>
                        <td>{emp.project ? <span className="badge info">{emp.project.name}</span> : '-'}</td>
                        <td>
                          {emp.seat 
                            ? <span className="badge success">F{emp.seat.floor} - Z{emp.seat.zone} - S{emp.seat.seatNumber}</span>
                            : <span className="badge warning">Pending Allocation</span>}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {emp.allocationDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CalendarClock size={14} /> {formatDate(emp.allocationDate)}
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="secondary" 
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                if (setSelectedEmployee) setSelectedEmployee(emp);
                                if (onNavigate) onNavigate('allocate');
                              }}
                            >
                              Update Seat
                            </button>
                            {emp.seat && (
                              <button 
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#ef4444', color: 'white' }}
                                onClick={() => handleDeallocate(emp._id)}
                              >
                                Deallocate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No employees found matching that name.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="secondary" onClick={handlePrevPage} disabled={page === 1} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="secondary" onClick={handleNextPage} disabled={page === totalPages} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeSearch;