declare module 'smiles-drawer' {
  interface DrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    bondLength?: number;
    shortBondLength?: number;
    bondSpacing?: number;
    atomVisualization?: string;
    isomeric?: boolean;
    debug?: boolean;
    terminalCarbons?: boolean;
    explicitHydrogens?: boolean;
    overlapSensitivity?: number;
    compactDrawing?: boolean;
    fontFamily?: string;
    fontSizeLarge?: number;
    fontSizeSmall?: number;
    padding?: number;
    scale?: number;
    themes?: Record<string, Record<string, string>>;
  }

  class Drawer {
    constructor(options?: DrawerOptions);
    draw(
      data: unknown,
      target: HTMLCanvasElement | string,
      themeName?: string,
      infoOnly?: boolean,
      highlightAtoms?: number[],
    ): void;
    getTotalOverlapScore(): number;
    getMolecularFormula(): Record<string, number>;
  }

  class SmiDrawer {
    constructor(moleculeOptions?: DrawerOptions, reactionOptions?: DrawerOptions);
    draw(
      smiles: string,
      target: HTMLElement | string | null,
      theme?: string,
      successCallback?: ((element: HTMLElement) => void) | null,
      errorCallback?: ((error: Error) => void) | null,
      weights?: number[] | null,
    ): void;
  }

  function parse(
    smiles: string,
    successCallback: (tree: unknown) => void,
    errorCallback?: (error: Error) => void,
  ): void;

  function clean(smiles: string): string;

  const Drawer: typeof Drawer;
  const SmiDrawer: typeof SmiDrawer;
  const Parser: unknown;
  const SvgDrawer: unknown;

  export default SmilesDrawer;
  export { Drawer, SmiDrawer, parse, clean, DrawerOptions };
}
