<template>
  <AppLayout
    title="ERP Dashboard"
    subtitle="Standalone Vue workspace wired to the Laravel API backend."
    :breadcrumbs="[{ label: 'Dashboard' }]"
  >
    <div class="space-y-6">
      <section class="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article class="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-glow dark:bg-slate-900">
          <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <i class="fa-solid fa-sparkles"></i>
                Phase 1 workspace
              </div>
              <h2 class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Foundation modules are now running on the standalone Vue shell.
              </h2>
              <p class="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                This layout is now the base for all next pages. The goal is to keep the shell consistent and let each module only focus on business UI.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
                <i class="fa-solid fa-server text-cyan-300"></i>
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Backend</div>
                <div class="mt-2 text-2xl font-semibold">API</div>
                <div class="mt-1 text-xs text-slate-400">Laravel only</div>
              </div>
              <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
                <i class="fa-solid fa-window-maximize text-cyan-300"></i>
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Frontend</div>
                <div class="mt-2 text-2xl font-semibold">SPA</div>
                <div class="mt-1 text-xs text-slate-400">Vue + Tailwind</div>
              </div>
            </div>
          </div>
        </article>

        <article class="erp-card p-6">
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-flag-checkered text-cyan-600 dark:text-cyan-400"></i>
            Build target
          </div>
          <div class="mt-5 rounded-3xl bg-cyan-500/10 p-5 dark:bg-cyan-500/15">
            <div class="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Next step</div>
            <div class="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Branches + Warehouses
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The next feature pages should inherit the shell and keep the content components focused on CRUD and validation.
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article class="erp-card p-5">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-users text-cyan-600 dark:text-cyan-400"></i>Users</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">1</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Seeded admin user is available for testing.</p>
        </article>

        <article class="erp-card p-5">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-code-branch text-cyan-600 dark:text-cyan-400"></i>Branches</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">0</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">UI not built yet.</p>
        </article>

        <article class="erp-card p-5">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-warehouse text-cyan-600 dark:text-cyan-400"></i>Warehouses</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">0</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Waiting for the next CRUD page.</p>
        </article>

        <article class="erp-card p-5">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-gear text-cyan-600 dark:text-cyan-400"></i>Settings</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Ready</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Backend endpoints already exist.</p>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@layouts/AppLayout.vue'
</script>
