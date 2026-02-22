// NOTIFICATION SYSTEM
function showNotification(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// SIGNUP FORM
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const pass = document.getElementById("signupPassword").value;
    const conf = document.getElementById("signupConfirmPassword").value;

    if (pass !== conf) {
      showNotification("Passwords do not match! ❌", "error");
      return;
    }

    fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // showNotification(data.message); // Optional: Hide toast if showing modal
          const modal = document.getElementById("signupModal");
          const modalTitle = document.getElementById("signupModalTitle");
          const modalText = document.getElementById("signupModalText");

          if (modal) {
            if (modalTitle) modalTitle.innerText = "Account Created! ✨";
            if (modalText) modalText.innerText = data.message || "Your account has been successfully created. You can now sign in.";
            modal.classList.add("active");
          } else {
            showNotification(data.message);
            setTimeout(() => {
              window.location.href = "signin.html";
            }, 1500);
          }
        } else {
          showNotification(data.message, "error");
        }
      })
      .catch(err => {
        showNotification("Error connecting to server ❌", "error");
      });
  });
}


// SIGNIN FORM
const signinForm = document.getElementById("signinForm");

if (signinForm) {
  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("signinEmail").value.trim();
    const pass = document.getElementById("signinPassword").value;

    fetch('/api/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("skilltrack_current_user", JSON.stringify(data.user));
          showNotification(data.message);
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          showNotification(data.message, "error");
        }
      })
      .catch(err => {
        showNotification("Error connecting to server ❌", "error");
      });
  });
}



/* -------------------------
   TASK MANAGER
-------------------------- */
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const clearTasksBtn = document.getElementById("clearTasksBtn");

function createTask(taskName, priority) {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";

  taskItem.innerHTML = `
    <div class="task-left">
      <input type="checkbox" class="check" />
      <div>
        <div class="task-title">${taskName}</div>
        <div class="task-meta">Priority: ${priority}</div>
      </div>
    </div>

    <span class="priority">${priority}</span>
    <button class="del-btn">🗑️</button>
  `;

  // Delete task
  taskItem.querySelector(".del-btn").addEventListener("click", () => {
    taskItem.remove();
  });

  // Mark completed
  taskItem.querySelector(".check").addEventListener("change", (e) => {
    if (e.target.checked) {
      taskItem.style.opacity = "0.6";
      taskItem.style.textDecoration = "line-through";
    } else {
      taskItem.style.opacity = "1";
      taskItem.style.textDecoration = "none";
    }
  });

  taskList.appendChild(taskItem);
}

if (addTaskBtn) {
  addTaskBtn.addEventListener("click", () => {
    const name = taskInput.value.trim();
    const pr = taskPriority.value;

    if (name === "") {
      alert("Please enter a task name!");
      return;
    }

    createTask(name, pr);
    taskInput.value = "";
  });
}

if (clearTasksBtn) {
  clearTasksBtn.addEventListener("click", () => {
    taskList.innerHTML = "";
  });
}


/* -------------------------
   TIMER
-------------------------- */
let timerInterval = null;
let totalSeconds = 0;

const timerText = document.getElementById("timerText");
const startTimer = document.getElementById("startTimer");
const pauseTimer = document.getElementById("pauseTimer");
const resetTimer = document.getElementById("resetTimer");

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateTimerUI() {
  if (timerText) timerText.innerText = formatTime(totalSeconds);
}

if (startTimer) {
  startTimer.addEventListener("click", () => {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
      totalSeconds++;
      updateTimerUI();
    }, 1000);
  });
}

if (pauseTimer) {
  pauseTimer.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });
}

if (resetTimer) {
  resetTimer.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    totalSeconds = 0;
    updateTimerUI();
  });
}


/* -------------------------
   AI SCORE + BADGE (Demo)
-------------------------- */
const aiScore = document.getElementById("aiScore");
const aiFill = document.getElementById("aiFill");
const aiskillLevel = document.getElementById("skillLevel");

const badgeIcon = document.getElementById("badgeIcon");
const badgeName = document.getElementById("badgeName");
const badgeDesc = document.getElementById("badgeDesc");

const updateScoreBtn = document.getElementById("updateScoreBtn");

