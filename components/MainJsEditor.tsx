
import React, { useMemo, useCallback } from 'react';
import { t } from '../i18n';
import Section from './Section';
import { InputField, BooleanField } from '../App';

interface MainJsEditorProps {
  content: string;
  setContent: (newContent: string) => void;
}

interface MainJsConfig {
  width: number;
  height: number;
  title: string;
  menuBarVisible: boolean;
  nodeIntegration: boolean;
  contextIsolation: boolean;
  openDevTools: boolean;
}

const parseMainJs = (content: string): MainJsConfig => {
  const widthMatch = content.match(/width:\s*(\d+)/);
  const heightMatch = content.match(/height:\s*(\d+)/);
  const titleMatch = content.match(/title:\s*'([^']*)'/);
  
  // La barra de menú es visible por defecto. Solo se oculta si `setMenuBarVisibility(false)` está activo.
  const menuIsHidden = /^(?!\s*\/\/)\s*(?:win|mainWindow)\.setMenuBarVisibility\(false\)/m.test(content);
  
  const nodeIntegrationMatch = content.match(/nodeIntegration:\s*(true|false)/);
  const contextIsolationMatch = content.match(/contextIsolation:\s*(true|false)/);
  
  // DevTools está abierto si la línea existe y NO está comentada.
  const openDevToolsMatch = /^(?!\s*\/\/)\s*(?:win|mainWindow)\.webContents\.openDevTools\(\)/m.test(content);

  return {
    width: widthMatch ? parseInt(widthMatch[1], 10) : 1200,
    height: heightMatch ? parseInt(heightMatch[1], 10) : 800,
    title: titleMatch ? titleMatch[1] : '',
    menuBarVisible: !menuIsHidden,
    nodeIntegration: nodeIntegrationMatch ? nodeIntegrationMatch[1] === 'true' : false,
    contextIsolation: contextIsolationMatch ? contextIsolationMatch[1] === 'true' : true,
    openDevTools: openDevToolsMatch,
  };
};

const popularResolutions = [
    { label: t('mainjs_resolution_preset_placeholder'), value: ''},
    { label: '1280 x 720 (HD)', value: '1280,720' },
    { label: '1366 x 768 (Laptop)', value: '1366,768' },
    { label: '1600 x 900', value: '1600,900' },
    { label: '1920 x 1080 (Full HD)', value: '1920,1080' },
    { label: '2560 x 1440 (QHD)', value: '2560,1440' },
];

