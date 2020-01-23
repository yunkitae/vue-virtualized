<template>
  <div class="vue-masonry" :style="outerStyle">
    <template v-if="isShow">
      <masonry-slot
        v-for="(item, index) in displayItems"
        :key="startIndex + index"
        :width="width"
        :order="startIndex + index"
        @reflow="reflow"
      >
        <slot
          name="cell"
          :width="width"
          :order="startIndex + index"
          :item="item"
          :index="startIndex + index"
        />
      </masonry-slot>
    </template>
  </div>
</template>
<script>
import MasonrySlot from './MasonrySlot.vue';
import PositionCache from './positionCache';

export default {
  components: {
    MasonrySlot
  },
  props: {
    isUseContainerPadding: {
      type: Boolean,
      default: true
    },
    containerWidth: {
      type: Number,
      default: 0
    },
    containerHeight: {
      type: Number,
      default: 0
    },
    defaultHeight: {
      type: Number,
      default: 300
    },
    overscan: {
      type: Number,
      default: 0
    },
    grid: {
      type: Number,
      default: 2
    },
    isUseWindowScroll: {
      type: Boolean,
      default: true
    },
    scrollTop: {
      type: Number,
      default: 0
    },
    list: {
      type: Array,
      required: true
    },
    gutter: {
      type: Number,
      default: 10
    },
    state: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isShow: false,
      width: 0,
      startIndex: 0,
      endIndex: 0,
      tmpPositions: {},
      createdSlots: [],
      outerHeight: 0,
      overscanByPixels: this.overscan + 10,
      positionFromTop: 0
    };
  },
  computed: {
    // scroll position 에 따른 보여질 items
    displayItems() {
      return this.list.filter((item, index) => {
        return index >= this.startIndex && index <= this.endIndex;
      });
    },
    // scrollTop 값 조정
    _scrollTop() {
      if (this.isUseWindowScroll && this.$el) {
        return Math.max(0, this.scrollTop - this.positionFromTop);
      }
      return this.scrollTop;
    },
    outerStyle() {
      if (!this.isShow) {
        return {
          width: 0,
          height: 0
        };
      } else {
        return {
          height: this.outerHeight + 'px',
          width: this.containerWidth + 'px'
        };
      }
    }
  },
  watch: {
    list() {
      this.forceRender();
    },
    _scrollTop(val) {
      this.updateDisplayIndex();
    }
  },
  created() {
    console.log('list length', this.list.length)
    this.init();
  },
  mounted() {
    this.isShow = true;
    this.updatePositionOffset();
    this.forceRender();
  },
  updated() {
    console.log('updated')
    // this.forceRender();
    // this.forceRender
    // ();
  },
  methods: {
    init() {
      this.width = this.getWidth(this.containerWidth, this.grid, this.gutter, this.isUseContainerPadding);
      const columnSizeMap = this.getColumnSizeMap(this.grid, this.width, this.gutter, this.isUseContainerPadding);
      this.positionCache = new PositionCache(columnSizeMap);
    },
    updateDisplayIndex() {
      let startIndex = 0;
      let endIndex;
      this.positionCache.range(
        Math.max(0, this._scrollTop - this.overscanByPixels),
        this.containerHeight + this.overscanByPixels * 2,
        (index, left, top) => {
          this.tmpPositions[index] = { left, top };
          if (typeof endIndex === 'undefined') {
            startIndex = index;
            endIndex = index;
          } else {
            startIndex = Math.min(startIndex, index);
            endIndex = Math.max(endIndex, index);
          }
        }
      );
      const measureEndIndex = this.getMeasureEndIndex();
      if (measureEndIndex) {
        endIndex = measureEndIndex;
      }
      console.log('updateDisplayIndex', startIndex, endIndex, this._scrollTop)
      this.startIndex = startIndex;
      this.endIndex = endIndex;
    },
    getMeasureEndIndex() {
      const shortestColumnSize = this.positionCache.shortestColumnSize;
      const displayListCount = this.positionCache.count;
      const listCount = this.list.length;

      // console.log('$$$$$$$$$$$$$$$$$$$$::::::: ', shortestColumnSize, displayListCount, listCount);
      // We need to measure additional cells for this layout
      if ((shortestColumnSize < this._scrollTop + this.containerHeight + this.overscanByPixels) && displayListCount < listCount) {
        const batchSize = Math.min(
          listCount - displayListCount,
          Math.ceil(
            (((this._scrollTop + this.containerHeight + this.overscanByPixels - shortestColumnSize) / this.defaultHeight) *
              this.width) /
              this.width
          )
        );
        console.warn('batchSize', batchSize)
        if (batchSize) {
          return displayListCount + batchSize - 1;
        }
      }
      return null;
    },

    forceRender() {
      const measureEndIndex = this.getMeasureEndIndex();
      if (measureEndIndex) {
        console.warn('forceRender')
        this.endIndex = measureEndIndex;
      }
    },

    // column width
    getWidth(containerWidth, grid, gutter, isUseContainerPadding) {
      let width;
      if (isUseContainerPadding) {
        width = (containerWidth - (grid + 1) * gutter) / grid;
      } else {
        width = (containerWidth - gutter * (grid - 1)) / grid;
      }
      return width;
    },

    // column 별 top position map
    getColumnSizeMap(grid, width, gutter, isUseContainerPadding) {
      const map = {};
      for (let i = 0; i < grid; ++i) {
        let left;
        if (isUseContainerPadding) {
          left = i ? width * i + gutter * (i + 1) : gutter;
        } else {
          left = i ? width * i + gutter * i : 0;
        }
        map[left.toFixed(2)] = 0;
      }
      return map;
    },

    // element offset top position 정의
    updatePositionOffset() {
      if (this.$el) {
        this.positionFromTop = this.$el.getBoundingClientRect().top;
      }
    },
    // from child reflow
    reflow(meta) {
      this.createdSlots.push(meta);
      this.$nextTick(() => {
        const $items = this.createdSlots;
        if ($items.length === 0) return;
        const metas = $items.map(slot => slot.getMeta());
        metas.sort((a, b) => a.order - b.order);
        this.calculate(metas);
        this.createdSlots = [];
        if (this.endIndex === this.list.length - 1) {
          this.$emit('reflowed', this);
        } else {
          this.forceRender();
        }
      });
    },

    // child slot style 값 정의
    calculate(metas) {
      metas.forEach(meta => {
        let rect;
        const index = meta.vm.order;
        const _positions = this.tmpPositions[index];
        if (!_positions) {
          const { left, top } = this.positionCache.nextColumnPosition;
          rect = { top, left, width: this.width, height: meta.height };
          this.positionCache.setPosition( index, left, top, rect.height);
        } else {
          rect = { ..._positions, width: this.width, height: meta.height };
          delete this.tmpPositions[index]; // 삭제
        }
        meta.vm.style = this.buildStyle(rect);
      });
      this.outerHeight = this.positionCache.tallestColumnSize;
    },

    buildStyle(rect) {
      return {
        top: 0,
        left: 0,
        width: rect.width + 'px',
        height: rect.height + 'px',
        transform: `translateX(${rect.left}px) translateY(${rect.top}px)`,
        WebkitTransform: `translateX(${rect.left}px) translateY(${rect.top}px)`,
        opacity: 1
      };
    }
  }
};
</script>
<style scoped="scoped" lang="scss">
.vue-masonry{
  position: relative;
}
</style>
