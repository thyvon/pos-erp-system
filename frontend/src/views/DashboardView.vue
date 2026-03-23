<template>
  <AppLayout
    title="ERP Dashboard"
    subtitle="A calmer control surface with glass cards, soft depth, and a cleaner module overview."
    :breadcrumbs="[{ label: 'Dashboard' }]"
  >
    <div class="space-y-5">
      <section class="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article class="erp-card relative overflow-hidden p-5 text-slate-950 dark:text-white">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,190,255,0.34),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,186,118,0.2),transparent_28%)]"></div>
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="relative z-10 max-w-2xl">
              <div class="erp-glass-band inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200">
                <i class="fa-solid fa-sparkles"></i>
                Phase 1 workspace
              </div>
              <h2 class="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Foundation modules now sit inside a more fluid, iOS-inspired workspace shell.
              </h2>
              <p class="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                The goal is simple: strong hierarchy, softer motion, and reusable surfaces so each next ERP module can focus on workflow instead of rebuilding page chrome.
              </p>
            </div>

            <div class="relative z-10 grid grid-cols-2 gap-2.5 sm:min-w-[18rem]">
              <div class="rounded-[5px] border border-white/40 bg-white/45 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <i class="fa-solid fa-server text-sky-600 dark:text-sky-300"></i>
                <div class="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Backend</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">API</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Laravel only</div>
              </div>
              <div class="rounded-[5px] border border-white/40 bg-white/45 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <i class="fa-solid fa-window-maximize text-sky-600 dark:text-sky-300"></i>
                <div class="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Frontend</div>
                <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">SPA</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Vue + Tailwind</div>
              </div>
            </div>
          </div>
        </article>

        <article class="erp-card p-5">
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-flag-checkered text-cyan-600 dark:text-cyan-400"></i>
            Build target
          </div>
          <div class="mt-4 rounded-[5px] bg-[linear-gradient(135deg,rgba(76,145,255,0.12),rgba(255,255,255,0.42))] p-4 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(255,255,255,0.02))]">
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

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-users text-cyan-600 dark:text-cyan-400"></i>Users</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">1</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Seeded admin user is available for testing.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-code-branch text-cyan-600 dark:text-cyan-400"></i>Branches</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">0</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">UI not built yet.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><i class="fa-solid fa-warehouse text-cyan-600 dark:text-cyan-400"></i>Warehouses</div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">0</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Waiting for the next CRUD page.</p>
        </article>

        <article class="erp-ios-stat">
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
