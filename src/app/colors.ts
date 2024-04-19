export interface Color {
  hex: string;
}

export interface PresetColor {
  id: string;
  name: string;
  color: Color;
}

export const presetColors: ReadonlyArray<PresetColor> = [
  {
    id: "018ef5cd-f61c-7b36-bd3c-b129e09f19e6",
    name: "Green",
    color: {hex: "#adf7b6"},
  },
  {
    id: "018ef5cf-1695-7594-8585-3e2a3486b1d9",
    name: "Yellow",
    color: {hex: "#ffee93"},
  },
  {
    id: "018ef5cf-3c4a-7003-bc9e-3779b7bfd8d4",
    name: "Blue",
    color: {hex: "#a0ced9"},
  },
  {
    id: "018ef5cf-69f6-70bd-b00c-383b7ba25078",
    name: "Purple",
    color: {hex: "#e6aeff"},
  },
  {
    id: "018ef5cf-8e55-766e-9fbe-2ec21b1b0d51",
    name: "Orange",
    color: {hex: "#ffc09f"},
  },
  {
    id: "018ef5cf-ae92-77c9-b38a-4c6fec834693",
    name: "Red",
    color: {hex: "#ffacbb"},
  },
];
