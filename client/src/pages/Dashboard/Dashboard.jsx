import { Link } from "react-router-dom";
import { useState } from "react";
import { useInvestigationStore } from "../../store/investigationStore";
import {
  Activity,
  Bell,
  Brain,
  FileText,
  GitBranch,
  LayoutDashboard,
  Map,
  Search,
  Users,
} from "lucide-react";
import NetworkGraph from "../../features/graph/components/NetworkGraph";

import "../../styles/dashboard.css";

function Dashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [graphSearch, setGraphSearch] = useState("Rakesh");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const setSelectedEntity =useInvestigationStore((state) => state.setSelectedEntity);
  return (
    <div className="dashboard">
        

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-logo">
          <span className="sidebar-logo-dot" />

          <span>CRIMEGRAPH</span>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label mono">
            NAVIGATION
          </span>

          <nav className="sidebar-nav">

            <Link
              to="/dashboard"
              className="sidebar-link active"
            >
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </Link>

            <Link
              to="/investigation"
              className="sidebar-link"
            >
              <Search size={16} />
              <span>Investigate</span>
            </Link>

            <Link
              to="/graph"
              className="sidebar-link"
            >
              <GitBranch size={16} />
              <span>Network Graph</span>
            </Link>

            <Link
              to="/investigation"
              className="sidebar-link"
            >
              <Activity size={16} />
              <span>Timeline</span>
            </Link>

            <Link
              to="/map"
              className="sidebar-link"
            >
              <Map size={16} />
              <span>Map</span>
            </Link>

          </nav>
        </div>

        <div className="sidebar-section">

          <span className="sidebar-label mono">
            INTELLIGENCE
          </span>

          <nav className="sidebar-nav">

            <Link
              to="/investigation"
              className="sidebar-link"
            >
              <Brain size={16} />
              <span>Analytics</span>
            </Link>

            <Link
              to="/investigation"
              className="sidebar-link"
            >
              <Bell size={16} />
              <span>Alerts</span>
            </Link>

            <Link
              to="/investigation"
              className="sidebar-link"
            >
              <FileText size={16} />
              <span>Reports</span>
            </Link>

          </nav>

        </div>

        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot" />

            <div>
              <span className="mono">
                SYSTEM STATUS
              </span>

              <strong>OPERATIONAL</strong>
            </div>
          </div>

          <div className="sidebar-version mono">
            CRIMEGRAPH AI / v1.0
          </div>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-header">

          <div>
            <span className="mono dashboard-breadcrumb">
              COMMAND CENTER / 01
            </span>

            <h1>
              Intelligence
              <br />
              <span>Dashboard</span>
            </h1>
          </div>

          <div className="dashboard-header-right">

            <div className="live-status">
              <span className="status-dot" />
              <span className="mono">
                SYSTEM / ONLINE
              </span>
            </div>

            <button className="notification-button">
              <Bell size={18} />
            </button>

          </div>

        </header>


        {/* SEARCH */}

        <div className="dashboard-search">

          <Search size={18} />
<input
  type="text"
  placeholder="Search entities..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      setGraphSearch(searchTerm);
    }
  }}
/>
          <span className="mono search-shortcut">
            /
          </span>

        </div>


        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-top">
              <span className="mono">
                TOTAL ENTITIES
              </span>

              <Users size={18} />
            </div>

            <strong>128</strong>

            <span className="stat-description">
              Persons, devices, phones & accounts
            </span>

          </div>


          <div className="stat-card">

            <div className="stat-top">
              <span className="mono">
                CONNECTIONS
              </span>

              <GitBranch size={18} />
            </div>

            <strong>342</strong>

            <span className="stat-description">
              Relationships discovered
            </span>

          </div>


          <div className="stat-card">

            <div className="stat-top">
              <span className="mono">
                ACTIVE CASES
              </span>

              <FileText size={18} />
            </div>

            <strong>12</strong>

            <span className="stat-description">
              Investigations currently active
            </span>

          </div>


          <div className="stat-card accent-card">

            <div className="stat-top">
              <span className="mono">
                AI SIGNALS
              </span>

              <Brain size={18} />
            </div>

            <strong>27</strong>

            <span className="stat-description">
              Potentially significant findings
            </span>

          </div>

        </section>


        {/* MAIN WORKSPACE */}

        <section className="dashboard-workspace">

          <div className="network-panel">

            <div className="panel-header">

              <div>
                <span className="mono">
                  NETWORK ANALYSIS
                </span>

                <h2>
                  Criminal Network
                </h2>
              </div>

              <Link
                to="/graph"
                className="panel-action"
              >
                OPEN GRAPH →
              </Link>

            </div>

            <div className="network-graph-wrapper">
                <div className="graph-filters">
  {[
    "ALL",
    "PERSON",
    "PHONE",
    "DEVICE",
    "ACCOUNT",
    "LOCATION",
    "CASE",
    "EVENT",
  ].map((filter) => (
    <button
      key={filter}
      className={`graph-filter ${
        activeFilter === filter ? "active" : ""
      }`}
      onClick={() => setActiveFilter(filter)}
    >
      {filter}
    </button>
  ))}
</div>
               <NetworkGraph
  searchTerm={graphSearch}
  activeFilter={activeFilter}
  onNodeSelect={setSelectedEntity}
/>
            </div>

          </div>


          {/* ACTIVITY */}

          <div className="activity-panel">

            <div className="panel-header">

              <div>
                <span className="mono">
                  ACTIVITY
                </span>

                <h2>
                  Recent Signals
                </h2>
              </div>

              <Activity size={18} />

            </div>


            <div className="activity-list">

              <div className="activity-item">

                <span className="activity-number">
                  01
                </span>

                <div>
                  <strong>
                    New entity detected
                  </strong>

                  <span className="mono">
                    PERSON / RAKESH
                  </span>
                </div>

                <span className="activity-time mono">
                  02m
                </span>

              </div>


              <div className="activity-item">

                <span className="activity-number">
                  02
                </span>

                <div>
                  <strong>
                    Network connection found
                  </strong>

                  <span className="mono">
                    P001 → PH001
                  </span>
                </div>

                <span className="activity-time mono">
                  18m
                </span>

              </div>


              <div className="activity-item">

                <span className="activity-number">
                  03
                </span>

                <div>
                  <strong>
                    Document processed
                  </strong>

                  <span className="mono">
                    CASE / DOCUMENT-04
                  </span>
                </div>

                <span className="activity-time mono">
                  42m
                </span>

              </div>


              <div className="activity-item">

                <span className="activity-number">
                  04
                </span>

                <div>
                  <strong>
                    AI signal generated
                  </strong>

                  <span className="mono">
                    HIGH CENTRALITY
                  </span>
                </div>

                <span className="activity-time mono">
                  1h
                </span>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
