import { useEffect, useMemo, useState } from "react";
import { 
  Layers, 
  UserCheck, 
  UserPlus, 
  Search, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import api from "../api/axios";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real-time statistics from the API
  useEffect(() => {
    api.get('/api/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, []);

  const itemsPerPage = 6;

  const projects = stats?.projectUtilization || [];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      project._id.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const totalPages = Math.ceil(
    filteredProjects.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const displayedProjects = filteredProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Loading stats...</p>
        </header>
      </div>
    );
  }

  const totalSeats = stats?.totalSeats || 5000;
  const occupiedSeats = stats?.occupiedSeats || 0;
  const availableSeats = stats?.availableSeats || 0;

  const occupiedPercentage = (
    (occupiedSeats / totalSeats) *
    100
  ).toFixed(1);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Monitor seat allocation and workspace utilization</p>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          type="blue"
          icon={<Layers size={22} />}
          value={totalSeats}
          title="Total Seats"
          description="Total workspace capacity"
        />

        <StatCard
          type="orange"
          icon={<UserCheck size={22} />}
          value={occupiedSeats}
          title="Occupied Seats"
          description={`${occupiedPercentage}% seat utilization`}
        />

        <StatCard
          type="green"
          icon={<UserPlus size={22} />}
          value={availableSeats}
          title="Available Seats"
          description="Ready for allocation"
        />
      </section>

      <section className="utilization-section card">
        <div className="utilization-header">
          <div className="section-title">
            <h2>Seat Utilization by Project</h2>
            <p>Track seat allocation across active projects</p>
          </div>

          <div className="section-actions">
            <div className="project-search">
              <Search size={16} className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <button className="view-button">
              View All
            </button>
          </div>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>PROJECT NAME</th>
                <th className="center-column">SEATS OCCUPIED</th>
                <th>UTILIZATION STATUS</th>
              </tr>
            </thead>

            <tbody>
              {displayedProjects.map((project, index) => (
                <tr key={index}>
                  <td>
                    <div className="project-cell">
                      <div className="project-avatar">
                        {project._id.charAt(0)}
                      </div>
                      <span>{project._id}</span>
                    </div>
                  </td>

                  <td className="center-column">
                    <span className="seat-badge">
                      {project.count}
                    </span>
                  </td>

                  <td>
                    <div className="utilization-cell">
                      <div className="progress-track">
                        <div
                          className="progress-value"
                          style={{
                            width: `${Math.min(project.count, 100)}%`,
                          }}
                        />
                      </div>
                      <span>{project.count} seats</span>
                    </div>
                  </td>
                </tr>
              ))}

              {displayedProjects.length === 0 && (
                <tr>
                  <td colSpan="3" className="no-results">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <p>
            Showing {displayedProjects.length} of{" "}
            {filteredProjects.length} projects
          </p>

          {totalPages > 1 && (
            <div className="pagination-buttons">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
                className="pagination-arrow"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  className={
                    currentPage === page
                      ? "pagination-active"
                      : ""
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
                className="pagination-arrow"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  type,
  icon,
  value,
  title,
  description,
}) {
  return (
    <article className={`dashboard-stat-card ${type}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon">{icon}</div>

        <span className="live-badge">
          <span />
          Live
        </span>
      </div>

      <div className="stat-card-content">
        <h2>{value.toLocaleString()}</h2>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default Dashboard;