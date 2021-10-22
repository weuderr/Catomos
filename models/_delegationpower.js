import ApiConfig from '../../config/api.conf';

const Item = (sequelize, DataTypes) => {

    // Define environment object
    const config = new ApiConfig();
    const environment = config.getEnv();
    let schema = environment.databases.postgres.schema;

    const model = sequelize.define('DelegationPower',{id:{field:"id",
type:"DataTypes.INTEGER",allowNull:false,required:true,primaryKey:true,autoIncrement:true,unique:true,comment:"Id"},company_id:{field:"company_id",type:"DataTypes.INTEGER",allowNull:false,required:true,validate:{isNumeric:true},comment:"Company Id"},agent_id:{field:"agent_id",type:"DataTypes.INTEGER",allowNull:false,required:true,validate:{isNumeric:true},comment:"Bestowed Name"},description:{field:"description",type:"DataTypes.STRING(200)",allowNull:false,required:true,validate:{min:1,max:200},comment:"Delegation Power Description"}}    ).schema(schema);

    model.associate = (models) => {
model.hasMany( models.company_id, { foreignKey: 'company_id' });model.hasMany( models.agent_id, { foreignKey: 'agent_id' });model.hasMany( models.agent_id, { foreignKey: 'agent_id' });model.hasMany( models.agent_id, { foreignKey: 'agent_id' });   
    };

    return model;

};

module.exports = Item;