<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Encabezado de la Vista -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bolder text-primary brand-font">
          Control de Usuarios y Empresarias
        </div>
        <div class="text-caption text-grey-7">
          Gestiona los accesos al sistema, roles, contraseñas y márgenes de descuento
        </div>
      </div>

      <q-btn
        unelevated
        rounded
        color="primary"
        icon="person_add"
        label="Nuevo Usuario"
        class="text-weight-bold shadow-2"
        @click="abrirModalNuevo"
      />
    </div>

    <!-- Barra de Búsqueda y Filtros Rápidos -->
    <q-card flat class="rounded-borders shadow-1 q-mb-md bg-white">
      <q-card-section class="q-pa-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-md-5">
            <q-input
              v-model="busqueda"
              dense
              outlined
              rounded
              clearable
              placeholder="Buscar por nombre, EIN o teléfono..."
              class="bg-grey-1"
            >
              <template #prepend><q-icon name="search" color="primary" /></template>
            </q-input>
          </div>

          <div class="col-6 col-md-3">
            <q-select
              v-model="filtroRol"
              dense
              outlined
              rounded
              emit-value
              map-options
              :options="opcionesFiltroRol"
              label="Filtrar por Rol"
              class="bg-grey-1"
            />
          </div>

          <div class="col-6 col-md-3">
            <q-select
              v-model="filtroEstado"
              dense
              outlined
              rounded
              emit-value
              map-options
              :options="[
                { label: 'Todos los estados', value: '' },
                { label: 'Activas', value: 'Activa' },
                { label: 'Inactivas', value: 'Inactiva' }
              ]"
              label="Estado"
              class="bg-grey-1"
            />
          </div>

          <div class="col-12 col-md-1 text-right">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="refresh"
              :loading="cargando"
              @click="cargarUsuarios"
            >
              <q-tooltip>Actualizar listado</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Lista de Usuarios en Tarjetas Adaptables -->
    <div v-if="usuariosFiltrados.length > 0" class="row q-col-gutter-md">
      <div
        v-for="u in usuariosFiltrados"
        :key="u.IdEmpresaria"
        class="col-12 col-sm-6 col-lg-4"
      >
        <q-card
          flat
          class="rounded-borders shadow-1 bg-white full-height column justify-between user-card"
          :class="{ 'inactiva-card': u.Estado === 'Inactiva' }"
        >
          <q-card-section class="q-pa-md">
            <!-- Encabezado de la Tarjeta -->
            <div class="row items-start justify-between no-wrap">
              <div class="row items-center q-gutter-x-sm no-wrap">
                <q-avatar
                  size="48px"
                  :color="colorAvatar(u.Rol)"
                  text-color="white"
                  class="text-weight-bold shadow-1"
                >
                  {{ obtenerIniciales(u.Nombre) }}
                </q-avatar>
                <div>
                  <div class="text-subtitle1 text-weight-bold text-primary line-clamp-1">
                    {{ u.Nombre }}
                  </div>
                  <div class="row items-center q-gutter-x-xs q-mt-xs">
                    <q-badge color="grey-3" text-color="grey-9" class="text-weight-bold">
                      EIN: {{ u.EIN || 'S/N' }}
                    </q-badge>
                    <q-badge :color="colorRol(u.Rol)" text-color="white" class="text-weight-bold">
                      {{ u.Rol || 'Empresario' }}
                    </q-badge>
                  </div>
                </div>
              </div>

              <!-- Menú de Acciones -->
              <q-btn flat round dense icon="more_vert" color="grey-7">
                <q-menu auto-close>
                  <q-list style="min-width: 160px;">
                    <q-item clickable @click="editarUsuario(u)">
                      <q-item-section avatar><q-icon name="edit" color="primary" size="20px" /></q-item-section>
                      <q-item-section>Editar Información</q-item-section>
                    </q-item>
                    <q-item clickable @click="alternarEstado(u)">
                      <q-item-section avatar>
                        <q-icon
                          :name="u.Estado === 'Activa' ? 'block' : 'check_circle'"
                          :color="u.Estado === 'Activa' ? 'warning' : 'positive'"
                          size="20px"
                        />
                      </q-item-section>
                      <q-item-section>
                        {{ u.Estado === 'Activa' ? 'Desactivar' : 'Activar' }}
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable class="text-negative" @click="confirmarEliminar(u)">
                      <q-item-section avatar><q-icon name="delete" color="negative" size="20px" /></q-item-section>
                      <q-item-section>Eliminar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <q-separator class="q-my-sm" />

            <!-- Datos Secundarios -->
            <div class="column q-gutter-y-xs text-caption text-grey-8">
              <div class="row items-center justify-between">
                <span class="text-grey-6">Nivel de Descuento:</span>
                <q-badge color="amber-2" text-color="primary" class="text-weight-bolder text-subtitle2">
                  {{ u.PorcentajeDescuento }}%
                </q-badge>
              </div>

              <div class="row items-center justify-between">
                <span class="text-grey-6">Estado:</span>
                <q-chip
                  dense
                  :color="u.Estado === 'Activa' ? 'positive' : 'grey-5'"
                  text-color="white"
                  class="text-weight-bold"
                  size="sm"
                >
                  {{ u.Estado }}
                </q-chip>
              </div>

              <div class="row items-center justify-between">
                <span class="text-grey-6">Teléfono:</span>
                <span class="text-weight-medium">{{ u.Telefono || 'Sin teléfono' }}</span>
              </div>
            </div>
          </q-card-section>

          <!-- Pie de Tarjeta con Acciones Rápidas -->
          <q-card-actions class="q-px-md q-pb-md q-pt-none row q-gutter-xs">
            <q-btn
              v-if="u.Telefono"
              outline
              dense
              color="positive"
              icon="chat"
              label="WhatsApp"
              class="col text-weight-bold"
              @click="abrirWhatsApp(u.Telefono)"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              icon="edit_note"
              label="Editar"
              class="col text-weight-bold"
              @click="editarUsuario(u)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else-if="!cargando" class="text-center q-pa-xl text-grey-6 bg-white rounded-borders shadow-1">
      <q-icon name="person_search" size="64px" color="grey-4" />
      <div class="text-h6 q-mt-sm">No se encontraron usuarios</div>
      <div class="text-caption">Ajusta los filtros o da de alta una nueva empresaria</div>
    </div>

    <!-- Modal para Crear / Editar Usuario -->
    <q-dialog v-model="mostrarModal">
      <q-card style="min-width: 340px; max-width: 520px; border-radius: 18px;">
        <!-- Cabecera de Modal -->
        <q-card-section class="gradient-navy text-white row items-center">
          <div class="text-h6 brand-font text-gold">
            {{ editando ? 'Editar Usuario / Empresaria' : 'Nuevo Usuario / Empresaria' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-form @submit.prevent="guardarUsuario" class="q-gutter-y-sm">
            <!-- Nombre Completo -->
            <div>
              <label class="text-caption text-weight-bold text-grey-8">Nombre Completo *</label>
              <q-input
                v-model="formUsuario.Nombre"
                dense
                outlined
                placeholder="Ej. Erika Santiago"
                class="q-mt-xs"
                :rules="[(val) => (val && val.length > 0) || 'El nombre es obligatorio']"
              />
            </div>

            <!-- EIN y Teléfono -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-8">EIN (Identificador) *</label>
                <q-input
                  v-model="formUsuario.EIN"
                  dense
                  outlined
                  placeholder="Ej. NICE101"
                  class="q-mt-xs"
                  :rules="[(val) => (val && val.length > 0) || 'El EIN es obligatorio']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-8">Teléfono WhatsApp</label>
                <q-input
                  v-model="formUsuario.Telefono"
                  dense
                  outlined
                  placeholder="Ej. 8991624008"
                  class="q-mt-xs"
                />
              </div>
            </div>

            <!-- Rol y Estado -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-8">Rol en el Sistema *</label>
                <q-select
                  v-model="formUsuario.RolId"
                  dense
                  outlined
                  emit-value
                  map-options
                  :options="rolesDisponibles"
                  class="q-mt-xs"
                />
              </div>
              <div class="col-12 col-sm-6">
                <label class="text-caption text-weight-bold text-grey-8">Estado *</label>
                <q-select
                  v-model="formUsuario.Estado"
                  dense
                  outlined
                  :options="['Activa', 'Inactiva']"
                  class="q-mt-xs"
                />
              </div>
            </div>

            <!-- Porcentaje de Descuento Nice -->
            <div>
              <label class="text-caption text-weight-bold text-grey-8">
                Descuento de Catálogo Nice (%)
              </label>
              <div class="row q-gutter-x-xs q-mt-xs justify-between">
                <q-btn
                  v-for="d in [25, 35, 40, 45]"
                  :key="d"
                  dense
                  unelevated
                  rounded
                  :color="Number(formUsuario.PorcentajeDescuento) === d ? 'primary' : 'grey-3'"
                  :text-color="Number(formUsuario.PorcentajeDescuento) === d ? 'gold' : 'grey-9'"
                  class="col text-weight-bold"
                  :label="`${d}%`"
                  @click="formUsuario.PorcentajeDescuento = d"
                />
              </div>
            </div>

            <!-- Sección de Contraseña -->
            <div class="q-pt-xs">
              <div class="row items-center justify-between">
                <label class="text-caption text-weight-bold text-grey-8">
                  {{ editando ? 'Cambiar Contraseña (opcional)' : 'Contraseña de Acceso *' }}
                </label>
                <q-btn
                  v-if="editando && !mostrarCampoPassword"
                  flat
                  dense
                  no-caps
                  size="sm"
                  color="primary"
                  label="Asignar nueva contraseña"
                  icon="key"
                  @click="mostrarCampoPassword = true"
                />
              </div>

              <q-input
                v-if="!editando || mostrarCampoPassword"
                v-model="formUsuario.Password"
                dense
                outlined
                :type="showPassModal ? 'text' : 'password'"
                :placeholder="editando ? 'Escribe la nueva contraseña' : 'Mín. 4 caracteres'"
                class="q-mt-xs"
                :rules="!editando ? [(val) => (val && val.length >= 4) || 'Mínimo 4 caracteres'] : []"
              >
                <template #prepend><q-icon name="lock" color="primary" /></template>
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="showPassModal ? 'visibility_off' : 'visibility'"
                    color="grey-6"
                    @click="showPassModal = !showPassModal"
                  />
                </template>
              </q-input>
            </div>

            <q-btn
              type="submit"
              unelevated
              color="primary"
              :loading="guardando"
              :label="editando ? 'Guardar Cambios' : 'Registrar Usuario'"
              class="full-width text-weight-bold text-subtitle1 q-py-sm q-mt-md"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import api from '../services/api.js';
import { useAuthStore } from '../stores/authStore.js';

const $q = useQuasar();
const authStore = useAuthStore();

const usuarios = ref([]);
const roles = ref([]);
const cargando = ref(false);
const guardando = ref(false);

const busqueda = ref('');
const filtroRol = ref(null);
const filtroEstado = ref('');

const mostrarModal = ref(false);
const editando = ref(false);
const mostrarCampoPassword = ref(false);
const showPassModal = ref(false);

const formUsuario = ref({
  IdEmpresaria: null,
  Nombre: '',
  EIN: '',
  Telefono: '',
  PorcentajeDescuento: 25,
  RolId: 3,
  Estado: 'Activa',
  Password: ''
});

const rolesDisponibles = computed(() => {
  return roles.value.map((r) => ({
    label: r.Rol,
    value: r.IdRol
  }));
});

const opcionesFiltroRol = computed(() => {
  return [
    { label: 'Todos los roles', value: null },
    ...roles.value.map((r) => ({ label: r.Rol, value: r.IdRol }))
  ];
});

const usuariosFiltrados = computed(() => {
  let list = usuarios.value;

  if (filtroRol.value !== null) {
    list = list.filter((u) => u.RolId === Number(filtroRol.value));
  }

  if (filtroEstado.value) {
    list = list.filter((u) => u.Estado === filtroEstado.value);
  }

  if (busqueda.value) {
    const q = busqueda.value.toLowerCase().trim();
    list = list.filter(
      (u) =>
        u.Nombre?.toLowerCase().includes(q) ||
        u.EIN?.toLowerCase().includes(q) ||
        u.Telefono?.includes(q)
    );
  }

  return list;
});

async function cargarRoles() {
  try {
    const res = await api.get('/empresarias/roles');
    if (res.data && res.data.success) {
      roles.value = res.data.data;
    }
  } catch (err) {
    console.warn('Error cargando roles:', err);
  }
}

async function cargarUsuarios() {
  cargando.value = true;
  try {
    const res = await api.get('/usuarios');
    if (res.data && res.data.success) {
      usuarios.value = res.data.data;
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar usuarios: ' + (err.response?.data?.message || err.message)
    });
  } finally {
    cargando.value = false;
  }
}

function abrirModalNuevo() {
  editando.value = false;
  mostrarCampoPassword.value = true;
  showPassModal.value = false;
  formUsuario.value = {
    IdEmpresaria: null,
    Nombre: '',
    EIN: '',
    Telefono: '',
    PorcentajeDescuento: 25,
    RolId: 3,
    Estado: 'Activa',
    Password: ''
  };
  mostrarModal.value = true;
}

function editarUsuario(u) {
  editando.value = true;
  mostrarCampoPassword.value = false;
  showPassModal.value = false;
  formUsuario.value = {
    IdEmpresaria: u.IdEmpresaria,
    Nombre: u.Nombre,
    EIN: u.EIN,
    Telefono: u.Telefono || '',
    PorcentajeDescuento: Number(u.PorcentajeDescuento || 25),
    RolId: u.RolId || 3,
    Estado: u.Estado || 'Activa',
    Password: ''
  };
  mostrarModal.value = true;
}

async function guardarUsuario() {
  const f = formUsuario.value;
  if (!f.Nombre || !f.EIN) {
    $q.notify({ type: 'warning', message: 'Nombre y EIN son obligatorios' });
    return;
  }

  guardando.value = true;
  try {
    if (editando.value) {
      const payload = {
        Nombre: f.Nombre.trim(),
        EIN: f.EIN.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        PorcentajeDescuento: Number(f.PorcentajeDescuento),
        RolId: f.RolId,
        Estado: f.Estado
      };

      if (f.Password && f.Password.trim() !== '') {
        payload.Password = f.Password.trim();
      }

      const res = await api.put(`/usuarios/${f.IdEmpresaria}`, payload);
      $q.notify({
        type: 'positive',
        icon: 'check',
        message: res.data?.message || 'Usuario actualizado correctamente'
      });

      // Si el usuario editado es el mismo que está logueado, refrescar la sesión
      if (authStore.usuario?.IdEmpresaria === f.IdEmpresaria) {
        authStore.setUsuario(res.data.data);
      }
    } else {
      const payload = {
        Nombre: f.Nombre.trim(),
        EIN: f.EIN.trim(),
        Telefono: f.Telefono ? f.Telefono.trim() : null,
        PorcentajeDescuento: Number(f.PorcentajeDescuento),
        RolId: f.RolId,
        Estado: f.Estado,
        Password: f.Password ? f.Password.trim() : '123456'
      };

      const res = await api.post('/usuarios', payload);
      $q.notify({
        type: 'positive',
        icon: 'person_add',
        message: res.data?.message || 'Usuario registrado exitosamente'
      });
    }

    mostrarModal.value = false;
    await cargarUsuarios();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || err.message || 'Error al guardar usuario'
    });
  } finally {
    guardando.value = false;
  }
}

