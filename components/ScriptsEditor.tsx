import React from 'react';
import KeyValueEditor from './KeyValueEditor';
import ScriptBuilder from './ScriptBuilder';
import { t } from '../i18n';
import { PlusIcon } from './Icons';

interface ScriptsEditorProps {
    data: Record<string, string> | undefined;
    setData: (newData: Record<string, string>) => void;
    appName: string | undefined;
    suggestions?: Record<string, string>;
    getTooltipContent?: (key: string, value: string) => string | undefined;
    hasBuildSection: boolean;
    onAddBuildSection: () => void;
}

const ScriptsEditor: React.FC<ScriptsEditorProps> = ({ data = {}, setData, appName, suggestions, getTooltipContent, hasBuildSection, onAddBuildSection }) => {
    const { 'package:win': packageWinScript, ...otherScripts } = data;

    const handleScriptBuilderChange = (newScript: string | undefined) => {
        const newData = { ...otherScripts };
        if (newScript) {
            newData['package:win'] = newScript;
        }
        setData(newData);
    };

    const handleOtherScriptsChange = (newOtherScripts: Record<string, string>) => {
        const newData = { ...newOtherScripts };
        if (packageWinScript !== undefined) {
            newData['package:win'] = packageWinScript;
        }
        setData(newData);
    };

    return (
        <div className="space-y-8">
            <ScriptBuilder
                script={packageWinScript}
                onChange={handleScriptBuilderChange}
                appName={appName}
                hasBuildSection={hasBuildSection}
                onAddBuildSection={onAddBuildSection}
            />

            <div className="relative pt-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-gray-800 px-3 text-sm font-medium text-gray-400">{t('other_scripts')}</span>
                </div>
            </div>

            <KeyValueEditor
                data={otherScripts}
                setData={handleOtherScriptsChange}
                keyPlaceholder={t('scriptName')}
                valuePlaceholder={t('command')}
                suggestions={suggestions}
                getTooltipContent={getTooltipContent}
            />
        </div>
    );
};

export default ScriptsEditor;