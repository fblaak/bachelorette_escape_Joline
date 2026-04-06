"use client";

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white px-4 py-6 text-zinc-800 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-rose-100 backdrop-blur">
          <p className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">
            Bachelorette escape
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-rose-950 sm:text-4xl">
            Admin
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
            Kies of je het spel wilt voorbereiden of live wilt begeleiden.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/setup"
            className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50 transition hover:-translate-y-0.5 hover:bg-rose-50/40"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500">
              Vooraf
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-rose-950">
              Setup
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Rondes laden, titels invullen, codes instellen en content
              voorbereiden.
            </p>
          </Link>

          <Link
            href="/admin/live"
            className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50 transition hover:-translate-y-0.5 hover:bg-rose-50/40"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500">
              Tijdens het spel
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-rose-950">
              Live
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Wachten, verzamelen, kleur tonen, codefase starten en spelers
              begeleiden.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}