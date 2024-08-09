const GitIgnoreHandler = (function() {
    function initGitIgnoreHandler() {
        const DEFAULT_IGNORE_PATTERNS = new Set([
            // Version control
            '.git',

            // Dependencies
            'node_modules',

            // Build outputs
            'dist', 'build',

            // Test coverage and reports
            'coverage', 'vitest-coverage', 'cypress-coverage', '.nyc_output', 'reports',
            'cypress/videos', 'cypress/screenshots',

            // Logs and temporary files
            '*.log', '.DS_Store', '*.swp', '*.local',

            // Environment and configuration files
            '*.env', 'cypress.env.json',

            // IDE and editor files
            '.vscode', '.idea', '*.suo', '*.ntvs*', '*.njsproj', '*.sln', '*.sw?',

            // Additional patterns
            '.jwt', '__pycache__'
        ]);

        const readGitignoreFile = async (directoryHandle) => {
            try {
                const fileHandle = await directoryHandle.getFileHandle('.gitignore');
                const file = await fileHandle.getFile();
                const content = await file.text();
                return content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
            } catch (error) {
                return [];
            }
        };

        const shouldIgnore = (filePath, ignorePatterns) => {
            if (DEFAULT_IGNORE_PATTERNS.has(filePath)) {
                return true;
            }

            let shouldIgnore = false;
            for (const pattern of ignorePatterns) {
                if (pattern.startsWith('!')) {
                    if (matchesPattern(filePath, pattern.slice(1))) {
                        shouldIgnore = false;
                        break;
                    }
                } else if (matchesPattern(filePath, pattern)) {
                    shouldIgnore = true;
                    break;
                }
            }

            return shouldIgnore;
        };

        const matchesPattern = (filePath, pattern) => {
            pattern = pattern.replace(/^\//, '');
            filePath = filePath.replace(/^\//, '');

            const escapeRegExp = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            if (filePath === pattern) return true;

            if (pattern.endsWith('/') && (filePath.startsWith(pattern) || filePath + '/' === pattern)) {
                return true;
            }

            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$');
                return regex.test(filePath);
            }

            const patternParts = pattern.split('/');
            const pathParts = filePath.split('/');

            for (let i = 0; i <= pathParts.length - patternParts.length; i++) {
                if (patternParts.every((part, index) => part === pathParts[i + index])) {
                    return true;
                }
            }

            return false;
        };

        const getIgnorePatternsForPath = async (rootHandle, currentPath) => {
            const pathParts = currentPath.split('/');
            let currentHandle = rootHandle;
            let allPatterns = [...DEFAULT_IGNORE_PATTERNS];

            for (let i = 0; i < pathParts.length; i++) {
                if (pathParts[i] === '') continue;
                
                const patterns = await readGitignoreFile(currentHandle);
                allPatterns = [...allPatterns, ...patterns];

                if (i < pathParts.length - 1) {
                    try {
                        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
                    } catch (error) {
                        break;
                    }
                }
            }

            return allPatterns;
        };

        const sortEntries = (entries) => {
            const specialFolders = ['.vscode'];
            
            return entries.sort((a, b) => {
                // Sort special folders to the top
                if (specialFolders.includes(a.name) && !specialFolders.includes(b.name)) return -1;
                if (!specialFolders.includes(a.name) && specialFolders.includes(b.name)) return 1;

                // Sort folders before files
                if (a.kind === 'directory' && b.kind === 'file') return -1;
                if (a.kind === 'file' && b.kind === 'directory') return 1;

                // Sort hidden items to the bottom
                const aHidden = a.name.startsWith('.');
                const bHidden = b.name.startsWith('.');
                if (!aHidden && bHidden) return -1;
                if (aHidden && !bHidden) return 1;

                // Sort alphabetically (case-insensitive)
                return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
            });
        };        

        const getFilesAndFolders = async (rootHandle, dirHandle, currentPath = '') => {
            const entries = [];
            const ignorePatterns = await getIgnorePatternsForPath(rootHandle, currentPath);

            try {
                for await (const entry of dirHandle.values()) {
                    const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

                    if (shouldIgnore(newPath, ignorePatterns)) continue;

                    if (entry.kind === "file") {
                        entries.push({ name: entry.name, path: newPath, kind: "file", handle: entry });
                    } else if (entry.kind === "directory") {
                        const subEntries = await getFilesAndFolders(rootHandle, entry, newPath);
                        if (subEntries.length > 0) {
                            entries.push({ name: entry.name, path: newPath, kind: "directory", children: sortEntries(subEntries), handle: entry });
                        }
                    }
                }
            } catch (error) {
                // Handle error silently or add minimal error logging if needed
            }

            return sortEntries(entries);
        };

        return {
            DEFAULT_IGNORE_PATTERNS,
            readGitignoreFile,
            shouldIgnore,
            matchesPattern,
            getIgnorePatternsForPath,
            getFilesAndFolders
        };
    }

    return { init: initGitIgnoreHandler };
})();
