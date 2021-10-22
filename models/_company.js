import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('Company',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},company_name:{field:"company_name",type:"DataTypes.STRING(200)",allowNull:false,required:true,validate:{min:1,max:200},comment:"Company Name"},local_name:{field:"local_name",type:"DataTypes.STRING(200)",allowNull:false,required:true,validate:{min:1,max:200},comment:"Local Name"},short_name:{field:"short_name",type:"DataTypes.STRING(100)",allowNull:false,required:true,validate:{min:1,max:100},comment:"Short Name"},cld_code:{field:"cld_code",type:"DataTypes.STRING(20)",allowNull:false,required:true,validate:{min:1,max:20},comment:"CLD Code"},last_update:{field:"last_update",type:"DataTypes.date",allowNull:false,required:true,validate:{isDate:true,notNull:true},comment:"Update Date"},registered_address:{field:"registered_address",type:"DataTypes.STRING(200)",allowNull:true,required:false,validate:{min:0,max:200},comment:"Registered Address"},incorporation_date:{field:"incorporation_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Incorporation Date"},entry_group_date:{field:"entry_group_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Date of entry in the Aperam's Group"},closing_date:{field:"closing_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Closing Date"},main_object:{field:"main_object",type:"DataTypes.STRING(100)",allowNull:true,required:false,validate:{min:0,max:100},comment:"Company Main Object"},immatriculation_number:{field:"immatriculation_number",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"Immatriculation Number & Place"},vat_number:{field:"vat_number",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"VAT Number"},duration:{field:"duration",type:"DataTypes.STRING(50)",allowNull:true,required:false,validate:{min:0,max:50},comment:"Company Duration"},maximum_date:{field:"maximum_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Maximum date for Board’s Annual Meeting"},secretary_id:{field:"secretary_id",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"Company Secretary Name (Internal)"},law_firm:{field:"law_firm",type:"DataTypes.STRING(100)",allowNull:true,required:false,validate:{min:0,max:100},comment:"Law Firm (External)"},currency_id:{field:"currency_id",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"Currency"},subscribed_capital:{field:"subscribed_capital",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"Subscribed Capital"},agent_id:{field:"agent_id",type:"DataTypes.INTEGER",allowNull:true,required:false,validate:{isNumeric:true},comment:"Statutory Legal Representative & Chairman Name"},designation_date:{field:"designation_date",type:"DataTypes.date",allowNull:false,required:true,validate:{isDate:true,notNull:true},comment:"Designation Date"},expiry_date:{field:"expiry_date",type:"DataTypes.date",allowNull:false,required:true,validate:{isDate:true,notNull:true},comment:"Expiry Date"},reappointment_date:{field:"reappointment_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Reappointment Date"},removal_date:{field:"removal_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Removal from the office Date"}}    ).schema(schema);

    model.associate = (models) => {
model.hasMany( models.secretary_id, { foreignKey: 'secretary_id' });model.hasMany( models.currency_id, { foreignKey: 'currency_id' });model.hasMany( models.agent_id, { foreignKey: 'agent_id' });   
    };

    return model;

};

module.exports = Item;