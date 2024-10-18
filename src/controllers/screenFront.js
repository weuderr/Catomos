const fs = require("fs");
const { ensureDirectoryExistence, camelCaseLetter, upSpaceLetter, upAllFistLetter, createFile, castCamelCaseToFileName} = require("../lib/Utils");

// Função para criar o arquivo de criação/edição
const makeCreateFile = async (parsedFileName, className, nameWithSpace, data) => {
    // Variáveis para armazenar partes do código
    let fields = JSON.parse(data);
    let fileEnum = [];
    let inputs = ``;
    let form = ``;
    let cont = 0;
    let close = true;
    let select = '';
    let loadSuggest = "";
    let importConstructor = "";
    let fileImports = "";
    let includeVariables = "";
    let mapToGetIdSuggest = "";
    let mapToGetValue = "";
    let mapToGetIdSelect = "";

    // Processamento dos campos para gerar código
    fields.forEach(function (field, index) {
        const nameAttribute = camelCaseLetter(field['Atributo']);
        const nameAttributeAllUp = upAllFistLetter(camelCaseLetter(field['Atributo']));
        const displayName = upSpaceLetter(field['displayName'] || field['Atributo']);
        select += ` '${nameAttribute}',`;
        if (cont++ === 0) {
            close = false;
            form += `{ cols: [\n`;
        }

        form += `this.input${nameAttributeAllUp}.getField(),\n`;
        if (field['Tipo'] === 'date') {
            inputs += `input${nameAttributeAllUp} = new WebixInputDate('${nameAttribute}', '${displayName}', { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;
            mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;
        } else if (field['Tipo'] === 'enum') {
            // Definição do enum para criação do arquivo
            fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
                JSON.stringify(field['Observacoes'].split(',').map(i => {
                    return { id: i.replace(/'/g, '').replace(/'/g, ' '), value: i.replace(/'/g, '').replace(/'/g, ' ') }
                }))}; \n/*${field['Descricao']}*/\n
                        export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
                          if (item.id !== null) return { ...item }
                        })
                    `]);

            fileImports += `import { ${nameAttribute}Enum } from "../../../../enum/${nameAttribute}.enum";\n`;

            inputs += `input${nameAttributeAllUp} = new WebixSelect('${nameAttribute}', '${displayName}', ${nameAttribute}Enum, { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;
            mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id == item.${nameAttribute});
                             ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
            mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value == item.${nameAttribute});
                             ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;
        } else if (field['Observacoes'].toLowerCase().includes('foreign key')) {
            inputs += `input${nameAttributeAllUp} = new WebixSuggest('${nameAttribute}', '${displayName}', { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;

            const nameService = upAllFistLetter(camelCaseLetter(field['Tabela']));
            const nameServiceAllUp = castCamelCaseToFileName(nameService);

            if(!fileImports.includes(`import {WebixSuggest} from "../../../../classes/webix.suggest";`))
                fileImports += `import {WebixSuggest} from "../../../../classes/webix.suggest";\n`;
            fileImports += `import { ${nameService}Service } from '../../../../services/${nameServiceAllUp}-service/${nameServiceAllUp}-service';\n`;

            includeVariables += `private ${nameAttribute}Data: any = [];\n`;
            mapToGetIdSuggest += `this.suggestValues.${nameAttribute} ? item.${nameAttribute} = this.suggestValues.${nameAttribute} : item.${nameAttribute} = this.${nameAttribute}Data.find(select => select.value == item.${nameAttribute}).id;\n`;
            if (importConstructor.indexOf(`private _${nameService}Service`) === -1) {
                importConstructor += `private _${nameService}Service: ${nameService}Service,\n`;
            }
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
                            this.input${nameAttributeAllUp}.setSuggest(this.${nameAttribute}Data, {
                                onValueSuggest: (item) => {
                                    this.suggestValues.${nameAttribute} = item.id;
                                },
                            });
                        }
                        //End load ${nameService}\n
                        `
            }
            mapToGetValue += `const ${nameAttribute} = this.${nameAttribute}Data.find( select => select.id == item.${nameAttribute});
                        ${nameAttribute}? item.${nameAttribute}= ${nameAttribute}.value : '';\n`;
        } else {
            if(field['Tipo'] === 'boolean') {
                inputs += `input${nameAttributeAllUp} = new WebixSwitch('${nameAttribute}', '${displayName}', { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;
            } else if(field['Tipo'] === 'intger') {
                inputs += `input${nameAttributeAllUp} = new WebixNumber('${nameAttribute}', '${displayName}', { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;
            } else {
                inputs += `input${nameAttributeAllUp} = new WebixInput('${nameAttribute}', '${displayName}', { required: ${(field['Obrigatoriedade'] === 'sim')} }, { ${field['Tipo'] === 'varchar' ? 'attributes: { maxlength: ' + field['Tamanho'] + ' }, ' : ''} placeholder: '${field['Descricao'].replace(/\n/g, '')}' });\n`;
            }
        }

        if (cont === 3) {
            close = true;
            cont = 0;
            form += `] },`;
        }
    }.bind(this));
    form += `\nthis.inputSituation.getField()`;
    if (!close) {
        form += `] },\n`;
    }
    inputs += `inputSituation = new WebixSelect('situation', 'Situação', AtivoInativoFilter, { required: false }, { width: 120, disabled: false, hidden: true });\n`;
    includeVariables += `private suggestValues: any = {};\n`;
    let setLoadSuggest = "";
    if (loadSuggest) {
        setLoadSuggest = `async loadSuggests() {
                    const simpleWhere = "where="+JSON.stringify({situation: 'A'});\n
                    ${loadSuggest}\n
                    loadingHide();\n
                }`;
    }
    const reMapFoDataTable = `.map( (item) => {
                    ${mapToGetValue}
                    return item;
                })`;


    let createCreateStructure = `import { Component } from "@angular/core";
import { WebixInput } from "src/app/classes/webix.input";
import { WebixInputDate } from "src/app/classes/webix.inputDate";
import { WebixInputDate_B } from "src/app/classes/webix.inputDate_B";
import { WebixPaginate } from "src/app/classes/webix.paginate";
import { WebixSelect } from "src/app/classes/webix.select";
import { WebixSwitch } from "src/app/classes/webix.switch";
import { WebixTextarea } from "src/app/classes/webix.textarea";
import { WebixToolbar } from "src/app/classes/webix.toolbar";
import { WebixVideo } from "src/app/classes/webix.video";
import { AtivoInativoFilter } from "../../../../enum/ativoInativo";
import { GoogleSheetsService } from "src/app/services/google-sheets/google-sheets.service";
import { I18nService } from "src/app/services/i18n/i18n.service";
import { LocalStorageService } from "src/app/services/local-storage/local-storage.service";
import { MessageService } from "../../../../services/message/message.service";
import { QuerysBuilderService } from "../../../../services/querys-builder/querys-builder.service";
import { WebixService } from "../../../../services/webix/webix.service";
import { AbstractWindowComponent } from "../../../abstract-window.component";
import {loadingHide, loadingShow} from "../../../../classes/DefaultAngularComponentsUtil";
import { ${className}Service } from "../../../../services/${parsedFileName}-service/${parsedFileName}-service";
${fileImports}


@Component({
  selector: 'app-${parsedFileName}-create',
  templateUrl: './${parsedFileName}-create.component.html',
  styleUrls: ['./${parsedFileName}-create.component.scss']
})
export class ${className}CreateComponent extends AbstractWindowComponent {
  /*
   Declaração das variáveis do Webix
 */
  webixUi: any;
  webix: any;
  $$: any;
  ${includeVariables}
  private editMode: boolean = false;

  /*
    Esse array faz a busca nas informações que estão no banco
  */
  select = [${select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];

  /*
    Declara a paginação
  */
  paginate = new WebixPaginate("pagination", { size: 50, group: 5 });

  /*
    Armazena todos os dados
  */
  dataAll: any = [];

  /*
    Id do formulário é colocado numa variável para poder ser reutilizado no código abaixo
  */
  formId: string = 'Frm${className}';

  /**
  * Variável de leitura/edição dos campos
  */
  readonly = true;

  AtivoInativoFilter = AtivoInativoFilter.map(a => a.value = this.translate(a.value));

  /*
   Declaração dos campos para montar o formulário
  */
  ${inputs}

  /*
    Declaração da barra de ferramentas
  */
  toolbar = new WebixToolbar("toolbar", this.formId, [
    { view: "icon", icon: "fa fa-file-text-o", tooltip: "Novo", hidden: !this.editMode, click: () => { this._cancelOrClearConfirm(true); } },
    { view: "icon", icon: "fa fa-floppy-o", tooltip: "Salvar", click: () => this._save() },
    { view: "icon", icon: "fa fa-eraser", tooltip: "Limpar", click: () => this._cancelOrClearConfirm() },
    { view: "icon", icon: "fa fa-file-video-o", tooltip: "Tutorial", click: () => { this._loadTutorial(); } },
  ]);

  /*
    Declaração do vídeo tutorial
  */
  video = new WebixVideo("tutorial", "assets/videotutorial1.webm", () => { this.$$(this.video.getId()).close(); });

  constructor(
    private _webixService: WebixService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private mainService: ${className}Service,
    ${importConstructor}
  ) {
    super();
  }

  async preBuildWindow() {
    this.webix = this._webixService.getWebix();
    this.$$ = this._webixService.get$$();
  }

  async posBuildWindow() {
    await this._loadData();
  }

  async getWebixComponent() {
    ${setLoadSuggest !== "" ? 'await this.loadSuggests();' : ''}
    return {
      view: "scrollview",
      body: this.setForm${className}Inputs()
    };
  }

  /**
   * Retorna o objeto com as variáveis do formulário para dentro do webixUi
   */
  setForm${className}Inputs() {
    return {
      id: this.formId,
      view: "form",
      rows: [
        this.toolbar.getField(),
        ${form}
      ]
    };
  }


  /**
   * Carrega os dados da API
   */
  async _loadData() {
    loadingShow();
    const query = this._querysBuilderService.getSelect(this.select);
    const result: any = await this.mainService.get(query).toPromise();
    if (result.data.length > 0) {
      this.dataAll = result.data${reMapFoDataTable}.reverse();
      // Atualize os campos conforme necessário
    }
    loadingHide();
  }

  ${setLoadSuggest}

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
      this._messageService.show("Formulário Inválido", "error");
    }
  };

  /**
   * Envia os valores para API atualizar
   */
  _update(item) {
    item.createdAt ? delete item.createdAt : null;
    item.updatedAt ? delete item.updatedAt : null;
    item.deletedAt ? delete item.deletedAt : null;

    this.mainService.put(item.id, item).subscribe(
      () => _success(),
      (error) => _error(error)
    );

    const _success = () => {
      this._messageService.show('Atualizado com sucesso', 'success');
      this._cancelOrClear();
    };

    const _error = (error) => {
      console.error(error);
      this._messageService.show('Erro ao atualizar', 'error');
    };
  }

  /**
   * Envia os valores para API salvar
   */
  _create(item) {
    delete item.id;
    delete item.situation;

    this.mainService.post(item).subscribe(
      (success) => _success(success),
      (error) => _error(error)
    );

    const _success = (success) => {
      this._messageService.show('Cadastrado com sucesso', 'success');
      this._cancelOrClear();
    };

    const _error = (error) => {
      console.error(error);
      this._messageService.show('Erro ao cadastrar', 'error');
    };
  }

  /*
  * Desativa o formulário conforme a regra de negócio necessária
  */
  setReadOnly(value) {
    this.$$(this.formId).clearValidation();
    this.readonly = value;
    const elements = this.$$(this.formId).elements;

    for (let item in elements) {
      if (elements[item].data.view === "select") {
        this.$$(elements[item].data.id).define("disabled", value);
        this.$$(elements[item].data.id).refresh();
      } else {
        this.$$(elements[item].data.id).define("readonly", value);
        this.$$(elements[item].data.id).refresh();
      }
    }
  }

  /**
   * Cancela/Limpa o formulário
   */
  _cancelOrClear() {
    this.$$(this.formId).clearValidation();
    this.$$(this.formId).clear();
    this.setReadOnly(true);
  }

  _cancelOrClearConfirm(insertMode: boolean = false, callback = null) {
    const enabled = this.$$(this.formId).isEnabled();
    const dirty = this.$$(this.formId).isDirty();

    if (dirty && enabled) {
      this.webix.confirm("Tem certeza que deseja limpar o formulário atual?", (value) => {
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
   * Torna o vídeo tutorial visível
   */
  _loadTutorial() {
    this.webix.ui(this.video.getField()).show();
  }

  /**
   * Função de tradução
   */
  translate(key) {
    return this._i18nService.translate(key);
  }
  
}
`;


    const path = `docs/files/front/tables/${parsedFileName}/`;
    ensureDirectoryExistence(path);
    const createPath = `docs/files/front/tables/${parsedFileName}/create/`;
    ensureDirectoryExistence(createPath);

    createFile(`${createPath}${parsedFileName}-create.component.ts`, createCreateStructure);
    createFile(`${createPath}${parsedFileName}-create.component.html`, '');
    createFile(`${createPath}${parsedFileName}-create.component.scss`, '');
};


// Função para criar o arquivo de listagem
const makeListFile = async (parsedFileName, className, nameWithSpace, data) => {
// Variáveis para armazenar partes do código
    let fields = JSON.parse(data);
    let fileEnum = [];
    let datatable = ``;
    let form = ``;
    let cont = 0;
    let close = true;
    let select = '';
    let loadSuggest = "";
    let importConstructor = "";
    let fileImports = "";
    let includeVariables = "";
    let mapToGetIdSuggest = "";
    let mapToGetValue = "";
    let mapToGetIdSelect = "";

    // Processamento dos campos para gerar código
    fields.forEach(function (field, index) {
        const nameAttribute = camelCaseLetter(field['Atributo']);
        const nameAttributeAllUp = upAllFistLetter(nameAttribute);
        const displayName = upSpaceLetter(field['displayName'] || field['Atributo']);
        select += ` '${nameAttribute}',`;
        if (cont++ === 0) {
            close = false;
            form += `{ cols: [\n`;
        }
        form += `this.input${nameAttributeAllUp}.getField(),\n`;
        if (field['Tipo'] !== 'enum')
            datatable += `{ id: "${nameAttribute}", header: ["${displayName}", { content: "${field['Tipo'] !== "number" ? "textFilter" : "numberFilter"}" }], fillspace: true, sort: "${field['Tipo'] !== "number" ? "text" : "number"}" },\n`;
        else
            datatable += `{ id: "${nameAttribute}", header: ["${displayName}", { content: "textFilter" }], fillspace: true, sort: 'text', format: (value) => { return formatEnum(value, ${nameAttribute}Enum) } },\n`;
        if (field['Tipo'] === 'date') {
            mapToGetValue += `item.${nameAttribute} = new Date(item.${nameAttribute});\n`;
        } else if (field['Tipo'] === 'enum') {
            // Definição do enum para criação do arquivo
            fileEnum.push([nameAttribute, `export const ${nameAttribute}EnumFilter = ${
                JSON.stringify(field['Observacoes'].split(',').map(i => {
                    return { id: i.replace(/'/g, '').replace(/'/g, ' '), value: i.replace(/'/g, '').replace(/'/g, ' ') }
                }))}; \n/*${field['Descricao']}*/\n
                        export const ${nameAttribute}Enum = ${nameAttribute}EnumFilter.filter((item) => {
                          if (item.id !== null) return { ...item }
                        })
                    `]);

            fileImports += `import { ${nameAttribute}Enum } from "../../../../enum/${nameAttribute}.enum";\n`;

            mapToGetValue += `const ${nameAttribute}Id = ${nameAttribute}Enum.find( select => select.id == item.${nameAttribute});
                             ${nameAttribute}Id? item.${nameAttribute} = ${nameAttribute}Id.value : null;\n`;
            mapToGetIdSelect += `const ${nameAttribute}Value = ${nameAttribute}Enum.find( select => select.value == item.${nameAttribute});
                             ${nameAttribute}Value? item.${nameAttribute} = ${nameAttribute}Value.id : null;\n`;
        } else if (field['Observacoes'] === 'foreign key') {
            const nameService = field['Tabela'].replace(' ', '')
            const nameServiceAllUp = nameService.charAt(0).toLowerCase() + nameService.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase();
            fileImports += `import { ${nameService}Service } from '../../../../services/${nameServiceAllUp}-service/${nameServiceAllUp}-service';\n`;

            includeVariables += `private ${nameAttribute}Data: any = [];\n`;
            mapToGetIdSuggest += `this.suggestValues.${nameAttribute} ? item.${nameAttribute} = this.suggestValues.${nameAttribute} : item.${nameAttribute} = this.${nameAttribute}Data.find(select => select.value == item.${nameAttribute}).id;\n`;
            if (importConstructor.indexOf(`private _${nameService}Service`) === -1) {
                importConstructor += `private _${nameService}Service: ${nameService}Service,\n`;
            }
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
                            this.input${nameAttributeAllUp}.setSuggest(this.${nameAttribute}Data, {
                                onValueSuggest: (item) => {
                                    this.suggestValues.${nameAttribute} = item.id;
                                },
                            });
                        }
                        //End load ${nameService}\n
                        `
            }
            mapToGetValue += `const ${nameAttribute} = this.${nameAttribute}Data.find( select => select.id == item.${nameAttribute});
                        ${nameAttribute}? item.${nameAttribute}= ${nameAttribute}.value : '';\n`;
        }
        if (cont === 3) {
            close = true;
            cont = 0;
            form += `] },`;
        }
    }.bind(this));
    form += `\nthis.inputSituation.getField()`;
    if (!close) {
        form += `] },\n`;
    }
    includeVariables += `private suggestValues: any = {};\n`;
    let setLoadSuggest = "";
    if (loadSuggest) {
        setLoadSuggest = `async loadSuggests() {
                    const simpleWhere = "where="+JSON.stringify({situation: 'A'});\n
                    ${loadSuggest}\n
                    loadingHide();\n
                }`;
    }

    const reMapFoDataTable = `.map( (item) => {
                    ${mapToGetValue}
                    return item;
                })`;


    let listingStructure = `import { Component } from "@angular/core";
import { MessageService } from "../../../../services/message/message.service";
import { WebixDatatable } from "src/app/classes/webix.datatable";
import { WebixToolbar } from "src/app/classes/webix.toolbar";
import { WebixPaginate } from "src/app/classes/webix.paginate";
import { loadingShow, loadingHide } from "src/app/classes/Util";
import { QuerysBuilderService } from "../../../../services/querys-builder/querys-builder.service";
import { ${className}Service } from "../../../../services/${parsedFileName}-service/${parsedFileName}-service";
import { WebixService } from "../../../../services/webix/webix.service";
import { GoogleSheetsService } from "src/app/services/google-sheets/google-sheets.service";
import * as moment from "moment";
import { LocalStorageService } from "src/app/services/local-storage/local-storage.service";
import { I18nService } from "src/app/services/i18n/i18n.service";
import { AbstractWindowComponent } from "../../../abstract-window.component";
${fileImports}

@Component({
  selector: "app-${parsedFileName}-list",
  templateUrl: "./${parsedFileName}-list.component.html",
  styleUrls: ["./${parsedFileName}-list.component.scss"]
})
export class ${className}ListComponent extends AbstractWindowComponent {
  // Declaração das variáveis do Webix
  webixUi: any;
  webix: any;
  $$: any;
  ${includeVariables}

  // Declaração das colunas selecionadas
  select = [${select} 'unit', 'user', 'situation', 'createdAt', 'updatedAt'];

  // Declara a paginação
  paginate = new WebixPaginate('pagination', { size: 50, group: 5 });

  // Armazena todos os dados
  dataAll: any = [];

  // Declaração da barra de ferramentas
  toolbar = new WebixToolbar('toolbar', null, [
    { view: "icon", icon: "fa fa-refresh", tooltip: "Atualizar", click: () => { this._loadData(); this._messageService.show('Atualizado com sucesso!', 'success') } },
    { view: "icon", icon: "fa fa-file-excel-o", tooltip: "Exportar", click: async () => { await this._exportSheets() } },
  ]);

  // Declaração da tabela
  datatable = new WebixDatatable(
    '${className}',
    null,
    [
      ${datatable}
      {
        id: "actions",
        header: this.translate("Ações"),
        template: (obj) => {
          return \`<span class='view webix_icon fa-eye'></span>\`;
        },
        fillspace: true,
      },
    ],
    {
      pager: this.paginate.getId(),
      footer: true,
      onClick: {
        view: (ev, elem) => {
          this.viewElement(elem.row);
        },
      },
    }
  );

  constructor(
    private _webixService: WebixService,
    private _i18nService: I18nService,
    private _googleSheetsService: GoogleSheetsService,
    private _querysBuilderService: QuerysBuilderService,
    private _localStorageService: LocalStorageService,
    private _messageService: MessageService,
    private service: ${className}Service,
    ${importConstructor}
  ) {
    super();
  }

  async preBuildWindow() {
    this.webix = this._webixService.getWebix();
    this.$$ = this._webixService.get$$();
    this.datatable.footerInit();
  }

  async posBuildWindow() {
    await this._loadData();
  }

  closeWindow(): void {
    super.closeWindow();
  }

  async getWebixComponent() {
    return {
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
            }
          ]
        }
      ]
    };
  }

  /**
   * Carrega os dados da API
   */
  async _loadData() {
    loadingShow();
    const query = this._querysBuilderService.getSelect(this.select);
    const result: any = await this.mainService.get(query).toPromise();
    if (result.data.length > 0) {
      this.dataAll = result.data${reMapFoDataTable}.reverse();
      this.datatable.setData(this.dataAll);
    }
    loadingHide();
    this.subscribeEvents();
  }

  ${setLoadSuggest}

  subscribeEvents() {
    this.$$(this.datatable.getId()).attachEvent("onAfterSelect", (elem) => {
      if (elem.column !== 'actions') {
        this.viewElement(elem.row);
      }
    });
  }

  viewElement(row) {
    const item = this.dataAll.find(select => select.id === row);
    // Aqui você pode implementar a lógica para visualizar os detalhes do item
    this._messageService.show(\`Visualizar item: \${item.id}\`, 'info');
  }
  
  
  /**
   * Exporta os dados para o Google Sheets
   */
  async _exportSheets() {
    if (!this.dataAll) {
      this._messageService.show('Nada a exportar', 'error');
      return;
    }

    loadingShow();

    this._googleSheetsService.createSheetFromDatatableAndOpen(
      this.$$(this.datatable.getId()),
      \`Registros - ${nameWithSpace} \${moment(new Date()).format('DD/MM/YYYY hh:mm:ss')}\`,
      \`Exportacao / SAIA / Registros\`,
      this._localStorageService.getItem('user').email,
      '${nameWithSpace}',
      undefined,
      undefined,
      () => loadingHide(),
      () => {
        loadingHide();
        this._messageService.show('Erro ao gerar o relatório.', 'error');
      },
      { ignoreColumnFooter: true }
    );
  }

`;

    const path = `docs/files/front/tables/${parsedFileName}/`;
    ensureDirectoryExistence(path);
    const listingPath = `docs/files/front/tables/${parsedFileName}/list/`;
    ensureDirectoryExistence(listingPath);

    createFile(`${listingPath}${parsedFileName}-list.component.ts`, listingStructure);
    createFile(`${listingPath}${parsedFileName}-list.component.html`, '');
    createFile(`${listingPath}${parsedFileName}-list.component.scss`, '');
};

// Função para criar o arquivo de roteamento
const makeRoutingFile = async (parsedFileName, className) => {
    const routingStructure = `
        import { Routes } from "@angular/router";
        import { ${className}CreateComponent } from "./create/${parsedFileName}-create.component";
        import { ${className}ListComponent } from "./list/${parsedFileName}-list.component";
        
        export const ${className}Routes: Routes = [
          { path: "list", component: ${className}ListComponent },
          { path: "create", component: ${className}CreateComponent }
        ];
    `;

    const routingPath = `docs/files/front/tables/${parsedFileName}/`;

    createFile(`${routingPath}${parsedFileName}-routing.ts`, routingStructure);
};



exports.makeFileFront = async (parsedFileName, className, fileName, nameWithSpace, data) => {
    await makeCreateFile(parsedFileName, className, nameWithSpace, data);
    await makeListFile(parsedFileName, className, nameWithSpace, data);
    await makeRoutingFile(parsedFileName, className);
};