<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  detecting: Boolean,
  videoActive: Boolean,
})

defineEmits(['update:detecting'])
</script>

<template>
  <v-row align="center" justify="center">
    <v-col cols="auto">
      <v-switch
        :model-value="detecting"
        :disabled="!videoActive"
        dense
        hide-details
        @update:model-value="$emit('update:detecting', $event)"
      ></v-switch>
    </v-col>
    <v-col cols="auto" class="mode-label">
      <span>
        {{ detecting ? 'Detection Mode' : 'Training Mode' }}
      </span>
    </v-col>
  </v-row>
</template>

<style scoped>
.mode-label {
  font-size: 14px;
  font-weight: 500;
}
</style>
