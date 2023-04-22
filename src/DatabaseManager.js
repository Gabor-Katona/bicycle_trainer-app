import React from 'react';

import SQLite from 'react-native-sqlite-storage';

export default class DatabaseManager {

    constructor() {
        db = SQLite.openDatabase(
            {
                name: 'MainDB',
                location: 'default',
            },
            () => { },
            error => { console.log(error) }
        );
    }

    dropTables = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "DROP TABLE Time;"
            )
        })
        db.transaction((tx) => {
            tx.executeSql(
                "DROP TABLE Movement;"
            )
        })
        db.transaction((tx) => {
            tx.executeSql(
                "DROP TABLE Enviromental;"
            )
        })
    }

    createTables = () => {
        this.createTable1();
        this.createTable2();
        this.createTable3();
    }

    createTable1 = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS Enviromental "
                + "(Id	INTEGER NOT NULL UNIQUE, Temperature INTEGER, Humidity INTEGER, Air_quality INTEGER, Pressure REAL, "
                + "Latitude REAL, Longitude REAL, "
                + "PRIMARY KEY( Id AUTOINCREMENT));"
            )
        })
    }

    createTable2 = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS Movement "
                + "(Id	INTEGER NOT NULL UNIQUE, Gyroscope_x INTEGER, Gyroscope_y INTEGER, Gyroscope_z INTEGER, "
                + "Accelerometer_x	INTEGER, Accelerometer_y INTEGER, Accelerometer_z INTEGER, "
                + "PRIMARY KEY( Id AUTOINCREMENT));"
            )
        })
    }

    createTable3 = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS Time "
                + "(Enviromental_id	INTEGER, Movement_id INTEGER, Time TEXT, Measurement_number INTEGER, "
                + "FOREIGN KEY( Enviromental_id) REFERENCES Enviromental( Id ), "
                + "FOREIGN KEY( Movement_id) REFERENCES Movement( Id ), "
                + "PRIMARY KEY( Enviromental_id, Movement_id));"
            )
        })
    }

    setMeasurmentNumber = async (updateState) => {
        //const self = mainState;
        try {
            await db.transaction(async (tx) => {
                await tx.executeSql(
                    "SELECT MAX(Measurement_number) AS Max FROM Time;",
                    [],
                    (tx, results) => {
                        var len = results.rows.length;
                        if (len > 0) {
                            let max = results.rows.item(0).Max;
                            if (max == null) {
                                max = 0;
                            }
                            console.log("setMeasumentnum: " + (max + 1));
                            updateState({ measurementNumber: (max + 1) });
                        }
                    }
                );
            })
        } catch (error) {
            console.log(error);
        }
    }

    insertEnvData = async (data, mainState, updateState) => {
        //const self = mainState;
        if (data[0] === "E") {
            let parsed = data.slice(2).split(",");
            try {
                await db.transaction(async (tx) => {
                    await tx.executeSql(
                        "INSERT INTO Enviromental (Temperature, Humidity, Air_quality, Pressure, Latitude, "
                        + "Longitude) VALUES (?,?,?,?,?,?)",
                        [parseInt(parsed[0]), parseInt(parsed[1]), parseInt(parsed[2]), parseFloat(parsed[3]),
                        (mainState.location ? mainState.location.coords.latitude : null),
                        (mainState.location ? mainState.location.coords.longitude : null)],
                        (tx, results) => {
                            console.log(results.insertId);
                            updateState({ lastEnvId: results.insertId });
                        }
                    );
                })
            } catch (error) {
                console.log(error);
            }
        }
    }

    insertMovmentData = async (gyroData, acceloData, mainState) => {
        if (gyroData[0] === "G" && acceloData[0] === "A") {
            let gyroParsed = gyroData.slice(2).split(",");
            let acceloParsed = acceloData.slice(2).split(",");
            try {
                await db.transaction(async (tx) => {
                    await tx.executeSql(
                        "INSERT INTO Movement (Gyroscope_x, Gyroscope_y, Gyroscope_z, "
                        + "Accelerometer_x, Accelerometer_y, Accelerometer_z) VALUES (?,?,?,?,?,?)",
                        [parseInt(gyroParsed[0]), parseInt(gyroParsed[1]), parseInt(gyroParsed[2]),
                        parseInt(acceloParsed[0]), parseInt(acceloParsed[1]), parseInt(acceloParsed[2])],

                        (tx, results) => {
                            this.insertTimeData(mainState.lastEnvId, results.insertId, mainState);
                        }
                    );
                })
            } catch (error) {
                console.log(error);
            }
        }
    }

    insertTimeData = async (idEnviromental, idMovement, mainState) => {
        try {
            await db.transaction(async (tx) => {
                await tx.executeSql(
                    "INSERT INTO Time (Enviromental_id, Movement_id, Time, Measurement_number ) VALUES (?,?,"
                    + " STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW' ,'localtime'), ? )",
                    [parseInt(idEnviromental), parseInt(idMovement), mainState.measurementNumber],
                );
            })
        } catch (error) {
            console.log(error);
        }
    }
}