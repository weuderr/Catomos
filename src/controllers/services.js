const fs = require("fs");
const {ensureDirectoryExistence} = require("../lib/Utils");

exports.makeFrontFileService = async (parsedFileName, camelCaseNameFile, fileName, data) => {
    if (data) {
        const fields = JSON.parse(data);
        let doFile = false
        fields.forEach(function (field, index) {
            if (index === 0 && field['Observacoes'] === 'primary key')
                doFile = true
        });
        if (doFile) {

            const structure = () => {
                return `import {Injectable} from '@angular/core';
import {SarcService} from '../sarc-service/sarc-api.service';
import {HttpClient} from '@angular/common/http';
import {${camelCaseNameFile}} from '../../models/${parsedFileName}';

@Injectable({
  providedIn: 'root'
})
export class ${camelCaseNameFile}Service extends SarcService< ${camelCaseNameFile} > {
  constructor(http: HttpClient) {
    super('api/${camelCaseNameFile.toLocaleLowerCase()}', http)
  }
}
`;
            }

            let fileWrite = structure()

            let nameOfPath = 'docs/files/front/services/' + parsedFileName + '-service/'
            ensureDirectoryExistence(nameOfPath);
            await fs.writeFile(nameOfPath + camelCaseNameFile + 'Service.ts', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    }
}