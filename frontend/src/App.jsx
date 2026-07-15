import { useState } from "react";
import "./App.css";

import Dashboard from "./components/Dashboard";
import SeatMap from "./components/SeatMap";
import EmployeeSearch from "./components/EmployeeSearch";
import AllocateSeat from "./components/AllocateSeat";
import AIChat from "./components/AIChat";

import { 
  LayoutDashboard, 
  Map, 
  Users, 
  UserPlus, 
  Menu, 
  X 
} from "lucide-react";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const navigation = [
    {
      section: "MAIN MENU",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} className="nav-icon-svg" /> },
        { id: "seats", label: "Seat Explorer", icon: <Map size={20} className="nav-icon-svg" /> },
        { id: "employees", label: "Employee Directory", icon: <Users size={20} className="nav-icon-svg" /> },
      ],
    },
    {
      section: "ADMIN TOOLS",
      items: [
        { id: "allocate", label: "Allocate Seat", icon: <UserPlus size={20} className="nav-icon-svg" /> },
      ],
    },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "seats":
        return <SeatMap />;

      case "employees":
        return <EmployeeSearch onNavigate={changePage} setSelectedEmployee={setSelectedEmployee} />;

      case "allocate":
        return <AllocateSeat selectedEmployee={selectedEmployee} />;

      default:
        return <Dashboard />;
    }
  };

  const changePage = (page) => {
    if (page !== 'allocate') {
      setSelectedEmployee(null);
    }
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span>E</span>
          </div>

          <div className="brand-content">
            <h2>Ethara Seats</h2>
            <p>Workspace Manager</p>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.section}>
              <p className="nav-heading">{group.section}</p>

              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-link ${
                    activePage === item.id ? "active" : ""
                  }`}
                  onClick={() => changePage(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>

                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-image">RS</div>

          <div className="profile-details">
            <strong>Riya Singh</strong>
            <span>Seat Manager</span>
          </div>
        </div>
      </aside>

      <main className="main-layout">
        <div className="mobile-header">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <strong>Ethara Seats</strong>
        </div>

        {renderPage()}
      </main>

      <AIChat />
    </div>
  );
}

export default App;