function setScore(score) {
  if (!aiScore || !aiFill) return;

  aiScore.innerText = score;
  aiFill.style.width = score + "%";

  // Badge Logic (Demo)
  if (score < 40) {
    if (aiskillLevel) aiskillLevel.innerText = "Beginner 🥉";
    if (badgeIcon) badgeIcon.innerText = "🥉";
    if (badgeName) badgeName.innerText = "Beginner";
    if (badgeDesc) badgeDesc.innerText = "Start small and improve daily!";
  } else if (score < 70) {
    if (aiskillLevel) aiskillLevel.innerText = "Improving Performer 🥈";
    if (badgeIcon) badgeIcon.innerText = "🥈";
    if (badgeName) badgeName.innerText = "Improving";
    if (badgeDesc) badgeDesc.innerText = "Good progress! Keep it consistent.";
  } else if (score < 90) {
    if (aiskillLevel) aiskillLevel.innerText = "Consistent Performer 🥈";
    if (badgeIcon) badgeIcon.innerText = "🥈";
    if (badgeName) badgeName.innerText = "Consistent Performer";
    if (badgeDesc) badgeDesc.innerText = "You are doing great! Stay consistent.";
  } else {
    if (aiskillLevel) aiskillLevel.innerText = "Time Master 🥇";
    if (badgeIcon) badgeIcon.innerText = "🥇";
    if (badgeName) badgeName.innerText = "Time Master";
    if (badgeDesc) badgeDesc.innerText = "Excellent! You manage time like a pro!";
  }
}

async function loadScore() {
  const email = getCurrentUserEmail();
  if (!email) return;
  try {
    const res = await fetch(`/api/scores?email=${email}`);
    const data = await res.json();
    if (data.success) {
      setScore(data.score || 76);
    }
  } catch (err) {
    console.error("Error loading score:", err);
  }
}

async function saveScore(score) {
  const email = getCurrentUserEmail();
  if (!email) return;
  try {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, score })
    });
  } catch (err) {
    console.error("Error saving score:", err);
  }
}

async function saveBadges(unlockedBadgeNames) {
  const email = getCurrentUserEmail();
  if (!email) return;
  try {
    await fetch('/api/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unlocked: unlockedBadgeNames })
    });
  } catch (err) {
    console.error("Error saving badges:", err);
  }
}

async function loadBadges() {
  const email = getCurrentUserEmail();
  if (!email) return [];
  try {
    const res = await fetch(`/api/badges?email=${email}`);
    const data = await res.json();
    return data.success ? data.badges : [];
  } catch (err) {
    console.error("Error loading badges:", err);
    return [];
  }
}

async function checkDBStatus() {
  const statusEl = document.getElementById("dbStatus");
  if (!statusEl) return;
  try {
    const res = await fetch('/api/db-status');
    const data = await res.json();
    statusEl.innerHTML = `📡 Database: <span style="color: ${data.status.includes('Online') ? '#22c55e' : '#f59e0b'}">${data.status}</span>`;
    statusEl.title = data.type;
  } catch (err) {
    statusEl.innerText = "📡 Database: Connection Error";
  }
}

// Default sync on load
setTimeout(() => {
  loadScore();
  loadBadges(); // Cache or use eventually
  checkDBStatus();
}, 200);

// Update Score button
if (updateScoreBtn) {
  updateScoreBtn.addEventListener("click", () => {
    const randomScore = Math.floor(Math.random() * 101);
    setScore(randomScore);
    saveScore(randomScore);
    showNotification(`New Skill Score: ${randomScore} - Saved to Database!`);
  });
}


/* -------------------------
   ADD TASK PAGE (Advanced Demo)
   - Saves tasks in localStorage
   - Can generate schedule based on free time
-------------------------- */
const taskForm = document.getElementById("taskForm");
const savedTaskList = document.getElementById("savedTaskList");
const freeStart = document.getElementById("freeStart");
const freeEnd = document.getElementById("freeEnd");
const makeScheduleBtn = document.getElementById("makeScheduleBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const scheduleOutput = document.getElementById("scheduleOutput");

// Specialized Sections
const physicalSection = document.getElementById("physicalSection");
const digitalSection = document.getElementById("digitalSection");
const workTypeSelect = document.getElementById("workType");

/* Sync User Profile */
function syncUserProfile() {
  const user = JSON.parse(localStorage.getItem("skilltrack_current_user"));
  const userNameEl = document.getElementById("userName");
  const userInitialsEl = document.getElementById("userInitials");
  const profileNameEl = document.getElementById("profileName");
  const userInitialsBigEl = document.getElementById("userInitialsBig");
  const userEmailEl = document.getElementById("userEmail");

  if (user && user.name) {
    const parts = user.name.split(" ");
    const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);

    if (userNameEl) userNameEl.innerText = user.name;
    if (userInitialsEl) userInitialsEl.innerText = initials;

    // Additional Profile elements (Report page)
    if (profileNameEl) profileNameEl.innerText = user.name;
    if (userInitialsBigEl) userInitialsBigEl.innerText = initials;
    if (userEmailEl) userEmailEl.innerText = `Email: ${user.email}`;
  }
}

