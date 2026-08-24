import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Heart, MessageCircle, Rocket, Star, Users } from "lucide-react";

const products = {
  flowmap: {
    title: "Flowmap",
    description: "Jamoalar uchun aniq va oddiy ish jarayoni.",
    longDescription: "Flowmap — kichik jamoalar uchun ishlarni bir joyda rejalashtirish, ko'rish va tezroq bajarishga yordam beradigan vizual workspace.",
    category: "SaaS",
    status: "MVP",
    owner: "Azizbek Qodirov",
    votes: 384,
    rating: 4.8,
    comments: 28,
    color: "#322a73"
  },
  ovozai: {
    title: "OvozAI",
    description: "O'zbek tilida gaplashadigan aqlli yordamchi.",
    longDescription: "OvozAI o'zbek tilida savollarga javob beradigan, kundalik vazifalarni soddalashtiradigan ovozli yordamchi.",
    category: "Sun'iy intellekt",
    status: "Ishga tushgan",
    owner: "Dilshod Karimov",
    votes: 267,
    rating: 4.6,
    comments: 19,
    color: "#fd826a"
  }
};

type Slug = keyof typeof products;

export function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = products[params.slug as Slug] || products.flowmap;
  return {
    title: `${item.title} — Launchly`,
    description: item.longDescription,
    openGraph: { title: `${item.title} — Launchly`, description: item.longDescription, type: "website" }
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const item = products[params.slug as Slug] || products.flowmap;
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.title,
    description: item.longDescription,
    applicationCategory: item.category,
    aggregateRating: { "@type": "AggregateRating", ratingValue: item.rating, ratingCount: item.votes }
  };
  return <main className="min-h-screen bg-[#fbfbf9] px-5 py-8 text-[#18212F] sm:px-8 lg:px-12"><div className="mx-auto max-w-[1080px]"><div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2 text-[12px] font-extrabold text-[#737c88] hover:text-[#6857E5]"><ArrowLeft size={15}/> Launchly'ga qaytish</Link><span className="flex items-center gap-2 text-[20px] font-black tracking-[-.05em]">launchly<span className="text-[#6857E5]">.</span></span></div><div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_.8fr]"><section><div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[24px] bg-[#322a73] shadow-card"><div className="absolute h-80 w-80 rounded-full border-[50px] border-white/10"/><div className="relative w-[64%] rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"><div className="mb-4 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff8d9c]"/><span className="h-2 w-2 rounded-full bg-[#ffd36b]"/><span className="h-2 w-2 rounded-full bg-[#9cf0bd]"/></div><div className="grid grid-cols-[.3fr_1fr] gap-2"><div className="h-40 rounded-lg bg-black/15"/><div className="rounded-lg bg-[#f9f8ff] p-3"><div className="h-3 w-20 rounded bg-[#342c76]/20"/><div className="mt-5 grid grid-cols-3 gap-2"><div className="h-20 rounded bg-[#eeeaff]"/><div className="h-20 rounded bg-[#dceff0]"/><div className="h-20 rounded bg-[#fff0dc]"/></div></div></div></div><div className="absolute bottom-6 left-7 rounded-full bg-[#ffce72] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">{item.title}</div></div><div className="mt-7 flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#eeebff] px-2.5 py-1.5 text-[10px] font-extrabold text-[#6857E5]">{item.status}</span><span className="rounded-md bg-[#f0f1f3] px-2.5 py-1.5 text-[10px] font-extrabold text-[#747d88]">{item.category}</span></div><h1 className="mt-4 text-[38px] font-black tracking-[-.07em]">{item.title}</h1><p className="mt-3 text-[16px] leading-7 text-[#69727f]">{item.longDescription}</p><div className="mt-6 flex gap-3"><button className="rounded-xl bg-[#6857E5] px-5 py-3 text-[12px] font-extrabold text-white"><Heart className="mr-1.5 inline" size={15}/> {item.votes} Qo'llab-quvvatlash</button><button className="rounded-xl border border-[#e5e6e3] bg-white px-5 py-3 text-[12px] font-extrabold text-[#69727f]">Sinab ko'rish <ArrowUpRight className="ml-1 inline" size={14}/></button></div></section><aside><div className="rounded-2xl border border-[#e8e9e6] bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e3e6ff] text-[11px] font-black text-[#5b50b8]">AQ</span><div><p className="text-[13px] font-black">{item.owner}</p><p className="mt-0.5 text-[11px] text-[#9299a2]">Dasturchi</p></div></div><div className="my-5 grid grid-cols-3 gap-2 border-y border-[#f0f0ed] py-4 text-center"><div><p className="flex items-center justify-center gap-1 text-[15px] font-black text-[#c18728]"><Star size={13} fill="currentColor"/>{item.rating}</p><p className="mt-1 text-[9px] font-bold text-[#9ba0a9]">REYTING</p></div><div><p className="text-[15px] font-black">{item.comments}</p><p className="mt-1 text-[9px] font-bold text-[#9ba0a9]">ROAST</p></div><div><p className="text-[15px] font-black">{item.votes}</p><p className="mt-1 text-[9px] font-bold text-[#9ba0a9]">OVOZ</p></div></div><button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18212F] py-3 text-[11px] font-extrabold text-white">Dasturchi profilini ko'rish <ArrowUpRight size={13}/></button></div><div className="mt-4 rounded-2xl bg-[#f2f0ff] p-5"><p className="flex items-center gap-2 text-[12px] font-black text-[#443a89]"><Rocket size={15}/> Bu loyiha haqida fikr bildiring</p><p className="mt-2 text-[11px] leading-5 text-[#77719d]">Sizning birgina fikringiz mahsulotni keyingi bosqichga olib chiqishi mumkin.</p></div></aside></div><div className="mt-12 border-t border-[#e8e9e6] pt-7"><h2 className="flex items-center gap-2 text-[19px] font-black tracking-[-.04em]">Roast & feedback <span className="text-[12px] font-bold text-[#a0a6af]">{item.comments}</span></h2><div className="mt-4 flex gap-3 rounded-2xl border border-[#e8e9e6] bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd9b8] text-[10px] font-black text-[#a65e2a]">AS</span><p className="pt-2 text-[12px] text-[#a0a6af]">Loyiha haqida fikringizni yozing...</p></div></div></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} /></main>;
}
