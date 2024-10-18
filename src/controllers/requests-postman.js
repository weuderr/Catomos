const fs = require('fs');
const path = require('path');
const { generateRandomText, camelCaseLetter} = require("../lib/Utils");

exports.makePostmanCollection = async (parsedFileName, camelCaseNameFile, nameWithSpace, columns) => {
    const fileName = 'api-collection.postman_collection.json';
    const filePath = path.join('docs/files/requests', 'postman_collections', fileName);
    columns = JSON.parse(columns);
    const rowCount = 10; // Número de linhas de dados simulados a serem gerados

    // Verifica se o arquivo já existe
    let collection;
    if (fs.existsSync(filePath)) {
        // Se existir, lê o conteúdo atual
        collection = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
        // Se não existir, cria uma nova estrutura de coleção
        collection = {
            info: {
                name: `API Collection`,
                description: `Coleção para os endpoints da API`,
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            item: []
        };
    }

    // Checa se o item já existe na coleção
    let existingItem = collection.item.find(i => i.name === `${nameWithSpace} Endpoints`);

    // Se não existe, cria um novo grupo de itens para o recurso atual
    if (!existingItem) {
        existingItem = {
            name: `${nameWithSpace} Endpoints`,
            item: []
        };
        collection.item.push(existingItem);
    } else {
        // Se existir, limpa os requests anteriores para evitar duplicações
        existingItem.item = [];
    }

    let primaryKeyValue = 1;

    // Simulando IDs para chaves estrangeiras (exemplo)
    const foreignKeyCache = {};
    // Preencha o cache de chaves estrangeiras com valores de teste (1 até rowCount)
    columns.forEach((column) => {
        if (column.Observacoes && column.Observacoes.includes('foreign key')) {
            foreignKeyCache[column.Tabela] = Array.from({ length: rowCount }, (_, i) => i + 1);
        }
    });

    // Função para gerar objetos JSON simulados
    const generateDataObject = () => {
        const dataObject = {};
        columns.forEach((column) => {
            const isPrimaryKey = column.Observacoes && column.Observacoes.toLowerCase().includes('primary key');
            const isForeignKey = column.Observacoes && column.Observacoes.toLowerCase().includes('foreign key');
            const foreignValues = isForeignKey ? foreignKeyCache[column.Tabela] || [] : [];
            const value = generateValue(
                column.Tipo.toUpperCase(),
                column.Tamanho,
                column.Observacoes,
                isForeignKey,
                isPrimaryKey ? primaryKeyValue++ : null,
                foreignValues
            );
            dataObject[camelCaseLetter(column.Atributo)] = value;
        });
        return JSON.stringify(dataObject, null, 2);
    };

    // Função para gerar valores aleatórios baseados no tipo
    const generateValue = (type, size, options, isForeignKey = false, primaryKeyValue = 1, foreignValues = []) => {
        let month, day;
        if (isForeignKey) {
            return Math.floor(Math.random() * 10) + 1;  // ID aleatório para chave estrangeira
        }
        switch (type.toUpperCase()) {
            case 'STRING':
                return generateRandomText(size);
            case 'INTEGER':
                return primaryKeyValue || Math.floor(Math.random() * 1000);
            case 'BOOLEAN':
                return Math.random() < 0.5;
            case 'DATE':
                const year = 2023;
                month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                return `${year}-${month}-${day}`;
            case 'DATETIME':
                const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
                const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                return `2021-${month}-${day}T${hour}:${minute}:${second}Z`;
            case 'TEXT':
                return generateRandomText(size);
            case 'ENUM':
                const enumOptions = options.replace(/'/g, "").split(',').map(opt => opt.trim());
                const randomEnumValue = enumOptions[Math.floor(Math.random() * enumOptions.length)];
                return randomEnumValue;
            default:
                return null;
        }
    };

    // Adiciona os endpoints CRUD para o recurso atual com objetos de dados de exemplo
    const requests = [
        {
            name: `Criar ${nameWithSpace}`,
            request: {
                method: 'POST',
                header: [
                    {
                        key: 'Content-Type',
                        value: 'application/json',
                    },
                ],
                body: {
                    mode: 'raw',
                    raw: generateDataObject(), // Gera objeto de exemplo para POST
                },
                url: {
                    raw: `http://localhost:3000/${parsedFileName.toLowerCase()}`,
                    protocol: 'http',
                    host: ['localhost'],
                    port: '3000',
                    path: [parsedFileName.toLowerCase()],
                },
            },
        },
        {
            name: `Obter todos os ${nameWithSpace}s`,
            request: {
                method: 'GET',
                header: [],
                url: {
                    raw: `http://localhost:3000/${parsedFileName.toLowerCase()}`,
                    protocol: 'http',
                    host: ['localhost'],
                    port: '3000',
                    path: [parsedFileName.toLowerCase()],
                },
            },
        },
        {
            name: `Obter ${nameWithSpace} por ID`,
            request: {
                method: 'GET',
                header: [],
                url: {
                    raw: `http://localhost:3000/${parsedFileName.toLowerCase()}/1`,
                    protocol: 'http',
                    host: ['localhost'],
                    port: '3000',
                    path: [parsedFileName.toLowerCase(), '1'],
                },
            },
        },
        {
            name: `Atualizar ${nameWithSpace}`,
            request: {
                method: 'PUT',
                header: [
                    {
                        key: 'Content-Type',
                        value: 'application/json',
                    },
                ],
                body: {
                    mode: 'raw',
                    raw: generateDataObject(), // Gera objeto de exemplo para PUT
                },
                url: {
                    raw: `http://localhost:3000/${parsedFileName.toLowerCase()}/1`,
                    protocol: 'http',
                    host: ['localhost'],
                    port: '3000',
                    path: [parsedFileName.toLowerCase(), '1'],
                },
            },
        },
        {
            name: `Deletar ${nameWithSpace}`,
            request: {
                method: 'DELETE',
                header: [],
                url: {
                    raw: `http://localhost:3000/${parsedFileName.toLowerCase()}/1`,
                    protocol: 'http',
                    host: ['localhost'],
                    port: '3000',
                    path: [parsedFileName.toLowerCase(), '1'],
                },
            },
        }
    ];

    // Substitui os requests existentes pelos novos para evitar duplicações
    existingItem.item = requests;

    // Certifique-se de que o diretório existe
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Salva o arquivo de coleção do Postman
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), 'utf8');
};
