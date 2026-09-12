<template>
  <div class="login-container full-height flex flex-center">
    <!-- Partículas decorativas de fondo -->
    <div class="glow-sphere glow-1"></div>
    <div class="glow-sphere glow-2"></div>

    <q-card class="login-card shadow-24 text-white">
      <!-- Encabezado de Marca Nice -->
      <q-card-section class="text-center q-pt-lg q-pb-none">
        <q-avatar size="100px" class="bg-gold text-primary shadow-3 q-mb-xs">
          <img src="/nice.png" alt="Logo Nice & Bella">
        </q-avatar>
        <div class="brand-title text-gold q-mt-xs">NICE & BELLA</div>
        <div class="text-caption text-grey-4">Punto de Venta e Inventario</div>
      </q-card-section>

      <!-- Pestañas de Navegación: Iniciar Sesión / Registro -->
      <q-card-section class="q-px-lg q-pt-md q-pb-none">
        <q-tabs
          v-model="tab"
          dense
          class="auth-tabs rounded-borders text-grey-4"
          active-color="amber-4"
          indicator-color="amber-4"
          align="justify"
          narrow-indicator
        >
          <q-tab name="login" label="Iniciar Sesión" icon="login" />
          <q-tab name="register" label="Crear Cuenta" icon="person_add" />
        </q-tabs>
      </q-card-section>

      <q-separator class="q-my-sm bg-white-10" />

      <!-- Formulario 1: Iniciar Sesión -->
      <q-tab-panels v-model="tab" animated class="bg-transparent text-white">
        <q-tab-panel name="login" class="q-px-lg q-py-sm">
          <q-form @submit.prevent="handleLogin" class="q-gutter-y-md">
            <div>
              <label class="text-caption text-weight-bold text-grey-3">
                Número de Empresaria (EIN)
              </label>
              <q-input
                v-model="loginForm.EIN"
                dark
                outlined
                dense
                rounded
                placeholder="Escribe tu código EIN"
                class="q-mt-xs auth-input"
                :rules="[(val) => (val && val.length > 0) || 'El EIN es obligatorio']"
              >
                <template #prepend>
                  <q-icon name="badge" color="amber-4" />
                </template>
              </q-input>
            </div>

            <div>
              <label class="text-caption text-weight-bold text-grey-3">
                Contraseña
              </label>
              <q-input
                v-model="loginForm.Password"
                dark
                outlined
                dense
                rounded
                :type="showPassword ? 'text' : 'password'"
                placeholder="Ingresa tu contraseña"
                class="q-mt-xs auth-input"
                :rules="[(val) => (val && val.length > 0) || 'Ingresa tu contraseña']"
              >
                <template #prepend>
                  <q-icon name="lock" color="amber-4" />
                </template>
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="showPassword ? 'visibility_off' : 'visibility'"
                    color="grey-4"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>

            <q-btn
              type="submit"
              unelevated
              rounded
              :loading="cargando"
              class="full-width btn-gold text-weight-bold text-subtitle1 q-py-sm q-mt-md"
              label="Ingresar al Sistema"
              icon-right="arrow_forward"
            />

            <div class="text-center text-caption text-grey-4 q-mt-sm">
              ¿Aún no tienes cuenta?
              <span class="text-gold cursor-pointer text-weight-bold" @click="tab = 'register'">
                Regístrate aquí
              </span>
            </div>
          </q-form>
        </q-tab-panel>

        <!-- Formulario 2: Registro de Nueva Empresaria -->
        <q-tab-panel name="register" class="q-px-lg q-py-sm">
          <q-form @submit.prevent="handleRegister" class="q-gutter-y-sm">
            <div>
              <label class="text-caption text-weight-bold text-grey-3">
                Nombre Completo *
              </label>
              <q-input
                v-model="registerForm.Nombre"
                dark
                outlined
                dense
                rounded
                placeholder="Ej. Carmen Rodríguez"
                class="q-mt-xs auth-input"
                :rules="[(val) => (val && val.length > 0) || 'Nombre requerido']"
              >
                <template #prepend>
                  <q-icon name="person" color="amber-4" />
                </template>
              </q-input>
            </div>

            <div class="row q-col-gutter-xs">
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-3">
                  EIN (No. Empresaria) *
                </label>
                <q-input
                  v-model="registerForm.EIN"
                  dark
                  outlined
                  dense
                  rounded
                  placeholder="Ej. NICE2026"
                  class="q-mt-xs auth-input"
                  :rules="[(val) => (val && val.length > 0) || 'EIN requerido']"
                >
                  <template #prepend>
                    <q-icon name="badge" color="amber-4" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-3">
                  Teléfono (WhatsApp)
                </label>
                <q-input
                  v-model="registerForm.Telefono"
                  dark
                  outlined
                  dense
                  rounded
                  placeholder="Ej. 8991234567"
                  class="q-mt-xs auth-input"
                >
                  <template #prepend>
                    <q-icon name="phone" color="amber-4" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Descuento de Catálogo Nice -->
            <div>
              <label class="text-caption text-weight-bold text-grey-3">
                Porcentaje de Descuento de Catálogo
              </label>
              <div class="row q-gutter-x-xs q-mt-xs justify-between">
                <q-btn
                  v-for="d in [25, 35, 40, 45]"
                  :key="d"
                  dense
                  unelevated
                  rounded
                  :color="registerForm.PorcentajeDescuento === d ? 'amber-5' : 'grey-9'"
                  :text-color="registerForm.PorcentajeDescuento === d ? 'primary' : 'white'"
                  class="col text-weight-bold"
                  :label="`${d}%`"
                  @click="registerForm.PorcentajeDescuento = d"
                />
              </div>
            </div>

            <div class="row q-col-gutter-xs">
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-3">
                  Contraseña *
                </label>
                <q-input
                  v-model="registerForm.Password"
                  dark
                  outlined
                  dense
                  rounded
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mín. 4 caracteres"
                  class="q-mt-xs auth-input"
                  :rules="[
                    (val) => (val && val.length >= 4) || 'Mínimo 4 caracteres'
                  ]"
                >
                  <template #prepend>
                    <q-icon name="lock" color="amber-4" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-3">
                  Confirmar Contraseña *
                </label>
                <q-input
                  v-model="registerForm.ConfirmPassword"
                  dark
                  outlined
                  dense
                  rounded
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Repite la contraseña"
                  class="q-mt-xs auth-input"
                  :rules="[
                    (val) => val === registerForm.Password || 'Las contraseñas no coinciden'
                  ]"
                >
                  <template #prepend>
                    <q-icon name="lock_clock" color="amber-4" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-btn
              type="submit"
              unelevated
              rounded
              :loading="cargando"
              class="full-width btn-gold text-weight-bold text-subtitle1 q-py-sm q-mt-sm"
              label="Registrarme e Ingresar"
              icon-right="how_to_reg"
            />

            <div class="text-center text-caption text-grey-4 q-mt-xs">
              ¿Ya tienes cuenta?
              <span class="text-gold cursor-pointer text-weight-bold" @click="tab = 'login'">
                Inicia sesión aquí
              </span>
            </div>
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/authStore.js';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const tab = ref('login');
const cargando = ref(false);
const showPassword = ref(false);