// Default profile sync on load
document.addEventListener("DOMContentLoaded", syncUserProfile);
syncUserProfile(); // Call immediately in case DOM is already loaded

const taskTitleInput = document.getElementById("taskTitle");
if (taskTitleInput) {
  taskTitleInput.addEventListener("input", function () {
    const val = this.value.trim().toLowerCase();

    if (val.includes("daily running")) {
      if (workTypeSelect) workTypeSelect.value = "Physical";
      if (physicalSection) physicalSection.style.display = "block";
      if (digitalSection) digitalSection.style.display = "none";

      const gpsCheck = document.getElementById("gpsTracking");
      const gpsStat = document.getElementById("gpsStatus");
      const speedAn = document.getElementById("speedAnalysis");

      if (gpsCheck) gpsCheck.checked = true;
      if (gpsStat) gpsStat.innerText = "GPS Location Tracking: ACTIVE 📍";
      if (speedAn) {
        speedAn.style.display = "block";
        const speedVal = document.getElementById("speedValue");
        if (speedVal) speedVal.innerText = (Math.random() * 5 + 4).toFixed(1);
      }
    }
    else if (val.includes("code part")) {
      if (workTypeSelect) workTypeSelect.value = "Digital";
      if (digitalSection) digitalSection.style.display = "block";
      if (physicalSection) physicalSection.style.display = "none";

      const tools = document.querySelectorAll(".tool-check");
      tools.forEach(t => {
        if (t.value === "VS Code") t.checked = true;
      });
      const vscodePanel = document.getElementById("vscodePanel");
      if (vscodePanel) {
        vscodePanel.style.display = "flex";
        showNotification("VS Code Simulation Initialized 💻");
      }
    }
  });
}

if (workTypeSelect) {
  workTypeSelect.addEventListener("change", () => {
    const val = workTypeSelect.value;
    if (physicalSection) physicalSection.style.display = val === "Physical" ? "block" : "none";
    if (digitalSection) digitalSection.style.display = val === "Digital" ? "block" : "none";
  });
}

function getCurrentUserEmail() {
  const user = JSON.parse(localStorage.getItem("skilltrack_current_user"));
  return user ? user.email : null;
}

