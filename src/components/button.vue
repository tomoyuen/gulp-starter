<template>
  <button type="button" class="btn btn-primary"></button>
</template>

<script>
  export default {
    props: {
      type: {
        type: String,
        default: 'primary',
        required: false,
      },
      disabled: {
        type: Boolean,
        default: false,
        required: false,
      }
    }
  }
</script>
