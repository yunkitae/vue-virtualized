<template>
  <div class="vue-masonry" :style="outerStyle">
    <masonry-slot
      v-for="(item, index) in displayItems"
      :key="startIndex + index"
      :width="width"
      :first-slot-height="firstSlotHeight"
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
    isUseCrossSideGutter: {
      type: Boolean,
      default: true
    },
    isUseFirstSlotHeight: {
      type: Boolean,
      default: false
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
      default: 250
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
      type: String,
      default: null
    }
  },
  data() {
    return {
      width: 0,
      startIndex: 0,
      endIndex: 1,
      createdSlots: [],
      outerHeight: 0,
      overscanByPixels: 0,
      isInvalidateCellSizeAfterRender: false,
      positionFromTop: 0,
      firstSlotHeight: 0,
      initScrollPosition: 0
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
      return {
        height: this.outerHeight + 'px',
        width: this.containerWidth + 'px'
      };
    }
  },
  watch: {
    list() {
      this.updateDisplayIndex();
    },
    _scrollTop() {
      this.updateDisplayIndex();
    }
  },
  created() {
    const _state = this.state ? JSON.parse(this.state) : null;
    this.init({ state: _state });
  },
  mounted() {
    this.updatePositionOffset();
    this.updateDisplayIndex();
  },
  updated() {
    this.updatePositionOffset();
    if (this.isInvalidateCellSizeAfterRender) {
      this.updateDisplayIndex();
    }
  },
  methods: {
    init({ state, startScrollPosition = 0 }) {
      this.width = this.getWidth(this.containerWidth, this.grid, this.gutter, this.isUseCrossSideGutter);
      this.overscanByPixels = this.overscan + 1;
      this.startIndex = 0;
      this.endIndex = 0;
      this.outerHeight = 0;
      let context;
      if (state) {
        context = Object.assign({}, state);
        this.firstSlotHeight = context.firstSlotHeight;
      } else {
        context = {
          columnSizeMap: this.getColumnSizeMap(this.grid, this.width, this.gutter, this.isUseCrossSideGutter)
        };
      }
      this.positionCache = new PositionCache(context);
      this.outerHeight = this.getEstimatedTotalHeight();
      if (state && state.scrollTop) {
        this.initScrollTo(state.scrollTop);
      } else if (this.positionFromTop < window.scrollY) {
        this.initScrollTo(startScrollPosition);
      }
    },

    initScrollTo(top) {
      this.$nextTick(() => {
        window.scroll({ top, left: 0 });
      });
    },

    reset(startScrollPosition = 0) {
      this.$nextTick(() => {
        this.init({ startScrollPosition });
      });
    },
    getEstimatedTotalHeight() {
      const total = this.list.length;
      return this.positionCache.estimateTotalHeight(total, this.grid, this.defaultHeight);
    },
    updateDisplayIndex() {
      const scrollTop = this._scrollTop;
      let startIndex = this.startIndex;
      let endIndex;
      const _scrollTop = Math.max(0, scrollTop - this.overscanByPixels);
      const _height = this.containerHeight + this.overscanByPixels * 2;
      this.isInvalidateCellSizeAfterRender = true;
      this.positionCache.range(_scrollTop, _height, (index, left, top) => {
        this.isInvalidateCellSizeAfterRender = false;
        if (typeof endIndex === 'undefined') {
          startIndex = index;
          endIndex = index;
        } else {
          startIndex = Math.min(startIndex, index);
          endIndex = Math.max(endIndex, index);
        }
      });

      const measureEndIndex = this.getMeasureEndIndex();
      if (~measureEndIndex) {
        endIndex = measureEndIndex;
      }
      this.startIndex = startIndex;
      this.endIndex = endIndex;
    },
    getMeasureEndIndex() {
      const shortestColumnSize = this.positionCache.shortestColumnSize;
      const displayListCount = this.positionCache.count;
      const listCount = this.list.length;

      // We need to measure additional cells for this layout
      if (
        shortestColumnSize < this._scrollTop + this.containerHeight + this.overscanByPixels &&
        displayListCount < listCount
      ) {
        const batchSize = Math.min(
          listCount - displayListCount,
          Math.ceil(
            (((this._scrollTop + this.containerHeight + this.overscanByPixels - shortestColumnSize) /
              this.defaultHeight) *
              this.containerWidth) /
            this.width
          )
        );
        if (batchSize) {
          return displayListCount + batchSize - 1;
        }
      }
      return -1;
    },

    forceRender() {
      const measureEndIndex = this.getMeasureEndIndex();
      if (~measureEndIndex) {
        this.endIndex = measureEndIndex;
      }
    },

    // column width
    getWidth(containerWidth, grid, gutter, isUseCrossSideGutter) {
      let width;
      if (isUseCrossSideGutter) {
        width = (containerWidth - (grid + 1) * gutter) / grid;
      } else {
        width = (containerWidth - gutter * (grid - 1)) / grid;
      }
      return width;
    },

    // column 별 top position map
    getColumnSizeMap(grid, width, gutter, isUseCrossSideGutter) {
      const map = {};
      for (let i = 0; i < grid; ++i) {
        let left;
        if (isUseCrossSideGutter) {
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
        this.positionFromTop = window.pageYOffset + this.$el.getBoundingClientRect().top;
      }
    },
    // from child reflow
    reflow(meta) {
      this.createdSlots.push(meta);
      this.$nextTick(() => {
        if (this.createdSlots.length === 0) {
          return;
        }
        const $items = this.createdSlots;
        this.createdSlots = [];
        const metas = $items.map(slot => slot.getMeta());
        metas.sort((a, b) => a.order - b.order);
        this.calculate(metas);
        if (this.endIndex === this.list.length - 1) {
          this.$emit('reflowed', this);
        } else {
          this.forceRender();
        }
      });
    },

    getSlotHeight(height) {
      if (this.isUseFirstSlotHeight) {
        if (this.firstSlotHeight) {
          console.warn(939393939393939239393)
          return this.firstSlotHeight
        } else {
          this.firstSlotHeight = height
        }
      }

      return height;
    },

    // child slot style 값 정의
    calculate(metas) {
      metas.forEach(meta => {
        let rect;
        const index = meta.vm.order;
        const _position = this.positionCache.getPosition(index);

        // 첫번째 slot height가 모든 slot에 고정이 될때 사용하기 위함
        let _height;
        if (this.isUseFirstSlotHeight) {
          _height = this.firstSlotHeight || meta.height;
          this.firstSlotHeight = _height;
        } else {
          _height = meta.height;
        }

        if (!_position) {
          const { left, top } = this.positionCache.nextColumnPosition;
          rect = { top, left, width: this.width, height: _height };
          this.positionCache.setPosition(index, left, top, _height);
        } else {
          rect = { left: _position[0], top: _position[1], width: this.width, height: _height };
        }
        meta.vm.style = this.buildStyle(rect);
      });
      this.outerHeight = this.getEstimatedTotalHeight();
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
    },

    // for save state
    getState() {
      return JSON.stringify({
        positions: this.positionCache.positions,
        intervals: this.positionCache.intervals,
        columnSizeMap: this.positionCache.columnSizeMap,
        firstSlotHeight: this.firstSlotHeight,
        scrollTop: this.scrollTop
      });
    }
  }
};
</script>
<style scoped="scoped" lang="scss">
.vue-masonry {
  position: relative;
}
</style>
