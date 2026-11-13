const defaultEvents = [
  { id: "hack-night", title: "Hack Night: Build for Good", category: "Technology", date: "2026-11-20", time: "6:00 PM", venue: "Innovation Lab", capacity: 80 },
  { id: "open-mic", title: "Open Mic Under the Stars", category: "Culture", date: "2026-11-22", time: "7:30 PM", venue: "Amphitheatre", capacity: 120 },
  { id: "career-clinic", title: "Career Clinic: Make Your Mark", category: "Career", date: "2026-11-26", time: "4:00 PM", venue: "Seminar Hall 2", capacity: 45 },
  { id: "campus-run", title: "The 5K Campus Run", category: "Sports", date: "2026-11-29", time: "6:30 AM", venue: "Main Gate", capacity: 100 },
  { id: "ai-lab", title: "AI Lab: Your First Model", category: "Technology", date: "2026-12-03", time: "5:00 PM", venue: "Computer Block", capacity: 35 },
  { id: "film-club", title: "Film Club: Stories That Stay", category: "Culture", date: "2026-12-06", time: "6:00 PM", venue: "Mini Auditorium", capacity: 70 }
];

const eventKey = "campusconnect-events";
const registrationKey = "campusconnect-registrations";
const getStored = (key, fallback) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
let events = getStored(eventKey, defaultEvents);
let registrations = getStored(registrationKey, []);
let selectedEventId = null;

const eventGrid = document.querySelector("#event-grid");
const registrationList = document.querySelector("#registration-list");
const dialog = document.querySelector("#registration-dialog");
const toast = document.querySelector("#toast");

function saveData() {
  localStorage.setItem(eventKey, JSON.stringify(events));
  localStorage.setItem(registrationKey, JSON.stringify(registrations));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return { day: date.getDate(), month: date.toLocaleDateString("en-US", { month: "short" }) };
}

function getEventRegistrations(eventId) {
  return registrations.filter((registration) => registration.eventId === eventId);
}

function renderEvents() {
  const search = document.querySelector("#search-input").value.toLowerCase().trim();
  const category = document.querySelector("#category-filter").value;
  const filteredEvents = events.filter((event) => {
    const matchesSearch = `${event.title} ${event.venue} ${event.category}`.toLowerCase().includes(search);
    return matchesSearch && (category === "all" || event.category === category);
  });

  eventGrid.innerHTML = filteredEvents.map((event) => {
    const date = formatDate(event.date);
    const taken = getEventRegistrations(event.id).length;
    const remaining = Math.max(0, event.capacity - taken);
    return `<article class="event-card">
      <div class="event-date"><strong>${date.day}</strong>${date.month}</div>
      <p class="event-category">${event.category}</p>
      <h3>${event.title}</h3>
      <p class="event-details">${event.time} &middot; ${event.venue}</p>
      <div class="event-footer">
        <span class="seats">${remaining} seat${remaining === 1 ? "" : "s"} left</span>
        <button class="register-button" data-register="${event.id}" ${remaining === 0 ? "disabled" : ""}>${remaining === 0 ? "Full" : "Register"}</button>
      </div>
    </article>`;
  }).join("");
  document.querySelector("#empty-state").hidden = filteredEvents.length > 0;
}

