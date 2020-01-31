<template>
  <main>
    <h1>Masonry Demo Page </h1>
    <div class="report-wrap">
      <p id="time"></p>
      <p id="memory"></p>
      <p>MAX: {{ max }}MB</p>
      <p>MIN: {{ min }}MB</p>
    </div>
    <div class="masonry-wrap">
      <client-only>
        <masonry
          :container-width="containerWidth"
          :container-height="containerHeight"
          :scroll-top="scrollTop"
          :gutter="gutter"
          :grid="grid"
          :overscan="overscan"
          :list="list"
          @reflowed="reflowed"
        >
          <item
            slot="cell"
            slot-scope="props"
            :item="props.item"
            :width="props.width"
            :order="props.order"
          />
        </masonry>
      </client-only>
    </div>
  </main>
</template>
<script>
import Item from '~/components/Item.vue';
const ROW_HEIGHTS = [100, 120, 150, 170, 180, 200, 300];
const COLORS = ['red', 'green', '#29230A', '#0A2429', '#0C687A', 'blue', '#6B2411', 'orange'];

export default {
  components: {
    Item
  },
  data() {
    return {
      scrollTop: 0,
      overscan: 0,
      gutter: 10,
      grid: 5,
      size: 10000,
      containerWidth: 0,
      containerHeight: 0,
      min: null,
      max: 0
    };
  },
  computed: {
    list() {
      const arr = [];
      for (let i = 0; i < this.size; i++) {
        const item = {
          height: ROW_HEIGHTS[Math.floor(Math.random() * ROW_HEIGHTS.length)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        arr.push(item);
      }
      return arr;
    }
  },
  created() {
    if (process.browser) {
      this.containerHeight = window.innerHeight;
      this.containerWidth = window.innerWidth;
    }
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll);
    this.reportPerformance();
  },
  destroyed() {
    window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    onScroll(event) {
      this.scrollTop = window.scrollY;
      this.reportPerformance();
    },
    reflowed() {},
    reportPerformance() {
      const initTime = Date.now();
      const timeElement = document.getElementById('time')
      if (timeElement && initTime) {
        const timeWaste = Date.now() - initTime;
        timeElement.textContent = 'Build waste: ' + timeWaste + ' ms.';
      }

      const memoryElement = document.getElementById('memory');
      const performance = window.performance || window.webkitPerformance
      if (memoryElement && performance && performance.memory && performance.memory.usedJSHeapSize) {
        const memoryUsed = parseInt(performance.memory.usedJSHeapSize / (1024 * 1024));
        memoryElement.textContent = 'Memory used: ' + memoryUsed + ' MB.';
        this.max = Math.max(memoryUsed, this.max);
        if (!this.min) {
          this.min = memoryUsed;
        }
        this.min = Math.min(memoryUsed, this.min);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
main {
  h1 {
    padding-top: 50px;
    text-align: center;
  }
  position: relative;
  .masonry-wrap {
    margin-top: 30px;
  }
  .report-wrap {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    background: yellow;
    padding: 5px;
  }
}
</style>
