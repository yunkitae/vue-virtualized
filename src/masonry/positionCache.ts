/** @flow */
import createIntervalTree from 'interval-tree-1d';

type RenderCallback = (index: number, left: number, top: number) => void;

interface InitData {
  columnSizeMap: { [x: number]: number };
  intervals?: [],
  positions?: []
}

// Position cache requirements:
//   O(log(n)) lookup of cells to render for a given viewport size
//   O(1) lookup of shortest measured column (so we know when to enter phase 1)
export default class PositionCache {
  constructor(context: InitData) {
    if (context.intervals) {
      this._intervalTree = createIntervalTree(context.intervals);
    } else {
      this._intervalTree = createIntervalTree();
    }
    this._columnSizeMap = context.columnSizeMap;
    this._positions = context.positions || [];
  }

  // Tracks the height of each column
  _columnSizeMap: { [x: number]: number };

  // Store tops and bottoms of each cell for fast intersection lookup.
  _intervalTree;

  // slot position info
  _positions: Array<[number, number]>;

  // Maps cell index to x coordinates for quick lookup.
  _leftMap = {};

  estimateTotalHeight(cellCount: number, columnCount: number, defaultCellHeight: number): number {
    const unmeasuredCellCount = cellCount - this.count;
    return this.tallestColumnSize + Math.ceil(unmeasuredCellCount / columnCount) * defaultCellHeight;
  }

  // Render all cells visible within the viewport range defined.
  range(scrollTop: number, clientHeight: number, renderCallback: RenderCallback): void {
    this._intervalTree.queryInterval(scrollTop, scrollTop + clientHeight, ([top, _, index]) =>
      renderCallback(index, this._leftMap[index], top)
    );
  }

  setPosition(index: number, left: number, top: number, height: number): void {
    this._positions.push([left, top]);
    // console.log('_intervalTree', this._intervalTree);
    this._intervalTree.insert([top, top + height, index]);

    const _left = left.toFixed(2);
    this._leftMap[index] = _left;

    const columnSizeMap = this._columnSizeMap;
    const columnHeight = columnSizeMap[_left];
    if (columnHeight === undefined) {
      columnSizeMap[_left] = top + height;
    } else {
      columnSizeMap[_left] = Math.max(columnHeight, top + height);
    }
    // console.warn('&&&&&&&&&&', columnSizeMap)
  }

  get intervals() {
    return this._intervalTree.intervals;
  }

  get positions() {
    return this._positions;
  }

  getPosition(index): [number, number] | null {
    return this._positions[index] || null;
  }

  get count(): number {
    return this._intervalTree.count;
  }

  get shortestColumnSize(): number {
    const columnSizeMap = this._columnSizeMap;

    let size = 0;

    for (const i in columnSizeMap) {
      const height = columnSizeMap[i];
      size = size === 0 ? height : Math.min(size, height);
    }

    return size;
  }

  get tallestColumnSize(): number {
    const columnSizeMap = this._columnSizeMap;

    let size = 0;

    for (const i in columnSizeMap) {
      const height = columnSizeMap[i];
      size = Math.max(size, height);
    }

    return size;
  }

  // return next column position
  get nextColumnPosition(): { left: number; top: number } {
    const columnSizeMap = this._columnSizeMap;
    let top;
    let left;
    for (const i in columnSizeMap) {
      const height = columnSizeMap[i];
      if (typeof top === 'undefined') {
        top = height;
        left = i;
      } else if (top > height) {
        top = height;
        left = i;
      }
    }
    const res = { left: parseFloat(left), top };
    return res;
  }

  get columnSizeMap() {
    return this._columnSizeMap;
  }
}
