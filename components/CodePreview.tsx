
import React from 'react';
import { t } from '../i18n';
import { CopyIcon, ClipboardCheckIcon, CodeBracketIcon } from './Icons';

interface CodePreviewProps {
  content: string | null;
  originalContent: string | null;
  language: 'json' | 'javascript' | 'batch';
  fileName: string;
}

enum TokenType {
  Punctuation,
  Key,
  String,
  Number,
  Boolean,
  Null,
  Whitespace,
  Keyword,
  Comment,
  Default,
}

interface Token {
  type: TokenType;
  value: string;
}

const tokenizeJson = (jsonString: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < jsonString.length) {
    const char = jsonString[i];
    if (/[{}\[\]:,]/.test(char)) {
      tokens.push({ type: TokenType.Punctuation, value: char });
      i++; continue;
    }
    if (/\s/.test(char)) {
      let ws = '';
      while (i < jsonString.length && /\s/.test(jsonString[i])) { ws += jsonString[i]; i++; }
      tokens.push({ type: TokenType.Whitespace, value: ws }); continue;
    }
    if (char === '"') {
      let value = '';
      i++;
      while (i < jsonString.length && jsonString[i] !== '"') {
        if (jsonString[i] === '\\') { value += jsonString[i] + jsonString[i + 1]; i += 2; }
        else { value += jsonString[i]; i++; }
      }
      i++;
      let tempIndex = i;
      while(tempIndex < jsonString.length && /\s/.test(jsonString[tempIndex])) { tempIndex++; }
      const isKey = tempIndex < jsonString.length && jsonString[tempIndex] === ':';
      tokens.push({ type: isKey ? TokenType.Key : TokenType.String, value: `"${value}"` }); continue;
    }
    if (/-?\d/.test(char)) {
      let value = '';
      while (i < jsonString.length && /-?\d\.\d*|[\d]/.test(jsonString.substring(i))) { value += jsonString[i]; i++; }
      tokens.push({ type: TokenType.Number, value }); continue;
    }
    if (jsonString.substring(i, i + 4) === 'true' || jsonString.substring(i, i + 5) === 'false') {
      const value = jsonString.substring(i, i + 4) === 'true' ? 'true' : 'false';
      tokens.push({ type: TokenType.Boolean, value });
      i += value.length; continue;
    }
    if (jsonString.substring(i, i + 4) === 'null') {
      tokens.push({ type: TokenType.Null, value: 'null' });
      i += 4; continue;
    }
    i++;
  }
  return tokens;
}