async function getTasks() {
  const email = getCurrentUserEmail();
  if (!email) return [];
  try {
    const res = await fetch(`/api/tasks?email=${email}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return [];
  }
}

async function saveTasks(task) {
  const email = getCurrentUserEmail();
  if (!email) return;
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, email })
    });
    return await res.json();
  } catch (err) {
    console.error("Error saving task:", err);
  }
}

/* Convert time */
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  let h = Math.floor(mins / 60);
  let m = mins % 60;

  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* Priority order */
function priorityValue(p) {
  if (p === "High") return 1;
  if (p === "Medium") return 2;
  return 3;
}

async function renderSavedTasks() {
  if (!savedTaskList) return;

  savedTaskList.innerHTML = "<p>Loading tasks...</p>";
  const tasks = await getTasks();

  savedTaskList.innerHTML = "";
  if (tasks.length === 0) {
    savedTaskList.innerHTML = `<p style="opacity:0.7;">No tasks saved yet.</p>`;
    return;
  }

  tasks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "task-item";

    const taskId = t._id || "";

    let workMeta = "";
    if (t.workType === "Physical") {
      workMeta = `📍 GPS: ${t.gpsEnabled ? "Enabled" : "Disabled"}`;
    } else if (t.workType === "Digital") {
      workMeta = `💻 Tools: ${t.tools ? t.tools.join(", ") : "None"}`;
    }

    div.innerHTML = `
      <div class="task-left">
        <div class="dot ${t.priority === "High" ? "orange" : t.priority === "Medium" ? "blue" : "green"}"></div>
        <div>
          <div class="task-title">${t.title} ${t.workType === "Physical" ? "📍" : t.workType === "Digital" ? "💻" : ""}</div>
          <div class="task-meta">
            ${t.date} • ${t.category} • ${t.time} mins • ${t.status}
            <br><small style="opacity:0.8;">${workMeta}</small>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
        <span class="priority">${t.priority}</span>
        ${t.workType === "Digital" ? `<button class="mini-btn launch-ide-btn" data-title="${t.title}" style="font-size:10px; padding:4px 8px;">🚀 Launch IDE</button>` : ""}
        ${t.workType === "Physical" && t.gpsEnabled ? `<button class="mini-btn" onclick="showNotification('Starting GPS Analysis...') " style="font-size:10px; padding:4px 8px;">📍 Sync GPS</button>` : ""}
      </div>
      <button class="del-btn" data-id="${taskId}">🗑️</button>
    `;

    savedTaskList.appendChild(div);
  });

  /* VS Code Toggle buttons */
  document.querySelectorAll(".launch-ide-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showNotification(`Launching VS Code Online for ${btn.getAttribute('data-title')}... 💻`);
      setTimeout(() => {
        window.open('https://vscode.dev/', '_blank');
      }, 800);
    });
  });

  const closeVSCode = document.getElementById("closeVSCode");
  if (closeVSCode) {
    closeVSCode.addEventListener("click", () => {
      const panel = document.getElementById("vscodePanel");
      if (panel) panel.style.display = "none";
    });
  }

  /* Delete buttons */
  document.querySelectorAll("#savedTaskList .del-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!id) return;
      try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        renderSavedTasks();
      } catch (err) {
        showNotification("Error deleting task", "error");
      }
    });
  });
}

/* Save task */
if (taskForm) {
  taskForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const selectedTools = [];
    document.querySelectorAll(".tool-check:checked").forEach(cb => selectedTools.push(cb.value));

    const task = {
      title: document.getElementById("taskTitle").value.trim(),
      priority: document.getElementById("taskPr").value,
      desc: document.getElementById("taskDesc").value.trim(),
      date: document.getElementById("taskDate").value,
      time: Number(document.getElementById("taskTime").value),
      category: document.getElementById("taskCat").value,
      status: document.getElementById("taskStatus").value,
      workType: document.getElementById("workType") ? document.getElementById("workType").value : "None",
      gpsEnabled: document.getElementById("gpsTracking") ? document.getElementById("gpsTracking").checked : false,
      tools: selectedTools
    };

    if (!task.title) {
      alert("Enter task title!");
      return;
    }

    await saveTasks(task);

    showNotification("Task Saved Successfully ✅");

    // External Redirect for Coding tasks
    if (task.title.toLowerCase().includes("code part")) {
      showNotification("Opening VS Code Online... 💻");
      setTimeout(() => {
        window.open('https://vscode.dev/', '_blank');
      }, 1000);
    }

    taskForm.reset();

    // Hide specialized sections
    if (typeof physicalSection !== 'undefined' && physicalSection) physicalSection.style.display = "none";
    if (typeof digitalSection !== 'undefined' && digitalSection) digitalSection.style.display = "none";

    renderSavedTasks();
  });

  renderSavedTasks();
}

/* -------------------------
   MAKE SCHEDULE (PROPER)
-------------------------- */
if (makeScheduleBtn) {
  makeScheduleBtn.addEventListener("click", async () => {

    if (!freeStart.value || !freeEnd.value) {
      scheduleOutput.innerHTML = `<p style="color:orange;">⚠️ Please enter free start and end time.</p>`;
      return;
    }

    const tasks = await getTasks();
    if (!tasks || tasks.length === 0) {
      scheduleOutput.innerHTML = `<p style="color:orange;">⚠️ Add tasks first before scheduling.</p>`;
      return;
    }

    let startMins = timeToMinutes(freeStart.value);
    let endMins = timeToMinutes(freeEnd.value);

    if (startMins >= endMins) {
      scheduleOutput.innerHTML = `<p style="color:red;">❌ End time must be greater than start time.</p>`;
      return;
    }

    scheduleOutput.innerHTML = "";

    // ✅ Break time between tasks (you can change it)
    const BREAK_MIN = 5;

    // ✅ Sort: Priority first, then smaller tasks first
    const sorted = [...tasks].sort((a, b) => {
      const p1 = priorityValue(a.priority);
      const p2 = priorityValue(b.priority);

      if (p1 !== p2) return p1 - p2;

      // if same priority: shorter time first
      return a.time - b.time;
    });

    let current = startMins;
    let scheduledCount = 0;
    let notScheduled = [];

    sorted.forEach((task) => {
      let taskStart = current;
      let taskEnd = taskStart + task.time;

      // Check if task fits
      if (taskEnd <= endMins) {
        scheduledCount++;

        const div = document.createElement("div");
        div.className = "schedule-item";

        div.innerHTML = `
          <h4>✅ ${scheduledCount}. ${task.title} (${task.priority})</h4>
          <p>
            🕒 ${minutesToTime(taskStart)} - ${minutesToTime(taskEnd)}  
            | ⏱️ ${task.time} mins  
            | 📌 ${task.category}
          </p>
        `;

        scheduleOutput.appendChild(div);

        // move time forward
        current = taskEnd + BREAK_MIN;
      } else {
        notScheduled.push(task);
      }
    });

    // ✅ If all tasks finished early
    if (scheduledCount === 0) {
      scheduleOutput.innerHTML = `<p style="color:red;">❌ Not enough free time to schedule any task.</p>`;
    }

    // ✅ Show not scheduled tasks
    if (notScheduled.length > 0) {
      const warning = document.createElement("div");
      warning.className = "schedule-item";
      warning.innerHTML = `
        <h4>⚠️ Not Scheduled Tasks</h4>
        <p style="color:orange;">
          These tasks could not fit in your free time.
        </p>
      `;

      scheduleOutput.appendChild(warning);

      notScheduled.forEach((t) => {
        const div = document.createElement("div");
        div.className = "schedule-item";
        div.innerHTML = `
          <h4>❌ ${t.title} (${t.priority})</h4>
          <p>⏱️ ${t.time} mins | 📌 ${t.category}</p>
        `;
        scheduleOutput.appendChild(div);
      });
    }

  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", async () => {
    const email = getCurrentUserEmail();
    if (!email) return;

    if (confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) {
      try {
        const res = await fetch(`/api/tasks?email=${email}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status || data.success) {
          showNotification("All tasks cleared! 🗑️");
          renderSavedTasks();
        }
      } catch (err) {
        showNotification("Error clearing tasks", "error");
      }
    }
  });
}





