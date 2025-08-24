

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import type { PackageJson, BuildConfiguration, FileType, ViewType } from './types';
import KeyValueEditor from './components/KeyValueEditor';
import { DownloadIcon, UploadIcon, PlusIcon, ZipIcon, FileCodeIcon, NewFileIcon, CogIcon, FolderIcon, InformationCircleIcon, CodeBracketIcon, SparklesIcon, TerminalIcon } from './components/Icons';
import { t } from './i18n';
import Tabs from './components/Tabs';
import DynamicFieldEditor from './components/DynamicFieldEditor';
import Tooltip from './components/Tooltip';
import BuildEditor from './components/BuildEditor';
import ScriptsEditor from './components/ScriptsEditor';
import { dependencyTooltips, scriptTooltips } from './locales/tooltips';
import CodePreview from './components/CodePreview';
import MainJsEditor from './components/MainJsEditor';
import { parsePackagerScript, buildPackagerScript } from './utils';
import BatEditor from './components/BatEditor';

interface ActiveFile {
  name: string;
  content: string;
  type: FileType;
  originalContent: string;
}

const minimalViteTemplate: PackageJson = {
  name: "my-app",
  private: true,
  version: "1.0.0",
  type: "module",
  main: "main.js",
  scripts: {
    "dev": "vite",
    "build": "vite build"
  },
  dependencies: {},
  devDependencies: {}
};

const electronPackageJsonTemplate: PackageJson = {
  name: "my-electron-app",
  private: true,
  version: "1.0.0",
  type: "module",
  main: "main.js",
  scripts: {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "package:win": "electron-builder --win portable --x64"
  },
  dependencies: {
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  devDependencies: {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "electron": "^37.3.0",
    "electron-builder": "^26.0.12",
    "electron-packager": "^17.1.2",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  },
  build: {
    appId: "com.example.my-electron-app",
    productName: "my-electron-app",
    directories: {
      buildResources: "assets"
    },
    files: [
      "dist/**/*",
      "main.js",
      "package.json"
    ],
    forceCodeSigning: false,
    win: {
      target: [
        {
          target: "portable",
          arch: [
            "x64"
          ]
        }
      ]
    }
  }
};


const scriptSuggestions = {
  "dev": "vite",
  "start": "node index.js",
  "build": "tsc && vite build",
  "test": "jest",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "electron:dev": "electron .",
};

const dependencySuggestions = {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.1",
  "lodash": "^4.17.21",
  "axios": "^1.6.0"
};

const devDependencySuggestions = {
  "typescript": "^5.2.2",
  "vite": "^5.2.0",
  "tailwindcss": "^3.4.1",
  "@types/react": "^18.2.66",
  "@types/react-dom": "^18.2.22",
  "eslint": "^8.57.0",
  "prettier": "^3.2.5"
};

const CORE_INFO_KEYS = ['name', 'version', 'description', 'main', 'private', 'type'];

const defaultBuild: BuildConfiguration = {
  appId: "com.ejemplo.app",
  productName: "Mi App Genial",
  directories: {
    buildResources: "assets"
  },
  files: [
    "dist/**/*",
    "main.js",
    "package.json"
  ],
  forceCodeSigning: false,
  win: {
    target: [{ target: 'portable', arch: ['x64'] }]
  }
};

const viteConfigContent = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',   // rutas relativas para que funcione en file://
  plugins: [react()]
})
`.trim();

const generateCompilarBatContent = (packageJson: PackageJson | null): string => {
    const packageWinScript = packageJson?.scripts?.['package:win'];
    let finalCommand = `powershell -Command "npm run package:win | Tee-Object -FilePath '%LOGFILE%' -Append"`; // Default

    if (packageWinScript && packageWinScript.includes('electron-packager')) {
        const packagerConfig = parsePackagerScript(packageWinScript, packageJson?.name || 'MyApp');
        let packagerCommand = buildPackagerScript(packagerConfig);
        packagerCommand = `npx ${packagerCommand}`;
        finalCommand = `powershell -Command "${packagerCommand} | Tee-Object -FilePath '%LOGFILE%' -Append"`;
    }

    const content = `@echo off
:: ========================
:: Script para build .exe con log (pantalla + log)
:: ========================

set LOGFILE=build_log.txt
powershell -Command "Add-Content -Path '%LOGFILE%' -Value '==== INICIO DEL BUILD: %date% %time% ===='"

:: --- Chequear permisos de administrador ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
    exit /b
)

:: --- Ir a la carpeta del proyecto ---
cd /d "%~dp0"

:: --- Chequear archivos necesarios ---
if not exist "main.js" (
    echo main.js no encontrado
    pause
    exit /b
)
if not exist "package.json" (
    echo package.json no encontrado
    pause
    exit /b
)
if not exist "vite.config.js" (
    echo vite.config.js no encontrado
    pause
    exit /b
)

