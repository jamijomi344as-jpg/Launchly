"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  Flame,
  Heart,
  LayoutGrid,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Users,
  X,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

type Section = "discover" | "projects" | "products" | "marketplace" | "winners" | "dashboard";
type ProjectStatus = "MVP" | "Ishga tushgan" | "Jarayonda" | "G'oya";

type Project = {
  id: number;
  title: string;
  tagline: string;
  category: string;
  status: ProjectStatus;
  votes: number;
  comments: number;
  views: string;
  rating: number;
  owner: string;
  initials: string;
  accent: string;
  variant: "flow" | "voice" | "task" | "learn" | "shop" | "green";
  badge?: string;
  description?: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: "Flowmap",
    tagline: "Jamoangiz uchun aniq va oddiy ish jarayoni",
    category: "SaaS",
    status: "MVP",
    votes: 384,
    comments: 28,
    views: "2.8k",
    rating: 4.8,
    owner: "Azizbek Qodirov",
    initials: "AQ",
    accent: "violet",
    variant: "flow",
    badge: "Haftaning topi",
    description: "Flowmap — kichik jamoalar uchun ishlarni bir joyda rejalashtirish, ko'rish va tezroq bajarishga yordam beradigan vizual workspace."
  },
  {
    id: 2,
    title: "OvozAI",
    tagline: "O'zbek tilida gaplashadigan aqlli yordamchi",
    category: "Sun'iy intellekt",
    status: "Ishga tushgan",
    votes: 267,
    comments: 19,
    views: "1.9k",
    rating: 4.6,
    owner: "Dilshod Karimov",
    initials: "DK",
    accent: "coral",
    variant: "voice",
    badge: "Yangi"
  },
  {
    id: 3,
    title: "TezTask",
    tagline: "Mahalliy bizneslar uchun freelancer toping",
    category: "Marketplace",
    status: "Jarayonda",
    votes: 213,
    comments: 34,
    views: "1.3k",
    rating: 4.4,
    owner: "Malika Sobirova",
    initials: "MS",
    accent: "blue",
    variant: "task"
  },
  {
    id: 4,
    title: "EduSpace",
    tagline: "Bilim ulashishning yangi, qulay usuli",
    category: "Ta'lim",
    status: "MVP",
    votes: 189,
    comments: 12,
    views: "986",
    rating: 4.3,
    owner: "Sardor Aliyev",
    initials: "SA",
    accent: "yellow",
    variant: "learn"
  },
  {
    id: 5,
    title: "Savdochi",
    tagline: "Kichik do'konlar uchun raqamli kassir",
    category: "E-commerce",
    status: "Ishga tushgan",
    votes: 156,
    comments: 16,
    views: "824",
    rating: 4.5,
    owner: "Bekzod Rasulov",
    initials: "BR",
    accent: "green",
    variant: "shop"
  },
  {
    id: 6,
    title: "Greenway",
    tagline: "Yaxshi odatlarni jamoa bilan shakllantiring",
    category: "Lifestyle",
    status: "G'oya",
    votes: 94,
    comments: 8,
    views: "403",
    rating: 4.1,
    owner: "Zarina Umarova",
    initials: "ZU",
    accent: "mint",
    variant: "green"
  }
];

const orders = [
  { id: 1, title: "Telegram uchun buyurtma bot kerak", desc: "Kichik biznesim uchun mahsulotlar va buyurtmalarni qabul qiladigan bot yaratmoqchiman.", tags: ["Telegram bot", "Node.js"], budget: "$300 — $600", time: "5 kun oldin", proposals: 8, initials: "FM", name: "Fotima M.", urgent: true },
  { id: 2, title: "Landing page dizayn va development", desc: "Yangi fintech mahsulotimiz uchun zamonaviy va konversiyasi yuqori landing page.", tags: ["Figma", "Next.js"], budget: "$500 — $1,000", time: "Kecha", proposals: 12, initials: "AS", name: "Akmal S.", urgent: false },
  { id: 3, title: "Mobil ilovaga UX audit kerak", desc: "Tayyor ilovamizni foydalanuvchilar uchun yanada tushunarli qilishga yordam bering.", tags: ["UX/UI", "Figma"], budget: "$150 — $300", time: "2 kun oldin", proposals: 5, initials: "NO", name: "Nodira O.", urgent: false }
];

const categories = ["Barchasi", "SaaS", "AI", "Mobil ilova", "E-commerce", "Ta'lim"];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#6857E5] text-white shadow-sm">
        <span className="absolute h-2.5 w-2.5 rounded-full border-[2px] border-white" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#f3c85b]" />
      </span>
      <span className="text-[20px] font-extrabold tracking-[-0.055em] text-[#18212F]">launchly<span className="text-[#6857E5]">.</span></span>
    </div>
  );
}

function Avatar({ initials, className = "", small = false }: { initials: string; className?: string; small?: boolean }) {
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#e3e6ff] font-bold text-[#5b50b8] shadow-sm ${small ? "h-6 w-6 text-[8px]" : "h-9 w-9 text-[11px]"} ${className}`}>{initials}</span>;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    MVP: "bg-[#eeebff] text-[#6857E5]",
    "Ishga tushgan": "bg-[#e8f7ef] text-[#228658]",
    Jarayonda: "bg-[#fff3dc] text-[#b87816]",
    "G'oya": "bg-[#f0f1f3] text-[#68717e]"
  };
  return <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