/* -------------------------
   TIME TRACKER PAGE
-------------------------- */
const taskSelect = document.getElementById("taskSelect");
const bigTimer = document.getElementById("bigTimer");
const timerStatus = document.getElementById("timerStatus");

const tStart = document.getElementById("tStart");
const tPause = document.getElementById("tPause");
const tStop = document.getElementById("tStop");
const tReset = document.getElementById("tReset");

const sessionList = document.getElementById("sessionList");
const clearSessions = document.getElementById("clearSessions");
const todayFocus = document.getElementById("todayFocus");

let tInterval = null;
let tSeconds = 0;
let running = false;

function formatTime2(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateTimer() {
  if (bigTimer) bigTimer.innerText = formatTime2(tSeconds);
}

async function loadTasksIntoDropdown() {
  if (!taskSelect) return;

  const tasks = await getTasks();
  taskSelect.innerHTML = `<option value="">-- Choose a task --</option>`;

  tasks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.title;
    opt.innerText = `${t.title} (${t.priority})`;
    taskSelect.appendChild(opt);
  });
}

async function renderSessions() {
  if (!sessionList) return;

  const email = getCurrentUserEmail();
  if (!email) return;

  sessionList.innerHTML = "<p>Loading sessions...</p>";
  try {
    const res = await fetch(`/api/sessions?email=${email}`);
    const sessions = await res.json();

    sessionList.innerHTML = "";
    if (sessions.length === 0) {
      sessionList.innerHTML = `<p style="opacity:0.7;">No sessions yet. Start focusing!</p>`;
      return;
    }

    sessions.forEach((s) => {
      const div = document.createElement("div");
      div.className = "session-item";
      div.innerHTML = `
        <h4>📌 ${s.task}</h4>
        <p>
          ⏳ Duration: <b>${s.duration}</b><br>
          📅 Date: ${s.date}<br>
          🕒 Time: ${s.time}
        </p>
      `;
      sessionList.appendChild(div);
    });
  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}

async function updateTodayFocus() {
  if (!todayFocus) return;

  const email = getCurrentUserEmail();
  if (!email) return;

  try {
    const res = await fetch(`/api/sessions?email=${email}`);
    const sessions = await res.json();
    const today = new Date().toISOString().split("T")[0];

    let total = 0;
    sessions.forEach((s) => {
      if (s.rawDate === today) {
        total += s.minutes;
      }
    });

    todayFocus.innerText = total + " mins";
  } catch (err) {
    console.error("Error updating focus:", err);
  }
}

async function saveSession() {
  const taskName = taskSelect.value;
  const email = getCurrentUserEmail();

  if (!taskName) {
    alert("Please select a task first!");
    return false;
  }

  if (!email) {
    alert("Please sign in first!");
    return false;
  }

  if (tSeconds < 10) {
    alert("Session too short! Focus at least 10 seconds 😄");
    return false;
  }

  const now = new Date();
  const session = {
    email,
    task: taskName,
    duration: formatTime2(tSeconds),
    minutes: Math.ceil(tSeconds / 60),
    date: now.toDateString(),
    time: now.toLocaleTimeString(),
    rawDate: now.toISOString().split("T")[0],
  };

  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    return true;
  } catch (err) {
    console.error("Error saving session:", err);
    return false;
  }
}

