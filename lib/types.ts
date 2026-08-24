export type UserRole = "developer" | "investor" | "admin";
export type ProjectStatus = "idea" | "mvp" | "in_progress" | "launched";
export type OrderStatus = "new" | "proposals" | "selected" | "in_progress" | "completed";
export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  company_name: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  rating_avg: number;
  completed_orders: number;
  created_at: string;
  updated_at: string;
}

export interface OwnerRef {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  status: ProjectStatus;
  images: string[];
  demo_url: string | null;
  repo_url: string | null;
  likes_count: number;
  views_count: number;
  try_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCardData extends Project {
  profiles: OwnerRef | null;
  ratingAvg: number | null;
  ratingCount: number;
  commentCount: number;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  created_at: string;
  profiles: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface Product {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  demo_url: string | null;
  price: number | null;
  currency: string;
  is_paid: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: OwnerRef | null;
}

export interface Order {
  id: string;
  client_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  title: string;
  description: string;
  technologies: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: OrderStatus;
  contact_phone: string | null;
  contact_telegram: string | null;
  created_at: string;
}

/** Public-safe projection of an order (contact details are NOT included). */
export interface OpenOrder {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: OrderStatus;
  created_at: string;
  proposals_count: number;
}

export interface OrderProposal {
  id: string;
  order_id: string;
  developer_id: string;
  price: number;
  duration: string;
  message: string;
  status: ProposalStatus;
  created_at: string;
  profiles?: Profile | null;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string | null;
  text: string;
  created_at: string;
  profiles?: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface ContactInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  telegram: string | null;
}
