<template>
  <div class="notfound-container flex flex-center">
    <!-- Esferas decorativas -->
    <div class="glow-sphere glow-1"></div>
    <div class="glow-sphere glow-2"></div>

    <div class="notfound-card animate-scale-in text-center">
      <!-- Icono de joya -->
      <div class="notfound-icon q-mb-md">
        <q-icon name="diamond" size="64px" color="secondary" class="diamond-spin" />
      </div>

      <!-- Número 404 -->
      <div class="notfound-code text-gold">404</div>

      <!-- Mensaje -->
      <div class="notfound-title text-white q-mt-xs">
        Página no encontrada
      </div>
      <div class="notfound-desc text-grey-4 q-mt-sm q-mb-xl">
        Esta joya no existe en nuestro catálogo.<br>
        Regresa al panel principal para continuar.
      </div>

      <!-- Acción -->
      <q-btn
        unelevated
        rounded
        class="btn-gold text-weight-bold q-px-xl q-py-sm text-subtitle1"
        label="Volver al POS"
        icon="point_of_sale"
        to="/"
      />
    </div>
  </div>
</template>

<script setup>
//
</script>

<style scoped>
.notfound-container {
  min-height: 100vh;
  background: radial-gradient(circle at 30% 30%, #152238 0%, #060b11 100%);
  position: relative;
  overflow: hidden;
  padding: 24px;
}

/* Esferas de luz */
.glow-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.glow-1 {
  width: 380px;
  height: 380px;
  background: rgba(212, 175, 55, 0.18);
  top: -100px;
  right: -80px;
}

.glow-2 {
  width: 300px;
  height: 300px;
  background: rgba(29, 58, 115, 0.35);
  bottom: -80px;
  left: -60px;
}

/* Tarjeta centrada */
.notfound-card {
  position: relative;
  z-index: 2;
  max-width: 420px;
  width: 100%;
  padding: 48px 32px;
  background: rgba(18, 30, 49, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 24px;
}

/* Icono animado */
.notfound-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 50%;
  border: 1px solid rgba(212, 175, 55, 0.3);
  margin: 0 auto;
}

.diamond-spin {
  animation: spin-gentle 8s linear infinite;
}

@keyframes spin-gentle {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.08); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Número 404 */
.notfound-code {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(4rem, 18vw, 7rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #d4af37;
  text-shadow: 0 0 40px rgba(212, 175, 55, 0.35);
}

.notfound-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.notfound-desc {
  font-size: 0.9rem;
  line-height: 1.6;
}

.text-gold { color: #d4af37 !important; }

.btn-gold {
  background: linear-gradient(135deg, #d4af37 0%, #b8972e 100%);
  color: #0b1420;
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .diamond-spin { animation: none; }
  .btn-gold { transition: none; }
}
</style>
