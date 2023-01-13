const fs = require("fs");

exports.getType = (e) => {
    let type = '';
    switch (e['Tipo']) {
        case 'enum' :
            type = `DataTypes.ENUM(${e['Observacoes']})`;
            break;
        case 'numeric' :
            type = 'DataTypes.INTEGER';
            break;
        case 'number' :
            type = 'DataTypes.INTEGER';
            break;
        case ('varchar' || 'string') :
            type = 'DataTypes.STRING(' + e['Tamanho'] + ')';
            break;
        case 'date' :
            if (!e['Observacoes'] || e['Observacoes'].length >= 16)
                type = 'DataTypes.DATE';
            else
                type = 'DataTypes.DATEONLY';
            break;
        case 'boolean' :
            type = 'DataTypes.BOOLEAN';
            break;
        case 'text' :
            type = 'DataTypes.TEXT';
            break;
        case 'json' :
            type = 'DataTypes.JSON';
            break;
        case 'jsonb' :
            type = 'DataTypes.JSONB';
            break;
        case 'uuid' :
            type = 'DataTypes.UUID';
            break;
        case 'uuidv4' :
            type = 'DataTypes.UUIDV4';
            break;
        case 'uuidv1' :
            type = 'DataTypes.UUIDV1';
            break;
        case 'array' :
            type = 'DataTypes.ARRAY';
            break;
        case 'real' :
            type = 'DataTypes.REAL';
            break;
        case 'double' :
            type = 'DataTypes.DOUBLE';
            break;
        case 'float' :
            type = 'DataTypes.FLOAT';
            break;
        case 'decimal' :
            type = 'DataTypes.DECIMAL';
            break;
        case 'time' :
            type = 'DataTypes.TIME';
            break;
        case 'geometry' :
            type = 'DataTypes.GEOMETRY';
            break;
        case 'geometrycollection' :
            type = 'DataTypes.GEOMETRYCOLLECTION';
            break;
        case 'point' :
            type = 'DataTypes.POINT';
            break;
        case 'linestring' :
            type = 'DataTypes.LINESTRING';
            break;
    }
    return type;
}

exports.fieldsForModel = (e) => {
    let model = {}
    model.field = e['Atributo']

    e['Descricao'] !== "" ? model.comment = e['Descricao'] : '';
    model.type = this.getType(e)

    if (e['Observacoes'] === 'primary key') {
        model.allowNull = false
        model.required = true
        model.autoIncrement = !(e['Tipo'] === 'varchar')
        model.primaryKey = true
        model.unique = true
    } else {
        model.allowNull = e['Obrigatoriedade'] !== 'sim'
        model.required = e['Obrigatoriedade'] === 'sim'
    }
    return model
}

exports.ensureDirectoryExistence = (filePath) => {
    if (fs.existsSync(filePath)) {
        return true;
    }
    fs.mkdirSync(filePath);
}

exports.upLetter = (camelCaseNameFile) => {
    if (!camelCaseNameFile) return '';
    // camelCase in all first letters of the string after space or underline
    let newcamelCaseNameFile = '';
    let camelCaseNameFileArray = camelCaseNameFile.split(' ');
    if (!(camelCaseNameFileArray.length > 1)) {
        camelCaseNameFileArray = camelCaseNameFile.split('_');
    }

    for (let i = 0; i < camelCaseNameFileArray.length; i++) {
        newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
    }

    return newcamelCaseNameFile.charAt(0).toLowerCase() + newcamelCaseNameFile.slice(1);
}

exports.upSpaceLetter = (camelCaseNameFile) => {
    if (!camelCaseNameFile) return '';
    // camelCase in all first letters of the string after space or underline
    let newcamelCaseNameFile = '';
    let camelCaseNameFileArray = camelCaseNameFile.split(' ');
    if (!(camelCaseNameFileArray.length > 1)) {
        camelCaseNameFileArray = camelCaseNameFile.split('_');
    }
    camelCaseNameFileArray = this.castValues(camelCaseNameFileArray);
    for (let i = 0; i < camelCaseNameFileArray.length; i++) {
        if (i + 1 < camelCaseNameFileArray.length)
            newcamelCaseNameFile += camelCaseNameFileArray[i] + " ";
        else
            newcamelCaseNameFile += camelCaseNameFileArray[i];
    }

    return newcamelCaseNameFile.charAt(0).toUpperCase() + newcamelCaseNameFile.slice(1);
}