/* Timer Buttons */
if (tStart) {
  tStart.addEventListener("click", () => {
    if (!taskSelect.value) {
      alert("Select a task first!");
      return;
    }

    if (running) return;

    running = true;
    timerStatus.innerText = "Status: Running ✅";

    tInterval = setInterval(() => {
      tSeconds++;
      updateTimer();
    }, 1000);
  });
}

if (tPause) {
  tPause.addEventListener("click", () => {
    if (!running) return;
    running = false;

    clearInterval(tInterval);
    tInterval = null;
    timerStatus.innerText = "Status: Paused ⏸️";
  });
}

if (tStop) {
  tStop.addEventListener("click", async () => {
    if (!running && tSeconds === 0) return;

    clearInterval(tInterval);
    tInterval = null;
    running = false;

    const ok = await saveSession();
    if (ok) {
      timerStatus.innerText = "Status: Saved ✅";
      renderSessions();
      updateTodayFocus();
    }

    tSeconds = 0;
    updateTimer();
  });
}

if (tReset) {
  tReset.addEventListener("click", () => {
    clearInterval(tInterval);
    tInterval = null;
    running = false;

    tSeconds = 0;
    updateTimer();
    if (timerStatus) timerStatus.innerText = "Status: Ready";
  });
}

/* Clear sessions */
if (clearSessions) {
  clearSessions.addEventListener("click", async () => {
    const email = getCurrentUserEmail();
    if (!email) return;
    try {
      await fetch(`/api/sessions?email=${email}`, { method: 'DELETE' });
      renderSessions();
      updateTodayFocus();
    } catch (err) {
      console.error("Error clearing sessions:", err);
    }
  });
}

/* On load */
if (taskSelect) {
  loadTasksIntoDropdown();
  renderSessions();
  updateTodayFocus();
  updateTimer();
}


/* -------------------------
   SKILL PREDICTION PAGE
   (UI-only demo logic)
-------------------------- */
const predictForm = document.getElementById("predictForm");
const scoreValue = document.getElementById("scoreValue");
const skillLevel = document.getElementById("skillLevel");
const skillDesc = document.getElementById("skillDesc");
const progFill = document.getElementById("progFill");
const progText = document.getElementById("progText");

function getLevel(score) {
  if (score >= 85) return "🔥 Excellent Time Manager";
  if (score >= 70) return "✅ Good & Consistent";
  if (score >= 50) return "🙂 Average (Needs Improvement)";
  return "⚠️ Poor (Start Tracking Daily)";
}

function getTips(score) {
  if (score >= 85) return "You are doing amazing! Maintain the streak and avoid burnout.";
  if (score >= 70) return "Good progress. Increase daily focus minutes and reduce distractions.";
  if (score >= 50) return "Try breaking tasks into small chunks + use the timer daily.";
  return "Start with 2 tasks/day + focus sessions. Consistency will improve score.";
}

if (predictForm) {
  predictForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const comp = Number(document.getElementById("comp").value);
    const focus = Number(document.getElementById("focus").value);
    const sessions = Number(document.getElementById("sessions").value);
    const streak = Number(document.getElementById("streak").value);

    // Demo scoring formula (frontend only)
    let score =
      comp * 0.4 +
      Math.min(focus / 10, 30) +
      Math.min(sessions * 2, 20) +
      Math.min(streak * 2, 10);

    score = Math.round(Math.min(score, 100));

    scoreValue.innerText = score;
    skillLevel.innerText = getLevel(score);
    skillDesc.innerText = getTips(score);

    progFill.style.width = score + "%";
    progText.innerText = score + "%";
  });
}


