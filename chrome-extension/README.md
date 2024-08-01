# AiDD Chrome Extension

## Overview

AiDD Chrome Extension is a comprehensive toolset designed to enhance AI-driven development (AiDD) workflows. It integrates seamlessly with Pivotal Tracker and Skydeck AI, bridging the gap between project management and AI-assisted development to boost productivity for development teams.

## Tools

The AiDD Chrome Extension includes the following tools:

1. **AiDD Prompt Generator**: Generates AI-driven development prompts based on Pivotal Tracker stories and selected project files.
2. **Auto Apply Code Changes**: Allows developers to directly apply code changes suggested by AI within Skydeck AI.
3. **File Selection Tool**: Enables quick file selection from any webpage using a customizable keyboard shortcut.

## Features

- **Pivotal Tracker Integration**: Seamlessly integrates with Pivotal Tracker by adding an "AiDD Prompt" button to the story interface, enabling quick access to AI-driven development workflows.
- **Intelligent File Selection**: Allows users to choose relevant files and folders from their local project, respecting `.gitignore` rules.
- **Multiple Prompt Templates**: Supports creating and managing multiple prompt templates, with the ability to switch between them.
- **Customizable Prompt Templates**: Users can modify prompt templates to suit their specific needs and development practices.
- **Skydeck AI Integration**: Automatically pastes generated prompts into Skydeck AI and optionally submits them, saving time and reducing context-switching.
- **Preview Functionality**: Users can preview file contents before including them in the prompt.
- **Responsive UI**: Features a split-view interface with resizable panels for easy file selection and content preview.
- **File Selection Memory**: Remembers the last selected files for convenience in subsequent prompt generations.
- **File Search**: Quickly find and select specific files within your project structure.
- **Apply Changes**: Allows code changes to be applied directly within Skydeck AI.
- **Auto-fix Git Diff**: Automatically attempts to fix incorrect Git diffs generated by AI.
- **Global File Selection Shortcut**: Trigger the File Selection tool from any webpage using a customizable keyboard shortcut.

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

### AiDD Prompt Generator

1. Navigate to your Pivotal Tracker project.
2. Select a story you want to work on.
3. Click the "AiDD Prompt" button that appears in the Pivotal Tracker interface.
4. In the file selection modal, choose the relevant files for your prompt.
5. Review the generated prompt and either copy it to your clipboard or launch Skydeck AI directly.
6. If launching Skydeck AI, the prompt will be automatically pasted and optionally submitted based on your settings.

### Auto Apply Code Changes

1. When working in Skydeck AI, you'll see an "Apply Changes" button for code suggestions.
2. Click this button to automatically apply the suggested changes to your local files.
3. Review the changes before they are applied, and use the auto-fix feature if there are any discrepancies in the Git diff.

### File Selection Tool Shortcut

1. Use the configured keyboard shortcut (default is Ctrl+Shift+P or Command+Shift+P on Mac) from any webpage to open the File Selection tool.
2. Select the relevant files for your prompt.
3. Choose the appropriate template for your prompt from the available options.
4. Generate the prompt based on the selected files and chosen template.

## Configuration

To customize the extension:

1. Click on the extension icon in Chrome and select "Options".
2. Create, edit, or delete prompt templates.
3. Toggle various features on or off:
   - Enable File Selection
   - Auto-submit prompt when launching Skydeck AI
   - Allow code changes to be applied directly within Skydeck AI
   - Auto-fix Git Diff generated by AI when it is incorrect
4. Customize the keyboard shortcut for the File Selection tool:
   - Go to `chrome://extensions/shortcuts`
   - Find "AiDD Toolset" and set your preferred shortcut for "Open File Selection Modal"
5. Your changes are automatically saved.

## Development

This extension is built using vanilla JavaScript and utilizes Chrome's Extension APIs. The main components are:

- `manifest.json`: Extension configuration
- `content.js`: Main entry point for content scripts
- `pivotalTracker.js`: Handles Pivotal Tracker integration
- `skydeck/`: Directory containing Skydeck AI related scripts
- `gitignoreHandler.js`: Processes `.gitignore` rules
- `shared.js`: Contains shared utilities and configurations
- `options.js` and `options.html`: Manages extension options
- `file-selection/`: Directory containing file selection related components
- `background.js`: Handles background tasks, including the shortcut listener

To contribute or modify the extension, edit these files and reload the extension in Chrome to see your changes.

## License

[MIT License](LICENSE)

## Support

For bug reports or feature requests, please open an issue in this repository.

## Acknowledgments

This project makes use of the Chrome Extension APIs and integrates with Pivotal Tracker and Skydeck AI services.