function renderRegistrations() {
  document.querySelector("#registration-count").textContent = registrations.length;
  document.querySelector("#registration-summary").textContent = registrations.length ? `${registrations.length} saved event${registrations.length === 1 ? "" : "s"}` : "No registrations yet";
  registrationList.innerHTML = registrations.length ? registrations.map((registration) => {
    const event = events.find((item) => item.id === registration.eventId);
    if (!event) return "";
    const date = formatDate(event.date);
    return `<article class="registration-item"><div><h3>${event.title}</h3><p>${date.month} ${date.day} &middot; ${event.time} &middot; Registered as ${registration.name}</p></div><div class="registration-actions"><button class="print-button" data-print="${event.id}" type="button">Print slip</button><button class="cancel-button" data-cancel="${event.id}" type="button">Cancel</button></div></article>`;
  }).join("") : `<p class="empty-state">Your confirmed events will appear here.</p>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function openRegistration(eventId) {
  const event = events.find((item) => item.id === eventId);
  if (!event || getEventRegistrations(eventId).length >= event.capacity) return;
  selectedEventId = eventId;
  const date = formatDate(event.date);
  document.querySelector("#dialog-title").textContent = event.title;
  document.querySelector("#dialog-meta").textContent = `${date.month} ${date.day} at ${event.time} in ${event.venue}`;
  document.querySelector("[name=eventId]").value = eventId;
  dialog.showModal();
}

document.addEventListener("click", (event) => {
  const registerId = event.target.dataset.register;
  const cancelId = event.target.dataset.cancel;
  if (registerId) openRegistration(registerId);
  if (event.target.dataset.print) printRegistration(event.target.dataset.print);
  if (cancelId) {
    registrations = registrations.filter((registration) => registration.eventId !== cancelId);
    saveData();
    renderEvents();
    renderRegistrations();
    showToast("Registration cancelled.");
  }
});

function printRegistration(eventId) {
  const registration = registrations.find((item) => item.eventId === eventId);
  const event = events.find((item) => item.id === eventId);
  if (!registration || !event) return;
  const date = formatDate(event.date);
  const printWindow = window.open("", "_blank", "width=700,height=700");
  if (!printWindow) {
    showToast("Allow pop-ups to print your confirmation slip.");
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><title>CampusConnect confirmation</title><style>body{font-family:Arial,sans-serif;padding:48px;color:#172126}h1{font-size:28px}p{line-height:1.6}.slip{max-width:560px;border:2px solid #e85d45;padding:32px}strong{color:#b94532}</style></head><body><main class="slip"><p><strong>CAMPUSCONNECT</strong></p><h1>Registration confirmed</h1><p><strong>Event:</strong> ${event.title}</p><p><strong>Attendee:</strong> ${registration.name}</p><p><strong>Date:</strong> ${date.month} ${date.day}, ${event.date.slice(0, 4)}</p><p><strong>Time:</strong> ${event.time}</p><p><strong>Venue:</strong> ${event.venue}</p><p>Keep this slip for your campus event check-in.</p></main><script>window.print();</script></body></html>`);
  printWindow.document.close();
}

document.querySelector("#registration-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const eventId = form.get("eventId");
  if (registrations.some((registration) => registration.eventId === eventId && registration.email === form.get("email"))) {
    showToast("You are already registered for this event.");
    return;
  }
  registrations.push({ eventId, name: form.get("name"), email: form.get("email") });
  saveData();
  renderEvents();
  renderRegistrations();
  event.currentTarget.reset();
  dialog.close();
  showToast("Registration confirmed. See you there!");
});

document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#search-input").addEventListener("input", renderEvents);
document.querySelector("#category-filter").addEventListener("change", renderEvents);
document.querySelector("#menu-toggle").addEventListener("click", () => document.querySelector(".main-nav").classList.toggle("open"));
document.querySelector("#organizer-toggle").addEventListener("click", () => {
  const panel = document.querySelector("#organizer-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) panel.scrollIntoView({ behavior: "smooth" });
});
document.querySelector("#reset-events").addEventListener("click", () => {
  events = [...defaultEvents];
  saveData();
  renderEvents();
  showToast("Sample events restored.");
});
document.querySelector("#event-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  events.push({ id: `event-${Date.now()}`, title: form.get("title"), category: form.get("category"), date: form.get("date"), time: form.get("time"), venue: form.get("venue"), capacity: Number(form.get("capacity")) });
  saveData();
  renderEvents();
  event.currentTarget.reset();
  showToast("New event added to the calendar.");
});

renderEvents();
renderRegistrations();