/* -------------------------
   DIGITAL BADGES PAGE
-------------------------- */
const badgeGrid = document.getElementById("badgeGrid");
const latestScore = document.getElementById("latestScore");

const badgeModal = document.getElementById("badgeModal");
const closeModal = document.getElementById("closeModal");
const mTitle = document.getElementById("mTitle");
const mDesc = document.getElementById("mDesc");

// Demo badge rules
const badges = [
  {
    name: "Starter",
    icon: "🌱",
    rule: "Unlock when score ≥ 40",
    minScore: 40,
    desc: "You started tracking your time and building habits. Great first step!",
  },
  {
    name: "Consistent",
    icon: "🔥",
    rule: "Unlock when score ≥ 60",
    minScore: 60,
    desc: "You are consistent and completing tasks regularly. Keep it going!",
  },
  {
    name: "Time Master",
    icon: "⏱️",
    rule: "Unlock when score ≥ 75",
    minScore: 75,
    desc: "You manage time well and stay focused for longer sessions.",
  },
  {
    name: "Elite Planner",
    icon: "📅",
    rule: "Unlock when score ≥ 85",
    minScore: 85,
    desc: "You plan ahead and execute tasks with discipline like a pro.",
  },
  {
    name: "Legend",
    icon: "🏆",
    rule: "Unlock when score ≥ 95",
    minScore: 95,
    desc: "Top level performance! You are among the best time managers.",
  },
  {
    name: "Daily Streak",
    icon: "📌",
    rule: "Unlock when score ≥ 70",
    minScore: 70,
    desc: "You maintain streak and daily focus habits. Strong discipline!",
  },
  {
    name: "Deep Focus",
    icon: "🧠",
    rule: "Unlock when score ≥ 80",
    minScore: 80,
    desc: "You can focus deeply and avoid distractions. Amazing work!",
  },
  {
    name: "Balanced",
    icon: "⚖️",
    rule: "Unlock when score ≥ 65",
    minScore: 65,
    desc: "You balance tasks and time efficiently without stress overload.",
  },
  {
    name: "Runner",
    icon: "🏃‍♂️",
    rule: "Complete 'Daily Running' task",
    isTask: true,
    titleMatch: "daily running",
    desc: "You completed a physical running goal! Great for cardiovascular health.",
  },
  {
    name: "Coder",
    icon: "💻",
    rule: "Complete 'Code Part' task",
    isTask: true,
    titleMatch: "code part",
    desc: "You successfully completed a coding session. Technical expertise rising!",
  },
  {
    name: "Milestone",
    icon: "🏁",
    rule: "Complete 5 total tasks",
    isCount: true,
    count: 5,
    desc: "You have finished 5 tasks! Building a strong habit of completion.",
  },
];

function getSavedScore() {
  const saved = localStorage.getItem("skilltrack_latest_score");
  return saved ? Number(saved) : 55;
}

async function renderBadges() {
  if (!badgeGrid) return;

  const score = getSavedScore();
  if (latestScore) latestScore.innerText = score;

  const tasks = await getTasks();
  const completedTasks = tasks.filter(t => t.status === "Completed");

  badgeGrid.innerHTML = "";
  const unlockedNames = [];

  badges.forEach((b) => {
    let unlocked = false;

    if (b.minScore !== undefined) {
      unlocked = score >= b.minScore;
    } else if (b.isTask) {
      unlocked = completedTasks.some(t => t.title.toLowerCase().includes(b.titleMatch));
    } else if (b.isCount) {
      unlocked = completedTasks.length >= b.count;
    }

    if (unlocked) unlockedNames.push(b.name);

    const div = document.createElement("div");
    div.className = `badge-card ${unlocked ? "unlocked" : "locked"}`;

    div.innerHTML = `
      <div class="badge-top">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-lock">${unlocked ? "✅" : "🔒"}</div>
      </div>

      <div class="badge-name">${b.name}</div>
      <div class="badge-rule">${b.rule}</div>
    `;

    div.addEventListener("click", () => {
      openBadgeModal(b, unlocked);
    });

    badgeGrid.appendChild(div);
  });

  // Sync unlocked badges to DB
  if (unlockedNames.length > 0) {
    saveBadges(unlockedNames);
  }
}

