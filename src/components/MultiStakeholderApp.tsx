"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  Clock3, Cpu, Gauge, LayoutDashboard, Lightbulb,
  MapPin, Search, ShieldCheck, Sparkles, Users, X,
  Menu, CircleHelp, Package, Monitor, Plus, Moon, Sun,
  FileText, TrendingUp, Download,
  UserCheck, Wrench, Building2, BarChart3, ArrowLeftRight, CheckSquare,
  AlertTriangle, Settings, RefreshCw, Eye, RotateCcw,
  Compass, Zap, ChevronRight
} from "lucide-react";
import {
  RoleKey,
  DEMO_PERSONAS,
  SIX_PERSONAS,
  UserPersona,
  getRoleAccent
} from "@/lib/auth/roles";
import {
  useUnsavedChanges,
  useFormDirtyState
} from "@/lib/hooks/useUnsavedChanges";

// --- TYPES ---
export type EquipmentStatus = "Available" | "Booked" | "In use" | "Under Maintenance" | "Out of Service";

export interface EquipmentItem {
  id: number;
  name: string;
  category: "Instrument" | "Dev kit" | "Workstation";
  department: string;
  location: string;
  status: EquipmentStatus;
  next: string;
  description: string;
  specs: string[];
  icon: "scope" | "kit" | "gpu" | "printer";
  color: "violet" | "blue" | "orange" | "green";
  totalBookings: number;
  assignedTechnician: string;
  lastMaintenance: string;
  hourlyRate: string;
  image?: string;
  modelNumber?: string;
}

export type WorkflowStage =
  | "pending_faculty"
  | "pending_admin"
  | "approved_ready"
  | "in_use"
  | "completed"
  | "rejected";

export interface BookingRecord {
  id: string;
  equipmentId: number;
  equipmentName: string;
  studentName: string;
  studentId: string;
  projectTitle: string;
  department: string;
  labLocation: string;
  date: string;
  timeSlot: string;
  duration: string;
  academicPurpose: string;
  workflowStage: WorkflowStage;
  priorityScore: number;
  facultyComments?: string;
  adminNotes?: string;
  handoverCondition?: string;
  returnCondition?: "Good" | "Needs Maintenance" | "Damaged";
  returnRemarks?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  studentName: string;
  department: string;
  deadline: string;
  status: "active" | "pending" | "completed";
  progress: number;
  equipment: string[];
  description: string;
}

export interface MaintenanceTicket {
  id: string;
  equipmentName: string;
  department: string;
  technician: string;
  issue: string;
  severity: "Routine" | "High" | "Critical";
  dateLogged: string;
  status: "Under Review" | "In Progress" | "Resolved";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: "booking" | "approval" | "maintenance" | "system" | "inventory";
  unread: boolean;
  priority?: "high" | "normal";
  actionLabel?: string;
  targetTab?: string;
}

export function getInitialNotifications(role: RoleKey): NotificationItem[] {
  switch (role) {
    case "student":
      return [
        {
          id: "notif-stu-1",
          title: "Booking Request Approved",
          message: "Your request BK-2026-101 for Digital Oscilloscope 100MHz was approved by Dr. Sarah Jenkins.",
          timestamp: "10m ago",
          category: "booking",
          unread: true,
          priority: "high",
          actionLabel: "View in My Bookings",
          targetTab: "My Bookings"
        },
        {
          id: "notif-stu-2",
          title: "Upcoming Slot Reminder",
          message: "Hardware verification session starts tomorrow at 10:00 AM in Block A · Lab 204.",
          timestamp: "1h ago",
          category: "system",
          unread: true,
          priority: "normal",
          actionLabel: "Check Catalogue",
          targetTab: "Equipment Catalogue"
        },
        {
          id: "notif-stu-3",
          title: "AI Equipment Recommendation",
          message: "New matched hardware: NVIDIA Jetson Orin AGX 64GB available for IoT & Robotics projects.",
          timestamp: "3h ago",
          category: "inventory",
          unread: false,
          priority: "normal",
          actionLabel: "Explore AI Recs",
          targetTab: "AI Recommendations"
        }
      ];
    case "faculty":
      return [
        {
          id: "notif-fac-1",
          title: "Endorsement Request Pending",
          message: "Alex Kumar submitted booking request BK-2026-101 for Digital Oscilloscope 100MHz (IoT Agriculture).",
          timestamp: "Just now",
          category: "approval",
          unread: true,
          priority: "high",
          actionLabel: "Review Request",
          targetTab: "Student Requests"
        },
        {
          id: "notif-fac-2",
          title: "Mentee Milestone Updated",
          message: "Priya Sharma updated project milestone progress to 65% on 'Autonomous Rover Array'.",
          timestamp: "2h ago",
          category: "system",
          unread: true,
          priority: "normal",
          actionLabel: "View Project",
          targetTab: "Mentee Projects"
        },
        {
          id: "notif-fac-3",
          title: "Laboratory Safety Clearance",
          message: "All Block A signal analysis instruments cleared the bi-weekly safety & calibration audit.",
          timestamp: "1d ago",
          category: "system",
          unread: false,
          priority: "normal"
        }
      ];
    case "technician":
      return [
        {
          id: "notif-tech-1",
          title: "Equipment Handover Scheduled",
          message: "Alex Kumar is scheduled to collect Digital Oscilloscope 100MHz at 10:00 AM in Lab 204.",
          timestamp: "Just now",
          category: "booking",
          unread: true,
          priority: "high",
          actionLabel: "Open Handover",
          targetTab: "Handover & Returns"
        },
        {
          id: "notif-tech-2",
          title: "High Severity Maintenance Logged",
          message: "MT-101: 3D Printer Nozzle thermal runaway reported in Block C · Mechanical Fab Lab.",
          timestamp: "1h ago",
          category: "maintenance",
          unread: true,
          priority: "high",
          actionLabel: "View Ticket",
          targetTab: "Maintenance Tickets"
        },
        {
          id: "notif-tech-3",
          title: "Hardware Return Completed",
          message: "Vector Network Analyzer returned in Good condition by Vikram Patel. Restored to inventory.",
          timestamp: "4h ago",
          category: "inventory",
          unread: false,
          priority: "normal"
        }
      ];
    case "lab_admin":
    case "admin":
      return [
        {
          id: "notif-adm-1",
          title: "Allocation Queue Clearance Required",
          message: "3 verified student bookings awaiting central quota validation and administrative slot sign-off.",
          timestamp: "Just now",
          category: "approval",
          unread: true,
          priority: "high",
          actionLabel: "Open Queue",
          targetTab: "Allocation Queue"
        },
        {
          id: "notif-adm-2",
          title: "Conflict Matrix Verified",
          message: "Zero schedule overlaps detected across Block A & Block C labs for the upcoming academic week.",
          timestamp: "2h ago",
          category: "system",
          unread: true,
          priority: "normal",
          actionLabel: "View Matrix",
          targetTab: "Schedule & Conflict Matrix"
        },
        {
          id: "notif-adm-3",
          title: "Institutional Quota Benchmark",
          message: "Bi-weekly department usage quota reached 76.4% capacity. Cross-sharing functioning smoothly.",
          timestamp: "1d ago",
          category: "inventory",
          unread: false,
          priority: "normal"
        }
      ];
    case "hod":
      return [
        {
          id: "notif-hod-1",
          title: "Special High-Priority Allocation",
          message: "Special allocation clearance requested for High-Performance GPU Cluster ($8,500 value).",
          timestamp: "Just now",
          category: "approval",
          unread: true,
          priority: "high",
          actionLabel: "Review Approval",
          targetTab: "Special Approvals"
        },
        {
          id: "notif-hod-2",
          title: "Department Utilization Peak",
          message: "CSE laboratory equipment utilization peaked at 84.6% this week (+12% inter-departmental).",
          timestamp: "3h ago",
          category: "system",
          unread: true,
          priority: "normal",
          actionLabel: "View Analytics",
          targetTab: "Utilization & Bottlenecks"
        },
        {
          id: "notif-hod-3",
          title: "Procurement Audit Report",
          message: "Strategic equipment audit report for Q4 2026 has been generated and ready for dean review.",
          timestamp: "1d ago",
          category: "inventory",
          unread: false,
          priority: "normal"
        }
      ];
    case "management":
      return [
        {
          id: "notif-mgmt-1",
          title: "Resource Sharing ROI Milestone",
          message: "Inter-department equipment sharing has saved $142,500 in avoided duplicate procurement.",
          timestamp: "Just now",
          category: "system",
          unread: true,
          priority: "high",
          actionLabel: "View ROI Telemetry",
          targetTab: "Resource Sharing ROI"
        },
        {
          id: "notif-mgmt-2",
          title: "Campus Utilization Benchmark",
          message: "Multi-laboratory sharing rate improved by 22% this term across CS, ECE, and Mechanical blocks.",
          timestamp: "5h ago",
          category: "system",
          unread: true,
          priority: "normal",
          actionLabel: "View Campus Metrics",
          targetTab: "Campus Resource Metrics"
        },
        {
          id: "notif-mgmt-3",
          title: "Governance & Safety Audit",
          message: "All 248 laboratory research units verified compliant with ISO/IEC academic safety standards.",
          timestamp: "1d ago",
          category: "inventory",
          unread: false,
          priority: "normal"
        }
      ];
    default:
      return [];
  }
}

// --- INITIAL DATA ---
const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 1,
    name: "Digital Oscilloscope 100MHz",
    category: "Instrument",
    department: "Electronics & Communication",
    location: "Block A · Lab 204",
    status: "Available",
    next: "Available now",
    description: "4-channel, 100 MHz digital oscilloscope for precision signal analysis, jitter validation, and circuit debugging.",
    specs: ["100 MHz bandwidth", "4 channels", "1 GSa/s real-time", "Waveform record"],
    icon: "scope",
    color: "violet",
    totalBookings: 28,
    assignedTechnician: "Rajesh Verma",
    lastMaintenance: "2026-11-10",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "DSOX1204G"
  },
  {
    id: 2,
    name: "NVIDIA RTX A5000 Workstation",
    category: "Workstation",
    department: "Computer Science",
    location: "Block C · AI Lab",
    status: "Available",
    next: "Next slot · 2:30 PM",
    description: "High-performance workstation for deep learning training, LLM inference, PyTorch compilation, and CUDA compute workloads.",
    specs: ["RTX A5000 24GB", "64 GB RAM", "CUDA 12.4", "2TB NVMe PCIe 4"],
    icon: "gpu",
    color: "blue",
    totalBookings: 47,
    assignedTechnician: "Rajesh Verma",
    lastMaintenance: "2026-11-15",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "RTX-A5000-TWR"
  },
  {
    id: 3,
    name: "Raspberry Pi 5 Edge AI Kit",
    category: "Dev kit",
    department: "Computer Science",
    location: "Block C · IoT Lab",
    status: "Available",
    next: "Available now",
    description: "Quad-core 2.4GHz single-board computer kit equipped with peripheral sensor suite and neural accelerator HAT.",
    specs: ["8 GB LPDDR4X", "40-pin GPIO", "AI Accelerator HAT", "Sony IMX Camera"],
    icon: "kit",
    color: "orange",
    totalBookings: 32,
    assignedTechnician: "Amit Saxena",
    lastMaintenance: "2026-11-01",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "RPI5-8GB-HAILO"
  },
  {
    id: 4,
    name: "Creality Industrial 3D Printer",
    category: "Instrument",
    department: "Mechanical Engineering",
    location: "Block B · Fab Lab",
    status: "In use",
    next: "Next slot · Tomorrow, 10 AM",
    description: "Enclosed FDM 3D printer for rapid prototyping, aerodynamic ducting, and carbon-fiber composite mechanical enclosures.",
    specs: ["300 × 300 × 300 mm", "Direct Drive Extruder", "0.05 mm layer precision", "PETG / PLA / Carbon"],
    icon: "printer",
    color: "green",
    totalBookings: 39,
    assignedTechnician: "Suresh Pillai",
    lastMaintenance: "2026-10-28",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1633493763343-693ef2d3b236?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "CR-K1-MAX"
  },
  {
    id: 5,
    name: "ESP32-S3 Dual-Core Mesh Kit",
    category: "Dev kit",
    department: "Electrical Engineering",
    location: "Block A · Embedded Lab",
    status: "Available",
    next: "Available now",
    description: "Dual-core Wi-Fi + BLE microcontroller dev board with camera connector, environmental telemetry, and battery pack.",
    specs: ["240 MHz Dual Core", "Wi-Fi + BLE 5.0", "Precision ADC", "Sensor Bundle"],
    icon: "kit",
    color: "orange",
    totalBookings: 19,
    assignedTechnician: "Rajesh Verma",
    lastMaintenance: "2026-11-12",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "ESP32-S3-WROOM"
  },
  {
    id: 6,
    name: "RF Microwave Spectrum Analyzer",
    category: "Instrument",
    department: "Electronics & Communication",
    location: "Block A · RF Lab",
    status: "Available",
    next: "Next slot · 4:00 PM",
    description: "Precision RF spectrum analyzer for microwave signal testing, SDR validation, harmonic distortion, and antenna tuning.",
    specs: ["9 kHz–3.6 GHz", "Tracking Generator", "EMI Pre-compliance", "USB/LAN export"],
    icon: "scope",
    color: "violet",
    totalBookings: 22,
    assignedTechnician: "Rajesh Verma",
    lastMaintenance: "2026-11-18",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "N9320B-KEYSIGHT"
  },
  {
    id: 7,
    name: "Formlabs Form 4 SLA 3D Printer",
    category: "Instrument",
    department: "Mechanical Engineering",
    location: "Block B · Rapid Fab Lab",
    status: "Available",
    next: "Available now",
    description: "Next-generation stereolithography 3D printer for ultra-precise optical prototypes, microfluidics, and medical engineering components.",
    specs: ["25 micron resolution", "Low Force Display (LFD)", "50mm/hour print speed", "Engineering Resins"],
    icon: "printer",
    color: "green",
    totalBookings: 14,
    assignedTechnician: "Suresh Pillai",
    lastMaintenance: "2026-11-19",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "FORMLABS-F4-SLA"
  },
  {
    id: 8,
    name: "Keithley 2450 SourceMeter SMU",
    category: "Instrument",
    department: "Central Instrumentation",
    location: "Block C · Cleanroom Lab",
    status: "Available",
    next: "Available now",
    description: "All-in-one precision IV characterization instrument combining voltage source, current source, DMM, and arbitrary waveform generator.",
    specs: ["200V / 1A / 20W", "0.012% basic measure accuracy", "Touchscreen GUI", "Nanomaterial Testing"],
    icon: "scope",
    color: "violet",
    totalBookings: 18,
    assignedTechnician: "Amit Saxena",
    lastMaintenance: "2026-11-14",
    hourlyRate: "Free (Funded)",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80",
    modelNumber: "KEITHLEY-2450-SMU"
  }
];

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "BK-2026-001",
    equipmentId: 3,
    equipmentName: "Raspberry Pi 5 Edge AI Kit",
    studentName: "Alex Kumar",
    studentId: "CS2026-442",
    projectTitle: "IoT Smart Agriculture Array",
    department: "Computer Science",
    labLocation: "Block C · IoT Lab",
    date: "2026-11-26",
    timeSlot: "10:00 AM - 12:00 PM",
    duration: "2 hours",
    academicPurpose: "Calibrate soil moisture LoRa sensor payload and verify telemetry packet throughput.",
    workflowStage: "pending_faculty",
    priorityScore: 94,
    createdAt: "2026-11-23 09:15"
  },
  {
    id: "BK-2026-002",
    equipmentId: 6,
    equipmentName: "RF Microwave Spectrum Analyzer",
    studentName: "Priya Sharma",
    studentId: "EC2026-109",
    projectTitle: "RF Beamforming Antenna Array",
    department: "Electronics & Communication",
    labLocation: "Block A · RF Lab",
    date: "2026-11-25",
    timeSlot: "02:00 PM - 04:00 PM",
    duration: "2 hours",
    academicPurpose: "Characterize S-parameter return loss for 2.4GHz microstrip patch antenna.",
    workflowStage: "pending_admin",
    priorityScore: 89,
    facultyComments: "Endorsed. Essential for student's IEEE symposium paper submission deadline.",
    createdAt: "2026-11-22 14:30"
  },
  {
    id: "BK-2026-003",
    equipmentId: 2,
    equipmentName: "NVIDIA RTX A5000 Workstation",
    studentName: "Alex Kumar",
    studentId: "CS2026-442",
    projectTitle: "Autonomous Quadcopter Visual SLAM",
    department: "Computer Science",
    labLocation: "Block C · AI Lab",
    date: "2026-11-24",
    timeSlot: "11:00 AM - 03:00 PM",
    duration: "4 hours",
    academicPurpose: "Train stereoscopic depth estimation neural model on collected flight dataset.",
    workflowStage: "approved_ready",
    priorityScore: 96,
    facultyComments: "Approved. Verified compute requirements and safety guidelines.",
    adminNotes: "Slot confirmed. Collision check passed. Assigned to AI Lab Cluster.",
    createdAt: "2026-11-21 11:00"
  },
  {
    id: "BK-2026-004",
    equipmentId: 4,
    equipmentName: "Creality Industrial 3D Printer",
    studentName: "Rohan Mehta",
    studentId: "ME2026-318",
    projectTitle: "Prosthetic Hand Actuator Enclosure",
    department: "Mechanical Engineering",
    labLocation: "Block B · Fab Lab",
    date: "2026-11-23",
    timeSlot: "10:00 AM - 02:00 PM",
    duration: "4 hours",
    academicPurpose: "Fabricate lightweight dual-extrusion tendon housing.",
    workflowStage: "in_use",
    priorityScore: 82,
    facultyComments: "Endorsed for biomechatronics capstone.",
    adminNotes: "Approved under FabLab mechanical quota.",
    handoverCondition: "Checked out with spool of Carbon-PETG. Student wore eye protection.",
    createdAt: "2026-11-20 16:45"
  },
  {
    id: "BK-2026-005",
    equipmentId: 1,
    equipmentName: "Digital Oscilloscope 100MHz",
    studentName: "Alex Kumar",
    studentId: "CS2026-442",
    projectTitle: "IoT Smart Agriculture Array",
    department: "Electronics & Communication",
    labLocation: "Block A · Lab 204",
    date: "2026-11-18",
    timeSlot: "09:00 AM - 11:00 AM",
    duration: "2 hours",
    academicPurpose: "Validate power supply ripple voltage on battery charging circuit.",
    workflowStage: "completed",
    priorityScore: 78,
    facultyComments: "Endorsed.",
    adminNotes: "Approved.",
    handoverCondition: "Checked out with two 10X probes.",
    returnCondition: "Good",
    returnRemarks: "Returned in clean working condition with all probes accounted for.",
    createdAt: "2026-11-17 10:00"
  }
];

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "IoT Smart Agriculture Array",
    studentName: "Alex Kumar",
    department: "Computer Science & IoT",
    deadline: "2026-12-15",
    status: "active",
    progress: 75,
    equipment: ["Raspberry Pi 5 Edge AI Kit", "ESP32-S3 Dual-Core Mesh Kit"],
    description: "Multi-hop wireless mesh telemetry network monitoring soil chemistry, ambient humidity, and solar radiance."
  },
  {
    id: "proj-2",
    title: "Autonomous Quadcopter Visual SLAM",
    studentName: "Alex Kumar & Team",
    department: "Electronics & Communication",
    deadline: "2026-12-05",
    status: "active",
    progress: 88,
    equipment: ["NVIDIA RTX A5000 Workstation"],
    description: "Real-time 3D semantic mapping and stereoscopic obstacle avoidance using onboard neural inference."
  },
  {
    id: "proj-3",
    title: "Wearable ECG Arrhythmia Monitor",
    studentName: "Divya Nair",
    department: "Electrical Engineering",
    deadline: "2027-01-20",
    status: "pending",
    progress: 35,
    equipment: ["Digital Oscilloscope 100MHz"],
    description: "Ultra-low power bio-potential instrumentation amplifier and telemetry patch for cardiac patients."
  }
];

