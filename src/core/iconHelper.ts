const validCodicons: string[] = [
    'add', 'archive', 'arrow-both', 'arrow-down', 'arrow-left', 'arrow-right', 'arrow-small-down', 'arrow-small-left', 'arrow-small-right', 'arrow-small-up', 'arrow-up',
    'bell-dot', 'bell', 'bold', 'book', 'bookmark', 'bracket-dot', 'bracket-error', 'briefcase', 'broadcast', 'browser', 'bug', 'calendar', 'case-sensitive', 'check',
    'check-all', 'checklist', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up', 'circle', 'circle-filled', 'circle-large', 'circle-large-filled',
    'circle-slash', 'circuit-board', 'clear-all', 'clippy', 'close-all', 'close', 'cloud', 'cloud-download', 'cloud-upload', 'code', 'collapse-all', 'color-mode',
    'combine', 'comment-add', 'comment-discussion', 'comment', 'compass', 'console', 'copy', 'credit-card', 'dash', 'dashboard', 'database', 'debug-alt', 'debug-breakpoint-condition',
    'debug-breakpoint-data', 'debug-breakpoint-function', 'debug-breakpoint-log', 'debug-breakpoint-unsupported', 'debug-console', 'debug-continue', 'debug-coverage',
    'debug-disconnect', 'debug-line-by-line', 'debug-pause', 'debug-rerun', 'debug-restart', 'debug-reverse-continue', 'debug-start', 'debug-step-into', 'debug-step-out',
    'debug-step-over', 'debug-stop', 'desktop-download', 'device-camera-video', 'device-camera', 'device-desktop', 'device-mobile', 'diff-added', 'diff-ignored', 'diff-modified',
    'diff-removed', 'diff-renamed', 'diff', 'discard', 'edit', 'editor-layout', 'ellipsis', 'empty-window', 'error', 'exclude', 'expand-all', 'export', 'extensions', 'eye',
    'eye-closed', 'feedback', 'file-binary', 'file-code', 'file-media', 'file-pdf', 'file-submodule', 'file-symlink-directory', 'file-symlink-file', 'file-zip', 'file',
    'files', 'filter-filled', 'filter', 'flame', 'fold-down', 'fold-up', 'fold', 'folder-active', 'folder-opened', 'folder', 'gear', 'gift', 'gist-fork', 'gist-new', 'gist-private',
    'gist-secret', 'globe', 'go-to-file', 'grabber', 'graph-left', 'graph-line', 'gripper', 'group-by-ref-type', 'heart', 'history', 'home', 'horizontal-rule', 'hubot', 'inbox',
    'info', 'issue-draft', 'issue-reopened', 'issue', 'issues', 'italic', 'jersey', 'json', 'kebab-vertical', 'key', 'law', 'layers-active', 'layers-dot', 'layers', 'library',
    'lightbulb-autofix', 'lightbulb', 'link-external', 'link', 'list-filter', 'list-flat', 'list-ordered', 'list-selection', 'list-tree', 'list-unordered', 'live-share',
    'loading', 'location', 'lock-small', 'lock', 'magnet', 'mail-read', 'mail', 'markdown', 'megaphone', 'mention', 'menu', 'merge', 'microscope', 'milestone', 'mirror',
    'mortar-board', 'move', 'multiple-windows', 'mute', 'no-newline', 'note', 'notebook-template', 'octoface', 'open-preview', 'organization', 'output', 'package', 'paintcan',
    'pencil', 'person-add', 'person', 'pie-chart', 'pin', 'pinned-filled', 'pinned', 'play', 'play-circle', 'plug', 'preserve-case', 'preview', 'primitive-dot', 'primitive-square',
    'project', 'pulse', 'question', 'quote', 'radio-tower', 'reactions', 'record', 'redo', 'references', 'refresh', 'regex', 'remote-explorer', 'remote', 'remove', 'replace-all',
    'replace', 'reply', 'repo-clone', 'repo-create', 'repo-delete', 'repo-force-push', 'repo-forked', 'repo-pull', 'repo-push', 'repo-sync', 'report', 'request-changes',
    'rocket', 'root-folder-opened', 'root-folder', 'rss', 'ruby', 'run-above', 'run-all', 'run-below', 'run-errors', 'save-all', 'save-as', 'save', 'screen-full', 'screen-normal',
    'search', 'server-environment', 'server-process', 'server', 'settings-gear', 'settings', 'shield', 'sign-in', 'sign-out', 'smiley', 'sort-precedence', 'source-control',
    'split-horizontal', 'split-vertical', 'squirrel', 'star-empty', 'star-full', 'star-half', 'stop-circle', 'symbol-array', 'symbol-boolean', 'symbol-class', 'symbol-color',
    'symbol-constant', 'symbol-enum-member', 'symbol-enum', 'symbol-event', 'symbol-field', 'symbol-file', 'symbol-folder', 'symbol-function', 'symbol-interface', 'symbol-key',
    'symbol-keyword', 'symbol-method', 'symbol-misc', 'symbol-namespace', 'symbol-numeric', 'symbol-operator', 'symbol-parameter', 'symbol-property', 'symbol-reference',
    'symbol-ruler', 'symbol-snippet', 'symbol-string', 'symbol-struct', 'symbol-variable', 'sync-ignored', 'sync', 'tag', 'tasklist', 'telescope', 'terminal-bash', 'terminal-cmd',
    'terminal-debian', 'terminal-linux', 'terminal-powershell', 'terminal-tmux', 'terminal-ubuntu', 'terminal', 'text-size', 'three-bars', 'thumbsdown', 'thumbsup', 'tools', 'trash',
    'triangle-down', 'triangle-left', 'triangle-right', 'triangle-up', 'twitter', 'unfold', 'ungroup-by-ref-type', 'unlock', 'unmute', 'unverified', 'verified-filled', 'verified',
    'versions', 'vm-active', 'vm-outline', 'vm-running', 'vm', 'wand', 'warning', 'watch', 'whitespace', 'whole-word', 'window', 'word-wrap', 'workspace-trusted', 'workspace-unknown',
    'workspace-untrusted', 'zap', 'zoom-in', 'zoom-out'
];

const validContributedIcons=[
    'fa-book', 'fa-file-lines',
    'mdi-link', 'mdi-link_off',
    'swap_vert'
]
export { validCodicons, validContributedIcons };

export function isValidCodicon(id: string): boolean {
    return validCodicons.includes(id) || validContributedIcons.includes(id);
}