const tokenizeJs = (jsString: string): Token[] => {
    const tokens: Token[] = [];
    const keywords = new Set(['import', 'from', 'export', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue', 'new', 'in', 'of', 'typeof', 'instanceof', 'void', 'delete', 'true', 'false', 'null', 'undefined']);
    let i = 0;
    while (i < jsString.length) {
        let char = jsString[i];
        
        if (char === '/' && jsString[i + 1] === '*') { // Handle block comments
            const startIndex = i;
            i += 2;
            while (i + 1 < jsString.length && !(jsString[i] === '*' && jsString[i + 1] === '/')) {
                i++;
            }
            if (i + 1 < jsString.length) {
                i += 2; // Move past the closing '*/'
            } else {
                i = jsString.length; // Unterminated comment
            }
            const comment = jsString.substring(startIndex, i);
            tokens.push({ type: TokenType.Comment, value: comment });
            continue;
        }

        if (char === '/' && jsString[i + 1] === '/') { // Handle line comments
            let comment = '';
            while (i < jsString.length && jsString[i] !== '\n') { comment += jsString[i]; i++; }
            tokens.push({ type: TokenType.Comment, value: comment }); continue;
        }
        
        if (char === "'" || char === '"' || char === '`') {
            let str = char;
            i++;
            while (i < jsString.length && jsString[i] !== char) {
                if (jsString[i] === '\\') { str += jsString[i] + jsString[i + 1]; i += 2; }
                else { str += jsString[i]; i++; }
            }
            str += char; i++;
            tokens.push({ type: TokenType.String, value: str }); continue;
        }
        if (/[{}\[\](),;=.:]/.test(char)) {
            tokens.push({ type: TokenType.Punctuation, value: char }); i++; continue;
        }
        if (/\s/.test(char)) {
            let ws = '';
            while (i < jsString.length && /\s/.test(jsString[i])) { ws += jsString[i]; i++; }
            tokens.push({ type: TokenType.Whitespace, value: ws }); continue;
        }
        if (/\d/.test(char)) {
            let num = '';
            while (i < jsString.length && /\d/.test(jsString[i])) { num += jsString[i]; i++; }
            tokens.push({ type: TokenType.Number, value: num }); continue;
        }
        if (/[a-zA-Z_$]/.test(char)) {
            let word = '';
            while (i < jsString.length && /[a-zA-Z0-9_$]/.test(jsString[i])) { word += jsString[i]; i++; }
            if (keywords.has(word)) {
                tokens.push({ type: word === 'true' || word === 'false' ? TokenType.Boolean : TokenType.Keyword, value: word });
            } else {
                 let tempIndex = i;
                 while(tempIndex < jsString.length && /\s/.test(jsString[tempIndex])) { tempIndex++; }
                 if (tempIndex < jsString.length && jsString[tempIndex] === ':') {
                     tokens.push({ type: TokenType.Key, value: word });
                 } else {
                     tokens.push({ type: TokenType.Default, value: word });
                 }
            }
            continue;
        }
        tokens.push({ type: TokenType.Default, value: char });
        i++;
    }
    return tokens;
};


const tokensToHtml = (tokens: Token[]): string => {
  const classMap: Record<TokenType, string> = {
    [TokenType.Punctuation]: 'text-gray-400',
    [TokenType.Key]: 'text-blue-400',
    [TokenType.String]: 'text-green-400',
    [TokenType.Number]: 'text-yellow-400',
    [TokenType.Boolean]: 'text-purple-400',
    [TokenType.Null]: 'text-gray-500',
    [TokenType.Whitespace]: '',
    [TokenType.Keyword]: 'text-purple-400 font-semibold',
    [TokenType.Comment]: 'text-gray-500 italic',
    [TokenType.Default]: 'text-gray-200',
  };

  return tokens.map(token => {
    const className = classMap[token.type];
    const escapedValue = token.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return className ? `<span class="${className}">${escapedValue}</span>` : escapedValue;
  }).join('');
};

const CodePreview: React.FC<CodePreviewProps> = ({ content, originalContent, language, fileName }) => {
  const [view, setView] = React.useState<'current' | 'original'>('current');
  const [isCopied, setIsCopied] = React.useState(false);

  const getHighlightedCode = (code: string | null) => {
    if (!code) return '';
    if (language === 'json') {
        return tokensToHtml(tokenizeJson(code));
    }
    if (language === 'javascript') {
        return tokensToHtml(tokenizeJs(code));
    }
    // Fallback for batch file or others
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const handleCopy = () => {
    if (!content || isCopied) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };
  
  const contentToShow = view === 'current' ? content : originalContent;

  const tabButtonClasses = (isActive: boolean) => 
    `px-3 py-1 text-sm font-medium rounded-md focus:outline-none transition-colors ${
      isActive ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'
    }`;
    
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <div className="text-blue-400 flex-shrink-0">
                <CodeBracketIcon className="h-6 w-6" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">{t('rawCode')}</h2>
                <p className="text-xs text-gray-400 font-mono">{fileName}</p>
            </div>
        </div>
        
        <div className="flex items-center space-x-3">
             <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors relative" aria-label={t('copyCode')}>
                {isCopied ? <ClipboardCheckIcon className="h-5 w-5 text-green-400" /> : <CopyIcon className="h-5 w-5" />}
                {isCopied && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs rounded py-1 px-2 pointer-events-none">
                        {t('copied')}
                    </div>
                )}
            </button>
            <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg">
               <button onClick={() => setView('current')} className={tabButtonClasses(view === 'current')}>
                 {t('current')}
               </button>
               <button 
                 onClick={() => setView('original')} 
                 disabled={!originalContent} 
                 className={`${tabButtonClasses(view === 'original')} disabled:opacity-50 disabled:cursor-not-allowed`}>
                 {t('original')}
               </button>
            </div>
        </div>
      </div>
      <pre className="p-2 text-sm overflow-auto flex-grow">
        <code dangerouslySetInnerHTML={{ __html: getHighlightedCode(contentToShow) }} />
      </pre>
    </div>
  );
};

export default CodePreview;