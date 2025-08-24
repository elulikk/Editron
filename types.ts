export interface TargetConfig {
  target: string;
  arch: string | string[];
}

export interface BuildPlatformConfig {
  target?: string | TargetConfig[];
  icon?: string;
  [key: string]: any;
}

export interface BuildConfiguration {
  appId?: string;
  productName?: string;
  directories?: {
    output?: string;
    buildResources?: string;
    [key: string]: any;
  };
  files?: string[];
  forceCodeSigning?: boolean;
  win?: BuildPlatformConfig;
  mac?: BuildPlatformConfig;
  linux?: BuildPlatformConfig;
  [key: string]: any;
}


export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  type?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  build?: BuildConfiguration;
  [key: string]: any; // Allow other properties
}

export type FileType = 'json' | 'javascript' | 'batch';
export type ViewType = 'package.json' | 'main.js' | 'Compilar.BAT';