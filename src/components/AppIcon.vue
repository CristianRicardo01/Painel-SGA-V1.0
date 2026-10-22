<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
})

const paths = {
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.03a1.7 1.7 0 0 0-1.84.38l-.05.05h-3.4l-.02-.08a1.7 1.7 0 0 0-1.4-1.23l-.08-.01-2.94-1.7.03-.08a1.7 1.7 0 0 0-.38-1.84l-.05-.05v-3.4l.08-.02a1.7 1.7 0 0 0 1.23-1.4l.01-.08 1.7-2.94.08.03a1.7 1.7 0 0 0 1.84-.38l.05-.05h3.4l.02.08a1.7 1.7 0 0 0 1.4 1.23l.08.01 2.94 1.7-.03.08a1.7 1.7 0 0 0 .38 1.84l.05.05v3.4l-.08.02a1.7 1.7 0 0 0-1.23 1.4Z',
  maximize: 'M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3',
  minimize: 'M9 4v5H4M20 9h-5V4M4 15h5v5M15 20v-5h5',
  volume: 'M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  chevron: 'm9 18 6-6-6-6',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'm5 12 4 4L19 6',
  monitor: 'M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM12 18v4M8 22h8',
  wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  play: 'm7 4 13 8-13 8V4Z',
  refresh: 'M20 7v5h-5M4 17v-5h5M5.64 9A7 7 0 0 1 17.5 6.5L20 12M4 12l2.5 5.5A7 7 0 0 0 18.36 15',
  'refresh-cw': 'M20 7v5h-5M4 17v-5h5M5.64 9A7 7 0 0 1 17.5 6.5L20 12M4 12l2.5 5.5A7 7 0 0 0 18.36 15',
  'alert-circle': 'M12 8v4m0 4h.01M10.3 3.86 2.8 17a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.74 3.86a2 2 0 0 0-3.44 0Z',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  'folder-open': 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1M3 7l-1 11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-1.5L22 11H5',
  building: 'M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
}
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[props.name] || paths.monitor" />
  </svg>
</template>
