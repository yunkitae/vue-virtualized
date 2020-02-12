<template>
  <div class="vue-masonry-slot" :style="[style ? { ...style } : {'width': width + 'px'}]">
    <slot />
  </div>
</template>
<script>
export default {
  props: {
    width: {
      type: Number,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      height: 0,
      style: null
    };
  },
  created() {
    this.$nextTick(() => {
      this.height = this.$el.clientHeight;
      this.notify();
    });
  },
  mounted() {
  },
  methods: {
    notify() {
      this.$emit('reflow', this);
    },
    getMeta() {
      return {
        vm: this,
        node: this.$el,
        order: this.order,
        width: this.width,
        isWholeGrid: this.isWholeGrid,
        height: this.height,
        moveClass: this.moveClass
      };
    }
  }
};
</script>
<style scoped="scoped" lang="scss">
.vue-masonry-slot {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  opacity: 0;
  box-sizing: border-box;
  will-change: transform;
  transform: translate(0, 0);
}
</style>