:: --- Instalar dependencias ---
powershell -Command "npm install --save-dev @vitejs/plugin-react electron electron-packager electron-builder | Tee-Object -FilePath '%LOGFILE%' -Append"

:: --- Ejecutar build ---
powershell -Command "npm run build | Tee-Object -FilePath '%LOGFILE%' -Append"

:: --- Ejecutar package:win ---
${finalCommand}

powershell -Command "Add-Content -Path '%LOGFILE%' -Value '==== FIN DEL BUILD: %date% %time% ===='"

pause
`;
    return content.replace(/\n/g, '\r\n');
};


const generateMainJsContent = (appName: string = 'Mi App Electron') => `
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win; // Referencia global para no ser eliminado por el garbage collector

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    title: '${appName}',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload: path.join(__dirname, 'preload.js')
    },
  });

  // Carga el archivo index.html de tu aplicación.
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  
  win.setMenuBarVisibility(false); // Descomenta para ocultar la barra de menú

  // win.webContents.openDevTools(); // Descomenta para abrir DevTools al inicio
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // En macOS, las aplicaciones suelen permanecer activas hasta que se cierran explícitamente.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS, es común recrear una ventana si se hace clic en el icono del dock.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`.trim();


const getDependencyTooltip = (key: string): string => dependencyTooltips[key] || t('tooltip_dependency');
const getScriptTooltip = (key: string): string => scriptTooltips[key] || t('tooltip_script', key);

