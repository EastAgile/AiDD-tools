import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import ignore from "ignore";
import { TemplateEditorProvider } from "./TemplateEditorProvider";

interface Template {
  name: string;
  template: string;
  includeHierarchy: boolean;
  fileStartMarker: string;
  fileEndMarker: string;
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("prompt-generator.generate", () =>
    generatePrompt(context)
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(TemplateEditorProvider.register(context));
  context.subscriptions.push(
    vscode.commands.registerCommand("prompt-generator.settings", openTemplateEditor)
  );
  // Initialize selected files state if it doesn't exist
  if (!context.globalState.get("selectedFiles")) {
    context.globalState.update("selectedFiles", []);
  }
}

async function generatePrompt(context: vscode.ExtensionContext): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Please open a project folder to use this extension."
    );
    return;
  }

  const selectedFiles = await selectFiles(workspaceFolder, context);
  if (selectedFiles.length === 0) {
    vscode.window.showInformationMessage(
      "No files were selected. Please choose at least one file to generate the prompt."
    );
    return;
  }

  const selectedTemplate = await selectTemplate();
  if (!selectedTemplate) {
    vscode.window.showInformationMessage(
      "No template was selected. Please choose a template to generate the prompt."
    );
    return;
  }

  const fileHierarchy =
    selectedTemplate.includeHierarchy !== false
      ? generateFileHierarchy(workspaceFolder, selectedFiles)
      : "";
  const wrappedContents = await getWrappedContents(
    workspaceFolder,
    selectedFiles,
    selectedTemplate
  );
  const combinedWrappedContent = wrappedContents.join("\n");
  const finalContent = selectedTemplate.template.replace(
    "{content}",
    `${fileHierarchy}${fileHierarchy ? "\n\n" : ""}${combinedWrappedContent}`
  );
  const document = await vscode.workspace.openTextDocument({
    content: finalContent,
    language: "plaintext",
  });

  vscode.window.showTextDocument(document);
}

async function selectFiles(
  workspaceFolder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext
): Promise<vscode.QuickPickItem[]> {
  const quickPick = vscode.window.createQuickPick();
  quickPick.canSelectMany = true;
  quickPick.title = "Select files to concatenate";

  const files = await getAllFiles(workspaceFolder.uri.fsPath);
  const selectedFiles = context.globalState.get<string[]>("selectedFiles") || [];

  // Sort files to put previously selected files on top
  const sortedFiles = files.sort((a, b) => {
    const aSelected = selectedFiles.includes(a);
    const bSelected = selectedFiles.includes(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const items = sortedFiles.map((file) => ({
    label: vscode.workspace.asRelativePath(file),
    description: path.basename(file),
    picked: selectedFiles.includes(file),
  }));

  quickPick.items = items;
  quickPick.selectedItems = items.filter((item) => item.picked);

  quickPick.show();
  const selection = await new Promise<readonly vscode.QuickPickItem[]>((resolve) => {
    quickPick.onDidAccept(() => resolve(quickPick.selectedItems));
  });
  quickPick.dispose();

  // Update selected files in global state
  const newSelectedFiles = selection.map((item) =>
    path.join(workspaceFolder.uri.fsPath, item.label)
  );
  await context.globalState.update("selectedFiles", newSelectedFiles);

  return [...selection];
}

async function selectTemplate(): Promise<Template | undefined> {
  const config = vscode.workspace.getConfiguration("promptGenerator");
  const settings = config.get("settings") as {
    templates: Template[];
  };
  const templates: Template[] = settings.templates || [];

  const templateQuickPick = vscode.window.createQuickPick();
  templateQuickPick.items = templates.map((t) => ({ label: t.name }));
  templateQuickPick.title = "Select a template";

  templateQuickPick.show();
  const selectedTemplate = await new Promise<vscode.QuickPickItem | undefined>((resolve) => {
    templateQuickPick.onDidAccept(() => resolve(templateQuickPick.selectedItems[0]));
  });
  templateQuickPick.dispose();

  return templates.find((t) => t.name === selectedTemplate?.label);
}

async function getWrappedContents(
  workspaceFolder: vscode.WorkspaceFolder,
  selectedFiles: vscode.QuickPickItem[],
  template: Template
): Promise<string[]> {
  const defaultStartMarker = ">>>>>>>>>>>>> Starting contents of file {filePath} >>>>>>>>>>>>>>>";
  const defaultEndMarker = "<<<<<<<<<<<<<< End of contents of file {filePath} <<<<<<<<<<<<<<";

  return Promise.all(
    selectedFiles.map(async (item) => {
      const filePath = path.join(workspaceFolder.uri.fsPath, item.label);
      const content = await readFile(filePath);
      const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
      const startMarker = (template.fileStartMarker || defaultStartMarker).replace(
        "{filePath}",
        relativePath
      );
      const endMarker = (template.fileEndMarker || defaultEndMarker).replace(
        "{filePath}",
        relativePath
      );
      return `${startMarker}\n${content}\n${endMarker}\n`;
    })
  );
}

async function getAllFiles(workspaceRoot: string): Promise<string[]> {
  const ignorePatterns = await getIgnoredPatterns(workspaceRoot);
  const ig = ignore().add(ignorePatterns);

  const files = await vscode.workspace.findFiles("**/*", null);

  return files
    .map((file) => file.fsPath)
    .filter((filePath) => {
      const relativePath = path.relative(workspaceRoot, filePath);
      return !ig.ignores(relativePath);
    });
}

async function getIgnoredPatterns(workspaceRoot: string): Promise<string[]> {
  const gitignorePath = path.join(workspaceRoot, ".gitignore");
  let gitignoreContent = "";
  try {
    gitignoreContent = await fs.promises.readFile(gitignorePath, "utf-8");
  } catch (error) {
    // .gitignore doesn't exist, which is fine
  }

  const config = vscode.workspace.getConfiguration("promptGenerator");
  const settings = config.get("settings") as {
    additionalIgnoreRules: string[];
  };
  const additionalRules: string[] = settings.additionalIgnoreRules || [];

  return gitignoreContent
    .split("\n")
    .concat(additionalRules)
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));
}

async function readFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf-8");
}

function openTemplateEditor(): void {
  const workspaceEdit = new vscode.WorkspaceEdit();
  const filePath = vscode.Uri.parse("untitled:promptGenerator.templates.json");
  workspaceEdit.createFile(filePath, { ignoreIfExists: true });
  vscode.workspace.applyEdit(workspaceEdit).then(() => {
    vscode.commands.executeCommand("vscode.openWith", filePath, "promptGenerator.templateEditor");
  });
}

function generateFileHierarchy(
  workspaceFolder: vscode.WorkspaceFolder,
  selectedFiles: vscode.QuickPickItem[]
): string {
  const rootName = path.basename(workspaceFolder.uri.fsPath);
  const fileTree: { [key: string]: any } = { [rootName]: {} };

  selectedFiles.forEach((file) => {
    const parts = file.label.split(path.sep);
    let current = fileTree[rootName];
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part];
    });
  });

  function printTree(node: any, prefix: string = ""): string {
    let result = "";
    const entries = Object.entries(node);
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      result += `${prefix}${isLast ? "└── " : "├── "}${key}\n`;
      if (value !== null) {
        result += printTree(value, `${prefix}${isLast ? "    " : "│   "}`);
      }
    });
    return result;
  }

  return `File Hierarchy:\n${printTree(fileTree)}`;
}

export function deactivate(): void {}