const INITIAL_MAINTENANCE: MaintenanceTicket[] = [
  {
    id: "MT-104",
    equipmentName: "Creality Industrial 3D Printer",
    department: "Mechanical Engineering",
    technician: "Suresh Pillai",
    issue: "Nozzle thermal runaway warning during 240°C PETG print.",
    severity: "High",
    dateLogged: "2026-11-19",
    status: "In Progress"
  },
  {
    id: "MT-102",
    equipmentName: "Digital Oscilloscope 100MHz",
    department: "Electronics & Communication",
    technician: "Rajesh Verma",
    issue: "Routine channel 3 & 4 calibration check.",
    severity: "Routine",
    dateLogged: "2026-11-10",
    status: "Resolved"
  }
];

export default function MultiStakeholderApp({ initialRole }: { initialRole?: RoleKey } = {}) {
  // --- CORE STATE ---
  const [currentRole, setCurrentRole] = useState<RoleKey>(initialRole || "student");
  const [hasInitializedRole, setHasInitializedRole] = useState<boolean>(Boolean(initialRole));
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [confirmSwitchModal, setConfirmSwitchModal] = useState<boolean>(false);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unsaved forms tracking across modal transitions
  const { hasUnsavedChanges, unsavedForms, resetUnsaved } = useUnsavedChanges();

  // Guided 5-Step Booking Modal State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [lastSubmittedBooking, setLastSubmittedBooking] = useState<BookingRecord | null>(null);

  // Apple-inspired scroll listener for expanding hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(Math.max(scrollY / 380, 0), 1);
      document.documentElement.style.setProperty("--hero-progress", progress.toString());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- INTRO SPLASH SCREEN (~3 SECONDS, ONCE PER BROWSER SESSION) ---
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [introFading, setIntroFading] = useState<boolean>(false);

  useEffect(() => {
    // Check if splash was already shown in this browser session
    const splashSeen = typeof window !== "undefined" && sessionStorage.getItem("lablink_splash_seen") === "true";
    if (splashSeen) {
      setShowIntro(false);
      setIntroFading(false);
      return;
    }

    const fadeTimer = setTimeout(() => setIntroFading(true), 2800);
    const hideTimer = setTimeout(() => {
      setShowIntro(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lablink_splash_seen", "true");
      }
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Synchronize server-side demo session cookie on client mount
  useEffect(() => {
    fetch("/api/demo/session")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.activePersona) {
          const r = res.data.activePersona.role as RoleKey;
          setCurrentRole(r === "lab_admin" ? "admin" : r);
          setHasInitializedRole(true);
        } else if (!initialRole) {
          const splashSeen = typeof window !== "undefined" && sessionStorage.getItem("lablink_splash_seen") === "true";
          if (splashSeen) {
            setShowRoleModal(true);
          } else {
            const timer = setTimeout(() => {
              setShowRoleModal(true);
            }, 3300);
            return () => clearTimeout(timer);
          }
        }
      })
      .catch(() => {
        if (!hasInitializedRole && !initialRole) {
          setShowRoleModal(true);
        }
      });
  }, [initialRole, hasInitializedRole]);

  const handleSkipIntro = () => {
    setIntroFading(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lablink_splash_seen", "true");
    }
    setTimeout(() => setShowIntro(false), 200);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
    setIntroFading(false);
    setTimeout(() => setIntroFading(true), 2800);
    setTimeout(() => setShowIntro(false), 3300);
  };

  // --- PLATFORM DATA ---
  const [equipment, setEquipment] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [maintenance, setMaintenance] = useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE);
  const [requireFacultyApproval, setRequireFacultyApproval] = useState<boolean>(true);

  // --- FILTERS & SEARCH ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  // --- MODALS ---
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState<BookingRecord | null>(null);

  // Booking Form
  const [bookProjectTitle, setBookProjectTitle] = useState("IoT Smart Agriculture Array");
  const [bookDate, setBookDate] = useState("2026-11-27");
  const [bookTime, setBookTime] = useState("10:00 AM - 12:00 PM");
  const [bookPurpose, setBookPurpose] = useState("");

  // New Equipment Form (Technician / Admin)
  const [newEqName, setNewEqName] = useState("");
  const [newEqCategory, setNewEqCategory] = useState<"Instrument" | "Dev kit" | "Workstation">("Instrument");
  const [newEqDept, setNewEqDept] = useState("Computer Science");
  const [newEqLoc, setNewEqLoc] = useState("Block C · AI Lab");
  const [newEqSpecs, setNewEqSpecs] = useState("");

  // New Project Form State
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDept, setNewProjDept] = useState("Computer Science & IoT");
  const [newProjDeadline, setNewProjDeadline] = useState("2026-12-20");
  const [newProjDesc, setNewProjDesc] = useState("");

  // New Maintenance Form State
  const [maintEqName, setMaintEqName] = useState("Digital Oscilloscope 100MHz");
  const [maintIssue, setMaintIssue] = useState("");
  const [maintSeverity, setMaintSeverity] = useState<"Routine" | "High" | "Critical">("Routine");

  // AI Assistant State
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState<{ title: string; desc: string; matches: string[] } | null>(null);

  // Active persona
  const persona: UserPersona = DEMO_PERSONAS[currentRole];

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("lablink_theme") as "light" | "dark" | null;
    const initial = savedTheme || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // Dynamic greeting and emoji according to local time
  const [timeGreeting, setTimeGreeting] = useState<{ greeting: string; emoji: string }>({
    greeting: "Good day",
    emoji: "☀️"
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeGreeting({ greeting: "Good morning", emoji: "🌅" });
    } else if (hour >= 12 && hour < 17) {
      setTimeGreeting({ greeting: "Good afternoon", emoji: "☀️" });
    } else if (hour >= 17 && hour < 21) {
      setTimeGreeting({ greeting: "Good evening", emoji: "🌇" });
    } else {
      setTimeGreeting({ greeting: "Good night", emoji: "🌙" });
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("lablink_theme", next);
    showToast(`Switched to ${next} mode`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  // Role Accent synchronization with Living Lab atmosphere & theme
  useEffect(() => {
    const accent = getRoleAccent(currentRole);
    document.documentElement.style.setProperty("--role-accent", accent.hex);
    document.documentElement.style.setProperty("--role-accent-rgb", accent.rgb);
    document.documentElement.style.setProperty("--role-accent-glow", `rgba(${accent.rgb}, ${theme === "dark" ? "0.35" : "0.28"})`);
    document.documentElement.style.setProperty("--role-accent-light", `rgba(${accent.rgb}, 0.16)`);
    document.documentElement.setAttribute("data-role", currentRole);
  }, [currentRole, theme]);

  // Notifications State & Handlers
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getInitialNotifications(currentRole));
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "high">("all");
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationPanel(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showNotificationPanel) {
        setShowNotificationPanel(false);
      }
    };
    if (showNotificationPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotificationPanel]);

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (notifFilter === "unread") return notifications.filter((n) => n.unread);
    if (notifFilter === "high") return notifications.filter((n) => n.priority === "high");
    return notifications;
  }, [notifications, notifFilter]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast("All updates marked as read.");
  };

  const handleMarkItemRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    showToast("Cleared notification list.");
  };

  const handleNotifAction = (item: NotificationItem) => {
    handleMarkItemRead(item.id);
    setShowNotificationPanel(false);
    if (item.targetTab) {
      setActiveTab(item.targetTab);
      showToast(`Navigated to ${item.targetTab}`);
    }
  };

  // Register active forms into global dirty tracker for unsaved changes protection
  useFormDirtyState(
    "booking-form",
    "Equipment Booking Request",
    showBookingModal && (bookPurpose.trim().length > 0 || bookingStep > 1)
  );
  useFormDirtyState(
    "equipment-form",
    "New Equipment Specification",
    showNewEquipmentModal && (newEqName.trim().length > 0 || newEqSpecs.trim().length > 0)
  );
  useFormDirtyState(
    "project-form",
    "Academic Project Registration",
    showProjectModal && (newProjTitle.trim().length > 0 || newProjDesc.trim().length > 0)
  );
  useFormDirtyState(
    "maintenance-form",
    "Equipment Maintenance Ticket",
    showMaintenanceModal && maintIssue.trim().length > 0
  );

  const handleInitiateSwitchRole = () => {
    setConfirmSwitchModal(true);
  };

  const handleConfirmSwitch = () => {
    setConfirmSwitchModal(false);
    resetUnsaved();
    setShowRoleModal(true);
  };

  const handleRoleChange = async (target: UserPersona | RoleKey) => {
    const personaObj: UserPersona = typeof target === "string" ? DEMO_PERSONAS[target] : target;
    const mappedRole: RoleKey = personaObj.role === "lab_admin" ? "admin" : (personaObj.role as RoleKey);

    setCurrentRole(mappedRole);
    setHasInitializedRole(true);
    setShowRoleModal(false);
    resetUnsaved();
    setNotifications(getInitialNotifications(mappedRole));
    setActiveTab("Overview");
    showToast(`Welcome, ${personaObj.name}! Activated ${personaObj.badge} stakeholder access.`);

    try {
      await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: personaObj.id })
      });
    } catch (err) {
      console.warn("Failed to sync server demo session:", err);
    }
  };

  // Helper: map icon string to Lucide component
  const getIcon = (type: EquipmentItem["icon"]) => {
    if (type === "gpu") return Monitor;
    if (type === "kit") return Cpu;
    if (type === "printer") return Package;
    return Activity;
  };

  // Helper: Format workflow stage label
  const getWorkflowBadge = (stage: WorkflowStage) => {
    switch (stage) {
      case "pending_faculty":
        return { label: "1. Pending Faculty Review", class: "pending_faculty" };
      case "pending_admin":
        return { label: "2. Pending Admin Allocation", class: "pending_admin" };
      case "approved_ready":
        return { label: "3. Ready for Tech Handover", class: "approved_ready" };
      case "in_use":
        return { label: "4. In Use by Student", class: "in_use" };
      case "completed":
        return { label: "5. Returned & Inspected", class: "completed" };
      case "rejected":
        return { label: "Rejected", class: "rejected" };
    }
  };

  // --- INTERCONNECTED WORKFLOW MUTATIONS ---

  // Open 5-Step Guided Booking
  const handleOpenBooking = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setBookingStep(1);
    setShowBookingModal(true);
  };

  // 1. Student Submits Booking Request
  const handleStudentBook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEquipment) return;

    // Check collision for same equipment, date and time
    const collision = bookings.find(
      (b) =>
        b.equipmentId === selectedEquipment.id &&
        b.date === bookDate &&
        b.timeSlot === bookTime &&
        b.workflowStage !== "rejected" &&
        b.workflowStage !== "completed"
    );

    if (collision) {
      showToast(`Warning: Collision detected on ${selectedEquipment.name} at this time slot.`);
      return;
    }

    const nextStage: WorkflowStage = requireFacultyApproval ? "pending_faculty" : "pending_admin";

    const newBooking: BookingRecord = {
      id: `BK-2026-${Math.floor(100 + Math.random() * 900)}`,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      studentName: persona.name,
      studentId: "CS2026-442",
      projectTitle: bookProjectTitle,
      department: selectedEquipment.department,
      labLocation: selectedEquipment.location,
      date: bookDate,
      timeSlot: bookTime,
      duration: "2 hours",
      academicPurpose: bookPurpose || "Academic project hardware verification and data collection.",
      workflowStage: nextStage,
      priorityScore: Math.floor(75 + Math.random() * 23),
      createdAt: "Just now"
    };

    setBookings([newBooking, ...bookings]);
    setLastSubmittedBooking(newBooking);
    setBookingStep(5);
    setBookPurpose("");
    showToast(`Request ${newBooking.id} submitted! Next: Faculty Guide Endorsement.`);
  };

  // 2. Faculty Endorses or Rejects
  const handleFacultyDecision = (id: string, decision: "approve" | "reject", comment?: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (decision === "approve") {
          return {
            ...b,
            workflowStage: "pending_admin",
            facultyComments: comment || "Endorsed by Project Guide Dr. Sarah Jenkins. Safe and relevant."
          };
        } else {
          return {
            ...b,
            workflowStage: "rejected",
            rejectionReason: comment || "Requested hardware exceeds project scope. Consult lab coordinator."
          };
        }
      })
    );
    showToast(decision === "approve" ? "Endorsed and forwarded to Lab Administrator!" : "Request rejected with feedback.");
  };

  // 3. Lab Administrator Authorizes or Rejects
  const handleAdminDecision = (id: string, decision: "approve" | "reject") => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (decision === "approve") {
          return {
            ...b,
            workflowStage: "approved_ready",
            adminNotes: "Allocation authorized. Collision check passed. Assigned for pickup."
          };
        } else {
          return {
            ...b,
            workflowStage: "rejected",
            rejectionReason: "Schedule conflict or maintenance priority restriction."
          };
        }
      })
    );
    showToast(decision === "approve" ? "Allocation approved! Technician notified for handover." : "Booking rejected by Administrator.");
  };

  // 4. Technician Records Handover to Student
  const handleTechnicianHandover = (id: string) => {
    const targetBooking = bookings.find((b) => b.id === id);
    if (!targetBooking) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, workflowStage: "in_use", handoverCondition: "Checked out in good working condition by student." } : b))
    );

    setEquipment((prev) =>
      prev.map((eq) => (eq.id === targetBooking.equipmentId ? { ...eq, status: "In use", totalBookings: eq.totalBookings + 1 } : eq))
    );

    showToast(`Equipment handed over to ${targetBooking.studentName}. Status: In Use.`);
  };

  // 5. Technician Records Return and Inspects Condition
  const handleTechnicianReturn = (id: string, condition: "Good" | "Needs Maintenance" | "Damaged", notes?: string) => {
    const targetBooking = bookings.find((b) => b.id === id);
    if (!targetBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              workflowStage: "completed",
              returnCondition: condition,
              returnRemarks: notes || `Inspected upon return: Condition verified as ${condition}.`
            }
          : b
      )
    );

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id !== targetBooking.equipmentId) return eq;
        return {
          ...eq,
          status: condition === "Damaged" ? "Out of Service" : condition === "Needs Maintenance" ? "Under Maintenance" : "Available"
        };
      })
    );

    showToast(`Return recorded (${condition}). Equipment reset to available.`);
  };

  // Technician / Admin: Add New Equipment
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) return;

    const newEquip: EquipmentItem = {
      id: Date.now(),
      name: newEqName,
      category: newEqCategory,
      department: newEqDept,
      location: newEqLoc,
      status: "Available",
      next: "Available now",
      description: "Standard laboratory asset catalogued and verified for student and faculty research.",
      specs: newEqSpecs.split(",").map((s) => s.trim()).filter(Boolean),
      icon: newEqCategory === "Workstation" ? "gpu" : newEqCategory === "Dev kit" ? "kit" : "scope",
      color: "blue",
      totalBookings: 0,
      assignedTechnician: persona.name,
      lastMaintenance: "2026-11-23",
      hourlyRate: "Free (Funded)"
    };

    setEquipment([newEquip, ...equipment]);
    setShowNewEquipmentModal(false);
    setNewEqName("");
    setNewEqSpecs("");
    showToast(`Equipment "${newEquip.name}" added to inventory!`);
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    const newP: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProjTitle,
      studentName: persona.name,
      department: newProjDept,
      deadline: newProjDeadline,
      status: "active",
      progress: 20,
      equipment: ["Pending Allocation"],
      description: newProjDesc || "Student-led research project focusing on hardware implementation."
    };
    setProjects([newP, ...projects]);
    setShowProjectModal(false);
    setNewProjTitle("");
    setNewProjDesc("");
    showToast(`Project "${newP.title}" created successfully!`);
  };

  // Create Maintenance Ticket
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintIssue.trim()) return;
    const newTicket: MaintenanceTicket = {
      id: `MT-${Math.floor(100 + Math.random() * 900)}`,
      equipmentName: maintEqName,
      department: persona.department,
      technician: persona.name,
      issue: maintIssue,
      severity: maintSeverity,
      dateLogged: "2026-11-23",
      status: "In Progress"
    };
    setMaintenance([newTicket, ...maintenance]);
    setShowMaintenanceModal(false);
    setMaintIssue("");
    showToast(`Maintenance ticket ${newTicket.id} registered!`);
  };

  // Technician / Admin: Update Equipment Operational Status
  const handleToggleEquipmentStatus = (id: number, newStatus: EquipmentStatus) => {
    setEquipment((prev) => prev.map((eq) => (eq.id === id ? { ...eq, status: newStatus } : eq)));
    showToast(`Equipment status changed to "${newStatus}"`);
  };

  // HOD: Special High-Priority Endorsement
  const handleHodSpecialApproval = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              workflowStage: b.workflowStage === "pending_faculty" ? "pending_admin" : "approved_ready",
              status: "Approved",
              facultyComments: b.facultyComments ? `${b.facultyComments} [HOD Endorsement]` : "Special HOD Priority Endorsement Granted."
            }
          : b
      )
    );
    showToast(`HOD Special Priority Approval granted for ${bookingId}!`);
  };

  // Multi-Stakeholder AI Assistant Matcher
  const handleRunAi = () => {
    if (!aiInput.trim()) return;
    const txt = aiInput.toLowerCase();

    if (currentRole === "student") {
      if (txt.includes("gpu") || txt.includes("ai") || txt.includes("deep") || txt.includes("vision")) {
        setAiOutput({
          title: "AI Workstation & Accelerated Compute Match",
          desc: "Identified high-compute workload requirements. Matches with CUDA-enabled workstations.",
          matches: ["NVIDIA RTX A5000 Workstation", "Raspberry Pi 5 Edge AI Kit"]
        });
      } else if (txt.includes("iot") || txt.includes("sensor") || txt.includes("wireless") || txt.includes("telemetry")) {
        setAiOutput({
          title: "Embedded & Edge Telemetry Match",
          desc: "Suitable for low-power sensor networks and micro-controllers across campus labs.",
          matches: ["Raspberry Pi 5 Edge AI Kit", "ESP32-S3 Dual-Core Mesh Kit"]
        });
      } else {
        setAiOutput({
          title: "General Instrument Allocation",
          desc: "Identified hardware verification and rapid prototyping needs.",
          matches: ["Digital Oscilloscope 100MHz", "Creality Industrial 3D Printer"]
        });
      }
    } else if (currentRole === "faculty") {
      setAiOutput({
        title: "Faculty Project Suitability Analysis",
        desc: `Verified academic requirements for "${aiInput}". Safety Level 1 clearance confirmed.`,
        matches: ["NVIDIA RTX A5000 Workstation (Recommended for Deep Learning)", "RF Microwave Spectrum Analyzer (Alternative)"]
      });
    } else {
      setAiOutput({
        title: "Load-Balancing & Bottleneck Optimization",
        desc: "Analyzed campus equipment capacity vs. demand.",
        matches: ["Suggest redirecting 32% of basic simulation jobs to Block A Embedded Lab to free GPU clusters."]
      });
    }
  };

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.specs.join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "All" || eq.category === categoryFilter;
      const matchDept = deptFilter === "All" || eq.department === deptFilter;
      const matchAvail = availabilityFilter === "All" || eq.status === availabilityFilter;
      return matchSearch && matchCat && matchDept && matchAvail;
    });
  }, [equipment, searchQuery, categoryFilter, deptFilter, availabilityFilter]);

  // Dynamic Navigation Items tailored per role
  const getNavItemsForRole = () => {
    switch (currentRole) {
      case "student":
        return [
          { label: "Story & Overview", icon: Compass },
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Equipment Catalogue", icon: Search },
          { label: "My Projects", icon: Lightbulb, count: projects.length },
          { label: "My Bookings", icon: CalendarDays, count: bookings.filter((b) => b.studentName === "Alex Kumar").length },
          { label: "AI Recommendations", icon: Sparkles }
        ];
      case "faculty":
        return [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Student Requests", icon: CheckSquare, count: bookings.filter((b) => b.workflowStage === "pending_faculty").length },
          { label: "Mentee Projects", icon: Users, count: projects.length },
          { label: "Lab Catalogue", icon: Search },
          { label: "Safety & Misuse Reports", icon: AlertTriangle }
        ];
      case "technician":
        return [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Handover & Returns", icon: ArrowLeftRight, count: bookings.filter((b) => b.workflowStage === "approved_ready" || b.workflowStage === "in_use").length },
          { label: "Lab Inventory", icon: Package, count: equipment.length },
          { label: "Maintenance Tickets", icon: Wrench, count: maintenance.length }
        ];
      case "lab_admin":
      case "admin":
        return [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Allocation Queue", icon: UserCheck, count: bookings.filter((b) => b.workflowStage === "pending_admin").length },
          { label: "Schedule & Conflict Matrix", icon: CalendarDays },
          { label: "Facility Equipment", icon: Package },
          { label: "Institutional Policies", icon: Settings }
        ];
      case "hod":
        return [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Department Asset Audit", icon: Building2 },
          { label: "Utilization & Bottlenecks", icon: BarChart3 },
          { label: "Special Approvals", icon: ShieldCheck, count: bookings.filter((b) => b.priorityScore > 90).length },
          { label: "Inter-Department Comparison", icon: ArrowLeftRight }
        ];
      case "management":
        return [
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Campus Resource Metrics", icon: Building2 },
          { label: "Resource Sharing ROI", icon: TrendingUp },
          { label: "Capital Procurement Forecast", icon: BarChart3 },
          { label: "Annual Audit Report", icon: FileText }
        ];
      default:
        return [
          { label: "Story & Overview", icon: Compass },
          { label: "Dashboard", icon: LayoutDashboard }
        ];
    }
  };

  // --- RENDER APPLE-INSPIRED OVERVIEW / STORYTELLING SHOWCASE ---
  const renderAppleOverview = () => {
    return (
      <>
        {/* Expanding Background Hero Section */}
        <section className="apple-hero-section">
          <div className="apple-hero-container">
            <div className="apple-hero-bg" />
            <div className="apple-hero-gradient" />
            <div className="apple-hero-content">
              <div className="apple-hero-eyebrow">
                <Sparkles size={14} /> Next-Generation University Infrastructure
              </div>
              <h1 className="apple-hero-title">
                Your Campus. Every Resource.<br />One Connected Platform.
              </h1>
              <p className="apple-hero-sub">
                Discover, access, and manage laboratory resources across your campus. Turn ideas into innovation without resource limitations.
              </p>
              <div className="apple-hero-actions">
                <button
                  className="apple-btn-primary"
                  onClick={() => setActiveTab("Equipment Catalogue")}
                >
                  Explore Laboratories <ArrowRight size={16} />
                </button>
                <button
                  className="apple-btn-secondary"
                  onClick={() => {
                    const el = document.getElementById("storytelling-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  How LabLink Works <ChevronRight size={16} />
                </button>
              </div>

              <div className="apple-hero-telemetry">
                <div className="hero-telemetry-chip">
                  <Zap size={14} color="#38bdf8" />
                  <span>Deterministic Allocation Engine: Active</span>
                </div>
                <div className="hero-telemetry-chip">
                  <Building2 size={14} color="#34d399" />
                  <span>6 Academic Divisions · 240+ Precision Instruments</span>
                </div>
                <div className="hero-telemetry-chip">
                  <ShieldCheck size={14} color="#fbbf24" />
                  <span>Zero Double-Booking Guarantee</span>
                </div>
                <div className="hero-telemetry-chip">
                  <TrendingUp size={14} color="#a78bfa" />
                  <span>38% Increase in Interdisciplinary Capstones</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scroll-Triggered Storytelling Chapters */}
        <section id="storytelling-section" className="storytelling-section">
          <div className="story-header">
            <div className="story-header-eyebrow">HOW LABLINK WORKS</div>
            <h2 className="story-header-title">The Complete Laboratory Lifecycle, Reimagined.</h2>
            <p className="story-header-sub">
              Designed with the elegance of modern consumer technology and the operational precision of institutional research governance.
            </p>
          </div>

          <div className="story-grid">
            {/* Chapter 1: Discover Smartly */}
            <div className="story-row">
              <div className="story-text">
                <span className="story-eyebrow">01 · DISCOVER SMARTLY</span>
                <h3 className="story-title">Find any precision instrument across campus in seconds.</h3>
                <p className="story-description">
                  Whether you need a 100MHz digital oscilloscope in Block A, an NVIDIA GPU cluster in Block C, or an enclosed 3D printer in the Fab Lab—LabLink Nexus provides real-time telemetry, location maps, and verified availability across all 6 campus divisions.
                </p>
                <div className="story-metrics-chips">
                  <div className="story-metric-chip">
                    <strong>248</strong>
                    <span>Tracked Instruments</span>
                  </div>
                  <div className="story-metric-chip">
                    <strong>100%</strong>
                    <span>Digital Twin Barcoded</span>
                  </div>
                </div>
              </div>
              <div className="story-visual-wrap">
                <img
                  src="https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80"
                  alt="Precision Campus Repertory"
                  className="story-visual-img"
                  loading="lazy"
                />
                <div className="story-visual-overlay" />
                <div className="story-visual-badge">
                  <Search size={14} /> Instant Cross-Department Search &amp; Telemetry
                </div>
              </div>
            </div>

            {/* Chapter 2: Book Effortlessly */}
            <div className="story-row reversed">
              <div className="story-text">
                <span className="story-eyebrow">02 · BOOK EFFORTLESSLY</span>
                <h3 className="story-title">Guided 5-step reservations. Zero double-booking collisions.</h3>
                <p className="story-description">
                  Select your hardware, choose verified available time windows, link your thesis or capstone project, and submit. The platform runs algorithmic conflict detection before reservation confirmation to prevent scheduling collisions.
                </p>
                <div className="story-metrics-chips">
                  <div className="story-metric-chip">
                    <strong>0.0%</strong>
                    <span>Scheduling Collisions</span>
                  </div>
                  <div className="story-metric-chip">
                    <strong>5 Steps</strong>
                    <span>Guided Reservation Flow</span>
                  </div>
                </div>
              </div>
              <div className="story-visual-wrap">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"
                  alt="Guided Booking Workflow"
                  className="story-visual-img"
                  loading="lazy"
                />
                <div className="story-visual-overlay" />
                <div className="story-visual-badge">
                  <CalendarDays size={14} /> Deterministic Conflict Detection Active
                </div>
              </div>
            </div>

            {/* Chapter 3: Collaborate Seamlessly */}
            <div className="story-row">
              <div className="story-text">
                <span className="story-eyebrow">03 · COLLABORATE SEAMLESSLY</span>
                <h3 className="story-title">Connecting students and faculty advisors in one tap.</h3>
                <p className="story-description">
                  Project guides review research suitability, provide one-click endorsements, recommend alternative hardware configurations, and ensure equipment safety protocols are enforced before student checkouts.
                </p>
                <div className="story-metrics-chips">
                  <div className="story-metric-chip">
                    <strong>&lt; 2 Hrs</strong>
                    <span>Average Guide Response</span>
                  </div>
                  <div className="story-metric-chip">
                    <strong>Level 1</strong>
                    <span>Safety Briefing Sign-off</span>
                  </div>
                </div>
              </div>
              <div className="story-visual-wrap">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
                  alt="Faculty Endorsement"
                  className="story-visual-img"
                  loading="lazy"
                />
                <div className="story-visual-overlay" />
                <div className="story-visual-badge">
                  <ShieldCheck size={14} /> One-Click Academic Suitability Endorsement
                </div>
              </div>
            </div>

            {/* Chapter 4: Allocate Intelligently */}
            <div className="story-row reversed">
              <div className="story-text">
                <span className="story-eyebrow">04 · ALLOCATE INTELLIGENTLY</span>
                <h3 className="story-title">Algorithmic load balancing and technician dispatch.</h3>
                <p className="story-description">
                  Central facility administrators authorize resource allocations using multi-factor priority scores, while laboratory technicians record verified checkouts, condition ratings, and return maintenance tickets.
                </p>
                <div className="story-metrics-chips">
                  <div className="story-metric-chip">
                    <strong>94.6%</strong>
                    <span>Equipment Readiness Index</span>
                  </div>
                  <div className="story-metric-chip">
                    <strong>100%</strong>
                    <span>Handover &amp; Return Audit Trail</span>
                  </div>
                </div>
              </div>
              <div className="story-visual-wrap">
                <img
                  src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80"
                  alt="Technician Handover & Returns"
                  className="story-visual-img"
                  loading="lazy"
                />
                <div className="story-visual-overlay" />
                <div className="story-visual-badge">
                  <ArrowLeftRight size={14} /> Verified Condition &amp; Maintenance Logging
                </div>
              </div>
            </div>

            {/* Chapter 5: Innovate Together */}
            <div className="story-row">
              <div className="story-text">
                <span className="story-eyebrow">05 · INNOVATE TOGETHER</span>
                <h3 className="story-title">Accelerating research across campus boundaries.</h3>
                <p className="story-description">
                  Cross-department resource sharing has unlocked 38% more interdisciplinary capstones, allowing Computer Science, Electronics, and Mechanical students to collaborate while saving the institution $142,500 in duplicate hardware purchases.
                </p>
                <div className="story-metrics-chips">
                  <div className="story-metric-chip">
                    <strong>$142,500</strong>
                    <span>Avoided Procurement Cost</span>
                  </div>
                  <div className="story-metric-chip">
                    <strong>+38%</strong>
                    <span>Interdisciplinary Projects</span>
                  </div>
                </div>
              </div>
              <div className="story-visual-wrap">
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80"
                  alt="Innovation Across Campus"
                  className="story-visual-img"
                  loading="lazy"
                />
                <div className="story-visual-overlay" />
                <div className="story-visual-badge">
                  <TrendingUp size={14} /> Campus-Wide ROI &amp; Accreditation Compliance
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Stakeholder Role Showcase Matrix */}
        <section className="role-showcase-section">
          <div className="story-header" style={{ marginBottom: "36px" }}>
            <div className="story-header-eyebrow">MULTI-STAKEHOLDER GOVERNANCE</div>
            <h2 className="story-header-title">Tailored Workspaces for Every Campus Role</h2>
            <p className="story-header-sub">
              Explore the platform as any stakeholder with zero-barrier demo access. Select a persona below to experience their dedicated workspace.
            </p>
          </div>

          <div className="role-showcase-grid">
            {(Object.keys(DEMO_PERSONAS) as RoleKey[]).map((key) => {
              const p = DEMO_PERSONAS[key];
              const isCurrent = currentRole === key;
              return (
                <div
                  key={key}
                  className={`role-showcase-card ${isCurrent ? "active-role-card" : ""}`}
                  onClick={() => {
                    setCurrentRole(key);
                    setActiveTab("Dashboard");
                    showToast(`Switched to ${p.name} (${p.roleTitle})`);
                  }}
                >
                  <div className="role-card-top">
                    <div className="role-card-avatar">{p.avatar}</div>
                    <span className="role-card-badge">{p.badge}</span>
                  </div>
                  <div className="role-card-name">{p.name}</div>
                  <div className="role-card-dept">{p.department}</div>
                  <div className="role-card-desc">{p.summary}</div>
                  <div className="role-card-action">
                    {isCurrent ? "Active Workspace →" : "Explore this Role →"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Equipment Teaser Grid */}
        <section className="section-block" style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 24px" }}>
          <div className="section-heading">
            <div>
              <div className="section-eyebrow">FEATURED PRECISION ASSETS</div>
              <h2>High-Demand Campus Equipment</h2>
              <p>Top precision workstations and instruments available for immediate academic reservation.</p>
            </div>
            <button className="primary-button" onClick={() => setActiveTab("Equipment Catalogue")}>
              View All {equipment.length} Assets <ArrowRight size={14} />
            </button>
          </div>

          <div className="apple-equipment-grid">
            {equipment.slice(0, 3).map((item) => (
              <article className="apple-product-card" key={item.id}>
                <div className="product-card-media">
                  <img
                    src={item.image || "/logo.png"}
                    alt={item.name}
                    className="product-card-img"
                    loading="lazy"
                  />
                  <div className="product-card-status-pill">
                    <span className={`status-dot ${item.status === "Available" ? "dot-available" : item.status === "In use" ? "dot-in-use" : "dot-booked"}`} />
                    {item.status}
                  </div>
                  <div className="product-card-dept-tag">{item.department}</div>
                </div>

                <div className="product-card-body">
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    {item.category} · {item.modelNumber || "VERIFIED"}
                  </div>
                  <h3 className="product-card-title">{item.name}</h3>
                  <div className="product-card-location">
                    <MapPin size={12} /> {item.location} · Tech: {item.assignedTechnician}
                  </div>
                  <p className="product-card-desc">{item.description}</p>
                  <div className="product-specs-pills">
                    {item.specs.map((s) => (
                      <span key={s} className="spec-chip">{s}</span>
                    ))}
                  </div>

                  <div className="product-actions">
                    <button className="btn-apple-details" onClick={() => setSelectedEquipment(item)}>
                      Quick Specs
                    </button>
                    {currentRole === "student" ? (
                      <button
                        className="btn-apple-reserve"
                        disabled={item.status !== "Available"}
                        onClick={() => handleOpenBooking(item)}
                      >
                        {item.status === "Available" ? "Book Equipment" : item.status} <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        className="btn-apple-details"
                        style={{ flex: 1, color: "var(--primary)" }}
                        onClick={() => showToast(`Selected ${item.name} for inspection`)}
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
    );
  };

  // --- RENDER CURRENT ROLE DASHBOARD ---
  const renderRoleDashboard = () => {
    switch (currentRole) {
      // 1. STUDENT VIEW
      case "student":
        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> STUDENT PORTAL</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Search specialized hardware across campus, schedule slots, and advance your project.</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="primary-button" onClick={() => setActiveTab("Equipment Catalogue")}>
                  <Search size={16} /> Explore Catalogue
                </button>
              </div>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Available Instruments <CheckCircle2 size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">{equipment.filter((e) => e.status === "Available").length}</div>
                <div className="kpi-tile-foot"><span className="trend-up">Ready for booking</span></div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">My Active Bookings <CalendarDays size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">{bookings.filter((b) => b.studentName === "Alex Kumar" && b.workflowStage !== "completed").length}</div>
                <div className="kpi-tile-foot">In review or scheduled</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Academic Projects <Lightbulb size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">{projects.length}</div>
                <div className="kpi-tile-foot">Linked with lab resources</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Campus Labs Online <Building2 size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">8</div>
                <div className="kpi-tile-foot">Cross-sharing active</div>
              </div>
            </div>

            {/* Stepper */}
            <div className="analytics-card" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800 }}>My Latest Booking Status & Approval Stepper</h3>
                  <p style={{ margin: 0 }}>Track real-time progress as faculty, lab admin, and technicians process your reservation.</p>
                </div>
                <span className="role-pill-badge">{bookings[0].id}</span>
              </div>

              <div className="workflow-stepper">
                {[
                  { num: "1", title: "Student Request", done: true },
                  { num: "2", title: "Faculty Endorsement", done: bookings[0].workflowStage !== "pending_faculty", active: bookings[0].workflowStage === "pending_faculty" },
                  { num: "3", title: "Admin Allocation", done: ["approved_ready", "in_use", "completed"].includes(bookings[0].workflowStage), active: bookings[0].workflowStage === "pending_admin" },
                  { num: "4", title: "Tech Handover", done: ["in_use", "completed"].includes(bookings[0].workflowStage), active: bookings[0].workflowStage === "approved_ready" },
                  { num: "5", title: "In-Lab Usage", done: bookings[0].workflowStage === "completed", active: bookings[0].workflowStage === "in_use" },
                  { num: "6", title: "Return & Sign-Off", done: bookings[0].workflowStage === "completed", active: false }
                ].map((s, idx, arr) => (
                  <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className={`stepper-step ${s.done ? "done" : s.active ? "active" : ""}`}>
                      <span className="stepper-num">{s.done ? "✓" : s.num}</span>
                      <span>{s.title}</span>
                    </div>
                    {idx < arr.length - 1 && <span className="stepper-arrow">→</span>}
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "10px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{bookings[0].equipmentName}</strong> · Reserved for <em>{bookings[0].projectTitle}</em> on <strong>{bookings[0].date} ({bookings[0].timeSlot})</strong>
                </div>
                <span className={`status-tag ${getWorkflowBadge(bookings[0].workflowStage).class}`}>
                  {getWorkflowBadge(bookings[0].workflowStage).label}
                </span>
              </div>
            </div>

            {/* Featured Hardware */}
            <div className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">EQUIPMENT DISCOVERY</div>
                  <h2>Available Lab Equipment</h2>
                  <p>Choose an item to reserve for your coursework or capstone research.</p>
                </div>
                <button className="text-button" onClick={() => setActiveTab("Equipment Catalogue")}>
                  Full catalogue ({equipment.length}) <ArrowRight size={14} />
                </button>
              </div>

              <div className="resource-grid">
                {equipment.slice(0, 3).map((item) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <article className="resource-card" key={item.id}>
                      <div className={`resource-visual ${item.color}`}>
                        <div className="resource-icon-wrap">
                          <Icon size={34} strokeWidth={1.5} />
                        </div>
                        <span className={`availability-pill ${item.status === "Available" ? "available" : item.status === "In use" ? "busy" : "limited"}`}>
                          <i /> {item.status}
                        </span>
                        <span className="resource-id-tag">LL-0{item.id}</span>
                      </div>
                      <div className="resource-body">
                        <div className="resource-type-meta">{item.category} · {item.department}</div>
                        <h3>{item.name}</h3>
                        <p className="resource-description">{item.description}</p>
                        <div className="spec-list">
                          {item.specs.map((s) => <span key={s}>{s}</span>)}
                        </div>
                        <div className="resource-meta">
                          <span><MapPin size={13} /> {item.location}</span>
                          <span><Clock3 size={13} /> {item.next}</span>
                        </div>
                        <div className="resource-actions">
                          <button className="details-btn" onClick={() => setSelectedEquipment(item)}>Details</button>
                          <button
                            className="reserve-btn"
                            disabled={item.status !== "Available"}
                            onClick={() => { setSelectedEquipment(item); setShowBookingModal(true); }}
                          >
                            {item.status === "Available" ? "Book Equipment" : item.status} <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        );

      // 2. FACULTY VIEW
      case "faculty":
        const pendingFacultyBookings = bookings.filter((b) => b.workflowStage === "pending_faculty");
        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> FACULTY & PROJECT GUIDE DASHBOARD</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Review student booking requests, endorse project suitability, and mentor academic research.</p>
              </div>
              <div className="campus-status">
                <span className="status-beacon" />
                {pendingFacultyBookings.length} Requests Awaiting Your Endorsement
              </div>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Pending Requests <Clock3 size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">{pendingFacultyBookings.length}</div>
                <div className="kpi-tile-foot">Need faculty endorsement</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Active Mentees <Users size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">14</div>
                <div className="kpi-tile-foot">Across 4 research teams</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Endorsed This Month <CheckCircle2 size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">29</div>
                <div className="kpi-tile-foot">96% approval rate</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Safety Compliance <ShieldCheck size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">100%</div>
                <div className="kpi-tile-foot">Zero safety violations</div>
              </div>
            </div>

            <div className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">STEP 2 IN BOOKING WORKFLOW</div>
                  <h2>Student Equipment Booking Requests</h2>
                  <p>Endorse requests to verify academic suitability and forward to the Lab Administrator for physical allocation.</p>
                </div>
              </div>

              {pendingFacultyBookings.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={36} color="var(--accent-green)" />
                  <strong>No pending requests</strong>
                  <p>All student requests under your guidance have been endorsed or reviewed.</p>
                </div>
              ) : (
                <div className="approval-queue">
                  {pendingFacultyBookings.map((b) => (
                    <article className="approval-card" key={b.id}>
                      <div className="approval-left">
                        <div className="approval-avatar">
                          <Lightbulb size={24} />
                        </div>
                        <div className="approval-info">
                          <h3>{b.studentName} <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({b.studentId})</span></h3>
                          <p>
                            Project: <strong>{b.projectTitle}</strong> · Requesting: <strong style={{ color: "var(--primary)" }}>{b.equipmentName}</strong>
                          </p>
                          <div className="approval-meta">
                            <span><CalendarDays size={13} /> {b.date} ({b.timeSlot})</span>
                            <span><MapPin size={13} /> {b.labLocation}</span>
                            <span><FileText size={13} /> Purpose: &quot;{b.academicPurpose}&quot;</span>
                          </div>
                        </div>
                      </div>

                      <div className="approval-score-badge">
                        <TrendingUp size={14} /> Priority Score: {b.priorityScore}/100
                      </div>

                      <div className="approval-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleFacultyDecision(b.id, "approve")}
                        >
                          <Check size={14} /> Endorse Request
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleFacultyDecision(b.id, "reject")}
                        >
                          <X size={14} /> Reject with Note
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      // 3. TECHNICIAN VIEW
      case "technician":
        const handoverQueue = bookings.filter((b) => b.workflowStage === "approved_ready");
        const activeUsageQueue = bookings.filter((b) => b.workflowStage === "in_use");

        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> LAB TECHNICIAN DESK</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Manage physical equipment handover, inspect returned instruments, and log maintenance tickets.</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="primary-button" onClick={() => setShowNewEquipmentModal(true)}>
                  <Plus size={16} /> Add Equipment
                </button>
              </div>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Ready for Handover <CheckSquare size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">{handoverQueue.length}</div>
                <div className="kpi-tile-foot">Student pickup pending</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Currently In Use <Activity size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">{activeUsageQueue.length}</div>
                <div className="kpi-tile-foot">Checked out in lab</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Total Lab Units <Package size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">{equipment.length}</div>
                <div className="kpi-tile-foot">Under your supervision</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Maintenance Alerts <Wrench size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">{maintenance.filter((m) => m.status !== "Resolved").length}</div>
                <div className="kpi-tile-foot">Calibration needed</div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ArrowRight size={18} color="var(--primary)" /> Ready for Handover ({handoverQueue.length})
                </h3>
                <p>Bookings approved by Faculty and Administrator. Ready for student checkout.</p>

                {handoverQueue.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No students currently waiting for equipment handover.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {handoverQueue.map((b) => (
                      <div key={b.id} style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong>{b.equipmentName}</strong>
                            <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "2px" }}>
                              Student: {b.studentName} ({b.studentId})
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Slot: {b.date} · {b.timeSlot}
                            </div>
                          </div>
                          <button className="btn-action-sm btn-success" onClick={() => handleTechnicianHandover(b.id)}>
                            <Check size={13} /> Check Out & Handover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="analytics-card">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RefreshCw size={18} color="var(--accent-teal)" /> In-Lab Usage & Returns ({activeUsageQueue.length})
                </h3>
                <p>Currently operated by students in laboratories. Record safe return.</p>

                {activeUsageQueue.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No equipment currently checked out.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeUsageQueue.map((b) => (
                      <div key={b.id} style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <strong style={{ color: "var(--primary)" }}>{b.equipmentName}</strong>
                            <div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
                              Held by: {b.studentName} ({b.labLocation})
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "2px" }}>
                              Note: {b.handoverCondition}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="btn-action-sm btn-success"
                              title="Return in Good Working Condition"
                              onClick={() => handleTechnicianReturn(b.id, "Good")}
                            >
                              <Check size={12} /> Return Good
                            </button>
                            <button
                              className="btn-action-sm btn-danger"
                              title="Return with Damage / Calibration Flag"
                              onClick={() => handleTechnicianReturn(b.id, "Needs Maintenance")}
                            >
                              <AlertTriangle size={12} /> Issue Flag
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );

      // 4. ADMIN VIEW
      case "admin":
        const pendingAdminAllocations = bookings.filter((b) => b.workflowStage === "pending_admin");

        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> CENTRAL LAB ADMINISTRATOR PORTAL</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Cross-department allocation oversight, conflict resolution, double-booking prevention, and policy enforcement.</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className={`secondary-button ${requireFacultyApproval ? "" : "active"}`}
                  onClick={() => {
                    setRequireFacultyApproval(!requireFacultyApproval);
                    showToast(`Policy updated: Faculty pre-approval is now ${!requireFacultyApproval ? "ENFORCED" : "BYPASSED"}`);
                  }}
                >
                  <Settings size={15} /> Faculty Approval: {requireFacultyApproval ? "Mandatory" : "Bypassed"}
                </button>
              </div>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Allocation Queue <UserCheck size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">{pendingAdminAllocations.length}</div>
                <div className="kpi-tile-foot">Awaiting final authorization</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Schedule Collision Checks <ShieldCheck size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">100% Passed</div>
                <div className="kpi-tile-foot">Deterministic engine active</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Active Technicians <Users size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">6 Staff</div>
                <div className="kpi-tile-foot">Assigned to 8 facilities</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Cross-Dept Shares <ArrowLeftRight size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">48 Bookings</div>
                <div className="kpi-tile-foot">34% above average</div>
              </div>
            </div>

            <div className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">STEP 3 IN WORKFLOW</div>
                  <h2>Central Allocation & Slot Collision Queue</h2>
                  <p>Verify institutional allocation rules and finalize resource reservation before dispatching to lab technicians.</p>
                </div>
              </div>

              {pendingAdminAllocations.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={36} color="var(--accent-green)" />
                  <strong>Allocation Queue Clear</strong>
                  <p>All faculty-endorsed requests have been authorized and dispatched to laboratory technicians.</p>
                </div>
              ) : (
                <div className="approval-queue">
                  {pendingAdminAllocations.map((b) => (
                    <article className="approval-card" key={b.id}>
                      <div className="approval-left">
                        <div className="approval-avatar">
                          <ShieldCheck size={26} />
                        </div>
                        <div className="approval-info">
                          <h3>{b.studentName} · <span style={{ color: "var(--primary)" }}>{b.equipmentName}</span></h3>
                          <p>
                            Project: <strong>{b.projectTitle}</strong> · Facility: <em>{b.labLocation}</em>
                          </p>
                          <div className="approval-meta">
                            <span><CalendarDays size={13} /> {b.date} · {b.timeSlot}</span>
                            <span><CheckCircle2 size={13} color="var(--accent-green)" /> Faculty Endorsement: &quot;{b.facultyComments || "Endorsed"}&quot;</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        <span className="status-tag approved"><Check size={12} /> Conflict Free (Engine Verified)</span>
                        <div className="approval-score-badge">
                          <TrendingUp size={14} /> Score: {b.priorityScore}/100
                        </div>
                      </div>

                      <div className="approval-actions">
                        <button className="approve-btn" onClick={() => handleAdminDecision(b.id, "approve")}>
                          <Check size={14} /> Authorize Allocation
                        </button>
                        <button className="reject-btn" onClick={() => handleAdminDecision(b.id, "reject")}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      // 5. HOD VIEW
      case "hod":
        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> DEPARTMENT HEAD (HOD) DASHBOARD</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Department laboratory asset audits, research utilization bottlenecks, and capital procurement insights.</p>
              </div>
              <button className="primary-button" onClick={() => showToast("Exporting Department Laboratory Audit Report...")}>
                <Download size={15} /> Export Audit Report
              </button>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Department Assets <Package size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">48 Units</div>
                <div className="kpi-tile-foot">Valued at $480,000</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Avg Lab Utilization <Gauge size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">81%</div>
                <div className="kpi-tile-foot"><span className="trend-up">↑ 14% vs last year</span></div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Cross-Dept Income <TrendingUp size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">$18,400</div>
                <div className="kpi-tile-foot">Reinvested in lab consumables</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Critical Bottlenecks <AlertTriangle size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">1 Item</div>
                <div className="kpi-tile-foot">GPU Cluster oversubscribed</div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Laboratory Space Efficiency</h3>
                <p>Real-time machine and instrumentation load across departmental facilities.</p>
                {[
                  { lab: "Block C · AI & Deep Learning Lab", pct: 92 },
                  { lab: "Block C · IoT & Embedded Lab", pct: 78 },
                  { lab: "Block A · Signal & RF Lab", pct: 64 },
                  { lab: "Block B · Mechanical Prototyping", pct: 58 }
                ].map((item) => (
                  <div className="bar-chart-row" key={item.lab}>
                    <span className="bar-label">{item.lab}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="bar-val">{item.pct}%</span>
                  </div>
                ))}
              </div>

              <div className="analytics-card">
                <h3>Bottlenecks & Capital Recommendations</h3>
                <p>AI identified equipment exceeding 85% continuous booking duty cycle.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ background: "var(--accent-amber-light)", color: "var(--text-main)", padding: "14px", borderRadius: "10px", fontSize: "12px" }}>
                    <strong>Bottleneck Alert: NVIDIA GPU Cluster</strong>
                    <p style={{ margin: "4px 0", color: "var(--text-sub)" }}>
                      92% utilization rate across 47 project bookings this month. Average wait time is 4.2 days.
                    </p>
                    <span style={{ fontWeight: 700, color: "var(--accent-amber)" }}>Recommendation: Procure 2 additional RTX A5000 nodes in FY27 budget.</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      // 6. MANAGEMENT VIEW
      case "management":
        return (
          <>
            <section className="welcome-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> INSTITUTION-LEVEL COLLEGE MANAGEMENT</div>
                <h1>{timeGreeting.greeting}, {persona.name} <span style={{ marginLeft: "6px" }}>{timeGreeting.emoji}</span></h1>
                <p className="welcome-subtitle">Campus-wide laboratory asset governance, cross-department resource sharing ROI, and capital planning.</p>
              </div>
              <button className="primary-button" onClick={() => showToast("Exporting Annual Institutional Research Infrastructure Report...")}>
                <Download size={15} /> Institutional Summary (PDF)
              </button>
            </section>

            <div className="kpi-row">
              <div className="kpi-tile">
                <div className="kpi-tile-header">Total Laboratories <Building2 size={16} color="var(--primary)" /></div>
                <div className="kpi-tile-num">24 Labs</div>
                <div className="kpi-tile-foot">Across 6 academic divisions</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Total Asset Inventory <Package size={16} color="var(--accent-teal)" /></div>
                <div className="kpi-tile-num">248 Units</div>
                <div className="kpi-tile-foot">Valued at $2,420,000</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Campus-Wide Utilization <Gauge size={16} color="var(--accent-green)" /></div>
                <div className="kpi-tile-num">76.4%</div>
                <div className="kpi-tile-foot"><span className="trend-up">↑ 22% from resource sharing</span></div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-tile-header">Estimated Capital Saved <TrendingUp size={16} color="var(--accent-amber)" /></div>
                <div className="kpi-tile-num">$142,500</div>
                <div className="kpi-tile-foot">Avoided duplicate procurement</div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Department-Wise Equipment Distribution</h3>
                <p>Asset counts and capital deployment across college schools.</p>
                {[
                  { dept: "Computer Science & Artificial Intelligence", count: "72 units ($780K)", pct: 86 },
                  { dept: "Electronics & Communication Engineering", count: "58 units ($620K)", pct: 75 },
                  { dept: "Mechanical & Robotics Fab Lab", count: "44 units ($450K)", pct: 68 },
                  { dept: "Electrical & Embedded Systems", count: "38 units ($340K)", pct: 59 },
                  { dept: "Chemical & Nanomaterials", count: "36 units ($230K)", pct: 54 }
                ].map((item) => (
                  <div className="bar-chart-row" key={item.dept}>
                    <span className="bar-label" style={{ width: "220px" }}>{item.dept}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="bar-val" style={{ width: "90px", fontSize: "11px" }}>{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="analytics-card">
                <h3>Inter-Department Sharing Impact (ROI)</h3>
                <p>Key metrics proving the efficacy of LabLink Nexus campus-wide deployment.</p>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "14px" }}>
                    <strong style={{ fontSize: "15px" }}>38% Increase in Inter-disciplinary Capstones</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--text-sub)", fontSize: "12px" }}>
                      Computer Science students successfully utilized Mechanical 3D printers and ECE spectrum analyzers without purchase friction.
                    </p>
                  </div>
                  <div style={{ borderLeft: "4px solid var(--accent-green)", paddingLeft: "14px" }}>
                    <strong style={{ fontSize: "15px" }}>$142,500 Budget Optimized</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--text-sub)", fontSize: "12px" }}>
                      Three redundant instrument procurement requests were converted into shared campus bookings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <main className="app-shell">
      {/* --- ~3 SECONDS INTRO SPLASH SCREEN --- */}
      {showIntro && (
        <div
          className={`intro-splash ${introFading ? "fading-out" : ""}`}
          role="status"
          aria-label="Loading LabLink Nexus"
        >
          <div className="living-lab-grid" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
          <div className="intro-bg-glow" />
          <div className="intro-logo-wrap">
            <img src="/logo.png" alt="LabLink Nexus Logo" className="intro-logo-img" />
          </div>
          <div className="intro-brand-title">LabLink Nexus</div>
          <div className="intro-tagline">Discover. Allocate. Innovate.</div>
          <div className="intro-progress-bar" aria-hidden="true">
            <div className="intro-progress-fill" />
          </div>
          <div className="intro-status-text">Initializing university research laboratories...</div>
          <button className="intro-skip-btn" onClick={handleSkipIntro} aria-label="Skip splash screen">
            Skip Intro →
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        {/* Brand Lockup with Image Logo */}
        <div className="brand-lockup">
          <div className="brand-logo-wrap">
            <img src="/logo.png" alt="LabLink Nexus Logo" className="brand-logo-img" />
          </div>
          <div>
            <div className="brand-title">LabLink<span className="brand-badge">NEXUS</span></div>
            <small className="brand-subtitle">Campus resource network</small>
          </div>
          <button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        {/* Current Stakeholder Badge & Switch Button */}
        <div style={{ padding: "0 4px 16px" }}>
          <div
            className="role-pill"
            onClick={handleInitiateSwitchRole}
            title="Click to switch stakeholder role"
            style={{ cursor: "pointer" }}
          >
            <div className="avatar" style={{ width: "28px", height: "28px", fontSize: "10px" }}>
              {persona.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {persona.name}
              </div>
              <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 700 }}>
                {persona.badge}
              </div>
            </div>
            <span className="role-switch-btn" style={{ padding: "4px 8px", fontSize: "10px" }}>
              Switch
            </span>
          </div>
        </div>

        <div className="workspace-label">{persona.badge} Navigation</div>
        <nav className="side-nav" aria-label="Role navigation">
          {getNavItemsForRole().map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              className={`nav-item ${activeTab === label ? "nav-active" : ""}`}
              onClick={() => { setActiveTab(label); setMobileMenu(false); }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count !== undefined && count > 0 && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-label" style={{ marginTop: "24px" }}>System</div>
        <nav className="side-nav" aria-label="System navigation">
          <button
            className={`nav-item ${activeTab === "Overview" ? "nav-active" : ""}`}
            onClick={() => { setActiveTab("Overview"); setMobileMenu(false); }}
          >
            <Compass size={18} />
            <span>Story &amp; Overview</span>
          </button>
          <button className="nav-item" onClick={() => { setMobileMenu(false); handleInitiateSwitchRole(); }}>
            <UserCheck size={18} />
            <span>Switch Role ({persona.badge})</span>
          </button>
          <button className="nav-item" onClick={handleReplayIntro}>
            <RotateCcw size={18} />
            <span>Replay Intro Logo</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        {/* Role Quick Guide Card */}
        <div className="help-card">
          <div className="help-icon"><CircleHelp size={16} /></div>
          <strong>{persona.badge} Mode</strong>
          <p>{persona.summary}</p>
          <button onClick={handleInitiateSwitchRole}>
            Change Stakeholder <ArrowRight size={13} />
          </button>
        </div>

        {/* Sidebar Profile Footer */}
        <div
          className="sidebar-profile"
          onClick={handleInitiateSwitchRole}
          style={{ cursor: "pointer" }}
          title="Click to switch stakeholder persona"
        >
          <div className="avatar">{persona.avatar}</div>
          <div className="profile-copy">
            <strong>{persona.name}</strong>
            <small>{persona.subtitle}</small>
          </div>
          <button
            className="icon-button"
            style={{ marginLeft: "auto", width: "28px", height: "28px" }}
            aria-label="Switch Role"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <section className="main-panel">
        {/* Apple-style Topbar Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div className="apple-nav-links" style={{ display: "flex", gap: "6px" }}>
              <button
                className={`apple-nav-link ${activeTab === "Overview" ? "active" : ""}`}
                onClick={() => setActiveTab("Overview")}
              >
                Story &amp; Overview
              </button>
              <button
                className={`apple-nav-link ${activeTab === "Equipment Catalogue" ? "active" : ""}`}
                onClick={() => setActiveTab("Equipment Catalogue")}
              >
                Equipment Discovery
              </button>
              <button
                className={`apple-nav-link ${activeTab === "Dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("Dashboard")}
              >
                Workspace ({persona.badge})
              </button>
              <button
                className={`apple-nav-link ${activeTab === "AI Recommendations" ? "active" : ""}`}
                onClick={() => setActiveTab("AI Recommendations")}
              >
                AI Recommender
              </button>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Demo Access Pill / Persistent Switch Role Control */}
            <button
              className="role-pill switch-role-pill"
              onClick={handleInitiateSwitchRole}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                background: "var(--bg-glass)",
                border: "1px solid var(--border-subtle)",
                color: "inherit"
              }}
              title="Click to switch stakeholder persona"
              aria-label={`Current stakeholder role: ${persona.badge}. Click to switch.`}
            >
              <span className="status-beacon" />
              <ArrowLeftRight size={13} style={{ marginRight: 4, color: "var(--primary)" }} />
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Role: <strong>{persona.badge}</strong></span>
              <span className="role-switch-btn" style={{ padding: "3px 8px", fontSize: "10px", marginLeft: 4 }}>Switch</span>
            </button>

            {/* Replay Intro Button */}
            <button
              className="icon-button"
              onClick={handleReplayIntro}
              title="Play 2.5s Intro Logo Animation"
              aria-label="Replay Intro"
            >
              <RotateCcw size={16} />
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Interactive Notification Center */}
            <div className="notification-trigger-wrap" ref={notifRef}>
              <button
                className={`icon-button ${showNotificationPanel ? "active" : ""}`}
                aria-label={`Notifications and updates (${unreadCount} unread)`}
                aria-expanded={showNotificationPanel}
                onClick={() => setShowNotificationPanel((prev) => !prev)}
                title="Notifications & Updates"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-count-badge" aria-label={`${unreadCount} unread notifications`}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationPanel && (
                <div
                  className="notification-flyout"
                  role="region"
                  aria-label="Notification Center"
                >
                  <div className="notif-header">
                    <div className="notif-header-title">
                      <Bell size={16} color="var(--role-accent)" />
                      <span>Notifications &amp; Updates</span>
                      {unreadCount > 0 && (
                        <span className="notif-unread-pill">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="notif-header-actions">
                      {unreadCount > 0 && (
                        <button
                          className="text-button"
                          onClick={handleMarkAllRead}
                          style={{ fontSize: "11px", fontWeight: 700, color: "var(--role-accent)", cursor: "pointer", background: "none", border: "none" }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        className="icon-button"
                        style={{ width: "24px", height: "24px" }}
                        onClick={() => setShowNotificationPanel(false)}
                        aria-label="Close notifications"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="notif-filter-tabs">
                    <button
                      className={`notif-filter-tab ${notifFilter === "all" ? "active" : ""}`}
                      onClick={() => setNotifFilter("all")}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      className={`notif-filter-tab ${notifFilter === "unread" ? "active" : ""}`}
                      onClick={() => setNotifFilter("unread")}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      className={`notif-filter-tab ${notifFilter === "high" ? "active" : ""}`}
                      onClick={() => setNotifFilter("high")}
                    >
                      High Priority ({notifications.filter((n) => n.priority === "high").length})
                    </button>
                  </div>

                  <div className="notif-list">
                    {filteredNotifications.length === 0 ? (
                      <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                        <CheckCircle2 size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>All Caught Up!</div>
                        <small style={{ fontSize: "11px" }}>No active updates for this filter.</small>
                      </div>
                    ) : (
                      filteredNotifications.map((item) => (
                        <div
                          key={item.id}
                          className={`notif-item ${item.unread ? "unread" : ""}`}
                          onClick={() => handleMarkItemRead(item.id)}
                        >
                          <div
                            className="notif-icon-box"
                            style={{
                              background:
                                item.category === "approval"
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : item.category === "maintenance"
                                  ? "rgba(245, 158, 11, 0.15)"
                                  : item.category === "booking"
                                  ? "rgba(99, 102, 241, 0.15)"
                                  : "rgba(20, 184, 166, 0.15)",
                              color:
                                item.category === "approval"
                                  ? "#a78bfa"
                                  : item.category === "maintenance"
                                  ? "#fbbf24"
                                  : item.category === "booking"
                                  ? "#818cf8"
                                  : "#2dd4bf"
                            }}
                          >
                            {item.category === "approval" ? (
                              <CheckSquare size={16} />
                            ) : item.category === "maintenance" ? (
                              <Wrench size={16} />
                            ) : item.category === "booking" ? (
                              <CalendarDays size={16} />
                            ) : (
                              <Sparkles size={16} />
                            )}
                          </div>

                          <div className="notif-content">
                            <div className="notif-title-row">
                              <span className="notif-title">{item.title}</span>
                              <span className="notif-time">{item.timestamp}</span>
                            </div>
                            <p className="notif-desc">{item.message}</p>
                            {item.actionLabel && (
                              <button
                                className="notif-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotifAction(item);
                                }}
                              >
                                {item.actionLabel} <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-footer">
                    <span style={{ color: "var(--text-muted)" }}>
                      Role: <strong>{persona.badge}</strong>
                    </span>
                    {notifications.length > 0 && (
                      <button
                        className="text-button"
                        onClick={handleClearAllNotifs}
                        style={{ fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="avatar" style={{ width: "34px", height: "34px", fontSize: "11px" }}>
              {persona.avatar}
            </div>
          </div>
        </header>

        {/* Dynamic Content Wrap */}
        <div className="content-wrap">
          {/* Demo Access Notice Banner */}
          <div className="demo-banner">
            <div>
              <strong>DEMO ACCESS ACTIVE:</strong> Currently exploring as <strong>{persona.name} ({persona.roleTitle})</strong>. All 6 stakeholder roles are pre-configured for evaluation.
            </div>
            <button
              className="role-switch-btn"
              onClick={() => setShowRoleModal(true)}
            >
              <UserCheck size={14} /> Switch Stakeholder Role
            </button>
          </div>

          {/* Render Active View: Apple Overview, Dashboard, or Dedicated Sub-Views */}
          {activeTab === "Overview" && renderAppleOverview()}
          {activeTab === "Dashboard" && renderRoleDashboard()}

          {/* Sub-view: Equipment Catalogue / Lab Inventory / Facility Equipment */}
          {(activeTab === "Equipment Catalogue" || activeTab === "Lab Catalogue" || activeTab === "Facility Equipment" || activeTab === "Lab Inventory") && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">CAMPUS EQUIPMENT CATALOGUE</div>
                  <h2>Browse Equipment & Laboratories</h2>
                  <p>Discover real-time instrument availability across university departments.</p>
                </div>
                {["technician", "admin"].includes(currentRole) && (
                  <button className="primary-button" onClick={() => setShowNewEquipmentModal(true)}>
                    <Plus size={16} /> Add New Equipment
                  </button>
                )}
              </div>

              {/* Filters Toolbar */}
              <div className="search-toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    placeholder="Search equipment, specs, department, or lab room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="filter-wrap">
                  <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Instrument">Instrument</option>
                    <option value="Dev kit">Dev kit</option>
                    <option value="Workstation">Workstation</option>
                  </select>

                  <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    {Array.from(new Set(equipment.map((e) => e.department))).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select className="filter-select" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Available">Available now</option>
                    <option value="In use">In use</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Apple-style Equipment Grid */}
              <div className="apple-equipment-grid">
                {filteredEquipment.map((item) => (
                  <article className="apple-product-card" key={item.id}>
                    <div className="product-card-media">
                      <img
                        src={item.image || "/logo.png"}
                        alt={item.name}
                        className="product-card-img"
                        loading="lazy"
                      />
                      <div className="product-card-status-pill">
                        <span
                          className={`status-dot ${
                            item.status === "Available"
                              ? "dot-available"
                              : item.status === "In use"
                              ? "dot-in-use"
                              : "dot-booked"
                          }`}
                        />
                        {item.status}
                      </div>
                      <div className="product-card-dept-tag">
                        {item.department}
                      </div>
                    </div>

                    <div className="product-card-body">
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                        {item.category} · {item.modelNumber || "VERIFIED ASSET"}
                      </div>
                      <h3 className="product-card-title">{item.name}</h3>
                      <div className="product-card-location">
                        <MapPin size={12} /> {item.location} · Tech: {item.assignedTechnician}
                      </div>
                      <p className="product-card-desc">{item.description}</p>
                      <div className="product-specs-pills">
                        {item.specs.map((s) => (
                          <span key={s} className="spec-chip">{s}</span>
                        ))}
                      </div>

                      <div className="product-actions">
                        <button
                          className="btn-apple-details"
                          onClick={() => setSelectedEquipment(item)}
                        >
                          Quick Specs
                        </button>
                        {currentRole === "student" ? (
                          <button
                            className="btn-apple-reserve"
                            disabled={item.status !== "Available"}
                            onClick={() => handleOpenBooking(item)}
                          >
                            {item.status === "Available" ? "Book Equipment" : item.status} <ArrowRight size={13} />
                          </button>
                        ) : ["technician", "admin"].includes(currentRole) ? (
                          <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                            <select
                              value={item.status}
                              onChange={(e) => handleToggleEquipmentStatus(item.id, e.target.value as EquipmentStatus)}
                              className="filter-select"
                              style={{ flex: 1, padding: "6px 8px", fontSize: "0.78rem" }}
                              title="Change Operational Status"
                            >
                              <option value="Available">Set Available</option>
                              <option value="Booked">Set Booked</option>
                              <option value="In use">Set In use</option>
                              <option value="Under Maintenance">Set Maintenance</option>
                              <option value="Out of Service">Set Out of Service</option>
                            </select>
                          </div>
                        ) : (
                          <button
                            className="btn-apple-details"
                            style={{ flex: 1, color: "var(--primary)" }}
                            onClick={() => showToast(`Selected ${item.name} for status inspection`)}
                          >
                            View Asset History
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Sub-view: My Projects / Mentee Projects */}
          {(activeTab === "My Projects" || activeTab === "Mentee Projects") && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">RESEARCH PROJECTS</div>
                  <h2>Academic Projects & Research Portfolios</h2>
                  <p>Projects linked with laboratory equipment allocations and target evaluation milestones.</p>
                </div>
                {currentRole === "student" && (
                  <button className="primary-button" onClick={() => setShowProjectModal(true)}>
                    <Plus size={16} /> Create Project
                  </button>
                )}
              </div>

              <div className="projects-grid">
                {projects.map((p) => (
                  <article className="project-card" key={p.id}>
                    <div className="project-card-top">
                      <div>
                        <span className="resource-type-meta">{p.department}</span>
                        <h3>{p.title}</h3>
                        <small style={{ color: "var(--text-muted)" }}>Lead: {p.studentName}</small>
                      </div>
                      <span className={`project-status-badge ${p.status}`}>{p.status}</span>
                    </div>
                    <p>{p.description}</p>
                    <div className="project-progress-wrap">
                      <div className="project-progress-labels">
                        <span>Milestone Progress</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="project-progress-bar">
                        <div className="project-progress-fill" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                        ALLOCATED HARDWARE
                      </span>
                      <div className="spec-list">
                        {p.equipment.map((eq) => (
                          <span key={eq} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{eq}</span>
                        ))}
                      </div>
                    </div>
                    <div className="project-card-foot">
                      <span>Target: <strong>{p.deadline}</strong></span>
                      <button className="text-button" onClick={() => { setActiveTab("Equipment Catalogue"); }}>
                        Reserve Equipment <ArrowRight size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Sub-view: My Bookings / Booking History */}
          {activeTab === "My Bookings" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">RESERVATIONS & BOOKING PASSES</div>
                  <h2>My Equipment Reservations</h2>
                  <p>Track your scheduled time slots, approval stages, and lab checkouts.</p>
                </div>
                <button className="primary-button" onClick={() => setActiveTab("Equipment Catalogue")}>
                  <Plus size={16} /> New Booking
                </button>
              </div>

              <div className="bookings-table-wrap">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Equipment</th>
                      <th>Project</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Workflow Stage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings
                      .filter((b) => currentRole !== "student" || b.studentName === "Alex Kumar")
                      .map((b) => (
                        <tr key={b.id}>
                          <td><strong style={{ fontFamily: "monospace" }}>{b.id}</strong></td>
                          <td><strong>{b.equipmentName}</strong></td>
                          <td>{b.projectTitle}</td>
                          <td>{b.date} · {b.timeSlot}</td>
                          <td>{b.labLocation}</td>
                          <td>
                            <span className={`status-tag ${getWorkflowBadge(b.workflowStage).class}`}>
                              {getWorkflowBadge(b.workflowStage).label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="secondary-button"
                                style={{ padding: "5px 10px", fontSize: "11px" }}
                                onClick={() => setShowWorkflowModal(b)}
                              >
                                <Eye size={12} /> View Lifecycle
                              </button>
                              {b.workflowStage === "approved_ready" && (
                                <button
                                  className="secondary-button"
                                  style={{ padding: "5px 10px", fontSize: "11px", color: "var(--accent-green)" }}
                                  onClick={() => showToast(`LabPass for ${b.id} ready! Present to technician at ${b.labLocation}.`)}
                                >
                                  <Download size={12} /> Pass
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sub-view: Student Requests (Faculty Dedicated Tab) */}
          {activeTab === "Student Requests" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">FACULTY QUEUE</div>
                  <h2>Student Booking Endorsement Queue</h2>
                  <p>Review student project justifications and forward endorsed hardware allocations to lab administration.</p>
                </div>
              </div>

              <div className="approval-queue">
                {bookings.filter((b) => b.workflowStage === "pending_faculty").map((b) => (
                  <article className="approval-card" key={b.id}>
                    <div className="approval-left">
                      <div className="approval-avatar">
                        <Lightbulb size={24} />
                      </div>
                      <div className="approval-info">
                        <h3>{b.studentName} <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({b.studentId})</span></h3>
                        <p>Project: <strong>{b.projectTitle}</strong> · Hardware: <strong>{b.equipmentName}</strong></p>
                        <div className="approval-meta">
                          <span><CalendarDays size={13} /> {b.date} ({b.timeSlot})</span>
                          <span><MapPin size={13} /> {b.labLocation}</span>
                          <span><FileText size={13} /> Purpose: &quot;{b.academicPurpose}&quot;</span>
                        </div>
                      </div>
                    </div>
                    <div className="approval-score-badge">
                      <TrendingUp size={14} /> Priority Score: {b.priorityScore}/100
                    </div>
                    <div className="approval-actions">
                      <button className="approve-btn" onClick={() => handleFacultyDecision(b.id, "approve")}>
                        <Check size={14} /> Endorse Request
                      </button>
                      <button className="reject-btn" onClick={() => handleFacultyDecision(b.id, "reject")}>
                        <X size={14} /> Reject with Note
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Sub-view: Handover & Returns (Technician Dedicated Tab) */}
          {activeTab === "Handover & Returns" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">EQUIPMENT DESK</div>
                  <h2>Physical Checkouts & Return Station</h2>
                  <p>Verify student identity, checkout hardware, and log condition upon return.</p>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Ready for Handover ({bookings.filter((b) => b.workflowStage === "approved_ready").length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                    {bookings.filter((b) => b.workflowStage === "approved_ready").map((b) => (
                      <div key={b.id} style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                        <strong>{b.equipmentName}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-sub)" }}>Student: {b.studentName} ({b.studentId})</div>
                        <button className="btn-action-sm btn-success" style={{ marginTop: "8px" }} onClick={() => handleTechnicianHandover(b.id)}>
                          <Check size={12} /> Confirm Student Handover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3>Active In-Lab Usage ({bookings.filter((b) => b.workflowStage === "in_use").length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                    {bookings.filter((b) => b.workflowStage === "in_use").map((b) => (
                      <div key={b.id} style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                        <strong>{b.equipmentName}</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-sub)" }}>Held by: {b.studentName}</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          <button className="btn-action-sm btn-success" onClick={() => handleTechnicianReturn(b.id, "Good")}>
                            <Check size={12} /> Return (Good)
                          </button>
                          <button className="btn-action-sm btn-danger" onClick={() => handleTechnicianReturn(b.id, "Needs Maintenance")}>
                            <AlertTriangle size={12} /> Maintenance Flag
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: Maintenance Tickets */}
          {activeTab === "Maintenance Tickets" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">EQUIPMENT MAINTENANCE & CALIBRATION</div>
                  <h2>Laboratory Maintenance Tickets</h2>
                  <p>Log calibration tickets, repair schedules, and replacement parts tracking.</p>
                </div>
                <button className="primary-button" onClick={() => setShowMaintenanceModal(true)}>
                  <Plus size={16} /> Log New Ticket
                </button>
              </div>

              <div className="bookings-table-wrap">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Equipment</th>
                      <th>Department</th>
                      <th>Technician</th>
                      <th>Reported Issue</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.id}</strong></td>
                        <td><strong>{m.equipmentName}</strong></td>
                        <td>{m.department}</td>
                        <td>{m.technician}</td>
                        <td style={{ maxWidth: "250px" }}>{m.issue}</td>
                        <td>
                          <span className={`status-tag ${m.severity === "Critical" ? "rejected" : m.severity === "High" ? "pending" : "approved"}`}>
                            {m.severity}
                          </span>
                        </td>
                        <td>
                          <span className="status-tag completed">{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sub-view: Allocation Queue (Admin Dedicated Tab) */}
          {activeTab === "Allocation Queue" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">ADMINISTRATION QUEUE</div>
                  <h2>Central Resource Allocation & Conflict Verification</h2>
                  <p>Final sign-off confirming timeslot allocation and collision prevention.</p>
                </div>
              </div>

              <div className="approval-queue">
                {bookings.filter((b) => b.workflowStage === "pending_admin").map((b) => (
                  <article className="approval-card" key={b.id}>
                    <div className="approval-left">
                      <div className="approval-avatar"><ShieldCheck size={26} /></div>
                      <div className="approval-info">
                        <h3>{b.studentName} · <span style={{ color: "var(--primary)" }}>{b.equipmentName}</span></h3>
                        <p>Project: <strong>{b.projectTitle}</strong> · Facility: <em>{b.labLocation}</em></p>
                        <div className="approval-meta">
                          <span><CalendarDays size={13} /> {b.date} ({b.timeSlot})</span>
                          <span><CheckCircle2 size={13} color="var(--accent-green)" /> Faculty Endorsed</span>
                        </div>
                      </div>
                    </div>
                    <div className="approval-score-badge">
                      <TrendingUp size={14} /> Priority Score: {b.priorityScore}/100
                    </div>
                    <div className="approval-actions">
                      <button className="approve-btn" onClick={() => handleAdminDecision(b.id, "approve")}>
                        <Check size={14} /> Authorize Allocation
                      </button>
                      <button className="reject-btn" onClick={() => handleAdminDecision(b.id, "reject")}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Sub-view: Schedule & Conflict Matrix (Admin Dedicated Tab) */}
          {activeTab === "Schedule & Conflict Matrix" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">LABORATORY SCHEDULES</div>
                  <h2>Campus Timeslot Allocation Matrix</h2>
                  <p>Real-time half-open interval reservation view preventing double-booking.</p>
                </div>
              </div>

              <div className="bookings-table-wrap">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>09:00 - 11:00 AM</th>
                      <th>11:00 - 01:00 PM</th>
                      <th>02:00 - 04:00 PM</th>
                      <th>04:00 - 06:00 PM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { room: "Block C · AI Lab", s1: "Reserved (RTX A5000)", s2: "Reserved (RTX A5000)", s3: "Available", s4: "Maintenance Check" },
                      { room: "Block C · IoT Lab", s1: "Reserved (Raspberry Pi)", s2: "Available", s3: "Available", s4: "Available" },
                      { room: "Block A · Lab 204", s1: "Available", s2: "Available", s3: "Reserved (Oscilloscope)", s4: "Available" },
                      { room: "Block B · Fab Lab", s1: "In Use (3D Printer)", s2: "In Use (3D Printer)", s3: "Available", s4: "Available" }
                    ].map((row) => (
                      <tr key={row.room}>
                        <td><strong>{row.room}</strong></td>
                        <td><span className={`status-tag ${row.s1.includes("Reserved") || row.s1.includes("In Use") ? "in_use" : "completed"}`}>{row.s1}</span></td>
                        <td><span className={`status-tag ${row.s2.includes("Reserved") || row.s2.includes("In Use") ? "in_use" : "completed"}`}>{row.s2}</span></td>
                        <td><span className={`status-tag ${row.s3.includes("Reserved") ? "in_use" : "completed"}`}>{row.s3}</span></td>
                        <td><span className={`status-tag ${row.s4.includes("Maintenance") ? "rejected" : "completed"}`}>{row.s4}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sub-view: Institutional Policies (Admin Dedicated Tab) */}
          {activeTab === "Institutional Policies" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">GOVERNANCE & CONTROLS</div>
                  <h2>Institutional Laboratory Policies</h2>
                  <p>Configure cross-department sharing guidelines and approval gate requirements.</p>
                </div>
              </div>

              <div className="analytics-card" style={{ maxWidth: "700px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong>Mandatory Faculty Endorsement</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-sub)" }}>Require student requests to be endorsed by faculty guide before admin allocation.</p>
                  </div>
                  <button
                    className={`btn-action-sm ${requireFacultyApproval ? "btn-success" : "btn-danger"}`}
                    onClick={() => {
                      setRequireFacultyApproval(!requireFacultyApproval);
                      showToast(`Faculty Pre-Approval is now ${!requireFacultyApproval ? "Mandatory" : "Bypassed"}`);
                    }}
                  >
                    {requireFacultyApproval ? "Active (Mandatory)" : "Bypassed"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong>Maximum Continuous Booking Duration</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-sub)" }}>Prevent single-user equipment monopolization during peak project weeks.</p>
                  </div>
                  <span className="role-pill-badge">4 Hours / Session</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                  <div>
                    <strong>Deterministic Allocation Priority Weights</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-sub)" }}>Semester deadline (35%), verified suitability (30%), schedule flexibility (20%), past fairness (15%).</p>
                  </div>
                  <span className="status-tag approved">Active</span>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: Safety & Misuse Reports */}
          {activeTab === "Safety & Misuse Reports" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">SAFETY & COMPLIANCE DESK</div>
                  <h2>Equipment Safety & Misuse Incident Logs</h2>
                  <p>Log laboratory safety observations, improper handling, or damaged equipment.</p>
                </div>
                <button className="primary-button" onClick={() => showToast("Incident report logged and sent to safety committee.")}>
                  <AlertTriangle size={15} /> Log Safety Incident
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Active Safety Briefing Standards</h3>
                  <div style={{ display: "grid", gap: "8px", fontSize: "13px", marginTop: "12px" }}>
                    <div>✔ <strong>Level 1 (Basic Instrumentation):</strong> Clean bench rules, static ESD wristbands for microcontroller handling.</div>
                    <div>✔ <strong>Level 2 (High Energy / RF):</strong> Coaxial grounding and dummy loads for spectrum analyzers exceeding 1GHz.</div>
                    <div>✔ <strong>Level 3 (Rapid Fabrication):</strong> Eye protection and thermal hazard protocols for 3D printers and laser cutters.</div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3>Recent Compliance Reports</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                    <div style={{ background: "var(--accent-green-light)", color: "var(--text-main)", padding: "12px", borderRadius: "10px", fontSize: "12px" }}>
                      <strong>Zero Serious Violations Reported</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--text-sub)" }}>All 52 sessions this week passed technician checkout inspection without safety incident.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: Department Asset Audit / Campus Resource Metrics */}
          {(activeTab === "Department Asset Audit" || activeTab === "Campus Resource Metrics") && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">INSTITUTIONAL GOVERNANCE</div>
                  <h2>{activeTab === "Department Asset Audit" ? "Department Laboratory Asset Audit & Registry" : "Campus-Wide Facility Asset Intelligence"}</h2>
                  <p>Comprehensive registry of laboratory hardware, serial tags, calibration health, and maintenance schedules.</p>
                </div>
                <button className="primary-button" onClick={() => showToast("Exporting official Asset Audit Sheet (CSV)...")}>
                  <Download size={15} /> Export Audit Sheet
                </button>
              </div>

              <div className="kpi-row" style={{ marginBottom: "20px" }}>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Total Tracked Assets <Package size={16} color="var(--primary)" /></div>
                  <div className="kpi-tile-num">{equipment.length * 6} Units</div>
                  <div className="kpi-tile-foot">100% Barcoded &amp; Audited</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Operational Readiness <Gauge size={16} color="var(--accent-green)" /></div>
                  <div className="kpi-tile-num">95.4%</div>
                  <div className="kpi-tile-foot">Above accreditation target</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Under Maintenance <Wrench size={16} color="var(--accent-amber)" /></div>
                  <div className="kpi-tile-num">{maintenance.length} Units</div>
                  <div className="kpi-tile-foot">Assigned to tech teams</div>
                </div>
              </div>

              <div className="table-responsive" style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Asset Name &amp; Specs</th>
                      <th style={{ padding: "12px 16px" }}>Department / Facility</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px" }}>Assigned Tech</th>
                      <th style={{ padding: "12px 16px" }}>Replacement Value</th>
                      <th style={{ padding: "12px 16px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((eq) => (
                      <tr key={eq.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <strong>{eq.name}</strong>
                          <div style={{ color: "var(--text-sub)", fontSize: "11px" }}>{eq.category} · {eq.specs.join(", ")}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div>{eq.department}</div>
                          <small style={{ color: "var(--text-sub)" }}>{eq.location}</small>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`status-badge ${eq.status === "Available" ? "status-available" : eq.status === "In use" ? "status-in-use" : "status-booked"}`}>
                            {eq.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{eq.assignedTechnician}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                          ${(eq.id * 4200 + 3500).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            className="details-btn"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => { setSelectedEquipment(eq); showToast(`Inspecting calibration record for ${eq.name}`); }}
                          >
                            Audit Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sub-view: Utilization & Bottlenecks */}
          {activeTab === "Utilization & Bottlenecks" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">CAPACITY PLANNING &amp; BOTTLENECK ANALYSIS</div>
                  <h2>Laboratory Equipment Utilization &amp; High-Demand Bottlenecks</h2>
                  <p>Real-time machine run-time telemetry, queue wait times, and automated recommendations for capacity expansion.</p>
                </div>
              </div>

              <div className="kpi-row" style={{ marginBottom: "20px" }}>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Peak Utilization Window <Clock3 size={16} color="var(--primary)" /></div>
                  <div className="kpi-tile-num">02:00 PM – 05:00 PM</div>
                  <div className="kpi-tile-foot">94% slot occupancy</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Oversubscribed Assets <AlertTriangle size={16} color="var(--accent-amber)" /></div>
                  <div className="kpi-tile-num">2 Systems</div>
                  <div className="kpi-tile-foot">Demand exceeds capacity</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Avg Turnaround Time <RefreshCw size={16} color="var(--accent-teal)" /></div>
                  <div className="kpi-tile-num">1.8 Hours</div>
                  <div className="kpi-tile-foot">From approval to handover</div>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Laboratory Load Breakdown</h3>
                  <p>Telemetry metrics across key department centers.</p>
                  {[
                    { facility: "AI & High-Performance Computing", pct: 92, status: "Critical Load" },
                    { facility: "Embedded IoT & Edge Robotics", pct: 78, status: "Optimal" },
                    { facility: "High-Frequency RF & Signal Lab", pct: 64, status: "Available Headroom" },
                    { facility: "Mechanical Prototyping Fab Lab", pct: 58, status: "Available Headroom" }
                  ].map((f) => (
                    <div className="bar-chart-row" key={f.facility} style={{ marginBottom: "14px" }}>
                      <div style={{ width: "230px" }}>
                        <div style={{ fontWeight: 600 }}>{f.facility}</div>
                        <small style={{ color: "var(--text-sub)", fontSize: "10px" }}>{f.status}</small>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${f.pct}%`, background: f.pct > 85 ? "var(--accent-amber)" : "var(--primary)" }} />
                      </div>
                      <span className="bar-val" style={{ width: "45px" }}>{f.pct}%</span>
                    </div>
                  ))}
                </div>

                <div className="analytics-card">
                  <h3>AI Bottleneck Mitigation Engine</h3>
                  <p>Automated workload balancing recommendations.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                    <div style={{ background: "var(--accent-amber-light)", padding: "14px", borderRadius: "10px", fontSize: "12px" }}>
                      <strong>High Contention: NVIDIA RTX 6000 Cluster</strong>
                      <p style={{ margin: "4px 0", color: "var(--text-sub)" }}>Queue depth is 4.2 student bookings. Recommend opening weekend batch processing slots.</p>
                      <button
                        className="primary-button"
                        style={{ marginTop: "6px", padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => showToast("Weekend batch processing schedule enabled for GPU Cluster")}
                      >
                        Enable Weekend Batch Slots
                      </button>
                    </div>

                    <div style={{ background: "var(--surface-muted)", padding: "14px", borderRadius: "10px", fontSize: "12px", border: "1px solid var(--border)" }}>
                      <strong>Underutilized: Keysight DSO Oscilloscopes</strong>
                      <p style={{ margin: "4px 0", color: "var(--text-sub)" }}>Utilization at 42%. Suitable for cross-listing to Biomedical Instrumentation students.</p>
                      <button
                        className="details-btn"
                        style={{ marginTop: "6px", padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => showToast("Keysight DSO cross-listed to Biomedical Department")}
                      >
                        Cross-List to BioMed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: Special Approvals (HOD Queue) */}
          {activeTab === "Special Approvals" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">HOD SPECIAL ENDORSEMENTS</div>
                  <h2>High-Priority Research Booking Queue</h2>
                  <p>Proposals with priority scores exceeding 85 points or requiring expedited HOD departmental authorization.</p>
                </div>
              </div>

              {bookings.filter((b) => b.priorityScore > 85).length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={36} color="var(--accent-green)" />
                  <strong>No High-Priority Overrides Pending</strong>
                  <p>All regular bookings are proceeding through normal faculty and lab admin approval workflows.</p>
                </div>
              ) : (
                <div className="approval-queue">
                  {bookings.filter((b) => b.priorityScore > 85).map((b) => (
                    <article className="approval-card" key={b.id}>
                      <div className="approval-left">
                        <div className="approval-avatar" style={{ background: "linear-gradient(135deg, var(--accent-amber), var(--primary))" }}>
                          <ShieldCheck size={26} color="#ffffff" />
                        </div>
                        <div className="approval-info">
                          <h3>{b.studentName} · <span style={{ color: "var(--primary)" }}>{b.equipmentName}</span></h3>
                          <p>
                            Project: <strong>{b.projectTitle}</strong> · Academic Justification: <em>&quot;{b.academicPurpose}&quot;</em>
                          </p>
                          <div className="approval-meta">
                            <span><CalendarDays size={13} /> {b.date} · {b.timeSlot}</span>
                            <span><Building2 size={13} /> Facility: {b.labLocation}</span>
                            <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}><TrendingUp size={13} /> Priority Score: {b.priorityScore}/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="approval-actions">
                        <button className="approve-btn" onClick={() => handleHodSpecialApproval(b.id)}>
                          <Check size={14} /> Grant HOD Special Priority
                        </button>
                        <button className="details-btn" onClick={() => setShowWorkflowModal(b)}>
                          <Eye size={14} /> Full Dossier
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Sub-view: Inter-Department Comparison / Resource Sharing ROI */}
          {(activeTab === "Inter-Department Comparison" || activeTab === "Resource Sharing ROI") && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">CROSS-CAMPUS COLLABORATION</div>
                  <h2>Inter-Department Resource Sharing &amp; ROI Benchmark</h2>
                  <p>Evaluating collaborative utilization metrics, avoided duplicate capital expenditure, and interdisciplinary student outcomes.</p>
                </div>
                <button className="primary-button" onClick={() => showToast("Exporting Inter-Department ROI Report (PDF)...")}>
                  <Download size={15} /> Export ROI Report
                </button>
              </div>

              <div className="kpi-row" style={{ marginBottom: "20px" }}>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Avoided Procurement <TrendingUp size={16} color="var(--accent-green)" /></div>
                  <div className="kpi-tile-num">$142,500</div>
                  <div className="kpi-tile-foot">Prevented duplicate buys</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Inter-Dept Bookings <ArrowLeftRight size={16} color="var(--primary)" /></div>
                  <div className="kpi-tile-num">38%</div>
                  <div className="kpi-tile-foot">Share of total reservations</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-header">Joint Capstones Funded <Lightbulb size={16} color="var(--accent-teal)" /></div>
                  <div className="kpi-tile-num">19 Projects</div>
                  <div className="kpi-tile-foot">Interdisciplinary teams</div>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Departmental Collaboration Matrix</h3>
                  <p>Volume of cross-allocated bookings per academic division.</p>
                  {[
                    { dept: "Computer Science & AI", sharedOut: 48, sharedIn: 32, score: "A+" },
                    { dept: "Electronics & Communication", sharedOut: 36, sharedIn: 41, score: "A" },
                    { dept: "Mechanical & Robotics", sharedOut: 29, sharedIn: 24, score: "B+" },
                    { dept: "Central Instrumentation", sharedOut: 54, sharedIn: 12, score: "A+" }
                  ].map((row) => (
                    <div key={row.dept} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <strong>{row.dept}</strong>
                        <div style={{ color: "var(--text-sub)", fontSize: "11px" }}>Shared Out: {row.sharedOut} | Borrowed: {row.sharedIn}</div>
                      </div>
                      <span className="badge" style={{ background: "var(--primary-glow)", color: "var(--primary)", fontWeight: 700 }}>
                        Grade {row.score}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="analytics-card">
                  <h3>Institutional Impact Case Study</h3>
                  <p>Measurable gains from LabLink Nexus multi-stakeholder governance.</p>
                  <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                    <div style={{ borderLeft: "4px solid var(--primary)", paddingLeft: "12px" }}>
                      <strong>Autonomous Drone Capstone</strong>
                      <p style={{ margin: "2px 0 0", color: "var(--text-sub)", fontSize: "12px" }}>
                        CS student Alex Kumar utilized Mechanical 3D Printing Lab &amp; ECE Spectrum Analyzer, saving $6,200 in outsourced fabrication.
                      </p>
                    </div>
                    <div style={{ borderLeft: "4px solid var(--accent-green)", paddingLeft: "12px" }}>
                      <strong>Biomedical Telemetry Sensor</strong>
                      <p style={{ margin: "2px 0 0", color: "var(--text-sub)", fontSize: "12px" }}>
                        Cross-allocated clean-room time with zero scheduling conflict via deterministic engine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: Capital Procurement Forecast */}
          {activeTab === "Capital Procurement Forecast" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">CAPITAL ALLOCATION &amp; UPGRADES</div>
                  <h2>FY27 Capital Equipment Procurement Forecast</h2>
                  <p>Data-driven investment recommendations generated from student booking waitlists and equipment wear telemetry.</p>
                </div>
                <button className="primary-button" onClick={() => showToast("Generated Capital Procurement Proposal (PDF)!")}>
                  <Download size={15} /> Download FY27 Proposal
                </button>
              </div>

              <div className="table-responsive" style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Proposed Asset</th>
                      <th style={{ padding: "12px 16px" }}>Target Facility</th>
                      <th style={{ padding: "12px 16px" }}>Demand Driver</th>
                      <th style={{ padding: "12px 16px" }}>Priority</th>
                      <th style={{ padding: "12px 16px" }}>Est. Budget</th>
                      <th style={{ padding: "12px 16px" }}>Recommendation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "2x NVIDIA RTX A6000 Workstations", lab: "AI & Deep Learning Lab", driver: "92% continuous booking utilization", priority: "CRITICAL", cost: "$34,000", status: "Approved by HOD" },
                      { name: "1x Formlabs Form 4 Stereolithography 3D Printer", lab: "Mechanical Prototyping", driver: "18 capstone teams in queue", priority: "HIGH", cost: "$14,500", status: "Under Review" },
                      { name: "4x Keysight 200MHz Digital Oscilloscopes", lab: "Signal & RF Facility", driver: "Replacing 2017 end-of-life units", priority: "MEDIUM", cost: "$8,200", status: "Budget Allocated" },
                      { name: "1x High-Vacuum RF Sputtering Coater", lab: "Nanomaterials Central Lab", driver: "Interdisciplinary grant milestone", priority: "HIGH", cost: "$48,000", status: "Grant Co-Funded" }
                    ].map((item) => (
                      <tr key={item.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: "12px 16px" }}>{item.lab}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-sub)" }}>{item.driver}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`status-badge ${item.priority === "CRITICAL" ? "status-booked" : "status-in-use"}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800 }}>{item.cost}</td>
                        <td style={{ padding: "12px 16px", color: "var(--primary)" }}>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Sub-view: Annual Audit Report */}
          {activeTab === "Annual Audit Report" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">ACCREDITATION &amp; REGULATORY GOVERNANCE</div>
                  <h2>Institutional Laboratory Governance &amp; Annual Audit</h2>
                  <p>Full audit certifications for NAAC, ABET, and NBA accreditation compliance bodies.</p>
                </div>
                <button className="primary-button" onClick={() => showToast("Exporting Complete Accreditation Dossier (ZIP)...")}>
                  <Download size={15} /> Export Accreditation Dossier
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Accreditation Audit Checklist</h3>
                  <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                    {[
                      { item: "Barcode & Asset Digital Twin Indexing", status: "100% Compliant", date: "Verified Nov 2026" },
                      { item: "Preventive Maintenance Calibration Records", status: "98.6% On-Schedule", date: "Verified Nov 2026" },
                      { item: "Student Laboratory Safety Briefing Log", status: "100% Signed Off", date: "Verified Fall 2026" },
                      { item: "Hazardous Materials & Waste Protocol", status: "Zero Non-Conformances", date: "Inspected Oct 2026" }
                    ].map((c) => (
                      <div key={c.item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                        <div>
                          <strong>{c.item}</strong>
                          <div style={{ color: "var(--text-sub)", fontSize: "11px" }}>{c.date}</div>
                        </div>
                        <span className="status-tag approved"><Check size={12} /> {c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3>Audit Dossier Documents</h3>
                  <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                    {[
                      { title: "LabLink Nexus Annual Asset Utilization Report", size: "3.4 MB · PDF" },
                      { title: "Department-Wise Cross-Allocation Log (2025-2026)", size: "1.8 MB · XLSX" },
                      { title: "Preventive Maintenance & Safety Certification Log", size: "2.1 MB · PDF" }
                    ].map((doc) => (
                      <div key={doc.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: "8px", background: "var(--surface-muted)" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "12px" }}>{doc.title}</div>
                          <small style={{ color: "var(--text-sub)", fontSize: "10px" }}>{doc.size}</small>
                        </div>
                        <button className="details-btn" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => showToast(`Downloaded ${doc.title}`)}>
                          <Download size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sub-view: AI Recommendations */}
          {activeTab === "AI Recommendations" && (
            <section className="section-block">
              <div className="section-heading">
                <div>
                  <div className="section-eyebrow">GEMINI AI INTEGRATION</div>
                  <h2>Intelligent Equipment Recommendation Engine</h2>
                  <p>Describe your project hypothesis or technical workload in plain English. The AI engine matches with suitable verified campus assets.</p>
                </div>
              </div>

              <article className="ai-card" style={{ maxWidth: "800px" }}>
                <div className="ai-card-top">
                  <div className="ai-symbol"><Sparkles size={18} /></div>
                  <span className="ai-label">GEMINI MULTI-STAKEHOLDER ASSISTANT</span>
                  <span className="beta-pill">ACTIVE</span>
                </div>
                <h2>What are your hardware requirements?</h2>
                <p>Input your project parameters (e.g. &quot;Building an autonomous drone with visual SLAM, needs high CUDA compute&quot; or &quot;IoT sensor telemetry battery testing&quot;).</p>
                <div className="ai-input-wrap">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRunAi(); }}
                    placeholder="Describe your technical hardware requirements..."
                  />
                  <button onClick={handleRunAi} disabled={!aiInput.trim()} aria-label="Find equipment">
                    <ArrowRight size={16} />
                  </button>
                </div>

                {aiOutput && (
                  <div className="ai-result">
                    <CheckCircle2 size={20} color="#34d399" />
                    <div>
                      <strong>{aiOutput.title}</strong>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#e2e8f0" }}>{aiOutput.desc}</p>
                      <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {aiOutput.matches.map((m) => (
                          <span key={m} style={{ background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </section>
          )}

          {/* Footer */}
          <footer className="footer">
            <div className="footer-brand">
              <img src="/logo.png" alt="LabLink Logo" style={{ width: "20px", height: "20px", objectFit: "contain", borderRadius: "4px" }} />
              LabLink Nexus Multi-Stakeholder Academic Platform
            </div>
            <span>Connected Roles: Student · Faculty · Technician · Lab Admin · HOD · College Management</span>
            <span>Version 2.0 · Live Evaluation Demo</span>
          </footer>
        </div>
      </section>

      {/* --- CONFIRMATION DIALOG: SWITCH ROLE --- */}
      {confirmSwitchModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setConfirmSwitchModal(false)}
        >
          <div
            className="modal-card confirm-dialog-card"
            style={{ maxWidth: "480px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-switch-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              {hasUnsavedChanges ? (
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                  <AlertTriangle size={22} />
                </div>
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <ArrowLeftRight size={22} />
                </div>
              )}
              <div>
                <h3 id="confirm-switch-title" style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                  {hasUnsavedChanges ? "Discard Unsaved Changes?" : "Switch Stakeholder Role"}
                </h3>
                <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  Current Stakeholder: <strong>{persona.name}</strong> ({persona.badge})
                </small>
              </div>
            </div>

            {hasUnsavedChanges ? (
              <div className="confirm-dialog-warning">
                <AlertTriangle size={18} style={{ flexShrink: 0, color: "#f59e0b", marginTop: "2px" }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                    You have active, unsaved inputs in:
                  </div>
                  <ul style={{ margin: "4px 0 6px 18px", padding: 0 }}>
                    {unsavedForms.map((name) => (
                      <li key={name} style={{ fontWeight: 600 }}>{name}</li>
                    ))}
                  </ul>
                  <span>
                    Switching stakeholder personas will discard these drafts and reset the in-progress form. Would you like to proceed?
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-sub)", margin: "0 0 20px 0" }}>
                You are about to switch stakeholder access. All equipment inventory, booking workflows, and analytical telemetry remain synchronized across all campus roles.
              </p>
            )}

            <div className="confirm-dialog-actions">
              <button
                className="secondary-button"
                onClick={() => setConfirmSwitchModal(false)}
                style={{ padding: "9px 18px" }}
              >
                Cancel
              </button>
              <button
                className={hasUnsavedChanges ? "danger-button" : "primary-button"}
                onClick={handleConfirmSwitch}
                style={{
                  padding: "9px 20px",
                  background: hasUnsavedChanges ? "#ef4444" : "var(--primary)",
                  color: "#ffffff",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {hasUnsavedChanges ? "Discard & Switch Role" : "Select Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CHOOSE YOUR ROLE / PERSONA SELECTION MODAL --- */}
      {showRoleModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (hasInitializedRole) setShowRoleModal(false);
          }}
        >
          <div
            className="modal-card persona-modal-card"
            style={{ width: "min(1120px, 95%)", maxWidth: "1120px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="persona-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {hasInitializedRole && (
              <button
                className="modal-close icon-button"
                onClick={() => setShowRoleModal(false)}
                aria-label="Close role modal"
              >
                <X size={18} />
              </button>
            )}

            <div style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="section-eyebrow">HACKATHON EVALUATION MODE</div>
              <h2 id="persona-modal-title" style={{ fontSize: "26px", fontWeight: 800, margin: "4px 0 6px 0", letterSpacing: "-0.5px" }}>
                Choose Your Stakeholder Role
              </h2>
              <p style={{ color: "var(--text-sub)", fontSize: "13px", margin: 0, maxWidth: "800px", lineHeight: 1.5 }}>
                Explore how each campus stakeholder interacts with LabLink Nexus. Switch between roles at any time to test the interconnected booking and management workflows.
              </p>
            </div>

            <div className="persona-cards-grid" style={{ padding: "20px 0", gap: "18px" }}>
              {SIX_PERSONAS.map((p) => {
                const isSelected = currentRole === p.role || (p.role === "lab_admin" && currentRole === "admin");
                return (
                  <div
                    key={p.id}
                    className={`persona-choice-card ${isSelected ? "persona-active" : ""}`}
                    onClick={() => handleRoleChange(p)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRoleChange(p);
                      }
                    }}
                  >
                    <div className="persona-card-header">
                      <div className="persona-avatar-box">
                        {p.avatar}
                      </div>
                      <span className="persona-role-badge">
                        {p.badge}
                      </span>
                    </div>

                    <div className="persona-name-text">{p.name}</div>
                    <div className="persona-dept-text">{p.department}</div>

                    <p className="persona-desc-text">
                      {p.summary}
                    </p>

                    <div className="persona-action-btn-row">
                      <span className="persona-btn-badge">
                        {isSelected ? (
                          <>
                            <Check size={13} /> Active
                          </>
                        ) : (
                          <>
                            Enter Role <ArrowRight size={13} />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="persona-modal-footer-banner">
              <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Zero-Barrier Evaluation Mode:</strong> Authenticated sessions with cryptographic tokens are initialized instantaneously without passwords. Switch between student, faculty, technician, lab administrator, HOD, and institutional management at any point to verify real-time role permissions.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EQUIPMENT DETAILS MODAL --- */}
      {selectedEquipment && !showBookingModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedEquipment(null)}>
          <div className="modal-card" style={{ maxWidth: "560px", padding: "0", overflow: "hidden" }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "relative", height: "220px", background: "#090d16" }}>
              <img
                src={selectedEquipment.image || "/logo.png"}
                alt={selectedEquipment.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                className="modal-close icon-button"
                style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.6)", color: "#fff" }}
                onClick={() => setSelectedEquipment(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div style={{ position: "absolute", bottom: "14px", left: "18px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", padding: "4px 12px", borderRadius: "9999px", color: "#fff", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`status-dot ${selectedEquipment.status === "Available" ? "dot-available" : selectedEquipment.status === "In use" ? "dot-in-use" : "dot-booked"}`} />
                {selectedEquipment.status}
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div className="resource-type-meta">{selectedEquipment.category} · {selectedEquipment.department} · {selectedEquipment.modelNumber || "VERIFIED ASSET"}</div>
              <h2 style={{ marginTop: "4px", fontSize: "22px" }}>{selectedEquipment.name}</h2>
              <p style={{ color: "var(--text-sub)", lineHeight: 1.6, marginTop: "8px", fontSize: "13px" }}>{selectedEquipment.description}</p>

              <div style={{ marginTop: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>TECHNICAL SPECIFICATIONS</span>
                <div className="spec-list" style={{ marginTop: "6px" }}>
                  {selectedEquipment.specs.map((s) => <span key={s}>{s}</span>)}
                </div>
              </div>

              <div className="resource-meta" style={{ marginTop: "16px" }}>
                <span><MapPin size={14} /> Location: {selectedEquipment.location}</span>
                <span><Clock3 size={14} /> Schedule: {selectedEquipment.next}</span>
                <span><UserCheck size={14} /> Technician: {selectedEquipment.assignedTechnician}</span>
                <span><ShieldCheck size={14} /> Safety Requirement: Level 1 Cleared</span>
              </div>

              {currentRole === "student" && (
                <button
                  className="primary-button"
                  style={{ width: "100%", justifyContent: "center", marginTop: "20px" }}
                  disabled={selectedEquipment.status !== "Available"}
                  onClick={() => handleOpenBooking(selectedEquipment)}
                >
                  {selectedEquipment.status === "Available" ? "Start Guided Reservation" : "Currently Unavailable"} <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: 5-STEP GUIDED BOOKING MODAL --- */}
      {showBookingModal && selectedEquipment && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowBookingModal(false)}>
          <div className="modal-card" style={{ maxWidth: "600px" }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setShowBookingModal(false)} aria-label="Close">
              <X size={18} />
            </button>

            {/* Stepper Header */}
            <div className="guided-stepper-header">
              <div className="stepper-track" />
              {[
                { num: 1, label: "Equipment" },
                { num: 2, label: "Date & Slot" },
                { num: 3, label: "Purpose" },
                { num: 4, label: "Review" },
                { num: 5, label: "Status" }
              ].map((s) => (
                <div
                  key={s.num}
                  className={`stepper-step ${bookingStep === s.num ? "step-active" : bookingStep > s.num ? "step-completed" : ""}`}
                >
                  <div className="step-node">
                    {bookingStep > s.num ? <Check size={14} /> : s.num}
                  </div>
                  <span className="step-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: VERIFY HARDWARE */}
            {bookingStep === 1 && (
              <div className="guided-step-body">
                <div className="section-eyebrow">STEP 1 OF 5: VERIFY HARDWARE</div>
                <h2>Confirm Selected Equipment</h2>
                <p style={{ color: "var(--text-sub)", fontSize: "13px", marginBottom: "16px" }}>
                  Review hardware specifications and assigned laboratory before choosing a reservation window.
                </p>

                <div style={{ display: "flex", gap: "16px", background: "var(--bg-surface)", padding: "16px", borderRadius: "14px", border: "1px solid var(--border)", marginBottom: "20px" }}>
                  <img
                    src={selectedEquipment.image || "/logo.png"}
                    alt={selectedEquipment.name}
                    style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "10px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "16px", color: "var(--text-main)" }}>{selectedEquipment.name}</strong>
                    <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginTop: "2px" }}>
                      {selectedEquipment.category} · {selectedEquipment.department}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>
                      <MapPin size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {selectedEquipment.location}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Assigned Tech: {selectedEquipment.assignedTechnician}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button className="secondary-button" onClick={() => setShowBookingModal(false)}>
                    Cancel
                  </button>
                  <button className="primary-button" onClick={() => setBookingStep(2)}>
                    Next: Select Date &amp; Slot <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE DATE AND TIME */}
            {bookingStep === 2 && (
              <div className="guided-step-body">
                <div className="section-eyebrow">STEP 2 OF 5: DATE &amp; TIME SLOT</div>
                <h2>Select Reservation Window</h2>
                <p style={{ color: "var(--text-sub)", fontSize: "13px", marginBottom: "16px" }}>
                  Choose an available date and verified laboratory operating window.
                </p>

                <label className="field-label" style={{ marginBottom: "16px" }}>
                  Preferred Reservation Date
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                    style={{ marginTop: "6px" }}
                  />
                </label>

                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
                  Available Operating Slots
                </div>
                <div className="slot-chips-grid">
                  {[
                    "09:00 AM - 11:00 AM",
                    "11:30 AM - 01:30 PM",
                    "02:00 PM - 04:00 PM",
                    "04:30 PM - 06:30 PM"
                  ].map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      className={`slot-chip ${bookTime === slot ? "slot-chip-active" : ""}`}
                      onClick={() => setBookTime(slot)}
                    >
                      <div>{slot}</div>
                      <small style={{ color: "var(--accent-green)", fontSize: "10px", fontWeight: 600 }}>● Available</small>
                    </button>
                  ))}
                </div>

                <div className="conflict-verified-badge">
                  <CheckCircle2 size={14} />
                  Deterministic Conflict Engine: Slot is 100% collision-free
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "24px" }}>
                  <button className="secondary-button" onClick={() => setBookingStep(1)}>
                    ← Back
                  </button>
                  <button className="primary-button" onClick={() => setBookingStep(3)}>
                    Next: Academic Purpose <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ENTER PROJECT PURPOSE */}
            {bookingStep === 3 && (
              <div className="guided-step-body">
                <div className="section-eyebrow">STEP 3 OF 5: RESEARCH JUSTIFICATION</div>
                <h2>Academic Project Purpose</h2>
                <p style={{ color: "var(--text-sub)", fontSize: "13px", marginBottom: "16px" }}>
                  Specify your academic research purpose and link this allocation to your thesis or course capstone.
                </p>

                <label className="field-label" style={{ marginBottom: "14px" }}>
                  Link to Registered Project
                  <select
                    value={bookProjectTitle}
                    onChange={(e) => setBookProjectTitle(e.target.value)}
                    style={{ marginTop: "6px" }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                </label>

                <label className="field-label" style={{ marginBottom: "14px" }}>
                  Academic Purpose &amp; Workload Description
                  <textarea
                    rows={3}
                    value={bookPurpose}
                    onChange={(e) => setBookPurpose(e.target.value)}
                    placeholder="e.g. Precision RF spectrum analysis and antenna impedance matching for IoT smart telemetry sensor capstone."
                    required
                    style={{ marginTop: "6px" }}
                  />
                </label>

                <div style={{ background: "var(--bg-surface)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "var(--text-sub)" }}>
                  <strong>Assigned Guide:</strong> Dr. Sarah Jenkins (ECE Project Guide) will be notified for endorsement.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "24px" }}>
                  <button className="secondary-button" onClick={() => setBookingStep(2)}>
                    ← Back
                  </button>
                  <button className="primary-button" onClick={() => setBookingStep(4)}>
                    Next: Review Request <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW REQUEST */}
            {bookingStep === 4 && (
              <div className="guided-step-body">
                <div className="section-eyebrow">STEP 4 OF 5: VERIFICATION</div>
                <h2>Review Allocation Request</h2>
                <p style={{ color: "var(--text-sub)", fontSize: "13px", marginBottom: "16px" }}>
                  Review all details before dispatching into the multi-stakeholder approval pipeline.
                </p>

                <div style={{ background: "var(--bg-surface)", padding: "16px", borderRadius: "14px", border: "1px solid var(--border)", display: "grid", gap: "10px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Equipment:</span>
                    <strong>{selectedEquipment.name}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Facility:</span>
                    <span>{selectedEquipment.location}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Date &amp; Slot:</span>
                    <strong>{bookDate} · {bookTime}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Project:</span>
                    <span>{bookProjectTitle}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Priority Score:</span>
                    <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>88/100 (Optimal Thesis Alignment)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-sub)" }}>Next Workflow Stage:</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>1. Faculty Guide Endorsement</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "24px" }}>
                  <button className="secondary-button" onClick={() => setBookingStep(3)}>
                    ← Back
                  </button>
                  <button className="primary-button" onClick={() => handleStudentBook()}>
                    <Check size={14} /> Submit Reservation Request
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SUBMITTED CONFIRMATION */}
            {bookingStep === 5 && lastSubmittedBooking && (
              <div className="guided-step-body" style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--accent-green-light)", color: "var(--accent-green)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 size={36} />
                </div>
                <div className="section-eyebrow">BOOKING REGISTERED</div>
                <h2>Reservation Request Submitted!</h2>
                <p style={{ color: "var(--text-sub)", fontSize: "14px", maxWidth: "420px", margin: "8px auto 20px" }}>
                  Your request for <strong>{lastSubmittedBooking.equipmentName}</strong> has been logged under reference <strong>{lastSubmittedBooking.id}</strong>.
                </p>

                <div style={{ background: "var(--bg-surface)", padding: "16px", borderRadius: "14px", border: "1px solid var(--border)", textAlign: "left", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                    LIVE WORKFLOW PROGRESSION
                  </div>
                  <div className="workflow-stepper">
                    <div className="stepper-track" />
                    <div className="step-item step-completed">
                      <div className="step-bubble"><Check size={12} /></div>
                      <span>1. Request</span>
                    </div>
                    <div className="step-item step-active">
                      <div className="step-bubble"><Clock3 size={12} /></div>
                      <span>2. Guide</span>
                    </div>
                    <div className="step-item">
                      <div className="step-bubble">3</div>
                      <span>3. Admin</span>
                    </div>
                    <div className="step-item">
                      <div className="step-bubble">4</div>
                      <span>4. Handover</span>
                    </div>
                    <div className="step-item">
                      <div className="step-bubble">5</div>
                      <span>5. Complete</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  <button className="secondary-button" onClick={() => setShowBookingModal(false)}>
                    Done
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setActiveTab("My Bookings");
                    }}
                  >
                    View in My Bookings <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 4: NEW EQUIPMENT INVENTORY (TECHNICIAN / ADMIN) --- */}
      {showNewEquipmentModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowNewEquipmentModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setShowNewEquipmentModal(false)} aria-label="Close">
              <X size={18} />
            </button>

            <form onSubmit={handleAddEquipment}>
              <div className="section-eyebrow">INVENTORY EXPANSION</div>
              <h2>Register New Lab Equipment</h2>
              <p style={{ color: "var(--text-sub)", fontSize: "13px" }}>
                Catalog new hardware assets, assign to laboratory technician, and configure specifications.
              </p>

              <label className="field-label">
                Equipment Name
                <input
                  placeholder="e.g., Tektronix Logic Analyzer 32-Channel"
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  required
                />
              </label>

              <div className="field-row">
                <label className="field-label">
                  Category
                  <select value={newEqCategory} onChange={(e) => setNewEqCategory(e.target.value as "Instrument" | "Dev kit" | "Workstation")}>
                    <option value="Instrument">Instrument</option>
                    <option value="Dev kit">Dev kit</option>
                    <option value="Workstation">Workstation</option>
                  </select>
                </label>
                <label className="field-label">
                  Department
                  <select value={newEqDept} onChange={(e) => setNewEqDept(e.target.value)}>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </label>
              </div>

              <label className="field-label">
                Laboratory Location
                <input
                  placeholder="e.g. Block A · Lab 204 (RF Wing)"
                  value={newEqLoc}
                  onChange={(e) => setNewEqLoc(e.target.value)}
                  required
                />
              </label>

              <label className="field-label">
                Key Technical Specifications (comma separated)
                <input
                  placeholder="e.g., 32 Channels, 500 MS/s, SPI/I2C Decoders"
                  value={newEqSpecs}
                  onChange={(e) => setNewEqSpecs(e.target.value)}
                />
              </label>

              <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center", marginTop: "20px" }}>
                Add to Inventory <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: BOOKING LIFECYCLE AUDIT VIEW --- */}
      {showWorkflowModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowWorkflowModal(null)}>
          <div className="modal-card" style={{ maxWidth: "600px" }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setShowWorkflowModal(null)} aria-label="Close">
              <X size={18} />
            </button>

            <div className="section-eyebrow">AUDIT & COMPLIANCE LOG</div>
            <h2>Booking Lifecycle: {showWorkflowModal.id}</h2>
            <p style={{ color: "var(--text-sub)", fontSize: "13px" }}>
              Full audit trail across all stakeholder interactions.
            </p>

            <div style={{ display: "grid", gap: "12px", margin: "16px 0", fontSize: "13px" }}>
              <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                <strong>1. Student Submission:</strong> {showWorkflowModal.studentName} ({showWorkflowModal.studentId})
                <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "2px" }}>
                  Purpose: {showWorkflowModal.academicPurpose}
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                <strong>2. Faculty Endorsement:</strong>{" "}
                {showWorkflowModal.facultyComments ? (
                  <span style={{ color: "var(--accent-green)" }}>Endorsed: &quot;{showWorkflowModal.facultyComments}&quot;</span>
                ) : (
                  <span style={{ color: "var(--accent-amber)" }}>Pending Faculty Endorsement</span>
                )}
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                <strong>3. Administrator Allocation:</strong>{" "}
                {showWorkflowModal.adminNotes ? (
                  <span style={{ color: "var(--primary)" }}>Authorized: &quot;{showWorkflowModal.adminNotes}&quot;</span>
                ) : (
                  <span style={{ color: "var(--accent-amber)" }}>Pending Admin Verification</span>
                )}
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                <strong>4. Technician Handover:</strong>{" "}
                {showWorkflowModal.handoverCondition ? (
                  <span style={{ color: "var(--accent-teal)" }}>Completed: &quot;{showWorkflowModal.handoverCondition}&quot;</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Awaiting student arrival at lab</span>
                )}
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "10px" }}>
                <strong>5. Return & Safety Inspection:</strong>{" "}
                {showWorkflowModal.returnCondition ? (
                  <span style={{ color: "var(--accent-green)" }}>Returned ({showWorkflowModal.returnCondition}): &quot;{showWorkflowModal.returnRemarks}&quot;</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Not yet returned</span>
                )}
              </div>
            </div>

            <button className="primary-button" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowWorkflowModal(null)}>
              Close Audit View
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 6: CREATE PROJECT MODAL --- */}
      {showProjectModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowProjectModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setShowProjectModal(false)} aria-label="Close">
              <X size={18} />
            </button>

            <form onSubmit={handleCreateProject}>
              <div className="section-eyebrow">NEW ACADEMIC PROJECT</div>
              <h2>Register Lab Project</h2>
              <p style={{ color: "var(--text-sub)", fontSize: "13px" }}>
                Add your project to request and link specialized cross-department lab equipment.
              </p>

              <label className="field-label">
                Project Title
                <input
                  placeholder="e.g. Autonomous Mobile Robot Telemetry"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  required
                />
              </label>

              <label className="field-label">
                Department
                <select value={newProjDept} onChange={(e) => setNewProjDept(e.target.value)}>
                  <option>Computer Science & IoT</option>
                  <option>Electronics & Communication</option>
                  <option>Mechanical Engineering</option>
                  <option>Electrical Engineering</option>
                </select>
              </label>

              <label className="field-label">
                Target Deadline
                <input
                  type="date"
                  value={newProjDeadline}
                  onChange={(e) => setNewProjDeadline(e.target.value)}
                  required
                />
              </label>

              <label className="field-label">
                Project Scope / Technical Summary
                <textarea
                  rows={3}
                  placeholder="Describe the research goals and why specialized lab hardware is required..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                />
              </label>

              <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center", marginTop: "20px" }}>
                Create Project <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 7: CREATE MAINTENANCE TICKET MODAL --- */}
      {showMaintenanceModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowMaintenanceModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setShowMaintenanceModal(false)} aria-label="Close">
              <X size={18} />
            </button>

            <form onSubmit={handleCreateMaintenance}>
              <div className="section-eyebrow">EQUIPMENT SERVICE DESK</div>
              <h2>Log Maintenance / Repair Ticket</h2>
              <p style={{ color: "var(--text-sub)", fontSize: "13px" }}>
                Record an operational issue or routine calibration for campus laboratory instrumentation.
              </p>

              <label className="field-label">
                Target Equipment
                <select value={maintEqName} onChange={(e) => setMaintEqName(e.target.value)}>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.name}>{eq.name} ({eq.location})</option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                Severity
                <select value={maintSeverity} onChange={(e) => setMaintSeverity(e.target.value as "Routine" | "High" | "Critical")}>
                  <option value="Routine">Routine (Regular calibration check)</option>
                  <option value="High">High (Performance degraded)</option>
                  <option value="Critical">Critical (Immediate safety / hardware fault)</option>
                </select>
              </label>

              <label className="field-label">
                Issue Description
                <textarea
                  rows={3}
                  placeholder="Detail the observed fault, error codes, or calibration readings..."
                  value={maintIssue}
                  onChange={(e) => setMaintIssue(e.target.value)}
                  required
                />
              </label>

              <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center", marginTop: "20px" }}>
                Register Maintenance Ticket <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TOAST FEEDBACK ALERT --- */}
      {toastMessage && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className="toast">
            <CheckCircle2 size={16} color="#34d399" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
}
