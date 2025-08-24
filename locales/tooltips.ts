
export const dependencyTooltips: Record<string, string> = {
  // Frameworks & Libraries
  'react': 'Una biblioteca de JavaScript para construir interfaces de usuario, desarrollada por Facebook.',
  'react-dom': 'Proporciona métodos específicos del DOM que pueden ser usados en el nivel superior de tu app.',
  'vue': 'Un framework progresivo de JavaScript para construir interfaces de usuario.',
  'angular': 'Una plataforma de desarrollo para construir aplicaciones web móviles y de escritorio.',
  'svelte': 'Un enfoque radicalmente nuevo para construir interfaces de usuario. Svelte compila tu código a JavaScript pequeño y sin frameworks.',
  'electron': 'Un framework para crear aplicaciones de escritorio nativas con tecnologías web como JavaScript, HTML y CSS.',
  'express': 'Un framework de aplicación web para Node.js, minimalista y flexible.',
  'next': 'Un framework de React para producción que te da el mejor camino para construir aplicaciones web rápidas y con renderizado del servidor.',
  'zustand': 'Una solución de gestión de estado pequeña, rápida y escalable para React, basada en hooks.',
  'redux': 'Un contenedor de estado predecible para aplicaciones JavaScript. Te ayuda a escribir aplicaciones que se comportan de manera consistente.',
  
  // Utilities
  'lodash': 'Una biblioteca de utilidades de JavaScript moderna que ofrece modularidad, rendimiento y extras.',
  'axios': 'Un cliente HTTP basado en promesas para el navegador y node.js.',
  'clsx': 'Una pequeña utilidad para construir cadenas de `className` condicionalmente.',
  'tailwind-merge': 'Una función para fusionar clases de Tailwind CSS en JS sin conflictos de estilo.',
  'moment': 'Una biblioteca de fechas de JavaScript para analizar, validar, manipular y formatear fechas.',
  'date-fns': 'Una biblioteca de utilidades de fecha moderna para JavaScript.',

  // Build Tools & Bundlers
  'vite': 'Una herramienta de compilación de frontend que mejora significativamente la experiencia de desarrollo. Ofrece un servidor de desarrollo increíblemente rápido y agrupa tu código para producción.',
  'webpack': 'Un empaquetador de módulos estático para aplicaciones JavaScript modernas.',
  'rollup': 'Un empaquetador de módulos para JavaScript que compila pequeños fragmentos de código en algo más grande y complejo.',
  'esbuild': 'Un empaquetador de JavaScript y minificador extremadamente rápido escrito en Go.',
  
  // Dev Dependencies
  'typescript': 'Un superconjunto de JavaScript que añade tipos estáticos opcionales.',
  'eslint': 'Una herramienta de linting conectable para JavaScript y JSX. Identifica y reporta patrones problemáticos.',
  'prettier': 'Un formateador de código opinado. Asegura un estilo de código consistente en todo tu proyecto.',
  'tailwindcss': 'Un framework de CSS utility-first para construir rápidamente diseños personalizados.',
  'jest': 'Un framework de pruebas de JavaScript con un enfoque en la simplicidad.',
  'testing-library': 'Utilidades simples y completas para probar componentes de React que fomentan buenas prácticas de prueba.',
  'electron-builder': 'Una solución completa para empaquetar y construir una aplicación Electron lista para distribución.',
  'electron-packager': 'Empaqueta el código fuente de una aplicación Electron en formatos distribuibles como .exe o .app.',
};

export const scriptTooltips: Record<string, string> = {
  'start': 'Comúnmente usado para iniciar la aplicación en un entorno de desarrollo con recarga en caliente.',
  'dev': 'Similar a "start", inicia el servidor de desarrollo. A veces usado como alias o para configuraciones ligeramente diferentes.',
  'build': 'Compila y empaqueta la aplicación para producción. Genera los archivos estáticos optimizados en una carpeta (ej. `dist` o `build`).',
  'test': 'Ejecuta las pruebas automatizadas del proyecto, usualmente con herramientas como Jest o Vitest.',
  'lint': 'Analiza el código fuente en busca de errores de programación, bugs, errores de estilo y constructos sospechosos.',
  'preview': 'Comando usado a menudo por herramientas como Vite para servir localmente la carpeta de compilación de producción.',
  'format': 'Formatea automáticamente todo el código fuente del proyecto usando una herramienta como Prettier.',
  'package': 'Usado para empaquetar la aplicación en un formato distribuible, común en proyectos Electron.',
  'package:win': 'Un script específico para empaquetar la aplicación para el sistema operativo Windows.',
  'electron:dev': 'Inicia la aplicación Electron en modo de desarrollo, permitiendo depuración y recarga en caliente del proceso principal y de renderizado.',
};
