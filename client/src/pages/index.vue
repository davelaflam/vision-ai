<route lang="yaml">
meta:
layout: default
transition: slide-fade
public: true
</route>

<script setup lang="ts">
import VisionComponent from '@/components/Vision.vue'
</script>

<template>
  <v-toolbar theme="dark" class="">
    <v-toolbar-title>VisionAI</v-toolbar-title>
  </v-toolbar>

  <VisionComponent />
</template>

<style lang="scss">
header .v-toolbar__content {
  height: 45px !important;

  > .v-toolbar-title {
    margin-inline-start: 0;
  }

  .v-toolbar-title,
  .v-toolbar-title__placeholder {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
  }
}
</style>
