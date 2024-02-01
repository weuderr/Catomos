const fs = require("fs");
const {ensureDirectoryExistence, camelCaseLetter, upSpaceLetter, upAllFistLetter} = require("../lib/Utils");

exports.makeFileFront = async (parsedFileName, className, fileName, nameWithSpace, data) => {
    if (data) {
        const fields = JSON.parse(data);
        let doFile = false
        fields.forEach(function (field, index) {
            if (index === 0 && field['Observacoes'] === 'primary key')
                doFile = true
        });
        if (doFile) {
            const structure = (inputs, datatable, form, select, setLoadSuggest, importConstructor, importService, includeVariables, reMapToGetIdSuggest, reMapToGetValue, mapToGetIdSelect) => {
                return `import { Component } from '@angular/core';
import { MessageService } from '../../../services/message/message.service';
import { WebixInput } from 'src/app/classes/webix.input';
import { WebixToolbar } from 'src/app/classes/webix.toolbar';
import { WebixSelect } from 'src/app/classes/webix.select';
import { WebixDatatable } from 'src/app/classes/webix.datatable';
import { ${className}Service } from '../../services/${parsedFileName}-service/${className}Service';
import { QuerysBuilderService } from '../../../services/querys-builder/querys-builder.service';
import { WebixService } from '../../../services/webix/webix.service';
import { WebixPaginate } from 'src/app/classes/webix.paginate';
import { WebixVideo } from 'src/app/classes/webix.video';
import { WebixTextarea } from 'src/app/classes/webix.textarea';
import { ProfileService } from 'src/app/services/profile/profile.service';
import { loadingShow, loadingHide } from 'src/app/classes/Util';
import { GoogleSheetsService } from 'src/app/services/google-sheets/google-sheets.service';
import * as moment from 'moment';
import { AtivoInativoFilter } from '../../enum/AtivoInativo';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { I18nService } from 'src/app/services/i18n/i18n.service';
import {WebixSelect} from 'src/app/classes/webix.select';
import {WebixSuggest} from "../../../classes/webix.suggest";
import {WebixInputDate} from "../../../classes/webix.inputDate";
${importService}

@Component({
  selector: 'app-${parsedFileName}',
  templateUrl: './${parsedFileName}.component.html',
  styleUrls: ['./${parsedFileName}.component.scss']
})
export class ${className}Component {
  /*
   Declaração das variaveis do Webix, as mesmas são setadas pelo serviço WebixService
 */
  webixUi: any;
  webix: any;
  $$: any;
  ${includeVariables} 

  /*
    Esse array faz a busca nas informações que estão no banco, é o mesmo select que se faz na tabela
  */
  select = [${select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];

  /*
    Declara a páginação 
  */
  paginate = new WebixPaginate('pagination', { size: 50, group: 5 });

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
  accordionFormId: string = 'accordion${className}';

  /**
  * Variavel de leitura/edição dos campos
  */
  readonly = true;

  AtivoInativoFilter = AtivoInativoFilter.map(a => a.value = this.translate(a.value));
  
  /*
   Declaração dos campos para montar o formulário
  */
  ${inputs}

  /*
    Declaração da barra de tarefas que fica localizado no topo
  */
  toolbar = new WebixToolbar('toolbar', this.formId, [
    { view: "icon", icon: "fa fa-file-text-o", tooltip: "Novo", click: () => { this._cancelOrClearConfirm(true) } },
    { view: "icon", icon: "fa fa-floppy-o", tooltip: "Salvar", click: () => this._save() },
    { view: "icon", icon: "fa fa-eraser", tooltip: "Limpar", click: () => this._cancelOrClearConfirm() },
    { view: "icon", icon: "fa fa-file-excel-o", tooltip: "Exportar", click: async () => { await this._exportSheets() } },
    { view: "icon", icon: "fa fa-refresh", tooltip: "Atualizar", click: () => { this._loadData(); this._messageService.show('Atualizado com sucesso!', 'success') } },
    { view: "icon", icon: "fa fa-file-video-o", tooltip: "Tutorial", click: () => { this._loadTutorial() } },
  ])

  /*
    Declaração da tabela
  */
  datatable = new WebixDatatable(
    '${className}',
    this.formId,
    [
        ${datatable}
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
        view: (ev, elem) => {
          this.viewElement(elem.row);
        },
        edit: (ev, elem) => {
          this._checkFormDuty(() => {
            const item = this.dataAll.find(select => select.id === elem.row);
            this.$$(this.accordionFormId).expand();
            this.$$(this.inputId.getId()).show();
            this.$$(this.inputId.getId()).setValue(item.id);
            this.$$(this.inputSituation.getId()).show();
            this._edit(item);
          });
        },
        remove: (ev, elem) => {
          const item = this.dataAll.find(select => select.id === elem.row);
          this.webix.confirm(this.translate('Tem certeza que deseja remover o registro ') + item.id + ' - ' + item.description + '?', (value) => {
            if (value) {
              this.remove(item);
            }
          })
        }
      }
    }
  );

  /*
    Declaração do video tutorial
  */
  video = new WebixVideo('tutorial', "assets/videotutorial1.webm", () => { this.$$(this.video.getId()).close() })

  constructor(
    private _webixService: WebixService,
    private _profileService: ProfileService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private service: ${className}Service,
    ${importConstructor}
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
                id: this.accordionFormId,
                header: this.translate("Cadastro"),
                collapsed: true,
                body: {
                  rows: [
                    this.setForm${className}Inputs()
                  ]
                }
              },
              { height: 15 },
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
      ${setLoadSuggest !== "" ? 'await this.loadSuggests();' : ''}
      await this._loadData();
      loadingHide();
    })
  }

  /**
   * Retorna o objeto com as variaveis do formulário para dentro do webixUi
   */
  setForm${className}Inputs() {
    return {
      id: this.formId,
      view: 'form',
      rows: [ 
        ${form}
      ]
    }
  }

  /**
   * Ao ser chamada ela recarrega todas as informações fazendo uma nova requisição na API
   */
  async _loadData() {
    loadingShow();
    const query = this._querysBuilderService.getSelect(this.select);
    const result: any = await this.service.get(query).toPromise();
    if(result.data.length > 0) {
        this.dataAll = result.data${reMapToGetValue}.reverse();
        this.datatable.setData(this.dataAll);
        this.$$(this.accordionFormId).collapse();
    }
    loadingHide();
    this.subscribeEvents();
  }
  
  ${setLoadSuggest}

  subscribeEvents() {
    this.$$(this.datatable.getId()).attachEvent("onAfterSelect", (elem) => {
      if (this.$$(this.formId).isEnabled() && elem.column !== 'actions') {
        this.viewElement(elem.row);
      } else if (elem.column !== 'actions') {
        this.viewElement(elem.row);
      }
    });
  }

  viewElement(row) {
    if (!this.readonly) {
      if (this.$$(this.formId).isDirty() && this.$$(this.formId).isEnabled()) {
        this.webix.confirm(this.translate('Tem certeza que deseja cancelar a edição/inclusão para o registro ativo?'), (value) => {
          if (value) {
            this.showView(row);
          }
        })
      } else {
        this.showView(row);
      }
    } else {
      this.showView(row);
    }
  }

  showView(row) {
    this.setReadOnly(true);
    const item = this.dataAll.find(select => select.id === row);
    const form = this.$$(this.formId)
    form.setValues(item);
    this.$$(this.inputId.getId()).show();
    this.$$(this.inputId.getId()).setValue(item.id);
    this.$$(this.inputSituation.getId()).show();
    this.$$(this.accordionFormId).expand();
    form.setDirty(false);
  }
  /*
  * Desativa o formulário conforme a regra de negocio necessaria
  */
  setReadOnly(value) {
    this.$$(this.formId).clearValidation();
    this.readonly = value;
    const elements = this.$$(this.formId).elements;
    for (let item in elements) {
      if (elements[item].data.view === 'select') {
        this.$$(elements[item].data.id).define('disabled', value);
        this.$$(elements[item].data.id).refresh();
      } else {
        this.$$(elements[item].data.id).define('readonly', value);
        this.$$(elements[item].data.id).refresh();
      }
    }
    this.$$(this.accordionFormId).expand();
  }

  /*
  * Torna o video tutorial visivel
  */
  _loadTutorial() {
    this.webix.ui(this.video.getField()).show();
  }

  /**
   * Inicia o processo de salvar e validar as informações do formulário
   */
  _save = () => {
    const form = this.$$(this.formId);
    const item = form.getValues();
    const isValid = form.validate();

    if (isValid) {
      ${mapToGetIdSuggest}
      if (item.id > 0) {
        this._update(item);
      } else {
        this._create(item);
      }
    } else {
      this._messageService.show('Formulário Inválido', 'error');
    }
  }

  /*
  * Envia os valores para API atualizar
  */
  _update(item) {
    item.createdAt ? delete item.createdAt : null;
    item.updatedAt ? delete item.updatedAt : null;
    item.deletedAt ? delete item.deletedAt : null;

    this.service.put(item.id, item).subscribe(
      () => _success(),
      (error) => _error(error)
    )

    const _success = () => {
      const datatable = this.$$(this.datatable.getId());
      datatable.updateItem(item.id, item);
      const index = this.dataAll.findIndex( select => select.id == item.id);
      this.dataAll[index] = item;
      this._messageService.show('Atualizado com sucesso', 'success');
      this._cancelOrClear();
      this._loadData();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao atualizar', 'error');
    }
  }

  /**
   * Envia os valores para API salvar
   */
  _create(item) {
    delete item.id;
    delete item.situation;

    this.service.post(item).subscribe(
      (success) => _success(success),
      (error) => _error(error)
    );

    const _success = (success) => {
      this.$$(this.datatable.getId()).add(success.data, 0);
      this.dataAll.unshift(success.data);
      this._messageService.show('Cadastrado com sucesso', 'success');
      this._cancelOrClear();
      this._loadData();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao cadastrar', 'error');
    }
  }

  /*
  * Inicia o processo de edição, inserindo as informações no formulário
   */
  _edit(item) {
    const form = this.$$(this.formId)
    form.setValues(item);
    this.setReadOnly(false);
  }

  /**
   * Confirma se realmente é para remover e exclui as informações na API
   */
  remove(item) {
    this.service.delete(item.id).subscribe(
      () => _success(),
      (error) => _error(error)
    )

    const _success = () => {
      this.$$(this.datatable.getId()).remove(item.id);
      this._cancelOrClear();
      this._messageService.show('Removido com sucesso', 'success');
      this.$$(this.accordionFormId).collapse();
    }

    const _error = (error) => {
      console.error(error)
      this._messageService.show('Erro ao remover', 'success');
    }
  }

  /*
 * Verifica se o formulario esta sujo antes de realizar a ação
 */
  _checkFormDuty(callback) {
    if (this.$$(this.formId).isDirty() && this.$$(this.formId).isEnabled()) {
      this.webix.confirm(this.translate('Tem certeza que deseja cancelar a edição/inclusão para o registro ativo?'), (value) => {
        if (value) {
          callback();
        }
      })
    } else {
      callback();
    }
  }

  /**
   * Cancela/Limpa o formulário
   */
  _cancelOrClear() {
    this.$$(this.formId).clearValidation();
    this.$$(this.formId).clear();
    this.$$(this.inputId.getId()).hide();
    this.$$(this.inputSituation.getId()).hide();
    this.setReadOnly(true)
  }

  _cancelOrClearConfirm(insertMode: boolean = false, callback = null) {
    const enabled = this.$$(this.formId).isEnabled();
    const dirty = this.$$(this.formId).isDirty();

    if (dirty && enabled) {
      this.webix.confirm(this.translate('Tem certeza que deseja limpar o formulário atual?'), (value) => {
        if (value) {
          this._cancelOrClear();

          if (insertMode) {
            this.setReadOnly(false);
          }

          if (callback) {
            callback();
          }
        }
      });
    } else if ((!dirty && enabled) || !enabled) {
      this._cancelOrClear();

      if (insertMode) {
        this.setReadOnly(false);
      }

      if (callback) {
        callback();
      }
    }
  }



  /**
    * Exportar para o Sheets
    */
  async _exportSheets() {
    if (!this.dataAll) {
      this._messageService.show('Nada a exportar', 'error');
      return;
    }

    loadingShow();

    this._googleSheetsService.createSheetFromDatatableAndOpen(this.$$(this.datatable.getId()),
      \`Registros - ${nameWithSpace} \${moment(new Date()).format('DD/MM/YYYY hh:mm:ss')}\`,
      \`Exportacao/SAIA/Registros\`,
      this._localStorageService.getItem('user').email,
      '${nameWithSpace}', undefined, undefined, () => loadingHide(), () => {
        loadingHide();
        this._messageService.show('Erro ao gerar o relatório.', 'error');
      }, { ignoreColumnFooter: true });
  }
  
    /**
    * Exportar para o Excel
    */
    translate(key) {
        return this._i18nService.translate(key);
    }
}`;
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
            let importConstructor = ""
            let fileImports = ""
            let includeVariables = ""
            let mapToGetIdSuggest = ""
            let mapToGetValue = ""
            let mapToGetIdSelect = ""

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
                    form += `this.inputId.getField(),\n`;
                    //regex to remove break lines
                    // const parten = /\n/g;
                    datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: false, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
                    //TODO INSERT TITLE
                    inputs += `inputId = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { hidden: true, width: 200, disabled: true, ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                } else {
                    form += `this.input${nameAttributeAllUp}.getField(),\n`;
                    if (field['Tipo'] !== 'enum')
                        datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "${field['Tipo'] !== "number" ? "textFilter" : "numberFilter"}" }], fillspace: true, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
                    else
                        datatable += `{ id: "${nameAttribute}", header: [this.translate("${displayName}"), { content: "textFilter" }], fillspace: true, sort: 'text', format: (value) => { return formatEnum(value, ${nameAttribute}Enum) } },\n`;
                    if (field['Tipo'] === 'date') {
                        inputs += `input${nameAttributeAllUp} = new WebixInputDate('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                        mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;
                    } else if (field['Tipo'] === 'enum') {
                        // START DEFINE O ENUM PARA CRIACAO DO ARQUIVO
                        fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
                            JSON.stringify(field['Observacoes'].split(',').map(i => {
                                return {id: i.replace(/'/g, '').replace(/'/g, ' '), value: i.replace(/'/g, '').replace(/'/g, ' ')}
                            }))}; \n/*${field['Descricao']}*/\n
                            export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
                              if (item.id !== null) return {...item}
                            })
                        `]);

                        fileImports += `import {${nameAttribute}Enum} from "../../../enum/${nameAttribute}.enum";\n`;

                        // END DEFINE O ENUM PARA CRIACAO DO ARQUIVO

                        inputs += `input${nameAttributeAllUp} = new WebixSelect('${nameAttribute}', this.translate('${displayName}'), ${nameAttribute}Enum, { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                        //filter datatable by enum
                        mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id == item.${nameAttribute});
                                 ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
                        mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value == item.${nameAttribute});
                                 ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;
                    } else if (field['Observacoes'] === 'foreign key') {
                        inputs += `input${nameAttributeAllUp} = new WebixSuggest('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;

                        const nameService = field['Tabela'].replace(' ', '')
                        //Replace up letter for same letter lower and underscore not can start with underscore
                        const nameServiceAllUp = nameService.charAt(0).toLowerCase() + nameService.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
                        fileImports += `import { ${nameService}Service } from '../../services/${nameServiceAllUp}-service/${nameService}Service';\n`;

                        includeVariables += `private ${nameAttribute}Data: any = [];\n`;
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
                                await this.input${nameAttributeAllUp}.setSuggest(this.${nameAttribute}Data, {
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
                    } else {
                        inputs += `input${nameAttributeAllUp} = new WebixInput('${nameAttribute}', this.translate('${displayName}'), { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: this.translate('${field['Descricao'].replace(/\n/g, '')}') });\n`;
                    }

                }
                if (cont === 3) {
                    close = true
                    cont = 0;
                    form += `] },`;
                }
            }.bind(this));
            form += `\nthis.inputSituation.getField()`
            if (!close) {
                form += `] },\n`;
            }
            inputs += `inputSituation = new WebixSelect('situation', this.translate('Situação'), AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
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
            let fileWrite = structure(inputs, datatable, form, select, setLoadSuggest, importConstructor, fileImports, includeVariables, reMapToGetIdSuggest, reMapFoDataTable, mapToGetIdSelect)

            //Start write file
            let nameOfPath = 'docs/files/front/tables/' + parsedFileName + '/'
            ensureDirectoryExistence(nameOfPath);
            await fs.writeFile(nameOfPath + parsedFileName + '.component.ts', fileWrite, {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });

            //      createfile: './${parsedFileName}.component.html',
            await fs.writeFile(nameOfPath + parsedFileName + '.component.html', '', {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });

            //      createfile: './${parsedFileName}.component.scss'
            await fs.writeFile(nameOfPath + parsedFileName + '.component.scss', '', {flag: 'w'}, function (err) {
                if (err) {
                    return console.log(err);
                }
            });

            // createfile: './${parsedFileName}Enum.ts'
            fileEnum.forEach((file) => {
                fs.writeFile('docs/files/front/enum/' + file[0] + '.enum.ts', file[1], {flag: 'w'}, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                });
            });


        }
    }
}