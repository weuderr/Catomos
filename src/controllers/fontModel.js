const fs = require("fs");
const {camelCaseLetter} = require("../lib/Utils");

exports.makeFrontModels = async (parsedFileName, camelCaseNameFile, fileName, data) => {
    if (data) {
        const fields = JSON.parse(data);
        let doFile = true
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index];
            if (index === 0 && field['Observacoes'].toLowerCase().includes('primary key')) {
                doFile = true;
                break;
            }
        }
        if (doFile) {
            const structure = (parsedFileName, fields) => {
                return `export class ${parsedFileName} ${fields}`;
            }

            let fields = JSON.parse(data)
            let inputs = {}
            fields.forEach(function (field, index) {

                const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : camelCaseLetter(field['Atributo']) : camelCaseLetter(field['Atributo']);
                let tipo = ''
                field['Tipo'] = field['Tipo'].toLowerCase();
                field['Tipo'] === 'varchar' || field['Tipo'] === 'string' ? tipo = 'string' : field['Tipo'] === 'number' || field['Tipo'] === 'integer' ? tipo = 'number' : field['Tipo'] === 'date' ? tipo = 'Date' : field['Tipo'] === 'boolean' ? tipo = 'boolean' : field['Tipo'] === 'enum' ? tipo = 'string' : tipo = 'any'
                inputs[nameAttribute] = tipo
            }.bind(this));

            let stringFy = JSON.stringify(inputs);
            let stringMod = stringFy.replace(/\"/g, '').replace(/,/g, ';');
            let fileWrite = structure(camelCaseNameFile, stringMod)

            let nameOfPath = 'docs/files/front/models/'
            await fs.writeFile(nameOfPath + parsedFileName + '.ts', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    }
}