import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    UserID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    UserName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    PhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmergencyNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    DoctorID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Doctors", // name of the Doctors table
        key: "DoctorID",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    Age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Users",
    timestamps: false,
  }
);

export default User;
