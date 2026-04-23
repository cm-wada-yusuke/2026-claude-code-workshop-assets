export type FromPreset = {
  key: string;
  label: string;
  // kasyo40 の `交通量／都道府県指定市コード` + `-` + `交通量／調査単位区間番号`
  // （aggregate.ts でセクションIDとして構築している形式と同じ）
  fromSectionId: string;
};

// 国道202号を博多→糸島方向に並べた代表地点
export const FROM_PRESETS: FromPreset[] = [
  { key: "hakata", label: "博多駅周辺", fromSectionId: "40130-10300" },
  { key: "tenjin", label: "天神エリア", fromSectionId: "40130-10320" },
  { key: "akasaka", label: "中央区赤坂", fromSectionId: "40130-10330" },
  { key: "ropponmatsu", label: "六本松", fromSectionId: "40130-10340" },
  { key: "beppu", label: "城南区別府", fromSectionId: "40130-10360" },
  { key: "arae", label: "城南区荒江", fromSectionId: "40130-10370" },
  { key: "sawara-hara", label: "早良区原", fromSectionId: "40130-10380" },
  { key: "fukushige", label: "西区福重", fromSectionId: "40130-10400" },
  { key: "jurokucho", label: "西区拾六町", fromSectionId: "40130-10420" },
  { key: "nishi-imajuku", label: "西区今宿", fromSectionId: "40130-10430" },
];

export function findPreset(key?: string | null): FromPreset {
  return FROM_PRESETS.find((p) => p.key === key) ?? FROM_PRESETS[0];
}
