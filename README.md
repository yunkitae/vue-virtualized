## Getting started

Install `vue-list-virtualized` using npm.

```shell
npm install vue-list-virtualized --save
```

## Demo
```shell
npm run dev
```


## Add plugin

```js
import Vue from 'vue';
import { Masonry } from 'vue-virtualized';

Vue.component('Masonry', Masonry);
```

### Use

```vue
  <masonry
    :scroll-top="scrollTop"
    :state="state"
    :overscan="overscan"
    :container-width="containerWidth"
    :container-height="containerHeight"
    :gutter="gutter"
    :grid="grid"
    :list="list"
    @reflowed="reflowed"
  >
    <product
      slot="cell"
      slot-scope="props"
      :grid="grid"
      :order="props.index"
      :item="props.item"
    />
  </masonry>
```

### Properties

| Name      | Required | Type          | Default     | Description |
| ---       | ---      | ---           | ---         | ---         |
| scrollTop | true  | Number |             | window scroll y position or element scroll y position |
| state     | false | String           | null           | Vuex state json stringfy value |
| overscan  | false | Number          | 0       |  If use, View port over size |
| containerWidth  | true | Number          | 0       | Masonry layout width |
| containerHeight  | true | Number          | 0       | Masonry layout height |
| gutter  | false | Number          | 0       | Masonry slot gutter(margin) |
| grid  | true | Number          | 2       | Masonry horizon slot count |
| list  | true | Array          | null       | list data |

### Events

| Name         | Description |
| ---          | --- |
| reflowed  | slot reflowd |









