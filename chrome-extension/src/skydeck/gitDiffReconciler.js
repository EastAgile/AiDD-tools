GitDiffReconciler = (function () {
    function reconcileGitDiff(currentFile, fileContent, mismatches) {
        const lines = fileContent.split('\n');

        // Create a patch object similar to what Diff.parsePatch would return
        const patch = {
            oldFileName: 'a/' + (currentFile.oldPath || currentFile.newPath),
            newFileName: 'b/' + (currentFile.newPath || currentFile.oldPath),
            hunks: currentFile.hunks
        };

        let reconciliationFailed = false;
        let failureDetails = [];

        let lineOffset = 0;

        patch.hunks.forEach((hunk, index) => {
            const mismatch = mismatches.find(m => m.hunkStart === hunk.oldStart);
            if (mismatch) {
                // Find the correct starting line
                let newStart = findCorrectStartLine(lines, mismatch.expected.split('\n'));
                if (newStart !== -1) {
                    // Adjust the hunk
                    hunk.oldStart = newStart;
                    hunk.newStart = newStart + lineOffset;

                    // Recalculate lineOffset
                    const addedLines = hunk.lines.filter(line => line.startsWith('+')).length;
                    const removedLines = hunk.lines.filter(line => line.startsWith('-')).length;
                    lineOffset += (addedLines - removedLines);
                } else {
                    reconciliationFailed = true;
                    const expectedLines = mismatch.expected.split('\n');
                    const actualLines = lines.slice(hunk.oldStart - 1, hunk.oldStart - 1 + expectedLines.length);
                    failureDetails.push({
                        hunkIndex: index,
                        expectedContent: expectedLines.join('\n'),
                        actualContent: actualLines.join('\n'),
                        startLine: hunk.oldStart,
                        message: "The expected hunk is not found in the file"
                    });
                }
            } else {
                // If there's no mismatch, we still need to update the newStart
                hunk.newStart = hunk.oldStart + lineOffset;
                const addedLines = hunk.lines.filter(line => line.startsWith('+')).length;
                const removedLines = hunk.lines.filter(line => line.startsWith('-')).length;
                lineOffset += (addedLines - removedLines);
            }
        });

        if (reconciliationFailed) {
            const fileName = (currentFile.newPath || currentFile.oldPath).split('/').pop();
            throw {
                message: `Failed to fix Git Diff for file ${fileName}`,
                details: failureDetails
            };
        }

        return formatSinglePatch(patch);
    }

    function findCorrectStartLine(fileLines, expectedLines) {
        for (let i = 0; i <= fileLines.length - expectedLines.length; i++) {
            if (arraysEqual(fileLines.slice(i, i + expectedLines.length), expectedLines)) {
                return i + 1; // +1 because diff lines are 1-indexed
            }
        }
        return -1; // If no match found
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].trimStart().trimEnd() !== b[i].trimStart().trimEnd()) return false;
        }
        return true;
    }

    function formatSinglePatch(patch) {
        let result = '';
        const oldPath = patch.oldFileName.replace(/^[ab]\//, '');
        const newPath = patch.newFileName.replace(/^[ab]\//, '');

        if (patch.oldFileName.includes('/dev/null')) {
            result += `diff --git a/${newPath} b/${newPath}\n`;
            result += `new file mode 100644\n`;
            result += `index 0000000..${patch.newFileMode || '000000'}\n`;
            result += `--- /dev/null\n`;
            result += `+++ b/${newPath}\n`;
        } else if (patch.newFileName.includes('/dev/null')) {
            result += `diff --git a/${oldPath} b/${oldPath}\n`;
            result += `deleted file mode ${patch.oldFileMode || '100644'}\n`;
            result += `index ${patch.oldFileMode || '000000'}..0000000\n`;
            result += `--- a/${oldPath}\n`;
            result += `+++ /dev/null\n`;
        } else {
            result += `diff --git a/${oldPath} b/${newPath}\n`;
            result += `index ${patch.oldFileMode || '000000'}..${patch.newFileMode || '000000'} 100644\n`;
            result += `--- a/${oldPath}\n`;
            result += `+++ b/${newPath}\n`;
        }

        patch.hunks.forEach(hunk => {
            const oldLines = hunk.lines.filter(line => line[0] === '-' || (line[0] !== '+' && line[0] !== '-')).length;
            const newLines = hunk.lines.filter(line => line[0] === '+' || (line[0] !== '+' && line[0] !== '-')).length;

            result += `@@ -${hunk.oldStart},${oldLines} +${hunk.newStart},${newLines} @@\n`;
            result += hunk.lines.join('\n') + '\n';
        });

        return result;
    }

    return { reconcileGitDiff: reconcileGitDiff };
})();
