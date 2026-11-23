import {
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  Tag,
  Tags,
  User,
  Wrench,
  Hammer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Items", to: "/items", icon: Package },
  { label: "Locations", to: "/locations", icon: MapPin },
  { label: "Tags", to: "/tags", icon: Tag },
  { label: "Label Templates", to: "/label-templates", icon: Tags },
  { label: "Item Templates", to: "/item-templates", icon: FileText },
  { label: "Maintenance", to: "/maintenance", icon: Wrench },
  { label: "Tools", to: "/tools", icon: Hammer },
  { label: "Group Settings", to: "/group", icon: Settings },
  { label: "Profile", to: "/profile", icon: User },
];

export const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  items: "Items",
  new: "New",
  locations: "Locations",
  tags: "Tags",
  "label-templates": "Label Templates",
  "item-templates": "Item Templates",
  "entity-types": "Entity Types",
  maintenance: "Maintenance",
  tools: "Tools",
  group: "Group Settings",
  profile: "Profile",
  scan: "Scan",
};