function ProjectArt({ variant, large = false }: { variant: Project["variant"]; large?: boolean }) {
  const shell = "project-preview relative h-full min-h-[180px] overflow-hidden rounded-[13px]";
  if (variant === "flow") return (
    <div className={`${shell} grid-noise bg-[#322a73]`}>
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#8d7bff] opacity-40 blur-2xl" />
      <div className="absolute bottom-[-35px] left-[-20px] h-40 w-40 rounded-full bg-[#e56f9c] opacity-40 blur-2xl" />
      <div className={`absolute left-[10%] top-[13%] h-[68%] w-[80%] rounded-[14px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm ${large ? "p-5" : ""}`}>
        <div className="mb-3 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff8d9c]" /><span className="h-2 w-2 rounded-full bg-[#ffd36b]" /><span className="h-2 w-2 rounded-full bg-[#9cf0bd]" /><span className="ml-auto h-2 w-10 rounded-full bg-white/20" /></div>
        <div className="flex h-[calc(100%-20px)] gap-2">
          <div className="w-[24%] rounded-lg bg-black/10 p-2"><div className="mb-3 h-2 w-10 rounded bg-white/25" /><div className="space-y-2"><div className="h-1.5 w-full rounded bg-white/15" /><div className="h-1.5 w-[70%] rounded bg-white/15" /><div className="h-1.5 w-[85%] rounded bg-white/15" /></div></div>
          <div className="flex-1 rounded-lg bg-[#f9f8ff] p-2.5"><div className="mb-3 flex justify-between"><div className="h-2.5 w-14 rounded bg-[#342c76]/20" /><div className="h-3 w-3 rounded bg-[#8e80ff]" /></div><div className="grid grid-cols-3 gap-1.5"><div className="h-16 rounded bg-[#eeeaff]" /><div className="h-16 rounded bg-[#dceff0]" /><div className="h-16 rounded bg-[#fff0dc]" /></div><div className="mt-2 h-8 w-full rounded bg-[#f0eff8]" /></div>
        </div>
      </div>
      <div className="absolute bottom-4 left-5 rounded-full bg-[#ffce72] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#483a61] shadow-lg">flowmap</div>
    </div>
  );
  if (variant === "voice") return (
    <div className={`${shell} bg-[#ffebe5]`}>
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#ffab91] opacity-70" />
      <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#ffd364] opacity-50" />
      <div className="absolute left-[13%] top-[16%] w-[74%] rounded-2xl bg-[#fffaf4]/85 p-4 shadow-[0_14px_25px_rgba(177,94,60,.15)]">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fd826a] text-white"><Sparkles size={15} /></span><div><div className="h-2 w-20 rounded bg-[#693e40]/35" /><div className="mt-1.5 h-1.5 w-12 rounded bg-[#693e40]/15" /></div><MoreHorizontal className="ml-auto text-[#693e40]/40" size={17} /></div>
        <div className="my-4 flex items-center justify-center gap-1"><i className="h-5 w-1 rounded-full bg-[#fd826a]" /><i className="h-9 w-1 rounded-full bg-[#ffad83]" /><i className="h-12 w-1 rounded-full bg-[#fd826a]" /><i className="h-7 w-1 rounded-full bg-[#ffc45d]" /><i className="h-10 w-1 rounded-full bg-[#fd826a]" /><i className="h-4 w-1 rounded-full bg-[#ffad83]" /></div>
        <div className="h-2 w-full rounded bg-[#693e40]/10" />
      </div>
    </div>
  );
  if (variant === "task") return (
    <div className={`${shell} bg-[#dcefff]`}>
      <div className="absolute right-[-20px] top-[-30px] h-44 w-44 rounded-full border-[25px] border-[#99cef3]/60" />
      <div className="absolute bottom-[-50px] left-[-20px] h-40 w-40 rounded-full bg-[#77baf0]/45" />
      <div className="absolute left-[10%] top-[15%] w-[80%] rounded-2xl bg-white/80 p-3 shadow-[0_12px_22px_rgba(43,117,172,.14)]">
        <div className="flex items-center justify-between border-b border-[#6ba8dd]/15 pb-2"><span className="h-2 w-24 rounded bg-[#165b91]/20" /><span className="h-5 w-14 rounded-full bg-[#e4f5ec]" /></div>
        <div className="space-y-2 pt-3"><div className="flex items-center gap-2 rounded-lg bg-white/80 p-2"><span className="h-6 w-6 rounded-md bg-[#ffd16a]" /><span className="h-2 w-24 rounded bg-[#165b91]/20" /><span className="ml-auto h-2 w-8 rounded bg-[#165b91]/10" /></div><div className="flex items-center gap-2 rounded-lg bg-white/80 p-2"><span className="h-6 w-6 rounded-md bg-[#8b80ec]" /><span className="h-2 w-32 rounded bg-[#165b91]/20" /><span className="ml-auto h-2 w-8 rounded bg-[#165b91]/10" /></div></div>
      </div>
    </div>
  );
  if (variant === "learn") return (
    <div className={`${shell} bg-[#fff1c9]`}>
      <div className="absolute right-[-30px] top-[-30px] h-40 w-40 rounded-full bg-[#ffd16a]" /><div className="absolute bottom-[-40px] left-[-20px] h-36 w-36 rounded-full bg-[#f5ad78]/40" />
      <div className="absolute left-[12%] top-[13%] w-[76%] rounded-2xl bg-[#fffaf1]/90 p-3 shadow-[0_12px_22px_rgba(170,113,26,.15)]"><div className="h-2 w-28 rounded bg-[#9d6717]/25" /><div className="mt-2 h-1.5 w-20 rounded bg-[#9d6717]/10" /><div className="mt-4 grid grid-cols-2 gap-2"><div className="h-14 rounded-xl bg-[#e9f4e9] p-2"><div className="h-3 w-3 rounded bg-[#58a775]" /><div className="mt-4 h-1.5 w-12 rounded bg-[#58a775]/30" /></div><div className="h-14 rounded-xl bg-[#eeeaff] p-2"><div className="h-3 w-3 rounded bg-[#7568df]" /><div className="mt-4 h-1.5 w-12 rounded bg-[#7568df]/30" /></div></div></div>
    </div>
  );
  if (variant === "shop") return (
    <div className={`${shell} bg-[#dff3e7]`}>
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#9ed9b4]" /><div className="absolute bottom-[-30px] left-[15%] h-32 w-32 rounded-full bg-[#ffd37a]/70" />
      <div className="absolute left-[12%] top-[15%] w-[76%] rounded-2xl bg-white/90 p-3 shadow-[0_12px_22px_rgba(44,126,81,.13)]"><div className="flex justify-between"><span className="h-2 w-16 rounded bg-[#24714a]/30" /><span className="h-4 w-4 rounded-full bg-[#f8bd60]" /></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="h-16 rounded-lg bg-[#ccebd8]" /><div className="h-16 rounded-lg bg-[#ffe6b4]" /><div className="h-16 rounded-lg bg-[#d8d4fb]" /></div><div className="mt-3 h-2 w-24 rounded bg-[#24714a]/15" /></div>
    </div>
  );
  return (
    <div className={`${shell} bg-[#dcefe9]`}>
      <div className="absolute right-8 top-5 h-16 w-16 rounded-full border-[10px] border-[#74c4a3]/70" /><div className="absolute bottom-[-25px] left-[-10px] h-36 w-36 rounded-full bg-[#a2d5bc]" />
      <div className="absolute left-[14%] top-[18%] flex w-[72%] items-center gap-2 rounded-xl bg-white/80 p-3 shadow-md"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#85c8a3] text-white"><Check size={17} /></span><div><div className="h-2 w-24 rounded bg-[#246148]/25" /><div className="mt-2 h-1.5 w-16 rounded bg-[#246148]/10" /></div></div>
    </div>
  );
}
function ProjectCard({ project, liked, onLike, onOpen }: { project: Project; liked: boolean; onLike: (id: number) => void; onOpen: (project: Project) => void }) {
  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#e8e9e6] bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
      <button onClick={() => onOpen(project)} className="block w-full text-left"><div className="relative m-2.5 h-[188px]"><ProjectArt variant={project.variant} /><div className="absolute left-3 top-3 flex gap-1.5"><StatusBadge status={project.status} />{project.badge && project.badge !== "Haftaning topi" && <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold text-[#6857E5] shadow-sm">{project.badge}</span>}</div><button aria-label="Saqlash" onClick={(e) => { e.stopPropagation(); }} className="absolute right-3 top-3 rounded-lg bg-white/80 p-2 text-[#68717e] shadow-sm backdrop-blur transition hover:text-[#6857E5]"><Bookmark size={15} /></button></div></button>
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-start justify-between gap-2"><div><button onClick={() => onOpen(project)} className="text-[16px] font-extrabold tracking-[-.03em] hover:text-[#6857E5]">{project.title}</button><p className="mt-1 line-clamp-1 text-[12px] text-[#7d8593]">{project.tagline}</p></div><span className="rounded-md bg-[#f4f4f2] px-2 py-1 text-[10px] font-semibold text-[#7d8593]">{project.category}</span></div>
        <div className="mt-4 flex items-center justify-between border-t border-[#f0f0ed] pt-3"><div className="flex items-center gap-2"><Avatar initials={project.initials} small /><span className="text-[11px] font-semibold text-[#656d78]">{project.owner.split(" ")[0]}</span></div><div className="flex items-center gap-3 text-[11px] font-semibold text-[#8b929c]"><span className="flex items-center gap-1"><MessageCircle size={13}/>{project.comments}</span><button onClick={() => onLike(project.id)} className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition ${liked ? "bg-[#eeebff] text-[#6857E5]" : "hover:bg-[#f5f3ff] hover:text-[#6857E5]"}`}><Heart size={13} fill={liked ? "currentColor" : "none"}/>{project.votes + (liked ? 1 : 0)}</button></div></div>
      </div>
    </article>
  );
}

function Sidebar({ active, setActive, open, close }: { active: Section; setActive: (s: Section) => void; open: boolean; close: () => void }) {
  const mainNav: { id: Section; label: string; icon: LucideIcon }[] = [
    { id: "discover", label: "Kashf etish", icon: LayoutGrid },
    { id: "projects", label: "Loyihalar", icon: Rocket },
    { id: "products", label: "Mahsulotlar", icon: ShoppingBag },
    { id: "marketplace", label: "Buyurtmalar", icon: BriefcaseBusiness }
  ];
  return <>
    <div onClick={close} className={`mobile-backdrop fixed inset-0 z-40 hidden bg-[#18212f]/25 backdrop-blur-sm`} />
    <aside className={`sidebar-shell fixed bottom-0 left-0 top-0 z-50 flex w-[248px] flex-col border-r border-[#ebebe8] bg-[#fbfbf9] px-4 py-7 lg:translate-x-0 ${open ? "open" : ""}`}>
      <div className="mb-11 flex items-center justify-between"><Logo /><button onClick={close} className="rounded-lg p-1 text-[#8b929c] hover:bg-white lg:hidden"><X size={18}/></button></div>
      <div className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a4a9b0]">Asosiy menyu</div>
      <nav className="space-y-1">
        {mainNav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActive(id); close(); }} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-bold transition ${active === id ? "bg-[#eeebff] text-[#6857E5]" : "text-[#717985] hover:bg-white hover:text-[#18212F]"}`}><Icon size={17} strokeWidth={active === id ? 2.5 : 2}/><span>{label}</span>{id === "marketplace" && <span className="ml-auto rounded-full bg-[#ffebe5] px-1.5 py-0.5 text-[9px] font-extrabold text-[#d46e59]">12</span>}</button>)}
        <button onClick={() => { setActive("winners"); close(); }} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-bold transition ${active === "winners" ? "bg-[#eeebff] text-[#6857E5]" : "text-[#717985] hover:bg-white hover:text-[#18212F]"}`}><Trophy size={17}/><span>G'oliblar</span></button>
      </nav>
      <div className="mb-3 mt-10 px-3 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a4a9b0]">Siz uchun</div>
      <nav className="space-y-1"><button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-bold text-[#717985] transition hover:bg-white hover:text-[#18212F]"><Bookmark size={17}/><span>Saqlanganlar</span></button><button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-bold text-[#717985] transition hover:bg-white hover:text-[#18212F]"><MessageCircle size={17}/><span>Xabarlar</span><span className="ml-auto h-2 w-2 rounded-full bg-[#ff8a72]"/></button></nav>
      <div className="mt-auto"><div className="mb-5 rounded-2xl bg-[#f2f0ff] p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#6857E5] shadow-sm"><Sparkles size={16}/></div><p className="text-[12px] font-extrabold leading-4 text-[#38316d]">Loyihangizni namoyish eting</p><p className="mt-1.5 text-[11px] leading-4 text-[#77719d]">Yangi auditoriya va samimiy feedback oling.</p><button className="mt-3 text-[11px] font-extrabold text-[#6857E5]">Batafsil <ArrowUpRight className="ml-1 inline" size={12}/></button></div><button onClick={() => { setActive("dashboard"); close(); }} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white ${active === "dashboard" ? "bg-white shadow-soft" : ""}`}><Avatar initials="AS" className="bg-[#ffd9b8] text-[#a65e2a]"/><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-extrabold">Abror S.</span><span className="block text-[10px] text-[#8b929c]">Dasturchi</span></span><Settings size={15} className="text-[#9299a2]"/></button></div>
    </aside>
  </>;
}

function Header({ onMenu, onAdd, onAuth, dark, setDark, query, setQuery }: { onMenu: () => void; onAdd: () => void; onAuth: () => void; dark: boolean; setDark: (d: boolean) => void; query: string; setQuery: (q: string) => void }) {
  return <header className="sticky top-0 z-30 border-b border-[#ebebe8]/80 bg-[#fbfbf9]/90 backdrop-blur-xl"><div className="flex h-[76px] items-center gap-4 px-5 sm:px-8 lg:px-10"><button onClick={onMenu} className="rounded-lg p-2 text-[#68717e] hover:bg-white lg:hidden"><Menu size={21}/></button><div className="relative max-w-[360px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba0a9]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Loyiha, kategoriya qidiring..." className="h-10 w-full rounded-xl border border-[#e8e9e6] bg-white pl-10 pr-4 text-[12px] font-medium outline-none transition placeholder:text-[#a9adb4] focus:border-[#b8b0f5] focus:ring-4 focus:ring-[#eeebff]"/></div><div className="ml-auto flex items-center gap-2 sm:gap-3"><button onClick={() => setDark(!dark)} className="hidden rounded-lg p-2.5 text-[#8d949d] transition hover:bg-white hover:text-[#18212F] sm:block">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="relative rounded-lg p-2.5 text-[#8d949d] transition hover:bg-white hover:text-[#18212F]"><Bell size={18}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ff8066] ring-2 ring-[#fbfbf9]"/></button><button onClick={onAdd} className="flex h-10 items-center gap-2 rounded-xl bg-[#6857E5] px-3.5 text-[12px] font-extrabold text-white shadow-[0_6px_14px_rgba(104,87,229,.2)] transition hover:bg-[#5847d2] hover:shadow-[0_8px_18px_rgba(104,87,229,.3)]"><Plus size={16}/><span className="hidden sm:block">Loyiha qo'shish</span></button><button onClick={onAuth} aria-label="Profilga kirish"><Avatar initials="AS" className="hidden bg-[#ffd9b8] text-[#a65e2a] sm:inline-flex"/></button></div></div></header>;
}

function IntroHero({ onAdd, onOpen }: { onAdd: () => void; onOpen: () => void }) {
  return <section className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(290px,.7fr)]">
    <div className="relative min-h-[296px] overflow-hidden rounded-[22px] bg-[#20283a] p-7 text-white shadow-[0_16px_35px_rgba(24,33,47,.11)] sm:p-9"><div className="absolute right-[-100px] top-[-100px] h-[330px] w-[330px] rounded-full border-[45px] border-[#534697]/50"/><div className="absolute bottom-[-130px] right-[23%] h-[260px] w-[260px] rounded-full border-[30px] border-[#eb8068]/20"/><div className="relative z-10 max-w-[480px]"><div className="mb-5 flex items-center gap-2 text-[11px] font-bold text-[#b8b2ff]"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#6857E5] text-white"><Sparkles size={11}/></span> O'zbekistonning kreativ hamjamiyati</div><h1 className="max-w-[470px] text-[32px] font-black leading-[1.08] tracking-[-.06em] sm:text-[38px]">Yaxshi g'oyalar<br/><span className="text-[#a49bff]">ko'rinishga</span> loyiq.</h1><p className="mt-4 max-w-[390px] text-[13px] leading-5 text-[#bbc0cd]">Loyihangizni ulashing, samimiy feedback oling va keyingi katta qadamni birga tashlang.</p><div className="mt-7 flex items-center gap-3"><button onClick={onAdd} className="rounded-xl bg-white px-4 py-3 text-[12px] font-extrabold text-[#20283a] transition hover:bg-[#f5f3ff]"><Plus className="mr-1.5 inline" size={15}/> Loyihani joylash</button><button onClick={onOpen} className="rounded-xl border border-white/20 px-4 py-3 text-[12px] font-bold text-white transition hover:bg-white/10">Kashf etish <ArrowUpRight className="ml-1 inline" size={14}/></button></div></div><div className="absolute bottom-7 right-8 hidden w-[200px] rotate-[5deg] rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md lg:block float-slow"><div className="mb-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f8ca6a] text-[#4c3a4f]"><Zap size={13} fill="currentColor"/></span><span className="text-[9px] font-bold text-white/60">TRENDING NOW</span></div><div className="h-2 w-28 rounded bg-white/40"/><div className="mt-2 h-1.5 w-20 rounded bg-white/15"/><div className="mt-4 flex -space-x-1.5"><Avatar initials="NB" small className="bg-[#cae7de] text-[#286953]"/><Avatar initials="SM" small className="bg-[#ffd3c3] text-[#a65b48]"/><Avatar initials="+24" small className="bg-[#6857E5] text-white"/></div></div></div>
    <div className="rounded-[22px] border border-[#e8e9e6] bg-white p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#a0a6af]">Hafta topi</p><h2 className="mt-1.5 text-[20px] font-black tracking-[-.05em]">Flowmap</h2></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff4d9] text-[#d49122]"><Trophy size={18}/></span></div><div onClick={onOpen} className="mt-4 cursor-pointer"><div className="h-[125px]"><ProjectArt variant="flow"/></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><Avatar initials="AQ" small/><span className="text-[11px] font-bold text-[#68717e]">Azizbek Q.</span></div><span className="flex items-center gap-1 text-[12px] font-extrabold text-[#6857E5]"><Heart size={13} fill="currentColor"/> 384</span></div></div><div className="mt-4 flex items-center justify-between border-t border-[#f0f0ed] pt-3 text-[11px] text-[#858c96]"><span className="flex items-center gap-1.5"><Clock3 size={13}/> 2 kun qoldi</span><button onClick={onOpen} className="font-extrabold text-[#6857E5]">Ko'rish <ArrowUpRight className="ml-1 inline" size={12}/></button></div></div>
  </section>;
}

function StatBar() {
  return <section className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#e8e9e6] bg-[#e8e9e6] sm:grid-cols-4"><div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a1a7af]">Hamjamiyat</p><p className="mt-1 text-[21px] font-black tracking-[-.05em]">12,480 <span className="align-middle text-[12px] font-bold text-[#45a876]">+18%</span></p></div><div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a1a7af]">Faol loyihalar</p><p className="mt-1 text-[21px] font-black tracking-[-.05em]">1,240 <span className="align-middle text-[12px] font-bold text-[#45a876]">+32</span></p></div><div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a1a7af]">Berilgan roastlar</p><p className="mt-1 text-[21px] font-black tracking-[-.05em]">8,695 <span className="align-middle text-[12px] font-bold text-[#45a876]">+1.2k</span></p></div><div className="bg-white px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#a1a7af]">Yakunlangan ishlar</p><p className="mt-1 text-[21px] font-black tracking-[-.05em]">389 <span className="align-middle text-[12px] font-bold text-[#45a876]">+14%</span></p></div></section>;
}

function SectionHeading({ title, caption, action, onAction }: { title: string; caption?: string; action?: string; onAction?: () => void }) {
  return <div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-[21px] font-black tracking-[-.05em]">{title}</h2>{caption && <p className="mt-1 text-[12px] text-[#878e98]">{caption}</p>}</div>{action && <button onClick={onAction} className="whitespace-nowrap text-[12px] font-extrabold text-[#6857E5] hover:text-[#4f3cc4]">{action} <ArrowUpRight className="ml-1 inline" size={13}/></button>}</div>;
}

function Discover({ onAdd, openProject, liked, onLike, onSection }: { onAdd: () => void; openProject: (project: Project) => void; liked: number[]; onLike: (id: number) => void; onSection: (s: Section) => void }) {
  return <><IntroHero onAdd={onAdd} onOpen={() => openProject(projects[0])}/><StatBar/><section><SectionHeading title="So'nggi loyihalar" caption="Hamjamiyatdagi eng yangi va qiziqarli g'oyalar" action="Barchasini ko'rish" onAction={() => onSection("projects")}/><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} liked={liked.includes(project.id)} onLike={onLike} onOpen={openProject}/>)}</div></section><section className="mt-10"><SectionHeading title="Sizga foydali bo'lishi mumkin" caption="Jamoadoshlar izlayotgan yangi buyurtmalar" action="Barcha buyurtmalar" onAction={() => onSection("marketplace")}/><div className="grid gap-3 md:grid-cols-3">{orders.map((order) => <OrderMini key={order.id} order={order} onOpen={() => onSection("marketplace")}/>)}</div></section></>;
}

function OrderMini({ order, onOpen }: { order: typeof orders[number]; onOpen: () => void }) {
  return <button onClick={onOpen} className="group rounded-2xl border border-[#e8e9e6] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-start justify-between gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${order.urgent ? "bg-[#ffebe5] text-[#dd765f]" : "bg-[#eeebff] text-[#6857E5]"}`}><BriefcaseBusiness size={15}/></span>{order.urgent && <span className="rounded-full bg-[#fff1eb] px-2 py-1 text-[9px] font-extrabold text-[#d8755e]">TEZKOR</span>}</div><h3 className="mt-4 line-clamp-1 text-[14px] font-extrabold tracking-[-.02em] group-hover:text-[#6857E5]">{order.title}</h3><div className="mt-3 flex flex-wrap gap-1.5">{order.tags.map((tag) => <span className="rounded-md bg-[#f4f4f2] px-2 py-1 text-[10px] font-bold text-[#7d8593]" key={tag}>{tag}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#f0f0ed] pt-3"><span className="text-[12px] font-extrabold text-[#273345]">{order.budget}</span><span className="text-[10px] font-semibold text-[#9ba0a9]">{order.proposals} taklif</span></div></button>;
}

function ProjectListing({ projectsToShow, liked, onLike, onOpen, query, filter, setFilter }: { projectsToShow: Project[]; liked: number[]; onLike: (id: number) => void; onOpen: (p: Project) => void; query: string; filter: string; setFilter: (f: string) => void }) {
  return <div><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a0a6af]">Ilhom va feedback maydoni</p><h1 className="text-[30px] font-black tracking-[-.065em]">Barcha loyihalar</h1><p className="mt-2 text-[13px] text-[#858c96]">O'zbekistonlik ijodkorlar nimalar yaratayotganini ko'ring.</p></div><button className="flex w-fit items-center gap-2 rounded-xl border border-[#e4e4e1] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#646d78]"><SlidersHorizontal size={15}/> Filtrlar <ChevronDown size={14}/></button></div><div className="mb-6 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">{categories.map((cat) => <button onClick={() => setFilter(cat)} key={cat} className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[11px] font-extrabold transition ${filter === cat ? "bg-[#18212F] text-white" : "border border-[#e6e7e4] bg-white text-[#7d8593] hover:border-[#c8c4ef] hover:text-[#6857E5]"}`}>{cat}</button>)}</div>{projectsToShow.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{projectsToShow.map((project) => <ProjectCard key={project.id} project={project} liked={liked.includes(project.id)} onLike={onLike} onOpen={onOpen}/>)}</div> : <EmptyState text="Bu qidiruv bo'yicha loyiha topilmadi."/>}</div>;
}

function ProductsView({ onOpen }: { onOpen: (p: Project) => void }) {
  return <div><div className="mb-8 flex flex-col justify-between gap-5 rounded-[22px] bg-[#eaf6f0] px-7 py-7 sm:flex-row sm:items-center sm:px-9"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#45a876]">Tayyor mahsulotlar</p><h1 className="text-[29px] font-black tracking-[-.06em]">Foydali narsalar bir joyda.</h1><p className="mt-2 max-w-[460px] text-[13px] leading-5 text-[#5f816d]">Ishga tushgan mahsulotlarni sinab ko'ring, baholang va o'zingizga mosini toping.</p></div><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white text-[#45a876] shadow-sm"><ShoppingBag size={34} strokeWidth={1.5}/></div></div><SectionHeading title="Mashhur mahsulotlar" caption="Hamjamiyat tomonidan eng ko'p qo'llab-quvvatlanganlar" action="Mahsulot joylash"/><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{projects.filter(p => p.status === "Ishga tushgan" || p.id === 1).map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen}/>)}</div><div className="mt-9"><SectionHeading title="Kategoriyalar"/><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{["AI vositalari", "Biznes uchun", "Ta'lim", "Produktivlik"].map((x, i) => <div key={x} className="rounded-2xl border border-[#e8e9e6] bg-white p-4"><span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${["bg-[#eeebff] text-[#6857E5]", "bg-[#fff1d7] text-[#c08720]", "bg-[#e4f5ed] text-[#319166]", "bg-[#ffe9e4] text-[#d27661]"][i]}`}><Sparkles size={15}/></span><p className="text-[12px] font-extrabold">{x}</p><p className="mt-1 text-[10px] text-[#9ba0a9]">{[23, 41, 18, 36][i]} mahsulot</p></div>)}</div></div></div>;
}

function ProductCard({ p, onOpen }: { p: Project; onOpen: (p: Project) => void }) {
  return <article className="rounded-[18px] border border-[#e8e9e6] bg-white p-3 transition hover:shadow-card"><div className="flex gap-4"><div className="h-[136px] w-[38%] shrink-0"><ProjectArt variant={p.variant}/></div><div className="flex min-w-0 flex-1 flex-col py-1"><div className="flex items-start justify-between gap-2"><span className="rounded-md bg-[#e8f7ef] px-2 py-1 text-[10px] font-bold text-[#228658]">Tasdiqlangan</span><button className="text-[#a0a6af]"><Bookmark size={15}/></button></div><button onClick={() => onOpen(p)} className="mt-3 text-left text-[16px] font-black tracking-[-.04em] hover:text-[#6857E5]">{p.title}</button><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#7d8593]">{p.tagline}</p><div className="mt-auto flex items-center justify-between pt-2"><span className="flex items-center gap-1 text-[11px] font-bold text-[#dc9c35]"><Star size={13} fill="currentColor"/>{p.rating}</span><button onClick={() => onOpen(p)} className="text-[11px] font-extrabold text-[#6857E5]">Sinab ko'rish <ArrowUpRight className="ml-1 inline" size={12}/></button></div></div></div></article>;
}

function Marketplace({ onProposal }: { onProposal: (title: string) => void }) {
  return <div><div className="mb-8 flex flex-col justify-between gap-5 rounded-[22px] bg-[#fff2dc] px-7 py-7 sm:flex-row sm:items-center sm:px-9"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#c48727]">Launchly marketplace</p><h1 className="text-[29px] font-black tracking-[-.06em]">G'oyani ishga tushiring.</h1><p className="mt-2 max-w-[470px] text-[13px] leading-5 text-[#97764a]">Sizga kerakli mutaxassisni toping yoki o'z mahoratingizni foydali ishga aylantiring.</p></div><button className="flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[#20283a] px-4 py-3 text-[12px] font-extrabold text-white transition hover:bg-[#303b51]"><Plus size={15}/> Buyurtma qoldirish</button></div><div className="mb-5 flex items-center justify-between"><div><h2 className="text-[21px] font-black tracking-[-.05em]">Ochiq buyurtmalar</h2><p className="mt-1 text-[12px] text-[#878e98]">Sizning keyingi katta imkoniyatingiz shu yerda.</p></div><button className="flex items-center gap-2 rounded-xl border border-[#e5e6e3] bg-white px-3 py-2.5 text-[11px] font-extrabold text-[#68717e]"><SlidersHorizontal size={14}/> Saralash</button></div><div className="space-y-3">{orders.map((order) => <OrderRow key={order.id} order={order} onProposal={() => onProposal(order.title)}/>)}</div></div>;
}

function OrderRow({ order, onProposal }: { order: typeof orders[number]; onProposal: () => void }) {
  return <article className="rounded-[17px] border border-[#e8e9e6] bg-white p-5 transition hover:shadow-soft sm:p-6"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 gap-3.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f1ff] text-[#6857E5]"><BriefcaseBusiness size={18}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-extrabold tracking-[-.025em]">{order.title}</h3>{order.urgent && <span className="rounded-md bg-[#fff0ea] px-2 py-1 text-[9px] font-extrabold uppercase text-[#d77961]">Tezkor</span>}</div><p className="mt-1.5 max-w-[600px] truncate text-[12px] text-[#858c96]">{order.desc}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#f4f4f2] px-2 py-1 text-[10px] font-bold text-[#7d8593]">{order.tags[0]}</span><span className="rounded-md bg-[#f4f4f2] px-2 py-1 text-[10px] font-bold text-[#7d8593]">{order.tags[1]}</span><span className="ml-1 text-[10px] font-medium text-[#a0a6af]">• {order.time}</span></div></div></div><div className="flex items-center justify-between gap-5 border-t border-[#f0f0ed] pt-4 md:w-[330px] md:border-0 md:pt-0"><div><p className="text-[15px] font-black tracking-[-.03em]">{order.budget}</p><p className="mt-1 text-[10px] text-[#9399a1]">{order.proposals} ta taklif keldi</p></div><button onClick={onProposal} className="rounded-xl bg-[#eeebff] px-3.5 py-2.5 text-[11px] font-extrabold text-[#6857E5] transition hover:bg-[#6857E5] hover:text-white">Taklif yuborish</button></div></div></article>;
}

function Winners({ onOpen }: { onOpen: (p: Project) => void }) {
  const podium = [projects[0], projects[1], projects[2]];
  return <div><div className="mb-8"><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#c38d25]">Harakatni nishonlaymiz</p><h1 className="text-[30px] font-black tracking-[-.065em]">G'oliblar arxivi</h1><p className="mt-2 text-[13px] text-[#858c96]">Har hafta eng ko'p qo'llab-quvvatlangan loyihalar.</p></div><div className="mb-8 flex items-center gap-2 overflow-x-auto border-b border-[#e8e9e6] pb-3 hide-scrollbar"><button className="rounded-lg bg-[#18212F] px-4 py-2 text-[11px] font-extrabold text-white">Avgust, 2026</button><button className="rounded-lg px-4 py-2 text-[11px] font-extrabold text-[#858c96] hover:bg-white">Iyul, 2026</button><button className="rounded-lg px-4 py-2 text-[11px] font-extrabold text-[#858c96] hover:bg-white">Iyun, 2026</button></div><div className="grid gap-4 md:grid-cols-3">{podium.map((p, i) => <button onClick={() => onOpen(p)} key={p.id} className={`relative rounded-[20px] border bg-white p-3 text-left transition hover:-translate-y-1 hover:shadow-card ${i === 0 ? "border-[#e6d39f] md:-translate-y-2" : "border-[#e8e9e6]"}`}><div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#fff2cf] text-[12px] font-black text-[#bd8420]">{i + 1}</div><div className="h-[170px]"><ProjectArt variant={p.variant}/></div><div className="px-2 pb-2 pt-4"><p className="text-[17px] font-black tracking-[-.04em]">{p.title}</p><p className="mt-1 text-[11px] text-[#858c96]">{p.tagline}</p><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1 text-[11px] font-extrabold text-[#6857E5]"><Heart size={13} fill="currentColor"/> {p.votes} ovoz</span><span className="text-[10px] font-bold text-[#a0a6af]">{p.category}</span></div></div></button>)}</div><div className="mt-8 rounded-2xl border border-dashed border-[#dcded9] bg-white/50 p-8 text-center"><Trophy className="mx-auto text-[#d9a740]" size={25}/><p className="mt-3 text-[14px] font-extrabold">Keyingi g'olib siz bo'lishingiz mumkin</p><p className="mx-auto mt-1 max-w-[350px] text-[12px] text-[#858c96]">Loyihangizni joylang va hamjamiyatdan birinchi feedbackni oling.</p></div></div>;
}

function Dashboard() {
  return <div><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a0a6af]">Shaxsiy kabinet</p><h1 className="text-[30px] font-black tracking-[-.065em]">Salom, Abror <span>👋</span></h1><p className="mt-2 text-[13px] text-[#858c96]">Bugun loyihalaringizda qanday yangiliklar bor?</p></div><button className="hidden items-center gap-2 rounded-xl border border-[#e6e7e4] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#68717e] sm:flex"><BarChart3 size={14}/> Hisobotni yuklash</button></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><DashStat icon={Eye} label="Ko'rishlar" value="4,892" change="+18.4%" color="purple"/><DashStat icon={Heart} label="Qo'llab-quvvatlash" value="847" change="+12.8%" color="coral"/><DashStat icon={MessageCircle} label="Yangi roastlar" value="36" change="+8.2%" color="yellow"/><DashStat icon={Zap} label="Profil kuchi" value="78%" change="Yaxshi" color="green"/></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-[18px] border border-[#e8e9e6] bg-white p-5"><SectionHeading title="Mening loyihalarim" action="Barchasi"/><div className="space-y-1">{projects.slice(0, 3).map((p) => <div key={p.id} className="flex items-center gap-3 border-b border-[#f0f0ed] py-3 last:border-0"><div className="h-10 w-12 shrink-0"><ProjectArt variant={p.variant}/></div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-extrabold">{p.title}</p><p className="mt-1 text-[10px] text-[#9299a2]">{p.views} ko'rish • {p.comments} roast</p></div><StatusBadge status={p.status}/><ChevronDown size={14} className="rotate-[-90deg] text-[#b2b6bd]"/></div>)}</div></div><div className="rounded-[18px] border border-[#e8e9e6] bg-white p-5"><SectionHeading title="So'nggi faollik" action="Barchasi"/><div className="space-y-4"><Activity initials="NB" text="Nodira" action="Flowmap loyihangizga roast qoldirdi" time="12 daqiqa oldin" color="bg-[#f4daff] text-[#9654ac]"/><Activity initials="SM" text="Sardor" action="OvozAI loyihangizni qo'llab-quvvatladi" time="1 soat oldin" color="bg-[#d7efff] text-[#397ca5]"/><Activity initials="MK" text="Malika" action="Sizga yangi buyurtma taklifi yubordi" time="3 soat oldin" color="bg-[#ffe0c6] text-[#a66b37]"/></div></div></div></div>;
}

function DashStat({ icon: Icon, label, value, change, color }: { icon: LucideIcon; label: string; value: string; change: string; color: string }) { const colors: Record<string, string> = { purple: "bg-[#eeebff] text-[#6857E5]", coral: "bg-[#ffebe5] text-[#d9765f]", yellow: "bg-[#fff2d6] text-[#c18728]", green: "bg-[#e7f6ee] text-[#328c64]" }; return <div className="rounded-[16px] border border-[#e8e9e6] bg-white p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}><Icon size={15}/></span><p className="mt-4 text-[10px] font-bold text-[#9299a2]">{label}</p><div className="mt-1 flex items-end justify-between gap-1"><span className="text-[21px] font-black tracking-[-.05em]">{value}</span><span className="mb-1 text-[9px] font-extrabold text-[#45a876]">{change}</span></div></div>; }
function Activity({ initials, text, action, time, color }: { initials: string; text: string; action: string; time: string; color: string }) { return <div className="flex gap-3"><Avatar initials={initials} small className={color}/><div><p className="text-[11px] leading-4"><span className="font-extrabold">{text}</span> {action}</p><p className="mt-1 text-[10px] text-[#a0a6af]">{time}</p></div></div>; }

function DetailModal({ project, close, liked, onLike }: { project: Project; close: () => void; liked: boolean; onLike: (id: number) => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#18212f]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="max-h-[93vh] w-full max-w-[800px] overflow-y-auto rounded-t-[24px] bg-[#fbfbf9] p-4 shadow-2xl sm:rounded-[24px] sm:p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#9ca2aa]"><span className="h-2 w-2 rounded-full bg-[#6857E5]"/> Loyiha tafsilotlari</div><button onClick={close} className="rounded-lg p-2 text-[#8d949d] transition hover:bg-white hover:text-[#18212F]"><X size={19}/></button></div><div className="h-[220px] sm:h-[275px]"><ProjectArt variant={project.variant} large/></div><div className="grid gap-7 pt-6 md:grid-cols-[1fr_220px]"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={project.status}/><span className="rounded-md bg-[#f0f1f3] px-2 py-1 text-[10px] font-bold text-[#747d88]">{project.category}</span></div><h2 className="mt-3 text-[28px] font-black tracking-[-.06em]">{project.title}</h2><p className="mt-2 text-[14px] leading-6 text-[#69727f]">{project.description || project.tagline}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => onLike(project.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-extrabold transition ${liked ? "bg-[#6857E5] text-white" : "bg-[#eeebff] text-[#6857E5] hover:bg-[#dfd9ff]"}`}><Heart size={15} fill={liked ? "currentColor" : "none"}/> {project.votes + (liked ? 1 : 0)} Qo'llab-quvvatlash</button><button className="flex items-center gap-2 rounded-xl border border-[#e6e7e4] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#69727f]"><ExternalLink size={14}/> Demo ko'rish</button></div><div className="mt-8 border-t border-[#e8e9e6] pt-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-[15px] font-black">Roast & feedback <span className="ml-1 text-[12px] font-bold text-[#a0a6af]">{project.comments}</span></h3><button className="text-[11px] font-extrabold text-[#6857E5]">Eng foydali</button></div><div className="mb-4 flex gap-3"><Avatar initials="AS" className="bg-[#ffd9b8] text-[#a65e2a]"/><div className="flex-1 rounded-xl border border-[#e8e9e6] bg-white p-3"><input className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#a5aab1]" placeholder="Loyiha haqida fikringizni yozing..."/><div className="mt-3 flex justify-end"><button className="flex items-center gap-1.5 rounded-lg bg-[#18212F] px-3 py-2 text-[10px] font-extrabold text-white"><Send size={12}/> Yuborish</button></div></div></div>{[["NB", "Nodira B.", "G'oya juda qiziqarli! Onboarding qismini biroz soddalashtirsangiz, yangi foydalanuvchilar tezroq moslashadi.", "12 daqiqa oldin"], ["SM", "Sardor M.", "Aynan shunday yechimni izlayotgandim. Dizayn ham juda toza chiqibdi, omad!", "1 soat oldin"]].map(([initials, name, comment, time]) => <div className="mb-4 flex gap-3" key={name}><Avatar initials={initials} small className="bg-[#d7efff] text-[#397ca5]"/><div><div className="flex items-center gap-2"><span className="text-[11px] font-extrabold">{name}</span><span className="text-[10px] text-[#a0a6af]">{time}</span></div><p className="mt-1 text-[12px] leading-5 text-[#69727f]">{comment}</p><button className="mt-2 text-[10px] font-extrabold text-[#9ba0a9]">Javob berish</button></div></div>)}</div></div><aside className="rounded-2xl border border-[#e8e9e6] bg-white p-4"><div className="flex items-center gap-3"><Avatar initials={project.initials} className="bg-[#e3e6ff] text-[#5b50b8]"/><div><p className="text-[12px] font-extrabold">{project.owner}</p><p className="mt-0.5 text-[10px] text-[#8b929c]">Dasturchi</p></div></div><div className="my-4 border-t border-[#f0f0ed] pt-4"><div className="flex items-center justify-between text-[11px]"><span className="text-[#9299a2]">Reyting</span><span className="flex items-center gap-1 font-extrabold text-[#c18728]"><Star size={13} fill="currentColor"/> {project.rating}/5</span></div><div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-[#9299a2]">Ko'rishlar</span><span className="font-extrabold">{project.views}</span></div></div><button className="w-full rounded-xl bg-[#18212F] py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#303b51]">Profilni ko'rish</button></aside></div></div></div>;
}


function AuthModal({ close }: { close: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"developer" | "investor">("developer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    if (!supabase) {
      setMessage("Demo rejimi: Supabase kalitlarini ulab, keyin davom eting.");
      setBusy(false);
      return;
    }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { role, full_name: email.split("@")[0] } } });
    if (result.error) setMessage(result.error.message);
    else { setMessage(mode === "login" ? "Muvaffaqiyatli kirdingiz." : "Email manzilingizni tasdiqlang."); setTimeout(close, 700); }
    setBusy(false);
  };

  const googleLogin = async () => {
    if (!supabase) { setMessage("Demo rejimi: Supabase kalitlarini ulab, keyin davom eting."); return; }
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#18212f]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="w-full max-w-[470px] rounded-t-[24px] bg-[#fbfbf9] shadow-2xl sm:rounded-[24px]"><div className="flex items-center justify-between px-6 pb-2 pt-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a0a6af]">Launchly hamjamiyati</p><h2 className="mt-1 text-[22px] font-black tracking-[-.05em]">{mode === "login" ? "Xush kelibsiz 👋" : "Hamjamiyatga qo'shiling"}</h2></div><button onClick={close} className="rounded-lg p-2 text-[#8d949d] hover:bg-white"><X size={18}/></button></div><div className="p-6"><div className="mb-5 flex rounded-xl bg-[#f1f1ef] p-1"><button onClick={() => { setMode("login"); setMessage(""); }} className={`flex-1 rounded-lg py-2 text-[11px] font-extrabold ${mode === "login" ? "bg-white text-[#18212F] shadow-sm" : "text-[#9299a2]"}`}>Kirish</button><button onClick={() => { setMode("signup"); setMessage(""); }} className={`flex-1 rounded-lg py-2 text-[11px] font-extrabold ${mode === "signup" ? "bg-white text-[#18212F] shadow-sm" : "text-[#9299a2]"}`}>Ro'yxatdan o'tish</button></div>{mode === "signup" && <div className="mb-5"><p className="mb-2 text-[11px] font-extrabold">Siz kimsiz?</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setRole("developer")} className={`rounded-xl border p-3 text-left ${role === "developer" ? "border-[#a49bff] bg-[#f2f0ff]" : "border-[#e3e4e1] bg-white"}`}><Rocket size={16} className={role === "developer" ? "text-[#6857E5]" : "text-[#9299a2]"}/><span className="mt-2 block text-[11px] font-extrabold">Men dasturchiman</span><span className="mt-1 block text-[9px] text-[#9299a2]">Loyiha va takliflar</span></button><button onClick={() => setRole("investor")} className={`rounded-xl border p-3 text-left ${role === "investor" ? "border-[#a49bff] bg-[#f2f0ff]" : "border-[#e3e4e1] bg-white"}`}><Users size={16} className={role === "investor" ? "text-[#6857E5]" : "text-[#9299a2]"}/><span className="mt-2 block text-[11px] font-extrabold">Men foydalanuvchiman</span><span className="mt-1 block text-[9px] text-[#9299a2]">G'oyalarni qo'llang</span></button></div></div>}<div className="space-y-3"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email manzilingiz" type="email" className="h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none focus:border-[#9d93f2] focus:ring-4 focus:ring-[#eeebff]"/><input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" type="password" className="h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none focus:border-[#9d93f2] focus:ring-4 focus:ring-[#eeebff]"/></div><button disabled={busy} onClick={submit} className="mt-4 w-full rounded-xl bg-[#6857E5] py-3 text-[12px] font-extrabold text-white hover:bg-[#5847d2] disabled:opacity-60">{busy ? "Tekshirilmoqda..." : mode === "login" ? "Kirish" : "Hisob yaratish"}</button><div className="my-4 flex items-center gap-3 text-[10px] font-bold text-[#a0a6af]"><span className="h-px flex-1 bg-[#e8e9e6]"/> yoki <span className="h-px flex-1 bg-[#e8e9e6]"/></div><button onClick={googleLogin} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e1e2df] bg-white py-3 text-[11px] font-extrabold text-[#4a5461]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4c65f] text-[9px] font-black text-white">G</span> Google bilan davom etish</button>{message && <p className="mt-4 rounded-lg bg-[#fff3dc] p-2.5 text-center text-[10px] font-bold leading-4 text-[#a7711c]">{message}</p>}<p className="mt-4 text-center text-[10px] leading-4 text-[#a0a6af]">Davom etish orqali Launchly qoidalariga rozilik bildirasiz.</p></div></div></div>;
}
function AddProjectModal({ close }: { close: () => void }) {
  const [step, setStep] = useState(1);
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#18212f]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><div className="w-full max-w-[590px] overflow-hidden rounded-t-[24px] bg-[#fbfbf9] shadow-2xl sm:rounded-[24px]"><div className="flex items-center justify-between border-b border-[#e8e9e6] px-6 py-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a0a6af]">{step === 1 ? "1 / 2" : "2 / 2"}</p><h2 className="mt-1 text-[20px] font-black tracking-[-.05em]">Loyihangizni tanishtiring</h2></div><button onClick={close} className="rounded-lg p-2 text-[#8d949d] hover:bg-white"><X size={18}/></button></div><div className="p-6">{step === 1 ? <><label className="mb-2 block text-[11px] font-extrabold">Loyiha nomi</label><input autoFocus placeholder="Masalan, Flowmap" className="mb-5 h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[13px] outline-none focus:border-[#9d93f2] focus:ring-4 focus:ring-[#eeebff]"/><label className="mb-2 block text-[11px] font-extrabold">Qisqa tavsif</label><input placeholder="Bir jumlada loyihangiz haqida..." className="mb-5 h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[13px] outline-none focus:border-[#9d93f2] focus:ring-4 focus:ring-[#eeebff]"/><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-[11px] font-extrabold">Kategoriya</label><div className="relative"><select className="h-11 w-full appearance-none rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none"><option>SaaS</option><option>Sun'iy intellekt</option><option>Mobil ilova</option><option>Ta'lim</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3.5 text-[#9198a1]"/></div></div><div><label className="mb-2 block text-[11px] font-extrabold">Holati</label><div className="relative"><select className="h-11 w-full appearance-none rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none"><option>G'oya</option><option>MVP</option><option>Jarayonda</option><option>Ishga tushgan</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3.5 text-[#9198a1]"/></div></div></div></> : <><label className="mb-2 block text-[11px] font-extrabold">Loyiha haqida to'liqroq</label><textarea autoFocus placeholder="Muammo, yechim va nima uchun aynan sizning loyihangiz..." className="h-28 w-full resize-none rounded-xl border border-[#dedfdd] bg-white p-3.5 text-[13px] outline-none focus:border-[#9d93f2] focus:ring-4 focus:ring-[#eeebff]"/><label className="mb-2 mt-5 block text-[11px] font-extrabold">Demo yoki GitHub havolasi</label><div className="grid gap-3 sm:grid-cols-2"><input placeholder="https://demo.uz" className="h-11 rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none focus:border-[#9d93f2]"/><input placeholder="https://github.com/..." className="h-11 rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[12px] outline-none focus:border-[#9d93f2]"/></div><div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-[#cfd1ce] bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eeebff] text-[#6857E5]"><Plus size={17}/></span><div><p className="text-[11px] font-extrabold">Skrinshot qo'shish</p><p className="mt-0.5 text-[10px] text-[#9ba0a9]">PNG yoki JPG, 5MB gacha</p></div></div></>}</div><div className="flex justify-between border-t border-[#e8e9e6] px-6 py-4"><button onClick={step === 1 ? close : () => setStep(1)} className="rounded-xl px-4 py-2.5 text-[11px] font-extrabold text-[#818994] hover:bg-white">{step === 1 ? "Bekor qilish" : "Orqaga"}</button>{step === 1 ? <button onClick={() => setStep(2)} className="rounded-xl bg-[#6857E5] px-5 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#5847d2]">Davom etish <ArrowUpRight className="ml-1 inline" size={13}/></button> : <button onClick={close} className="rounded-xl bg-[#6857E5] px-5 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#5847d2]"><Check className="mr-1.5 inline" size={14}/> Joylash</button>}</div></div></div>;
}

function ProposalModal({ title, close }: { title: string; close: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#18212f]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="w-full max-w-[490px] rounded-t-[24px] bg-[#fbfbf9] shadow-2xl sm:rounded-[24px]"><div className="flex items-center justify-between border-b border-[#e8e9e6] px-6 py-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a0a6af]">Yangi taklif</p><h2 className="mt-1 text-[18px] font-black tracking-[-.04em]">{title}</h2></div><button onClick={close} className="rounded-lg p-2 text-[#8d949d] hover:bg-white"><X size={18}/></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-2 gap-3"><div><label className="mb-2 block text-[11px] font-extrabold">Narx ($)</label><input placeholder="500" className="h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[13px] outline-none focus:border-[#9d93f2]"/></div><div><label className="mb-2 block text-[11px] font-extrabold">Muddat</label><input placeholder="10 kun" className="h-11 w-full rounded-xl border border-[#dedfdd] bg-white px-3.5 text-[13px] outline-none focus:border-[#9d93f2]"/></div></div><div><label className="mb-2 block text-[11px] font-extrabold">Xabar</label><textarea placeholder="Nima uchun aynan siz mos ekanligingizni yozing..." className="h-24 w-full resize-none rounded-xl border border-[#dedfdd] bg-white p-3.5 text-[12px] outline-none focus:border-[#9d93f2]"/></div><button onClick={close} className="w-full rounded-xl bg-[#6857E5] py-3 text-[12px] font-extrabold text-white transition hover:bg-[#5847d2]">Taklifni yuborish <Send className="ml-1.5 inline" size={13}/></button></div></div></div>;
}

function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-[#dfe1dd] bg-white/60 p-12 text-center text-[13px] font-bold text-[#89919b]">{text}</div>; }

export default function Home() {
  const [active, setActive] = useState<Section>("discover");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [liked, setLiked] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Barchasi");
  const [dark, setDark] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);

  const filteredProjects = useMemo(() => projects.filter((p) => {
    const matchesQuery = !query || `${p.title} ${p.tagline} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "Barchasi" || p.category.toLowerCase().includes(filter.toLowerCase()) || (filter === "AI" && p.category === "Sun'iy intellekt") || (filter === "Mobil ilova" && p.category === "Mobil ilova");
    return matchesQuery && matchesFilter;
  }), [query, filter]);

  const toggleLike = (id: number) => setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const pageTitle: Record<Section, string> = { discover: "Kashf etish", projects: "Loyihalar", products: "Mahsulotlar", marketplace: "Buyurtmalar", winners: "G'oliblar", dashboard: "Kabinet" };

  return <div className={dark ? "dark-shell min-h-screen bg-[#131923] text-[#f8f8f4]" : "min-h-screen bg-[#fbfbf9] text-[#18212F]"}>
    <Sidebar active={active} setActive={setActive} open={mobileOpen} close={() => setMobileOpen(false)}/>
    <div className="min-h-screen lg:ml-[248px]">
      <Header onMenu={() => setMobileOpen(true)} onAdd={() => setShowAdd(true)} onAuth={() => setShowAuth(true)} dark={dark} setDark={setDark} query={query} setQuery={setQuery}/>
      <main className="mx-auto max-w-[1390px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {active !== "discover" && <div className="mb-6 flex items-center gap-2 text-[11px] font-bold text-[#a0a6af]"><span>Kashf etish</span><ChevronDown size={13} className="rotate-[-90deg]"/><span className="text-[#18212F]">{pageTitle[active]}</span></div>}
        {active === "discover" && <Discover onAdd={() => setShowAdd(true)} openProject={setSelected} liked={liked} onLike={toggleLike} onSection={setActive}/>} 
        {active === "projects" && <ProjectListing projectsToShow={filteredProjects} liked={liked} onLike={toggleLike} onOpen={setSelected} query={query} filter={filter} setFilter={setFilter}/>} 
        {active === "products" && <ProductsView onOpen={setSelected}/>} 
        {active === "marketplace" && <Marketplace onProposal={setProposal}/>} 
        {active === "winners" && <Winners onOpen={setSelected}/>} 
        {active === "dashboard" && <Dashboard/>}
      </main>
      <footer className="mx-auto max-w-[1390px] px-5 pb-8 sm:px-8 lg:px-10"><div className="flex flex-col justify-between gap-3 border-t border-[#e8e9e6] pt-5 text-[10px] font-semibold text-[#a0a6af] sm:flex-row"><span>© 2026 Launchly. G'oyalar uchun qurilgan.</span><div className="flex gap-4"><span>Qoidalar</span><span>Maxfiylik</span><span>Telegram hamjamiyati ↗</span></div></div></footer>
    </div>
    {showAdd && <AddProjectModal close={() => setShowAdd(false)}/>} {showAuth && <AuthModal close={() => setShowAuth(false)}/>} {selected && <DetailModal project={selected} close={() => setSelected(null)} liked={liked.includes(selected.id)} onLike={toggleLike}/>} {proposal && <ProposalModal title={proposal} close={() => setProposal(null)}/>} 
  </div>;
}
