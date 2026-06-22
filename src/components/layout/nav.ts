import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  PieChart,
  Settings,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Executive Overview", href: "/executive", icon: BarChart3 },
      { label: "Upload Files", href: "/upload", icon: UploadCloud },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Opportunities", href: "/opportunities", icon: Briefcase },
      { label: "Tasks", href: "/tasks", icon: ClipboardList },
      { label: "Follow-Ups", href: "/followups", icon: ListChecks },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Staff Performance", href: "/staff", icon: Users },
      { label: "Project Performance", href: "/projects", icon: Building2 },
      { label: "Source Analysis", href: "/sources", icon: PieChart },
      { label: "Reports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);
