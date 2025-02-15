<template>
  <v-row>
    <v-col cols="12" class="d-flex align-center">
      <v-switch
        :model-value="detecting"
        @update:model-value="$emit('update:detecting', $event)"
        :disabled="!videoActive"
        class="mr-2"
      ></v-switch>
      <span class="mb-5">
        {{ detecting ? "Detection Mode Enabled" : "Training Mode Enabled" }}
      </span>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  detecting: Boolean,
  videoActive: Boolean,
});

defineEmits(["update:detecting"]);
</script>