function openBadgeModal(badge, unlocked) {
  if (!badgeModal) return;

  mTitle.innerText = `${badge.icon} ${badge.name}`;
  mDesc.innerText = unlocked
    ? badge.desc
    : `Locked! ${badge.rule}. Improve your score to unlock this badge.`;

  badgeModal.classList.add("show");
}

if (closeModal) {
  closeModal.addEventListener("click", () => {
    badgeModal.classList.remove("show");
  });
}

if (badgeModal) {
  badgeModal.addEventListener("click", (e) => {
    if (e.target === badgeModal) {
      badgeModal.classList.remove("show");
    }
  });
}

/* On load */
if (badgeGrid) {
  renderBadges();
}


/* -------------------------
   WEEKLY REPORT PAGE
-------------------------- */
const reportScore = document.getElementById("reportScore");
const miniFocus = document.getElementById("miniFocus");
const miniSessions = document.getElementById("miniSessions");
const miniTasks = document.getElementById("miniTasks");

const weekFocus = document.getElementById("weekFocus");
const weekSessions = document.getElementById("weekSessions");
const weekCompletion = document.getElementById("weekCompletion");

const badgeText = document.getElementById("badgeText");
const barChart = document.getElementById("barChart");
const taskTableBody = document.getElementById("taskTableBody");

function getLatestScoreReport() {
  const saved = localStorage.getItem("skilltrack_latest_score");
  return saved ? Number(saved) : 55;
}

async function getSessions() {
  const email = getCurrentUserEmail();
  if (!email) return [];
  try {
    const res = await fetch(`/api/sessions?email=${email}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return [];
  }
}

async function calcWeeklyData() {
  const sessions = await getSessions();
  const tasks = await getTasks();

  let totalFocus = 0;
  let totalSessions = sessions.length;

  sessions.forEach((s) => {
    totalFocus += s.minutes || 0;
  });

  // completion % from tasks
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const completion = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return {
    totalFocus,
    totalSessions,
    totalTasks: tasks.length,
    completion,
    tasks,
    sessions,
  };
}

function getBadgeFromScore(score) {
  if (score >= 95) return "🏆 Legend";
  if (score >= 85) return "📅 Elite Planner";
  if (score >= 75) return "⏱️ Time Master";
  if (score >= 60) return "🔥 Consistent";
  if (score >= 40) return "🌱 Starter";
  return "🔒 Not yet unlocked";
}

function renderBars(sessions) {
  if (!barChart) return;

  // Demo daily minutes (Mon-Sun)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const mins = [0, 0, 0, 0, 0, 0, 0];

  // distribute sessions randomly by demo
  // (Later you can calculate real day by date)
  sessions.forEach((s, i) => {
    mins[i % 7] += s.minutes || 0;
  });

  const max = Math.max(...mins, 1);
  barChart.innerHTML = "";

  mins.forEach((m, idx) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = (m / max) * 100 + "%";
    bar.innerHTML = `<span>${days[idx]}</span>`;
    barChart.appendChild(bar);
  });
}

function renderTaskTable(tasks) {
  if (!taskTableBody) return;

  taskTableBody.innerHTML = "";

  if (tasks.length === 0) {
    taskTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="opacity:0.7;">No tasks added yet.</td>
      </tr>
    `;
    return;
  }

  tasks.slice(0, 8).forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.title}</td>
      <td>${t.date}</td>
      <td>${t.priority}</td>
      <td>${t.status}</td>
    `;
    taskTableBody.appendChild(tr);
  });
}

/* On load */
if (reportScore) {
  (async () => {
    const score = getLatestScoreReport();
    reportScore.innerText = score;

    const data = await calcWeeklyData();

    // Mini stats
    miniFocus.innerText = data.totalFocus;
    miniSessions.innerText = data.totalSessions;
    miniTasks.innerText = data.totalTasks;

    // Summary
    weekFocus.innerText = data.totalFocus;
    weekSessions.innerText = data.totalSessions;
    weekCompletion.innerText = data.completion + "%";

    badgeText.innerText = getBadgeFromScore(score);

    renderBars(data.sessions);
    renderTaskTable(data.tasks);
  })();
}



/* Logout Logic */
document.querySelectorAll("#logoutLink").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("skilltrack_current_user");
    showNotification("Logging out... 🚪");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  });
});
