'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SalesReport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SalesReport.init({
    order_id: DataTypes.INTEGER,
    report_date: DataTypes.DATE,
    total_amount: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'SalesReport',
  });
  return SalesReport;
};