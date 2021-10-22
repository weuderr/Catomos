import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('SupervisoryBoard',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},company_id:{field:"company_id",type:"DataTypes.INTEGER",allowNull:false,required:true,validate:{isNumeric:true},comment:"Company Id"},agent_id:{field:"agent_id",type:"DataTypes.INTEGER",allowNull:false,required:true,validate:{isNumeric:true},comment:"Component Name"},designation_date:{field:"designation_date",type:"DataTypes.date",allowNull:false,required:true,validate:{isDate:true,notNull:true},comment:"Designation Date"},expiry_date:{field:"expiry_date",type:"DataTypes.date",allowNull:false,required:true,validate:{isDate:true,notNull:true},comment:"Expiry Date"},reappointment_date:{field:"reappointment_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Reappointment Date"},removal_date:{field:"removal_date",type:"DataTypes.date",allowNull:true,required:false,validate:{isDate:true,notNull:false},comment:"Removal from the office Date"}}    ).schema(schema);

    model.associate = (models) => {
model.hasMany( models.company_id, { foreignKey: 'company_id' });model.hasMany( models.agent_id, { foreignKey: 'agent_id' });   
    };

    return model;

};

module.exports = Item;