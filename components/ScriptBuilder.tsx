import React, { useState, useEffect, useMemo } from 'react';
import { t } from '../i18n';
import Tooltip from './Tooltip';
import { PlusIcon } from './Icons';
import { parsePackagerScript, buildPackagerScript } from '../utils';

interface ScriptBuilderProps {
    script: string | undefined;
    onChange: (newScript: string | undefined) => void;
    appName: string | undefined;
    hasBuildSection: boolean;
    onAddBuildSection: () => void;
}

const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectClasses = inputClasses + " appearance-none";

type ScriptTool = 'electron-builder' | 'electron-packager' | 'none';

type PackagerConfig = {
    appName: string;
    arch: string;
    outDir: string;
    overwrite: boolean;
    asar: boolean;
};

const ScriptBuilder: React.FC<ScriptBuilderProps> = ({ script, onChange, appName, hasBuildSection, onAddBuildSection }) => {
    const derivedTool = useMemo((): ScriptTool => {
        if (!script) return 'none';
        return script.includes('electron-packager') ? 'electron-packager' : 'electron-builder';
    }, [script]);
    const derivedPackagerConfig = useMemo(() => parsePackagerScript(script || '', appName || 'MyApp'), [script, appName]);

    const [tool, setTool] = useState<ScriptTool>(derivedTool);
    const [packagerConfig, setPackagerConfig] = useState(derivedPackagerConfig);

    useEffect(() => {
        setTool(derivedTool);
        setPackagerConfig(derivedPackagerConfig);
    }, [derivedTool, derivedPackagerConfig]);

    const handleToolChange = (newTool: ScriptTool) => {
        setTool(newTool);
        if (newTool === 'electron-builder') {
            onChange('electron-builder --win portable --x64');
        } else if (newTool === 'electron-packager') {
            const newConfig = { ...packagerConfig, appName: appName || 'MyApp' };
            setPackagerConfig(newConfig);
            onChange(buildPackagerScript(newConfig));
        } else {
            onChange(undefined);
        }
    };

    const handlePackagerConfigChange = (field: keyof PackagerConfig, value: any) => {
        const newConfig = { ...packagerConfig, [field]: value };
        setPackagerConfig(newConfig);
        onChange(buildPackagerScript(newConfig));
    };

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">{t('script_builder_title')}</h3>
            
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t('script_builder_tool')}</label>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-700 p-1">
                    <button 
                        onClick={() => handleToolChange('electron-builder')}
                        className={`w-full text-center px-3 py-1 text-sm font-medium rounded-md focus:outline-none transition-colors ${tool === 'electron-builder' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >{t('script_builder_tool_builder')}</button>
                    <button 
                        onClick={() => handleToolChange('electron-packager')}
                        className={`w-full text-center px-3 py-1 text-sm font-medium rounded-md focus:outline-none transition-colors ${tool === 'electron-packager' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >{t('script_builder_tool_packager')}</button>
                    <button 
                        onClick={() => handleToolChange('none')}
                        className={`w-full text-center px-3 py-1 text-sm font-medium rounded-md focus:outline-none transition-colors ${tool === 'none' ? 'bg-gray-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >{t('script_builder_tool_none')}</button>
                </div>
            </div>

            <div className="mt-4 p-4 bg-gray-800 rounded-md min-h-[100px]">
                {tool === 'none' && (
                    <div className="text-center text-gray-400 text-sm">
                        {t('script_builder_none_desc')}
                    </div>
                )}
                {tool === 'electron-builder' ? (
                     <div>
                        {!hasBuildSection ? (
                            <div className="text-center p-3 border-2 border-dashed border-gray-600 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">{t('build_section_missing_title')}</h3>
                                <p className="text-gray-400 text-sm mb-4">{t('build_section_missing_desc')}</p>
                                <button
                                    onClick={onAddBuildSection}
                                    className="flex items-center mx-auto space-x-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    <span>{t('addBuildSection')}</span>
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">{t('script_builder_builder_desc')}</p>
                        )}
                        <code className="mt-4 block text-sm bg-gray-700 p-2 rounded-md text-green-400">"package:win": "electron-builder --win portable --x64"</code>
                     </div>
                ) : null}
                {tool === 'electron-packager' ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400 -mt-1 mb-2">{t('script_builder_packager_desc')}</p>
                        
                        <div>
                            <div className="flex items-center space-x-1.5 mb-1">
                                <label className="block text-sm font-medium text-gray-400">{t('packager_appName')}</label>
                                <Tooltip text={t('tooltip_packager_appName')} />
                            </div>
                            <input type="text" value={packagerConfig.appName} onChange={e => handlePackagerConfigChange('appName', e.target.value)} className={inputClasses} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <div className="flex items-center space-x-1.5 mb-1">
                                    <label className="block text-sm font-medium text-gray-400">{t('packager_arch')}</label>
                                    <Tooltip text={t('tooltip_packager_arch')} />
                                </div>
                                <select value={packagerConfig.arch} onChange={e => handlePackagerConfigChange('arch', e.target.value)} className={selectClasses}>
                                    <option value="x64">x64</option>
                                    <option value="ia32">ia32</option>
                                    <option value="armv7l">armv7l</option>
                                    <option value="arm64">arm64</option>
                                    <option value="all">all</option>
                                </select>
                            </div>
                             <div>
                               <div className="flex items-center space-x-1.5 mb-1">
                                    <label className="block text-sm font-medium text-gray-400">{t('packager_outDir')}</label>
                                    <Tooltip text={t('tooltip_packager_outDir')} />
                                </div>
                                <input type="text" value={packagerConfig.outDir} onChange={e => handlePackagerConfigChange('outDir', e.target.value)} className={inputClasses} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-6 pt-2">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={packagerConfig.overwrite}
                                  onChange={e => handlePackagerConfigChange('overwrite', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                                />
                                <div className="flex items-center space-x-1.5">
                                    <span className="text-sm font-medium text-gray-200">{t('packager_overwrite')}</span>
                                    <Tooltip text={t('tooltip_packager_overwrite')} />
                                </div>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={packagerConfig.asar}
                                  onChange={e => handlePackagerConfigChange('asar', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                                />
                                 <div className="flex items-center space-x-1.5">
                                    <span className="text-sm font-medium text-gray-200">{t('packager_asar')}</span>
                                    <Tooltip text={t('tooltip_packager_asar')} />
                                </div>
                              </label>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ScriptBuilder;