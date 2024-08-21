export interface ColorRef {
  presetColorId: string;
}

export interface Color {
  hex: string;
}

interface PresetColorArgs {
  id: string;
  name: string;
  color: Color;
}

export class PresetColor {
  public readonly id: string;
  public readonly name: string;
  public readonly color: Color;

  public constructor(args: PresetColorArgs) {
    this.id = args.id;
    this.name = args.name;
    this.color = args.color;
  }

  public backgroundColorStyle(): React.CSSProperties {
    return {backgroundColor: this.color.hex};
  }
}

export const presetColors: ReadonlyArray<PresetColor> = [
  new PresetColor({
    id: "018ef5cd-f61c-7b36-bd3c-b129e09f19e6",
    name: "Green",
    color: {hex: "#adf7b6"},
  }),
  new PresetColor({
    id: "018ef5cf-1695-7594-8585-3e2a3486b1d9",
    name: "Yellow",
    color: {hex: "#ffee93"},
  }),
  new PresetColor({
    id: "018ef5cf-3c4a-7003-bc9e-3779b7bfd8d4",
    name: "Blue",
    color: {hex: "#a0ced9"},
  }),
  new PresetColor({
    id: "018ef5cf-69f6-70bd-b00c-383b7ba25078",
    name: "Purple",
    color: {hex: "#e6aeff"},
  }),
  new PresetColor({
    id: "018ef5cf-8e55-766e-9fbe-2ec21b1b0d51",
    name: "Orange",
    color: {hex: "#ffc09f"},
  }),
  new PresetColor({
    id: "018ef5cf-ae92-77c9-b38a-4c6fec834693",
    name: "Red",
    color: {hex: "#ffacbb"},
  }),
];

export const presetColorWhite = new PresetColor({
  id: "018ef5e0-db74-773d-b4b5-2723aa4f16ad",
  name: "White",
  color: {hex: "#fff"},
});

export interface ColorSet {
  allPresetColors(): ReadonlyArray<PresetColor>;
  findPresetColorById: (presetColorId: string) => PresetColor | null;
}

export class ColorSetInMemory implements ColorSet {
  private readonly presetColors: ReadonlyArray<PresetColor>;

  public constructor(presetColors: ReadonlyArray<PresetColor>) {
    this.presetColors = presetColors;
  }

  public allPresetColors(): ReadonlyArray<PresetColor> {
    return this.presetColors;
  }

  public findPresetColorById(presetColorId: string): PresetColor | null {
    return this.presetColors.find(presetColor => presetColor.id === presetColorId) ?? null;
  }
}

export const colorSetPresetsOnly: ColorSet = new ColorSetInMemory(presetColors);
