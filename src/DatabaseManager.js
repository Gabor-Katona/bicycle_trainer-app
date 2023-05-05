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

    getMeasurementNumbers = async (updateState) => {
        var list = [];
        try {
            await db.transaction(async (tx) => {
                await tx.executeSql(
                    "SELECT DISTINCT Measurement_number FROM Time;",
                    [],
                    (tx, results) => {
                        var len = results.rows.length;

                        if (len != 0) {
                            for (let i = 0; i < len; i++) {
                                //console.log(results.rows.item(i).Measurement_number);
                                list.push(results.rows.item(i).Measurement_number.toString());
                            }
                        }
                        console.log(list);
                        updateState({ measurementNum: list });
                    }
                );
            })
        } catch (error) {
            console.log(error);
        }
    }

    getAltitude = (temperature, pressure) => {
        var altitude = (8.31432 * (parseInt(temperature) + 273.15) * Math.log(pressure / 1013.25)) / - (9.80665 * 0.0289644);
        //altitude = altitude.toFixed(2);
        altitude = Math.round(altitude * 100) / 100
        return altitude;
    }

    getTimeDiff = (date1, date2) => {
        var prevDate = new Date(date1)
        var prevSeconds = prevDate.getTime() / 1000;
        var currDate = new Date(date2);
        var currSeconds = currDate.getTime() / 1000;
        return currSeconds - prevSeconds
    }

    getVelocity = (currentVelocity, acceleration, date1, date2) => {
        var time = this.getTimeDiff(date1, date2)
        return currentVelocity + (acceleration * time);
    }

    getEvenlySpacedElements = (numberList) => {
        const length = numberList.length;
        var result = [];
        if (length > 10) {
            const interval = Math.floor(length / 9);
            for (let i = 0; i < length; i += interval) {
                result.push(numberList[i].split(" ")[1]);
                if (result.length === 10) {
                    break;
                }
            }
        }
        else {
            for (let i = 0; i < length; i += 1) {
                result.push(numberList[i].split(" ")[1]);
            }
        }
        return result;
    }

    getMeasurementByNumber = async (updateState, number) => {
        var list = [];
        try {
            await db.transaction(async (tx) => {
                // TODO Measurement_number not only 1
                await tx.executeSql(
                    "SELECT Time, Temperature, Humidity, Pressure, Latitude, Longitude, Gyroscope_x, Gyroscope_y, Gyroscope_z, "
                    + "Accelerometer_x, Accelerometer_y, Accelerometer_z "
                    + "FROM time INNER JOIN enviromental ON enviromental.Id = time.enviromental_id INNER JOIN movement ON movement.id = time.movement_id WHERE time.Measurement_number = (?);",
                    [number],
                    (tx, results) => {
                        var len = results.rows.length;
                        var temperatureL = [];
                        var humidityL = [];
                        var pressureL = [];
                        //var gyroXL = [];
                        //var gyroYL = [];
                        //var gyroZL = [];
                        //var accelXL = [];
                        var accelYL = [];
                        //var accelZL = [];
                        var dateL = [];
                        var gpsL = [];

                        if (len != 0) {
                            for (let i = 0; i < len; i++) {
                                temperatureL.push(results.rows.item(i).Temperature / 10);
                                humidityL.push(results.rows.item(i).Humidity);
                                pressureL.push(results.rows.item(i).Pressure);
                                //gyroXL.push(results.rows.item(i).Gyroscope_x / 10);
                                //gyroYL.push(results.rows.item(i).Gyroscope_y / 10);
                                //gyroZL.push(results.rows.item(i).Gyroscope_z / 10);
                                //accelXL.push(results.rows.item(i).Accelerometer_x / 100);
                                accelYL.push(results.rows.item(i).Accelerometer_y / 100);
                                //accelZL.push(results.rows.item(i).Accelerometer_z / 100);
                                dateL.push(results.rows.item(i).Time);
                                //dateL.push(results.rows.item(i).Time.split(" ")[1]);
                                if (results.rows.item(i).Latitude != null) {
                                    gpsL.push([results.rows.item(i).Latitude, results.rows.item(i).Longitude]);
                                }
                                //TODO gps
                            }

                            let altitudeL = []
                            for (var i = 0; i < len; i++) {
                                let alt = this.getAltitude(temperatureL[i], pressureL[i]);
                                altitudeL.push(alt);
                            }

                            var velocity = [0]
                            var currVelY = 0
                            for (var i = 1; i < len; i++) {
                                var velY = this.getVelocity(currVelY, accelYL[i], dateL[i - 1], dateL[i])
                                currVelY = velY
                                velY *= 3.6
                                //velY = velY.toFixed(2)
                                velY = Math.round(velY * 100) / 100
                                velocity.push(velY)
                            }

                            var times = this.getEvenlySpacedElements(dateL);

                            updateState({ temperature: temperatureL });
                            updateState({ humidity: humidityL });
                            updateState({ pressure: pressureL });
                            //updateState({ gyroX: gyroXL });
                            //updateState({ gyroY: gyroYL });
                            //updateState({ gyroZ: gyroZL });
                            //updateState({ accelX: accelXL });
                            updateState({ accelY: accelYL });
                            //updateState({ accelZ: accelZL });
                            updateState({ date: times });
                            updateState({ gps: gpsL });
                            updateState({ day: results.rows.item(0).Time.split(" ")[0] });
                            updateState({ altitude: altitudeL });
                            updateState({ speed: velocity });

                            updateState({waitData: false });
                            updateState({showData: true });
                        }

                    }
                );
            })
        } catch (error) {
            console.log(error);
        }

    }
}