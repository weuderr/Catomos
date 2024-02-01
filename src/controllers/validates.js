const fs = require("fs");
const {ensureDirectoryExistence, getTypeForValidate, camelCaseLetter} = require("../lib/Utils");

exports.makeValidates = async (parsedFileName, camelCaseNameFile, fileName, data) => {

    const structure = () => {
        return `import Joi from 'joi';
export default (req, res, next) => {
    return Joi
        .object(
`
    };

    const structureDown = () => {
        return `).validate(req.body, err => {
            if (err)
                return res.api.send(err.details, res.api.codes.UNPROCESSABLE_ENTITY);

            return next();
        });
} 
`
    };

    if (data) {
        //Fields of validation with Joi
        const fields = JSON.parse(data);
        let modelCreate = {};
        let modelUpdate = {};
        fields.forEach(function (field, index) {
            let baseModel = "Joi.";
            const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : camelCaseLetter(field['Atributo']) : camelCaseLetter(field['Atributo']);
            baseModel += getTypeForValidate(field);
            // START Create
            // modelCreate[nameAttribute] = 'Joi.';
            modelCreate[nameAttribute] = baseModel;

            if (field['Obrigatoriedade'] === "sim" && index !== 0)
                modelCreate[nameAttribute] += 'required()'
            else
                modelCreate[nameAttribute] += 'optional()';

            // END Create


            //Start Update
            // const nameAttribute = camelCaseLetter(field['Atributo']);
            // modelUpdate[nameAttribute] = 'Joi.';
            modelUpdate[nameAttribute] = baseModel;
            modelUpdate[nameAttribute] += 'optional()';
            //End Update
        });

        modelCreate['unit'] = "Joi.string().min(1).max(150).required()";
        modelCreate['user'] = "Joi.string().min(1).max(150).required()";

        modelUpdate['situation'] = "Joi.string().optional()";
        modelUpdate['unit'] = "Joi.string().min(1).max(150).optional()";
        modelUpdate['user'] = "Joi.string().min(1).max(150).required()";

        const parseModelCreate = JSON.stringify(modelCreate);
        const parseModelUpdate = JSON.stringify(modelUpdate);
        //Clear parseModel of double quotes
        const parseModelCreateClear = parseModelCreate.replace(/\"/g, '');
        const parseModelUpdateClear = parseModelUpdate.replace(/\"/g, '');

        let fileWriteCreate = structure() + parseModelCreateClear + structureDown()
        let fileWriteUpdate = structure() + parseModelUpdateClear + structureDown()

        const namePath = 'docs/files/back/api/' + parsedFileName.replace(/_/g, '-') + '/validates/';
        ensureDirectoryExistence(namePath);
        await fs.writeFile(namePath + 'create.validate.js', fileWriteCreate, {flag: 'w'}, function (err) {
            if (err) {
                return console.log(err);
            }
        });
        await fs.writeFile(namePath + 'update.validate.js', fileWriteUpdate, {flag: 'w'}, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }
}