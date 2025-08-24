import React from 'react';
import type { BuildConfiguration, PackageJson, TargetConfig, BuildPlatformConfig } from '../types';
import { t } from '../i18n';
import Tooltip from './Tooltip';
import CheckboxGroup from './CheckboxGroup';
import { CheckCircleIcon, ExclamationCircleIcon, PlusIcon } from './Icons';

interface BuildEditorProps {
  data: BuildConfiguration | undefined;
  scripts: PackageJson['scripts'] | undefined;
  setData: (newData: BuildConfiguration) => void;
  onApplySuggestion: () => void;
}

const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

const WIN_TARGETS = [{value: 'nsis', label: 'Instalador (NSIS)'}, {value: 'portable', label: 'Portable'}];
const ARCHS = [{value: 'x64', label: 'x64'}, {value: 'ia32', label: 'ia32 (32-bit)'}, {value: 'arm64', label: 'ARM64'}];

const EditorField: React.FC<{ label: string; tooltip: string; children: React.ReactNode }> = ({ label, tooltip, children }) => (
    <div>
        <div className="flex items-center space-x-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            <Tooltip text={tooltip} />
        </div>
        {children}
    </div>
);

const BooleanField: React.FC<{ label: string, value: boolean, onChange: (value: boolean) => void, tooltipText: string}> = ({ label, value, onChange, tooltipText }) => (
    <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-1.5">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            <Tooltip text={tooltipText} />
        </div>
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500`}
            aria-pressed={value}
        >
            <span className="sr-only">Toggle {label}</span>
            <span className={`${value ? 'bg-blue-500' : 'bg-gray-600'} absolute h-4 w-9 mx-auto rounded-full transition-colors ease-in-out duration-200`}></span>
            <span className={`${value ? 'translate-x-6' : 'translate-x-1'} absolute left-0 inline-block w-4 h-4 transform bg-white rounded-full transition-transform ease-in-out duration-200`} />
        </button>
    </div>
);


const ScriptCheck: React.FC<{ scripts: PackageJson['scripts'], onApplySuggestion: () => void; }> = ({ scripts, onApplySuggestion }) => {
    const scriptName = `package:win`;
    const foundScript = scripts?.[scriptName];
    const suggestedCommand = `electron-builder --win portable --x64`;

    return (
        <div className="mt-6 p-3 bg-gray-900/50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-300 mb-2">{t('scriptCheck_title')}</h5>
            {foundScript ? (
                <div className="flex items-start space-x-2 text-green-400">
                    <CheckCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium">{t('scriptCheck_found')}</p>
                        <code className="text-xs bg-gray-700 p-1 rounded">{`${scriptName}: "${foundScript}"`}</code>
                    </div>
                </div>
            ) : (
                <div className="flex items-start space-x-2 text-yellow-400">
                    <ExclamationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-sm font-medium">{t('scriptCheck_missing')}</p>
                        <p className="text-xs text-gray-400 mb-2">{t('scriptCheck_suggestion')}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="text-xs bg-gray-700 p-1 rounded">{`${scriptName}: "${suggestedCommand}"`}</code>
                            <button 
                                onClick={onApplySuggestion}
                                className="flex items-center space-x-1 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 px-2 py-1 rounded-md transition-colors"
                            >
                                <PlusIcon className="h-3 w-3" />
                                <span>{t('scriptCheck_applySuggestion')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const BuildEditor: React.FC<BuildEditorProps> = ({ data, setData, scripts = {}, onApplySuggestion }) => {
  
  const handleUpdate = (key: keyof BuildConfiguration, value: any) => {
    setData({ ...(data || {}), [key]: value });
  };
  
  const handleNestedUpdate = (parentKey: 'directories', childKey: string, value: any) => {
    const parentObject = data?.[parentKey] || {};
    const newParentObject = { ...parentObject, [childKey]: value };
    handleUpdate(parentKey, newParentObject);
  };

  const handlePlatformUpdate = (platform: 'win', newConfig: BuildPlatformConfig) => {
     handleUpdate(platform, { ...(data?.[platform] || {}), ...newConfig });
  };
  
  const handleTargetToggle = (targetValue: string) => {
      const platformData = data?.win;
      const targetOrTargets = platformData?.target;
      let currentTargets = (Array.isArray(targetOrTargets) ? targetOrTargets : []).filter(t => typeof t === 'object') as TargetConfig[];
      
      const targetIndex = currentTargets.findIndex(t => t.target === targetValue);

      if (targetIndex > -1) {
          currentTargets = currentTargets.filter((_, i) => i !== targetIndex);
      } else {
          currentTargets.push({ target: targetValue, arch: ['x64'] });
      }
      handlePlatformUpdate('win', { target: currentTargets });
  };

  const handleArchChange = (targetValue: string, newArchs: string[]) => {
      const platformData = data?.win;
      const targetOrTargets = platformData?.target;
      let currentTargets = (Array.isArray(targetOrTargets) ? targetOrTargets : []).filter(t => typeof t === 'object') as TargetConfig[];
      
      const targetIndex = currentTargets.findIndex(t => t.target === targetValue);
      if (targetIndex > -1) {
          currentTargets[targetIndex].arch = newArchs;
          handlePlatformUpdate('win', { target: [...currentTargets] });
      }
  };

  const targetOrTargets = data?.win?.target;
  const platformTargets = (Array.isArray(targetOrTargets) ? targetOrTargets : []).filter(t => typeof t === 'object') as TargetConfig[];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">{t('build_general')}</h3>
        <div className="space-y-4">
           <EditorField label={t('build_appId')} tooltip={t('tooltip_build_appId')}>
             <input type="text" value={data?.appId || ''} onChange={e => handleUpdate('appId', e.target.value)} className={inputClasses} />
           </EditorField>
           <EditorField label={t('build_productName')} tooltip={t('tooltip_build_productName')}>
             <input type="text" value={data?.productName || ''} onChange={e => handleUpdate('productName', e.target.value)} className={inputClasses} />
           </EditorField>
           <EditorField label={t('build_buildResourcesDir')} tooltip={t('tooltip_build_buildResourcesDir')}>
             <input type="text" value={data?.directories?.buildResources || 'assets'} onChange={e => handleNestedUpdate('directories', 'buildResources', e.target.value)} className={inputClasses} />
           </EditorField>
           <EditorField label={t('build_files')} tooltip={t('tooltip_build_files')}>
              <textarea 
                value={Array.isArray(data?.files) ? data.files.join('\n') : (data?.files || '')}
                onChange={e => handleUpdate('files', e.target.value.split('\n').filter(Boolean))}
                rows={4}
                className={`${inputClasses} font-mono text-sm`}
                placeholder={'Ej:\ndist/**/*\nmain.js\n!node_modules/*'}
              />
           </EditorField>
           <BooleanField label={t('build_forceCodeSigning')} value={data?.forceCodeSigning ?? false} onChange={v => handleUpdate('forceCodeSigning', v)} tooltipText={t('tooltip_build_forceCodeSigning')} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">{t('build_platforms')}</h3>
        <div className="space-y-8">
            <div>
              <h4 className="font-medium text-gray-300 mb-3 text-lg">{t('build_win')}</h4>
              <div className="space-y-4 pl-4 border-l-2 border-gray-700">
                  <EditorField label={t('build_target')} tooltip={t('tooltip_build_target')}>
                    <div className='space-y-3'>
                      {WIN_TARGETS.map(targetOption => {
                        const activeTarget = platformTargets.find(t => t.target === targetOption.value);
                        return (
                          <div key={targetOption.value} className="p-3 bg-gray-700/50 rounded-md">
                            <label className="flex items-center space-x-2 cursor-pointer mb-2">
                              <input
                                type="checkbox"
                                checked={!!activeTarget}
                                onChange={() => handleTargetToggle(targetOption.value)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                              />
                              <span className="text-sm font-medium text-gray-200">{targetOption.label}</span>
                            </label>
                            {activeTarget && (
                              <div className="pl-6">
                                <CheckboxGroup 
                                  label={t('build_arch')} 
                                  options={ARCHS} 
                                  selected={Array.isArray(activeTarget.arch) ? activeTarget.arch : [activeTarget.arch]}
                                  onChange={newArchs => handleArchChange(targetOption.value, newArchs)}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </EditorField>
                 <EditorField label={t('build_icon')} tooltip={t('tooltip_build_icon')}>
                   <input type="text" value={data?.win?.icon || ''} onChange={e => handlePlatformUpdate('win', { icon: e.target.value })} placeholder={'path/to/icon.ico'} className={inputClasses} />
                 </EditorField>
                 <ScriptCheck scripts={scripts} onApplySuggestion={onApplySuggestion} />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuildEditor;