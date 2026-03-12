<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  accent: string
  description: string
}>()
</script>

<template>
  <article class="stat-card" :style="{ '--accent': accent }">
    <p class="stat-label">{{ label }}</p>
    <strong class="stat-value">{{ value }}</strong>
    <p class="stat-description">{{ description }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  min-height: 142px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 18%, white), transparent 45%);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.06);
}

.stat-label {
  margin: 0 0 14px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-value {
  display: block;
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1;
}

.stat-description {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}
</style>
