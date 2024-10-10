const fs = require("fs");

exports.makeSeed = async (fileName, columns, rowCount = 10) => {
    columns = JSON.parse(columns)

    // Cabeçalho do arquivo de seed
    const structureUp = () => `
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('${fileName}', [
    `;

    // Rodapé do arquivo de seed
    const structureDown = () => `
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('${fileName}', null, {});
  }
};
    `;

    // Função para gerar texto aleatório de acordo com o tamanho
    const generateRandomText = (size) => {
        const syllables = ["ba", "be", "bi", "bo", "bu", "ca", "ce", "ci", "co", "cu", "da", "de", "di", "do", "du",
            "fa", "fe", "fi", "fo", "fu", "ga", "ge", "gi", "go", "gu", "la", "le", "li", "lo", "lu",
            "ma", "me", "mi", "mo", "mu", "na", "ne", "ni", "no", "nu", "pa", "pe", "pi", "po", "pu",
            "ra", "re", "ri", "ro", "ru", "sa", "se", "si", "so", "su", "ta", "te", "ti", "to", "tu",
            "va", "ve", "vi", "vo", "vu"];

        let text = '';
        let currentLength = 0;

        // Decide se será uma palavra, frase ou parágrafo
        const textType = Math.random();

        // Gera uma palavra
        const generateWord = () => {
            const wordLength = Math.floor(Math.random() * 3) + 2; // Entre 2 e 5 sílabas
            let word = '';
            for (let i = 0; i < wordLength; i++) {
                word += syllables[Math.floor(Math.random() * syllables.length)];
            }
            return word;
        };

        // Gera uma frase com várias palavras
        const generateSentence = () => {
            const sentenceLength = Math.floor(Math.random() * 5) + 5; // Entre 5 e 10 palavras
            let sentence = '';
            for (let i = 0; i < sentenceLength; i++) {
                let word = generateWord();
                sentence += (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
                if (i < sentenceLength - 1) sentence += ' ';
            }
            return sentence + '.';
        };

        // Gera um parágrafo com várias frases
        const generateParagraph = () => {
            const paragraphLength = Math.floor(Math.random() * 3) + 2; // Entre 2 e 4 frases
            let paragraph = '';
            for (let i = 0; i < paragraphLength; i++) {
                paragraph += generateSentence() + ' ';
            }
            return paragraph.trim();
        };

        // Baseado no tipo, gera o texto correspondente
        if (textType < 0.3) {
            text = generateWord();
        } else if (textType < 0.7) {
            text = generateSentence();
        } else {
            text = generateParagraph();
        }

        // Limita ao tamanho máximo permitido
        return text.length > size ? text.substring(0, size).trim() : text;
    };

    // Função para gerar valores aleatórios de acordo com o tipo de dado
    const generateValue = (type, size, options, isForeignKey = false, primaryKeyValue = 1, foreignValues = []) => {
        let month, day;
        if (isForeignKey) {
            return Math.floor(Math.random() * 10) + 1;  // ID aleatório para chave estrangeira, ajustável conforme necessário
        }
        switch (type.toUpperCase()) {
            case 'VARCHAR':
                return `'${generateRandomText(size)}'`;
            case 'INT':
                return primaryKeyValue || Math.floor(Math.random() * 1000);
            case 'TINYINT':
                return Math.floor(Math.random() * 2);
            case 'DATE':
                const year = 2023;
                month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                return `'${year}-${month}-${day}'`;
            case 'DATETIME':
                // Gera uma data e hora aleatória no ano de 2021
                const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
                const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                const second = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                return `'2021-${month}-${day} ${hour}:${minute}:${second}'`;
            case 'TEXT':
                return `'${generateRandomText(size)}'`;
            case 'ENUM':
                // Seleciona aleatoriamente uma das opções fornecidas em Observacoes
                const enumOptions = options.replace(/'/g, "").split(',').map(opt => opt.trim());
                const randomEnumValue = enumOptions[Math.floor(Math.random() * enumOptions.length)];
                return `'${randomEnumValue}'`;
            default:
                return 'null';
        }
    };

    let seedData = '';
    let primaryKeyValue = 1;

    // Simulando IDs para chaves estrangeiras (exemplo)
    const foreignKeyCache = {
        // 'foreign_table': [1, 2, 3, ..., rowCount]
    };
    // Preencha o cache de chaves estrangeiras com valores de teste (1 até rowCount)
    columns.forEach((column) => {
        if (column.Observacoes && column.Observacoes.includes('foreign key')) {
            foreignKeyCache[column.Tabela] = Array.from({ length: rowCount }, (_, i) => i + 1);
        }
    });

    // Gera as linhas de dados aleatórios para o seed
    for (let i = 0; i < rowCount; i++) {
        let rowData = '      { ';
        columns.forEach((column, index) => {
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
            rowData += `${column.Atributo}: ${value}${index < columns.length - 1 ? ',' : ''} `;
        });
        rowData += `}${i < rowCount - 1 ? ',' : ''}\n`;
        seedData += rowData;
    }

    // Concatena todas as partes do arquivo de seed
    const seedContent = structureUp() + seedData + structureDown();

    // Escreve o arquivo de seed
    try {
        await fs.promises.writeFile(`docs/files/back/seeds/${Date.now()}-seed-${fileName}.js`, seedContent, { flag: 'w' });
        console.log(`Seed file created successfully: ${fileName}`);
    } catch (err) {
        console.error(`Error writing seed file: ${err}`);
    }
};