exports.getTypeForValidate = (field) => {
    let attr = '';
    if (field['Tipo'] === 'varchar') {
        attr += 'string().';
        attr += `max(${field['Tamanho']}).`;
    } else if (field['Tipo'] === 'enum')
        attr += 'valid([' + field['Observacoes'] + ']).';
    else if (field['Tipo'] === 'number')
        attr += 'number().';
    else if (field['Tipo'] === 'date')
        attr += 'date().';
    else if (field['Tipo'] === 'boolean')
        attr += 'boolean().';
    else if (field['Tipo'] === 'text')
        attr += 'string().';
    else if (field['Tipo'] === 'json')
        attr += 'object().';
    else if (field['Tipo'] === 'jsonb')
        attr += 'object().';
    else if (field['Tipo'] === 'uuid')
        attr += 'string().';
    else if (field['Tipo'] === 'integer')
        attr += 'number().';
    else if (field['Tipo'] === 'decimal')
        attr += 'number().';
    else if (field['Tipo'] === 'float')
        attr += 'number().';
    else if (field['Tipo'] === 'double')
        attr += 'number().';
    else if (field['Tipo'] === 'real')
        attr += 'number().';
    else if (field['Tipo'] === 'time')
        attr += 'string().';
    else if (field['Tipo'] === 'timestamp')
        attr += 'date().';
    else if (field['Tipo'] === 'timestamp with time zone')
        attr += 'date().';
    else if (field['Tipo'] === 'timestamp without time zone')
        attr += 'date().';
    else if (field['Tipo'] === 'bit')
        attr += 'boolean().';
    else if (field['Tipo'] === 'varbit')
        attr += 'boolean().';
    else if (field['Tipo'] === 'money')
        attr += 'number().';
    else if (field['Tipo'] === 'bytea')
        attr += 'string().';
    else if (field['Tipo'] === 'inet')
        attr += 'string().';
    else if (field['Tipo'] === 'cidr')
        attr += 'string().';
    else
        attr += 'string().';

    return attr;
}

exports.castValues = (camelCaseNameFileArray) => {
    return camelCaseNameFileArray.map(value => {
        value = value.toLowerCase();
        switch (value) {
            case 'dat':
                value = "data";
                break;
            case 'sta':
                value = "status";
                break;
            case 'aplic':
                value = "aplicação";
                break;
            case 'desc':
                value = "descricao";
                break;
            case 'cod':
                value = "codigo"
                break;
            case 'qtd':
                value = "quantidade"
        }
        return value
    });
}

exports.upAllFistLetterWithSpace = (camelCaseNameFile) => {
    if (!camelCaseNameFile) return '';
    // camelCase in all first letters of the string after space or underline
    let newcamelCaseNameFile = '';
    let camelCaseNameFileArray = camelCaseNameFile.split(' ');
    if (!(camelCaseNameFileArray.length > 1)) {
        camelCaseNameFileArray = camelCaseNameFile.split('_');
    }
    for (let i = 0; i < camelCaseNameFileArray.length; i++) {
        if (i === camelCaseNameFileArray.length - 1) {
            newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
        } else {
            newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1) + ' ';
        }
    }
    return newcamelCaseNameFile;
}

exports.upAllFistLetter = (camelCaseNameFile) => {
    if (!camelCaseNameFile) return '';
    // camelCase in all first letters of the string after space or underline
    let newcamelCaseNameFile = '';
    let camelCaseNameFileArray = camelCaseNameFile.split(' ');
    if (!(camelCaseNameFileArray.length > 1)) {
        camelCaseNameFileArray = camelCaseNameFile.split('_');
    }
    for (let i = 0; i < camelCaseNameFileArray.length; i++) {
        newcamelCaseNameFile += camelCaseNameFileArray[i].charAt(0).toUpperCase() + camelCaseNameFileArray[i].slice(1);
    }
    return newcamelCaseNameFile;
}

exports.makeFileFrontProfile = async (parsedFileName, className, fileName, nameWithSpace, data) => {
    if (data) {
        const structureScreen = (objectAll) => {
            return `${objectAll.inputs}`
        }

        let inputs = `${parsedFileName}, Administrador, btnIconToolbar,
${parsedFileName}, Administrador, iconToolbarNovo,
${parsedFileName}, Administrador, iconToolbarSalvar,
${parsedFileName}, Administrador, iconToolbarLimpar,
${parsedFileName}, Administrador, iconToolbarExportar,
${parsedFileName}, Administrador, iconToolbarAtualizar,
${parsedFileName}, Administrador, iconToolbarTutorial,
${parsedFileName}, Administrador, actionInfodtDtCaixa,
${parsedFileName}, Administrador, actionViewdtDtCaixa,
${parsedFileName}, Administrador, actionEditdtDtCaixa,
${parsedFileName}, Administrador, actionRemovedtDtCaixa,

`;

        let objectAll = {
            inputs: inputs,
        }

        let fileWrite = structureScreen(objectAll);

        let nameOfPath = 'docs/files/config/';
        await fs.writeFile(nameOfPath + 'profileXgt.txt', fileWrite, {flag: 'a+'}, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }

}

exports.lowerFirstLetter = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

// Verify fist key of the file is primary key
// async function verifyPrimeryKey(parsedFileName) {
//     return fs.readFile(readFolder + parsedFileName + '.json', 'utf8', async function (err, data) {
//         if (data) {
//             const fields = JSON.parse(data);
//             let model = {};
//             let isPrimeryKey = false
//             fields.forEach(function (field, index) {
//                 if (index === 0 && field['Observacoes'] === 'primary key')
//                     isPrimeryKey = true
//             });
//             return isPrimeryKey;
//         }
//     });
// }