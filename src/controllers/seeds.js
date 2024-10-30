const fs = require("fs");
const {generateRandomText} = require("../lib/Utils");

exports.makeSeed = async (fileName, columns, rowCount = 10) => {
    fileName = fileName.toUpperCase();
    columns = JSON.parse(columns)
    const schema = 'sgv';

    // Cabeçalho do arquivo de seed
    const structureUp = () => `
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(${!!schema ? `{schema: '${schema}', tableName: '${fileName}'}` : `'${fileName}'`}, [
    `;

    // Rodapé do arquivo de seed
    const structureDown = () => `
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('${!!schema ? schema+'.' : ''}${fileName}', null, {});
  }
};
    `;

    // Função para gerar valores aleatórios de acordo com o tipo de dado
    const generateValue = (type, size, options, isForeignKey = false, primaryKeyValue = 1, foreignValues = []) => {
        let month, day;
        if (isForeignKey) {
            return Math.floor(Math.random() * 10) + 1;  // ID aleatório para chave estrangeira, ajustável conforme necessário
        }
        switch (type.toUpperCase()) {
            case 'STRING':
                return `'${generateRandomText(size)}'`;
            case 'INTEGER':
                return primaryKeyValue || Math.floor(Math.random() * 1000);
            case 'BOOLEAN':
                return Math.floor(Math.random() * 2) === 0;
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
        fileName = fileName.toLowerCase();
        await fs.promises.writeFile(`docs/files/backNew/seeds/${Date.now()}-seed-${fileName}.js`, seedContent, { flag: 'w' });
        console.log(`Seed file created successfully: ${fileName}`);
    } catch (err) {
        console.error(`Error writing seed file: ${err}`);
    }
};