function App() {
  const [activeFiles, setActiveFiles] = useState<Record<string, ActiveFile>>({});
  const [currentView, setCurrentView] = useState<ViewType>('package.json');
  const [error, setError] = useState<string | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState('info');
  const [isNewFileMenuOpen, setIsNewFileMenuOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFileMenuRef = useRef<HTMLDivElement>(null);
  
  // Resizable pane state
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAppName, setWizardAppName] = useState('');
  const [wizardAppVersion, setWizardAppVersion] = useState('1.0.0');

  const packageJsonFile = activeFiles['package.json'];
  const mainJsFile = activeFiles['main.js'];
  const compilarBatFile = activeFiles['Compilar.BAT'];

  const jsonData = useMemo<PackageJson | null>(() => {
    if (packageJsonFile?.type === 'json' && packageJsonFile.content) {
      try {
        const parsed = JSON.parse(packageJsonFile.content);
        setError(null);
        return parsed;
      } catch {
        setError(t('errorInvalidJson'));
        return null;
      }
    }
    return null;
  }, [packageJsonFile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (newFileMenuRef.current && !newFileMenuRef.current.contains(event.target as Node)) {
            setIsNewFileMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Resizer logic
  const handleMouseDownResizer = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUpResizer = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMoveResizer = useCallback((e: MouseEvent) => {
    if (isResizing && mainContentRef.current) {
      const rect = mainContentRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 20 && newWidth < 80) { // Constraints
        setEditorWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMoveResizer);
    window.addEventListener('mouseup', handleMouseUpResizer);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveResizer);
      window.removeEventListener('mouseup', handleMouseUpResizer);
    };
  }, [handleMouseMoveResizer, handleMouseUpResizer]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y,
        });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging && modalRef.current) {
          setModalPosition({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y,
          });
      }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
      setIsDragging(false);
  }, []);

  useEffect(() => {
      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      } else {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: FileType | undefined;
    let viewType: ViewType | undefined;
    if (file.name === 'package.json') {
      fileType = 'json';
      viewType = 'package.json';
    } else if (file.name === 'main.js') {
      fileType = 'javascript';
      viewType = 'main.js';
    } else {
      setError(t('errorInvalidFileType'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not readable text.");
        }
        const newFiles: Record<string, ActiveFile> = {
            [file.name]: { name: file.name, content: text, type: fileType!, originalContent: text }
        };

        if (fileType === 'json') {
          const parsedJson = JSON.parse(text);
          const batContent = generateCompilarBatContent(parsedJson);
          newFiles['Compilar.BAT'] = { name: 'Compilar.BAT', content: batContent, type: 'batch', originalContent: batContent };
        }
        
        setActiveFiles(prev => ({
          ...prev,
          ...newFiles,
        }));

        setError(null);
        setCurrentView(viewType!);
        if (viewType === 'package.json') {
          setActiveJsonTab('info');
        }
      } catch (err) {
        setError(t('errorParsingFile'));
        console.error(err);
      } finally {
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };
  
  const handleDownloadViteConfig = () => {
    const blob = new Blob([viteConfigContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = 'vite.config.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!mainJsFile) {
        const proceed = window.confirm(t('warning_missing_main_js'));
        if (!proceed) {
            return;
        }
    }

    const zip = new JSZip();

    if (packageJsonFile) zip.file("package.json", packageJsonFile.content);
    if (mainJsFile) zip.file("main.js", mainJsFile.content);
    if (compilarBatFile) zip.file("Compilar.BAT", compilarBatFile.content);
    
    zip.file("vite.config.js", viteConfigContent);

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const appName = jsonData?.name || 'proyecto-electron';
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${appName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        setError("Error al generar el archivo ZIP.");
    }
  };
  
  const handleCreateProjectFromTemplate = (template: PackageJson) => {
      if (!wizardAppName) {
          setError("El nombre del proyecto no puede estar vacío.");
          return;
      }
      const newPackageData: PackageJson = {
          ...template,
          name: wizardAppName,
          version: wizardAppVersion,
      };

      if (!newPackageData.scripts?.['package:win'] && template === electronPackageJsonTemplate) {
          if (!newPackageData.scripts) newPackageData.scripts = {};
          newPackageData.scripts['package:win'] = 'electron-builder --win portable --x64';
      }

      const packageContent = JSON.stringify(newPackageData, null, 2);
      const mainJsContent = generateMainJsContent(newPackageData.productName || newPackageData.name);
      const batContent = generateCompilarBatContent(newPackageData);

      setActiveFiles({
          'package.json': { name: 'package.json', content: packageContent, type: 'json', originalContent: packageContent },
          'main.js': { name: 'main.js', content: mainJsContent, type: 'javascript', originalContent: mainJsContent },
          'Compilar.BAT': { name: 'Compilar.BAT', content: batContent, type: 'batch', originalContent: batContent }
      });

      setCurrentView('package.json');
      setActiveJsonTab('info');
      setError(null);
      setIsNewFileMenuOpen(false);
  };

  const updateJsonData = (newJsonData: PackageJson | null) => {
    if (newJsonData && packageJsonFile) {
        const newPackageContent = JSON.stringify(newJsonData, null, 2);
        const newBatContent = generateCompilarBatContent(newJsonData);

        setActiveFiles(prev => ({
            ...prev,
            'package.json': {
                ...prev['package.json'],
                content: newPackageContent
            },
            ...(prev['Compilar.BAT'] && {
                'Compilar.BAT': {
                    ...prev['Compilar.BAT'],
                    content: newBatContent
                }
            })
        }));
    }
  }

  const updateField = useCallback(<K extends keyof PackageJson,>(field: K, value: PackageJson[K]) => {
    if (!jsonData) return;
    const newJsonData = { ...jsonData };
    if (value === undefined) {
      delete newJsonData[field];
    } else {
      newJsonData[field] = value;
    }
    updateJsonData(newJsonData);
  }, [jsonData]);
  
  const updateNestedObject = useCallback((field: keyof PackageJson, newData: Record<string, any>) => {
     if (!jsonData) return;
     updateJsonData({ ...jsonData, [field]: newData });
  }, [jsonData]);

  const handleAddBuildSection = () => {
    if (!jsonData) return;
    const newBuild = { 
        ...defaultBuild,
        productName: jsonData.name || defaultBuild.productName,
        appId: `com.example.${jsonData.name || 'app'}`
    };
    updateJsonData({ ...jsonData, build: newBuild });
    setActiveJsonTab('build');
  };
  
  const handleApplyScriptSuggestion = useCallback(() => {
    if (!jsonData) return;
    const updatedScripts = { ...jsonData.scripts, ['package:win']: 'electron-builder --win portable --x64' };
    updateJsonData({ ...jsonData, scripts: updatedScripts });
  }, [jsonData]);

  const setMainJsContent = useCallback((newContent: string) => {
      if(mainJsFile) {
         setActiveFiles(prev => ({
            ...prev,
            'main.js': { ...mainJsFile, content: newContent }
        }));
      }
  }, [mainJsFile]);
  
  const setCompilarBatContent = useCallback((newContent: string) => {
    if(compilarBatFile) {
       setActiveFiles(prev => ({
          ...prev,
          'Compilar.BAT': { ...compilarBatFile, content: newContent }
      }));
    }
  }, [compilarBatFile]);

  const handleGenerateMainJs = useCallback(() => {
    if (!jsonData) return;

    if (activeFiles['main.js']) {
        if (!window.confirm(t('confirm_overwrite_main_js'))) {
            return;
        }
    }

    const appName = jsonData.productName || jsonData.name || 'Mi App Electron';
    const mainJsContent = generateMainJsContent(appName);

    // Update package.json as well to set the main entry point
    const newPackageData = { ...jsonData, main: 'main.js' };
    const newPackageContent = JSON.stringify(newPackageData, null, 2);

    setActiveFiles(prev => ({
        ...prev,
        'package.json': {
            ...(prev['package.json'] as ActiveFile),
            content: newPackageContent,
        },
        'main.js': {
            name: 'main.js',
            content: mainJsContent,
            type: 'javascript',
            originalContent: mainJsContent,
        }
    }));
    setCurrentView('main.js');

  }, [jsonData, activeFiles]);

  const jsonTabs = useMemo(() => {
    if (!jsonData) return [];
    
    const otherKeys = Object.keys(jsonData).filter(key => !CORE_INFO_KEYS.includes(key));
    const allTabs = [
      { id: 'info', label: t('infoTab'), content: (
          <div className="space-y-4">
             <InputField label={t('name')} value={jsonData.name || ''} onChange={val => updateField('name', val)} placeholder={t('enterName')} tooltipText={t('tooltip_name')} />
             <InputField label={t('version')} value={jsonData.version || ''} onChange={val => updateField('version', val)} placeholder={t('enterVersion')} tooltipText={t('tooltip_version')} />
             <BooleanField label={t('type')} value={jsonData.type === 'module'} onChange={val => updateField('type', val ? 'module' : undefined)} tooltipText={t('tooltip_type')} />
             <InputField label={t('description')} value={jsonData.description || ''} onChange={val => updateField('description', val)} placeholder={t('enterDescription')} tooltipText={t('tooltip_description')} />
             <InputField label={t('main')} value={jsonData.main || ''} placeholder={t('mainPlaceholder')} onChange={val => updateField('main', val)} tooltipText={t('tooltip_main')} />
             <BooleanField label={t('private')} value={jsonData.private ?? false} onChange={val => updateField('private', val)} tooltipText={t('tooltip_private')} />
          </div>
      )},
      ...otherKeys.map(key => {
        let content;
        switch (key) {
            case 'scripts':
                content = <ScriptsEditor data={jsonData.scripts} setData={data => updateNestedObject('scripts', data)} appName={jsonData.name} suggestions={scriptSuggestions} getTooltipContent={getScriptTooltip} hasBuildSection={!!jsonData.build} onAddBuildSection={handleAddBuildSection} />;
                break;
            case 'dependencies':
                content = <KeyValueEditor data={jsonData.dependencies} setData={data => updateNestedObject('dependencies', data)} keyPlaceholder={t('packageName')} valuePlaceholder={t('packageVersion')} suggestions={dependencySuggestions} getTooltipContent={getDependencyTooltip} />;
                break;
            case 'devDependencies':
                content = <KeyValueEditor data={jsonData.devDependencies} setData={data => updateNestedObject('devDependencies', data)} keyPlaceholder={t('packageName')} valuePlaceholder={t('packageVersion')} suggestions={devDependencySuggestions} getTooltipContent={getDependencyTooltip} />;
                break;
            case 'build':
                content = <BuildEditor data={jsonData.build} setData={data => updateField('build', data)} scripts={jsonData.scripts} onApplySuggestion={handleApplyScriptSuggestion} />;
                break;
            default:
                content = <DynamicFieldEditor fieldKey={key} value={jsonData[key as keyof PackageJson]} onChange={updateField} tooltipText={t('tooltip_dynamic_field')} />;
                break;
        }
        const tabKeyMap: Record<string, string> = { 'scripts': t('scriptsTab'), 'dependencies': t('dependenciesTab'), 'devDependencies': t('devDependenciesTab'), 'build': t('buildTab'), };
        return { id: key, label: tabKeyMap[key] || key, content };
      })
    ];
    return allTabs;
  }, [jsonData, updateField, updateNestedObject, handleApplyScriptSuggestion]);

  useEffect(() => {
    if (jsonData) {
      const availableTabIds = ['info', ...Object.keys(jsonData).filter(key => !CORE_INFO_KEYS.includes(key))];
      if (!availableTabIds.includes(activeJsonTab)) {
        setActiveJsonTab('info');
      }
    }
  }, [jsonData, activeJsonTab]);
  
  const currentFile = activeFiles[currentView];

  const ToolbarButton = ({ onClick, disabled, tooltip, label, children, active = false }: { onClick?: () => void, disabled?: boolean, tooltip: string, label: string, children: React.ReactNode, active?: boolean }) => {
    if (!React.isValidElement<{ className?: string }>(children)) {
      return null;
    }
    const combinedClassName = `h-7 w-7 mb-1 ${children.props.className || ''}`.trim();
    
    return (
      <Tooltip text={tooltip}>
          <button
              onClick={onClick}
              disabled={disabled}
              className={`flex flex-col items-center justify-center text-center p-2 rounded-md w-24 h-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  active ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              aria-label={tooltip}
          >
              {React.cloneElement(children, { className: combinedClassName })}
              <span className="text-xs leading-tight">{label}</span>
          </button>
      </Tooltip>
    )
  };

  const ChangeTag = ({ tag }: { tag: string }) => {
    const tagColors: Record<string, string> = {
        [t('tag_new')]: 'bg-blue-500/20 text-blue-300',
        [t('tag_improvement')]: 'bg-green-500/20 text-green-300',
        [t('tag_fix')]: 'bg-yellow-500/20 text-yellow-300',
        [t('tag_style')]: 'bg-purple-500/20 text-purple-300',
    };
    return <span className={`inline-block mr-2 px-2 py-0.5 text-xs font-semibold rounded-full ${tagColors[tag] || 'bg-gray-500/20 text-gray-300'}`}>{tag}</span>
  };

  const changelogData = [
    {
      version: '1.5.2',
      title: t('v1_5_2_title'),
      changes: [
        { tag: t('tag_fix'), text: t('v1_5_2_c1') },
        { tag: t('tag_fix'), text: t('v1_5_2_c2') },
        { tag: t('tag_fix'), text: t('v1_5_2_c3') },
      ],
    },
    {
      version: '1.5.0',
      title: t('v1_5_0_title'),
      changes: [
        { tag: t('tag_improvement'), text: t('v1_5_0_c1') },
        { tag: t('tag_style'), text: t('v1_5_0_c2') },
        { tag: t('tag_style'), text: t('v1_5_0_c3') },
      ],
    },
    {
      version: '1.4.0',
      title: t('v1_4_0_title'),
      changes: [
        { tag: t('tag_improvement'), text: t('v1_4_0_c1') },
        { tag: t('tag_new'), text: t('v1_4_0_c2') },
        { tag: t('tag_style'), text: t('v1_4_0_c3') },
        { tag: t('tag_style'), text: t('v1_4_0_c4') },
        { tag: t('tag_fix'), text: t('v1_4_0_c5') },
      ],
    },
    {
      version: '1.3.0',
      title: t('v1_3_0_title'),
      changes: [
        { tag: t('tag_style'), text: t('v1_3_0_c1') },
        { tag: t('tag_style'), text: t('v1_3_0_c2') },
        { tag: t('tag_style'), text: t('v1_3_0_c3') },
        { tag: t('tag_improvement'), text: t('v1_3_0_c4') },
        { tag: t('tag_fix'), text: t('v1_3_0_c5') },
      ],
    },
    {
      version: '1.2.0',
      title: t('v1_2_0_title'),
      changes: [
        { tag: t('tag_improvement'), text: t('v1_2_0_c1') },
        { tag: t('tag_style'), text: t('v1_2_0_c2') },
        { tag: t('tag_style'), text: t('v1_2_0_c3') },
        { tag: t('tag_improvement'), text: t('v1_2_0_c4') },
        { tag: t('tag_style'), text: t('v1_2_0_c5') },
      ],
    },
    {
      version: '1.1.0',
      title: t('v1_1_0_title'),
      changes: [
        { tag: t('tag_new'), text: t('v1_1_0_c1') },
        { tag: t('tag_improvement'), text: t('v1_1_0_c2') },
        { tag: t('tag_style'), text: t('v1_1_0_c3') },
        { tag: t('tag_style'), text: t('v1_1_0_c4') },
        { tag: t('tag_improvement'), text: t('v1_1_0_c5') },
      ],
    },
    {
      version: '1.0.1',
      title: t('v1_0_1_title'),
      changes: [
        { tag: t('tag_new'), text: t('v1_0_1_c1') },
        { tag: t('tag_improvement'), text: t('v1_0_1_c2') },
        { tag: t('tag_improvement'), text: t('v1_0_1_c3') },
        { tag: t('tag_improvement'), text: t('v1_0_1_c4') },
        { tag: t('tag_fix'), text: t('v1_0_1_c5') },
      ],
    },
    {
      version: '1.odc',
      title: t('v1_0_0_title'),
      changes: [
        { tag: t('tag_new'), text: t('v1_0_0_c1') },
        { tag: t('tag_new'), text: t('v1_0_0_c2') },
        { tag: t('tag_new'), text: t('v1_0_0_c3') },
        { tag: t('tag_new'), text: t('v1_0_0_c4') },
      ],
    },
  ];

  const renderWizard = () => {
    let stepContent;
    let stepTitle = '';
    const totalSteps = 5;

    switch (wizardStep) {
        case 1:
            stepTitle = t('wizard_step1_title');
            stepContent = (
                <div className="text-center">
                    <p className="text-gray-400 mb-6 max-w-lg mx-auto">{t('wizard_step1_desc')}</p>
                    <div className="max-w-md mx-auto space-y-4 mb-6 text-left">
                        <InputField label={t('wizard_step1_project_name')} value={wizardAppName} onChange={setWizardAppName} placeholder="mi-app-electron" />
                        <InputField label={t('wizard_step1_project_version')} value={wizardAppVersion} onChange={setWizardAppVersion} placeholder="1.0.0" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button disabled={!wizardAppName} onClick={() => handleCreateProjectFromTemplate(minimalViteTemplate)} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <NewFileIcon className="h-6 w-6"/>
                            <span>{t('template_minimal_vite_title')}</span>
                        </button>
                        <button disabled={!wizardAppName} onClick={() => handleCreateProjectFromTemplate(electronPackageJsonTemplate)} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <NewFileIcon className="h-6 w-6"/>
                            <span>{t('template_electron_react_title')}</span>
                        </button>
                    </div>
                    <div className="my-4 text-gray-400">o</div>
                     <button onClick={() => fileInputRef.current?.click()} className="flex items-center mx-auto space-x-2 bg-blue-500/80 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                        <UploadIcon className="h-6 w-6"/>
                        <span>{t('welcomeButton')}</span>
                    </button>
                    {jsonData && (
                        <div className="mt-8 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300">
                            <span className="font-semibold">{t('wizard_step1_status')}</span> {jsonData.name} v{jsonData.version}
                        </div>
                    )}
                </div>
            );
            break;
        case 2:
            stepTitle = t('wizard_step2_title');
            stepContent = (
                <div>
                    <p className="text-gray-400 mb-4">{t('wizard_step2_desc')}</p>
                    {jsonData && (
                        <ScriptsEditor data={jsonData.scripts} setData={data => updateNestedObject('scripts', data)} appName={jsonData.name} suggestions={{}} getTooltipContent={getScriptTooltip} hasBuildSection={!!jsonData.build} onAddBuildSection={handleAddBuildSection} />
                    )}
                </div>
            );
            break;
        case 3:
            stepTitle = t('wizard_step3_title');
            stepContent = (
                 <div>
                    <p className="text-gray-400 mb-4">{t('wizard_step3_desc_edit')}</p>
                    {mainJsFile ? (
                        <div className="max-h-[45vh] overflow-y-auto pr-2">
                           <MainJsEditor content={mainJsFile.content} setContent={setMainJsContent} />
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-gray-900/50 rounded-lg">
                           <p className="text-gray-400 mb-6 max-w-md mx-auto">{t('wizard_step3_desc_generate')}</p>
                             <button onClick={handleGenerateMainJs} className="flex items-center mx-auto space-x-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                                <FileCodeIcon className="h-6 w-6"/>
                                <span>{t('wizard_step3_button')}</span>
                            </button>
                        </div>
                    )}
                </div>
            );
            break;
        case 4:
            stepTitle = t('wizard_step4_title');
            stepContent = (
                <div>
                    <p className="text-gray-400 mb-4">{t('wizard_step4_desc')}</p>
                     {compilarBatFile &&
                        <div className="h-full max-h-[50vh]">
                          <CodePreview 
                            content={compilarBatFile.content}
                            originalContent={compilarBatFile.originalContent}
                            language={compilarBatFile.type}
                            fileName={compilarBatFile.name}
                          />
                        </div>
                      }
                </div>
            );
            break;
        case 5:
            stepTitle = t('wizard_step5_title');
            stepContent = (
                <div className="text-center p-6">
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">{t('wizard_step5_desc')}</p>
                    <div className="my-6 text-left inline-block">
                        <h4 className="font-semibold text-gray-300 mb-2">{t('wizard_step5_files_title')}</h4>
                        <ul className="list-disc list-inside bg-gray-900/50 p-3 rounded-md space-y-1 text-gray-400">
                           {packageJsonFile && <li>package.json</li>}
                           {mainJsFile && <li>main.js</li>}
                           {compilarBatFile && <li>Compilar.BAT</li>}
                           <li>vite.config.js</li>
                        </ul>
                    </div>
                     <button onClick={handleDownloadZip} className="flex items-center mx-auto space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                        <ZipIcon className="h-6 w-6"/>
                        <span>{t('wizard_step5_button')}</span>
                    </button>
                </div>
            );
            break;
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('wizard_title')}</h2>
                        <p className="text-sm text-gray-400 mt-1">{t('wizard_step_of', wizardStep, totalSteps)}: {stepTitle}</p>
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {stepContent}
                </div>
                <div className="p-4 bg-gray-900/50 rounded-b-xl flex justify-between items-center space-x-4 flex-shrink-0">
                    <button onClick={() => setIsWizardOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {t('wizard_cancel')}
                    </button>
                    <div className="flex items-center space-x-4">
                        {wizardStep > 1 && (
                            <button onClick={() => setWizardStep(s => s - 1)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                {t('wizard_previous')}
                            </button>
                        )}
                        {wizardStep < totalSteps ? (
                            <button
                                onClick={() => setWizardStep(s => s + 1)}
                                disabled={(wizardStep === 1 && !jsonData) || (wizardStep === 3 && !mainJsFile)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('wizard_next')}
                            </button>
                        ) : (
                            <button onClick={() => setIsWizardOpen(false)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                {t('wizard_finish')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="h-screen bg-gray-900 text-gray-200 font-sans flex flex-col overflow-hidden">
      <header className="h-24 flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 shadow-lg flex items-center justify-between px-3">
          <div className="flex items-center h-full space-x-1">
              <div className="relative h-full flex items-center" ref={newFileMenuRef}>
                  <ToolbarButton onClick={() => setIsNewFileMenuOpen(prev => !prev)} tooltip={t('ribbon_new_package_json')} label={t('ribbon_btn_new')} active={isNewFileMenuOpen}>
                      <NewFileIcon className="text-cyan-400" />
                  </ToolbarButton>
                  {isNewFileMenuOpen && (
                      <div className="absolute top-full mt-2 w-64 origin-top-left left-0 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-30">
                          <ul className="py-1">
                              <li>
                                  <button onClick={() => { setWizardAppName(''); setWizardAppVersion('1.0.0'); setIsWizardOpen(true); setWizardStep(1); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-start space-x-3 transition-colors">
                                      <SparklesIcon className="h-6 w-6 mt-1 flex-shrink-0" />
                                      <div>
                                          <p className="font-semibold">{t('welcome_wizard_button')}</p>
                                          <p className="text-xs text-gray-400">{t('welcome_wizard_desc')}</p>
                                      </div>
                                  </button>
                              </li>
                          </ul>
                      </div>
                  )}
              </div>
              <ToolbarButton onClick={() => fileInputRef.current?.click()} tooltip={t('ribbon_load')} label={t('ribbon_btn_load')}>
                  <UploadIcon className="text-blue-400" />
              </ToolbarButton>
              <ToolbarButton onClick={handleDownloadZip} disabled={Object.keys(activeFiles).length === 0} tooltip={t('ribbon_download_zip')} label={t('ribbon_btn_zip')}>
                  <ZipIcon className="text-purple-400" />
              </ToolbarButton>
              
              <div className="w-px h-16 bg-gray-700 mx-2 self-center"></div>

              <ToolbarButton onClick={() => { setIsWizardOpen(true); setWizardStep(1); }} tooltip={t('ribbon_assistant')} label={t('ribbon_btn_assistant')}>
                  <SparklesIcon className="text-yellow-300" />
              </ToolbarButton>

              {jsonData && (
                  <>
                      <ToolbarButton onClick={handleGenerateMainJs} tooltip={mainJsFile ? t('ribbon_recreate_main') : t('ribbon_generate_main')} label={mainJsFile ? t('ribbon_btn_recreate_main') : t('ribbon_btn_main')}>
                          <FileCodeIcon className="text-green-400" />
                      </ToolbarButton>
                      <ToolbarButton onClick={handleDownloadViteConfig} tooltip={t('ribbon_download_vite')} label={t('ribbon_btn_vite')}>
                          <DownloadIcon className="text-yellow-400" />
                      </ToolbarButton>
                  </>
              )}
          </div>
          <div className="flex items-center space-x-2 h-full">
              <ToolbarButton onClick={() => setIsAboutModalOpen(true)} tooltip={t('ribbon_about')} label={t('ribbon_btn_about')}>
                  <InformationCircleIcon />
              </ToolbarButton>
          </div>
      </header>
      <input type="file" accept=".json,.js" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      <main className="flex-grow p-2 flex flex-col min-h-0">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">{t('errorTitle')} </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {Object.keys(activeFiles).length === 0 && !error && (
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold mb-4">{t('welcomeTitle')}</h2>
                <p className="text-gray-400 mb-6 max-w-xl mx-auto">{t('welcomeMessage_extended')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button onClick={() => { setWizardAppName(''); setWizardAppVersion('1.0.0'); setIsWizardOpen(true); setWizardStep(1); }} className="row-span-2 flex flex-col items-center justify-center space-y-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg transition-colors duration-200">
                        <SparklesIcon className="h-10 w-10"/>
                        <span className="text-lg">{t('welcome_wizard_button')}</span>
                        <span className="text-sm font-normal text-blue-200">{t('welcome_wizard_desc')}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
                        <UploadIcon className="h-6 w-6"/>
                        <span>{t('welcomeButton')}</span>
                    </button>
                </div>
            </div>
        )}

        {Object.keys(activeFiles).length > 0 && (
          <div ref={mainContentRef} className="flex flex-grow min-h-0 gap-2">
              <div className="h-full" style={{ width: `${editorWidth}%` }}>
                 <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
                    <nav className="flex-shrink-0 flex space-x-1 p-1.5 bg-gray-900/30 rounded-t-lg border-b border-gray-700" aria-label="File Tabs">
                        {Object.values(activeFiles).map(file => {
                            let icon;
                            let tooltipText = '';
                            switch(file.name) {
                                case 'package.json':
                                    icon = <CogIcon className="h-5 w-5"/>;
                                    tooltipText = t('tooltip_package_json_tab');
                                    break;
                                case 'main.js':
                                    icon = <CodeBracketIcon className="h-5 w-5"/>;
                                    tooltipText = t('tooltip_main_js_tab');
                                    break;
                                case 'Compilar.BAT':
                                    icon = <TerminalIcon className="h-5 w-5"/>;
                                    tooltipText = t('tooltip_bat_tab');
                                    break;
                                default:
                                    return null;
                            }
                            return (
                              <Tooltip key={file.name} text={tooltipText}>
                                <button
                                  onClick={() => setCurrentView(file.name as ViewType)}
                                  className={`p-2 rounded-md ${
                                    currentView === file.name
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'text-gray-400 hover:bg-gray-700'
                                  } transition-colors focus:outline-none`}
                                >
                                  {icon}
                                </button>
                              </Tooltip>
                            )
                        })}
                    </nav>
                   
                    <div className="flex-grow p-3 overflow-y-auto">
                        {currentView === 'package.json' && packageJsonFile && jsonData && (
                            <>
                            {Object.keys(jsonData).length > 0 && <Tabs tabs={jsonTabs} activeTab={activeJsonTab} setActiveTab={setActiveJsonTab} />}
                            </>
                        )}
                        {currentView === 'main.js' && mainJsFile && (
                            <MainJsEditor content={mainJsFile.content} setContent={setMainJsContent} />
                        )}
                        {currentView === 'Compilar.BAT' && compilarBatFile && (
                           <BatEditor content={compilarBatFile.content} setContent={setCompilarBatContent} />
                        )}
                    </div>
                 </div>
              </div>
              
              <div 
                className="w-2.5 flex-shrink-0 cursor-col-resize flex items-center justify-center group relative"
                onMouseDown={handleMouseDownResizer}
              >
                  <div className="w-px h-full bg-gray-700 group-hover:bg-blue-500 transition-colors"></div>
                  <div className="absolute" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed' }}>
                    <span className="text-gray-600 text-xs tracking-widest uppercase font-semibold">EDITRON - DEVELOPED BY ULIK</span>
                  </div>
              </div>
  
              {currentFile && 
                <div className="h-full" style={{ width: `calc(100% - ${editorWidth}% - 10px)` }}>
                  <CodePreview 
                    content={currentFile.content}
                    originalContent={currentFile.originalContent}
                    language={currentFile.type}
                    fileName={currentFile.name}
                  />
                </div>
              }
            </div>
        )}
      </main>
      
      {isAboutModalOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)` }}
            >
                <div 
                    className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('about_modal_title')}</h2>
                        <p className="text-sm text-gray-400 mt-1">v1.5.2</p>
                    </div>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <h3 className="font-semibold text-gray-300">{t('developed_by')}</h3>
                        <p className="text-blue-400">ulik</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-300">{t('libraries_used')}</h3>
                        <ul className="list-disc list-inside text-gray-400 text-sm mt-1 space-y-1">
                            <li>React</li>
                            <li>Tailwind CSS</li>
                            <li>JSZip</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-3">{t('changelog')}</h3>
                        <ul className="space-y-4">
                            {changelogData.map(version => (
                                <li key={version.version} className="text-sm">
                                    <p className="font-semibold text-gray-200">{version.version} - <span className="text-gray-300">{version.title}</span></p>
                                    <ul className="mt-2 space-y-1.5 pl-2">
                                        {version.changes.map((change, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <div className="flex-shrink-0 pt-0.5"><ChangeTag tag={change.tag} /></div>
                                                <span className="text-gray-400">{change.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-b-xl flex justify-end items-center space-x-4 flex-shrink-0">
                    <button
                        onClick={() => setIsAboutModalOpen(false)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
      )}
      {isWizardOpen && renderWizard()}
    </div>
  );
}


export interface InputFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    tooltipText?: string;
    type?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, tooltipText, type = 'text' }) => (
    <div>
        <div className="flex items-center space-x-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {tooltipText && <Tooltip text={tooltipText} />}
        </div>
        <input 
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || `${t('enterName')} ${label.toLowerCase()}`}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

export interface BooleanFieldProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    tooltipText?: string;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({ label, value, onChange, tooltipText }) => (
    <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-1.5">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {tooltipText && <Tooltip text={tooltipText} />}
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


export default App;