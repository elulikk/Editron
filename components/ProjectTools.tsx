import React from 'react';
import { t } from '../i18n';
import { PlusIcon, DownloadIcon } from './Icons';
import Section from './Section';

interface ProjectToolsProps {
  mainJsExists: boolean;
  onGenerateMainJs: () => void;
  onDownloadViteConfig: () => void;
}

const ProjectTools: React.FC<ProjectToolsProps> = ({ mainJsExists, onGenerateMainJs, onDownloadViteConfig }) => {
  return (
    <div className="mb-6">
        <Section title={t('project_tools')}>
             <div className="space-y-4">
                {!mainJsExists && (
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-white">{t('generate_main_js')}</h4>
                            <p className="text-sm text-gray-400">{t('generate_main_js_desc')}</p>
                        </div>
                        <button
                            onClick={onGenerateMainJs}
                            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>{t('generate_main_js')}</span>
                        </button>
                    </div>
                )}
                 <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-white">{t('download_vite_config')}</h4>
                        <p className="text-sm text-gray-400">{t('download_vite_config_desc')}</p>
                    </div>
                    <button
                        onClick={onDownloadViteConfig}
                        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        <span>{t('download_vite_config')}</span>
                    </button>
                 </div>
             </div>
        </Section>
    </div>
  );
};

export default ProjectTools;