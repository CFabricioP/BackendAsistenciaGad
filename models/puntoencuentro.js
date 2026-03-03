import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class PuntoEncuentro extends Model {}
  PuntoEncuentro.init({
    nombre: DataTypes.STRING,
    latitud: DataTypes.STRING,
    longitud: DataTypes.STRING,
    radio: { type: DataTypes.INTEGER, defaultValue: 10 },
  }, { sequelize, modelName: 'PuntoEncuentro', tableName: 'puntos_encuentro' });
  return PuntoEncuentro;
};