const loginForm = ref({
  EIN: '',
  Password: ''
});

const registerForm = ref({
  Nombre: '',
  EIN: '',
  Telefono: '',
  PorcentajeDescuento: 25,
  Password: '',
  ConfirmPassword: ''
});

async function handleLogin() {
  if (!loginForm.value.EIN || !loginForm.value.Password) {
    $q.notify({
      type: 'warning',
      message: 'Por favor completa todos los campos'
    });
    return;
  }

  cargando.value = true;
  try {
    const data = await authStore.login({
      EIN: loginForm.value.EIN,
      Password: loginForm.value.Password
    });

    $q.notify({
      type: 'positive',
      icon: 'verified',
      message: data.message || `¡Bienvenida, ${data.user.Nombre}!`,
      position: 'top',
      timeout: 2500
    });

    router.push('/');
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Error al iniciar sesión';
    $q.notify({
      type: 'negative',
      icon: 'error_outline',
      message: msg,
      position: 'top',
      timeout: 3000
    });
  } finally {
    cargando.value = false;
  }
}

async function handleRegister() {
  const f = registerForm.value;
  if (!f.Nombre || !f.EIN || !f.Password) {
    $q.notify({
      type: 'warning',
      message: 'Nombre, EIN y Contraseña son obligatorios'
    });
    return;
  }

  if (f.Password !== f.ConfirmPassword) {
    $q.notify({
      type: 'warning',
      message: 'Las contraseñas no coinciden'
    });
    return;
  }

  cargando.value = true;
  try {
    const data = await authStore.register({
      Nombre: f.Nombre.trim(),
      EIN: f.EIN.trim(),
      Telefono: f.Telefono ? f.Telefono.trim() : null,
      PorcentajeDescuento: f.PorcentajeDescuento,
      Password: f.Password
    });

    $q.notify({
      type: 'positive',
      icon: 'celebration',
      message: data.message || 'Registro completado con éxito',
      position: 'top',
      timeout: 2500
    });

    router.push('/');
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Error al registrar';
    $q.notify({
      type: 'negative',
      icon: 'error_outline',
      message: msg,
      position: 'top',
      timeout: 3500
    });
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 20%, #152238 0%, #080e18 100%);
  position: relative;
  overflow: hidden;
  padding: 16px;
}

/* Esferas de luz sutiles */
.glow-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.35;
}

.glow-1 {
  width: 320px;
  height: 320px;
  background: #d4af37;
  top: -80px;
  left: -80px;
}

.glow-2 {
  width: 360px;
  height: 360px;
  background: #1e3c72;
  bottom: -90px;
  right: -90px;
}

/* Tarjeta elegante Nice */
.login-card {
  width: 100%;
  max-width: 460px;
  background: rgba(18, 30, 49, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 24px;
  z-index: 2;
}

.brand-title {
  font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: 2px;
}

.text-gold {
  color: #d4af37 !important;
}

.bg-gold {
  background: linear-gradient(135deg, #f39c12 0%, #d4af37 100%) !important;
}

.auth-tabs {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.btn-gold {
  background: linear-gradient(135deg, #d4af37 0%, #b8972e 100%);
  color: #0b1420;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
  transition: all 0.2s ease-in-out;
}

.btn-gold:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
}

.bg-white-10 {
  background: rgba(255, 255, 255, 0.1);
}
</style>
