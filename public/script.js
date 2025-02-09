require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.31.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'markdown',
        theme: 'vs-dark',
        wordWrap: 'on',
        wordWrapColumn: 120,
        wrappingIndent: 'same',
        automaticLayout: true
    });

    const notePath = window.location.pathname;
    const socket = io({
        query: { notePath }
    });

    // Redireciona se a profundidade do caminho for maior que 3
    const pathParts = notePath.split('/').filter(Boolean);
    if (pathParts.length > 3) {
        const newPath = `/${pathParts.slice(0, 3).join('/')}`;
        window.location.href = newPath;
        return;
    }

    socket.on('loadNote', (data) => {
        editor.setValue(data);
    });

    socket.on('noteChange', (data) => {
        if (editor.getValue() !== data) {
            editor.setValue(data);
        }
    });

    editor.onDidChangeModelContent((event) => {
        const content = editor.getValue();
        socket.emit('noteChange', content);
        localStorage.setItem(notePath, content);
    });

    // Função para configurar o estilo e eventos de uma nota
    function configureNoteElement(li, notePath, noteName, level) {
        li.textContent = noteName;
        li.style.paddingLeft = `${(level + 1) * 10}px`; // Adiciona padding à esquerda baseado no nível
        li.style.height = `${editor.getOption(monaco.editor.EditorOption.lineHeight)}px`;
        li.style.lineHeight = `${editor.getOption(monaco.editor.EditorOption.lineHeight)}px`;
        li.addEventListener('click', () => {
            window.location.href = notePath;
        });
    }

    // Função para adicionar notas e subnotas ao explorador
    function addNotesAndSubnotes(basePath, level = 0) {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = ''; // Limpar lista existente

        // Adiciona a nota principal ao explorador
        const mainNote = document.createElement('li');
        configureNoteElement(mainNote, basePath, basePath.substring(1), level); // Remover o '/' inicial
        fileList.appendChild(mainNote);

        // Adiciona subnotas ao explorador
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(basePath) && key !== basePath) {
                const relativePath = key.substring(basePath.length);
                const pathParts = relativePath.split('/').filter(Boolean);
                if (pathParts.length <= 2) { // Permite até sub-subnotas
                    const subnote = pathParts[pathParts.length - 1]; // Usa o último segmento para o nome da subnota
                    const li = document.createElement('li');
                    const fullPath = `${basePath}${relativePath}`;
                    configureNoteElement(li, fullPath, subnote, level + pathParts.length); // Ajusta o nível de profundidade
                    fileList.appendChild(li);
                }
            }
        });
    }

    // Popula a lista de arquivos no explorador
    const basePath = `/${pathParts[0]}`;
    addNotesAndSubnotes(basePath);
});