import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen, LayoutDashboard, ClipboardList, Users,
  Plus, Search, Bell, LogOut, CalendarDays,
  CheckCircle2, Clock, FileText, GraduationCap,
  Menu, X, ArrowUpRight, Send
} from "lucide-react";
import "./style.css";
import { api } from "./api";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("Student");
  const [assignments, setAssignments] = useState([]);
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: ""
  });

  function showNotice(message) {
    setNotice(message);
  }

  async function loadAssignments() {
    setLoading(true);
    setApiError("");

    try {
      const result = await api("listAssignments");

      const rows = await Promise.all(
        (result.assignments || []).map(async (a) => {
          try {
            const response = await api("listSubmissions", {
              assignmentId: a.id
            });

            const submissions = (response.submissions || []).map((s) => ({
              ...s,
              name: s.studentName || s.name || "Student",
              email: s.studentEmail || s.email || "",
              link: s.link || "",
              submittedAt: s.submittedAt || "",
              grade: s.grade || "",
              feedback: s.feedback || ""
            }));

            return { ...a, submissions };
          } catch {
            return { ...a, submissions: [] };
          }
        })
      );

      setAssignments(rows);
    } catch (error) {
      setApiError(error.message || "Unable to load Google Sheets data.");
    } finally {
      setLoading(false);
    }
  }

  function login(e) {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();

    if (!name || !email) return;

    setUser({ name, email });
    setPage("Dashboard");
    loadAssignments();
  }

  function logout() {
    setUser(null);
    setSelected(null);
    setPage("Dashboard");
  }

  async function createAssignment(e) {
    e.preventDefault();
    setApiError("");

    try {
      await api("createAssignment", {
        ...newAssignment,
        createdBy: user.name
      });

      await loadAssignments();

      setNewAssignment({
        title: "",
        subject: "",
        description: "",
        dueDate: ""
      });

      setPage("Assignments");
      showNotice("Assignment created successfully!");
    } catch (error) {
      setApiError(error.message || "Unable to create assignment.");
    }
  }

  async function submitAssignment(e) {
    e.preventDefault();

    if (!submissionLink.trim()) {
      showNotice("Please enter your assignment link.");
      return;
    }

    setApiError("");

    try {
      await api("submitAssignment", {
        assignmentId: selected.id,
        studentName: user.name,
        studentEmail: user.email,
        link: submissionLink.trim()
      });

      setSubmissionLink("");
      setSelected(null);

      await loadAssignments();
      showNotice("Assignment submitted successfully!");
    } catch (error) {
      setApiError(error.message || "Unable to submit assignment.");
    }
  }

  async function openReview(assignment) {
    setApiError("");

    try {
      const result = await api("listSubmissions", {
        assignmentId: assignment.id
      });

      const submissions = (result.submissions || []).map((s) => ({
        ...s,
        name: s.studentName || s.name || "Student",
        email: s.studentEmail || s.email || "",
        link: s.link || "",
        submittedAt: s.submittedAt || "",
        grade: s.grade || "",
        feedback: s.feedback || ""
      }));

      setSelected({ ...assignment, submissions });
      setPage("Submissions");
    } catch (error) {
      setApiError(error.message || "Unable to load submissions.");
    }
  }

  async function gradeSubmission(submission) {
    if (!submission.id) {
      setApiError("Submission ID is missing. Check your Google Sheet headers.");
      return;
    }

    try {
      await api("gradeSubmission", {
        id: submission.id,
        grade,
        feedback
      });

      setGrade("");
      setFeedback("");

      await loadAssignments();
      showNotice("Grade and feedback saved!");

      if (selected) {
        await openReview(selected);
      }
    } catch (error) {
      setApiError(error.message || "Unable to save grade.");
    }
  }

  const filtered = assignments.filter((a) =>
    `${a.title} ${a.subject}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const mySubmissions = assignments.flatMap((a) =>
    (a.submissions || [])
      .filter((s) => s.email === user?.email)
      .map((s) => ({
        ...s,
        assignmentTitle: a.title,
        assignmentId: a.id
      }))
  );

  const totalSubmissions = assignments.reduce(
    (n, a) => n + (a.submissions || []).length,
    0
  );

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Assignments", icon: ClipboardList },
    {
      name: role === "Faculty" ? "Submissions" : "My Submissions",
      icon: role === "Faculty" ? Users : FileText
    }
  ];

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-decoration decoration-one" />
        <div className="login-decoration decoration-two" />

        <div className="login-card">
          <div className="brand-mark"><BookOpen size={28} /></div>
          <h1>AssignMate</h1>
          <p className="muted">Your assignments, all in one place.</p>

          <form onSubmit={login} className="login-form">
            <label>Full name</label>
            <input name="name" placeholder="Enter your name" required />

            <label>Email address</label>
            <input
              name="email"
              type="email"
              placeholder="you@college.edu"
              required
            />

            <label>Login as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Student</option>
              <option>Faculty</option>
            </select>

            <button className="primary-btn full-btn" type="submit">
              Continue to Dashboard <ArrowUpRight size={18} />
            </button>
          </form>

          <p className="login-note">
            Assignment management made simple.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={23} /></div>
          <div>
            <strong>AssignMate</strong>
            <small>ACADEMIC PORTAL</small>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${page === item.name ? "active" : ""}`}
                onClick={() => {
                  setPage(item.name);
                  setSelected(null);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}

          {role === "Faculty" && (
            <button
              className={`nav-item ${page === "Create Assignment" ? "active" : ""}`}
              onClick={() => setPage("Create Assignment")}
            >
              <Plus size={19} />
              <span>Create Assignment</span>
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><GraduationCap size={22} /></div>
            <strong>Stay on track!</strong>
            <p>
              Keep your assignments organized and submit them before deadlines.
            </p>
          </div>

          <button className="nav-item logout-btn" onClick={logout}>
            <LogOut size={19} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> {page}
          </div>

          <div className="topbar-right">
            <button
              className="icon-btn notification-btn"
              onClick={() => showNotice("You are all caught up!")}
            >
              <Bell size={20} />
              <i />
            </button>

            <div className="user-profile">
              <div className="avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-meta">
                <strong>{user.name}</strong>
                <small>{role}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="toast">
              <CheckCircle2 size={18} />
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {apiError && (
            <div className="toast" role="alert">
              {apiError}
              <button onClick={() => setApiError("")}>×</button>
            </div>
          )}

          {loading && (
            <p className="muted small">
              Loading data from Google Sheets...
            </p>
          )}

          {selected ? (
            <section className="detail-panel">
              <button
                className="text-btn"
                onClick={() => setSelected(null)}
              >
                ← Back to Assignments
              </button>

              <div className="detail-card">
                <span className="subject-tag">{selected.subject}</span>
                <h2>{selected.title}</h2>
                <p>{selected.description}</p>

                <div className="detail-meta">
                  <span>
                    <CalendarDays size={17} />
                    Due {selected.dueDate}
                  </span>
                </div>

                {role === "Student" ? (
                  <form
                    onSubmit={submitAssignment}
                    className="submission-form"
                  >
                    <label>Assignment file link</label>
                    <p className="muted small">
                      Upload your file to Google Drive and paste its shareable
                      link here.
                    </p>

                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      required
                    />

                    <button className="primary-btn" type="submit">
                      <Send size={17} /> Submit Assignment
                    </button>
                  </form>
                ) : (
                  <div className="grade-form">
                    <h3>Student submissions</h3>

                    {selected.submissions?.length === 0 ? (
                      <p className="empty-state">No submissions yet.</p>
                    ) : (
                      selected.submissions?.map((s) => (
                        <div className="submission-row" key={s.id || s.email}>
                          <div className="submission-student">
                            <div className="avatar">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <strong>{s.name}</strong>
                              <small>{s.email}</small>
                            </div>
                          </div>

                          <a
                            href={s.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open submission <ArrowUpRight size={15} />
                          </a>

                          <span className="grade-label">
                            {s.grade ? `Grade: ${s.grade}` : "Not graded"}
                          </span>

                          <div className="grade-inputs">
                            <input
                              placeholder="Grade (e.g. 85/100)"
                              value={grade}
                              onChange={(e) => setGrade(e.target.value)}
                            />

                            <input
                              placeholder="Feedback for student"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                            />

                            <button
                              className="primary-btn"
                              onClick={() => gradeSubmission(s)}
                            >
                              Save Review
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : page === "Dashboard" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">YOUR LEARNING SPACE</div>
                  <h1>
                    Welcome back, {user.name.split(" ")[0]} <span>✦</span>
                  </h1>
                  <p>Here's what's happening with your assignments today.</p>
                </div>

                {role === "Faculty" && (
                  <button
                    className="primary-btn"
                    onClick={() => setPage("Create Assignment")}
                  >
                    <Plus size={18} /> Create Assignment
                  </button>
                )}
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <ClipboardList size={21} />
                  </div>
                  <span>Total assignments</span>
                  <strong>{assignments.length}</strong>
                  <small>Across all subjects</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange"><Clock size={21} /></div>
                  <span>
                    {role === "Student" ? "My submissions" : "Submissions received"}
                  </span>
                  <strong>
                    {role === "Student" ? mySubmissions.length : totalSubmissions}
                  </strong>
                  <small>Submitted work</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <CheckCircle2 size={21} />
                  </div>
                  <span>
                    {role === "Student" ? "Reviewed" : "Assignments reviewed"}
                  </span>
                  <strong>
                    {role === "Student"
                      ? mySubmissions.filter((s) => s.grade).length
                      : assignments.reduce(
                          (n, a) =>
                            n + (a.submissions || []).filter((s) => s.grade).length,
                          0
                        )}
                  </strong>
                  <small>Grading progress</small>
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <h2>Recent assignments</h2>
                  <p>Stay up to date with your coursework.</p>
                </div>
                <button
                  className="text-btn"
                  onClick={() => setPage("Assignments")}
                >
                  View all →
                </button>
              </section>

              <AssignmentList
                assignments={filtered.slice(0, 3)}
                role={role}
                user={user}
                onOpen={(a) =>
                  role === "Faculty" ? openReview(a) : setSelected(a)
                }
              />
            </>
          ) : page === "Create Assignment" && role === "Faculty" ? (
            <section className="form-section">
              <div className="eyebrow">FACULTY WORKSPACE</div>
              <h1>Create assignment</h1>
              <p>Add assignment instructions and a submission deadline.</p>

              <form onSubmit={createAssignment} className="create-form">
                <label>Assignment title</label>
                <input
                  required
                  placeholder="e.g. React Application Project"
                  value={newAssignment.title}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, title: e.target.value })
                  }
                />

                <label>Subject</label>
                <input
                  required
                  placeholder="e.g. Web Technology"
                  value={newAssignment.subject}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, subject: e.target.value })
                  }
                />

                <label>Description and instructions</label>
                <textarea
                  required
                  rows="5"
                  placeholder="Explain what students need to complete..."
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value
                    })
                  }
                />

                <label>Due date</label>
                <input
                  required
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, dueDate: e.target.value })
                  }
                />

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setPage("Assignments")}
                  >
                    Cancel
                  </button>
                  <button className="primary-btn" type="submit">
                    <Plus size={17} /> Publish assignment
                  </button>
                </div>
              </form>
            </section>
          ) : page === "Submissions" && role === "Faculty" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">FACULTY WORKSPACE</div>
                  <h1>Student submissions</h1>
                  <p>Review student work and provide grades.</p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => setPage("Create Assignment")}
                >
                  <Plus size={17} /> New assignment
                </button>
              </section>

              <AssignmentList
                assignments={assignments}
                role="Faculty"
                user={user}
                onOpen={openReview}
              />
            </>
          ) : page === "My Submissions" && role === "Student" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">STUDENT WORKSPACE</div>
                  <h1>My submissions</h1>
                  <p>Track your submitted assignments and grades.</p>
                </div>
              </section>

              {mySubmissions.length === 0 ? (
                <div className="empty-box">
                  <FileText size={35} />
                  <h3>No submissions yet</h3>
                  <p>Your submitted assignments will appear here.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Assignment</th>
                        <th>Submitted at</th>
                        <th>Grade</th>
                        <th>Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map((s) => (
                        <tr key={s.assignmentId}>
                          <td>{s.assignmentTitle}</td>
                          <td>{s.submittedAt}</td>
                          <td>{s.grade || "Pending"}</td>
                          <td>{s.feedback || "Awaiting review"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">{role.toUpperCase()} WORKSPACE</div>
                  <h1>Assignments</h1>
                  <p>Browse assignments and manage your coursework.</p>
                </div>

                {role === "Faculty" && (
                  <button
                    className="primary-btn"
                    onClick={() => setPage("Create Assignment")}
                  >
                    <Plus size={18} /> Create Assignment
                  </button>
                )}
              </section>

              <div className="search-bar">
                <Search size={19} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by assignment or subject..."
                />
              </div>

              <AssignmentList
                assignments={filtered}
                role={role}
                user={user}
                onOpen={(a) =>
                  role === "Faculty" ? openReview(a) : setSelected(a)
                }
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function AssignmentList({ assignments, role, user, onOpen }) {
  if (!assignments.length) {
    return (
      <div className="empty-box">
        <ClipboardList size={35} />
        <h3>No assignments found</h3>
        <p>Try another search or create an assignment.</p>
      </div>
    );
  }

  return (
    <div className="assignment-grid">
      {assignments.map((a) => {
        const submissions = a.submissions || [];
        const mine = submissions.find((s) => s.email === user.email);

        return (
          <article className="assignment-card" key={a.id}>
            <div className="assignment-card-top">
              <span className="subject-tag">{a.subject}</span>
              <span className="status-tag">
                {role === "Faculty"
                  ? `${submissions.length} submitted`
                  : mine?.grade
                  ? "Reviewed"
                  : mine
                  ? "Submitted"
                  : "Pending"}
              </span>
            </div>

            <div className="assignment-symbol">
              <FileText size={21} />
            </div>

            <h3>{a.title}</h3>
            <p>{a.description}</p>

            <div className="assignment-footer">
              <span>
                <CalendarDays size={16} /> Due {a.dueDate}
              </span>
              <button className="text-btn" onClick={() => onOpen(a)}>
                {role === "Faculty" ? "Review" : mine ? "View" : "Open"}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);