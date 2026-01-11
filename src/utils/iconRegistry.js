import {
  Monitor, Server, Smartphone, Watch, Cloud,
  Cpu, Database, HardDrive, Wifi, Globe,
  User, Users, Lock, Key, Shield,
  Mic, Camera, Speaker, Headphones,
  Code, Terminal, FileCode, Folder,
  Zap, Activity, BarChart, PieChart,
  ArrowRight, ArrowDown, RefreshCw, Repeat,
  Box, Package, Layers, Grid,
  Settings, Bell, Mail, MessageSquare,
  Search, Filter, Download, Upload,
  Play, Pause, Square, Circle,
} from 'lucide-react'

// Map of icon names to components
const ICON_MAP = {
  Monitor, Server, Smartphone, Watch, Cloud,
  Cpu, Database, HardDrive, Wifi, Globe,
  User, Users, Lock, Key, Shield,
  Mic, Camera, Speaker, Headphones,
  Code, Terminal, FileCode, Folder,
  Zap, Activity, BarChart, PieChart,
  ArrowRight, ArrowDown, RefreshCw, Repeat,
  Box, Package, Layers, Grid,
  Settings, Bell, Mail, MessageSquare,
  Search, Filter, Download, Upload,
  Play, Pause, Square, Circle,
}

// Curated list of useful icons for diagrams
export const DIAGRAM_ICONS = Object.keys(ICON_MAP)

// Get icon component by name
export function getIconComponent(iconName) {
  return ICON_MAP[iconName] || Box
}

// Get icon name from component (for reverse lookup)
export function getIconName(IconComponent) {
  const entry = Object.entries(ICON_MAP).find(([_, comp]) => comp === IconComponent)
  return entry ? entry[0] : 'Box'
}

// Default icon for new nodes
export const DEFAULT_ICON = 'Box'
