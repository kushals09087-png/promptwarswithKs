"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownUp, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  ChevronDown, Clock3, Cpu, FlaskConical, Gauge, LayoutDashboard, Lightbulb,
  MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users, X,
  Zap, Menu, CircleHelp, Package, Microscope, Monitor, Plus, Filter
} from "lucide-react";

type Resource = {
  id: number; name: string; category: "Instrument" | "Dev kit" | "Workstation";
  department: string; location: string; status: "Available" | "Limited" | "In use";
  next: string; description: string; specs: string[]; icon: "scope" | "kit" | "gpu" | "printer";
  color: string; bookings: number;
};

const resources: Resource[] = [
  { id: 1, name: "Digital Oscilloscope", category: "Instrument", department: "Electronics & Communication", location: "Block A · Lab 204", status: "Available", next: "Available now", description: "4-channel, 100 MHz digital oscilloscope for signal analysis and circuit debugging.", specs: ["100 MHz bandwidth", "4 channels", "1 GSa/s"], icon: "scope", color: "violet", bookings: 18 },
  { id: 2, name: "NVIDIA GPU Workstation", category: "Workstation", department: "Computer Science", location: "Block C · AI Lab", status: "Limited", next: "Next slot · 2:30 PM", description: "High-performance workstation for deep learning, simulation and GPU-intensive workloads.", specs: ["RTX  A5000", "64 GB RAM", "CUDA enabled"], icon: "gpu", color: "blue", bookings: 31 },
  { id: 3, name: "Raspberry Pi 5 Kit", category: "Dev kit", department: "Computer Science", location: "Block C · IoT Lab", status: "Available", next: "Available now", description: "Complete single-board computer kit for embedded systems and IoT prototyping.", specs: ["8 GB RAM", "GPIO kit", "Camera module"], icon: "kit", color: "orange", bookings: 12 },
  { id: 4, name: "Creality 3D Printer", category: "Instrument", department: "Mechanical Engineering", location: "Block B · Fab Lab", status: "In use", next: "Next slot · Tomorrow, 10 AM", description: "FDM 3D printer for rapid prototyping, enclosure design and mechanical components.", specs: ["220 × 220 × 250 mm", "PLA / PETG", "0.1 mm layer"], icon: "printer", color: "green", bookings: 24 },
  { id: 5, name: "ESP32 Development Kit", category: "Dev kit", department: "Electrical Engineering", location: "Block A · Embedded Lab", status: "Available", next: "Available now", description: "Wi-Fi and Bluetooth enabled microcontroller board for connected-device prototypes.", specs: ["Wi-Fi + BLE", "Dual-core", "Sensor bundle"], icon: "kit", color: "orange", bookings: 9 },
  { id: 6, name: "Spectrum Analyzer", category: "Instrument", department: "Electronics & Communication", location: "Block A · RF Lab", status: "Limited", next: "Next slot · 4:00 PM", description: "RF spectrum analysis instrument for wireless communication and signal testing.", specs: ["9 kHz–3 GHz", "Tracking generator", "USB export"], icon: "scope", color: "violet", bookings: 15 },
];