const MainJsEditor: React.FC<MainJsEditorProps> = ({ content, setContent }) => {
  const config = useMemo(() => parseMainJs(content), [content]);

  const handleUpdate = useCallback((key: keyof MainJsConfig, value: any) => {
    let newContent = content;
    
    switch (key) {
      case 'width':
        newContent = newContent.replace(/width:\s*\d+/, `width: ${value}`);
        break;
      case 'height':
        newContent = newContent.replace(/height:\s*\d+/, `height: ${value}`);
        break;
      case 'title':
        if (newContent.match(/title:\s*'([^']*)'/)) {
          newContent = newContent.replace(/title:\s*'([^']*)'/, `title: '${value}'`);
        } else {
          newContent = newContent.replace(/(new BrowserWindow\({)/, `$1\n    title: '${value}',`);
        }
        break;
      case 'menuBarVisible': {
        const menuBarRegex = /^\s*(\/\/\s*)?(win|mainWindow)\.setMenuBarVisibility\((?:true|false)\);?.*$/m;
        newContent = content.replace(menuBarRegex, '');

        if (value === false) {
            const creationRegex = /((?:const\s+)?(win|mainWindow)\s*=\s*new BrowserWindow\({[\s\S]+?}\);)/m;
            
            if (creationRegex.test(newContent)) {
                newContent = newContent.replace(creationRegex, `$1\n  $2.setMenuBarVisibility(false);`);
            } else {
                const loadFileRegex = /(^\s*(win|mainWindow)\.loadFile\(.*\);?.*$)/m;
                if (loadFileRegex.test(newContent)) {
                    newContent = newContent.replace(loadFileRegex, (match, fullLine, varName) => {
                       return `  ${varName}.setMenuBarVisibility(false);\n\n${fullLine}`;
                    });
                }
            }
        }
        
        newContent = newContent.replace(/(\r\n|\n\s*){3,}/g, '\n\n');
        break;
      }
      case 'nodeIntegration':
        newContent = newContent.replace(/nodeIntegration:\s*(true|false)/, `nodeIntegration: ${value}`);
        break;
      case 'contextIsolation':
        newContent = newContent.replace(/contextIsolation:\s*(true|false)/, `contextIsolation: ${value}`);
        break;
      case 'openDevTools': {
        const devToolsLine = `win.webContents.openDevTools();`;
        const devToolsRegex = /^\s*(\/\/\s*)?(?:win|mainWindow)\.webContents\.openDevTools\(\);?.*$/m;
        
        const lineExists = devToolsRegex.test(newContent);
        const desiredLine = value ? `  ${devToolsLine}` : `  // ${devToolsLine}`;

        if (lineExists) {
            newContent = newContent.replace(devToolsRegex, desiredLine);
        } else {
            const loadFileRegex = /(?:win|mainWindow)\.loadFile\(.*\);/m;
            const creationRegex = /(?:const\s+)?win\s*=\s*new BrowserWindow\({[^}]*}\);/m;

            if (loadFileRegex.test(newContent)) {
                newContent = newContent.replace(loadFileRegex, `$& \n${desiredLine}`);
            } else if (creationRegex.test(newContent)) {
                newContent = newContent.replace(creationRegex, `$& \n${desiredLine}`);
            } else {
                newContent = newContent.replace(/(createWindow\(\)\s*\{)/, `$1\n${desiredLine}`);
            }
        }
        newContent = newContent.replace(/(\r\n|\n\s*){3,}/g, '\n\n');
        break;
      }
    }
    setContent(newContent);
  }, [content, setContent]);

  const handleResolutionPresetChange = (value: string) => {
    if (!value) return;
    const [w, h] = value.split(',').map(Number);
    let newContent = content;
    newContent = newContent.replace(/width:\s*\d+/, `width: ${w}`);
    newContent = newContent.replace(/height:\s*\d+/, `height: ${h}`);
    setContent(newContent);
  };


  return (
    <div className="space-y-4">
      <Section title={t('mainjs_window_settings')}>
        <InputField
            label={t('mainjs_window_title')}
            value={String(config.title)}
            onChange={val => handleUpdate('title', val)}
            tooltipText={t('tooltip_mainjs_window_title')}
        />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('mainjs_resolution_preset')}</label>
            <select
                onChange={(e) => handleResolutionPresetChange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('mainjs_resolution_preset')}
            >
                {popularResolutions.map(res => <option key={res.label} value={res.value}>{res.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t('mainjs_width')}
              type="number"
              value={String(config.width)}
              onChange={val => handleUpdate('width', parseInt(val, 10) || 0)}
              tooltipText={t('tooltip_mainjs_width')}
            />
            <InputField
              label={t('mainjs_height')}
              type="number"
              value={String(config.height)}
              onChange={val => handleUpdate('height', parseInt(val, 10) || 0)}
              tooltipText={t('tooltip_mainjs_height')}
            />
          </div>
        </div>
        <BooleanField
            label={t('mainjs_menu_bar_visible')}
            value={config.menuBarVisible}
            onChange={val => handleUpdate('menuBarVisible', val)}
            tooltipText={t('tooltip_mainjs_menu_bar_visible')}
        />
      </Section>
      
      <Section title={t('mainjs_web_preferences')}>
         <BooleanField
            label={t('mainjs_nodeIntegration')}
            value={config.nodeIntegration}
            onChange={val => handleUpdate('nodeIntegration', val)}
            tooltipText={t('tooltip_mainjs_nodeIntegration')}
          />
          <BooleanField
            label={t('mainjs_contextIsolation')}
            value={config.contextIsolation}
            onChange={val => handleUpdate('contextIsolation', val)}
            tooltipText={t('tooltip_mainjs_contextIsolation')}
          />
      </Section>
      
      <Section title={t('mainjs_dev_tools')}>
        <BooleanField
            label={t('mainjs_openDevTools')}
            value={config.openDevTools}
            onChange={val => handleUpdate('openDevTools', val)}
            tooltipText={t('tooltip_mainjs_openDevTools')}
        />
      </Section>
    </div>
  );
};

export default MainJsEditor;