<template>
  <div class="item">
    <div class="inner" :style="style">
      {{ order }}
    </div>
  </div>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: null
    },
    order: {
      required: true,
      type: Number
    },
    width: {
      type: Number,
      default: 0
    }
  },
  computed: {
    style() {
      return {
        backgroundColor: this.item.color,
        height: this.item.height + 'px'
      }
    }
  },
}
</script>
<style scoped="scoped" lang="scss">
.item {
  padding-bottom: 10px;
  position: relative;
  width: 100%;
  .inner {
    border-radius: 0.5rem;
    color: #fff;
    margin-bottom: 0.5rem;
    align-items: center;
    display: flex;
    justify-content: center;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
  }
}
</style>
