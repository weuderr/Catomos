const fs = require("fs");
const {ensureDirectoryExistence, upAllFistLetter, camelCaseLetter, upSpaceLetter} = require("../lib/Utils");

exports.makeFileFrontReport = async (parsedFileName, className, fileName, nameWithSpace, data) => {
    if (data) {
        const fields = JSON.parse(data);
        let doFile = false
        fields.forEach(function (field, index) {
            if (index === 0 && field['Observacoes'] === 'primary key')
                doFile = true
        });
        if (doFile) {

            const structureScreen = (objectAll) => {
                return `import {Component} from '@angular/core';
import {MessageService} from '../../../../../services/message/message.service';
import {WebixInput} from 'src/app/classes/webix.input';
import {WebixToolbar} from 'src/app/classes/webix.toolbar';
import {WebixSelect} from 'src/app/classes/webix.select';
import {WebixDatatable} from 'src/app/classes/webix.datatable';
import {DocumentoService} from '../../../../services/documento-service/DocumentoService';
import {QuerysBuilderService} from '../../../../../services/querys-builder/querys-builder.service';
import {WebixService} from '../../../../../services/webix/webix.service';
import {WebixPaginate} from 'src/app/classes/webix.paginate';
import {WebixVideo} from 'src/app/classes/webix.video';
import {ProfileService} from 'src/app/services/profile/profile.service';
import {formatEnum, loadingHide, loadingShow} from 'src/app/classes/Util';
import {GoogleSheetsService} from 'src/app/services/google-sheets/google-sheets.service';
import {AtivoInativoFilter} from '../../../../enum/AtivoInativo';
import {LocalStorageService} from 'src/app/services/local-storage/local-storage.service';
import {I18nService} from 'src/app/services/i18n/i18n.service';
import {WebixSuggest} from "../../../../../classes/webix.suggest";
import {ItemDocumentalService} from '../../../../services/item-documental-service/ItemDocumentalService';
import {TipoOrgaoService} from '../../../../services/tipo-orgao-service/TipoOrgaoService';
import {WebixButton} from "../../../../../classes/webix.button";
import {WebixInputDateRange} from "../../../../../classes/webix.inputDateRange";
import {WebixMultiCombo} from "../../../../../classes/webix.multiCombo";
import {WebixInputDate} from "../../../../../classes/webix.inputDate";
${objectAll.fileImports}

@Component({
  selector: 'app-${parsedFileName}-report',
  templateUrl: './${parsedFileName}-report.component.html',
  styleUrls: ['./${parsedFileName}-report.component.scss']
})
export class ${className}ReportComponent {
  /*
   Declaração das variaveis do Webix, as mesmas são setadas pelo serviço WebixService
 */
  webixUi: any;
  webix: any;
  $$: any;
  ${objectAll.includeVariables}
  
  /*
    Esse array faz a busca nas informações que estão no banco, é o mesmo select que se faz na tabela
  */
  select = [${objectAll.select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];
  /*
    Declara a páginação
  */
  paginate = new WebixPaginate('pagination', {size: 50, group: 5});
  /*
    Insere todo o array que existe no datatable para eventuais pesquisas futuras
  */
  dataAll: any = [];
  /*
    Id do formulário é colocado numa variável para poder ser reutilizado no código abaixo
  */
  formId: string = 'Frm${className}';
  /*
    Id do accordion onde tem o formulário é colocado numa variável para poder ser utilizado no código abaixo
  */
  accordionFormId: string = 'accordionItemFormDocumento';
  /**
   * Variavel de leitura/edição dos campos
   */
  readonly = true;
  /**
   * Definições de input para o filtro
   */
  ${objectAll.inputs}
  buttonSearch = new WebixButton('Pesquisar', 'Pesquisar', 'primary', () => this._loadData(), {
    icon: 'fa fa-search',
    css: {'line-height': '0!important'},
  });
  
  /*
    Declaração do video tutorial
  */
  video = new WebixVideo('tutorial', "assets/videotutorial1.webm", () => {
    this.$$(this.video.getId()).close()
  })
  /*
    Declaração da barra de tarefas que fica localizado no topo
  */
  toolbar = new WebixToolbar('toolbar', this.formId, [
    {
      tooltip: "Report", view: "icon", icon: "fa fa-file-pdf-o", click: () => {
        this.generateReport();
      }
    },
    {
      view: "icon", icon: "fa fa-refresh", tooltip: "Atualizar", click: () => {
        this._loadData();
        this._messageService.show('Atualizado com sucesso!', 'success')
      }
    },
    {
      view: "icon", icon: "fa fa-file-video-o", tooltip: "Tutorial", click: () => {
        this._loadTutorial()
      }
    },
  ])
  
  /*
    Declaração da tabela
  */
  datatable = new WebixDatatable(
    '${className}Report',
    this.formId,
    [
      ${objectAll.datatable}
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
      }
    },
    []
  );

  constructor(
    private _webixService: WebixService,
    private _profileService: ProfileService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private service: ${className}Service,
    ${objectAll.importConstructor}
  ) {
    this.init()
  }

  /**
   * Inicia o processo do component, é chamado pelo constructor
   * Essa função é separada para caso precisar chamar novamente
   */
  async init() {
    this.webix = this._webixService.getWebix();
    this.$$ = this._webixService.get$$();
    this.datatable.footerInit();
    await this.setWebixUi();
  }

  /**
   * Configura a disposição com os componentes webix utilizando as variaveis declaradas acima
   */
  async setWebixUi() {
    this.webix.ready(async () => {
      loadingShow();
      this.webixUi = this.webix.ui({
        rows: [
          this.toolbar.getField(),
          {
            view: "accordion",
            multi: true,
            css: "accordion",
            padding: {
              top: 25,
              right: 25,
              left: 25,
              bottom: 25
            },
            rows: [
              {
                view: "accordionitem",
                id: this.accordionFormId + "Filter",
                header: this.translate("Filtro"),
                collapsed: true,
                body: {
                  rows: [
                    this.setFormFilterInputs()
                  ]
                }
              },
              {height: 15},
              {
                view: "accordionitem",
                header: this.translate("Pesquisa"),
                body: {
                  padding: {
                    top: 15
                  },
                  rows: [
                    this.datatable.getField(),
                    {
                      cols: [
                        this.paginate.getField(),
                      ]
                    }
                  ]
                }
              },
            ]
          }
        ]
      });

      ${objectAll.setLoadSuggest !== "" ? 'await this.loadSuggests();' : ''}
      await this._loadData();
      loadingHide();
    })
  }

  /**
   * Retorna o objeto com as variaveis do formulário para dentro do webixUi
   */
  setFormFilterInputs() {
    return {
      id: this.formId + "Filter",
      view: 'form',
      rows: [
        ${objectAll.form} {
          cols: [
            {
                gravity: 2
            },
            this.buttonSearch.getField(),
          ]
        }
      ]
    }
  }

  /**
   * Ao ser chamada ela recarrega todas as informações fazendo uma nova requisição na API
   */
  async _loadData() {
    loadingShow();

    let query = this._querysBuilderService.getSelect(this.select);
    
    ${objectAll.getValueInput}
    let where: any = {};
    ${objectAll.SetValueWhere}
    
    let include = [${objectAll.includeQuery}]
    
    query += "&where=" + JSON.stringify(where);
    query += "&include=" + JSON.stringify(include);
    
    const result: any = await this.service.get(query).toPromise();
    
    if(result.data.length > 0) {
      this.dataAll = result.data${objectAll.reMapFoDataTable}.reverse();
      this.datatable.setData(this.dataAll);
    } else {
      this.dataAll = [];
    }
    this.datatable.setData(this.dataAll);
    loadingHide();
  }

  ${objectAll.setLoadSuggest}

  showView(row) {
    const item = this.dataAll.find(select => select.id === row);
    const form = this.$$(this.formId)
    form.setValues(item);
    this.$$(this.inputIdFilter.getId()).show();
    this.$$(this.inputIdFilter.getId()).setValue(item.id);
    this.$$(this.inputSituationFilter.getId()).show();
    this.$$(this.accordionFormId).expand();
    form.setDirty(false);
  }

  /*
  * Torna o video tutorial visivel
  */
  _loadTutorial() {
    this.webix.ui(this.video.getField()).show();
  }

  /**
   * Exportar para o Excel
   */
  translate(key) {
    return this._i18nService.translate(key);
  }

  private generateReport() {
    if (this.dataAll.length > 0) {
      this._localStorageService.setItem('reportItem', this.dataAll);
      window.open('/blank/application/tables/layout_${fileName}_report', '_blank')
    } else
      this._messageService.show('Nenhum registro selecionado, revise os filtros e tente novamente.', 'error');
  }
}
`;
            }

            const structureReport = () => {
                return `
        import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import {LocalStorageService} from 'src/app/services/local-storage/local-storage.service';

@Component({
  selector: 'app-layout-${parsedFileName}-report',
  templateUrl: './layout-${parsedFileName}-report.component.html',
  styleUrls: ['./layout-${parsedFileName}-report.component.scss']
})
export class Layout${className}ReportComponent {
  report = {data: [], title: ''};
  moment = moment

  constructor( private _localStorageService: LocalStorageService) {
    this.generate${className}Report();
  }

  private generate${className}Report() {
    let report = this._localStorageService.getItem('reportItem');
    if(report) {
      this.report.data = report
      this.report.title = 'Relacão de ${nameWithSpace} - '+moment().format('DD/MM/YYYY HH:mm');
      this._localStorageService.removeItem('reportItem');
    }
  }
}
`;
            }

            const structureHtmlReport = (htmlReport) => {
                return `
        <!DOCTYPE HTML>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report.title || 'None'}}</title>
  <style>
    @page {
      size: 7in 9.25in;
      margin: 27mm 16mm 27mm 16mm;
    }
  </style>
</head>


<body>
  <header>
    <div
      style="background: #ffffff; width: 100%; height: 55px; color: #000000; display: flex; justify-content: space-between">
      <h1 class="title"><strong>{{report.title}}</strong></h1>
      <img src="./assets/logo_48.png" alt="Aperam BioEnergia" height="35">
    </div>
  </header>

  <div style="border-top: 3px solid #c8c8"></div>
  <div *ngFor="let item of report.data; let i = index">
      <div class="wrapper">
          <div class="info-item">
            <div *ngIf="i==0" class="info-item-label">ID</div>
            <div class="info-item-value">{{item.id}}</div>
          </div>
          ${htmlReport}
    </div>
    <div style="border-top: 3px solid #c8c8"></div>
  </div>
</body>

</html>

`;
            }

            const structureCssReport = () => {
                return `.wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: 10px;
  grid-row-gap: 1em;
}

.w400 {
  width: 400px;
}

.w170 {
  width: 170px;
}

.w200 {
  width: 200px;
}

.info-item-label {
  font-weight: bold; 
  margin-bottom: 20px;
}

.info-item-value {
  // margin-bottom: 20px;
}
`;
            }


            let fields = JSON.parse(data)
            let fileEnum = []
            let inputs = ``
            let datatable = ``
            let form = ``;
            let cont = 0;
            let close = true
            let select = '';
            let loadSuggest = ""
            let getValueInput = ""
            let SetValueWhere = ""
            let importConstructor = ""
            let fileImports = `import { ${className}Service } from '../../../../services/${parsedFileName}-service/${className}Service';\n`
            let includeVariables = ""
            let includeQuery = "\n"
            let mapToGetIdSuggest = ""
            let mapToGetValue = ""
            let mapToGetIdSelect = ""
            let htmlReport = ""

            fields.forEach(function (field, index) {

                const nameAttribute = index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : camelCaseLetter(field['Atributo']) : camelCaseLetter(field['Atributo']);
                const nameAttributeAllUp = upAllFistLetter(index === 0 ? field['Observacoes'] === 'primary key' ? 'id' : camelCaseLetter(field['Atributo']) : camelCaseLetter(field['Atributo']));
                const displayName = upSpaceLetter(field['displayName'] || field['Atributo']);
                select += ` '${nameAttribute}',`
                if (cont++ === 0) {
                    close = false
                    form += `{ cols: [\n`;
                }
                if (index === 0) {
                    form += `this.inputIdFilter.getField(),\n`;
                    //regex to remove break lines
                    // const parten = /\n/g;
                    datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: false, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
                    //TODO INSERT TITLE
                    inputs += `inputIdFilter = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { width: 200, disabled: true, ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                } else {
                    form += `this.input${nameAttributeAllUp}Filter.getField(),\n`;
                    //START DEFINE DATATABLE
                    if (field['Tipo'] !== 'enum')
                        datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "${field['Tipo'] !== "number" ? "textFilter" : "numberFilter"}" }], fillspace: true, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
                    else
                        datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: true, sort: 'text', format: (value) => { return formatEnum(value, ${nameAttribute}Enum) } },\n`;
                    //END DEFINE DATATABLE

                    if (field['Tipo'] === 'date') {
                        inputs += `input${nameAttributeAllUp}Filter = new WebixInputDate('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                        mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;

                        getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}Filter.getId()).getValue();`
                        SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
                    } else if (field['Tipo'] === 'enum') {
                        // START DEFINE O ENUM PARA CRIACAO DO ARQUIVO
                        fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
                            JSON.stringify(field['Observacoes'].split(',').map(i => {
                                return {id: i.replace(/'/g, ''), value: i.replace(/'/g, '')}
                            }))}; \n/*${field['Descricao']}*/\n
            export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
              if (item.id !== null) return {...item}
            })
            `]);

                        fileImports += `import {${nameAttribute}Enum} from "../../../../enum/${nameAttribute}.enum";\n`;

                        // END DEFINE O ENUM PARA CRIACAO DO ARQUIVO

                        inputs += `input${nameAttributeAllUp}Filter = new WebixSelect('${nameAttribute}', this.translate('${displayName}'), ${nameAttribute}Enum, { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                        //filter datatable by enum
                        mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id === item.${nameAttribute});
                                 ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
                        mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value === item.${nameAttribute});
                                 ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;

                        getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}Filter.getId()).getValue();`
                        SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
                    } else if (field['Observacoes'] === 'foreign key') {
                        inputs += `input${nameAttributeAllUp}Filter = new WebixSuggest('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

                        const nameService = field['Tabela'].replace(' ', '')
                        //Replace up letter for same letter lower and underscore not can start with underscore
                        const nameServiceAllUp = nameService.charAt(0).toLowerCase() + nameService.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
                        fileImports += `import { ${nameService}Service } from '../../../../services/${nameServiceAllUp}-service/${nameService}Service';\n`;

                        includeVariables += `private ${nameAttribute}Data: any = [];\n`;
                        includeQuery += `'${nameAttribute.replace('cod', '')}',\n`;
                        mapToGetIdSuggest += `this.suggestValues.${nameAttribute} ? item.${nameAttribute} = this.suggestValues.${nameAttribute} : item.${nameAttribute} = this.${nameAttribute}Data.find(select => select.value == item.${nameAttribute}).id;\n`;
                        if (importConstructor.indexOf(`private _${nameService}Service`) === -1) {
                            importConstructor += `private _${nameService}Service: ${nameService}Service,\n`;
                        }
                        //    Suggest
                        //  text //Start load ${nameService} not exit in loadSuggest
                        if (loadSuggest.indexOf(`Start load ${nameService}`) === -1) {
                            loadSuggest += `//Start load ${nameService}
                            let ${nameService}Resp = await this._${nameService}Service.get(simpleWhere).toPromise();
                            if (${nameService}Resp.data.length > 0) {
                                this.${nameAttribute}Data = ${nameService}Resp.data.map((${nameService}) => {
                                    return {
                                        id: ${nameService}.id,
                                        value: ${nameService}.desc${nameAttribute.replace('cod', '')}
                                    };
                                });
                                await this.input${nameAttributeAllUp}Filter.setSuggest(this.${nameAttribute}Data, {
                                    onValueSuggest: (item) => {
                                        this.suggestValues.${nameAttribute} = item.id;
                                    },
                                });
                            }
                            //End load ${nameService}\n
                            `
                        }
                        //filter in this.${nameAttribute}Data for ${nameAttribute}
                        mapToGetValue += `const ${nameAttribute} = this.${nameAttribute}Data.find( select => select.id == item.${nameAttribute});
                            ${nameAttribute}? item.${nameAttribute}= ${nameAttribute}.value : '';\n`;

                        // getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}.getId()).getValue();`
                        SetValueWhere += `this.suggestValues.${nameAttribute} ? where.${nameAttribute} = this.suggestValues.${nameAttribute} : null;`
                    } else {
                        inputs += `input${nameAttributeAllUp}Filter = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

                        getValueInput += `const ${nameAttributeAllUp}Value = this.$$(this.input${nameAttributeAllUp}Filter.getId()).getValue();`
                        SetValueWhere += `${nameAttributeAllUp}Value ? where.${nameAttribute} = ${nameAttributeAllUp}Value : null;`
                    }

                    htmlReport += `<div class="info-item">
                  <div *ngIf="i==0" class="info-item-label">${displayName}</div>
                  <div class="info-item-value">{{item.${nameAttribute}}}</div>
                </div>
                `;

                }
                if (cont === 3) {
                    close = true
                    cont = 0;
                    form += `] },`;
                }
            }.bind(this));
            form += `\nthis.inputSituationFilter.getField()`
            if (!close) {
                form += `] },\n`;
            }
            inputs += `inputSituationFilter = new WebixSelect('situation', this.translate('Situação'), AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
            includeVariables += `private suggestValues: any = {};\n`;
            let setLoadSuggest = ""
            loadSuggest ? setLoadSuggest = `async loadSuggests() {
                    const simpleWhere = "where="+JSON.stringify({situation: 'A'});\n
                    ${loadSuggest}\n
                    loadingHide();\n
                }` : '';

            const reMapToGetIdSuggest = `
                if(this.suggestValues) {
                    ${mapToGetIdSuggest}
                }\n
                `
            const reMapFoDataTable = `.map( (item) => {
                    ${mapToGetValue}
                    return item;
                })`

            let objectAll = {
                form: form,
                inputs: inputs,
                select: select,
                includeVariables: includeVariables,
                mapToGetIdSelect: mapToGetIdSelect,
                mapToGetIdSuggest: mapToGetIdSuggest,
                mapToGetValue: mapToGetValue,
                getValueInput: getValueInput,
                SetValueWhere: SetValueWhere,
                // htmlReport: htmlReport,
                fileImports: fileImports,
                importConstructor: importConstructor,
                loadSuggest: loadSuggest,
                setLoadSuggest: setLoadSuggest,
                reMapToGetIdSuggest: reMapToGetIdSuggest,
                reMapFoDataTable: reMapFoDataTable,
                includeQuery: includeQuery,
                datatable: datatable
            }

            let fileWrite = structureScreen(objectAll);
            let fileReportWrite = structureReport();
            let fileHtmlWrite = structureHtmlReport(htmlReport);
            let fileCssWrite = structureCssReport();


            //Start write file
            let nameOfPath = 'docs/files/front/tables/report/' + parsedFileName + '-report/'
            ensureDirectoryExistence(nameOfPath);
            await fs.writeFile(nameOfPath + parsedFileName + '-report.component.ts', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
            //      createfile: './${parsedFileName}.component.html',
            await fs.writeFile(nameOfPath + parsedFileName + '-report.component.html', '', {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
            //      createfile: './${parsedFileName}.component.scss'
            await fs.writeFile(nameOfPath + parsedFileName + '-report.component.scss', '', {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });


            nameOfPath = 'docs/files/front/tables/report/' + parsedFileName + '-report/layout-' + parsedFileName + '-report/'
            ensureDirectoryExistence(nameOfPath);

            await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.ts', fileReportWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
            //      createfile: './${parsedFileName}.component.html',
            await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.html', fileHtmlWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
            //      createfile: './${parsedFileName}.component.scss'
            await fs.writeFile(nameOfPath + 'layout-' + parsedFileName + '-report.component.scss', fileCssWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    }
}