async function alternarEstado(u) {
  const nuevoEstado = u.Estado === 'Activa' ? 'Inactiva' : 'Activa';
  try {
    await api.put(`/usuarios/${u.IdEmpresaria}`, { Estado: nuevoEstado });
    u.Estado = nuevoEstado;
    $q.notify({
      type: 'positive',
      message: `Usuario ${u.Nombre} ahora está ${nuevoEstado}`
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'No se pudo cambiar el estado: ' + (err.response?.data?.message || err.message)
    });
  }
}

function confirmarEliminar(u) {
  $q.dialog({
    title: 'Eliminar Usuario',
    message: `¿Estás seguro de que deseas eliminar a "${u.Nombre}" (EIN: ${u.EIN})? Esta acción no se puede deshacer.`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Eliminar'
    }
  }).onOk(async () => {
    try {
      await api.delete(`/usuarios/${u.IdEmpresaria}`);
      $q.notify({
        type: 'positive',
        message: 'Usuario eliminado exitosamente'
      });
      await cargarUsuarios();
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.message || 'No se pudo eliminar el usuario'
      });
    }
  });
}

function obtenerIniciales(nombre) {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
}

function colorAvatar(rol) {
  if (rol === 'SuperAdmin') return 'deep-purple-7';
  if (rol === 'Admin') return 'primary';
  return 'amber-9';
}

function colorRol(rol) {
  if (rol === 'SuperAdmin') return 'deep-purple-8';
  if (rol === 'Admin') return 'indigo-7';
  return 'amber-8';
}

function abrirWhatsApp(tel) {
  const num = tel.replace(/\D/g, '');
  window.open(`https://wa.me/52${num}`, '_blank');
}

onMounted(async () => {
  await Promise.all([cargarRoles(), cargarUsuarios()]);
});
</script>

<style scoped>
.user-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.inactiva-card {
  opacity: 0.72;
  background: #f8fafc;
  border-left: 4px solid #94a3b8;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
