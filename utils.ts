export type PackagerConfig = {
    appName: string;
    arch: string;
    outDir: string;
    overwrite: boolean;
    asar: boolean;
};

export const parsePackagerScript = (script: string, defaultAppName: string): PackagerConfig => {
    const config: PackagerConfig = {
        appName: defaultAppName,
        arch: 'x64',
        outDir: 'build',
        overwrite: false,
        asar: true, // Default to true for new scripts
    };
    if (!script) {
      return config;
    }

    // A more robust way to get appName, assuming it's after 'electron-packager .'
    const appNameMatch = script.match(/electron-packager\s+\.\s+([^\s]+)/);
    if (appNameMatch) {
      config.appName = appNameMatch[1];
    }
    
    const archMatch = script.match(/--arch=(\S+)/);
    if (archMatch) config.arch = archMatch[1];
    
    const outMatch = script.match(/--out=(\S+)/);
    if (outMatch) config.outDir = outMatch[1];
    
    config.overwrite = /\s--overwrite\b/.test(script);
    // For an existing script, the default is false unless the flag is present.
    config.asar = /\s--asar\b/.test(script);

    return config;
}

export const buildPackagerScript = (config: PackagerConfig) => {
    let command = `electron-packager . ${config.appName || 'MyApp'}`;
    command += ` --platform=win32 --arch=${config.arch}`;
    command += ` --out=${config.outDir}`;
    if (config.overwrite) command += ' --overwrite';
    if (config.asar) command += ' --asar';
    return command;
}