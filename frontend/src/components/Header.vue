<template>
  <header class="app-header">
    <div class="brand">
      <div class="logo-box">AI</div>
      <div class="title-group">
        <h1>DeepAnimalVision</h1>
        <p>AI 识别与细节分析控制台</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-box {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef2ff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.title-group h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--primary);
}

.title-group p {
  margin: 0;
  font-size: 10px;
  color: #64748b;
}
</style>
