<route lang="yaml">
meta:
  layout: default
  transition: slide-fade
  public: true
</route>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const retry = () => {
  router.push('/')
}
</script>

<template>
  <v-toolbar theme="dark" class="">
    <v-toolbar-title>VisionAI</v-toolbar-title>
  </v-toolbar>

  <v-container fluid class="text-center align-center glitch-container">
    <h1 class="glitch" data-text="404">404</h1>

    <p class="glitch-text">
      Uh-oh, looks like you wandered off the neural network path...<br />
      This page is lost in the matrix.
    </p>

    <v-btn class="retry-button" @click="retry">
      <v-icon left>mdi-robot</v-icon>
      Ask AI to find the page
    </v-btn>
  </v-container>
</template>

<style scoped lang="scss">
/* Background Animation */
.glitch-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: black;
  color: #00ff41;
  font-family: 'Courier New', monospace;
}

/* Glitchy 404 Text */
.glitch {
  position: relative;
  font-size: 120px;
  color: #00ff41;
  text-shadow: 2px 2px #000;
  animation: glitch 1s infinite;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  color: #ff00ff;
  clip: rect(0, 900px, 0, 0);
  animation: glitch 1.5s infinite;
}

.glitch::before {
  left: 2px;
  text-shadow: -2px 0 red;
  animation-delay: 0.2s;
}

.glitch::after {
  left: -2px;
  text-shadow: -2px 0 blue;
  animation-delay: 0.4s;
}

@keyframes glitch {
  0% {
    clip: rect(44px, 9999px, 56px, 0);
  }
  10% {
    clip: rect(33px, 9999px, 77px, 0);
  }
  20% {
    clip: rect(88px, 9999px, 19px, 0);
  }
  30% {
    clip: rect(28px, 9999px, 73px, 0);
  }
  40% {
    clip: rect(67px, 9999px, 20px, 0);
  }
  50% {
    clip: rect(25px, 9999px, 63px, 0);
  }
  60% {
    clip: rect(76px, 9999px, 58px, 0);
  }
  70% {
    clip: rect(52px, 9999px, 22px, 0);
  }
  80% {
    clip: rect(31px, 9999px, 42px, 0);
  }
  90% {
    clip: rect(12px, 9999px, 29px, 0);
  }
  100% {
    clip: rect(85px, 9999px, 34px, 0);
  }
}

/* AI-Themed Message */
.glitch-text {
  font-size: 18px;
  color: #00ff41;
  text-shadow: 1px 1px #000;
  margin-top: 20px;
}

/* Retry Button */
.retry-button {
  background-color: #222;
  color: #00ff41;
  border: 1px solid #00ff41;
  text-transform: none;
  margin-top: 20px;
}
</style>