const iconFor = (type: Resource["icon"]) => {
  if (type === "gpu") return Monitor;
  if (type === "kit") return Cpu;
  if (type === "printer") return Package;
  return Activity;
};

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All resources");
  const [department, setDepartment] = useState("All departments");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const filtered = useMemo(() => resources.filter((r) => {
    const matchesQuery = `${r.name} ${r.department} ${r.description} ${r.specs.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All resources" || r.category === category;
    const matchesDepartment = department === "All departments" || r.department === department;
    return matchesQuery && matchesCategory && matchesDepartment;
  }), [query, category, department]);

  const openBooking = (resource: Resource) => { setSelected(resource); setBooked(false); setShowBooking(true); };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-symbol"><FlaskConical size={21} strokeWidth={2.3} /></div>
          <div><strong>LabLink<span>NEXUS</span></strong><small>Campus resource network</small></div>
          <button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Explore resources", icon: Search },
            { label: "My projects", icon: Lightbulb },
            { label: "My bookings", icon: CalendarDays },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "nav-active" : ""}`} onClick={() => { setActiveNav(label); setMobileMenu(false); }}>
              <Icon size={18}/><span>{label}</span>{label === "My bookings" && <b className="nav-count">2</b>}
            </button>
          ))}
        </nav>
        <div className="workspace-label tools-label">MANAGEMENT</div>
        <nav className="side-nav" aria-label="Management navigation">
          <button className={`nav-item ${activeNav === "Faculty approvals" ? "nav-active" : ""}`} onClick={() => setActiveNav("Faculty approvals")}><ShieldCheck size={18}/><span>Faculty approvals</span><i className="notification-dot"/></button>
          <button className={`nav-item ${activeNav === "Utilisation" ? "nav-active" : ""}`} onClick={() => setActiveNav("Utilisation")}><Gauge size={18}/><span>Utilisation</span></button>
        </nav>
        <div className="sidebar-spacer"/>
        <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore the quick guide to getting started with LabLink.</p><button onClick={() => setActiveNav("Help centre")}>View quick guide <ArrowRight size={14}/></button></div>
        <div className="sidebar-profile">
          <div className="avatar">AK</div><div className="profile-copy"><strong>Alex Kumar</strong><small>Student · Demo workspace</small></div><ChevronDown size={16} className="profile-chevron"/>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div></div>
          <div className="topbar-actions"><div className="campus-status"><span/> Campus network active</div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">AK</div></div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line"/> MONDAY, 23 NOVEMBER 2026</div><h1>Good morning, Alex <span className="wave">✳</span></h1><p className="welcome-subtitle">Your campus labs, connected. Discover equipment, move projects forward.</p></div>
            <button className="primary-button" onClick={() => { setActiveNav("Explore resources"); document.getElementById("resource-library")?.scrollIntoView({ behavior: "smooth" }); }}><Plus size={17}/> Find equipment <ArrowRight size={15}/></button>
          </section>

          <section className="hero-banner">
            <div className="hero-copy">
              <div className="hero-kicker"><Sparkles size={14}/> INTELLIGENT RESOURCE SHARING</div>
              <h2>Big ideas need the<br/><em>right tools.</em></h2>
              <p>Access specialised equipment across every department. LabLink finds the right resource, the right time, and a fair way to get you there.</p>
              <button className="hero-button" onClick={() => document.getElementById("resource-library")?.scrollIntoView({ behavior: "smooth" })}>Explore the network <ArrowRight size={16}/></button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
              <div className="hero-core"><FlaskConical size={52} strokeWidth={1.2}/><span>LAB<br/>LINK</span></div>
              <div className="floating-chip chip-one"><Cpu size={16}/> Dev kits</div>
              <div className="floating-chip chip-two"><Activity size={16}/> Instruments</div>
              <div className="floating-chip chip-three"><Monitor size={16}/> Workstations</div>
              <div className="spark spark-a">✦</div><div className="spark spark-b">✧</div>
            </div>
            <div className="hero-index">01 <span>/</span> 03</div>
          </section>

          <section className="metrics-grid" aria-label="Campus resource metrics">
            <article className="metric-card"><div className="metric-top"><span>Resources listed</span><span className="metric-icon purple"><Package size={17}/></span></div><div className="metric-value">248 <small>units</small></div><div className="metric-foot"><span className="trend-up">↑ 12%</span> <span>across 8 departments</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Available now</span><span className="metric-icon mint"><CheckCircle2 size={17}/></span></div><div className="metric-value">86 <small>units</small></div><div className="metric-foot"><span className="status-dot green-dot"/> Ready to reserve</div></article>
            <article className="metric-card"><div className="metric-top"><span>Active bookings</span><span className="metric-icon blue"><CalendarDays size={17}/></span></div><div className="metric-value">34 <small>today</small></div><div className="metric-foot"><span className="trend-up">↑ 8%</span> <span>vs. last week</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Campus utilisation</span><span className="metric-icon amber"><Gauge size={17}/></span></div><div className="metric-value">72<small>%</small></div><div className="metric-progress"><span style={{width:"72%"}}/></div><div className="metric-foot">Healthy resource activity</div></article>
          </section>

          <section className="section-block" id="resource-library">
            <div className="section-heading"><div><div className="section-eyebrow">DISCOVER WHAT'S POSSIBLE</div><h2>Explore resources</h2><p>Find the specialised tools your next breakthrough needs.</p></div><button className="text-button" onClick={() => { setCategory("All resources"); setDepartment("All departments"); setQuery(""); }}>View all resources <ArrowRight size={15}/></button></div>
            <div className="search-toolbar">
              <div className="search-box"><Search size={18}/><input aria-label="Search equipment" placeholder="Search equipment, specs, or departments..." value={query} onChange={(e) => setQuery(e.target.value)}/><kbd>⌘ K</kbd></div>
              <div className="filter-wrap"><SlidersHorizontal size={16}/><select aria-label="Filter by resource type" value={category} onChange={(e) => setCategory(e.target.value)}><option>All resources</option><option>Instrument</option><option>Dev kit</option><option>Workstation</option></select><select aria-label="Filter by department" value={department} onChange={(e) => setDepartment(e.target.value)}><option>All departments</option>{Array.from(new Set(resources.map(r => r.department))).map(d => <option key={d}>{d}</option>)}</select></div>
            </div>
            <div className="resource-grid">
              {filtered.map((resource) => {
                const Icon = iconFor(resource.icon);
                return <article className="resource-card" key={resource.id}>
                  <div className={`resource-visual ${resource.color}`}><div className="resource-visual-grid"/><div className="resource-icon"><Icon size={34} strokeWidth={1.45}/></div><span className={`availability-pill ${resource.status === "Available" ? "available" : resource.status === "Limited" ? "limited" : "busy"}`}><i/>{resource.status}</span><span className="resource-id">LL / 0{resource.id}</span></div>
                  <div className="resource-body"><div className="resource-type">{resource.category.toUpperCase()} <span>·</span> {resource.department}</div><h3>{resource.name}</h3><p className="resource-description">{resource.description}</p><div className="spec-list">{resource.specs.map(spec => <span key={spec}>{spec}</span>)}</div><div className="resource-meta"><span><MapPin size={13}/>{resource.location}</span><span><Clock3 size={13}/>{resource.next}</span></div><div className="resource-actions"><button className="details-button" onClick={() => setSelected(resource)}>Details</button><button className="reserve-button" onClick={() => openBooking(resource)} disabled={resource.status === "In use"}>{resource.status === "In use" ? "Unavailable" : "Request access"} <ArrowRight size={14}/></button></div></div>
                </article>;
              })}
              {filtered.length === 0 && <div className="empty-state"><Search size={26}/><strong>No matching resources</strong><span>Try a different search term or adjust your filters.</span></div>}
            </div>
          </section>

          <section className="lower-grid">
            <article className="ai-card">
              <div className="ai-card-top"><div className="ai-symbol"><Sparkles size={19}/></div><span className="ai-label">LABLINK AI ASSISTANT</span><span className="beta-pill">BETA</span></div>
              <h2>Tell us what you're<br/>working on.</h2><p>Describe your project in plain language. Get matched with the right equipment across campus.</p>
              <div className="ai-input-wrap"><input value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiResult(false); }} placeholder="e.g. I'm building an IoT weather station..." aria-label="Describe your project"/><button aria-label="Get AI recommendations" onClick={() => setAiResult(true)} disabled={!aiPrompt.trim()}><ArrowRight size={17}/></button></div>
              {aiResult && <div className="ai-result"><CheckCircle2 size={16}/><div><strong>3 resources matched</strong><span>Raspberry Pi 5 Kit · ESP32 Kit · GPU Workstation</span></div></div>}
              <div className="ai-foot"><span><span className="online-pulse"/> Gemini-powered discovery</span><span>Suggestions are verified against the catalogue</span></div>
            </article>
            <article className="activity-card">
              <div className="activity-heading"><div><div className="section-eyebrow">CAMPUS PULSE</div><h2>Recent activity</h2></div><button className="icon-button" aria-label="Activity options"><ArrowDownUp size={16}/></button></div>
              <div className="activity-list">
                <div className="activity-item"><div className="activity-avatar activity-purple"><Check size={15}/></div><div><strong>Booking approved</strong><p>GPU Workstation · AI Lab</p><small>For Priya Sharma's ML project</small></div><time>2m ago</time></div>
                <div className="activity-item"><div className="activity-avatar activity-blue"><Package size={15}/></div><div><strong>New resource added</strong><p>FPGA Development Board</p><small>Electronics & Communication</small></div><time>18m ago</time></div>
                <div className="activity-item"><div className="activity-avatar activity-orange"><Users size={15}/></div><div><strong>Cross-department share</strong><p>3D Printer · Mechanical → Design</p><small>Alternative slot accepted</small></div><time>1h ago</time></div>
              </div>
              <button className="activity-link" onClick={() => setActiveNav("My bookings")}>See all activity <ArrowRight size={14}/></button>
            </article>
          </section>

          <footer className="footer"><div className="footer-brand"><FlaskConical size={15}/> LabLink Nexus</div><span>Making every lab resource accessible to every innovator.</span><span>Built for a smarter campus <span className="footer-heart">✦</span></span></footer>
        </div>
      </section>

      {selected && !showBooking && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="resource-modal-title" onClick={(e) => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={19}/></button><div className={`modal-resource-icon ${selected.color}`}>{(() => { const Icon = iconFor(selected.icon); return <Icon size={32}/>; })()}</div><div className="resource-type">{selected.category.toUpperCase()} · {selected.department}</div><h2 id="resource-modal-title">{selected.name}</h2><p>{selected.description}</p><div className="modal-specs">{selected.specs.map(s => <span key={s}>{s}</span>)}</div><div className="modal-info"><span><MapPin size={15}/>{selected.location}</span><span><Clock3 size={15}/>{selected.next}</span></div><button className="primary-button modal-primary" onClick={() => { if (selected.status !== "In use") setShowBooking(true); }} disabled={selected.status === "In use"}>Request this resource <ArrowRight size={16}/></button></section></div>}

      {showBooking && selected && <div className="modal-backdrop" role="presentation" onClick={() => setShowBooking(false)}><section className="modal-card booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" onClick={(e) => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowBooking(false)} aria-label="Close"><X size={19}/></button>{booked ? <div className="booking-success"><div><CheckCircle2 size={34}/></div><h2>Request submitted!</h2><p>Your request for <strong>{selected.name}</strong> has been added to the demo approval queue.</p><span className="request-reference">REQUEST · LL-2026-0142</span><button className="primary-button" onClick={() => setShowBooking(false)}>Back to workspace <ArrowRight size={16}/></button></div> : <><div className="section-eyebrow">NEW RESOURCE REQUEST</div><h2 id="booking-title">Request equipment</h2><p className="modal-intro">Choose a project and preferred slot. Faculty will review your request.</p><div className="selected-resource"><div className={`selected-resource-icon ${selected.color}`}>{(() => { const Icon = iconFor(selected.icon); return <Icon size={21}/>; })()}</div><div><strong>{selected.name}</strong><span>{selected.department} · {selected.location}</span></div></div><label className="field-label">Project <select defaultValue="IoT Smart Agriculture System"><option>IoT Smart Agriculture System</option><option>Autonomous Robotics Project</option><option>AI-Based Traffic Analysis</option></select></label><div className="field-row"><label className="field-label">Preferred date<input type="date" defaultValue="2026-11-25"/></label><label className="field-label">Start time<select defaultValue="10:00 AM"><option>10:00 AM</option><option>11:00 AM</option><option>02:00 PM</option><option>03:00 PM</option></select></label></div><label className="field-label">Duration<select defaultValue="2 hours"><option>1 hour</option><option>2 hours</option><option>3 hours</option><option>4 hours</option></select></label><div className="booking-note"><ShieldCheck size={16}/><span>Demo mode: this request is simulated. No account or login is required.</span></div><button className="primary-button modal-primary" onClick={() => setBooked(true)}>Submit booking request <ArrowRight size={16}/></button></>}</section></div>}
    </main>
  );
}
