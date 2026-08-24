import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Compass size={26} />
      </span>
      <p className="text-5xl font-black tracking-tight">404</p>
      <h1 className="text-lg font-bold">Bu sahifa topilmadi</h1>
      <p className="max-w-sm text-sm text-muted">
        Sahifa o‘chirilgan, ismi o‘zgargan yoki hech qachon mavjud bo‘lmagan bo‘lishi
        mumkin.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
