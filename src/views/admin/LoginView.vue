<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth.js';
import RimayLogo from '../../components/RimayLogo.vue';

const router = useRouter();
const { login } = useAuth();
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    await login(email.value, password.value);
    router.push({ name: 'admin-cases' });
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login">
    <form class="login-card" @submit.prevent="submit">
      <div class="logo"><RimayLogo /> Rimay</div>
      <h1>Panel de aliados</h1>
      <p>Acceso para el personal de instituciones aliadas.</p>
      <div class="field">
        <label for="email">Correo</label>
        <input id="email" v-model="email" class="text" type="email" autocomplete="username" placeholder="nombre@rimay.pe">
      </div>
      <div class="field">
        <label for="pass">Contraseña</label>
        <input id="pass" v-model="password" class="text" type="password" autocomplete="current-password">
      </div>
      <p class="error" role="alert">{{ error }}</p>
      <button class="btn" type="submit" style="width:100%;" :disabled="busy">Ingresar</button>
      <div class="demo">
        <b>Cuenta de demostración</b>
        Correo: <code>admin@rimay.pe</code><br>
        Contraseña: <code>rimay2026</code>
      </div>
    </form>
  </div>
</template>
