                let newStart = findCorrectStartLine(lines, mismatch.expected.split('\n'));
        for (let i = 0; i <= fileLines.length - expectedLines.length; i++) {
            if (arraysEqual(fileLines.slice(i, i + expectedLines.length), expectedLines)) {
            if (a[i].trimStart().trimEnd() !== b[i].trimStart().trimEnd()) return false;