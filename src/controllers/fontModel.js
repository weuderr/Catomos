const fs = require("fs");
const {upLetter} = require("../lib/Utils");

exports.makeFrontModels = async (parsedFileName, camelCaseNameFile, fileName, data) => {
    if (data) {
        const fields = JSON.parse(data);
        let doFile = false
        fields.forEach(function (field, index) {
            if (index === 0 && field['Observacoes'] === 'primary key')
                doFile = true
        });
        if (doFile) {
            const structure = (parsedFileName, fields) => {
                return `export class ${parsedFileName} ${fields}`;
            }

            let fields = JSON.parse(data)
            let inputs = {}
            fields.forEach(function (field, index) {

                const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : upLetter(field['Atributo']) : upLetter(field['Atributo']);
                let tipo = ''
                field['Tipo'] === 'varchar' ? tipo = 'string' : field['Tipo'] === 'number' ? tipo = 'number' : field['Tipo'] === 'date' ? tipo = 'Date' : field['Tipo'] === 'boolean' ? tipo = 'boolean' : field['Tipo'] === 'enum' ? tipo = 'string' : tipo = 'any'
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